import { moduleAssetUrl } from '../../shared/react';
import { MNIST_INK_THRESHOLD } from './mnistFeatures';

export const NINE_GRID_IMAGE_SIZE = 28;
export const NINE_GRID_EDGES = [0, 9, 18, 28] as const;
export const NINE_GRID_IMAGE_URL = moduleAssetUrl('80396753-7fc8-4f55-9188-bddbdb828169', 'mnist/2/60035.png');

export type NineGridCell = { x: number; y: number; ink: boolean; rank: number };

export function readNineGridPixels(image: HTMLImageElement): boolean[] | null {
  const canvas = document.createElement('canvas');
  canvas.width = NINE_GRID_IMAGE_SIZE;
  canvas.height = NINE_GRID_IMAGE_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(image, 0, 0, NINE_GRID_IMAGE_SIZE, NINE_GRID_IMAGE_SIZE);
  const data = context.getImageData(0, 0, NINE_GRID_IMAGE_SIZE, NINE_GRID_IMAGE_SIZE).data;
  return Array.from({ length: NINE_GRID_IMAGE_SIZE * NINE_GRID_IMAGE_SIZE }, (_, index) => {
    const offset = index * 4;
    return (data[offset] + data[offset + 1] + data[offset + 2]) / 3 >= MNIST_INK_THRESHOLD;
  });
}

export function nineGridRegionCells(pixels: boolean[], region: number): NineGridCell[] {
  const col = region % 3;
  const row = Math.floor(region / 3);
  const cells: NineGridCell[] = [];
  let rank = 0;
  for (let y = NINE_GRID_EDGES[row]; y < NINE_GRID_EDGES[row + 1]; y += 1) {
    for (let x = NINE_GRID_EDGES[col]; x < NINE_GRID_EDGES[col + 1]; x += 1) {
      const ink = pixels[y * NINE_GRID_IMAGE_SIZE + x];
      cells.push({ x, y, ink, rank: ink ? rank++ : -1 });
    }
  }
  return cells;
}

export function nineGridCounts(pixels: boolean[]): number[] {
  return Array.from({ length: 9 }, (_, index) => nineGridRegionCells(pixels, index).filter((cell) => cell.ink).length);
}
