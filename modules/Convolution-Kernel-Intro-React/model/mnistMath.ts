import { cloneMatrix, type Matrix } from './kernelMath';

export const MNIST_SIZE = 28;

export const MNIST_SAMPLES = [
  'dataset/mnist/0/60003.png', 'dataset/mnist/0/60010.png', 'dataset/mnist/0/60013.png', 'dataset/mnist/0/60025.png', 'dataset/mnist/0/60028.png',
  'dataset/mnist/1/60002.png', 'dataset/mnist/1/60005.png', 'dataset/mnist/1/60014.png', 'dataset/mnist/1/60029.png', 'dataset/mnist/1/60031.png',
  'dataset/mnist/2/60001.png', 'dataset/mnist/2/60035.png', 'dataset/mnist/2/60038.png', 'dataset/mnist/2/60043.png', 'dataset/mnist/2/60047.png',
  'dataset/mnist/3/60018.png', 'dataset/mnist/3/60030.png', 'dataset/mnist/3/60032.png', 'dataset/mnist/3/60044.png', 'dataset/mnist/3/60051.png',
  'dataset/mnist/4/60004.png', 'dataset/mnist/4/60006.png', 'dataset/mnist/4/60019.png', 'dataset/mnist/4/60024.png', 'dataset/mnist/4/60027.png',
  'dataset/mnist/5/60008.png', 'dataset/mnist/5/60015.png', 'dataset/mnist/5/60023.png', 'dataset/mnist/5/60045.png', 'dataset/mnist/5/60052.png',
  'dataset/mnist/6/60011.png', 'dataset/mnist/6/60021.png', 'dataset/mnist/6/60022.png', 'dataset/mnist/6/60050.png', 'dataset/mnist/6/60054.png',
  'dataset/mnist/7/60000.png', 'dataset/mnist/7/60017.png', 'dataset/mnist/7/60026.png', 'dataset/mnist/7/60034.png', 'dataset/mnist/7/60036.png',
  'dataset/mnist/8/60061.png', 'dataset/mnist/8/60084.png', 'dataset/mnist/8/60110.png', 'dataset/mnist/8/60128.png', 'dataset/mnist/8/60134.png',
  'dataset/mnist/9/60007.png', 'dataset/mnist/9/60009.png', 'dataset/mnist/9/60012.png', 'dataset/mnist/9/60016.png', 'dataset/mnist/9/60020.png',
] as const;

export const MNIST_KERNELS = {
  vertical: {
    label: '竖线',
    matrix: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]],
  },
  horizontal: {
    label: '横线',
    matrix: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]],
  },
  edge: {
    label: '边缘',
    matrix: [[0, -1, 0], [-1, 4, -1], [0, -1, 0]],
  },
} as const;

export type FixedMnistKernelKey = keyof typeof MNIST_KERNELS;
export type MnistKernelKey = 'user' | FixedMnistKernelKey | 'custom';

export const DEFAULT_CUSTOM_KERNEL: Matrix = [
  [0, 0, 0],
  [0, 1, 0],
  [0, 0, 0],
];

export function blankPixels(size = MNIST_SIZE): Matrix {
  return Array.from({ length: size }, () => Array<number>(size).fill(0));
}

export function imageDataToMnistPixels(
  data: ArrayLike<number>,
  size = MNIST_SIZE,
): Matrix {
  return Array.from(
    { length: size },
    (_, row) => Array.from(
      { length: size },
      (_, col) => (data[(row * size + col) * 4] ?? 0) / 255,
    ),
  );
}

export function chooseRandomMnistSample(
  previous: string | null = null,
  random: () => number = Math.random,
): string {
  const candidates = previous
    ? MNIST_SAMPLES.filter((sample) => sample !== previous)
    : [...MNIST_SAMPLES];
  return candidates[Math.floor(random() * candidates.length)] ?? MNIST_SAMPLES[0];
}

export function mnistLabelFromPath(path: string): string {
  return path.replace(/\\/g, '/').split('/')[2] ?? '-';
}

export function convolveMnistAt(
  pixels: readonly (readonly number[])[],
  top: number,
  left: number,
  kernel: readonly (readonly number[])[],
): number {
  let sum = 0;
  for (let row = 0; row < kernel.length; row += 1) {
    for (let col = 0; col < (kernel[row]?.length ?? 0); col += 1) {
      sum += (pixels[top + row]?.[left + col] ?? 0) * (kernel[row]?.[col] ?? 0);
    }
  }
  return sum;
}

export function outputFeatureSize(
  kernel: readonly (readonly number[])[],
  inputSize = MNIST_SIZE,
): number {
  return Math.max(0, inputSize - kernel.length + 1);
}

export function convolveMnist(
  pixels: readonly (readonly number[])[],
  kernel: readonly (readonly number[])[],
): Matrix {
  const inputSize = pixels.length || MNIST_SIZE;
  const size = outputFeatureSize(kernel, inputSize);
  return Array.from(
    { length: size },
    (_, row) => Array.from(
      { length: size },
      (_, col) => convolveMnistAt(pixels, row, col, kernel),
    ),
  );
}

export function flattenFeatureMap(featureMap: readonly (readonly number[])[]): number[] {
  return featureMap.flatMap((row) => [...row]);
}

export function featureAlpha(value: number, featureValues: readonly number[]): number {
  const maxAbs = featureValues.reduce(
    (maximum, item) => Math.max(maximum, Math.abs(item)),
    0,
  ) || 1;
  return Math.max(0.08, Math.min(1, Math.abs(value) / maxAbs));
}

export function featureColor(value: number, featureValues: readonly number[]): string {
  return `rgba(39, 68, 110, ${featureAlpha(value, featureValues).toFixed(3)})`;
}

export function resizeCustomKernel(
  kernel: readonly (readonly number[])[],
  size: 3 | 5,
): Matrix {
  const next = Array.from(
    { length: size },
    (_, row) => Array.from(
      { length: size },
      (_, col) => Number.isFinite(kernel[row]?.[col]) ? kernel[row][col] : 0,
    ),
  );
  if (!next.some((row) => row.some((value) => value !== 0))) {
    const center = Math.floor(size / 2);
    next[center][center] = 1;
  }
  return next;
}

export function updateCustomKernelCell(
  kernel: readonly (readonly number[])[],
  row: number,
  col: number,
  value: number,
): Matrix {
  const next = cloneMatrix(kernel);
  if (next[row]?.[col] === undefined) return next;
  next[row][col] = Number.isFinite(value) ? Math.max(-9, Math.min(9, value)) : 0;
  return next;
}

export function currentMnistKernel(
  key: MnistKernelKey,
  userKernel: readonly (readonly number[])[],
  customKernel: readonly (readonly number[])[] = DEFAULT_CUSTOM_KERNEL,
): Matrix {
  if (key === 'user') return cloneMatrix(userKernel);
  if (key === 'custom') return cloneMatrix(customKernel);
  return cloneMatrix(MNIST_KERNELS[key].matrix);
}
