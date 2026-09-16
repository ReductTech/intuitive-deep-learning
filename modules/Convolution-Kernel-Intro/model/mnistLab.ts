/**
 * 第三幕：把同一套「小矩阵扫描图像」的算法用到手写数字上。
 *
 * 这一层仍然是纯逻辑：样本清单、预设卷积核、逐位相乘的卷积与特征值配色，
 * 都不依赖 DOM 或 React。
 */
import { zeroKernel, type Matrix } from './kernelLab';

export const MNIST_IMAGE_SIZE = 28;

/** 灰度像素，取值为 0 到 1。 */
export type MnistPixels = number[][];

/** 每类 5 张，共 50 张；图片位于仓库根目录的 dataset/mnist/<数字>/。 */
export const MNIST_SAMPLES: readonly string[] = [
  '/dataset/mnist/0/60003.png', '/dataset/mnist/0/60010.png', '/dataset/mnist/0/60013.png', '/dataset/mnist/0/60025.png', '/dataset/mnist/0/60028.png',
  '/dataset/mnist/1/60002.png', '/dataset/mnist/1/60005.png', '/dataset/mnist/1/60014.png', '/dataset/mnist/1/60029.png', '/dataset/mnist/1/60031.png',
  '/dataset/mnist/2/60001.png', '/dataset/mnist/2/60035.png', '/dataset/mnist/2/60038.png', '/dataset/mnist/2/60043.png', '/dataset/mnist/2/60047.png',
  '/dataset/mnist/3/60018.png', '/dataset/mnist/3/60030.png', '/dataset/mnist/3/60032.png', '/dataset/mnist/3/60044.png', '/dataset/mnist/3/60051.png',
  '/dataset/mnist/4/60004.png', '/dataset/mnist/4/60006.png', '/dataset/mnist/4/60019.png', '/dataset/mnist/4/60024.png', '/dataset/mnist/4/60027.png',
  '/dataset/mnist/5/60008.png', '/dataset/mnist/5/60015.png', '/dataset/mnist/5/60023.png', '/dataset/mnist/5/60045.png', '/dataset/mnist/5/60052.png',
  '/dataset/mnist/6/60011.png', '/dataset/mnist/6/60021.png', '/dataset/mnist/6/60022.png', '/dataset/mnist/6/60050.png', '/dataset/mnist/6/60054.png',
  '/dataset/mnist/7/60000.png', '/dataset/mnist/7/60017.png', '/dataset/mnist/7/60026.png', '/dataset/mnist/7/60034.png', '/dataset/mnist/7/60036.png',
  '/dataset/mnist/8/60061.png', '/dataset/mnist/8/60084.png', '/dataset/mnist/8/60110.png', '/dataset/mnist/8/60128.png', '/dataset/mnist/8/60134.png',
  '/dataset/mnist/9/60007.png', '/dataset/mnist/9/60009.png', '/dataset/mnist/9/60012.png', '/dataset/mnist/9/60016.png', '/dataset/mnist/9/60020.png',
];

export type MnistKernelKey = 'user' | 'custom' | 'vertical' | 'horizontal' | 'edge';

export interface MnistKernelPreset {
  label: string;
  /** 预设核的权重：负数表示压制，正数表示增强。 */
  summary: string;
  matrix: Matrix;
}

export const MNIST_KERNELS: Record<'vertical' | 'horizontal' | 'edge', MnistKernelPreset> = {
  vertical: {
    label: '竖线',
    summary: '左列 -1、右列 +1，对竖直的笔画变化最敏感。',
    matrix: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]],
  },
  horizontal: {
    label: '横线',
    summary: '上行 -1、下行 +1，对水平的笔画变化最敏感。',
    matrix: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]],
  },
  edge: {
    label: '边缘',
    summary: '中心 +4、四邻 -1，任何方向的边缘都会留下响应。',
    matrix: [[0, -1, 0], [-1, 4, -1], [0, -1, 0]],
  },
};

export const CUSTOM_KERNEL_SIZE = 3;

export function defaultCustomKernel(): Matrix {
  return zeroKernel(CUSTOM_KERNEL_SIZE);
}

export function kernelKeyLabel(key: MnistKernelKey): string {
  if (key === 'user') return '你在上一页设计的 5 × 5 核';
  if (key === 'custom') return '自定义核';
  return MNIST_KERNELS[key].label;
}

/** 取当前生效的卷积核；用户还没有设计过时给出一个可见的默认核。 */
export function kernelFor(key: MnistKernelKey, userKernel: Matrix, customKernel: Matrix): Matrix {
  if (key === 'user') return userKernel;
  if (key === 'custom') return customKernel;
  return MNIST_KERNELS[key].matrix;
}

export function userKernelReady(userKernel: Matrix): boolean {
  return userKernel.some((line) => line.some((value) => value !== 0));
}

export function sampleDigitLabel(path: string): string {
  const parts = path.split('/');
  return parts.length >= 2 ? parts[parts.length - 2] : '-';
}

export function pickSample(current: string | null): string {
  if (MNIST_SAMPLES.length === 0) return '';
  let next = MNIST_SAMPLES[Math.floor(Math.random() * MNIST_SAMPLES.length)];
  while (MNIST_SAMPLES.length > 1 && next === current) {
    next = MNIST_SAMPLES[Math.floor(Math.random() * MNIST_SAMPLES.length)];
  }
  return next;
}

/** 一个卷积核扫过一次后，特征图的边长。 */
export function featureSizeFor(kernel: Matrix): number {
  const size = kernel.length;
  return Math.max(1, MNIST_IMAGE_SIZE - size + 1);
}

export function convolveAt(pixels: MnistPixels, top: number, left: number, kernel: Matrix): number {
  let sum = 0;
  for (let row = 0; row < kernel.length; row += 1) {
    for (let col = 0; col < kernel.length; col += 1) {
      const line = pixels[top + row];
      const value = line ? line[left + col] : 0;
      sum += (value ?? 0) * kernel[row][col];
    }
  }
  return sum;
}

/** 逐位置扫描出整张特征图，顺序是先行后列。 */
export function featureValuesOf(pixels: MnistPixels, kernel: Matrix): number[] {
  const output = featureSizeFor(kernel);
  const values: number[] = [];
  for (let row = 0; row < output; row += 1) {
    for (let col = 0; col < output; col += 1) {
      values.push(convolveAt(pixels, row, col, kernel));
    }
  }
  return values;
}

export function maxAbsValue(values: readonly number[]): number {
  return values.reduce((max, value) => Math.max(max, Math.abs(value)), 0) || 1;
}

/** 深蓝底、透明度正比于响应强度，负响应同样会被画出来。 */
export function featureColor(value: number, maxAbs: number): string {
  const alpha = Math.max(0.08, Math.min(1, Math.abs(value) / maxAbs));
  return 'rgba(39, 68, 110, ' + alpha.toFixed(3) + ')';
}

export function formatResponse(value: number): string {
  return Math.abs(value).toFixed(2);
}

