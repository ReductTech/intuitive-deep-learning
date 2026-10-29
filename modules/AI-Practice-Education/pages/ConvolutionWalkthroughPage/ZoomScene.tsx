import { useEffect, useMemo, useRef } from 'react';
import { Button, Typography } from '../../../shared/react';
import { INPUT_SIZE, KERNELS, OUTPUT_SIZE, patchAt, type KernelDirection, type frameAt } from './walkthroughModel';

export type ZoomSample = { gray: number[]; responses: number[]; seed: number };
type Frame = ReturnType<typeof frameAt>;
const WIDTH = 1000, HEIGHT = 360, PANE = 360, RIGHT = 640, CLOSE_SCALE = 90;

/** The patch and the final image share one world coordinate system throughout. */
export function cameraAt(seed: number, frame: Frame) {
  const local = seed + (frame.phase === 'slow' ? frame.index : 4);
  const x = local % OUTPUT_SIZE, y = Math.floor(local / OUTPUT_SIZE);
  const zoom = frame.zoom;
  // Begin at the upper-left corner in both the image and the enlarged view.
  const recenter = zoom ** 3;
  return {
    x: (x + (PANE / 2 - 20) / CLOSE_SCALE + frame.move) * (1 - recenter) + INPUT_SIZE / 2 * recenter,
    y: (y + (HEIGHT / 2 - 35) / CLOSE_SCALE) * (1 - recenter) + INPUT_SIZE / 2 * recenter,
    scale: CLOSE_SCALE * (2.5 / CLOSE_SCALE) ** zoom,
  };
}

