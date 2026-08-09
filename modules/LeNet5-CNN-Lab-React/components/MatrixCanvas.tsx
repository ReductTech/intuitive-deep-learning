import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { IMAGE_SIZE, normalizeImage } from '../model/fixedKernelMath';
import type { Matrix } from '../model/lenetTypes';

export interface MatrixCanvasProps {
  matrix: Matrix;
  id?: string;
  className?: string;
  size?: number;
  background?: string;
  heatmap?: boolean;
  margin?: number | 'auto';
  editable?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  onChange?: (matrix: Matrix) => void;
}

interface Point {
  x: number;
  y: number;
}

function canvasDimensions(canvas: HTMLCanvasElement, fallback: number) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width || fallback);
  const height = Math.max(1, rect.height || width || fallback);
  return { width, height };
}

function prepareCanvas(canvas: HTMLCanvasElement, fallback: number, background: string) {
  const { width, height } = canvasDimensions(canvas, fallback);
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  return { context, width, height };
}

function drawMatrix(
  canvas: HTMLCanvasElement,
  matrix: Matrix,
  fallback: number,
  background: string,
  heatmap: boolean,
  margin: number | 'auto',
) {
  const prepared = prepareCanvas(canvas, fallback, background);
  if (!prepared) return;
  const { context, width, height } = prepared;
  const rows = Math.max(1, matrix.length || IMAGE_SIZE);
  const cols = Math.max(1, matrix[0]?.length || IMAGE_SIZE);
  const matrixMax = heatmap
    ? Math.max(0.001, ...matrix.flat().map((value) => Number(value) || 0))
    : 1;
  const contentMargin = margin === 'auto'
    ? Math.max(10, Math.min(width, height) * 0.05)
    : heatmap ? 8 : margin;
  const cell = Math.min((width - contentMargin * 2) / cols, (height - contentMargin * 2) / rows);
  const originX = (width - cell * cols) / 2;
  const originY = (height - cell * rows) / 2;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const value = Math.max(0, Number(matrix[row]?.[col]) || 0);
      let alpha = Math.max(0, Math.min(1, value / matrixMax));
      if (heatmap && alpha > 0) alpha = Math.max(0.12, Math.pow(alpha, 0.72));
      if (alpha <= 0.01) continue;
      context.fillStyle = heatmap
        ? `rgba(224,122,63,${alpha.toFixed(3)})`
        : `rgba(248,251,255,${alpha.toFixed(3)})`;
      context.fillRect(
        originX + col * cell,
        originY + row * cell,
        Math.max(1, Math.ceil(cell - (heatmap ? 1 : 0))),
        Math.max(1, Math.ceil(cell - (heatmap ? 1 : 0))),
      );
    }
  }
}

function pointerPoint(canvas: HTMLCanvasElement, event: ReactPointerEvent<HTMLCanvasElement>): Point {
  const rect = canvas.getBoundingClientRect();
  const dimensions = canvasDimensions(canvas, Math.max(1, rect.width));
  return {
    x: (event.clientX - rect.left) * (dimensions.width / Math.max(1, rect.width)),
    y: (event.clientY - rect.top) * (dimensions.height / Math.max(1, rect.height)),
  };
}

function readDigit(canvas: HTMLCanvasElement): Matrix {
  const scratch = document.createElement('canvas');
  scratch.width = IMAGE_SIZE;
  scratch.height = IMAGE_SIZE;
  const context = scratch.getContext('2d', { willReadFrequently: true });
  if (!context) return normalizeImage([]);
  context.imageSmoothingEnabled = true;
  context.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
  const pixels = context.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE).data;
  return Array.from({ length: IMAGE_SIZE }, (_, row) => (
    Array.from({ length: IMAGE_SIZE }, (_, col) => {
      const index = (row * IMAGE_SIZE + col) * 4;
      const luminance = pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114;
      return Math.max(0, Math.min(1, (luminance - 42) / 170));
    })
  ));
}

export function MatrixCanvas({
  matrix,
  id,
  className,
  size = 336,
  background = '#0b1020',
  heatmap = false,
  margin = 0,
  editable = false,
  disabled = false,
  ariaLabel = editable ? '可手写的 28×28 数字画布' : '矩阵可视化',
  onChange,
}: MatrixCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => setRevision((value) => value + 1));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || drawingRef.current) return;
    drawMatrix(canvas, matrix, size, background, heatmap, margin);
  }, [background, heatmap, margin, matrix, revision, size]);

  function drawStroke(from: Point, to: Point) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const { width, height } = canvasDimensions(canvas, size);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#f8fbff';
    context.lineWidth = Math.max(12, Math.min(width, height) * 0.105);
    context.shadowColor = 'rgba(248,251,255,0.28)';
    context.shadowBlur = context.lineWidth * 0.18;
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
    context.shadowBlur = 0;
  }

  function finishDrawing(event?: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (event && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    onChange?.(readDigit(canvas));
  }

  const style: CSSProperties = {
    display: 'block',
    width: '100%',
    maxWidth: size,
    aspectRatio: '1 / 1',
    touchAction: editable && !disabled ? 'none' : undefined,
    cursor: editable && !disabled ? 'crosshair' : undefined,
  };

  return (
    <canvas
      ref={canvasRef}
      id={id}
      className={className}
      width={size}
      height={size}
      style={style}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (!editable || disabled || (event.button !== undefined && event.button !== 0)) return;
        const point = pointerPoint(event.currentTarget, event);
        drawingRef.current = true;
        lastPointRef.current = point;
        drawStroke(point, point);
        event.currentTarget.setPointerCapture?.(event.pointerId);
        event.preventDefault();
      }}
      onPointerMove={(event) => {
        if (!drawingRef.current || !lastPointRef.current) return;
        const point = pointerPoint(event.currentTarget, event);
        drawStroke(lastPointRef.current, point);
        lastPointRef.current = point;
        event.preventDefault();
      }}
      onPointerUp={(event) => finishDrawing(event)}
      onPointerCancel={(event) => finishDrawing(event)}
      onPointerLeave={(event) => finishDrawing(event)}
    />
  );
}
