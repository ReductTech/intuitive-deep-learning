import { useEffect, useRef, useState } from 'react';
import { MNIST_SIZE } from '../model/mnistMath';
import type { Matrix } from '../model/kernelMath';

export function MnistConvolutionCanvas({
  pixels,
  row,
  col,
  kernelSize,
}: {
  pixels: Matrix;
  row: number;
  col: number;
  kernelSize: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => setRevision((value) => value + 1));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const side = Math.max(1, Math.min(rect.width || 280, rect.height || rect.width || 280));
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(side * dpr);
    canvas.height = Math.round(side * dpr);
    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingEnabled = false;
    context.fillStyle = '#101623';
    context.fillRect(0, 0, side, side);
    const scale = side / MNIST_SIZE;
    for (let pixelRow = 0; pixelRow < MNIST_SIZE; pixelRow += 1) {
      for (let pixelCol = 0; pixelCol < MNIST_SIZE; pixelCol += 1) {
        const shade = Math.round((pixels[pixelRow]?.[pixelCol] ?? 0) * 255);
        context.fillStyle = `rgb(${shade},${shade},${shade})`;
        context.fillRect(pixelCol * scale, pixelRow * scale, scale + 0.2, scale + 0.2);
      }
    }
    context.strokeStyle = '#f07e47';
    context.lineWidth = Math.max(2, scale * 0.25);
    context.strokeRect(
      col * scale + 1,
      row * scale + 1,
      scale * kernelSize - 2,
      scale * kernelSize - 2,
    );
  }, [col, kernelSize, pixels, revision, row]);

  return <canvas ref={ref} width={280} height={280} aria-label="MNIST 手写数字输入" />;
}
