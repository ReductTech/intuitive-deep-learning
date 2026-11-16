import { useEffect, useRef } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './TwoStageRecognitionPage.css';
import { exampleDigit, horizontalResponse } from '../../services/horizontalKernelExample';

const digits = [1, 7] as const;
const inputs = digits.map(digit => exampleDigit(digit, 0));

function DigitImage({ pixels, digit }: { pixels: number[]; digit: number }) {
  const rects = pixels.flatMap((value, i) => value > .015 ? [`<rect x="${i % 28}" y="${Math.floor(i / 28)}" width="1" height="1" fill="rgb(${Math.round(value * 255)},${Math.round(value * 255)},${Math.round(value * 255)})"/>`] : []).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" shape-rendering="crispEdges"><rect width="28" height="28" fill="black"/>${rects}</svg>`;
  return <img shuku-edit-id="e-062b4f89-e684-40cd-931f-b7a77787a9f1" src={`data:image/svg+xml,${encodeURIComponent(svg)}`} alt={`手写风格灰度示意数字 ${digit}`} />;
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
  return <div shuku-edit-id="e-bef88e42-1a71-4c03-b19e-e46516b11cf3" className="vfl-limit-example">
    <div shuku-edit-id="e-cdc28611-0607-4d6b-a981-d78e62bd3511" className="vfl-limit-response is-visible vfl-limit-response-pulse">
      <canvas shuku-edit-id="e-5a0b095c-ca95-4b0b-a10a-aacc019631d2" ref={ref} width={26} height={26} role="img" aria-label={`示意数字 ${digit} 的实际竖向边缘响应`} />
    </div>
    <Typography shuku-edit-id="e-7f563119-5d8a-4711-a699-ccb413811c10" variant="body" tone="accent">{digit} 的响应</Typography>
  </div>;
}

export function TwoStageRecognitionPage() {
  return <ContentBlock shuku-edit-id="e-c8c08c65-1da6-4240-8104-c112779e033c" className="vfl-limit-page" headingLevel={1} title="人工设计特征的局限"
    subtitle="不同的数字，可能产生相近的竖向边缘响应。">
    <div shuku-edit-id="e-36732537-3339-4a6a-8bc4-9514966464c1" className="vfl-limit-flow">
      <section shuku-edit-id="e-81fd063e-75eb-4ccb-b7ed-ee3771db7327" className="vfl-limit-stage" aria-label="输入图像">
        <Typography shuku-edit-id="e-5995a05d-91f5-40c4-ad47-835009ce4503" as="h2" variant="h3" tone="accent">两个不同的数字</Typography>
        <div shuku-edit-id="e-01688fb3-aa28-427a-9fc9-13f1cb7312a7" className="vfl-limit-pair">{digits.map((digit, index) => <div shuku-edit-id="e-d526658c-f3a1-41b1-950c-4cd15767992a" className="vfl-limit-example" key={digit}>
          <DigitImage pixels={inputs[index]} digit={digit} />
          <Typography shuku-edit-id="e-fb952ae7-3385-4497-8f77-7a27a8f8e66e" variant="body" tone="accent">数字 {digit}</Typography>
        </div>)}</div>
        <Typography shuku-edit-id="e-c7166f4c-e91d-4d4f-bf5b-f0187a98602b" variant="bodySmall" tone="muted">手写灰度构造示例</Typography>
      </section>
      <span shuku-edit-id="e-8e134884-93f3-42f6-bb7c-6dd35dad51f1" className="vfl-limit-arrow" aria-hidden="true">→</span>
      <section shuku-edit-id="e-e09e1661-e5af-468c-b94b-eb6e5f9b8b5b" className="vfl-limit-stage vfl-limit-backbone" aria-label="固定竖向边缘卷积核">
        <Typography shuku-edit-id="e-a7d4aa63-1b1f-4f64-a194-4dbf811f064c" as="h2" variant="h3" tone="accent">竖向边缘核</Typography>
        <MathFormulaBlock className="vfl-limit-kernel" ariaLabel="Sobel 竖向边缘核">
          <MathFormulaStatic latex={'\\begin{bmatrix}-1&-2&-1\\\\0&0&0\\\\1&2&1\\end{bmatrix}'} />
        </MathFormulaBlock>
      </section>
      <span shuku-edit-id="e-e5c2b005-285c-467a-84dd-21655e0c08eb" className="vfl-limit-arrow" aria-hidden="true">→</span>
      <section shuku-edit-id="e-76c728bb-56cb-49fb-86ab-a66d116ccc84" className="vfl-limit-stage" aria-label="真实卷积响应对比">
        <Typography shuku-edit-id="e-f919df59-e668-4319-abba-57e62d455b4a" as="h2" variant="h3" tone="accent">相近的竖向响应</Typography>
        <div shuku-edit-id="e-cfdc8f59-b44a-43f3-a752-98943e4cdd89" className="vfl-limit-pair">{digits.map((digit, index) => <Response key={digit} pixels={inputs[index]} digit={digit} />)}</div>
        <Typography shuku-edit-id="e-2b70bb92-076f-44ca-87f2-265ee37b7649" variant="bodySmall" tone="muted">强响应增强 · 弱响应抑制</Typography>
      </section>
    </div>
    <div shuku-edit-id="e-d3f224ad-436b-4a1c-8865-e7efb3d29a7d" className="vfl-limit-takeaway"><Typography shuku-edit-id="e-3100871a-ef60-4a3d-9981-b7d300544b75" variant="body" tone="accent">竖向边缘相近，数字形状却不同。</Typography><Typography shuku-edit-id="e-0f2206cc-bb33-4d40-a7c5-71e6788591f0" variant="bodySmall" tone="muted">下一步：让卷积核从标注中学习。</Typography></div>
  </ContentBlock>;
}
