export const IMAGE_SIZE = 28;
export const REGION_BOUNDS = [0, 9, 19, 28] as const;
export const REGION_LABELS = ['左上格', '上中格', '右上格', '左中格', '中间格', '右中格', '左下格', '下中格', '右下格'] as const;
export const VECTOR_ORDERS = {
  row: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  column: [0, 3, 6, 1, 4, 7, 2, 5, 8],
  reverse: [8, 7, 6, 5, 4, 3, 2, 1, 0],
  snake: [0, 1, 2, 5, 4, 3, 6, 7, 8],
} as const;
export type VectorOrder = keyof typeof VECTOR_ORDERS;
export const VECTOR_ORDER_LABELS: Record<VectorOrder, string> = {
  row: '从左上到右下', column: '按列从上到下', reverse: '从右下到左上', snake: '蛇形顺序',
};

export interface Sample { label: number; file: string; path: string; url: string; }
export interface Feature { count: number; capacity: number; density: number; label: string; }
export interface DatasetRow { sample: Sample; pixels: number[][]; features: Feature[]; }
export interface Normalizer { mean: number[]; std: number[]; }
export interface MlpModel { hidden: number; normalizer: Normalizer; w1: number[][]; b1: number[]; w2: number[][]; b2: number[]; trained: boolean; accuracy: number; }

const imageModules = import.meta.glob('../../../dataset/mnist/*/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const SAMPLES: Sample[] = Object.entries(imageModules).map(([path, url]) => {
  const normalized = path.replace(/\\/g, '/');
  const match = normalized.match(/mnist\/(\d)\/([^/]+)$/);
  return { label: Number(match?.[1] ?? 0), file: match?.[2] ?? normalized, path: normalized, url };
}).sort((a, b) => a.label - b.label || a.file.localeCompare(b.file));

export function blankPixels() { return Array.from({ length: IMAGE_SIZE }, () => Array(IMAGE_SIZE).fill(0) as number[]); }

export function loadImage(sample: Sample) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error(`图片加载失败：${sample.file}`)); image.src = sample.url;
  });
}

export function imageToPixels(image: HTMLImageElement) {
  const canvas = document.createElement('canvas'); canvas.width = IMAGE_SIZE; canvas.height = IMAGE_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return blankPixels();
  ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE); ctx.drawImage(image, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
  const data = ctx.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE).data;
  return Array.from({ length: IMAGE_SIZE }, (_, row) => Array.from({ length: IMAGE_SIZE }, (_, col) => data[(row * IMAGE_SIZE + col) * 4] > 0 ? 1 : 0));
}

export function computeNineGrid(pixels: number[][]): Feature[] {
  const result: Feature[] = [];
  for (let gridRow = 0; gridRow < 3; gridRow += 1) for (let gridCol = 0; gridCol < 3; gridCol += 1) {
    const top = REGION_BOUNDS[gridRow], bottom = REGION_BOUNDS[gridRow + 1], left = REGION_BOUNDS[gridCol], right = REGION_BOUNDS[gridCol + 1];
    let count = 0;
    for (let row = top; row < bottom; row += 1) for (let col = left; col < right; col += 1) if ((pixels[row]?.[col] ?? 0) > 0) count += 1;
    const capacity = (bottom - top) * (right - left);
    result.push({ count, capacity, density: count / capacity, label: REGION_LABELS[gridRow * 3 + gridCol] });
  }
  return result;
}

export function pickPracticeRegion(features: Feature[]) {
  let best = -1, bestCount = Infinity;
  features.forEach((feature, index) => { if (feature.count > 0 && index !== 0 && feature.count < bestCount) { best = index; bestCount = feature.count; } });
  if (best >= 0) return best;
  features.forEach((feature, index) => { if (feature.count > 0 && feature.count < bestCount) { best = index; bestCount = feature.count; } });
  return best >= 0 ? best : features.reduce((max, feature, index) => feature.count > features[max].count ? index : max, 0);
}

let datasetPromise: Promise<DatasetRow[]> | null = null;
export function loadDataset() {
  if (!datasetPromise) datasetPromise = Promise.all(SAMPLES.map(async (sample) => {
    const pixels = imageToPixels(await loadImage(sample));
    return { sample, pixels, features: computeNineGrid(pixels) };
  }));
  return datasetPromise;
}

export function rawFeatureVector(row: DatasetRow) { return row.features.map((feature) => feature.count); }
export function buildFeatureNormalizer(rows: DatasetRow[]): Normalizer {
  const mean = Array(9).fill(0) as number[];
  rows.forEach((row) => rawFeatureVector(row).forEach((value, index) => { mean[index] += value / rows.length; }));
  const variance = Array(9).fill(0) as number[];
  rows.forEach((row) => rawFeatureVector(row).forEach((value, index) => { variance[index] += ((value - mean[index]) ** 2) / rows.length; }));
  return { mean, std: variance.map((value) => Math.sqrt(value) || 1) };
}
export function modelFeatureVector(row: DatasetRow, model: MlpModel) { return rawFeatureVector(row).map((value, index) => Math.max(-3, Math.min(3, (value - model.normalizer.mean[index]) / model.normalizer.std[index]))); }
export function createMlpModel(rows: DatasetRow[]): MlpModel {
  let seed = 1337;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const weight = (scale: number) => (rand() * 2 - 1) * scale;
  const hidden = 18;
  return {
    hidden, normalizer: buildFeatureNormalizer(rows),
    w1: Array.from({ length: hidden }, () => Array.from({ length: 9 }, () => weight(.38))),
    b1: Array.from({ length: hidden }, () => weight(.02)),
    w2: Array.from({ length: 10 }, () => Array.from({ length: hidden }, () => weight(.26))),
    b2: Array(10).fill(0), trained: false, accuracy: 0,
  };
}
export function softmax(logits: number[]) { const max = Math.max(...logits); const values = logits.map((value) => Math.exp(value - max)); const total = values.reduce((sum, value) => sum + value, 0) || 1; return values.map((value) => value / total); }
export function mlpForward(model: MlpModel, input: number[]) {
  const hidden = model.w1.map((weights, h) => Math.tanh(model.b1[h] + weights.reduce((sum, weight, i) => sum + weight * input[i], 0)));
  const logits = model.w2.map((weights, digit) => model.b2[digit] + weights.reduce((sum, weight, h) => sum + weight * hidden[h], 0));
  return { hidden, logits, probs: softmax(logits) };
}
export function trainMlpStep(model: MlpModel, row: DatasetRow, rate = .025) {
  const input = modelFeatureVector(row, model), output = mlpForward(model, input), deltaOut = [...output.probs]; deltaOut[row.sample.label] -= 1;
  const deltaHidden = output.hidden.map((value, h) => deltaOut.reduce((sum, delta, digit) => sum + delta * model.w2[digit][h], 0) * (1 - value * value));
  model.w2.forEach((weights, digit) => { weights.forEach((_, h) => { weights[h] -= rate * deltaOut[digit] * output.hidden[h]; }); model.b2[digit] -= rate * deltaOut[digit]; });
  model.w1.forEach((weights, h) => { weights.forEach((_, i) => { weights[i] -= rate * deltaHidden[h] * input[i]; }); model.b1[h] -= rate * deltaHidden[h]; });
}
export function argmax(values: number[]) { return values.reduce((best, value, index) => value > values[best] ? index : best, 0); }
export function evaluateMlp(model: MlpModel, rows: DatasetRow[]) { return rows.filter((row) => argmax(mlpForward(model, modelFeatureVector(row, model)).probs) === row.sample.label).length / rows.length; }
