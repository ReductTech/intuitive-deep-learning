import type { ActiveModule } from '../app/modules';

export interface Revision { title: string; goal: string; summary: string; designed: boolean; ready: boolean; note: string; designImageId?: string; outline?: Record<string, unknown> }
export interface CreatorPage extends Revision { format?: 'text'|'react'; sourceEntry?: string; id: string; nativeId?: string; revisions: Revision[]; messages: { role: 'user' | 'assistant'; text: string }[] }
export interface CreatorProject {
  repositoryName?:string; authoringVersion?:string; authoringModule?:string; sourceGuideEntry?:string;
  outlineDraftMarkdown?: string; nativeSnapshot?:string; version: 1; id: string; courseId: string; title: string; duration: number; style: string; outlineConfirmed: boolean; presentation?:{filename:string;slideCount:number;warnings:string[]}; source?: {files:Record<string,string>}; sourceSceneIds?: string[]; pages: CreatorPage[] }
// Reconcile saved native pages with the live deck; removed pages must not become mock slides.
export function preserveExistingWebPages(project: CreatorProject, module?: ActiveModule): CreatorProject {
  const sceneIds = module?.pptDeck && project.courseId === module.id
    ? new Set(module.pptDeck.scenes.map(scene => scene.id)) : undefined;
  const retained = project.pages.filter(page => !sceneIds || !page.nativeId || sceneIds.has(page.nativeId));
  const pages = retained.map(page => {
    const outline = page.outline ?? module?.pages.find(item => item.id === (page.nativeId ?? page.id));
    return { ...page, ready: page.nativeId ? true : page.ready, outline: outline ? { ...outline, id: page.id } : undefined };
  });
  if (!module?.pptDeck || project.courseId !== module.id) return { ...project, pages };
  const currentIds = module.pptDeck.scenes.map(scene => scene.id);
  // Legacy Creator-Guide projects were created before the four Shuku pages existed.
  // Other legacy projects have no reliable baseline, so leave their page choices intact.
  const legacyShukuIds = ['shuku-why', 'shuku-participation', 'shuku-review', 'shuku-growth'];
  const knownIds = project.sourceSceneIds ?? (module.id === 'creator-guide'
    ? currentIds.filter(id => !legacyShukuIds.includes(id)) : currentIds);
  const existingIds = new Set(pages.map(page => page.nativeId ?? page.id));
  const hasNativePages = pages.some(page => page.nativeId);
  const additions = hasNativePages ? createProject(module).pages.filter(page =>
    !knownIds.includes(page.nativeId!) && !existingIds.has(page.nativeId!)) : [];
  return { ...project, sourceSceneIds: currentIds,
    pages: pages.length ? [...pages, ...additions] : createProject(module).pages };

}
export function applyPageOutline(page: CreatorPage, outline: Record<string, unknown>): CreatorPage {
  return { ...page, title: String(outline.title ?? page.title), goal: String(outline.goal ?? ''), summary: String(outline.summary ?? ''), outline: { ...outline, id: page.id }, revisions: [...page.revisions, snapshot(page)] };
}
export function primaryActionFor(page: CreatorPage, view: 'design' | 'web', instruction: string): { kind: 'image' | 'edit' | 'build' | 'preview'; label: string } {
  if (instruction.trim()) {
    if (page.designImageId && view === 'design') return { kind: 'image', label: '修改设计图' };
    if (!page.ready) return { kind: 'image', label: '生成设计图' };
    return { kind: 'edit', label: '修改页面（模拟）' };
  }
  if (!page.ready) return page.designImageId || page.designed ? { kind: 'build', label: '制作网页（模拟）' } : { kind: 'image', label: '生成设计图' };
  return { kind: 'preview', label: '预览本页' };
}
export const snapshot = ({ title, goal, summary, designed, ready, note, designImageId, outline }: Revision): Revision => ({ title, goal, summary, designed, ready, note, designImageId, outline });
export function createProject(module: ActiveModule): CreatorProject {
  return { version: 1, id: crypto.randomUUID(), courseId: module.id, title: module.title, duration: 30, style: '简洁教学', outlineConfirmed: true, sourceSceneIds: module.pptDeck!.scenes.map(scene => scene.id),
    pages: module.pptDeck!.scenes.map(scene => { const outline = module.pages.find(page => page.id === scene.id);
      return { id: scene.id, nativeId: scene.id, title: scene.title, goal: outline?.goal ?? '理解本页的核心概念。', summary: outline?.summary ?? scene.title, outline: outline ? { ...outline } : undefined, designed: false, ready: true, note: '', revisions: [], messages: [] }; }) };
}
export function isProject(value: unknown, courseId: string): value is CreatorProject {
  if (!value || typeof value !== 'object') return false;
  const p = value as CreatorProject;
  return p.version === 1 && p.courseId === courseId && typeof p.title === 'string' && Number.isFinite(p.duration) && typeof p.style === 'string' && typeof p.outlineConfirmed === 'boolean'
    && (p.sourceSceneIds === undefined || (Array.isArray(p.sourceSceneIds) && p.sourceSceneIds.every(id => typeof id === 'string')))
    && Array.isArray(p.pages) && p.pages.length > 0 && p.pages.length <= 100 && p.pages.every(page => page && typeof page === 'object') && new Set(p.pages.map(page => page.id)).size === p.pages.length
    && p.pages.every(page => validOutline(page.outline) && typeof page.id === 'string' && typeof page.title === 'string' && typeof page.goal === 'string' && typeof page.summary === 'string'
      && typeof page.designed === 'boolean' && typeof page.ready === 'boolean' && typeof page.note === 'string' && (page.designImageId === undefined || typeof page.designImageId === 'string') && Array.isArray(page.revisions) && Array.isArray(page.messages)
      && page.revisions.every(r => r && validOutline(r.outline) && typeof r.title === 'string' && typeof r.goal === 'string' && typeof r.summary === 'string' && typeof r.designed === 'boolean' && typeof r.ready === 'boolean' && typeof r.note === 'string' && (r.designImageId === undefined || typeof r.designImageId === 'string'))
      && page.messages.every(m => m && ['user', 'assistant'].includes(m.role) && typeof m.text === 'string'));
}
function validOutline(value: unknown) { return value === undefined || Boolean(value && typeof value === 'object' && !Array.isArray(value)); }
export function simulateRevision(page: CreatorPage, instruction: string): CreatorPage {
  const short = /短|精简|简洁|好奇|提问/.test(instruction);
  return { ...page, designed: true, ready: Boolean(page.nativeId), title: short ? (page.title.includes('302') ? '302 个神经元，如何产生复杂行为？' : page.title.length > 22 ? page.title.slice(0, 20) + '？' : page.title) : page.title,
    note: instruction, revisions: [...page.revisions, snapshot(page)],
    messages: [...page.messages, { role: 'user', text: instruction }, { role: 'assistant', text: page.designImageId ? '已记录模拟修改意见，现有设计图保持不变。图片调整请切换到设计图后，在下方直接输入要求。网页修改仍为模拟。' : `已完成模拟修改，${short ? '收敛标题并突出核心问题' : '将你的要求记录在方案中'}。也可从页面菜单生成设计图。网页修改仍为模拟。` }] };
}
