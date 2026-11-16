import { useEffect, useState, type ReactNode } from 'react';
import { Light } from '@icon-park/react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Switch, Typography } from "@shuku/course-style/react";
import './SobelConstructionPage.css';

const SOBEL_X = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
const SOBEL_Y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

function Matrix({ values, label, className = '' }: { values: number[][]; label: string; className?: string }) {
  return <div shuku-edit-id="e-9f9c4680-ec4a-4866-b2f2-58611a2343a6" className={`aipe-replay-cg-copy-ck-sobel__matrix ${className}`} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }} role="img" aria-label={label}>
    {values.flatMap((row, y) => row.map((value, x) => <span shuku-edit-id="e-450f4c85-71a7-49ec-b4bb-3a71612102c6" className={value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : 'is-zero'} key={`${y}-${x}`}><MathFormulaStatic latex={String(value)} /></span>))}
  </div>;
}

function StepHeader({ number, children, action }: { number: string; children: ReactNode; action?: ReactNode }) {
  return <header shuku-edit-id="e-270de835-886a-4cd2-b55e-7cf73fee2d67" className="aipe-replay-cg-copy-ck-sobel__step-header"><span shuku-edit-id="e-74d3cffd-3a83-479a-8701-045111444964" className="aipe-replay-cg-copy-ck-sobel__step-number"><Typography shuku-edit-id="e-e20e9ad5-b042-4a3d-8320-4da8a37b4a9a" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-28e3cae1-0c13-4f0b-a232-3376874d9af6" as="h2" variant="h3" tone="accent">{children}</Typography>{action}</header>;
}

function renderImage(values: Float32Array, width: number, height: number, scale = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return '';
  const image = context.createImageData(width, height);
  for (let index = 0; index < values.length; index += 1) {
    const shade = Math.round(Math.max(0, Math.min(1, values[index] / scale)) * 255);
    image.data.set([shade, shade, shade, 255], index * 4);
  }
  context.putImageData(image, 0, 0);
  return canvas.toDataURL('image/png');
}

function makeEdgeExample(axis: 'x' | 'y') {
  const width = 240;
  const height = 150;
  const input = new Float32Array(width * height);
  const output = new Float32Array(width * height);
  const kernel = axis === 'x' ? SOBEL_X : SOBEL_Y;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const position = axis === 'x' ? x - width / 2 : y - height / 2;
      const transition = 1 / (1 + Math.exp(-position / 3));
      const texture = .004 * Math.sin(x * 1.7 + y * 2.3) + .003 * Math.sin(x * 3.8 - y * 1.1);
      input[y * width + x] = .21 + .58 * transition + texture;
    }
  }
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky += 1) {
        for (let kx = -1; kx <= 1; kx += 1) sum += input[(y + ky) * width + x + kx] * kernel[ky + 1][kx + 1];
      }
      output[y * width + x] = Math.max(0, sum);
    }
  }
  return { input: renderImage(input, width, height), output: renderImage(output, width, height, .48) };
}

function useExamples() {
  const [examples, setExamples] = useState<{ x: ReturnType<typeof makeEdgeExample>; y: ReturnType<typeof makeEdgeExample> } | null>(null);
  useEffect(() => { setExamples({ x: makeEdgeExample('x'), y: makeEdgeExample('y') }); }, []);
  return examples;
}

