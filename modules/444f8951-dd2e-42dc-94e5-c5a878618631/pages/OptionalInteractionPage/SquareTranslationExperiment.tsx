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
    <div shuku-edit-id="e-f6fbc5d7-23e6-4043-9ade-a87029164c07" className="cg-translation-pair cg-translation-square">
      <figure shuku-edit-id="e-fb72aa58-07d2-4ccf-bbb8-8f7ae9ab6e8d"><Typography shuku-edit-id="e-17684f1a-abc6-4a8f-a33f-5bbb16c334b9" variant="bodySmall" tone="muted">输入图像</Typography><canvas shuku-edit-id="e-92e6c374-0f85-41f3-8393-cd9cb15210ff" ref={input} width={W} height={H} role="img" aria-label="可水平和垂直平移的深色方块" /></figure>
      <DesignComparisonArrow />
      <figure shuku-edit-id="e-44970b4e-0f98-405c-af04-9b6bda03e12b"><Typography shuku-edit-id="e-7b15df49-a7d2-4020-b44a-2d13cc73f396" variant="bodySmall" tone="muted">边缘响应</Typography><canvas shuku-edit-id="e-ee410139-06e2-4dbb-9c4b-fa30d6a59874" ref={output} width={W} height={H} role="img" aria-label="与方块位置同步变化的拉普拉斯边缘响应" /></figure>
    </div>
    <div shuku-edit-id="e-0afd4dcb-a6e3-43a5-8b6e-8804ecfb8054" className="cg-translation-controls">
      <RangeControl label="水平位移" min={-26} max={26} step={1} value={dx} onChange={event => setDx(Number(event.target.value))} />
      <RangeControl label="垂直位移" min={-15} max={15} step={1} value={dy} onChange={event => setDy(Number(event.target.value))} />
      <Button onClick={() => { setDx(0); setDy(0); }}>重置</Button>
    </div>
  </>;
}
