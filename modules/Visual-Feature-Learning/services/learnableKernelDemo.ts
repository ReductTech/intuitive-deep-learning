export const DIGITS = [
  { value: 3, file: '3/60051.png' },
  { value: 5, file: '5/60008.png' },
  { value: 8, file: '8/60110.png' },
  { value: 9, file: '9/60009.png' },
] as const;

export const IMAGE_SIZE = 28;
const FEATURE_SIZE = IMAGE_SIZE - 2;
const POOL_SIZE = 6;
const FEATURE_COUNT = POOL_SIZE * POOL_SIZE;

export interface DigitSample {
  label: number;
  pixels: number[];
  shiftX: number;
  shiftY: number;
  id: number;
}

export interface LabeledDigit {
  basePixels: number[];
  label: number;
}

export interface KernelModel {
  kernel: number[];
  head: number[][];
  bias: number[];
}

export interface Prediction {
  probabilities: number[];
  label: number;
  features: number[];
  activePatches: number[][];
  response: number[];
}

const ORDER = [0, 1, 2, 3, 1, 0, 3, 2, 0, 2, 1, 3, 2, 3, 0, 1];
const SHIFTS: [number, number][] = [
  [0, 0], [1, 0], [-1, 1], [0, -1],
  [1, 1], [-2, 0], [0, 2], [2, -1],
  [-1, -1], [2, 0], [0, 1], [-2, 1],
  [1, -2], [0, 0], [-1, 0], [1, 2],
];

export function makeSample(images: number[][], index: number): DigitSample {
  const label = ORDER[index % ORDER.length];
  const [shiftX, shiftY] = SHIFTS[index % SHIFTS.length];
  const pixels = translatePixels(images[label], shiftX, shiftY);
  return { label, pixels, shiftX, shiftY, id: index };
}

export function translatePixels(source: number[], shiftX: number, shiftY: number) {
  const pixels = Array.from({ length: IMAGE_SIZE * IMAGE_SIZE }, (_, position) => {
    const x = position % IMAGE_SIZE - shiftX;
    const y = Math.floor(position / IMAGE_SIZE) - shiftY;
    return x >= 0 && x < IMAGE_SIZE && y >= 0 && y < IMAGE_SIZE ? source[y * IMAGE_SIZE + x] : 0;
  });
  return pixels;
}

export function initialModel(): KernelModel {
  return {
    kernel: [.08, -.06, .1, -.03, .14, -.08, .07, .02, -.04],
    head: DIGITS.map((_, c) => Array.from({ length: FEATURE_COUNT }, (_, i) => Math.sin((c + 2) * (i + 3)) * .045)),
    bias: [0, 0, 0, 0],
  };
}

export function predict(model: KernelModel, pixels: number[]): Prediction {
  const response: number[] = [];
  const patches: number[][] = [];
  for (let y = 0; y < FEATURE_SIZE; y++) {
    for (let x = 0; x < FEATURE_SIZE; x++) {
      const patch: number[] = [];
      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) patch.push(pixels[(y + ky) * IMAGE_SIZE + x + kx]);
      }
      patches.push(patch);
      response.push(Math.max(0, patch.reduce((sum, value, i) => sum + value * model.kernel[i], 0)));
    }
  }
  const features: number[] = [];
  const activePatches: number[][] = [];
  for (let regionY = 0; regionY < POOL_SIZE; regionY++) {
    for (let regionX = 0; regionX < POOL_SIZE; regionX++) {
      let bestIndex = -1;
      let bestValue = 0;
      const startY = Math.floor(regionY * FEATURE_SIZE / POOL_SIZE);
      const endY = Math.floor((regionY + 1) * FEATURE_SIZE / POOL_SIZE);
      const startX = Math.floor(regionX * FEATURE_SIZE / POOL_SIZE);
      const endX = Math.floor((regionX + 1) * FEATURE_SIZE / POOL_SIZE);
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const index = y * FEATURE_SIZE + x;
          if (response[index] > bestValue) {
            bestValue = response[index];
            bestIndex = index;
          }
        }
      }
      features.push(bestValue);
      activePatches.push(bestIndex < 0 ? Array(9).fill(0) : patches[bestIndex]);
    }
  }
  const logits = model.head.map((row, c) => row.reduce((sum, weight, i) => sum + weight * features[i], model.bias[c]));
  const shift = Math.max(...logits);
  const exps = logits.map(value => Math.exp(value - shift));
  const total = exps.reduce((sum, value) => sum + value, 0);
  const probabilities = exps.map(value => value / total);
  return { probabilities, label: probabilities.indexOf(Math.max(...probabilities)), features, activePatches, response };
}

