import { useEffect, useRef, useState } from 'react';
import { Button, RangeControl, Typography } from '../../../shared/react';
import { MAP_WIDTH as W, MAP_HEIGHT as H, LAPLACIAN_KERNEL, heatColor } from './laplacianResponse';
import { DesignComparisonArrow } from '../../components/DesignComparisonHeader';

export function SquareTranslationExperiment() {
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const input = useRef<HTMLCanvasElement>(null);
  const output = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const source = input.current?.getContext('2d', { willReadFrequently: true });
    const target = output.current?.getContext('2d');
    if (!source || !target) return;
    source.fillStyle = '#fff'; source.fillRect(0, 0, W, H);
    source.fillStyle = '#182330'; source.fillRect(W / 2 - 9 + dx, H / 2 - 9 + dy, 18, 18);
    const pixels = source.getImageData(0, 0, W, H).data;
    const gray = new Float32Array(W * H);
    for (let i = 0; i < gray.length; i++) gray[i] = (pixels[i * 4] * .2126 + pixels[i * 4 + 1] * .7152 + pixels[i * 4 + 2] * .0722) / 255;
    const result = target.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let response = 0;
      for (let ky = -1; ky <= 1; ky++) for (let kx = -1; kx <= 1; kx++) response += gray[Math.max(0, Math.min(H - 1, y + ky)) * W + Math.max(0, Math.min(W - 1, x + kx))] * LAPLACIAN_KERNEL[ky + 1][kx + 1];
      result.data.set([...heatColor(Math.abs(response) / .55), 255], (y * W + x) * 4);
    }
    target.putImageData(result, 0, 0);
  }, [dx, dy]);
  return <>
    <div className="aipe-translation-pair aipe-translation-square">
      <figure><Typography variant="bodySmall" tone="muted">输入图像</Typography><canvas ref={input} width={W} height={H} role="img" aria-label="可水平和垂直平移的深色方块" /></figure>
      <DesignComparisonArrow />
      <figure><Typography variant="bodySmall" tone="muted">边缘响应</Typography><canvas ref={output} width={W} height={H} role="img" aria-label="与方块位置同步变化的拉普拉斯边缘响应" /></figure>
    </div>
    <div className="aipe-translation-controls">
      <RangeControl label="水平位移" min={-26} max={26} step={1} value={dx} onChange={event => setDx(Number(event.target.value))} />
      <RangeControl label="垂直位移" min={-15} max={15} step={1} value={dy} onChange={event => setDy(Number(event.target.value))} />
      <Button onClick={() => { setDx(0); setDy(0); }}>重置</Button>
    </div>
  </>;
}
