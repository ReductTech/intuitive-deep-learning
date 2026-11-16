import { useEffect, useState, type ReactNode } from 'react';
import { Light } from '@icon-park/react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Switch, Typography } from "@shuku/course-style/react";
import './SobelConstructionPage.css';

const SOBEL_X = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
const SOBEL_Y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

function Matrix({ values, label, className = '' }: { values: number[][]; label: string; className?: string }) {
  return <div shuku-edit-id="e-a3c3412a-c533-4806-86ee-2d1a47508dbf" className={`ck-sobel__matrix ${className}`} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }} role="img" aria-label={label}>
    {values.flatMap((row, y) => row.map((value, x) => <span shuku-edit-id="e-db71b90a-45bc-463b-9368-1c120e17dd67" className={value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : 'is-zero'} key={`${y}-${x}`}><MathFormulaStatic latex={String(value)} /></span>))}
  </div>;
}

function StepHeader({ number, children, action }: { number: string; children: ReactNode; action?: ReactNode }) {
  return <header shuku-edit-id="e-02625393-7510-4eb1-8a60-a915ec197eda" className="ck-sobel__step-header"><span shuku-edit-id="e-f17eac06-6319-4965-9067-375881f26cdb" className="ck-sobel__step-number"><Typography shuku-edit-id="e-0547e3de-95a0-4475-8f88-d09e3d9ea272" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-6112559e-52e2-4b55-9c99-1466f761f10d" as="h2" variant="h3" tone="accent">{children}</Typography>{action}</header>;
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
  return <article shuku-edit-id="e-d5b6922c-a8e2-4734-bd45-90d57caacaea" className="ck-sobel__example">
    <header shuku-edit-id="e-ed0cfff9-a69e-400f-b6d6-33e93559b83e" className="ck-sobel__example-head"><Typography shuku-edit-id="e-ab88f6e6-3726-4afa-8280-7affd2c588f6" as="h2" variant="h3" tone="accent">Sobel {x ? 'X：检测竖直边缘' : 'Y：检测水平边缘'}</Typography></header>
    <div shuku-edit-id="e-a9b9043b-06c5-46fe-a573-dc30bbb44c55" className="ck-sobel__example-visuals">
      <figure shuku-edit-id="e-78e48a77-e213-4ebd-ba3f-3d297d4d72b2"><img shuku-edit-id="e-e653ed68-35a0-4e27-9ec0-1370aa95f684" src={images?.input} alt={x ? '左暗右亮的输入图像' : '上暗下亮的输入图像'} /><Typography shuku-edit-id="e-a48c5d32-eb26-44ae-84e9-9628539b14d5" as="figcaption" variant="bodySmall" tone="accent">输入图像</Typography></figure>
      <div shuku-edit-id="e-68b819c9-ab5e-4cc8-84ad-72088acb480e" className="ck-sobel__apply"><MathFormulaStatic latex={x ? 'K_x*' : 'K_y*'} /><span shuku-edit-id="e-bbad8e86-bf13-4af2-956e-8d32883e9124" aria-hidden="true">→</span></div>
      <figure shuku-edit-id="e-ffc6eaaf-95c9-4db1-9631-fe74f9d870ef"><img shuku-edit-id="e-9f829617-29c7-4577-ad1a-765995a3e55e" src={images?.output} alt={x ? '竖直亮线响应' : '水平亮线响应'} /><Typography shuku-edit-id="e-6a98d21e-a0d3-442b-b6c7-cd04e46fb8fb" as="figcaption" variant="bodySmall" tone="accent">输出响应（{x ? '竖直' : '水平'}边缘突出）</Typography></figure>
    </div>
  </article>;
}

