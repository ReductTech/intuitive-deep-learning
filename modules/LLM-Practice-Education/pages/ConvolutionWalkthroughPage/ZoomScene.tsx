import { useEffect, useMemo, useRef } from 'react';
import { MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import { INPUT_SIZE, KERNEL, OUTPUT_SIZE, patchAt, type frameAt } from './walkthroughModel';

export type ZoomSample = { gray: number[]; responses: number[]; seed: number };
type Frame = ReturnType<typeof frameAt>;
const WIDTH = 1000, HEIGHT = 360, CLOSE_SCALE = 90;

/** The patch and the final image share one world coordinate system throughout. */
export function cameraAt(seed: number, frame: Frame) {
  const local = seed + (frame.phase === 'slow' ? frame.index : 4);
  const x = local % OUTPUT_SIZE, y = Math.floor(local / OUTPUT_SIZE);
  const zoom = frame.zoom;
  // Keep the demonstrated patch near the centre until the wider image is visible.
  const recenter = zoom ** 3;
  return {
    x: (x + 1.5 + frame.move) * (1 - recenter) + INPUT_SIZE / 2 * recenter,
    y: (y + 1.5) * (1 - recenter) + INPUT_SIZE / 2 * recenter,
    scale: CLOSE_SCALE * (2.5 / CLOSE_SCALE) ** zoom,
  };
}

export function ZoomScene({ sample, frame }: { sample: ZoomSample; frame: Frame }) {
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
  const visibleDetails = frame.phase === 'slow' || (frame.phase === 'zoom' && frame.zoom < .16);
  const detailOpacity = frame.phase === 'slow' ? 1 - frame.move : Math.max(0, 1 - frame.zoom / .16);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d'); if (!ctx) return;
    const { x, y, scale } = camera;
    const ox = WIDTH / 2 - x * scale, oy = HEIGHT / 2 - y * scale;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#f5f7fa'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.imageSmoothingEnabled = false;
    ctx.save(); ctx.translate(ox, oy); ctx.scale(scale, scale);
    ctx.drawImage(surfaces.input, 0, 0);
    // Seed calculations remain visible in the same places while the camera pulls back.
    const seeds = frame.phase === 'slow' ? Math.max(frame.completed, frame.summed ? frame.index + 1 : 0) : 5;
    for (let k = 0; k < seeds; k++) {
      const index = sample.seed + k, sx = index % OUTPUT_SIZE, sy = Math.floor(index / OUTPUT_SIZE);
      ctx.drawImage(surfaces.output, sx, sy, 1, 1, sx + 1, sy + 1, 1, 1);
    }
    if (frame.phase === 'fast' || frame.phase === 'hold') {
      const rows = Math.floor(frame.completed / OUTPUT_SIZE), remainder = frame.completed % OUTPUT_SIZE;
      if (rows) ctx.drawImage(surfaces.output, 0, 0, OUTPUT_SIZE, rows, 1, 1, OUTPUT_SIZE, rows);
      if (remainder) ctx.drawImage(surfaces.output, 0, rows, remainder, 1, 1, rows + 1, remainder, 1);
    }
    if (scale > 12) {
      ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1 / scale;
      const left = Math.max(0, Math.floor(-ox / scale)), right = Math.min(INPUT_SIZE, Math.ceil((WIDTH - ox) / scale));
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
      ctx.strokeRect(sx, sy, 3, 3);
    }
    ctx.restore();
  }, [sample, surfaces, camera.x, camera.y, camera.scale, frame.phase, frame.index, frame.completed, frame.summed, localIndex]);

  const left = WIDTH / 2 + (localX - camera.x) * camera.scale;
  const top = HEIGHT / 2 + (localY - camera.y) * camera.scale;
  return <div className="llmpe-walk-camera" data-ppt-viewport="连续镜头：在图像世界内放大、平移和拉远" data-camera-scale={camera.scale.toFixed(4)} data-local-index={localIndex}>
    <canvas ref={canvas} width={WIDTH} height={HEIGHT} role="img" aria-label={frame.phase === 'slow' ? '放大图像内的三乘三像素区域，卷积核直接覆盖在像素上' : frame.phase === 'zoom' ? '从同一局部连续拉远，显露整幅输入图像' : frame.phase === 'fast' ? '边缘响应正在同一图像上从左上到右下逐块生成' : '完整边缘图像'} />
    {visibleDetails && !frame.summed && <div className="llmpe-walk-overlay" style={{ left: `${left / WIDTH * 100}%`, top: `${top / HEIGHT * 100}%`, width: `${3 * camera.scale / WIDTH * 100}%`, height: `${3 * camera.scale / HEIGHT * 100}%`, opacity: detailOpacity }}>
      {patch.map((value, k) => <div key={k} className={`llmpe-walk-pixel${frame.term === k ? ' is-active' : ''}`} style={{ background: `rgb(${value},${value},${value})`, color: value < 135 ? '#fff' : '#172f52' }}><Typography as="span" variant="bodySmall" tone="inherit">{value}</Typography><MathFormulaBlock appearance="plain" ariaLabel={`乘以权重 ${KERNEL[k]}`}><MathFormulaStatic latex={String.raw`\times(${KERNEL[k]})`} /></MathFormulaBlock></div>)}
    </div>}
    {frame.phase === 'slow' && frame.summed && frame.move < .1 && <div className="llmpe-walk-response" style={{ left: `${(left + 1.5 * camera.scale) / WIDTH * 100}%`, top: `${(top + 1.5 * camera.scale) / HEIGHT * 100}%` }}><Typography as="span" variant="h2" tone="inherit">{sample.responses[localIndex]}</Typography></div>}
    <div className="llmpe-walk-camera-label"><Typography variant="bodySmall" tone="accent">{{ slow: '图像中的一次计算', zoom: '拉远，看见整体', fast: '同样的计算，遍历整幅图', hold: '完整边缘响应' }[frame.phase]}</Typography></div>
  </div>;
}
