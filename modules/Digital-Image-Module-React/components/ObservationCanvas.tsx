import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Button } from '../../shared/react';
import { clamp } from '../model/imageMath';

interface ObservationCanvasProps {
  magnifierEnabled: boolean;
  disabled?: boolean;
  onToggleMagnifier: () => void;
}

const ART_WIDTH = 900;
const ART_HEIGHT = 620;

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawArtwork(canvas: HTMLCanvasElement) {
  canvas.width = ART_WIDTH;
  canvas.height = ART_HEIGHT;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;
  const width = ART_WIDTH;
  const height = ART_HEIGHT;

  const sky = context.createLinearGradient(0, 0, width, height);
  sky.addColorStop(0, '#2457d6');
  sky.addColorStop(0.42, '#d84588');
  sky.addColorStop(1, '#f2b15b');
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);

  const glow = context.createRadialGradient(
    width * 0.68,
    height * 0.42,
    12,
    width * 0.68,
    height * 0.42,
    width * 0.45,
  );
  glow.addColorStop(0, 'rgba(255,255,255,0.45)');
  glow.addColorStop(0.44, 'rgba(255,255,255,0.12)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalAlpha = 0.34;
  for (let band = -height; band < width; band += width * 0.075) {
    context.fillStyle = band % 2
      ? 'rgba(255,255,255,0.14)'
      : 'rgba(255,255,255,0.08)';
    context.beginPath();
    context.moveTo(band, height);
    context.lineTo(band + width * 0.08, height);
    context.lineTo(band + width * 0.72, 0);
    context.lineTo(band + width * 0.64, 0);
    context.closePath();
    context.fill();
  }
  context.restore();

  context.save();
  context.shadowColor = 'rgba(16,24,40,0.22)';
  context.shadowBlur = width * 0.025;
  context.shadowOffsetY = width * 0.012;
  context.fillStyle = 'rgba(255,255,255,0.95)';
  context.beginPath();
  context.arc(
    width * 0.72,
    height * 0.44,
    Math.min(width, height) * 0.22,
    0,
    Math.PI * 2,
  );
  context.fill();
  context.restore();

  context.fillStyle = 'rgba(255,255,255,0.56)';
  context.beginPath();
  context.arc(
    width * 0.34,
    height * 0.38,
    Math.min(width, height) * 0.15,
    0,
    Math.PI * 2,
  );
  context.fill();

  context.fillStyle = 'rgba(255,255,255,0.9)';
  roundedRect(
    context,
    width * 0.08,
    height * 0.68,
    width * 0.34,
    height * 0.19,
    14,
  );
  context.fill();
  context.fillStyle = '#c43f52';
  context.fillRect(width * 0.11, height * 0.72, width * 0.08, height * 0.1);
  context.fillStyle = '#228d5c';
  context.fillRect(width * 0.21, height * 0.72, width * 0.08, height * 0.1);
  context.fillStyle = '#27446e';
  context.fillRect(width * 0.31, height * 0.72, width * 0.08, height * 0.1);

  const gray = context.createLinearGradient(width * 0.48, 0, width * 0.9, 0);
  gray.addColorStop(0, '#0b1020');
  gray.addColorStop(0.5, '#9aa7b8');
  gray.addColorStop(1, '#ffffff');
  context.fillStyle = gray;
  roundedRect(
    context,
    width * 0.48,
    height * 0.73,
    width * 0.38,
    height * 0.08,
    10,
  );
  context.fill();

  context.save();
  context.globalAlpha = 0.16;
  for (let x = 0; x < width; x += 3) {
    context.fillStyle = x % 9 === 0
      ? '#c43f52'
      : x % 9 === 3
        ? '#228d5c'
        : '#27446e';
    context.fillRect(x, 0, 1, height);
  }
  context.restore();
}

function drawDisplay(
  display: HTMLCanvasElement,
  artwork: HTMLCanvasElement,
) {
  const rect = display.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  display.width = Math.round(width * dpr);
  display.height = Math.round(height * dpr);
  const context = display.getContext('2d');
  if (!context) return;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  context.drawImage(artwork, 0, 0, width, height);
}

