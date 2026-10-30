import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createSourceTextEditor } from './sourceText.ts';

test('writes literal text to TSX safely, survives reinstrumentation and rejects stale saves', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cw-source-text-'));
  try {
    const directory = path.join(root, 'modules', 'Example'); await mkdir(directory, { recursive: true });
    const filename = path.join(directory, 'Page.tsx');
    const source = 'export function Page(){return <ContentBlock title="原标题"><Typography>原正文</Typography><svg><text>不修改公式</text></svg></ContentBlock>}';
    await writeFile(filename, source);
    const editor = createSourceTextEditor(root), result = editor.transform(source, filename)!;
    const ids = [...result.code.matchAll(/data-cw-source-text="([a-f0-9]+)"/g)].map(match => match[1]);
    assert.equal(ids.length, 2);
    const text = '新标题 <test> {value} "引号" & 内容';
    await editor.save(ids[0], text);
    const changed = await readFile(filename, 'utf8');
    assert.ok(changed.includes(`title={${JSON.stringify(text)}}`));
    assert.ok(changed.includes('<Typography>原正文</Typography>'));
    await assert.rejects(editor.save(ids[1], '不能覆盖旧版本'), /源码已被其他操作修改/);
    const next = editor.transform(changed, filename)!;
    assert.equal([...next.code.matchAll(/data-cw-source-text=/g)].length, 2);
    const bodyId = [...next.code.matchAll(/data-cw-source-text="([a-f0-9]+)"/g)][1][1];
    await editor.save(bodyId, '新正文\n第二行');
    assert.ok((await readFile(filename, 'utf8')).includes(`{${JSON.stringify('新正文\n第二行')}}`));
    assert.equal(editor.transform(source, path.join(root, 'modules', 'shared', 'Page.tsx')), null);
    await assert.rejects(editor.save('unknown', 'text'), /文字位置已更新/);
  } finally { assert.ok(path.resolve(root).startsWith(path.join(os.tmpdir(), 'cw-source-text-'))); await rm(root, { recursive: true, force: true }); }
});
