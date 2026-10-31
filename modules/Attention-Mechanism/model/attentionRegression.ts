/**
 * Synthetic kernel-regression experiment used by C13-C16.
 * The seeded observations, Gaussian score and analytic leave-one-out derivative
 * follow the reference experiment. Targets are scaled into illustrative shelf
 * prices, with the learning rate scaled inversely so the five-step w path stays
 * the same while losses carry the new price units.
 * This file is self-contained: no React, storage, timers, services, or archival imports.
 */
export interface AttentionSample {
  readonly x: number;
  readonly y: number;
  readonly clean: number;
}

export interface AttentionDataset {
  readonly train: readonly AttentionSample[];
  readonly validation: readonly AttentionSample[];
}

export interface AttentionTrainingState {
  epoch: number;
  w: number;
  gradient: number;
  trainMse: number;
  validationMse: number;
  readonly lossHistory: readonly number[];
  readonly validationHistory: readonly number[];
}

export const D2L_TRAIN_SIZE = 50;
export const D2L_TEST_SIZE = 50;
export const D2L_NOISE_STD = 0.5;
export const INITIAL_ATTENTION_W = 0.5;
// Five times the original target spread makes the illustrative shelf prices
// span roughly ¥2.86–¥5.05. Divide the learning rate by 5² to preserve w's path.
export const REGRESSION_PRICE_SPREAD_FACTOR = 5;
export const D2L_LEARNING_RATE = 0.02;
export const MAX_ATTENTION_EPOCHS = 5;
export const ATTENTION_DATA_SEED = 2024;
export const DEFAULT_ATTENTION_QUERY = 2.5;
/** C13/C14 use w=1; C15 independently starts its learned parameter at 0.5. */
export const REGRESSION_EXPLORATION_W = 1;
/** The seeded regression target is a deviation measured in jiao from a ¥3.00 shelf price. */
export const REGRESSION_REFERENCE_PRICE_YUAN = 3;
export function regressionPriceYuan(deviationJiao: number): number {
  return REGRESSION_REFERENCE_PRICE_YUAN + deviationJiao / 10;
}
export const ATTENTION_QUERY_VALUES: readonly number[] = Object.freeze(
  Array.from({ length: D2L_TEST_SIZE }, (_, index) => index / 10),
);
/** Display scale only. Raw weights can exceed this value and are never clipped. */
export const ATTENTION_HEATMAP_COLOR_MAXIMUM = 0.12;

