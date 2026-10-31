import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';

async function loadSource(file, transform = source => source) {
  const source = transform(await fs.readFile(new URL(file, import.meta.url), 'utf8'));
  const {outputText} = ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext}});
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
}
const {errorReport} = await loadSource('../src/app/errorReport.ts');

test('distinguishes missing pages, permission failures and retryable server errors while preserving the cause', () => {
  for (const status of [400,401,403,404,410,429,500,502,503,504,418]) {
    const report = errorReport({status, message: '具体失败原因：课程版本已移除'});
    assert.equal(report.code, String(status));
    assert.equal(report.reason, '具体失败原因：课程版本已移除');
    assert.equal(report.retryable, status === 429 || status >= 500);
    assert.ok(report.title);
  }
});

test('network and runtime exceptions are not misreported as HTTP 500', () => {
  assert.equal(errorReport(new TypeError('Failed to fetch')).code, '离线');
  const runtime = errorReport(new Error('组件初始化失败'));
  assert.equal(runtime.code, '异常');
  assert.equal(runtime.reason, '组件初始化失败');
  assert.equal(errorReport(undefined, 404).code, '404');
  assert.ok(errorReport(undefined, 404).reason);
});

const client = await loadSource('../src/shuku/client.ts', source => source.replace(/import \{isGuestMode,setGuestMode,requestSignIn\} from '\.\/guest';/, 'const isGuestMode=()=>true, setGuestMode=()=>{}, requestSignIn=()=>{};'));

test('API failures retain status and specific reasons for JSON, plain text and HTML gateway responses', async () => {
  const original = globalThis.fetch;
  try {
    for (const [status, body, expected] of [
      [404, JSON.stringify({error:'课程版本不存在'}), '课程版本不存在'],
      [500, JSON.stringify({message:'课程文件读取失败'}), '课程文件读取失败'],
      [503, '服务正在维护', '服务正在维护'],
      [502, '<html><body>Bad Gateway</body></html>', 'HTTP 502'],
      [504, '', 'HTTP 504'],
    ]) {
      globalThis.fetch = async () => new Response(body, {status});
      await assert.rejects(client.api('/public/courses'), error => {
        assert.ok(error instanceof client.ApiError);
        assert.equal(error.status, status);
        assert.ok(error.message.includes(expected));
        assert.equal(errorReport(error).code, String(status));
        return true;
      });
    }
    globalThis.fetch = async () => new Response(JSON.stringify({courses:[]}), {status:200});
    assert.deepEqual(await client.api('/public/courses'), {courses:[]});
    globalThis.fetch = async () => {throw new TypeError('Failed to fetch');};
    await assert.rejects(client.api('/public/courses'), error => errorReport(error).code === '离线');
  } finally {globalThis.fetch = original;}
});