export function ZoomScene({ sample, frame, direction, onDirectionChange }: { sample: ZoomSample; frame: Frame; direction: KernelDirection; onDirectionChange: (direction: KernelDirection) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const surfaces = useMemo(() => {
    function make(size: number, values: number[]) {
      const surface = document.createElement('canvas'); surface.width = surface.height = size;
      const ctx = surface.getContext('2d')!;
      const pixels = ctx.createImageData(size, size);
      values.forEach((value, k) => { pixels.data[4*k] = pixels.data[4*k+1] = pixels.data[4*k+2] = value; pixels.data[4*k+3] = 255; });
      ctx.putImageData(pixels, 0, 0); return surface;
    }
    return { input: make(INPUT_SIZE, sample.gray), output: make(OUTPUT_SIZE, sample.responses.map(v => Math.min(255, Math.abs(v) * .6))) };
  }, [sample]);
  const camera = cameraAt(sample.seed, frame);
  const localIndex = sample.seed + (frame.phase === 'slow' ? frame.index : 4);
  const localX = localIndex % OUTPUT_SIZE, localY = Math.floor(localIndex / OUTPUT_SIZE);

  const patch = patchAt(sample.gray, localIndex);
  const showValues = frame.phase === 'slow' || (frame.phase === 'zoom' && frame.zoom < .08);
  const valuesOpacity = frame.phase === 'slow' ? 1 - frame.move : Math.max(0, 1 - frame.zoom / .08);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d'); if (!ctx) return;
    const { x, y, scale } = camera;
    const seeds = frame.phase === 'slow' ? Math.max(frame.completed, frame.summed ? frame.index + 1 : 0) : 5;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff8ed'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.imageSmoothingEnabled = false;
    for (const output of [false, true]) {
      const offset = output ? RIGHT : 0;
      const ox = offset + PANE / 2 - x * scale, oy = HEIGHT / 2 - y * scale;
      ctx.save(); ctx.beginPath(); ctx.rect(offset, 0, PANE, HEIGHT); ctx.clip();
      ctx.fillStyle = output ? '#101217' : '#f5f7fa'; ctx.fillRect(offset, 0, PANE, HEIGHT);
      ctx.translate(ox, oy); ctx.scale(scale, scale);
      if (!output) ctx.drawImage(surfaces.input, 0, 0);
      else {
        // Every result is written only after the corresponding left-hand sum.
        for (let k = 0; k < seeds; k++) {
          const index = sample.seed + k, sx = index % OUTPUT_SIZE, sy = Math.floor(index / OUTPUT_SIZE);
          ctx.drawImage(surfaces.output, sx, sy, 1, 1, sx + 1, sy + 1, 1, 1);
        }
        if (frame.phase === 'fast' || frame.phase === 'hold') {
          const rows = Math.floor(frame.completed / OUTPUT_SIZE), remainder = frame.completed % OUTPUT_SIZE;
          if (rows) ctx.drawImage(surfaces.output, 0, 0, OUTPUT_SIZE, rows, 1, 1, OUTPUT_SIZE, rows);
          if (remainder) ctx.drawImage(surfaces.output, 0, rows, remainder, 1, 1, rows + 1, remainder, 1);
        }
      }
      if (scale > 12) {
        ctx.strokeStyle = output ? 'rgba(255,255,255,.13)' : 'rgba(255,255,255,.3)'; ctx.lineWidth = 1 / scale;
        const left = Math.max(0, Math.floor((offset - ox) / scale)), right = Math.min(INPUT_SIZE, Math.ceil((offset + PANE - ox) / scale));
        const top = Math.max(0, Math.floor(-oy / scale)), bottom = Math.min(INPUT_SIZE, Math.ceil((HEIGHT - oy) / scale));
        ctx.beginPath();
        for (let i = left; i <= right; i++) { ctx.moveTo(i, top); ctx.lineTo(i, bottom); }
        for (let i = top; i <= bottom; i++) { ctx.moveTo(left, i); ctx.lineTo(right, i); }
        ctx.stroke();
      }
      if (frame.phase !== 'hold') {
        const scan = frame.phase === 'fast' ? frame.index : localIndex;
        const sx = scan % OUTPUT_SIZE, sy = Math.floor(scan / OUTPUT_SIZE);
        ctx.strokeStyle = '#ed7d31'; ctx.lineWidth = 2 / scale;
        ctx.strokeRect(sx + (output ? 1 : 0), sy + (output ? 1 : 0), output ? 1 : 3, output ? 1 : 3);
      }
      ctx.restore();
    }
  }, [sample, surfaces, camera.x, camera.y, camera.scale, frame.phase, frame.index, frame.completed, frame.summed, localIndex]);

  const left = PANE / 2 + (localX - camera.x) * camera.scale;
  const top = HEIGHT / 2 + (localY - camera.y) * camera.scale;
  return <div className="llmpe-walk-camera" data-ppt-viewport="同步双镜头：左侧输入局部计算，右侧对应位置逐个写入响应" data-camera-scale={camera.scale.toFixed(4)} data-local-index={localIndex} data-pulse={frame.pulse}>
    <canvas ref={canvas} width={WIDTH} height={HEIGHT} role="img" aria-label={frame.phase === 'slow' ? '放大图像内的三乘三像素区域，左侧显示九个真实像素数值，中间独立展示卷积核' : frame.phase === 'zoom' ? '左右镜头同步拉远，显露完整输入与输出图像' : frame.phase === 'fast' ? '左侧输入保持原样，右侧边缘响应从左上到右下逐块生成' : '完整边缘图像'} />
    {showValues && <div className={`llmpe-walk-input-values${frame.pulse === 'input' ? ' is-highlighted' : ''}`} aria-label="当前局部区域的九个像素数值" style={{ left: `${left / WIDTH * 100}%`, top: `${top / HEIGHT * 100}%`, width: `${3 * camera.scale / WIDTH * 100}%`, height: `${3 * camera.scale / HEIGHT * 100}%`, opacity: valuesOpacity }}>{patch.map((value, k) => <div key={k} style={{ color: value < 135 ? '#fff' : '#172f52' }}><Typography as="span" variant="h3" tone="inherit">{value}</Typography></div>)}</div>}
    <div className="llmpe-walk-kernel-panel" aria-label="独立卷积核">
      <Typography as="h3" variant="h3" tone="accent" align="center">卷积核</Typography>
      <div className={`llmpe-walk-kernel-grid${frame.pulse === 'kernel' ? ' is-highlighted' : ''}`}>{KERNELS[direction].map((weight, k) => <div key={k} className="llmpe-walk-pixel"><Typography as="span" variant="h3" tone="inherit">{weight}</Typography></div>)}</div>
      <div className="llmpe-walk-kernel-switch" role="group" aria-label="边缘检测方向">{([['vertical', '竖向'], ['horizontal', '横向']] as const).map(([value, label]) => <Button key={value} variant={direction === value ? 'primary' : 'default'} aria-pressed={direction === value} onClick={() => onDirectionChange(value)}><Typography as="span" variant="bodySmall" tone="inherit">{label}</Typography></Button>)}</div>
    </div>
    {frame.phase === 'slow' && frame.summed && frame.move < .1 && <div className="llmpe-walk-response is-highlighted" style={{ left: `${(RIGHT + left + 1.5 * camera.scale) / WIDTH * 100}%`, top: `${(top + 1.5 * camera.scale) / HEIGHT * 100}%`, width: `${camera.scale / WIDTH * 100}%`, height: `${camera.scale / HEIGHT * 100}%`, color: Math.min(255, Math.abs(sample.responses[localIndex]) * .6) > 135 ? '#172f52' : '#fff' }}><Typography as="span" variant="h3" tone="inherit">{sample.responses[localIndex]}</Typography></div>}
    <div className="llmpe-walk-camera-label"><Typography variant="bodySmall" tone="accent">输入图像</Typography></div>
    <div className="llmpe-walk-camera-label llmpe-walk-output-label"><Typography variant="bodySmall" tone="accent">输出图像</Typography></div>
    {[false, true].map(right => <svg key={String(right)} className={`llmpe-walk-transfer${right ? ' is-right' : ''}`} viewBox="0 0 32 32" aria-hidden="true"><path d="M3 16h25M19 7l9 9-9 9" fill="none" stroke="currentColor" strokeWidth="2.5" /></svg>)}
  </div>;
}
