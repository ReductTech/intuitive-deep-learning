import { clamp, type PixelPoint } from './imageMath';

export type MatrixScaleMode = '255' | 'unit';
export type MatrixSourceKind = 'none' | 'demo' | 'upload';

export interface ImageMatrixSnapshot {
  version: 1;
  sourceKind: MatrixSourceKind;
  imageDataUrl: string | null;
  imageWidth: number;
  imageHeight: number;
  selected: PixelPoint;
  scaleMode: MatrixScaleMode;
  splitDone: boolean;
}

export function createInitialImageMatrixSnapshot(): ImageMatrixSnapshot {
  return {
    version: 1,
    sourceKind: 'none',
    imageDataUrl: null,
    imageWidth: 0,
    imageHeight: 0,
    selected: { x: 0, y: 0 },
    scaleMode: '255',
    splitDone: false,
  };
}

export function normalizeImageMatrixSnapshot(
  value: unknown,
): ImageMatrixSnapshot | null {
  if (typeof value !== 'object' || value === null) return null;
  const source = value as Partial<ImageMatrixSnapshot>;
  const sourceKind = source.sourceKind;
  if (!['none', 'demo', 'upload'].includes(String(sourceKind))) return null;
  const imageWidth = Number(source.imageWidth);
  const imageHeight = Number(source.imageHeight);
  const selectedX = Number(source.selected?.x);
  const selectedY = Number(source.selected?.y);
  const imageDataUrl = typeof source.imageDataUrl === 'string'
    && source.imageDataUrl.startsWith('data:image/')
    ? source.imageDataUrl
    : null;

  if (
    sourceKind === 'upload'
    && (!imageDataUrl || imageWidth < 1 || imageHeight < 1)
  ) {
    return null;
  }
  if (
    sourceKind === 'demo'
    && (imageWidth < 1 || imageHeight < 1)
  ) {
    return null;
  }

  return {
    version: 1,
    sourceKind: sourceKind as MatrixSourceKind,
    imageDataUrl,
    imageWidth: Number.isFinite(imageWidth) ? Math.max(0, Math.round(imageWidth)) : 0,
    imageHeight: Number.isFinite(imageHeight) ? Math.max(0, Math.round(imageHeight)) : 0,
    selected: {
      x: Number.isFinite(selectedX)
        ? clamp(Math.round(selectedX), 0, Math.max(0, imageWidth - 1))
        : 0,
      y: Number.isFinite(selectedY)
        ? clamp(Math.round(selectedY), 0, Math.max(0, imageHeight - 1))
        : 0,
    },
    scaleMode: source.scaleMode === 'unit' ? 'unit' : '255',
    splitDone: source.splitDone === true && sourceKind !== 'none',
  };
}

