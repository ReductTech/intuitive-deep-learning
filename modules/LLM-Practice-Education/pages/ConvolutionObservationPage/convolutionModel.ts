export const IMAGE_SIZE = 256;
export const TILE_SIZE = 16;
export const TILES_PER_ROW = IMAGE_SIZE / TILE_SIZE;
export const TILE_COUNT = TILES_PER_ROW ** 2;
export const TILE_DURATION_MS = 20;
export const RESULT_HOLD_MS = 2500;
export const SCAN_DURATION_MS = TILE_COUNT * TILE_DURATION_MS;
export const CYCLE_DURATION_MS = SCAN_DURATION_MS + RESULT_HOLD_MS;
export const IMAGE_EXAMPLES = [
  { name: '现代建筑', file: 'building.jpg' },
  { name: '斜拉桥', file: 'bridge.jpg' },
  { name: '山间木屋', file: 'chalet.jpg' },
  { name: '斑马', file: 'zebra.jpg' },
  { name: '菠萝', file: 'pineapple.jpg' },
] as const;
export type KernelDirection = 'vertical' | 'horizontal';

export const KERNELS: Record<KernelDirection, readonly number[]> = {
  vertical: [-1, 0, 1, -2, 0, 2, -1, 0, 1],
  horizontal: [-1, -2, -1, 0, 0, 0, 1, 2, 1],
};

export function rgbaToGray(rgba: Uint8ClampedArray): Float32Array {
  const image = new Float32Array(rgba.length / 4);
  for (let i = 0; i < image.length; i++) {
    image[i] = (rgba[i * 4] * .299 + rgba[i * 4 + 1] * .587 + rgba[i * 4 + 2] * .114) / 255;
  }
  return image;
}

/** Replicated image borders avoid a synthetic outer edge. Magnitudes use a fixed display gain. */
export function edgeMagnitude(image: Float32Array, direction: KernelDirection): Float32Array {
  const result = new Float32Array(image.length);
  const kernel = KERNELS[direction];
  for (let y = 0; y < IMAGE_SIZE; y++) for (let x = 0; x < IMAGE_SIZE; x++) {
    let sum = 0;
    for (let ky = -1; ky <= 1; ky++) for (let kx = -1; kx <= 1; kx++) {
      const sourceX = Math.max(0, Math.min(IMAGE_SIZE - 1, x - kx));
      const sourceY = Math.max(0, Math.min(IMAGE_SIZE - 1, y - ky));
      sum += image[sourceY * IMAGE_SIZE + sourceX] * kernel[(ky + 1) * 3 + kx + 1];
    }
    result[y * IMAGE_SIZE + x] = Math.min(1, Math.abs(sum) * .6);
  }
  return result;
}
