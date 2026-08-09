import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IMAGE_SIZE } from '../model/fixedKernelMath';
import type { SequenceSample } from '../model/sequenceMath';

interface OverlayGeometry {
  left: number;
  top: number;
  cell: number;
  height: number;
}

function drawSequence(canvas: HTMLCanvasElement, sample: SequenceSample) {
  const logicalWidth = Math.max(1, sample.width * 4);
  const logicalHeight = Math.max(1, sample.height * 4);
  canvas.width = logicalWidth;
  canvas.height = logicalHeight;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.fillStyle = '#0b1020';
  context.fillRect(0, 0, logicalWidth, logicalHeight);
  const cellWidth = logicalWidth / Math.max(1, sample.width);
  const cellHeight = logicalHeight / Math.max(1, sample.height);
  sample.image.forEach((row, rowIndex) => {
    row.forEach((raw, colIndex) => {
      let alpha = Math.max(0, Math.min(1, Number(raw) || 0));
      if (alpha <= 0.01) return;
      alpha = Math.max(0.18, alpha);
      context.fillStyle = `rgba(248,251,255,${alpha.toFixed(3)})`;
      context.fillRect(
        colIndex * cellWidth,
        rowIndex * cellHeight,
        Math.max(1, Math.ceil(cellWidth)),
        Math.max(1, Math.ceil(cellHeight)),
      );
    });
  });
}

export function SequenceCanvas({
  sample,
  currentLeft,
}: {
  sample: SequenceSample;
  currentLeft: number | null;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [geometry, setGeometry] = useState<OverlayGeometry | null>(null);

  useEffect(() => {
    if (canvasRef.current) drawSequence(canvasRef.current, sample);
  }, [sample]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return undefined;
    const measure = () => {
      const canvasRect = canvas.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      setGeometry({
        left: canvasRect.left - wrapRect.left,
        top: canvasRect.top - wrapRect.top,
        cell: canvasRect.width / Math.max(1, sample.width),
        height: canvasRect.height,
      });
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(measure);
    observer?.observe(wrap);
    observer?.observe(canvas);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [sample.height, sample.width]);

  return (
    <div className="edu-canvas-frame lenet-sequence-canvas-wrap" ref={wrapRef}>
      <canvas
        id="sequenceCanvas"
        ref={canvasRef}
        aria-label={`由 MNIST 数字 ${sample.digits} 拼成的序列图片`}
      />
      <div
        className={`lenet-window-overlay${currentLeft === null ? '' : ' is-visible'}`}
        aria-hidden="true"
        style={geometry ? {
          left: geometry.left,
          top: geometry.top,
          width: IMAGE_SIZE * geometry.cell,
          height: geometry.height,
          transform: `translateX(${Math.max(0, currentLeft ?? 0) * geometry.cell}px)`,
        } : undefined}
      />
    </div>
  );
}
