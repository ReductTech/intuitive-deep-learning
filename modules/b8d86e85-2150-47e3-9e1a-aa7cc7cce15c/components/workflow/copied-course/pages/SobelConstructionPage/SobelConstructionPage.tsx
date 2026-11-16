import { useEffect, useState, type ReactNode } from 'react';
import { Light } from '@icon-park/react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Switch, Typography } from "@shuku/course-style/react";
import './SobelConstructionPage.css';

const SOBEL_X = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
const SOBEL_Y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

function Matrix({ values, label, className = '' }: { values: number[][]; label: string; className?: string }) {
  return <div shuku-edit-id="e-1e8006e9-5b79-44dd-882f-6fd498fdd246" className={`cg-copy-ck-sobel__matrix ${className}`} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }} role="img" aria-label={label}>
    {values.flatMap((row, y) => row.map((value, x) => <span shuku-edit-id="e-82836aa9-c9fe-471c-934c-3221a2961558" className={value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : 'is-zero'} key={`${y}-${x}`}><MathFormulaStatic latex={String(value)} /></span>))}
  </div>;
}

function StepHeader({ number, children, action }: { number: string; children: ReactNode; action?: ReactNode }) {
  return <header shuku-edit-id="e-981ff480-22e6-4e1e-b7e6-516b179b9afc" className="cg-copy-ck-sobel__step-header"><span shuku-edit-id="e-18a8d4f9-3503-445e-9fb0-f2a0e9fe9495" className="cg-copy-ck-sobel__step-number"><Typography shuku-edit-id="e-701b5d1e-52e9-485f-b787-f69ea7d7c551" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-828bd949-e91d-4d0c-a6d6-47a3e851ac74" as="h2" variant="h3" tone="accent">{children}</Typography>{action}</header>;
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
  return <article shuku-edit-id="e-cb426263-a548-4880-97d6-72aeb4ad8a01" className="cg-copy-ck-sobel__example">
    <header shuku-edit-id="e-d55568ba-1dd2-4336-b791-3da031f9aff4" className="cg-copy-ck-sobel__example-head"><Typography shuku-edit-id="e-cd810966-5e07-43a1-99d2-efd194c7428d" as="h2" variant="h3" tone="accent">Sobel {x ? 'X：检测竖直边缘' : 'Y：检测水平边缘'}</Typography></header>
    <div shuku-edit-id="e-c2937aa2-23c6-4a2d-a90d-05593e02e89a" className="cg-copy-ck-sobel__example-visuals">
      <figure shuku-edit-id="e-3ac2f8e1-9d34-41b5-b6fa-8dcfd2f99348"><img shuku-edit-id="e-7f51e729-8711-4bbd-aaf0-77418fd0b1d1" src={images?.input} alt={x ? '左暗右亮的输入图像' : '上暗下亮的输入图像'} /><Typography shuku-edit-id="e-6a7724ea-5e64-44f1-98cc-f6ad24e78baa" as="figcaption" variant="bodySmall" tone="accent">输入图像</Typography></figure>
      <div shuku-edit-id="e-70ac2315-8d36-424f-a484-ab10ae51f8fb" className="cg-copy-ck-sobel__apply"><MathFormulaStatic latex={x ? 'K_x*' : 'K_y*'} /><span shuku-edit-id="e-fe2fdffd-e815-4c6a-945c-c0c9d317a70f" aria-hidden="true">→</span></div>
      <figure shuku-edit-id="e-bd6cd59a-e624-4a93-b7a3-497711b4af4d"><img shuku-edit-id="e-95c27e76-86c5-4450-a886-45755d3de526" src={images?.output} alt={x ? '竖直亮线响应' : '水平亮线响应'} /><Typography shuku-edit-id="e-5fe9b82a-e332-48b8-9ce9-fa61c992e7ea" as="figcaption" variant="bodySmall" tone="accent">输出响应（{x ? '竖直' : '水平'}边缘突出）</Typography></figure>
    </div>
  </article>;
}

