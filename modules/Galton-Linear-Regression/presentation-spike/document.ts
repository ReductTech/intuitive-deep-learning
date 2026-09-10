import { parsePresentationDocument } from '../../shared/presentation-engine';

export const galtonSpikeDocument = parsePresentationDocument({
  schemaVersion: 1,
  id: 'galton-presentation-spike',
  title: '1885 年，一个关于身高的预测问题',
  content: {
    'archive-label': { id: 'archive-label', type: 'text', role: 'eyebrow', text: 'ARCHIVE NOTE · FRANCIS GALTON' },
    'main-title': { id: 'main-title', type: 'text', role: 'title', text: '1885 年：一个关于身高的预测问题' },
    'main-subtitle': { id: 'main-subtitle', type: 'text', role: 'subtitle', text: '高尔顿把“家族相似”变成了可测量的数据关系。' },
    'story-heading': { id: 'story-heading', type: 'text', role: 'heading', text: '从观察到预测' },
    'story-body': { id: 'story-body', type: 'text', role: 'body', text: '父母较高的家庭，孩子通常也更高。点云整体向右上方延伸，但并没有整齐地落在一条线上。\n\n这意味着数据里存在关系，同时也保留着个体差异。' },
    'story-note': { id: 'story-note', type: 'text', role: 'note', text: '1885 发表“回归平均”研究\n父母 → 子女，一条可观察的关系' },
    'question': { id: 'question', type: 'text', role: 'question', text: '如果只知道父母身高，你会怎样预测孩子的身高？' },
    'guide-intro': { id: 'guide-intro', type: 'text', role: 'body', text: '这不是一张被拉长的幻灯片。导览视图重新组织相同的内容节点，让阅读顺序适合网页，同时保留同一个互动实验。' },
  },
  assets: {},
  widgets: {
    'fit-lab-widget': {
      id: 'fit-lab-widget',
      widgetType: 'galton-fit-lab',
      widgetVersion: 1,
      props: {},
    },
  },
  views: {
    slides: {
      pages: [{
        id: 'slide-opening',
        title: '从观察到预测',
        width: 1600,
        height: 900,
        background: 'radial-gradient(circle at 88% 3%, rgba(205,185,148,.24), transparent 30%), linear-gradient(135deg,#fbfaf6,#f4f7f5)',
        placements: [
          { id: 'p-eyebrow', source: { kind: 'content', id: 'archive-label' }, x: 78, y: 42, width: 650, height: 30, rotation: 0, zIndex: 5, locked: false, hidden: false, style: {} },
          { id: 'p-title', source: { kind: 'content', id: 'main-title' }, x: 76, y: 82, width: 1180, height: 86, rotation: 0, zIndex: 5, locked: false, hidden: false, style: {} },
          { id: 'p-subtitle', source: { kind: 'content', id: 'main-subtitle' }, x: 80, y: 172, width: 940, height: 54, rotation: 0, zIndex: 5, locked: false, hidden: false, style: {} },
          { id: 'p-widget', source: { kind: 'widget', id: 'fit-lab-widget' }, x: 55, y: 250, width: 1070, height: 530, rotation: 0, zIndex: 3, locked: false, hidden: false, style: { overflow: 'hidden' } },
          { id: 'p-story-card', source: { kind: 'content', id: 'story-body' }, x: 1150, y: 250, width: 390, height: 330, rotation: 0, zIndex: 4, locked: false, hidden: false, style: { background: 'rgba(255,255,255,.88)', border: '1px solid #d8dfdc', borderRadius: 16, padding: 26, boxShadow: '0 12px 36px rgba(28,57,51,.10)' } },
          { id: 'p-story-heading', source: { kind: 'content', id: 'story-heading' }, x: 1176, y: 274, width: 330, height: 42, rotation: 0, zIndex: 5, locked: false, hidden: false, style: {} },
          { id: 'p-note', source: { kind: 'content', id: 'story-note' }, x: 1150, y: 605, width: 390, height: 112, rotation: 0, zIndex: 4, locked: false, hidden: false, style: { background: '#e8f1ee', borderRadius: 12, padding: 18 } },
          { id: 'p-question', source: { kind: 'content', id: 'question' }, x: 210, y: 810, width: 1180, height: 56, rotation: 0, zIndex: 6, locked: false, hidden: false, style: { textAlign: 'center' } },
        ],
      }],
    },
    guide: {
      sections: [
        { id: 'guide-hero', layout: 'hero', theme: 'paper', sources: [{ kind: 'content', id: 'archive-label' }, { kind: 'content', id: 'main-title' }, { kind: 'content', id: 'main-subtitle' }] },
        { id: 'guide-context', title: '从历史观察出发', layout: 'text-media', theme: 'plain', sources: [{ kind: 'content', id: 'story-body' }, { kind: 'content', id: 'story-note' }] },
        { id: 'guide-lab', title: '亲手调整这条预测线', layout: 'interactive', theme: 'accent', sources: [{ kind: 'content', id: 'guide-intro' }, { kind: 'widget', id: 'fit-lab-widget' }] },
        { id: 'guide-question', layout: 'hero', theme: 'plain', sources: [{ kind: 'content', id: 'question' }] },
      ],
    },
  },
  narration: {
    segments: [
      { id: 'narration-opening', text: '1885 年，高尔顿把家族相似变成了一个可以测量的问题。', duration: 6, cues: [{ id: 'cue-title', at: .4, targetId: 'main-title', action: 'spotlight', duration: 4.5 }] },
      { id: 'narration-chart', text: '请观察左侧实验。散点整体从左下延伸到右上，但每个家庭仍然存在差异。', duration: 9, cues: [{ id: 'cue-widget', at: .6, targetId: 'fit-lab-widget', action: 'highlight', duration: 7 }] },
      { id: 'narration-question', text: '现在的问题是，如果只知道父母身高，我们应该怎样预测孩子的身高。', duration: 8, cues: [{ id: 'cue-question', at: .8, targetId: 'question', action: 'spotlight', duration: 6 }] },
    ],
  },
  metadata: { status: 'presentation-engine-spike' },
});

