import convolutionOutline from './convolutionOutline.json';

// A local snapshot: this walkthrough never imports the original course at runtime.
export const simulationPages = convolutionOutline;
export const conventionalOutline = [
  { title: '卷积的定义与基本概念', summary: '从卷积公式、核矩阵和输入输出的定义开始。' },
  { title: '离散卷积与互相关', summary: '比较两种运算的定义与核翻转。' },
  { title: '卷积核的计算过程', summary: '逐元素相乘并求和，计算输出值。' },
  { title: '常见图像滤波器', summary: '介绍模糊、锐化和边缘检测。' },
  { title: '梯度与差分算子', summary: '理解一阶、二阶差分和典型算子。' },
  { title: '卷积层的参数与特性', summary: '介绍稀疏连接、权重共享与平移等变性。' },
  { title: '感受野与输出尺寸', summary: '解释核尺寸、步长和边界填充。' },
  { title: '多通道与多核卷积', summary: '说明 RGB 输入和输出特征图。' },
  { title: '空洞卷积与可变形卷积', summary: '介绍扩展采样方式。' },
  { title: '总结与练习', summary: '回顾定义、计算和应用。' },
];
export function simulationOutline(revised: boolean) {
  return (revised ? simulationPages : conventionalOutline).map((item, index) => ({ ...item, index }));
}
export type WalkthroughView = 'empty' | 'outline-basic' | 'outline-gomoku' | 'design-draft' | 'design-refined' | 'page' | 'review';
export const walkthroughTurns: { prompt: string; reply: string; steps: string[]; view: WalkthroughView; page?: number }[] = [
  { prompt: '帮我做一套面向初学者、约20页的卷积核入门课，希望他们能理解卷积核是怎么工作的。', reply: '我会先规划大纲，再生成整套页面的设计示意图，等你确认后再制作。先给你看第一版大纲：从定义和运算开始，再到滤波、卷积层特性及扩展。', steps: ['确认受众与约20页的篇幅', '组织知识结构', '生成第一版大纲'], view: 'outline-basic' },
  { prompt: '我希望先让学生建立直觉。可以考虑从五子棋入手，先体验和找棋形，再引出卷积核。', reply: '已按这个思路细化为24页：从五子棋对局、数字编码和局部匹配，逐步走向图像卷积与扩展。你确认这个方向后，我会先生成所有页面的设计示意图，让你看过整体效果后再开始制作。', steps: ['调整课程切入点', '梳理体验到概念的衔接', '生成完整24页大纲'], view: 'outline-gomoku' },
  { prompt: '这个方向可以。', reply: '接下来先做整套页面的设计预览，统一风格与布局。先看第一页的设计初稿：棋盘居中，右侧放操作。其他页可从左侧查看参考效果；你只需要告诉我哪里符合预期、哪里想调整。', steps: ['规划整套页面的设计', '统一视觉与布局', '展示第一页设计初稿'], view: 'design-draft', page: 0 },
  { prompt: '这页感觉有点平，想更有下棋的氛围，整体清爽一些。', reply: '我来调整构图和氛围：左侧放引导，中间突出棋盘，右侧收拢操作，再用庭院、竹叶和棋篓营造场景。修改版设计已更新，你看看这个感觉是否合适。', steps: ['根据反馈调整构图', '完善场景与视觉风格', '生成修改版设计'], view: 'design-refined', page: 0 },
  { prompt: '这版可以，就用这个。', reply: '设计已确认，我现在把它制作成可操作页面，并接上对弈、难度选择、悔棋和重新开始。第一页已就绪，你可以直接试着下几步；接下来我会检查操作和前后衔接。', steps: ['按确认的设计制作页面', '接入本地对弈与控件', '检查交互并更新预览'], view: 'page', page: 0 },
  { prompt: '试了一下，可以正常下棋。', reply: '接下来我会主动核对知识表达、操作和跨页衔接。先查看第二页的实际页面：赢方记为1、对手记为−1、空位记为0。我会特别检查学生能否看出数字与上一页棋盘的对应关系。', steps: ['检查引入页的操作', '核对数字编码规则', '检查跨页衔接'], view: 'review', page: 1 },
  { prompt: '这里最好说清楚，这些数字对应上一页的棋盘位置。', reply: '已补充这句衔接提示。建议你再从第一页到最后一页完整检查一遍，重点看看知识表达、交互操作和前后衔接。发现问题随时告诉我；确认没有问题后，我们就完成制作。', steps: ['补充跨页提示', '更新核验说明'], view: 'review', page: 1 },
  { prompt: '没有问题了。', reply: '好的，已确认完整检查没有问题，这套实践创作完成！你可以继续浏览，也可以开始演示。', steps: ['记录最终确认', '完成实践创作'], view: 'review', page: 0 },
];
