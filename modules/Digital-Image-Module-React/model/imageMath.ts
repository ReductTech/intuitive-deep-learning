export const MAX_IMAGE_SIDE = 512;
export const SAMPLE_SIZE = 3;
const MAX_SNAPSHOT_LENGTH = 720_000;

export interface PixelPoint {
  x: number;
  y: number;
}

export interface SampleBounds extends PixelPoint {
  size: number;
}

export function clamp(value: number, low: number, high: number) {
  return Math.max(low, Math.min(high, value));
}

export function unitToByte(value: number) {
  return Math.round(clamp(value, 0, 1) * 255);
}

export function formatUnit(value: number) {
  return Number(value).toFixed(2);
}

function canvas2d(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function createDemoImageData() {
  const width = 384;
  const height = 256;
  const canvas = canvas2d(width, height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('当前浏览器无法创建图片画布。');

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#c43f52');
  gradient.addColorStop(0.45, '#f0d16a');
  gradient.addColorStop(1, '#27446e');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.fillStyle = 'rgba(34,141,92,0.92)';
  context.beginPath();
  context.arc(width * 0.36, height * 0.47, height * 0.28, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = 'rgba(255,255,255,0.86)';
  context.fillRect(width * 0.58, height * 0.22, width * 0.24, height * 0.46);
  context.fillStyle = 'rgba(39,68,110,0.7)';
  for (let index = 0; index < 8; index += 1) {
    context.fillRect(
      width * 0.08 + index * width * 0.08,
      height * 0.76,
      width * 0.035,
      height * 0.11,
    );
  }
  return context.getImageData(0, 0, width, height);
}

export function imageElementToImageData(image: HTMLImageElement) {
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;
  const scale = Math.min(
    1,
    MAX_IMAGE_SIDE / Math.max(naturalWidth, naturalHeight),
  );
  const width = Math.max(1, Math.round(naturalWidth * scale));
  const height = Math.max(1, Math.round(naturalHeight * scale));
  const canvas = canvas2d(width, height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('当前浏览器无法读取这张图片。');
  context.drawImage(image, 0, 0, width, height);
  return context.getImageData(0, 0, width, height);
}

export function imageDataToCanvas(imageData: ImageData) {
  const canvas = canvas2d(imageData.width, imageData.height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('当前浏览器无法创建图片画布。');
  context.putImageData(imageData, 0, 0);
  return canvas;
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('无法恢复此前保存的图片。'));
    image.src = dataUrl;
  });
}

export async function dataUrlToImageData(dataUrl: string) {
  const image = await loadImage(dataUrl);
  const canvas = canvas2d(image.naturalWidth || image.width, image.naturalHeight || image.height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('当前浏览器无法恢复图片画布。');
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

export interface NormalizedImageSnapshot {
  dataUrl: string;
  imageData: ImageData;
}

/**
 * The persisted snapshot is deliberately normalized before it is displayed.
 * The live matrices and the restored matrices therefore read the same pixels.
 */
export async function normalizeImageForSnapshot(
  source: ImageData,
): Promise<NormalizedImageSnapshot> {
  let canvas = imageDataToCanvas(source);
  let quality = 0.92;
  let dataUrl = canvas.toDataURL('image/webp', quality);

  if (!dataUrl.startsWith('data:image/webp')) {
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  if (dataUrl.length > MAX_SNAPSHOT_LENGTH) {
    const maxSide = 384;
    const scale = Math.min(1, maxSide / Math.max(canvas.width, canvas.height));
    const resized = canvas2d(
      Math.max(1, Math.round(canvas.width * scale)),
      Math.max(1, Math.round(canvas.height * scale)),
    );
    const context = resized.getContext('2d');
    if (!context) throw new Error('当前浏览器无法压缩图片快照。');
    context.drawImage(canvas, 0, 0, resized.width, resized.height);
    canvas = resized;
    quality = 0.84;
    dataUrl = canvas.toDataURL('image/webp', quality);
    if (!dataUrl.startsWith('data:image/webp')) {
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
  }

  if (dataUrl.length > MAX_SNAPSHOT_LENGTH) {
    throw new Error('图片内容过于复杂，请选择尺寸更小的图片。');
  }

  return {
    dataUrl,
    imageData: await dataUrlToImageData(dataUrl),
  };
}

export function buildChannelImageData(
  source: ImageData,
  channelIndex: 0 | 1 | 2,
) {
  const output = new ImageData(source.width, source.height);
  for (let index = 0; index < source.data.length; index += 4) {
    const value = source.data[index + channelIndex];
    output.data[index] = value;
    output.data[index + 1] = value;
    output.data[index + 2] = value;
    output.data[index + 3] = source.data[index + 3];
  }
  return output;
}

export function sampleBounds(
  width: number,
  height: number,
  selected: PixelPoint,
): SampleBounds {
  const half = Math.floor(SAMPLE_SIZE / 2);
  return {
    x: clamp(
      Math.round(selected.x) - half,
      0,
      Math.max(0, width - SAMPLE_SIZE),
    ),
    y: clamp(
      Math.round(selected.y) - half,
      0,
      Math.max(0, height - SAMPLE_SIZE),
    ),
    size: Math.min(SAMPLE_SIZE, width, height),
  };
}

export function pixelAt(imageData: ImageData, x: number, y: number) {
  const safeX = clamp(Math.round(x), 0, imageData.width - 1);
  const safeY = clamp(Math.round(y), 0, imageData.height - 1);
  const index = (safeY * imageData.width + safeX) * 4;
  return [
    imageData.data[index],
    imageData.data[index + 1],
    imageData.data[index + 2],
  ] as const;
}

