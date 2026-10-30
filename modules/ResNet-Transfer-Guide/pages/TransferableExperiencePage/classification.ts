export type ClueChoice = 'reusable' | 'old-task' | null;
export const TRANSFER_CLUES = [
  { id: 'edges', label: '物体边缘', answer: 'reusable' },
  { id: 'labels', label: '旧任务类别名称', answer: 'old-task' },
  { id: 'texture', label: '透明材质纹理', answer: 'reusable' },
  { id: 'contour', label: '曲面与轮廓', answer: 'reusable' },
  { id: 'scores', label: '旧分类头的类别分数', answer: 'old-task' },
  { id: 'parts', label: '局部部件关系', answer: 'reusable' },
] as const;

export function classificationFeedback(choices: readonly ClueChoice[]) {
  const missing = TRANSFER_CLUES.flatMap((_, index) => choices[index] == null ? [index] : []);
  const wrong = TRANSFER_CLUES.flatMap((clue, index) => choices[index] != null && choices[index] !== clue.answer ? [index] : []);
  const complete = missing.length === 0 && wrong.length === 0;
  const messages: string[] = [];
  if (missing.length) messages.push('尚未分类：' + missing.map(index => TRANSFER_CLUES[index].label).join('、') + '。');
  for (const category of ['reusable', 'old-task'] as const) {
    const labels = wrong.filter(index => TRANSFER_CLUES[index].answer === category).map(index => TRANSFER_CLUES[index].label);
    if (labels.length) messages.push('需调整：“' + labels.join('、') + '”属于' + (category === 'reusable' ? '可复用表示' : '旧任务答案') + '。');
  }
  return { missing, wrong, complete, message: complete ? '分类正确：视觉表示可以复用，旧任务答案需要替换。' : messages.join(' ') };
}
