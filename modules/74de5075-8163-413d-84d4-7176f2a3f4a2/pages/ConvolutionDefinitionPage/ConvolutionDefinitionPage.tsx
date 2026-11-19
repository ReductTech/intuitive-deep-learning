import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { WormholeBenefit } from '../../components/WormholeLessonFrame';
import { IMAGE_SIZE, KERNELS, rgbaToGray } from '../ConvolutionObservationPage/convolutionModel';
import outline from '../../outlines.json';
import './ConvolutionDefinitionPage.css';

function Formula({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}
function FigureArrow() {
  return <svg shuku-edit-id="e-ecc956ee-0445-492d-9f65-5a3e9f15cbbd" viewBox="0 0 28 24" aria-hidden="true"><path shuku-edit-id="e-ada8b302-e7a7-4f7a-a2f1-cd507f6adcc2" d="M1 12h24M17 4l8 8-8 8" fill="none" stroke="currentColor" strokeWidth="2" /></svg>;
}
function SobelFigure() {
  const input = useRef<HTMLCanvasElement>(null), output = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  useEffect(() => {
    let cancelled = false;
    async function draw() {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = moduleAssetUrl("images/edge-examples/building.webp");
      await image.decode(); if (cancelled) return;
      const source = document.createElement('canvas'); source.width = source.height = IMAGE_SIZE;
      const context = source.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('图像读取失败');
      context.drawImage(image, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
      const gray = rgbaToGray(context.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE).data);
      const edgeSize = IMAGE_SIZE - 2;
      const edge = new Float32Array(edgeSize ** 2);
      for (let y = 0; y < edgeSize; y++) for (let x = 0; x < edgeSize; x++) {
        let sum = 0;
        for (let k = 0; k < 9; k++) sum += gray[(y + Math.floor(k / 3)) * IMAGE_SIZE + x + k % 3] * KERNELS.vertical[k];
        edge[y * edgeSize + x] = Math.min(1, Math.abs(sum) * .6);
      }
      for (const [ref, values, size] of [[input, gray, IMAGE_SIZE], [output, edge, edgeSize]] as const) {
        if (ref.current) ref.current.width = ref.current.height = size;
        const ctx = ref.current?.getContext('2d'); if (!ctx) throw new Error('配图无法绘制');
        const pixels = ctx.createImageData(size, size);
        values.forEach((value, k) => { pixels.data[4*k] = pixels.data[4*k+1] = pixels.data[4*k+2] = value * 255; pixels.data[4*k+3] = 255; });
        ctx.putImageData(pixels, 0, 0);
      }
      setStatus('ready');
    }
    draw().catch(() => { if (!cancelled) setStatus('failed'); });
    return () => { cancelled = true; };
  }, []);
  return <figure shuku-edit-id="e-75f0ca1e-cf90-4554-9d23-4595fbb729b3" className="llmpe-def-figure" data-status={status}>
    <div shuku-edit-id="e-5664d8ce-bba5-4a32-9504-d71ef1d4ae4a" className="llmpe-def-figure-row">
      <div shuku-edit-id="e-e0102c72-5076-48ff-9573-ac266665a539" className="llmpe-def-example-item"><canvas shuku-edit-id="e-38bf4da1-5002-4b62-a93b-92013880fff5" ref={input} width={IMAGE_SIZE} height={IMAGE_SIZE} role="img" aria-label="灰度建筑图像" /><Typography shuku-edit-id="e-438a4cf4-ce57-479b-9093-b8d2215c569f" variant="bodySmall" tone="inherit">灰度图像</Typography></div>
      <FigureArrow />
      <div shuku-edit-id="e-0126dcff-b745-4a6d-9053-b24d117722c6" className="llmpe-def-example-item"><Formula label="水平方向梯度的 Sobel 算子" latex={String.raw`\begin{bmatrix}-1&0&1\\-2&0&2\\-1&0&1\end{bmatrix}`} /><Typography shuku-edit-id="e-2df645af-b106-4b89-aadd-1420cc24667e" variant="bodySmall" tone="inherit">Sobel 算子</Typography></div>
      <FigureArrow />
      <div shuku-edit-id="e-71531454-614f-4cea-9086-bea8e1f1f366" className="llmpe-def-example-item"><canvas shuku-edit-id="e-71667d15-0163-431d-ad7d-67ce1537a0a3" ref={output} width={IMAGE_SIZE} height={IMAGE_SIZE} role="img" aria-label="该图像的竖向边缘响应强度" /><Typography shuku-edit-id="e-ea345262-2a42-478f-9eff-345685e6da83" variant="bodySmall" tone="inherit">竖向边缘响应</Typography></div>
    </div>
    {status === 'failed' && <Typography shuku-edit-id="e-ff58187a-2cfe-4132-8ac2-14f5d312c898" as="figcaption" variant="bodySmall" tone="inherit">配图加载失败</Typography>}
  </figure>;
}

export function ConvolutionDefinitionPage() {
  return <ContentBlock shuku-edit-id="e-e02cf483-2f2a-4aab-8f2e-51d62750fc12" className="llmpe-def-page" headingLevel={1} title={outline.pages.find(page => page.id === '6e6236b7-c87e-48d7-a446-0051e47d901d')!.title}
    subtitle="以边缘检测为例：解释梯度、算子与响应" bodyClassName="llmpe-def-body">
    <div shuku-edit-id="e-b12c9b03-b777-46ba-b382-059aec35bfcf" className="llmpe-def-content">
      <article shuku-edit-id="e-16e78cb9-47ad-41ac-88cf-9b1adbab8516" className="llmpe-def-model" aria-label="专业式教育的边缘检测案例">
        <Typography shuku-edit-id="e-9ead5fff-86ed-4b8c-9200-7170a55b96bf" as="h2" variant="h3" tone="inherit" className="llmpe-def-lecture-title">一阶微分边缘检测——Sobel 算子</Typography>
        <ul shuku-edit-id="e-5bf01f99-889c-4241-8c60-907ee69177a1" className="llmpe-def-lecture-points">
          <li shuku-edit-id="e-5693a7c1-f78f-4fd0-b94d-97d3649d5c0b"><Typography shuku-edit-id="e-3d18e9eb-f0e5-4581-8cf0-513a78c4509a" variant="bodySmall" tone="inherit">图像边缘表现为<strong shuku-edit-id="e-f75dc1f4-0bf0-4e49-a7d6-d3e4794bace8">灰度的急剧变化</strong>，可利用一阶微分进行检测。</Typography></li>
          <li shuku-edit-id="e-ef3d8fd7-3173-48ec-9326-a45d6a6e96cb"><Typography shuku-edit-id="e-5ba081f5-d278-4cd0-bddd-59baff1652d6" variant="bodySmall" tone="inherit">Sobel 算子在 3 × 3 邻域内加权求和，近似计算局部灰度梯度。</Typography></li>
          <li shuku-edit-id="e-4fce568d-b21f-4f10-8a94-ab0246fa95bc"><Typography shuku-edit-id="e-b0afb83b-1501-49fe-a82a-9a02eea83f27" variant="bodySmall" tone="inherit">以水平方向为例，响应的绝对值越大，<strong shuku-edit-id="e-16bbad30-716e-49e5-b3a6-72001cc28f85">竖向边缘</strong>越明显。</Typography></li>
        </ul>
        <div shuku-edit-id="e-c69c77cd-6f5f-4657-80b0-2470cfc659b7" className="llmpe-def-response-model">
          <Formula label="Sobel 水平方向梯度响应" latex={String.raw`G_x(r,c)=\sum_{i=0}^{2}\sum_{j=0}^{2}I(r+i,c+j)K_x(i,j)`} />
          <Formula label="该方向的边缘强度是梯度响应的绝对值" latex={String.raw`E_x(r,c)=|G_x(r,c)|`} />
        </div>
        <SobelFigure />
      </article>
      <aside shuku-edit-id="e-756b9b85-c518-4cad-a3b2-a73282c23aea" className="llmpe-def-sidebar">
        <Typography shuku-edit-id="e-85cfbb57-abef-4528-a0ba-bf1689d1278d" as="h2" variant="h2" tone="accent">专业教育的优势</Typography>
        <WormholeBenefit kind="book" title="体系完整">边缘、梯度与算子</WormholeBenefit>
        <WormholeBenefit kind="formula" title="理论严谨">公式与计算约定</WormholeBenefit>
        <WormholeBenefit kind="eye" title="可以深挖">噪声、阈值与多尺度</WormholeBenefit>
        <div shuku-edit-id="e-e7013269-d580-41db-8378-91123561bf75" className="llmpe-def-question"><Typography shuku-edit-id="e-5318beea-74af-45d8-bb83-8f4bdaa48a01" as="h3" variant="h3" tone="accent">第一次接触时</Typography><Typography shuku-edit-id="e-45cb5cb6-fc3b-40c7-9a8f-501d2d907f75" variant="bodySmall" tone="muted">仍需理解算子为什么能找到边缘</Typography></div>
      </aside>
    </div>
    <footer shuku-edit-id="e-99d9021f-ca08-4e02-828c-407b256bd4bf" className="llmpe-def-conclusion"><Typography shuku-edit-id="e-defc83e4-8697-4cd1-adc5-7b7dbabde0ee" variant="body" tone="accent" align="center">理解公式，还需看清计算过程</Typography></footer>
  </ContentBlock>;
}
