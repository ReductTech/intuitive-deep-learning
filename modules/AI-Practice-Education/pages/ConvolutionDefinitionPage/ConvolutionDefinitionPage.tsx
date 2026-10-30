import { useEffect, useRef, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, moduleAssetUrl, Typography } from '../../../shared/react';
import { WormholeBenefit } from '../../components/WormholeLessonFrame';
import { IMAGE_SIZE, KERNELS, rgbaToGray } from '../ConvolutionObservationPage/convolutionModel';
import outline from '../../outlines.json';
import './ConvolutionDefinitionPage.css';

function Formula({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}
function FigureArrow() {
  return <svg viewBox="0 0 28 24" aria-hidden="true"><path d="M1 12h24M17 4l8 8-8 8" fill="none" stroke="currentColor" strokeWidth="2" /></svg>;
}
function SobelFigure() {
  const input = useRef<HTMLCanvasElement>(null), output = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  useEffect(() => {
    let cancelled = false;
    async function draw() {
      const image = new Image(); image.src = moduleAssetUrl(outline.moduleIdentity.id, 'images/edge-examples/building.jpg');
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
  return <figure className="llmpe-def-figure" data-status={status}>
    <div className="llmpe-def-figure-row">
      <div className="llmpe-def-example-item"><canvas ref={input} width={IMAGE_SIZE} height={IMAGE_SIZE} role="img" aria-label="灰度建筑图像" /><Typography variant="bodySmall" tone="inherit">灰度图像</Typography></div>
      <FigureArrow />
      <div className="llmpe-def-example-item"><Formula label="水平方向梯度的 Sobel 算子" latex={String.raw`\begin{bmatrix}-1&0&1\\-2&0&2\\-1&0&1\end{bmatrix}`} /><Typography variant="bodySmall" tone="inherit">Sobel 算子</Typography></div>
      <FigureArrow />
      <div className="llmpe-def-example-item"><canvas ref={output} width={IMAGE_SIZE} height={IMAGE_SIZE} role="img" aria-label="该图像的竖向边缘响应强度" /><Typography variant="bodySmall" tone="inherit">竖向边缘响应</Typography></div>
    </div>
    {status === 'failed' && <Typography as="figcaption" variant="bodySmall" tone="inherit">配图加载失败</Typography>}
  </figure>;
}

export function ConvolutionDefinitionPage() {
  return <ContentBlock className="llmpe-def-page" headingLevel={1} title={outline.pages[12].title}
    subtitle="以边缘检测为例：解释梯度、算子与响应" bodyClassName="llmpe-def-body">
    <div className="llmpe-def-content">
      <article className="llmpe-def-model" aria-label="专业式教育的边缘检测案例">
        <Typography as="h2" variant="h3" tone="inherit" className="llmpe-def-lecture-title">一阶微分边缘检测——Sobel 算子</Typography>
        <ul className="llmpe-def-lecture-points">
          <li><Typography variant="bodySmall" tone="inherit">图像边缘表现为<strong>灰度的急剧变化</strong>，可利用一阶微分进行检测。</Typography></li>
          <li><Typography variant="bodySmall" tone="inherit">Sobel 算子在 3 × 3 邻域内加权求和，近似计算局部灰度梯度。</Typography></li>
          <li><Typography variant="bodySmall" tone="inherit">以水平方向为例，响应的绝对值越大，<strong>竖向边缘</strong>越明显。</Typography></li>
        </ul>
        <div className="llmpe-def-response-model">
          <Formula label="Sobel 水平方向梯度响应" latex={String.raw`G_x(r,c)=\sum_{i=0}^{2}\sum_{j=0}^{2}I(r+i,c+j)K_x(i,j)`} />
          <Formula label="该方向的边缘强度是梯度响应的绝对值" latex={String.raw`E_x(r,c)=|G_x(r,c)|`} />
        </div>
        <SobelFigure />
      </article>
      <aside className="llmpe-def-sidebar">
        <Typography as="h2" variant="h2" tone="accent">专业教育的优势</Typography>
        <WormholeBenefit kind="book" title="体系完整">边缘、梯度与算子</WormholeBenefit>
        <WormholeBenefit kind="formula" title="理论严谨">公式与计算约定</WormholeBenefit>
        <WormholeBenefit kind="eye" title="可以深挖">噪声、阈值与多尺度</WormholeBenefit>
        <div className="llmpe-def-question"><Typography as="h3" variant="h3" tone="accent">第一次接触时</Typography><Typography variant="bodySmall" tone="muted">仍需理解算子为什么能找到边缘</Typography></div>
      </aside>
    </div>
    <footer className="llmpe-def-conclusion"><Typography variant="body" tone="accent" align="center">理解公式，还需看清计算过程</Typography></footer>
  </ContentBlock>;
}
