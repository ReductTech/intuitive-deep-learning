import { useEffect, useRef, useState } from 'react';
import { Button, RangeControl, Typography } from "@shuku/course-style/react";
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
    <div shuku-edit-id="e-cfeb9151-ea5f-44b6-9f09-9c9978616f00" className="aipe-translation-pair aipe-translation-square">
      <figure shuku-edit-id="e-92cda48b-2cba-4e37-a47c-2c1df3cf89d4"><Typography shuku-edit-id="e-651bc882-f109-4bcd-b125-5e3bf9585afa" variant="bodySmall" tone="muted">输入图像</Typography><canvas shuku-edit-id="e-ddcc36a6-05ec-42a1-b7db-0b8666ade199" ref={input} width={W} height={H} role="img" aria-label="可水平和垂直平移的深色方块" /></figure>
      <DesignComparisonArrow />
      <figure shuku-edit-id="e-f38483d7-6dea-4781-97ee-b50d5726de05"><Typography shuku-edit-id="e-f85ce6d9-51b6-4c2a-a903-8882c3b301c5" variant="bodySmall" tone="muted">边缘响应</Typography><canvas shuku-edit-id="e-5af5e2cd-b068-48c0-98d5-0e05577aba8a" ref={output} width={W} height={H} role="img" aria-label="与方块位置同步变化的拉普拉斯边缘响应" /></figure>
    </div>
    <div shuku-edit-id="e-6e8638cd-01b4-4d9d-a576-b5395e56b769" className="aipe-translation-controls">
      <RangeControl label="水平位移" min={-26} max={26} step={1} value={dx} onChange={event => setDx(Number(event.target.value))} />
      <RangeControl label="垂直位移" min={-15} max={15} step={1} value={dy} onChange={event => setDy(Number(event.target.value))} />
      <Button onClick={() => { setDx(0); setDy(0); }}>重置</Button>
    </div>
  </>;
}