export function attentionTarget(x: number) {
  return 2 * Math.sin(x) + Math.pow(x, 0.8);
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomNormal(random: () => number) {
  const u = Math.max(Number.EPSILON, random());
  const v = Math.max(Number.EPSILON, random());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function createAttentionDataset(seed = ATTENTION_DATA_SEED): AttentionDataset {
  const random = createSeededRandom(seed);
  const train = Array.from({ length: D2L_TRAIN_SIZE }, () => {
    const x = random() * 5;
    const clean = REGRESSION_PRICE_SPREAD_FACTOR * attentionTarget(x);
    return { x, clean, y: clean + randomNormal(random) * D2L_NOISE_STD * REGRESSION_PRICE_SPREAD_FACTOR };
  }).sort((left, right) => left.x - right.x);
  const validation = Array.from({ length: D2L_TEST_SIZE }, (_, index) => {
    const x = index / 10;
    const clean = REGRESSION_PRICE_SPREAD_FACTOR * attentionTarget(x);
    return { x, clean, y: clean };
  });
  return { train, validation };
}

function normalizeScores(scores: readonly number[]) {
  if (scores.length === 0) throw new RangeError('Attention requires at least one candidate.');
  const maximum = Math.max(...scores);
  const exponentials = scores.map((score) => Math.exp(score - maximum));
  const denominator = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / denominator);
}

export function attentionWeights(
  query: number,
  samples: readonly AttentionSample[],
  w: number,
  excludedIndex = -1,
) {
  if (!Number.isFinite(query) || !Number.isFinite(w) || w < 0) {
    throw new RangeError('Attention requires a finite query and a finite non-negative kernel parameter.');
  }
  const candidates = samples
    .map((sample, index) => ({ sample, index }))
    .filter(({ index }) => index !== excludedIndex);
  const scores = candidates.map(({ sample }) => -0.5 * Math.pow((query - sample.x) * w, 2));
  const weights = normalizeScores(scores);
  return candidates.map(({ sample, index }, position) => ({
    index,
    sample,
    weight: weights[position],
  }));
}

export function attentionPrediction(
  query: number,
  samples: readonly AttentionSample[],
  w: number,
  excludedIndex = -1,
) {
  return attentionWeights(query, samples, w, excludedIndex)
    .reduce((sum, item) => sum + item.weight * item.sample.y, 0);
}

function predictionAndDerivative(
  query: number,
  samples: readonly AttentionSample[],
  w: number,
  excludedIndex: number,
) {
  const weighted = attentionWeights(query, samples, w, excludedIndex);
  const prediction = weighted.reduce((sum, item) => sum + item.weight * item.sample.y, 0);
  const scoreDerivatives = weighted.map((item) => -w * Math.pow(query - item.sample.x, 2));
  const expectedScoreDerivative = weighted.reduce(
    (sum, item, index) => sum + item.weight * scoreDerivatives[index],
    0,
  );
  const derivative = weighted.reduce(
    (sum, item, index) => sum + item.weight
      * (scoreDerivatives[index] - expectedScoreDerivative)
      * item.sample.y,
    0,
  );
  return { prediction, derivative };
}

/** The training loss is leave-one-out MSE on noisy observations; clean values are evaluation only. */
export function attentionTrainingMetrics(dataset: AttentionDataset, w: number) {
  if (dataset.train.length < 2 || dataset.validation.length === 0) {
    throw new RangeError('Training requires at least two observations and a non-empty evaluation grid.');
  }
  let trainLoss = 0;
  let gradient = 0;
  dataset.train.forEach((sample, index) => {
    const result = predictionAndDerivative(sample.x, dataset.train, w, index);
    const error = result.prediction - sample.y;
    trainLoss += error * error;
    gradient += 2 * error * result.derivative;
  });
  const trainMse = trainLoss / dataset.train.length;
  gradient /= dataset.train.length;
  const validationMse = dataset.validation.reduce((sum, sample) => {
    const prediction = attentionPrediction(sample.x, dataset.train, w);
    const error = prediction - sample.clean;
    return sum + error * error;
  }, 0) / dataset.validation.length;
  return { trainMse, validationMse, gradient };
}

export function createAttentionTrainingState(dataset: AttentionDataset): AttentionTrainingState {
  const metrics = attentionTrainingMetrics(dataset, INITIAL_ATTENTION_W);
  return {
    epoch: 0,
    w: INITIAL_ATTENTION_W,
    gradient: metrics.gradient,
    trainMse: metrics.trainMse,
    validationMse: metrics.validationMse,
    lossHistory: [metrics.trainMse],
    validationHistory: [metrics.validationMse],
  };
}

export function trainAttentionStep(
  state: AttentionTrainingState,
  dataset: AttentionDataset,
  learningRate = D2L_LEARNING_RATE,
): AttentionTrainingState {
  if (!Number.isInteger(state.epoch) || state.epoch < 0 || state.epoch > MAX_ATTENTION_EPOCHS) {
    throw new RangeError('The regression lesson supports epochs 0 through 5.');
  }
  if (state.epoch === MAX_ATTENTION_EPOCHS) return state;
  if (!Number.isFinite(learningRate) || learningRate <= 0) {
    throw new RangeError('The learning rate must be positive and finite.');
  }
  const before = attentionTrainingMetrics(dataset, state.w);
  const nextW = Math.max(0.05, Math.min(8, state.w - learningRate * before.gradient));
  const after = attentionTrainingMetrics(dataset, nextW);
  return {
    epoch: state.epoch + 1,
    w: nextW,
    gradient: after.gradient,
    trainMse: after.trainMse,
    validationMse: after.validationMse,
    lossHistory: [...state.lossHistory, after.trainMse],
    validationHistory: [...state.validationHistory, after.validationMse],
  };
}

export function runAttentionTraining(
  state: AttentionTrainingState,
  dataset: AttentionDataset,
  learningRate = D2L_LEARNING_RATE,
  epochs: number,
) {
  if (!Number.isInteger(epochs) || epochs < 0) {
    throw new RangeError('The number of training epochs must be a non-negative integer.');
  }
  let next = state;
  const remaining = Math.min(epochs, Math.max(0, MAX_ATTENTION_EPOCHS - state.epoch));
  for (let index = 0; index < remaining; index += 1) {
    next = trainAttentionStep(next, dataset, learningRate);
  }
  return next;
}

export function attentionAverage(samples: readonly AttentionSample[]): number {
  if (samples.length === 0) throw new RangeError('An average requires observations.');
  return samples.reduce((sum, sample) => sum + sample.y, 0) / samples.length;
}

export interface AttentionCurvePoint {
  readonly query: number;
  readonly prediction: number;
  readonly reference: number;
}

/** Every curve uses the same 0, 0.1, ..., 4.9 query grid; no observations are resampled. */
export function attentionCurve(
  dataset: AttentionDataset,
  w: number,
  mode: 'average' | 'attention' = 'attention',
): AttentionCurvePoint[] {
  const average = attentionAverage(dataset.train);
  return ATTENTION_QUERY_VALUES.map((query) => ({
    query,
    prediction: mode === 'average' ? average : attentionPrediction(query, dataset.train, w),
    reference: REGRESSION_PRICE_SPREAD_FACTOR * attentionTarget(query),
  }));
}

export interface AttentionHeatmapRow {
  readonly query: number;
  /** In the full, x-sorted training-record order. No subset renormalization. */
  readonly weights: readonly number[];
  readonly prediction: number;
}

export function createAttentionHeatmap(
  dataset: AttentionDataset,
  w: number,
): readonly AttentionHeatmapRow[] {
  return Object.freeze(ATTENTION_QUERY_VALUES.map((query) => {
    const weighted = attentionWeights(query, dataset.train, w);
    return Object.freeze({
      query,
      weights: Object.freeze(weighted.map((item) => item.weight)),
      prediction: weighted.reduce((sum, item) => sum + item.weight * item.sample.y, 0),
    });
  }));
}

/** Exact row identity for C16; returns -1 for values outside its tenth-step query grid. */
export function attentionQueryRowIndex(query: number): number {
  if (!Number.isFinite(query)) return -1;
  const index = Math.round(query * 10);
  return index >= 0 && index < ATTENTION_QUERY_VALUES.length
    && Math.abs(query - ATTENTION_QUERY_VALUES[index]) < 1e-9 ? index : -1;
}

function freezeTrainingState(state: AttentionTrainingState): AttentionTrainingState {
  return Object.freeze({
    ...state,
    lossHistory: Object.freeze([...state.lossHistory]),
    validationHistory: Object.freeze([...state.validationHistory]),
  });
}

/** Module-owned synthetic data. Neither a UI mount nor changing q generates a new dataset. */
export const ATTENTION_DATASET: AttentionDataset = (() => {
  const dataset = createAttentionDataset();
  return Object.freeze({
    train: Object.freeze(dataset.train.map((sample) => Object.freeze(sample))),
    validation: Object.freeze(dataset.validation.map((sample) => Object.freeze(sample))),
  });
})();

/** Computed once, independently of any C15 activity state or persisted progress. */
export const ATTENTION_TRAINING_SNAPSHOTS: readonly AttentionTrainingState[] = (() => {
  const snapshots = [freezeTrainingState(createAttentionTrainingState(ATTENTION_DATASET))];
  for (let epoch = 1; epoch <= MAX_ATTENTION_EPOCHS; epoch += 1) {
    snapshots.push(freezeTrainingState(trainAttentionStep(snapshots[epoch - 1], ATTENTION_DATASET)));
  }
  return Object.freeze(snapshots);
})();

export const ATTENTION_INITIAL_TRAINING = ATTENTION_TRAINING_SNAPSHOTS[0];
export const ATTENTION_FIFTH_EPOCH_TRAINING = ATTENTION_TRAINING_SNAPSHOTS[MAX_ATTENTION_EPOCHS];
export const ATTENTION_BEFORE_HEATMAP = createAttentionHeatmap(ATTENTION_DATASET, INITIAL_ATTENTION_W);
export const ATTENTION_AFTER_HEATMAP = createAttentionHeatmap(ATTENTION_DATASET, ATTENTION_FIFTH_EPOCH_TRAINING.w);

/** C16 reads the independent fixed before/after models; it never accepts C15's current state. */
export function attentionHeatmapComparison(query: number) {
  const rowIndex = attentionQueryRowIndex(query);
  if (rowIndex < 0) throw new RangeError('A heatmap query must be 0 through 4.9 in steps of 0.1.');
  const before = ATTENTION_BEFORE_HEATMAP[rowIndex];
  const after = ATTENTION_AFTER_HEATMAP[rowIndex];
  return {
    query: before.query,
    rowIndex,
    reference: REGRESSION_PRICE_SPREAD_FACTOR * attentionTarget(before.query),
    before: { w: INITIAL_ATTENTION_W, ...before },
    after: { w: ATTENTION_FIFTH_EPOCH_TRAINING.w, ...after },
    /** Both weight strips use this shared upper bound; it is separate from the heatmap color scale. */
    weightStripMaximum: Math.max(...before.weights, ...after.weights),
    colorMaximum: ATTENTION_HEATMAP_COLOR_MAXIMUM,
  };
}

function closeTrainingNumber(value: unknown, expected: number): boolean {
  return typeof value === 'number' && Number.isFinite(value)
    && Math.abs(value - expected) <= 1e-9 * Math.max(1, Math.abs(expected));
}

/**
 * Restore only an internally consistent state from this lesson's fixed seed/lr trajectory.
 * The epoch alone is insufficient: altered w, losses, or history must not fabricate completion.
 * Computed canonical values are returned so presentation rounding never propagates into training.
 */
export function normalizeAttentionTrainingState(value: unknown): AttentionTrainingState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<AttentionTrainingState>;
  if (!Number.isInteger(candidate.epoch)
    || candidate.epoch === undefined || candidate.epoch < 0 || candidate.epoch > MAX_ATTENTION_EPOCHS) return null;
  const canonical = ATTENTION_TRAINING_SNAPSHOTS[candidate.epoch];
  if (!closeTrainingNumber(candidate.w, canonical.w)
    || !closeTrainingNumber(candidate.gradient, canonical.gradient)
    || !closeTrainingNumber(candidate.trainMse, canonical.trainMse)
    || !closeTrainingNumber(candidate.validationMse, canonical.validationMse)) return null;
  if (!Array.isArray(candidate.lossHistory) || !Array.isArray(candidate.validationHistory)
    || candidate.lossHistory.length !== canonical.lossHistory.length
    || candidate.validationHistory.length !== canonical.validationHistory.length
    || !candidate.lossHistory.every((loss, index) => closeTrainingNumber(loss, canonical.lossHistory[index]))
    || !candidate.validationHistory.every((loss, index) => closeTrainingNumber(loss, canonical.validationHistory[index]))) return null;
  return canonical;
}

export function hasCompletedAttentionTraining(state: AttentionTrainingState): boolean {
  const restored = normalizeAttentionTrainingState(state);
  return restored !== null && restored.epoch === MAX_ATTENTION_EPOCHS
    && restored.trainMse < ATTENTION_INITIAL_TRAINING.trainMse;
}
