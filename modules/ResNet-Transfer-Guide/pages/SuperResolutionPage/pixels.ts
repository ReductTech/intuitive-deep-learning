export interface ResidualPixels {
  size: number;
  lowSize: number;
  target: Uint8ClampedArray;
  baseline: Uint8ClampedArray;
  residual: Int16Array;
  visualization: Uint8ClampedArray;
}

function canvas(width: number, height = width) {
  const element = document.createElement('canvas'); element.width = width; element.height = height;
  const context = element.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('浏览器暂不支持像素实验。');
  return { element, context };
}

// Sample the photo at the right of the user's reference, not its stylized residual.
// This is deterministic runtime image processing, not a generated SR prediction.
export function preparePixels(source: HTMLImageElement): ResidualPixels {
  const full = canvas(source.naturalWidth, source.naturalHeight); full.context.drawImage(source, 0, 0);
  const bytes = full.context.getImageData(0, 0, full.element.width, full.element.height).data;
  let left = source.naturalWidth, right = 0, top = source.naturalHeight, bottom = 0;
  for (let y = 0; y < source.naturalHeight; y++) for (let x = Math.floor(source.naturalWidth * .7); x < source.naturalWidth; x++) {
    const offset = (y * source.naturalWidth + x) * 4;
    if (Math.max(bytes[offset], bytes[offset + 1], bytes[offset + 2]) > 16) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
  }
  if (left >= right || top >= bottom) throw new Error('参考图中的目标照片未能读取。');
  const side = Math.min(right - left + 1, bottom - top + 1);
  const size = 256, lowSize = 32;
  const high = canvas(size); high.context.drawImage(source, left + (right - left + 1 - side) / 2, top + (bottom - top + 1 - side) / 2, side, side, 0, 0, size, size);
  const low = canvas(lowSize); low.context.imageSmoothingEnabled = true; low.context.imageSmoothingQuality = 'high'; low.context.drawImage(high.element, 0, 0, lowSize, lowSize);
  const base = canvas(size); base.context.imageSmoothingEnabled = true; base.context.imageSmoothingQuality = 'high'; base.context.drawImage(low.element, 0, 0, size, size);
  const target = high.context.getImageData(0, 0, size, size).data;
  const baseline = base.context.getImageData(0, 0, size, size).data;
  const residual = new Int16Array(target.length), visualization = new Uint8ClampedArray(target.length);
  for (let i = 0; i < target.length; i++) {
    if (i % 4 === 3) { residual[i] = 0; visualization[i] = 255; }
    else { residual[i] = target[i] - baseline[i]; visualization[i] = 128 + residual[i] * 2; }
  }
  return { size, lowSize, target, baseline, residual, visualization };
}

export function reconstructPixels(data: ResidualPixels, strength: number) {
  const bytes = new Uint8ClampedArray(data.baseline.length);
  let error = 0;
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = i % 4 === 3 ? 255 : Math.round(data.baseline[i] + strength / 100 * data.residual[i]);
    if (i % 4 !== 3) error += Math.abs(bytes[i] - data.target[i]);
  }
  return { bytes, meanError: error / (data.size * data.size * 3) };
}
