/** Fixed teaching data only. These weights are neither learned ATT nor supervision labels. */
export const TRANSLATION_TEACHING_SOURCE = ['I', 'am', 'home', '.'] as const;
export const TRANSLATION_TEACHING_TARGET = ['我', '到家', '了', '。', '<eos>'] as const;
export const TRANSLATION_TEACHING_TEACHER_INPUT = ['<bos>', '我', '到家', '了', '。'] as const;
export const TRANSLATION_TEACHING_ROWS = ['我', '到家', '了'] as const;
export const TRANSLATION_TEACHING_MATRIX = [
  [0.72, 0.15, 0.08, 0.05],
  [0.08, 0.17, 0.70, 0.05],
  [0.05, 0.20, 0.65, 0.10],
] as const;
export const TRANSLATION_FIXED_CONTEXT_INITIAL_ROW = 0;
export const TRANSLATION_DECODING_TEACHING_ROW = 1;
export const TRANSLATION_HEATMAP_INITIAL_ROW = 1;

/** Labels name target steps, not successful model predictions. No later ATT rows are fabricated. */
export function getTranslationTeachingStep(row: number) {
  if (!Number.isInteger(row) || row < 0 || row >= TRANSLATION_TEACHING_MATRIX.length) {
    throw new RangeError('Only the first three target steps have teaching weights.');
  }
  return {
    kind: 'fixed-teaching' as const,
    row, step: row + 1,
    target: TRANSLATION_TEACHING_ROWS[row],
    previousToken: TRANSLATION_TEACHING_TEACHER_INPUT[row],
    previousStateIndex: row,
    queryStateIndex: row,
    contextIndex: row + 1,
    nextStateIndex: row + 1,
    sourceTokens: TRANSLATION_TEACHING_SOURCE,
    weights: TRANSLATION_TEACHING_MATRIX[row],
  };
}

/** C18 uses a separate score example, unrelated to the 0.70 teaching matrix. */
export const TRANSLATION_MASK_SOURCE = ['I', 'am', 'home', '.', 'PAD', 'PAD'] as const;
export const TRANSLATION_MASK_SCORES = [0.4, 0.8, 2.3, 0.2, 4.0, 3.4] as const;
export const TRANSLATION_MASK_VALID_LENGTH = 4;

export function computeTranslationPaddingMask(enabled: boolean) {
  const activeScores = enabled ? TRANSLATION_MASK_SCORES.slice(0, TRANSLATION_MASK_VALID_LENGTH) : [...TRANSLATION_MASK_SCORES];
  const maximum = Math.max(...activeScores);
  const exponentials = activeScores.map((score) => Math.exp(score - maximum));
  const denominator = exponentials.reduce((sum, value) => sum + value, 0);
  const weights = exponentials.map((value) => value / denominator);
  if (enabled) weights.push(0, 0);
  return {
    kind: 'padding-mask-teaching' as const,
    enabled,
    sourceTokens: TRANSLATION_MASK_SOURCE,
    rawScores: TRANSLATION_MASK_SCORES,
    scores: TRANSLATION_MASK_SCORES.map((score, index) => enabled && index >= TRANSLATION_MASK_VALID_LENGTH ? Number.NEGATIVE_INFINITY : score),
    weights,
    validLength: TRANSLATION_MASK_VALID_LENGTH,
    paddingWeight: weights.slice(TRANSLATION_MASK_VALID_LENGTH).reduce((sum, weight) => sum + weight, 0),
  };
}

/** Shape-only examples from the original batch diagram. No invented attention values. */
export const TRANSLATION_MASK_BATCH_SHAPE = { B: 2, N: 5, L: 6 } as const;
export const TRANSLATION_MASK_BATCH_SLICES = [4, 6].map((validLength, batch) => ({
  kind: 'shape-only' as const,
  label: '样本 ' + (batch + 1),
  validLength,
  queryLabels: ['Q₁', 'Q₂', 'Q₃', 'Q₄', 'Q₅'],
  keyLabels: ['K₁', 'K₂', 'K₃', 'K₄', 'K₅', 'K₆'],
  paddingMask: Array.from({ length: 5 }, () => Array.from({ length: 6 }, (_, column) => column >= validLength)),
}));