export function SobelConstructionPage() {
  const examples = useExamples();
  const [axis, setAxis] = useState<'x' | 'y'>('x');
  const isX = axis === 'x';
  return <ContentBlock shuku-edit-id="e-958c6ea6-16c6-402e-aecd-fb631af57d9c" headingLevel={1} className="cg-copy-ck-sobel" title="从一阶差分到 Sobel" subtitle="Sobel 在目标方向上计算差分，在垂直方向上汇聚邻域信息。">
    <section shuku-edit-id="e-48f0accc-e03c-4740-b815-2873341698a9" className="cg-copy-ck-sobel__construction" aria-label={`Sobel ${axis.toUpperCase()} 卷积核的构造过程`}>
      <article shuku-edit-id="e-dd9289ff-ee10-4afe-b706-b1557f5c24b8" className="cg-copy-ck-sobel__step"><StepHeader number="1">一维差分算子</StepHeader><div shuku-edit-id="e-39ef2072-76bc-4c5b-917e-a4bfe12b495d" className={`cg-copy-ck-sobel__step-main ${isX ? '' : 'cg-copy-ck-sobel__step-main--vertical-diff'}`}><Matrix values={isX ? [[-1, 0, 1]] : [[-1], [0], [1]]} label={`${axis} 方向一维差分核：负一、零、一`} className={isX ? 'cg-copy-ck-sobel__matrix--row' : 'cg-copy-ck-sobel__matrix--column'} /><div shuku-edit-id="e-2beb286d-286f-4763-9342-b32405270a6a" className="cg-copy-ck-sobel__step-copy"><Typography shuku-edit-id="e-9558442a-2399-4d59-8d9d-f0a330077571" variant="h3" tone="accent">比较{isX ? '左右' : '上下'}两侧</Typography><Typography shuku-edit-id="e-7548da85-193c-4689-a3a2-f2a45f171eb3" variant="body" tone="muted">对 {axis} 方向变化敏感</Typography></div></div></article>
      <article shuku-edit-id="e-f3a15092-bb4c-410c-abc2-fcb72015b566" className="cg-copy-ck-sobel__step"><StepHeader number="2">一维平滑权重</StepHeader><div shuku-edit-id="e-a3e478d4-237b-4730-b840-9b551c4fe034" className={`cg-copy-ck-sobel__step-main cg-copy-ck-sobel__step-main--smoothing ${isX ? '' : 'cg-copy-ck-sobel__step-main--horizontal-smoothing'}`}><Matrix values={isX ? [[1], [2], [1]] : [[1, 2, 1]]} label={`${isX ? '垂直' : '水平'}方向平滑权重：一、二、一`} className={isX ? 'cg-copy-ck-sobel__matrix--column' : 'cg-copy-ck-sobel__matrix--row'} /><div shuku-edit-id="e-8e9a1df4-8fb7-48e3-8999-58cf28fa3929" className="cg-copy-ck-sobel__step-copy"><Typography shuku-edit-id="e-39a42e5d-98e6-41e7-944e-2541bcc37de9" variant="h3" tone="accent">在 {isX ? 'y' : 'x'} 方向加权平均</Typography><Typography shuku-edit-id="e-382bea9d-a537-4ec9-9311-b12748ff10df" variant="body" tone="muted">中心{isX ? '行' : '列'}权重更大</Typography></div></div></article>
      <article shuku-edit-id="e-9bf1a93a-a781-4ab3-878b-3958c60735e2" className="cg-copy-ck-sobel__step"><StepHeader number="3" action={<Switch label={isX ? 'Y' : 'X'} checked={!isX} onChange={(event) => setAxis(event.target.checked ? 'y' : 'x')} aria-label="切换 Sobel X 与 Sobel Y" />}>组合得到 Sobel {axis.toUpperCase()}</StepHeader><div shuku-edit-id="e-4e1ca64d-ac9c-4ceb-81c8-de7470f90845" className="cg-copy-ck-sobel__step-main cg-copy-ck-sobel__step-main--combined"><MathFormulaBlock ariaLabel={`Sobel ${axis.toUpperCase()} 由差分与正交方向平滑组合`} className="cg-copy-ck-sobel__composition"><MathFormulaTerm latex={isX ? 'K_x' : 'K_y'} tooltip={`Sobel ${axis.toUpperCase()} 卷积核，突出${isX ? '竖直' : '水平'}边缘。`} /><MathFormulaStatic latex="=" /><MathFormulaTerm latex={isX ? '[1\\quad2\\quad1]^T' : '[-1\\quad0\\quad1]^T'} tooltip={isX ? '垂直方向的一、二、一平滑权重。' : '垂直方向的差分权重。'} /><MathFormulaTerm latex={isX ? '[-1\\quad0\\quad1]' : '[1\\quad2\\quad1]'} tooltip={isX ? '水平方向的差分权重。' : '水平方向的一、二、一平滑权重。'} /></MathFormulaBlock><div shuku-edit-id="e-282ca278-5ee8-4e93-9e66-a7da0a855a32" className="cg-copy-ck-sobel__combination"><Matrix values={isX ? SOBEL_X : SOBEL_Y} label={`Sobel ${axis.toUpperCase()} 三乘三卷积核`} className="cg-copy-ck-sobel__matrix--sobel" /><Typography shuku-edit-id="e-b7d3a83c-1d8b-4e46-b94c-b7adf1eabc34" variant="h3" tone="accent">方向差分 ×<br shuku-edit-id="e-a36f845b-793d-493f-983e-f2637e4cf4c4" />正交方向平滑</Typography></div></div></article>
    </section>
    <section shuku-edit-id="e-078dd2f5-cb43-4369-b52e-34804704034b" className="cg-copy-ck-sobel__examples" aria-label="Sobel X 与 Sobel Y 对应的边缘响应"><Example axis="x" images={examples?.x} /><Example axis="y" images={examples?.y} /></section>
    <footer shuku-edit-id="e-05eb1f5a-62e7-4bb6-afb0-63d92d352059" className="cg-copy-ck-sobel__summary"><span shuku-edit-id="e-b6dcb044-9aba-4868-88ec-cd9225c0785b" className="cg-copy-ck-sobel__summary-icon"><Light theme="outline" size="32" fill="currentColor" /></span><Typography shuku-edit-id="e-cee7ea81-cd79-41ad-b323-ba1dfaf8fa57" as="h2" variant="h3" tone="accent">要点：</Typography><Typography shuku-edit-id="e-03ade993-2e0a-4300-9d53-60e22a1e3651" variant="body" tone="accent">Sobel 核 = 一阶差分（检测变化）× 正交方向平滑（抑制噪声），因此既有方向性，又更稳定。</Typography></footer>
  </ContentBlock>;
}