export function ObservationCanvas({
  magnifierEnabled,
  disabled = false,
  onToggleMagnifier,
}: ObservationCanvasProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lensRef = useRef<HTMLCanvasElement | null>(null);
  const artworkRef = useRef<HTMLCanvasElement | null>(null);

  if (!artworkRef.current) {
    artworkRef.current = document.createElement('canvas');
    drawArtwork(artworkRef.current);
  }

  const redraw = useCallback(() => {
    if (!canvasRef.current || !artworkRef.current) return;
    drawDisplay(canvasRef.current, artworkRef.current);
  }, []);

  useEffect(() => {
    redraw();
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(redraw);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [redraw]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape'
        && magnifierEnabled
        && !disabled
      ) {
        onToggleMagnifier();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [disabled, magnifierEnabled, onToggleMagnifier]);

  function drawMagnifier(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (
      !magnifierEnabled
      || !artworkRef.current
      || !lensRef.current
      || !frameRef.current
    ) {
      return;
    }
    const displayRect = event.currentTarget.getBoundingClientRect();
    const frameRect = frameRef.current.getBoundingClientRect();
    const localX = clamp(event.clientX - displayRect.left, 0, displayRect.width);
    const localY = clamp(event.clientY - displayRect.top, 0, displayRect.height);
    const sourceX = Math.round(localX / Math.max(1, displayRect.width) * ART_WIDTH);
    const sourceY = Math.round(localY / Math.max(1, displayRect.height) * ART_HEIGHT);
    const sourceContext = artworkRef.current.getContext('2d', {
      willReadFrequently: true,
    });
    const lens = lensRef.current;
    const lensSize = Math.max(1, Math.round(lens.getBoundingClientRect().width || 180));
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    lens.width = Math.round(lensSize * dpr);
    lens.height = Math.round(lensSize * dpr);
    lens.style.left = `${event.clientX - frameRect.left}px`;
    lens.style.top = `${event.clientY - frameRect.top}px`;
    lens.hidden = false;
    const context = lens.getContext('2d');
    if (!sourceContext || !context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, lensSize, lensSize);
    context.fillStyle = '#0d1320';
    context.fillRect(0, 0, lensSize, lensSize);

    const cells = 9;
    const cellSize = lensSize / cells;
    const sampleStep = Math.max(
      1,
      Math.round(ART_WIDTH / Math.max(1, displayRect.width) * 2),
    );
    const half = Math.floor(cells / 2);
    for (let row = 0; row < cells; row += 1) {
      for (let column = 0; column < cells; column += 1) {
        const pixelX = clamp(
          sourceX + (column - half) * sampleStep,
          0,
          ART_WIDTH - 1,
        );
        const pixelY = clamp(
          sourceY + (row - half) * sampleStep,
          0,
          ART_HEIGHT - 1,
        );
        const rgba = sourceContext.getImageData(pixelX, pixelY, 1, 1).data;
        const x = column * cellSize;
        const y = row * cellSize;
        const gap = Math.max(1, cellSize * 0.08);
        const barWidth = (cellSize - gap * 4) / 3;
        const barHeight = cellSize - gap * 2;
        [
          `rgb(${rgba[0]},0,0)`,
          `rgb(0,${rgba[1]},0)`,
          `rgb(0,0,${rgba[2]})`,
        ].forEach((color, channelIndex) => {
          context.fillStyle = color;
          context.fillRect(
            x + gap + channelIndex * (barWidth + gap),
            y + gap,
            barWidth,
            barHeight,
          );
        });
      }
    }
    context.strokeStyle = 'rgba(255,255,255,0.82)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(lensSize / 2 - 10, lensSize / 2);
    context.lineTo(lensSize / 2 + 10, lensSize / 2);
    context.moveTo(lensSize / 2, lensSize / 2 - 10);
    context.lineTo(lensSize / 2, lensSize / 2 + 10);
    context.stroke();
  }

  return (
    <div
      className={`edu-canvas-frame di-canvas-frame--target${magnifierEnabled ? ' is-magnifying' : ''}`}
      ref={frameRef}
    >
      <canvas
        ref={canvasRef}
        aria-label="用于手机摄像头观察的彩色图像"
        onPointerMove={drawMagnifier}
        onPointerLeave={() => {
          if (lensRef.current) lensRef.current.hidden = true;
        }}
      />
      <Button
        className="di-magnifier-toggle"
        active={magnifierEnabled}
        disabled={disabled}
        aria-pressed={magnifierEnabled}
        aria-controls="digitalImageRgbMagnifier"
        title={magnifierEnabled ? '关闭 RGB 子像素放大镜' : '打开 RGB 子像素放大镜'}
        onClick={onToggleMagnifier}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.5 15.5 5 5" />
        </svg>
        <span>{magnifierEnabled ? '关闭放大' : '放大 RGB'}</span>
      </Button>
      <canvas
        className="di-rgb-magnifier"
        id="digitalImageRgbMagnifier"
        ref={lensRef}
        width={180}
        height={180}
        aria-hidden="true"
        hidden
      />
    </div>
  );
}

