import {
  TRANSLATION_TRAINING_SET, TRANSLATION_VALIDATION_SET,
  type TranslationBatchExample, type TranslationTrainingState,
} from './attentionTranslationExperiment';
import type { TranslationExperimentView } from './TranslationExperimentContext';

export type TranslationGreedyStatus = '普通输出' | '直接EOS' | '仅特殊符号' | '达到6步上限';

export interface TranslationDisplay {
  example: TranslationBatchExample;
  /** Index within the selected training or validation set. */
  index: number;
  isTraining: boolean;
  sourceText: string;
  targetText: string;
  /** Original model output, including any BOS/PAD/EOS predictions. */
  greedyTokens: readonly string[];
  greedyText: string;
  /** Exact complete-token match, including EOS and any predicted special tokens. */
  greedyExact: boolean;
  greedyStatus: TranslationGreedyStatus;
  /** Also true for a special-token-only output that never emitted EOS. */
  greedyTruncated: boolean;
  /** Teacher-forced matrices, not the free-generation trajectory. */
  attentionMatrix: readonly (readonly number[])[];
  scoreMatrix: readonly (readonly number[])[];
}

export interface TranslationAccuracySummary {
  trainingCorrect: number;
  trainingTotal: number;
  validationCorrect: number;
  validationTotal: number;
}

/** Compare the entire sequence with canonical target tokens, including EOS. */
export function isExactTranslation(
  predictedTokens: readonly string[],
  targetTokens: readonly string[],
): boolean {
  if (predictedTokens.length !== targetTokens.length) return false;
  for (let index = 0; index < targetTokens.length; index += 1) {
    if (typeof predictedTokens[index] !== 'string' || predictedTokens[index] !== targetTokens[index]) return false;
  }
  return true;
}

/** Derived from free generation; never substitutes teacher-forced token accuracy. */
export function getTranslationAccuracySummary(
  state: Pick<TranslationTrainingState, 'greedyPredictions' | 'validationGreedyPredictions'>,
): TranslationAccuracySummary {
  const countCorrect = (examples: readonly TranslationBatchExample[], predictions: readonly (readonly string[])[]) => (
    examples.reduce((count, example, index) => (
      count + (isExactTranslation(predictions[index] ?? [], example.targetTokens) ? 1 : 0)
    ), 0)
  );
  return {
    trainingCorrect: countCorrect(TRANSLATION_TRAINING_SET, state.greedyPredictions),
    trainingTotal: TRANSLATION_TRAINING_SET.length,
    validationCorrect: countCorrect(TRANSLATION_VALIDATION_SET, state.validationGreedyPredictions),
    validationTotal: TRANSLATION_VALIDATION_SET.length,
  };
}

function isBodyToken(token: string): boolean {
  return token !== '<bos>' && token !== '<eos>' && token !== '<pad>';
}

export function displayTranslationToken(token: string): string {
  if (token === '<bos>') return '开始';
  if (token === '<eos>') return '结束';
  if (token === '<pad>') return 'PAD';
  return token;
}

/** Pure presentation and exact-token comparison only: no model evaluation or training. */
export function getTranslationDisplay(
  state: TranslationTrainingState,
  view: TranslationExperimentView,
  trainingIndex = 0,
): TranslationDisplay {
  const isTraining = view === 'B1';
  const index = view === 'B1' ? trainingIndex : /^V[1-6]$/.test(view) ? Number(view.slice(1)) - 1 : -1;
  if (index < 0 || index >= (isTraining ? TRANSLATION_TRAINING_SET.length : TRANSLATION_VALIDATION_SET.length)) throw new RangeError('Unknown translation example view');
  const example = (isTraining ? TRANSLATION_TRAINING_SET : TRANSLATION_VALIDATION_SET)[index];
  const greedyTokens = (isTraining ? state.greedyPredictions : state.validationGreedyPredictions)[index];
  const bodyTokens = greedyTokens.filter(isBodyToken);
  const ended = greedyTokens.includes('<eos>');
  const greedyTruncated = greedyTokens.length > 0 && !ended;
  // The engine stops at the first EOS or after its fixed six decoding steps.
  // No EOS therefore means a capped output, including when readable words exist.
  const greedyStatus: TranslationGreedyStatus = greedyTokens[0] === '<eos>' ? '直接EOS'
    : bodyTokens.length === 0 ? '仅特殊符号'
      : ended ? '普通输出' : '达到6步上限';

  return {
    example, index, isTraining,
    sourceText: example.sourceTokens.slice(0, example.sourceValidLength).join(' '),
    targetText: example.targetTokens.filter(isBodyToken).join(''),
    greedyTokens,
    greedyText: bodyTokens.join(''),
    greedyExact: isExactTranslation(greedyTokens, example.targetTokens),
    greedyStatus,
    greedyTruncated,
    attentionMatrix: (isTraining ? state.attentionMatrices : state.validationAttentionMatrices)[index],
    scoreMatrix: (isTraining ? state.scoreMatrices : state.validationScoreMatrices)[index],
  };
}
