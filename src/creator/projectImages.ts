import type { CreatorProject } from './model';
import { isDesignImage, readDesignImage, saveDesignImage } from './designImages';

function imageIds(project: CreatorProject) {
  return [...new Set(project.pages.flatMap(page => [page.designImageId, ...page.revisions.map(r => r.designImageId)]).filter((id): id is string => Boolean(id)))];
}
export async function packProject(project: CreatorProject): Promise<string> {
  const images = await Promise.all(imageIds(project).map(async id => {
    const image = await readDesignImage(id);
    if (!image) throw new Error('项目中有设计图缺失，请重新生成或导入完整备份后再导出。');
    return [id, image] as const;
  }));
  return JSON.stringify({ ...project, designImages: Object.fromEntries(images) }, null, 2);
}
export async function unpackProject(project: CreatorProject & { designImages?: unknown }): Promise<CreatorProject> {
  const ids = imageIds(project);
  const images = project.designImages;
  if (ids.length && (!images || typeof images !== 'object' || Array.isArray(images))) throw new Error('项目备份缺少设计图数据，请导入完整备份。');
  const entries = ids.map(id => {
    const value = (images as Record<string, unknown>)[id];
    if (!isDesignImage(value)) throw new Error('项目备份含有缺失或无效的设计图。');
    return [id, value] as const;
  });
  // Allocate fresh asset IDs so importing another backup cannot overwrite an existing design.
  const remap = new Map<string, string>();
  for (const [id, image] of entries) remap.set(id, await saveDesignImage(image));
  const { designImages: _, ...plain } = project;
  return { ...plain, pages: project.pages.map(page => ({ ...page, designImageId: page.designImageId ? remap.get(page.designImageId) : undefined,
    revisions: page.revisions.map(r => ({ ...r, designImageId: r.designImageId ? remap.get(r.designImageId) : undefined })) })) };
}
