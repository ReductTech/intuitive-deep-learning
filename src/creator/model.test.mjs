import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProject, isProject, simulateRevision, snapshot, primaryActionFor, preserveExistingWebPages, applyPageOutline } from './model.ts';
import { isDesignImage } from './designImages.ts';

const course = { id: 'test-course', title: '测试课程', pages: [{ id: 'first', goal: '理解神经元', summary: '观察复杂行为' }], pptDeck: { scenes: [{ id: 'first', title: '只有 302 个神经元，它为什么能完成这么多行为？' }] } };
test('course copies preserve native identity and survive serialization', () => {
  const project = createProject(course);
  assert.equal(project.pages[0].nativeId, 'first');
  assert.equal(project.pages[0].goal, '理解神经元');
  assert.ok(isProject(JSON.parse(JSON.stringify(project)), course.id));
});
test('simulated revision keeps original intact and requires design approval', () => {
  const original = createProject(course).pages[0];
  const revised = simulateRevision(original, '标题缩短一些');
  assert.equal(original.ready, true);
  assert.equal(original.revisions.length, 0);
  assert.equal(revised.title, '302 个神经元，如何产生复杂行为？');
  assert.equal(revised.ready, true);
  assert.equal(revised.designed, true);
  assert.equal(revised.revisions[0].title, original.title);
  assert.equal(revised.messages.length, 2);
});
test('saved projects reject wrong courses, duplicate ids and malformed history', () => {
  const project = createProject(course);
  assert.equal(isProject(project, 'another-course'), false);
  assert.equal(isProject({ ...project, pages: [...project.pages, ...project.pages] }, course.id), false);
  assert.equal(isProject({ ...project, pages: [null] }, course.id), false);
  assert.equal(isProject({ ...project, pages: [{ ...project.pages[0], revisions: [null] }] }, course.id), false);
});
test('design assets remain attached to saved revisions and simulated chat never regenerates images', () => {
  const project = createProject(course);
  const page = { ...project.pages[0], designImageId: 'saved-image-id', designed: true, ready: false };
  assert.equal(snapshot(page).designImageId, 'saved-image-id');
  const revised = simulateRevision(page, '修改图片布局');
  assert.equal(revised.designImageId, 'saved-image-id');
  assert.equal(revised.revisions[0].designImageId, 'saved-image-id');
  assert.match(revised.messages.at(-1).text, /图片调整请切换/);
  assert.ok(isProject({ ...project, pages: [revised] }, course.id));
  assert.equal(isProject({ ...project, pages: [{ ...page, designImageId: { url: 'unexpected' } }] }, course.id), false);
});
test('design image backups only accept embedded raster images', () => {
  assert.ok(isDesignImage('data:image/png;base64,aW1hZ2U='));
  assert.equal(isDesignImage('https://example.com/image.png'), false);
  assert.equal(isDesignImage('data:image/svg+xml;base64,aW1hZ2U='), false);
  assert.equal(isDesignImage('data:image/png;base64,<script>'), false);
});
test('one primary action follows the visible page without extra stage selection', () => {
  const page = createProject(course).pages[0];
  assert.equal(primaryActionFor(page, 'web', '').kind, 'preview');
  assert.equal(primaryActionFor(page, 'web', '缩短标题').kind, 'edit');
  const blank = { ...page, nativeId: undefined, ready: false, designed: false };
  assert.equal(primaryActionFor(blank, 'design', '').label, '生成设计图');
  const design = { ...blank, designImageId: 'image', designed: true };
  assert.equal(primaryActionFor(design, 'design', '').kind, 'build');
  assert.equal(primaryActionFor(design, 'design', '减少文字').label, '修改设计图');
  const built = { ...design, ready: true };
  assert.equal(primaryActionFor(built, 'web', '').kind, 'preview');
  assert.equal(primaryActionFor(built, 'web', '增加交互').kind, 'edit');
  assert.equal(primaryActionFor(built, 'design', '调整配色').kind, 'image');
});
test('legacy image drafts keep their images while restoring the original webpage', () => {
  const project = createProject(course);
  const damaged = { ...project.pages[0], ready: false, designed: true, designImageId: 'keep-image', revisions: [snapshot(project.pages[0])] };
  const repaired = preserveExistingWebPages({ ...project, pages: [damaged] });
  assert.equal(repaired.pages[0].ready, true);
  assert.equal(repaired.pages[0].nativeId, 'first');
  assert.equal(repaired.pages[0].designImageId, 'keep-image');
  assert.deepEqual(repaired.pages[0].revisions, damaged.revisions);
  assert.equal(damaged.ready, false);
  assert.equal(primaryActionFor(repaired.pages[0], 'web', '').kind, 'preview');
});
test('outline properties hydrate old drafts and persist independently of the original webpage', () => {
  const metadata = { ...course.pages[0], interaction: '选择一个答案', next: '进入下一页', snippet: '原讲稿', sources: [{ title: '资料', url: 'https://example.com' }] };
  const module = { ...course, pages: [metadata] };
  const legacy = createProject(course);
  delete legacy.pages[0].outline;
  const hydrated = preserveExistingWebPages(legacy, module);
  assert.equal(hydrated.pages[0].outline.interaction, '选择一个答案');
  const changed = applyPageOutline(hydrated.pages[0], { ...hydrated.pages[0].outline, title: '新标题', goal: '新的教学目标', snippet: '新讲稿', id: 'cannot-replace-runtime-id' });
  assert.equal(changed.id, 'first');
  assert.equal(changed.outline.id, 'first');
  assert.equal(changed.nativeId, 'first');
  assert.equal(changed.ready, true);
  assert.equal(changed.title, '新标题');
  assert.equal(changed.outline.snippet, '新讲稿');
  assert.deepEqual(changed.outline.sources, metadata.sources);
  assert.equal(changed.revisions.at(-1).outline.snippet, '原讲稿');
  assert.ok(isProject(JSON.parse(JSON.stringify({ ...hydrated, pages: [changed] })), course.id));
  assert.equal(isProject({ ...hydrated, pages: [{ ...changed, outline: [] }] }, course.id), false);
});

