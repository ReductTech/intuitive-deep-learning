export type SemanticVector = readonly [number, number, number, number];

// Hand-set teaching features from the original AttentionMechanismCards example.
export const SEMANTIC_ITEMS = [
  { id: 'person', label: '人物', value: '小明', key: [2.5, 0.2, 0.4, 0.3] },
  { id: 'reason', label: '原因', value: '口渴', key: [0.2, 2.5, 0.6, 0.3] },
  { id: 'place', label: '地点', value: '商店', key: [0.4, 0.2, 2.4, 0.3] },
  { id: 'item', label: '物品', value: '冰水', key: [0.3, 0.3, 0.3, 2.5] },
] as const;

export const SEMANTIC_QUERIES = {
  who: { label: '谁？', vector: [1, 0, 0, 0], answer: '小明' },
  why: { label: '为什么？', vector: [0, 1, 0, 0], answer: '口渴' },
  where: { label: '在哪里？', vector: [0, 0, 1, 0], answer: '商店' },
  what: { label: '买什么？', vector: [0, 0, 0, 1], answer: '冰水' },
} as const;
export type SemanticQueryId = keyof typeof SEMANTIC_QUERIES;
export const SEMANTIC_KEY_DIMENSION = 4;
export const SEMANTIC_BIAS_RANGE = { min: -3, max: 3, step: 0.1 } as const;
export const SCALED_DOT_DIMENSIONS = [4, 16, 64] as const;
export type ScaledDotDimension = (typeof SCALED_DOT_DIMENSIONS)[number];

export function stableSoftmax(scores: readonly number[]): number[] {
  if (!Array.isArray(scores) || !scores.length || !scores.every(Number.isFinite)) {
    throw new RangeError('Softmax requires a non-empty list of finite scores.');
  }
  const maximum = Math.max(...scores);
  const exps = scores.map((score) => Math.exp(score - maximum));
  const denominator = exps.reduce((sum, value) => sum + value, 0);
  return exps.map((value) => value / denominator);
}

export function normalizedEntropy(weights: readonly number[]): number {
  if (!Array.isArray(weights) || !weights.length || !weights.every((value) => Number.isFinite(value) && value >= 0 && value <= 1)) {
    throw new RangeError('Entropy requires a probability distribution.');
  }
  if (Math.abs(weights.reduce((sum, value) => sum + value, 0) - 1) > 1e-9) throw new RangeError('Attention weights must sum to one.');
  if (weights.length === 1) return 0;
  const entropy = -weights.reduce((sum, value) => sum + (value > 0 ? value * Math.log(value) : 0), 0);
  return entropy === 0 ? 0 : entropy / Math.log(weights.length);
}

function getSemanticQuery(task: SemanticQueryId): SemanticVector {
  if (typeof task !== 'string' || !Object.prototype.hasOwnProperty.call(SEMANTIC_QUERIES, task)) {
    throw new RangeError('Unknown semantic query.');
  }
  return SEMANTIC_QUERIES[task].vector;
}

function rawSemanticScores(query: SemanticVector): number[] {
  return SEMANTIC_ITEMS.map(({ key }) => query.reduce((sum, value, index) => sum + value * key[index], 0));
}

export function computeSemanticSoftmax(task: SemanticQueryId = 'where') {
  const query = getSemanticQuery(task);
  const scores = rawSemanticScores(query);
  // The teaching table uses exp(original Score), separately from stable evaluation.
  const exps = scores.map((score) => Math.exp(score));
  const denominator = exps.reduce((sum, value) => sum + value, 0);
  return { query, scores, exps, denominator, weights: stableSoftmax(scores) };
}

export function computeSemanticChain(task: SemanticQueryId = 'where', placeBias = 0) {
  if (!Number.isFinite(placeBias)) throw new RangeError('Place score bias must be finite.');
  const bias = Math.round(placeBias * 10) / 10;
  if (bias < -3 || bias > 3 || Math.abs(placeBias - bias) > 1e-9) throw new RangeError('Place score bias must follow the -3 to 3 slider in steps of 0.1.');
  const query = getSemanticQuery(task);
  const rawScores = rawSemanticScores(query);
  const scale = Math.sqrt(SEMANTIC_KEY_DIMENSION);
  const baseScores = rawScores.map((score) => score / scale);
  const scores = baseScores.map((score, index) => score + (index === 2 ? bias : 0));
  const weights = stableSoftmax(scores);
  return { query, keyDimension: SEMANTIC_KEY_DIMENSION, scale, rawScores, baseScores, scores, weights, bestIndex: weights.indexOf(Math.max(...weights)) };
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function standardDeviation(values: readonly number[]): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
}

function createScaleBase(): number[] {
  const random = seededRandom(19100);
  const base = Array.from({ length: 8 }, () => {
    const first = Math.max(Number.EPSILON, random());
    const second = Math.max(Number.EPSILON, random());
    return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
  });
  const mean = base.reduce((sum, value) => sum + value, 0) / base.length;
  const spread = standardDeviation(base) || 1;
  return base.map((value) => (value - mean) / spread);
}

// Fixed synthetic scores illustrate scale; these are not learned vector products.
const SCALE_BASE = createScaleBase();

export function computeScaledDot(dimension: ScaledDotDimension = 4) {
  if (!SCALED_DOT_DIMENSIONS.some((value) => value === dimension)) throw new RangeError('Scale comparison supports dimensions 4, 16 and 64.');
  const scale = Math.sqrt(dimension);
  const rawScores = SCALE_BASE.map((value) => value * scale);
  const scaledScores = rawScores.map((value) => value / scale);
  const rawWeights = stableSoftmax(rawScores);
  const scaledWeights = stableSoftmax(scaledScores);
  return {
    dimension, scale, rawScores, scaledScores, rawWeights, scaledWeights,
    rawEntropy: normalizedEntropy(rawWeights), scaledEntropy: normalizedEntropy(scaledWeights),
    rawStd: standardDeviation(rawScores), scaledStd: standardDeviation(scaledScores),
  };
}
