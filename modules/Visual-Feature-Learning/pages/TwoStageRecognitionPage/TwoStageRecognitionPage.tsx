import { useEffect, useRef } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import './TwoStageRecognitionPage.css';
import { exampleDigit, horizontalResponse } from '../../services/horizontalKernelExample';

const digits = [1, 7] as const;
const inputs = digits.map(digit => exampleDigit(digit, 0));

function DigitImage({ pixels, digit }: { pixels: number[]; digit: number }) {
  const rects = pixels.flatMap((value, i) => value > .015 ? [`<rect x="${i % 28}" y="${Math.floor(i / 28)}" width="1" height="1" fill="rgb(${Math.round(value * 255)},${Math.round(value * 255)},${Math.round(value * 255)})"/>`] : []).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" shape-rendering="crispEdges"><rect width="28" height="28" fill="black"/>${rects}</svg>`;
  return <img src={`data:image/svg+xml,${encodeURIComponent(svg)}`} alt={`手写风格灰度示意数字 ${digit}`} />;
}

function Response({ pixels, digit }: { pixels: number[]; digit: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const output = ref.current?.getContext('2d');
    if (!output) return;
    const rendered = output.createImageData(26, 26);
    horizontalResponse(pixels).forEach((value, i) => {
      // Shared smoothstep contrast: suppress weak responses and brighten strong ones.
      // This changes the display only, not the convolution values.
      const t = Math.max(0, Math.min(1, (value / 4 - .25) / .5));
      const level = .72 * t * t * (3 - 2 * t);
      rendered.data[i * 4] = Math.round(255 * level);
      rendered.data[i * 4 + 1] = Math.round(210 * level);
      rendered.data[i * 4 + 2] = Math.round(12 * level);
      rendered.data[i * 4 + 3] = 255;
    });
    output.putImageData(rendered, 0, 0);
  }, [pixels]);
  return <div className="vfl-limit-example">
    <div className="vfl-limit-response is-visible vfl-limit-response-pulse">
      <canvas ref={ref} width={26} height={26} role="img" aria-label={`示意数字 ${digit} 的实际竖向边缘响应`} />
    </div>
    <Typography variant="body" tone="accent">{digit} 的响应</Typography>
  </div>;
}

export function TwoStageRecognitionPage() {
  return <ContentBlock className="vfl-limit-page" headingLevel={1} title="人工设计特征的局限"
    subtitle="不同的数字，可能产生相近的竖向边缘响应。">
    <div className="vfl-limit-flow">
      <section className="vfl-limit-stage" aria-label="输入图像">
        <Typography as="h2" variant="h3" tone="accent">两个不同的数字</Typography>
        <div className="vfl-limit-pair">{digits.map((digit, index) => <div className="vfl-limit-example" key={digit}>
          <DigitImage pixels={inputs[index]} digit={digit} />
          <Typography variant="body" tone="accent">数字 {digit}</Typography>
        </div>)}</div>
        <Typography variant="bodySmall" tone="muted">手写灰度构造示例</Typography>
      </section>
      <span className="vfl-limit-arrow" aria-hidden="true">→</span>
      <section className="vfl-limit-stage vfl-limit-backbone" aria-label="固定竖向边缘卷积核">
        <Typography as="h2" variant="h3" tone="accent">竖向边缘核</Typography>
        <MathFormulaBlock className="vfl-limit-kernel" ariaLabel="Sobel 竖向边缘核">
          <MathFormulaStatic latex={'\\begin{bmatrix}-1&-2&-1\\\\0&0&0\\\\1&2&1\\end{bmatrix}'} />
        </MathFormulaBlock>
      </section>
      <span className="vfl-limit-arrow" aria-hidden="true">→</span>
      <section className="vfl-limit-stage" aria-label="真实卷积响应对比">
        <Typography as="h2" variant="h3" tone="accent">相近的竖向响应</Typography>
        <div className="vfl-limit-pair">{digits.map((digit, index) => <Response key={digit} pixels={inputs[index]} digit={digit} />)}</div>
        <Typography variant="bodySmall" tone="muted">强响应增强 · 弱响应抑制</Typography>
      </section>
    </div>
    <div className="vfl-limit-takeaway"><Typography variant="body" tone="accent">竖向边缘相近，数字形状却不同。</Typography><Typography variant="bodySmall" tone="muted">下一步：让卷积核从标注中学习。</Typography></div>
  </ContentBlock>;
}
