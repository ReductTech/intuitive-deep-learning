export const MNIST_INK_THRESHOLD = 128;

export type InkPixel = readonly [number, number];

export type MnistFeatures = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  ink: number;
  centerX: number;
  centerY: number;
  pixels: InkPixel[];
};

/** Measure the same four binary-ink descriptors on the original 28×28 image. */
export function measureMnistImage(image: HTMLImageElement): MnistFeatures | null {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels: InkPixel[] = [];
  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = -1;
  let maxY = -1;
  let sumX = 0;
  let sumY = 0;

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const offset = (y * canvas.width + x) * 4;
      const intensity = (data[offset] + data[offset + 1] + data[offset + 2]) / 3;
      if (intensity < MNIST_INK_THRESHOLD) continue;
      pixels.push([x, y]);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      sumX += x;
      sumY += y;
    }
  }

  if (pixels.length === 0) return null;
  return {
    minX, minY, maxX, maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    ink: pixels.length,
    centerX: sumX / pixels.length,
    centerY: sumY / pixels.length,
    pixels,
  };
}
