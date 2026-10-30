/** A deterministic multi-channel convolution, not a trained semantic detector. */
export const CLUES = ['rim', 'leftArc', 'rightArc'] as const;
export type ClueId = typeof CLUES[number];
export const CLUE_LABELS: Record<ClueId, string> = { rim: '上沿', leftArc: '左弧线', rightArc: '右弧线' };
export type Matrix = number[][];
export interface CompositionState {
  enabled: Record<ClueId, boolean>;
  misplaced: boolean;
  evidence: { matched: boolean; removed: boolean; misplaced: boolean; restored: boolean };
}
export type CompositionAction = { type: 'toggle'; id: ClueId } | { type: 'move' } | { type: 'restore' } | { type: 'reset' };
export const BIAS = -2;
const blank = (size: number): Matrix => Array.from({ length: size }, () => Array(size).fill(0));
const spike = (size: number, row: number, column: number): Matrix => {
  const matrix = blank(size); matrix[row][column] = 1; return matrix;
};
// Three sparse 3×3 channel kernels. Every other coefficient is zero.
const kernels: Record<ClueId, Matrix> = {
  rim: spike(3, 0, 1), leftArc: spike(3, 1, 0), rightArc: spike(3, 1, 2),
};
export function createCompositionState(): CompositionState {
  return { enabled: { rim: true, leftArc: true, rightArc: false }, misplaced: false,
    evidence: { matched: false, removed: false, misplaced: false, restored: false } };
}
export function cluePosition(id: ClueId, misplaced: boolean): { row: number; column: number } {
  if (id === 'rim') return { row: 1, column: 2 };
  const alignedColumn = id === 'leftArc' ? 1 : 3;
  return { row: 2, column: misplaced ? 4 - alignedColumn : alignedColumn };
}
export function buildChannels(state: CompositionState): Record<ClueId, Matrix> {
  return Object.fromEntries(CLUES.map(id => {
    const p = cluePosition(id, state.misplaced);
    return [id, state.enabled[id] ? spike(5, p.row, p.column) : blank(5)];
  })) as Record<ClueId, Matrix>;
}
export function calculateComposition(state: CompositionState) {
  const channels = buildChannels(state), output = blank(3), preactivation = blank(3);
  const contributions: Record<ClueId, number> = { rim: 0, leftArc: 0, rightArc: 0 };
  for (let row = 0; row < 3; row++) for (let column = 0; column < 3; column++) {
    let weighted = 0;
    for (const id of CLUES) {
      let contribution = 0;
      for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
        contribution += channels[id][row + y][column + x] * kernels[id][y][x];
      }
      weighted += contribution;
      if (row === 1 && column === 1) contributions[id] = contribution;
    }
    preactivation[row][column] = weighted + BIAS;
    output[row][column] = Math.max(0, preactivation[row][column]);
  }
  return { channels, output, preactivation, contributions, center: output[1][1] };
}
const allEnabled = (state: CompositionState) => CLUES.every(id => state.enabled[id]);
export function compositionReducer(state: CompositionState, action: CompositionAction): CompositionState {
  if (action.type === 'reset') return createCompositionState();
  if (action.type === 'move' && (!allEnabled(state) || !state.evidence.matched || state.misplaced)) return state;
  if (action.type === 'restore' && !state.misplaced) return state;
  const previous = calculateComposition(state);
  const next: CompositionState = {
    enabled: { ...state.enabled }, misplaced: state.misplaced, evidence: { ...state.evidence },
  };
  if (action.type === 'toggle') next.enabled[action.id] = !next.enabled[action.id];
  if (action.type === 'move') next.misplaced = true;
  if (action.type === 'restore') next.misplaced = false;
  const result = calculateComposition(next);
  if (result.center > 0) next.evidence.matched = true;
  if (action.type === 'toggle' && previous.center > 0 && result.center === 0) next.evidence.removed = true;
  if (allEnabled(next) && next.misplaced && result.center === 0) next.evidence.misplaced = true;
  if (state.misplaced && !next.misplaced && result.center > 0) next.evidence.restored = true;
  return next;
}
export function compositionComplete(state: CompositionState): boolean {
  return Object.values(state.evidence).every(Boolean);
}
export function nextCompositionAction(state: CompositionState): { label: string; action: CompositionAction } {
  if (state.misplaced) return { label: '恢复位置，再比较 →', action: { type: 'restore' } };
  const missing = (['rightArc', 'leftArc', 'rim'] as const).find(id => !state.enabled[id]);
  if (missing) return { label: '接入' + CLUE_LABELS[missing] + '，看看变化 →', action: { type: 'toggle', id: missing } };
  if (!state.evidence.removed) return { label: '移除右弧线，看看变化 →', action: { type: 'toggle', id: 'rightArc' } };
  return { label: '打乱相对位置，比较响应 →', action: { type: 'move' } };
}
export function compositionNotice(state: CompositionState): string {
  if (state.misplaced && !allEnabled(state)) return '现在线索和位置都发生了变化；先恢复位置，再比较单个因素。';
  if (state.misplaced) return '三条线索仍然都在，但相对位置变了；同一组权重下，中心响应从 1 变为 0。';
  if (compositionComplete(state) && allEnabled(state)) return '位置恢复，响应重新出现。后层组合前层的线索及其位置关系，而不是直接生成一幅瓶子图。';
  if (allEnabled(state)) return '三种线索在指定位置同时出现，本例的中心响应为 1；试着移除其中一条。';
  if (state.evidence.matched) return '权重保持不变；本例缺少一条所需线索时，中心响应为 0。接回后，再比较位置。';
  return '先点击右弧线接入它：只改变一条前层响应，看看后层的数字怎样变化。';
}
export function compositionInsight(state: CompositionState): string {
  if (state.misplaced) return '线索没有少，相对位置改变，响应也会改变。';
  if (compositionComplete(state)) return '后层在组合前层的线索及其相对位置。';
  if (allEnabled(state)) return state.evidence.removed ? '线索已接回，再看看位置是否重要。' : '移除一条线索，看看它是否真的影响后层。';
  return state.evidence.matched ? '少一条，组合响应归零；接回后再比较。' : '接入缺少的线索，亲手观察组合响应。';
}
