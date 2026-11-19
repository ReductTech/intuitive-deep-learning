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
  return <svg shuku-edit-id="e-b0029686-b3fc-4815-9ba1-61f140cd174d" viewBox="0 0 28 24" aria-hidden="true"><path shuku-edit-id="e-923a18cc-fe36-4e6b-a546-9596324ef35d" d="M1 12h24M17 4l8 8-8 8" fill="none" stroke="currentColor" strokeWidth="2" /></svg>;
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
  return <figure shuku-edit-id="e-344c23d8-e0f5-440f-923f-bc992e246442" className="llmpe-def-figure" data-status={status}>
    <div shuku-edit-id="e-970f0a63-d318-49c6-ba7c-357330291502" className="llmpe-def-figure-row">
      <div shuku-edit-id="e-02ee1f0d-1470-4c2d-abf8-91b2755aa3ec" className="llmpe-def-example-item"><canvas shuku-edit-id="e-6d5df92d-e1ab-468c-b063-ddc2f01c9318" ref={input} width={IMAGE_SIZE} height={IMAGE_SIZE} role="img" aria-label="灰度建筑图像" /><Typography shuku-edit-id="e-28a875b2-1126-4c00-afcd-64454f10bc15" variant="bodySmall" tone="inherit">灰度图像</Typography></div>
      <FigureArrow />
      <div shuku-edit-id="e-baa419e6-8b3b-43bc-9ebc-663d3df797bd" className="llmpe-def-example-item"><Formula label="水平方向梯度的 Sobel 算子" latex={String.raw`\begin{bmatrix}-1&0&1\\-2&0&2\\-1&0&1\end{bmatrix}`} /><Typography shuku-edit-id="e-4c5bff6e-9ffd-47b4-a9da-2b0ed3015509" variant="bodySmall" tone="inherit">Sobel 算子</Typography></div>
      <FigureArrow />
      <div shuku-edit-id="e-0e55a069-76f4-4525-b305-d090f4e9ced4" className="llmpe-def-example-item"><canvas shuku-edit-id="e-9dd38124-a8e4-43b1-8e29-f0c6dfe96a0d" ref={output} width={IMAGE_SIZE} height={IMAGE_SIZE} role="img" aria-label="该图像的竖向边缘响应强度" /><Typography shuku-edit-id="e-39ed610c-4925-489d-91eb-cd948dbc2911" variant="bodySmall" tone="inherit">竖向边缘响应</Typography></div>
    </div>
    {status === 'failed' && <Typography shuku-edit-id="e-1805cf2f-8213-41af-96e4-cf95eaffc046" as="figcaption" variant="bodySmall" tone="inherit">配图加载失败</Typography>}
  </figure>;
}

export function ConvolutionDefinitionPage() {
  return <ContentBlock shuku-edit-id="e-247106a5-10dc-4c97-bbe3-cacf0fa290af" className="llmpe-def-page" headingLevel={1} title={outline.pages.find(page => page.id === 'bab294fb-0874-4f74-ac74-898a56412a8a')!.title}
    subtitle="以边缘检测为例：解释梯度、算子与响应" bodyClassName="llmpe-def-body">
    <div shuku-edit-id="e-ff11a61c-728a-447d-84a7-4bc2160c641f" className="llmpe-def-content">
      <article shuku-edit-id="e-1f58a856-d821-4bbf-93f5-7e0f2de3e1ca" className="llmpe-def-model" aria-label="专业式教育的边缘检测案例">
        <Typography shuku-edit-id="e-7f59a080-7127-4450-b1b4-b9de32e5a9ac" as="h2" variant="h3" tone="inherit" className="llmpe-def-lecture-title">一阶微分边缘检测——Sobel 算子</Typography>
        <ul shuku-edit-id="e-f0d5a6cf-7a5d-41ee-95af-4d1f3f1478de" className="llmpe-def-lecture-points">
          <li shuku-edit-id="e-ccd54099-49db-4c31-b71b-36880c8f025a"><Typography shuku-edit-id="e-dd717122-864d-4279-a015-b119f8b1d909" variant="bodySmall" tone="inherit">图像边缘表现为<strong shuku-edit-id="e-9c3e52eb-4c2e-41ff-8292-4622604432b3">灰度的急剧变化</strong>，可利用一阶微分进行检测。</Typography></li>
          <li shuku-edit-id="e-586d8b21-45ec-4ba3-960b-9af900ed4b68"><Typography shuku-edit-id="e-88909721-2b46-4bd7-80ab-ea69b065a101" variant="bodySmall" tone="inherit">Sobel 算子在 3 × 3 邻域内加权求和，近似计算局部灰度梯度。</Typography></li>
          <li shuku-edit-id="e-26a5a89e-ab26-42c5-b74d-b9b5532e9c89"><Typography shuku-edit-id="e-8410a9fa-eb82-4f65-8d58-f6bde18e4c2d" variant="bodySmall" tone="inherit">以水平方向为例，响应的绝对值越大，<strong shuku-edit-id="e-d2cfc6bb-06eb-4a9a-8a5f-b3116bbb4560">竖向边缘</strong>越明显。</Typography></li>
        </ul>
        <div shuku-edit-id="e-8572173b-4ffe-46f7-984a-6baa3bea8796" className="llmpe-def-response-model">
          <Formula label="Sobel 水平方向梯度响应" latex={String.raw`G_x(r,c)=\sum_{i=0}^{2}\sum_{j=0}^{2}I(r+i,c+j)K_x(i,j)`} />
          <Formula label="该方向的边缘强度是梯度响应的绝对值" latex={String.raw`E_x(r,c)=|G_x(r,c)|`} />
        </div>
        <SobelFigure />
      </article>
      <aside shuku-edit-id="e-cbf6c176-f398-4b38-a6af-934a89570d4e" className="llmpe-def-sidebar">
        <Typography shuku-edit-id="e-a8ef0e04-0136-4694-b1be-007123bca4fe" as="h2" variant="h2" tone="accent">专业教育的优势</Typography>
        <WormholeBenefit kind="book" title="体系完整">边缘、梯度与算子</WormholeBenefit>
        <WormholeBenefit kind="formula" title="理论严谨">公式与计算约定</WormholeBenefit>
        <WormholeBenefit kind="eye" title="可以深挖">噪声、阈值与多尺度</WormholeBenefit>
        <div shuku-edit-id="e-32e197a0-dabd-4f6a-9285-60e57f01c6d3" className="llmpe-def-question"><Typography shuku-edit-id="e-1bc2c9e1-a092-41d8-b85e-d01cd2450ae6" as="h3" variant="h3" tone="accent">第一次接触时</Typography><Typography shuku-edit-id="e-8c4b2642-c6a6-4a8a-857f-77806a5ef46d" variant="bodySmall" tone="muted">仍需理解算子为什么能找到边缘</Typography></div>
      </aside>
    </div>
    <footer shuku-edit-id="e-9f3c5409-6c83-4be5-80a0-2a9453f841e7" className="llmpe-def-conclusion"><Typography shuku-edit-id="e-1eecc0d4-d82b-4962-af92-2468c45c6637" variant="body" tone="accent" align="center">理解公式，还需看清计算过程</Typography></footer>
  </ContentBlock>;
}
