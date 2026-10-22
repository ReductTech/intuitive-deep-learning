import { request } from '../../Edit-Deck/api';
import type { PublicConfig } from '../../Edit-Deck/types';
import type { CreatorPage, CreatorProject } from './model';
import { readDesignImage, saveDesignImage } from './designImages';

// A platform service, independent of the simulated authoring agent and its UI.
export async function generatePageDesign(project: CreatorProject, page: CreatorPage, instruction: string, signal: AbortSignal, useReference = true) {
  const config = await request<PublicConfig>('/config', 'GET', undefined, signal);
  if (!config.image.configured) throw new Error('生图接口尚未配置，请在课程设置中打开接口配置。');
  const reference = useReference && page.designImageId ? await readDesignImage(page.designImageId) : undefined;
  if (useReference && page.designImageId && !reference) throw new Error('上一版设计图缺失，请从页面菜单选择「重新生成设计图」。');
  signal.throwIfAborted();
  const { image } = await request<{ image: string }>('/image', 'POST', {
    prompt: [
      '为一张 16:9 教学幻灯片生成完整视觉设计示意图。逻辑画布 1600×900，整页内容完整容纳，无外围设备边框。',
      '使用清晰准确的简体中文，标题层次明确、合理留白、一页一个主要教学目标。用于后续实现为可交互网页，不展示编辑器界面。',
      `课程：${project.title}；演讲时长：${project.duration} 分钟；视觉风格：${project.style}。`,
      `本页标题：${page.title}。教学目标：${page.goal}。内容：${page.summary}。`,
      page.outline?.interaction ? `交互设计：${String(page.outline.interaction)}` : '',
      instruction.trim() ? `本次${reference ? '修改' : '设计'}要求：${instruction.trim()}` : '请根据教学目标设计清晰的教学画面。',
      reference ? '以上一版图片为基础修改，保留未要求改变的内容与视觉风格。' : '',
    ].filter(Boolean).join('\n'), images: reference ? [reference] : [],
  }, signal);
  signal.throwIfAborted();
  const id = await saveDesignImage(image);
  signal.throwIfAborted();
  return id;
}