function Example({ axis, images }: { axis: 'x' | 'y'; images?: ReturnType<typeof makeEdgeExample> }) {
  const x = axis === 'x';
  return <article shuku-edit-id="e-93ab0cf6-67e4-4ca6-b839-bfc4359d4c97" className="aipe-replay-cg-copy-ck-sobel__example">
    <header shuku-edit-id="e-67bface4-a372-4e7d-a488-052e9e11c7a8" className="aipe-replay-cg-copy-ck-sobel__example-head"><Typography shuku-edit-id="e-a1d09bfa-3eef-4d1b-91e6-202b5bbc3ad3" as="h2" variant="h3" tone="accent">Sobel {x ? 'X：检测竖直边缘' : 'Y：检测水平边缘'}</Typography></header>
    <div shuku-edit-id="e-aeeb5fb9-398c-4dbf-a281-eec278b307f6" className="aipe-replay-cg-copy-ck-sobel__example-visuals">
      <figure shuku-edit-id="e-64bc98e3-bfa0-4878-87b5-86e1714046c8"><img shuku-edit-id="e-8b9cf058-3cda-4c76-b85b-2f227a1b60bf" src={images?.input} alt={x ? '左暗右亮的输入图像' : '上暗下亮的输入图像'} /><Typography shuku-edit-id="e-1136469c-14c8-47ad-9cde-aba0ab81bf31" as="figcaption" variant="bodySmall" tone="accent">输入图像</Typography></figure>
      <div shuku-edit-id="e-a686ec65-f58f-4888-bd5d-b214f4a32c72" className="aipe-replay-cg-copy-ck-sobel__apply"><MathFormulaStatic latex={x ? 'K_x*' : 'K_y*'} /><span shuku-edit-id="e-a187f120-bb1a-4246-8129-b6e312564340" aria-hidden="true">→</span></div>
      <figure shuku-edit-id="e-9b1e493e-8b4e-4131-8b35-b123c94a786a"><img shuku-edit-id="e-de38ddff-a1e8-48dd-8baf-b03811efa060" src={images?.output} alt={x ? '竖直亮线响应' : '水平亮线响应'} /><Typography shuku-edit-id="e-3d067ed1-bdf0-4240-aa98-b13c7bea27fb" as="figcaption" variant="bodySmall" tone="accent">输出响应（{x ? '竖直' : '水平'}边缘突出）</Typography></figure>
    </div>
  </article>;
}

