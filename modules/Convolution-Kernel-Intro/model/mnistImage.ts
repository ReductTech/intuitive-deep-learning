/**
 * 把 MNIST 图片读成 28 × 28 的灰度像素。
 *
 * 这里刻意用原图缩小到 28 × 28 再取值，和旧模块使用同一批图片文件，
 * 不复制资源、也不生成假的像素数据。
 */
import { MNIST_IMAGE_SIZE, type MnistPixels } from './mnistLab';

export function loadMnistPixels(url: string): Promise<MnistPixels> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'sync';
    image.onload = () => {
      try {
        const scratch = document.createElement('canvas');
        scratch.width = MNIST_IMAGE_SIZE;
        scratch.height = MNIST_IMAGE_SIZE;
        const ctx = scratch.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建读取像素的画布'));
          return;
        }
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, MNIST_IMAGE_SIZE, MNIST_IMAGE_SIZE);
        ctx.drawImage(image, 0, 0, MNIST_IMAGE_SIZE, MNIST_IMAGE_SIZE);
        const data = ctx.getImageData(0, 0, MNIST_IMAGE_SIZE, MNIST_IMAGE_SIZE).data;
        const pixels: MnistPixels = [];
        for (let row = 0; row < MNIST_IMAGE_SIZE; row += 1) {
          const line: number[] = [];
          for (let col = 0; col < MNIST_IMAGE_SIZE; col += 1) {
            line.push(data[(row * MNIST_IMAGE_SIZE + col) * 4] / 255);
          }
          pixels.push(line);
        }
        resolve(pixels);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('读取像素失败'));
      }
    };
    image.onerror = () => reject(new Error('图片加载失败：' + url));
    image.src = url;
  });
}

