import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { Plugin } from 'vite';
import { build } from 'esbuild';
import type { InterfaceConfig, EndpointConfig, Project } from './types';
import { createSourceTextEditor } from './sourceText.ts';

export const configPath = process.env.EDIT_DECK_CONFIG || path.join(os.homedir(), '.edit-deck', 'interfaces.json');
const draftPath = path.join(path.dirname(configPath), 'projects');
const defaults: InterfaceConfig = {
  llm: { baseUrl: '', apiKey: '', model: '' },
  image: { baseUrl: '', apiKey: '', model: '' },
};
export async function readConfig() {
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  try { await fs.writeFile(configPath, JSON.stringify(defaults, null, 2) + '\n', { flag: 'wx', mode: 0o600 }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
  const contents = (await fs.readFile(configPath, 'utf8')).replace(/^\uFEFF/, '');
  let config: InterfaceConfig;
  try { config = JSON.parse(contents); } catch { throw new Error('接口配置文件不是有效 JSON，请检查 interfaces.json'); }
  if (!config || typeof config !== 'object') throw new Error('接口配置文件格式不正确');
  for (const kind of ['llm', 'image'] as const) {
    if (!config[kind] || typeof config[kind].baseUrl !== 'string' || typeof config[kind].apiKey !== 'string' || typeof config[kind].model !== 'string') throw new Error('接口配置文件格式不正确');
  }
  return config;
}
export function publicConfig(config: InterfaceConfig) {
  const hide = (item: EndpointConfig) => ({ baseUrl: item.baseUrl, model: item.model, configured: Boolean(item.baseUrl && item.apiKey && item.model) });
  return { path: configPath, llm: hide(config.llm), image: hide(config.image) };
}
export function endpoint(base: string, suffix: string) {
  const url = new URL(base.trim());
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('Base URL 必须是 http(s) 接口根地址');
  url.pathname = url.pathname.replace(/\/+$/, '').replace(/\/(?:chat\/completions|images\/(?:generations|edits))$/, '') || '/v1';
  return url.toString().replace(/\/+$/, '') + (suffix ? '/' + suffix : '');
}
export async function providerJson(response: Response, label: string) {
  const content = (await response.text()).replace(/^\uFEFF/, '').trim();
  if (/^\s*</.test(content) || response.headers.get('content-type')?.includes('text/html')) {
    throw new Error(`${label}返回了 HTML 网页（HTTP ${response.status}），请检查 Base URL 是否指向 API（通常以 /v1 结尾）`);
  }
  let result;
  try { result = JSON.parse(content); } catch { throw new Error(`${label}没有返回有效 JSON（HTTP ${response.status}），请检查接口地址或稍后重试`); }
  if (!response.ok || result?.error) {
    const detail = result?.error?.message || result?.message || (typeof result?.error === 'string' ? result.error : '请检查模型名称、接口权限和额度');
    throw new Error(`${label}失败（HTTP ${response.status}）：${String(detail).slice(0, 400)}`);
  }
  return result;
}
async function body(request: IncomingMessage) {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk); size += buffer.length;
    if (size > 45 * 1024 * 1024) throw new Error('请求超过 45 MB，请缩小图片或拆分课件');
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString() || '{}');
}
async function provider(item: EndpointConfig, suffix: string, payload: unknown, signal: AbortSignal) {
  if (!item.apiKey || !item.baseUrl || !item.model) throw new Error('请先配置 Base URL、API Key 和模型名称');
  const response = await fetch(endpoint(item.baseUrl, suffix), {
    method: 'POST', signal, headers: { Authorization: `Bearer ${item.apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  return providerJson(response, suffix.startsWith('images/') ? '生图接口' : 'LLM 接口');
}
export function editDeckPlugin(): Plugin {
  const sourceText = createSourceTextEditor(process.cwd());
  let development = false;
  const virtual = 'virtual:edit-deck-react-runtime';
  let runtime: Promise<string> | undefined;
  let saving = Promise.resolve();
  return {
    name: 'edit-deck-local-workspace',
    enforce: 'pre',
    configResolved(config) { development = config.command === 'serve'; },
    transform(source, id) { return development ? sourceText.transform(source, id) : null; },
    resolveId(id) { if (id === virtual) return '\0' + virtual; },
    async load(id) {
      if (id !== '\0' + virtual) return;
      runtime ??= build({ stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; globalThis.DeckReact=React;globalThis.DeckCreateRoot=createRoot;`, resolveDir: process.cwd() }, bundle: true, write: false, minify: true, platform: 'browser', format: 'iife', define: { 'process.env.NODE_ENV': '"production"' } }).then(result => result.outputFiles[0].text);
      return `export default ${JSON.stringify(await runtime)};`;
    },
    async configureServer(server) {
      await readConfig();
      // Local-only capability token: prevents unrelated websites from invoking the key proxy.
      const token = crypto.randomBytes(32).toString('hex');
      server.middlewares.use('/__edit-deck', async (request, response) => {
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Cache-Control', 'no-store');
        const send = (value: unknown, status = 200) => { response.statusCode = status; response.end(JSON.stringify(value)); };
        const host = request.headers.host || '';
        const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress || '');
        if (!local || !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) return send({ error: 'Edit Deck 的本机接口只允许 localhost 访问' }, 403);
        if (request.headers.origin && request.headers.origin !== `http://${host}` && request.headers.origin !== `https://${host}`) return send({ error: '拒绝跨站请求' }, 403);
        const route = request.url?.split('?')[0];
        if (route === '/session' && request.method === 'GET') return send({ token });
        if (request.headers['x-edit-deck-token'] !== token) return send({ error: '本机会话已过期，请刷新页面' }, 403);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 240_000);
        response.on('close', () => { if (!response.writableEnded) controller.abort(); });
        let config: InterfaceConfig | undefined;
        try {
          if (route === '/source-text' && request.method === 'POST') {
            const input = await body(request);
            return send(await sourceText.save(input.id, input.text));
          }
          config = await readConfig();
          if (route === '/config' && request.method === 'GET') return send(publicConfig(config));
          if (route === '/config' && request.method === 'PUT') {
            const update = await body(request);
            for (const kind of ['llm', 'image'] as const) {
              const value = update[kind];
              if (!value || typeof value.baseUrl !== 'string' || typeof value.model !== 'string') throw new Error('缺少接口配置');
              const baseUrl = value.baseUrl.trim() ? endpoint(value.baseUrl, '') : '';
              config[kind] = { baseUrl, model: value.model.trim(), apiKey: value.clearKey === true ? '' : typeof value.apiKey === 'string' && value.apiKey.trim() ? value.apiKey.trim() : config[kind].apiKey };
            }
            await fs.writeFile(configPath, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 });
            return send(publicConfig(config));
          }
          if (route === '/image' && request.method === 'POST') {
            const input = await body(request);
            if (typeof input.prompt !== 'string' || !input.prompt.trim()) throw new Error('请输入画面描述');
            let result;
            const images: unknown = input.images ?? (input.image ? [input.image] : []);
            if (!Array.isArray(images) || images.length > 8 || images.some(image => typeof image !== 'string' || !/^data:image\/(png|jpeg|webp);base64,/.test(image))) throw new Error('最多支持 8 张 PNG、JPEG 或 WebP 参考图');
            result = await provider(config.image, images.length ? 'images/edits' : 'images/generations', {
              model: config.image.model, prompt: input.prompt, n: 1, size: '1536x1024', response_format: 'b64_json', output_format: 'png',
              ...(images.length ? { images } : {}),
            }, controller.signal);
            const item = result.data?.[0];
            if (item?.b64_json) return send({ image: `data:image/png;base64,${item.b64_json}` });
            if (typeof item?.url !== 'string') throw new Error('生图接口没有返回 data[0].url 或 b64_json');
            const url = new URL(item.url);
            if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('图片地址格式不正确');
            const image = await fetch(url, { signal: controller.signal });
            if (!image.ok) throw new Error(`图片下载失败 HTTP ${image.status}`);
            const mime = image.headers.get('content-type')?.split(';')[0] || '';
            if (!/^image\/(png|jpeg|webp|gif)$/.test(mime)) throw new Error('生图结果必须是 PNG、JPEG、WebP 或 GIF');
            const bytes = await image.arrayBuffer();
            if (bytes.byteLength > 25 * 1024 * 1024) throw new Error('生成图片超过 25 MB');
            return send({ image: `data:${mime};base64,${Buffer.from(bytes).toString('base64')}` });
          }
          if (route === '/llm' && request.method === 'POST') {
            const input = await body(request);
            if (!Array.isArray(input.messages) || input.messages.length > 12) throw new Error('无效的模型请求');
            const result = await provider(config.llm, 'chat/completions', { model: config.llm.model, messages: input.messages, stream: false }, controller.signal);
            const content = result.choices?.[0]?.message?.content;
            const text = typeof content === 'string' ? content : Array.isArray(content) ? content.map((part: { text?: string }) => part.text || '').join('') : '';
            if (!text) throw new Error('模型没有返回内容，请使用支持图像输入的 Chat Completions 模型');
            return send({ text });
          }
          if (route === '/project' && request.method === 'GET') {
            await fs.mkdir(draftPath, { recursive: true });
            try { return send(JSON.parse(await fs.readFile(path.join(draftPath, 'current.json'), 'utf8'))); }
            catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return send(null); throw error; }
          }
          if (route === '/project' && request.method === 'PUT') {
            const project = await body(request) as Project;
            if (typeof project.title !== 'string' || !Array.isArray(project.slides) || project.slides.length > 100) throw new Error('无效的课件文件');
            saving = saving.catch(() => {}).then(async () => {
              await fs.mkdir(draftPath, { recursive: true });
              const temp = path.join(draftPath, `current-${crypto.randomUUID()}.tmp`);
              await fs.writeFile(temp, JSON.stringify(project), { mode: 0o600 });
              await fs.rename(temp, path.join(draftPath, 'current.json'));
            });
            await saving;
            return send({ saved: true });
          }
          send({ error: '接口不存在' }, 404);
        } catch (error) {
          send({ error: error instanceof Error ? error.message.replaceAll(config?.llm.apiKey || '\0', '[redacted]').replaceAll(config?.image.apiKey || '\0', '[redacted]') : '操作失败' }, 400);
        } finally { clearTimeout(timer); }
      });
    },
  };
}