export function SobelConstructionPage() {
  const examples = useExamples();
  const [axis, setAxis] = useState<'x' | 'y'>('x');
  const isX = axis === 'x';
  return <ContentBlock shuku-edit-id="e-69927b37-a232-43d0-bf98-46c1f1978213" headingLevel={1} className="aipe-replay-cg-copy-ck-sobel" title="从一阶差分到 Sobel" subtitle="Sobel 在目标方向上计算差分，在垂直方向上汇聚邻域信息。">
    <section shuku-edit-id="e-704c6562-7222-4932-915d-8aece85a5d7e" className="aipe-replay-cg-copy-ck-sobel__construction" aria-label={`Sobel ${axis.toUpperCase()} 卷积核的构造过程`}>
      <article shuku-edit-id="e-d8522f67-5a37-4814-841a-41a10f73ab44" className="aipe-replay-cg-copy-ck-sobel__step"><StepHeader number="1">一维差分算子</StepHeader><div shuku-edit-id="e-d143bd3f-88af-44ec-8be9-907ec5763e26" className={`aipe-replay-cg-copy-ck-sobel__step-main ${isX ? '' : 'aipe-replay-cg-copy-ck-sobel__step-main--vertical-diff'}`}><Matrix values={isX ? [[-1, 0, 1]] : [[-1], [0], [1]]} label={`${axis} 方向一维差分核：负一、零、一`} className={isX ? 'aipe-replay-cg-copy-ck-sobel__matrix--row' : 'aipe-replay-cg-copy-ck-sobel__matrix--column'} /><div shuku-edit-id="e-2b632f4f-7de0-4ecd-b3e8-6ac3b3c3ccde" className="aipe-replay-cg-copy-ck-sobel__step-copy"><Typography shuku-edit-id="e-b331ca93-2236-4fd6-b546-b9b09e38bf8d" variant="h3" tone="accent">比较{isX ? '左右' : '上下'}两侧</Typography><Typography shuku-edit-id="e-563b39ec-578b-464d-b2e2-7994505b18b7" variant="body" tone="muted">对 {axis} 方向变化敏感</Typography></div></div></article>
      <article shuku-edit-id="e-f6d07d54-9747-4c6a-aa68-98124ea99524" className="aipe-replay-cg-copy-ck-sobel__step"><StepHeader number="2">一维平滑权重</StepHeader><div shuku-edit-id="e-be1abf6b-d5c2-4bc4-b0d2-82dfc17c4a97" className={`aipe-replay-cg-copy-ck-sobel__step-main aipe-replay-cg-copy-ck-sobel__step-main--smoothing ${isX ? '' : 'aipe-replay-cg-copy-ck-sobel__step-main--horizontal-smoothing'}`}><Matrix values={isX ? [[1], [2], [1]] : [[1, 2, 1]]} label={`${isX ? '垂直' : '水平'}方向平滑权重：一、二、一`} className={isX ? 'aipe-replay-cg-copy-ck-sobel__matrix--column' : 'aipe-replay-cg-copy-ck-sobel__matrix--row'} /><div shuku-edit-id="e-09753dc1-fa63-4d6b-a420-2e8c19897f74" className="aipe-replay-cg-copy-ck-sobel__step-copy"><Typography shuku-edit-id="e-4027d24e-a23a-4114-8f80-2b8890ca2b66" variant="h3" tone="accent">在 {isX ? 'y' : 'x'} 方向加权平均</Typography><Typography shuku-edit-id="e-2f7d417e-41ea-4151-8aa5-f8ce378d41c7" variant="body" tone="muted">中心{isX ? '行' : '列'}权重更大</Typography></div></div></article>
      <article shuku-edit-id="e-28dd5053-81b0-4ac2-bc23-94ae1e0b1a87" className="aipe-replay-cg-copy-ck-sobel__step"><StepHeader number="3" action={<Switch label={isX ? 'Y' : 'X'} checked={!isX} onChange={(event) => setAxis(event.target.checked ? 'y' : 'x')} aria-label="切换 Sobel X 与 Sobel Y" />}>组合得到 Sobel {axis.toUpperCase()}</StepHeader><div shuku-edit-id="e-9c90dca8-d1f2-4bf4-a6f0-101d1c858519" className="aipe-replay-cg-copy-ck-sobel__step-main aipe-replay-cg-copy-ck-sobel__step-main--combined"><MathFormulaBlock ariaLabel={`Sobel ${axis.toUpperCase()} 由差分与正交方向平滑组合`} className="aipe-replay-cg-copy-ck-sobel__composition"><MathFormulaTerm latex={isX ? 'K_x' : 'K_y'} tooltip={`Sobel ${axis.toUpperCase()} 卷积核，突出${isX ? '竖直' : '水平'}边缘。`} /><MathFormulaStatic latex="=" /><MathFormulaTerm latex={isX ? '[1\\quad2\\quad1]^T' : '[-1\\quad0\\quad1]^T'} tooltip={isX ? '垂直方向的一、二、一平滑权重。' : '垂直方向的差分权重。'} /><MathFormulaTerm latex={isX ? '[-1\\quad0\\quad1]' : '[1\\quad2\\quad1]'} tooltip={isX ? '水平方向的差分权重。' : '水平方向的一、二、一平滑权重。'} /></MathFormulaBlock><div shuku-edit-id="e-5c42105e-d58f-477e-86e2-a582e903b9d0" className="aipe-replay-cg-copy-ck-sobel__combination"><Matrix values={isX ? SOBEL_X : SOBEL_Y} label={`Sobel ${axis.toUpperCase()} 三乘三卷积核`} className="aipe-replay-cg-copy-ck-sobel__matrix--sobel" /><Typography shuku-edit-id="e-49b613ab-1ed6-465b-9d0f-138b37ceae15" variant="h3" tone="accent">方向差分 ×<br shuku-edit-id="e-7483fc2a-9970-4cb9-b7a1-a8e3061e8a1a" />正交方向平滑</Typography></div></div></article>
    </section>
    <section shuku-edit-id="e-4df735e0-a66e-442b-a07f-3f633d99899c" className="aipe-replay-cg-copy-ck-sobel__examples" aria-label="Sobel X 与 Sobel Y 对应的边缘响应"><Example axis="x" images={examples?.x} /><Example axis="y" images={examples?.y} /></section>
    <footer shuku-edit-id="e-04e88d67-69c3-4fb0-92ee-94bb9f591717" className="aipe-replay-cg-copy-ck-sobel__summary"><span shuku-edit-id="e-c064e5e8-7140-42a4-836a-902991ea825a" className="aipe-replay-cg-copy-ck-sobel__summary-icon"><Light theme="outline" size="32" fill="currentColor" /></span><Typography shuku-edit-id="e-c498db71-1b18-4656-b969-ec0f4c95b0c3" as="h2" variant="h3" tone="accent">要点：</Typography><Typography shuku-edit-id="e-eb78e79f-ca58-4e8b-8eb4-d966fc07906e" variant="body" tone="accent">Sobel 核 = 一阶差分（检测变化）× 正交方向平滑（抑制噪声），因此既有方向性，又更稳定。</Typography></footer>
  </ContentBlock>;
}