export function predictWithLabeledResponses(model: KernelModel, pixels: number[], examples: LabeledDigit[]): Prediction {
  const output = predict(model, pixels);
  if (examples.length === 0) return output;
  const latestByClass = new Map<number, LabeledDigit>();
  for (const example of examples) latestByClass.set(example.label, example);
  const distances = DIGITS.map((_, classIndex) => {
    const example = latestByClass.get(classIndex);
    if (!example) return Infinity;
    let closest = Infinity;
    for (let shiftY = -2; shiftY <= 2; shiftY++) {
      for (let shiftX = -2; shiftX <= 2; shiftX++) {
        const candidate = predict(model, translatePixels(example.basePixels, shiftX, shiftY)).response;
        let distance = 0;
        for (let i = 0; i < candidate.length; i++) {
          const difference = output.response[i] - candidate[i];
          distance += difference * difference;
        }
        closest = Math.min(closest, distance);
      }
    }
    return closest;
  });
  const nearest = Math.min(...distances);
  const scores = distances.map(distance => Number.isFinite(distance) ? Math.exp(-(distance - nearest) * 12) : 0);
  const total = scores.reduce((sum, value) => sum + value, 0);
  const probabilities = total > 0 ? scores.map(value => value / total) : output.probabilities;
  return { ...output, probabilities, label: probabilities.indexOf(Math.max(...probabilities)) };
}

export function trainOnLabel(model: KernelModel, pixels: number[], label: number): KernelModel {
  let next: KernelModel = {
    kernel: [...model.kernel],
    head: model.head.map(row => [...row]),
    bias: [...model.bias],
  };
  for (let step = 0; step < 5; step++) {
    const output = predict(next, pixels);
    const delta = output.probabilities.map((probability, c) => probability - Number(c === label));
    const kernelGrad = next.kernel.map((_, k) =>
      output.features.reduce((sum, feature, region) => {
        if (feature <= 0) return sum;
        const featureGrad = delta.reduce((value, error, c) => value + error * next.head[c][region], 0);
        return sum + featureGrad * output.activePatches[region][k];
      }, 0),
    );
    const head = next.head.map((row, c) => row.map((weight, region) =>
      Math.max(-3, Math.min(3, weight - .18 * delta[c] * output.features[region]))));
    const bias = next.bias.map((value, c) => value - .08 * delta[c]);
    const kernel = next.kernel.map((weight, k) => Math.max(-3, Math.min(3, weight - .11 * kernelGrad[k])));
    next = { kernel, head, bias };
  }
  return next;
}

export function trainWithReplay(model: KernelModel, examples: LabeledDigit[]): KernelModel {
  if (examples.length === 0) return model;
  let next = model;
  const latestByClass = new Map<number, LabeledDigit>();
  for (const example of examples) latestByClass.set(example.label, example);
  const balancedExamples = [...latestByClass.values()];
  const trainTranslations = (example: LabeledDigit) => {
    for (let shiftY = -1; shiftY <= 1; shiftY++) {
      for (let shiftX = -1; shiftX <= 1; shiftX++) {
        next = trainOnLabel(next, translatePixels(example.basePixels, shiftX, shiftY), example.label);
      }
    }
  };
  trainTranslations(examples[examples.length - 1]);
  for (let pass = 0; pass < 2; pass++) {
    for (const example of balancedExamples) trainTranslations(example);
  }
  return next;
}
