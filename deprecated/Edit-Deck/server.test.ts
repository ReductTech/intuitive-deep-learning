import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';

test('local workspace protects credentials, forwards models and persists drafts', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'edit-deck-test-'));
  process.env.EDIT_DECK_CONFIG = path.join(directory, 'interfaces.json');
  const modulePath = './server.ts';
  const { editDeckPlugin, endpoint, providerJson } = await import(modulePath);
  const calls: { route: string; auth: string | undefined; body: string }[] = [];
  const mock = createHttpServer(async (request, response) => {
    let body = ''; for await (const chunk of request) body += chunk;
    calls.push({ route: request.url || '', auth: request.headers.authorization, body });
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(request.url?.includes('images/') ? { data: [{ b64_json: 'aW1hZ2U=' }] } : { choices: [{ message: { content: 'export default function Slide(){return <h1>课件</h1>}' } }] }));
  });
  await new Promise<void>(resolve => mock.listen(0, '127.0.0.1', resolve));
  const address = mock.address(); assert.ok(address && typeof address !== 'string');
  const vite = await createServer({ configFile: false, cacheDir: path.join(directory, 'cache'), optimizeDeps: { noDiscovery: true, include: [] }, plugins: [editDeckPlugin()], server: { host: '127.0.0.1', port: 0 } });
  await vite.listen();
  const viteAddress = vite.httpServer!.address(); assert.ok(viteAddress && typeof viteAddress !== 'string');
  const base = `http://127.0.0.1:${viteAddress.port}/__edit-deck`;
  try {
    const { token } = await fetch(base + '/session').then(response => response.json());
    const headers = { 'X-Edit-Deck-Token': token, 'Content-Type': 'application/json' };
    assert.equal((await fetch(base + '/config')).status, 403);
    assert.equal((await fetch(base + '/config', { headers: { ...headers, Origin: 'https://untrusted.example' } })).status, 403);
    const item = { baseUrl: `http://127.0.0.1:${address.port}/v1`, model: 'test-model', apiKey: 'test-secret-not-real' };
    const saved = await fetch(base + '/config', { method: 'PUT', headers, body: JSON.stringify({ llm: item, image: item }) }).then(response => response.json());
    assert.equal(saved.llm.configured, true); assert.equal(saved.llm.apiKey, undefined); assert.ok(!JSON.stringify(saved).includes(item.apiKey));
    await fetch(base + '/config', { method: 'PUT', headers, body: JSON.stringify({ llm: { ...item, apiKey: '' }, image: { ...item, apiKey: '' } }) });
    assert.equal(JSON.parse(await readFile(process.env.EDIT_DECK_CONFIG!, 'utf8')).llm.apiKey, item.apiKey);
    const llm = await fetch(base + '/llm', { method: 'POST', headers, body: JSON.stringify({ messages: [{ role: 'user', content: '创建一页' }] }) }).then(response => response.json());
    assert.match(llm.text, /export default/);
    const image = await fetch(base + '/image', { method: 'POST', headers, body: JSON.stringify({ prompt: '测试图片' }) }).then(response => response.json());
    assert.equal(image.image, 'data:image/png;base64,aW1hZ2U=');
    await fetch(base + '/image', { method: 'POST', headers, body: JSON.stringify({ prompt: '调整图片', image: image.image }) });
    assert.deepEqual(calls.map(call => call.route), ['/v1/chat/completions', '/v1/images/generations', '/v1/images/edits']);
    assert.ok(calls.every(call => call.auth === `Bearer ${item.apiKey}`));
    assert.deepEqual(JSON.parse(calls[2].body).images, [image.image]);
    assert.equal(JSON.parse(calls[1].body).response_format, 'b64_json');
    await fetch(base + '/image', { method: 'POST', headers, body: JSON.stringify({ prompt: '多图编辑', images: [image.image, image.image] }) });
    assert.equal(JSON.parse(calls[3].body).images.length, 2);
    const project = { id: 'test', title: '测试课件', slides: [{ id: 'page', title: '一页', prompt: '测试' }], updatedAt: new Date().toISOString() };
    await fetch(base + '/project', { method: 'PUT', headers, body: JSON.stringify(project) });
    assert.deepEqual(await fetch(base + '/project', { headers }).then(response => response.json()), project);
    const invalid = await fetch(base + '/config', { method: 'PUT', headers, body: JSON.stringify({ llm: { ...item, baseUrl: 'file:///private' }, image: item }) });
    assert.equal(invalid.status, 400);
    assert.throws(() => endpoint('https://provider.example/v1?key=secret', 'chat/completions'));
    assert.equal(endpoint('https://provider.example/v1/', 'chat/completions'), 'https://provider.example/v1/chat/completions');
    assert.equal(endpoint('https://provider.example', 'images/generations'), 'https://provider.example/v1/images/generations');
    assert.equal(endpoint('https://provider.example/v1/images/edits', 'images/generations'), 'https://provider.example/v1/images/generations');
    await assert.rejects(providerJson(new Response('<!doctype html><html></html>', { headers: { 'Content-Type': 'text/html' } }), '生图接口'), /HTML.*\/v1/);
    await assert.rejects(providerJson(Response.json({ error: { message: 'unknown model' } }, { status: 400 }), '生图接口'), /unknown model/);
  } finally {
    await vite.close(); await new Promise<void>(resolve => mock.close(() => resolve()));
    assert.ok(path.resolve(directory).startsWith(path.resolve(os.tmpdir(), 'edit-deck-test-')));
    await rm(directory, { recursive: true, force: true });
  }
});

test('client renews a restarted localhost session without losing a pending save', async () => {
  const original = globalThis.fetch;
  const clientPath = './api.ts';
  const { request } = await import(clientPath);
  const calls: { url: string; body: string | undefined }[] = [];
  let sessions = 0, saves = 0;
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url, body: init?.body as string | undefined });
    if (url.endsWith('/session')) return Response.json({ token: `token-${++sessions}` });
    if (++saves === 1) return Response.json({ error: 'expired' }, { status: 403 });
    assert.equal((init!.headers as Record<string, string>)['X-Edit-Deck-Token'], 'token-2');
    return Response.json({ saved: true });
  }) as typeof fetch;
  try {
    assert.deepEqual(await request('/project', 'PUT', { title: '保留草稿' }), { saved: true });
    assert.equal(sessions, 2);
    assert.equal(calls[1].body, calls[3].body);
  } finally { globalThis.fetch = original; }
});
