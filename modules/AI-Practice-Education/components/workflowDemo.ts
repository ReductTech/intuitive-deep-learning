export type WorkflowArtifact = 'outline-first' | 'outline-revised' | 'design-first' | 'design-revised' | 'page-bug' | 'page-fixed' | 'audit' | 'reviewed';
export interface WorkflowTurn {
  prompt: string;
  activity: string[];
  reply: string;
  artifact?: WorkflowArtifact;
  file?: string;
}
export const workflowStages: { title: string; file: string; turns: WorkflowTurn[] }[] = [
  { title: '设计大纲', file: 'outlines.json', turns: [
    {
      prompt: '我打算制作一套用“曹冲称象”讲解回归与损失的教学 PPT。请参考 intuitive-deep-learning\\creator-skill，结合 modules\\Regression-Loss 开始制作。先给我大纲，不要直接做页面。',
      activity: ['读取 creator-skill/SKILL.md', '阅读 Regression-Loss/outlines.json', '整理课程结构'],
      reply: '我已参考创作规范和现有课程。用曹冲称象建立问题，再从投石记录走向预测、误差与损失。先看这版大纲，确认后再逐页制作。',
      artifact: 'outline-first',
    },
    {
      prompt: '第二页就讲回归公式有点快。先让学生遇到“石头不够，怎么估象重”的问题，再自己尝试找一条趋势线。',
      activity: ['调整知识顺序', '补充问题与页面衔接'],
      reply: '同意，这里缺少从故事到模型的过渡。现在先保留石头不足的悬念，再让学生根据记录尝试估计；公式放到直觉建立之后。',
      artifact: 'outline-revised',
    },
    {
      prompt: '这版没有问题了，保存大纲。接下来可以开始做第一页。',
      activity: ['写入 outlines.json'],
      reply: '大纲已确认并保存。第一页只做曹冲称象的引入与投石体验，先不揭晓象重。点击“逐页制作”，我们从第一页的设计开始。',
      file: 'outlines.json',
    },
  ] },
  { title: '逐页制作', file: 'CaoChongPage.tsx', turns: [
    {
      prompt: '按照确认的大纲，开始第一页。先说一下引子怎么设计，再给我一张视觉设计示意图。',
      activity: ['阅读第一页教学目标', '构思开场', '制作设计示意图'],
      reply: '以“一艘船，能称出大象多重吗？”开场。把船、大象和水位放在同一画面，让学生先观察下沉，再尝试投石。这是第一版设计。',
      artifact: 'design-first',
    },
    {
      prompt: '不太满意。你直接把“用石头替代大象”的办法写出来了，学生就不用想了。先只留船和大象，点击称重后再出现水位刻痕和投石入口。',
      activity: ['调整信息出现顺序', '修改开场设计'],
      reply: '已去掉提前出现的答案。初始只展示船、大象和“开始称重”；记录水位后才让学生投石。等石头用完还达不到刻痕，再提出估重问题。',
      artifact: 'design-revised',
    },
    {
      prompt: '这版可以了，现在开始做吧。做完打开网页，我体验一下。',
      activity: ['实现 CaoChongPage.tsx', '接入水位与投石状态', '打开页面预览'],
      reply: '第一页已制作。点击下方预览，在网页里试试称重、投石和重新开始；先体验操作，再决定是否需要调整。',
      artifact: 'page-bug', file: 'CaoChongPage.tsx',
    },
    {
      prompt: '我投了几块石头再点“重新开始”，船回去了，但右边的投石记录还在。重新开始应该把记录也清空。',
      activity: ['检查重新开始的状态处理', '补齐记录清空逻辑', '更新页面预览'],
      reply: '找到了：之前只重置了船和投石数量，没有同步清空观测记录。现在两边一起恢复初始状态。再打开预览，投石后重新开始确认一下。',
      artifact: 'page-fixed', file: 'CaoChongPage.tsx',
    },
    {
      prompt: '这次重新开始后记录也清空了，没问题。后面的页面就按照这个方式逐页设计、确认和制作。',
      activity: ['记录第一页确认结果'],
      reply: '第一页确认完成。其余页面沿用相同的设计与迭代过程；这里略过重复制作，接下来点击“人工核验”，体验整套课件的检查过程。',
      file: '第 1 页 · 已确认',
    },
  ] },
  { title: '人工核验', file: 'review-notes.md', turns: [
    {
      prompt: '课件做好了。现在从第一页到最后一页浏览一遍，体验一下交互，重点检查数据是否衔接、有没有提前泄露答案。',
      activity: ['整理整套课件的核验入口', '准备课堂浏览模式'],
      reply: '可以，打开下方课件预览，依次检查引入、估重与误差页面。这里展示几个关键页面；实际交付前需要把整套课件完整走一遍。',
      artifact: 'audit',
    },
    {
      prompt: '我发现一个衔接问题：第二页没有说明散点来自刚才的投石记录。学生可能以为是新的一批数据，加一句简短提示。',
      activity: ['补充第二页的数据来源提示', '核对前后页面共享记录'],
      reply: '已在第二页加入“这些点来自刚才的投石记录”，并保留同一批记录。再从第一页进入第二页，看来源是否清楚；之后继续检查估重和误差的衔接。',
      artifact: 'reviewed', file: 'EstimateWeightPage.tsx',
    },
    {
      prompt: '这次衔接清楚了，交互也没有问题。这一轮核验完成。',
      activity: ['保存本轮核验记录'],
      reply: '已记录本轮核验结果：重置记录与数据衔接问题已修复，并经你重新体验确认。课程制作是在这样的一轮轮反馈中完成的。',
      file: 'review-notes.md',
    },
  ] },
];
