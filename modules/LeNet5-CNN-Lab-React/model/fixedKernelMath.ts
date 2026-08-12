import type {
  FixedKernelDefinition,
  FixedKernelId,
  LenetClassifier,
  LenetClassifierSession,
  Matrix,
} from './lenetTypes';

export const IMAGE_SIZE = 28;
export const FEATURE_RESPONSE_SIZE = 26;
export const FEATURE_GRID_SIZE = 8;
export const DIGIT_CLASS_COUNT = 10;
export const DEFAULT_REJECT_LABEL = 10;

export const FIXED_KERNELS: readonly FixedKernelDefinition[] = [
  { id: 'edge', name: '边缘', values: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]] },
  { id: 'vertical', name: '竖边', values: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]] },
  { id: 'horizontal', name: '横边', values: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]] },
  { id: 'diag_down', name: '斜边 /', values: [[0, 1, 2], [-1, 0, 1], [-2, -1, 0]] },
  { id: 'diag_up', name: '斜边 \\', values: [[2, 1, 0], [1, 0, -1], [0, -1, -2]] },
  { id: 'center', name: '中心墨迹', values: [[0, 1, 0], [1, 4, 1], [0, 1, 0]] },
] as const;

const kernelIds = new Set<FixedKernelId>(FIXED_KERNELS.map((kernel) => kernel.id));

export function isFixedKernelId(value: unknown): value is FixedKernelId {
  return typeof value === 'string' && kernelIds.has(value as FixedKernelId);
}

export function normalizeKernelIds(value: unknown): FixedKernelId[] {
  if (!Array.isArray(value)) return ['edge'];
  const result: FixedKernelId[] = [];
  value.forEach((item) => {
    if (isFixedKernelId(item) && !result.includes(item)) result.push(item);
  });
  return result.length ? result.slice(0, FIXED_KERNELS.length) : ['edge'];
}

export function kernelById(id: FixedKernelId) {
  return FIXED_KERNELS.find((kernel) => kernel.id === id) ?? FIXED_KERNELS[0];
}

export function kernelSignature(ids: readonly FixedKernelId[]) {
  return ids.join('|');
}

export function emptyImage(): Matrix {
  return Array.from({ length: IMAGE_SIZE }, () => Array.from({ length: IMAGE_SIZE }, () => 0));
}

export function isMatrix(value: unknown, rows?: number, cols = rows): value is Matrix {
  if (!Array.isArray(value) || (rows !== undefined && value.length !== rows)) return false;
  return value.every((row) => Array.isArray(row)
    && (cols === undefined || row.length === cols)
    && row.every((cell) => Number.isFinite(Number(cell))));
}

export function normalizeImage(value: unknown): Matrix {
  if (!isMatrix(value, IMAGE_SIZE, IMAGE_SIZE)) return emptyImage();
  return value.map((row) => row.map((cell) => Math.max(0, Math.min(1, Number(cell) || 0))));
}

export function imageHasInk(image: Matrix | null | undefined) {
  return Boolean(image?.some((row) => row.some((value) => (Number(value) || 0) > 0.035)));
}

function computeKernelValues(kernelId: FixedKernelId) {
  const values = kernelById(kernelId).values;
  if (kernelId !== 'center') return values;
  return values.map((row) => row.map((value) => value / 8));
}

export function normalizeFeatureMap(matrix: Matrix): Matrix {
  const max = matrix.reduce(
    (outer, row) => row.reduce((inner, value) => Math.max(inner, Number(value) || 0), outer),
    0,
  );
  if (max <= 0.0001) return matrix.map((row) => row.map(() => 0));
  return matrix.map((row) => row.map((value) => Number(((Number(value) || 0) / max).toFixed(3))));
}

/** Mirrors convolve_valid + pool_feature_maps in scripts/lenet5_cnn_service.py. */
export function fixedKernelFeatureMap(
  image: Matrix,
  kernelId: FixedKernelId,
  options: { normalize?: boolean } = {},
): Matrix {
  const kernel = computeKernelValues(kernelId);
  const response: Matrix = [];
  for (let row = 0; row < FEATURE_RESPONSE_SIZE; row += 1) {
    const responseRow: number[] = [];
    for (let col = 0; col < FEATURE_RESPONSE_SIZE; col += 1) {
      let sum = 0;
      for (let kernelRow = 0; kernelRow < 3; kernelRow += 1) {
        for (let kernelCol = 0; kernelCol < 3; kernelCol += 1) {
          sum += (Number(image[row + kernelRow]?.[col + kernelCol]) || 0) * kernel[kernelRow][kernelCol];
        }
      }
      responseRow.push(Math.max(0, sum));
    }
    response.push(responseRow);
  }

  const pooled: Matrix = [];
  for (let pooledRow = 0; pooledRow < FEATURE_GRID_SIZE; pooledRow += 1) {
    const values: number[] = [];
    const rowStart = Math.floor(pooledRow * FEATURE_RESPONSE_SIZE / FEATURE_GRID_SIZE);
    const rowEnd = Math.floor((pooledRow + 1) * FEATURE_RESPONSE_SIZE / FEATURE_GRID_SIZE);
    for (let pooledCol = 0; pooledCol < FEATURE_GRID_SIZE; pooledCol += 1) {
      const colStart = Math.floor(pooledCol * FEATURE_RESPONSE_SIZE / FEATURE_GRID_SIZE);
      const colEnd = Math.floor((pooledCol + 1) * FEATURE_RESPONSE_SIZE / FEATURE_GRID_SIZE);
      let total = 0;
      let count = 0;
      for (let sourceRow = rowStart; sourceRow < rowEnd; sourceRow += 1) {
        for (let sourceCol = colStart; sourceCol < colEnd; sourceCol += 1) {
          total += response[sourceRow][sourceCol];
          count += 1;
        }
      }
      values.push(total / Math.max(1, count));
    }
    pooled.push(values);
  }
  return options.normalize === false ? pooled : normalizeFeatureMap(pooled);
}

