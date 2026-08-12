import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  clamp,
  imageDataToCanvas,
  sampleBounds,
  type PixelPoint,
} from '../model/imageMath';

interface ImageSelectionCanvasProps {
  imageData: ImageData;
  selected: PixelPoint;
  selectionColor: string;
  ariaLabel: string;
  onSelectionDraft: (point: PixelPoint) => void;
  onSelectionCommit: (point: PixelPoint) => void;
}

interface DisplayMapping {
  scale: number;
  offsetX: number;
  offsetY: number;
}

function drawSelectionBox(
  context: CanvasRenderingContext2D,
  mapping: DisplayMapping,
  imageData: ImageData,
  selected: PixelPoint,
  color: string,
) {
  const bounds = sampleBounds(imageData.width, imageData.height, selected);
  const x = mapping.offsetX + bounds.x * mapping.scale;
  const y = mapping.offsetY + bounds.y * mapping.scale;
  const size = bounds.size * mapping.scale;
  context.save();
  context.strokeStyle = color;
  context.lineWidth = Math.max(2, Math.min(5, mapping.scale * 0.7));
  context.setLineDash([
    Math.max(4, mapping.scale * 1.3),
    Math.max(3, mapping.scale * 0.9),
  ]);
  context.strokeRect(x, y, size, size);
  context.setLineDash([]);
  context.strokeStyle = 'rgba(255,255,255,0.92)';
  context.lineWidth = Math.max(1, context.lineWidth - 1);
  context.strokeRect(
    x + 1,
    y + 1,
    Math.max(1, size - 2),
    Math.max(1, size - 2),
  );
  context.restore();
}

function drawSelectionInset(
  context: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  canvasWidth: number,
  canvasHeight: number,
  imageData: ImageData,
  selected: PixelPoint,
  color: string,
) {
  const bounds = sampleBounds(imageData.width, imageData.height, selected);
  const shortSide = Math.min(canvasWidth, canvasHeight);
  const insetSize = Math.min(
    clamp(shortSide * 0.4, 70, 132),
    Math.max(32, shortSide - 18),
  );
  if (insetSize < 28) return;
  const padding = Math.max(8, Math.min(12, shortSide * 0.04));
  const x = canvasWidth - insetSize - padding;
  const y = canvasHeight - insetSize - padding;
  const cell = insetSize / bounds.size;

  context.save();
  context.shadowColor = 'rgba(16,24,40,0.2)';
  context.shadowBlur = 12;
  context.shadowOffsetY = 5;
  context.fillStyle = 'rgba(255,255,255,0.95)';
  context.beginPath();
  context.roundRect(x - 5, y - 5, insetSize + 10, insetSize + 10, 8);
  context.fill();
  context.shadowColor = 'transparent';

  context.save();
  context.beginPath();
  context.roundRect(x, y, insetSize, insetSize, 5);
  context.clip();
  context.imageSmoothingEnabled = false;
  context.drawImage(
    sourceCanvas,
    bounds.x,
    bounds.y,
    bounds.size,
    bounds.size,
    x,
    y,
    insetSize,
    insetSize,
  );
  context.restore();

  context.strokeStyle = color;
  context.lineWidth = 2;
  context.strokeRect(x, y, insetSize, insetSize);
  context.strokeStyle = 'rgba(255,255,255,0.5)';
  context.lineWidth = 1;
  for (let index = 1; index < bounds.size; index += 1) {
    const line = Math.round(index * cell) + 0.5;
    context.beginPath();
    context.moveTo(x + line, y);
    context.lineTo(x + line, y + insetSize);
    context.moveTo(x, y + line);
    context.lineTo(x + insetSize, y + line);
    context.stroke();
  }
  context.restore();
}

export function ImageSelectionCanvas({
  imageData,
  selected,
  selectionColor,
  ariaLabel,
  onSelectionDraft,
  onSelectionCommit,
}: ImageSelectionCanvasProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mappingRef = useRef<DisplayMapping | null>(null);
  const draggingRef = useRef(false);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const sourceCanvas = useMemo(() => imageDataToCanvas(imageData), [imageData]);

  const draw = useCallback(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return;
    const rect = frame.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width || 320));
    const height = Math.max(1, Math.round(rect.height || width));
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#f7faff';
    context.fillRect(0, 0, width, height);

    const scale = Math.min(width / imageData.width, height / imageData.height);
    const drawWidth = imageData.width * scale;
    const drawHeight = imageData.height * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;
    const mapping = { scale, offsetX, offsetY };
    mappingRef.current = mapping;
    context.imageSmoothingEnabled = true;
    context.drawImage(sourceCanvas, offsetX, offsetY, drawWidth, drawHeight);
    drawSelectionBox(
      context,
      mapping,
      imageData,
      selectedRef.current,
      selectionColor,
    );
    drawSelectionInset(
      context,
      sourceCanvas,
      width,
      height,
      imageData,
      selectedRef.current,
      selectionColor,
    );
  }, [imageData, selectionColor, sourceCanvas]);

  useEffect(() => {
    draw();
  }, [draw, selected]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(draw);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [draw]);

  function pointFromEvent(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const mapping = mappingRef.current;
    if (!canvas || !mapping || !mapping.scale) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp(
        Math.round((event.clientX - rect.left - mapping.offsetX) / mapping.scale),
        0,
        imageData.width - 1,
      ),
      y: clamp(
        Math.round((event.clientY - rect.top - mapping.offsetY) / mapping.scale),
        0,
        imageData.height - 1,
      ),
    };
  }

  function draftFromEvent(event: ReactPointerEvent<HTMLCanvasElement>) {
    const point = pointFromEvent(event);
    if (!point) return;
    selectedRef.current = point;
    onSelectionDraft(point);
  }

  return (
    <div className="edu-canvas-frame di-canvas-frame--image" ref={frameRef}>
      <canvas
        ref={canvasRef}
        aria-label={ariaLabel}
        onPointerDown={(event) => {
          draggingRef.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          draftFromEvent(event);
        }}
        onPointerMove={(event) => {
          if (draggingRef.current) draftFromEvent(event);
        }}
        onPointerUp={(event) => {
          const point = pointFromEvent(event) ?? selectedRef.current;
          draggingRef.current = false;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          onSelectionCommit(point);
        }}
        onPointerCancel={(event) => {
          draggingRef.current = false;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
      />
    </div>
  );
}

