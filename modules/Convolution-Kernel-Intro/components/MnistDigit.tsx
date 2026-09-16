import { useCallback, useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { MNIST_IMAGE_SIZE, type MnistPixels } from '../model/mnistLab';
import './MnistDigit.css';

const BACKDROP = '#101623';
const WINDOW_COLOR = '#f07e47';
const PICK_COLOR = '#2f6fd0';

export interface MnistDigitProps {
  pixels: MnistPixels | null;
  /** 滑动窗口的位置；不传则不画窗口。 */
  windowTop?: number | null;
  windowLeft?: number | null;
  /** 滑动窗口的边长（以像素为单位）。 */
  windowSize?: number;
  /** 被点选的像素。 */
  selected?: { row: number; col: number } | null;
  /** 画一层淡淡的像素分隔线，便于逐格点选。 */
  showGrid?: boolean;
  onPickPixel?: (row: number, col: number) => void;
  label?: string;
  className?: string;
}

/** 28 × 28 的灰度画布：既显示数字本身，也显示卷积核此刻落在哪里。 */
export function MnistDigit({
  pixels,
  windowTop = null,
  windowLeft = null,
  windowSize = 5,
  selected = null,
  showGrid = false,
  onPickPixel,
  label,
  className,
}: MnistDigitProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const metricsFor = (width: number, height: number) => {
    const side = Math.max(1, Math.min(width, height) - 2);
    return { side, left: (width - side) / 2, top: (height - side) / 2, cell: side / MNIST_IMAGE_SIZE };
  };

  const draw = useCallback(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return;
    const rect = frame.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const metrics = metricsFor(width, height);
    ctx.fillStyle = BACKDROP;
    ctx.fillRect(metrics.left, metrics.top, metrics.side, metrics.side);
    if (pixels && pixels.length === MNIST_IMAGE_SIZE) {
      ctx.imageSmoothingEnabled = false;
      for (let row = 0; row < MNIST_IMAGE_SIZE; row += 1) {
        const line = pixels[row];
        for (let col = 0; col < MNIST_IMAGE_SIZE; col += 1) {
          const shade = Math.round(Math.max(0, Math.min(1, line[col] ?? 0)) * 255);
          ctx.fillStyle = 'rgb(' + shade + ',' + shade + ',' + shade + ')';
          ctx.fillRect(
            metrics.left + col * metrics.cell,
            metrics.top + row * metrics.cell,
            metrics.cell + 0.6,
            metrics.cell + 0.6,
          );
        }
      }
    }
    if (showGrid) {
      ctx.strokeStyle = 'rgba(160, 186, 220, 0.22)';
      ctx.lineWidth = 1;
      for (let index = 1; index < MNIST_IMAGE_SIZE; index += 1) {
        const offset = index * metrics.cell;
        ctx.beginPath();
        ctx.moveTo(metrics.left + offset, metrics.top);
        ctx.lineTo(metrics.left + offset, metrics.top + metrics.side);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(metrics.left, metrics.top + offset);
        ctx.lineTo(metrics.left + metrics.side, metrics.top + offset);
        ctx.stroke();
      }
    }
    if (selected) {
      ctx.strokeStyle = PICK_COLOR;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        metrics.left + selected.col * metrics.cell + 1,
        metrics.top + selected.row * metrics.cell + 1,
        metrics.cell - 2,
        metrics.cell - 2,
      );
    }
    if (windowTop !== null && windowLeft !== null) {
      ctx.strokeStyle = WINDOW_COLOR;
      ctx.lineWidth = Math.max(2, metrics.cell * 0.34);
      ctx.strokeRect(
        metrics.left + windowLeft * metrics.cell + ctx.lineWidth / 2,
        metrics.top + windowTop * metrics.cell + ctx.lineWidth / 2,
        windowSize * metrics.cell - ctx.lineWidth,
        windowSize * metrics.cell - ctx.lineWidth,
      );
    }
  }, [pixels, selected, showGrid, windowLeft, windowSize, windowTop]);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    draw();
    const observer = new ResizeObserver(() => draw());
    observer.observe(frame);
    return () => observer.disconnect();
  }, [draw]);

  const resolveCell = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const frame = frameRef.current;
    if (!frame) return null;
    const rect = frame.getBoundingClientRect();
    const metrics = metricsFor(rect.width, rect.height);
    const col = Math.floor((event.clientX - rect.left - metrics.left) / metrics.cell);
    const row = Math.floor((event.clientY - rect.top - metrics.top) / metrics.cell);
    if (row < 0 || row >= MNIST_IMAGE_SIZE || col < 0 || col >= MNIST_IMAGE_SIZE) return null;
    return { row, col };
  };

  return (
    <div
      className={['ck-digit-frame', onPickPixel && 'is-pickable', className].filter(Boolean).join(' ')}
      ref={frameRef}
    >
      <canvas
        ref={canvasRef}
        aria-label={label ?? '28 × 28 的手写数字像素'}
        onPointerDown={(event) => {
          if (!onPickPixel) return;
          const cell = resolveCell(event);
          if (!cell) return;
          event.preventDefault();
          onPickPixel(cell.row, cell.col);
        }}
      />
    </div>
  );
}