export function SobelConstructionPage() {
  const examples = useExamples();
  const [axis, setAxis] = useState<'x' | 'y'>('x');
  const isX = axis === 'x';
  return <ContentBlock shuku-edit-id="e-f6f024c2-6c2f-4193-8718-546ef7eee369" headingLevel={1} className="ck-sobel" title="从一阶差分到 Sobel" subtitle="Sobel 在目标方向上计算差分，在垂直方向上汇聚邻域信息。">
    <section shuku-edit-id="e-025e0b02-aca6-47a5-8e40-4cd11740e6c7" className="ck-sobel__construction" aria-label={`Sobel ${axis.toUpperCase()} 卷积核的构造过程`}>
      <article shuku-edit-id="e-9c3c1c7e-e779-4aa0-9d1b-bc719ce4188b" className="ck-sobel__step"><StepHeader number="1">一维差分算子</StepHeader><div shuku-edit-id="e-98b6348e-92dd-4aa2-8c9c-dade90bfc0d4" className={`ck-sobel__step-main ${isX ? '' : 'ck-sobel__step-main--vertical-diff'}`}><Matrix values={isX ? [[-1, 0, 1]] : [[-1], [0], [1]]} label={`${axis} 方向一维差分核：负一、零、一`} className={isX ? 'ck-sobel__matrix--row' : 'ck-sobel__matrix--column'} /><div shuku-edit-id="e-90833c6d-dbe9-4790-9168-621e488c65d9" className="ck-sobel__step-copy"><Typography shuku-edit-id="e-cd003234-b8ba-42bd-8b5f-ea80309647da" variant="h3" tone="accent">比较{isX ? '左右' : '上下'}两侧</Typography><Typography shuku-edit-id="e-45634be0-3469-4954-a49d-37cb0a2d8fbd" variant="body" tone="muted">对 {axis} 方向变化敏感</Typography></div></div></article>
      <article shuku-edit-id="e-07c1b86b-f1d8-4df8-8aff-4cad9d67643a" className="ck-sobel__step"><StepHeader number="2">一维平滑权重</StepHeader><div shuku-edit-id="e-d1987f91-9c15-48b0-90a0-a58242363f0a" className={`ck-sobel__step-main ck-sobel__step-main--smoothing ${isX ? '' : 'ck-sobel__step-main--horizontal-smoothing'}`}><Matrix values={isX ? [[1], [2], [1]] : [[1, 2, 1]]} label={`${isX ? '垂直' : '水平'}方向平滑权重：一、二、一`} className={isX ? 'ck-sobel__matrix--column' : 'ck-sobel__matrix--row'} /><div shuku-edit-id="e-50c141b2-fb2f-44a4-bd11-613837feca39" className="ck-sobel__step-copy"><Typography shuku-edit-id="e-0d997693-ecf9-463e-a031-9455ef90cb3d" variant="h3" tone="accent">在 {isX ? 'y' : 'x'} 方向加权平均</Typography><Typography shuku-edit-id="e-8b9742a9-87ee-4a7f-8dad-a77bc1b2fccc" variant="body" tone="muted">中心{isX ? '行' : '列'}权重更大</Typography></div></div></article>
      <article shuku-edit-id="e-345fc2f3-e043-4f63-b3e7-ed28d3ebc9f2" className="ck-sobel__step"><StepHeader number="3" action={<Switch label={isX ? 'Y' : 'X'} checked={!isX} onChange={(event) => setAxis(event.target.checked ? 'y' : 'x')} aria-label="切换 Sobel X 与 Sobel Y" />}>组合得到 Sobel {axis.toUpperCase()}</StepHeader><div shuku-edit-id="e-3b90af8c-b68e-442c-a91b-368c21fb1248" className="ck-sobel__step-main ck-sobel__step-main--combined"><MathFormulaBlock ariaLabel={`Sobel ${axis.toUpperCase()} 由差分与正交方向平滑组合`} className="ck-sobel__composition"><MathFormulaTerm latex={isX ? 'K_x' : 'K_y'} tooltip={`Sobel ${axis.toUpperCase()} 卷积核，突出${isX ? '竖直' : '水平'}边缘。`} /><MathFormulaStatic latex="=" /><MathFormulaTerm latex={isX ? '[1\\quad2\\quad1]^T' : '[-1\\quad0\\quad1]^T'} tooltip={isX ? '垂直方向的一、二、一平滑权重。' : '垂直方向的差分权重。'} /><MathFormulaTerm latex={isX ? '[-1\\quad0\\quad1]' : '[1\\quad2\\quad1]'} tooltip={isX ? '水平方向的差分权重。' : '水平方向的一、二、一平滑权重。'} /></MathFormulaBlock><div shuku-edit-id="e-d42e25b9-6290-4b46-9e97-a16ba03bddaf" className="ck-sobel__combination"><Matrix values={isX ? SOBEL_X : SOBEL_Y} label={`Sobel ${axis.toUpperCase()} 三乘三卷积核`} className="ck-sobel__matrix--sobel" /><Typography shuku-edit-id="e-cc70a656-fb2a-4f42-a40f-0a8ae5a65e60" variant="h3" tone="accent">方向差分 ×<br shuku-edit-id="e-8f8c35cd-90ef-4cd2-b058-839aa4602c15" />正交方向平滑</Typography></div></div></article>
    </section>
    <section shuku-edit-id="e-fc8d45ff-031f-4264-b074-0fca8e295f22" className="ck-sobel__examples" aria-label="Sobel X 与 Sobel Y 对应的边缘响应"><Example axis="x" images={examples?.x} /><Example axis="y" images={examples?.y} /></section>
    <footer shuku-edit-id="e-b0e907f5-a642-4be6-8875-972d4dea028b" className="ck-sobel__summary"><span shuku-edit-id="e-17ebfa8d-8f86-46c1-98ed-7282ddd51180" className="ck-sobel__summary-icon"><Light theme="outline" size="32" fill="currentColor" /></span><Typography shuku-edit-id="e-5fcf3087-9939-4db4-be7e-1305b4256d87" as="h2" variant="h3" tone="accent">要点：</Typography><Typography shuku-edit-id="e-24dbac71-b5bd-44c1-a50b-c3e6b44f428d" variant="body" tone="accent">Sobel 核 = 一阶差分（检测变化）× 正交方向平滑（抑制噪声），因此既有方向性，又更稳定。</Typography></footer>
  </ContentBlock>;
}