export function featureMapsForImage(
  image: Matrix,
  ids: readonly FixedKernelId[],
  options: { normalize?: boolean } = {},
) {
  return ids.reduce<Partial<Record<FixedKernelId, Matrix>>>((maps, id) => {
    maps[id] = fixedKernelFeatureMap(image, id, options);
    return maps;
  }, {});
}

export function flattenFeatureMaps(
  maps: Partial<Record<FixedKernelId, Matrix>>,
  ids: readonly FixedKernelId[],
) {
  const flattened: number[] = [];
  ids.forEach((id) => {
    (maps[id] ?? []).forEach((row) => row.forEach((value) => flattened.push(Number(value) || 0)));
  });
  return flattened;
}

export function softmax(logits: readonly number[]) {
  if (!logits.length) return [];
  const max = Math.max(...logits);
  const exponentials = logits.map((value) => Math.exp(value - max));
  const total = exponentials.reduce((sum, value) => sum + value, 0) || 1;
  return exponentials.map((value) => value / total);
}

export function classifierIsUsable(value: unknown): value is LenetClassifier {
  if (!value || typeof value !== 'object') return false;
  const classifier = value as Partial<LenetClassifier>;
  const rawKernels = classifier.kernels;
  if (
    !Array.isArray(rawKernels)
    || rawKernels.length < 1
    || rawKernels.length > FIXED_KERNELS.length
    || !rawKernels.every(isFixedKernelId)
  ) return false;
  const kernels = normalizeKernelIds(rawKernels);
  if (kernels.length !== rawKernels.length) return false;
  const featureCount = kernels.length * FEATURE_GRID_SIZE * FEATURE_GRID_SIZE;
  const classCount = Number(classifier.class_count);
  return Number.isInteger(classCount)
    && classCount > DIGIT_CLASS_COUNT
    && Array.isArray(classifier.weights)
    && classifier.weights.length === featureCount
    && classifier.weights.every((row) => Array.isArray(row) && row.length === classCount)
    && Array.isArray(classifier.bias)
    && classifier.bias.length === classCount
    && Array.isArray(classifier.mean)
    && classifier.mean.length === featureCount
    && Array.isArray(classifier.std)
    && classifier.std.length === featureCount;
}

export function inferWithClassifier(
  rawFeatureMaps: Partial<Record<FixedKernelId, Matrix>>,
  classifier: LenetClassifier,
) {
  if (!classifierIsUsable(classifier)) return null;
  if (classifier.kernels.some((id) => !rawFeatureMaps[id])) return null;
  const features = flattenFeatureMaps(rawFeatureMaps, classifier.kernels);
  if (features.length !== classifier.weights.length) return null;
  const logits = classifier.bias.map((bias, outputIndex) => {
    let value = Number(bias) || 0;
    features.forEach((feature, featureIndex) => {
      const mean = Number(classifier.mean[featureIndex]) || 0;
      const std = Math.max(0.00001, Number(classifier.std[featureIndex]) || 1);
      value += ((feature - mean) / std) * (Number(classifier.weights[featureIndex]?.[outputIndex]) || 0);
    });
    return value;
  });
  const probs = softmax(logits);
  const prediction = probs.reduce((best, value, index) => value > probs[best] ? index : best, 0);
  return { logits, probs, prediction };
}

export function inferImage(image: Matrix, classifier: LenetClassifier) {
  return inferWithClassifier(
    featureMapsForImage(image, classifier.kernels, { normalize: false }),
    classifier,
  );
}

export function sessionMatchesSelection(
  session: LenetClassifierSession | null | undefined,
  ids: readonly FixedKernelId[],
) {
  if (!session || !classifierIsUsable(session.classifier)) return false;
  const signature = kernelSignature(ids);
  return session.signature === signature
    && kernelSignature(session.selectedKernels) === signature
    && kernelSignature(session.classifier.kernels) === signature;
}

export function classifierReady(
  session: LenetClassifierSession | null | undefined,
  ids: readonly FixedKernelId[],
) {
  return sessionMatchesSelection(session, ids) && Number(session?.valAccuracy) > 0.9;
}

export function classLabel(index: number, rejectLabel = DEFAULT_REJECT_LABEL) {
  return index === rejectLabel ? '_' : String(index);
}
