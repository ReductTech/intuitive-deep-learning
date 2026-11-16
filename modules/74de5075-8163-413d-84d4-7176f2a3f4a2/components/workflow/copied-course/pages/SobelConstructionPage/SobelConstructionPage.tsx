import { useEffect, useState, type ReactNode } from 'react';
import { Light } from '@icon-park/react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Switch, Typography } from "@shuku/course-style/react";
import './SobelConstructionPage.css';

const SOBEL_X = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
const SOBEL_Y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

function Matrix({ values, label, className = '' }: { values: number[][]; label: string; className?: string }) {
  return <div shuku-edit-id="e-a10df521-2f4e-4bd7-ada3-59e7ed7fc8d8" className={`cg-copy-ck-sobel__matrix ${className}`} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }} role="img" aria-label={label}>
    {values.flatMap((row, y) => row.map((value, x) => <span shuku-edit-id="e-6af03e9e-6798-4231-abcd-4a914a69d8b9" className={value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : 'is-zero'} key={`${y}-${x}`}><MathFormulaStatic latex={String(value)} /></span>))}
  </div>;
}

function StepHeader({ number, children, action }: { number: string; children: ReactNode; action?: ReactNode }) {
  return <header shuku-edit-id="e-497f06ff-e326-41a1-86ed-d9ac158ba0c8" className="cg-copy-ck-sobel__step-header"><span shuku-edit-id="e-082a482d-8af0-4f19-88b2-610eb82ac0f2" className="cg-copy-ck-sobel__step-number"><Typography shuku-edit-id="e-e9aea7a5-fb73-4cb3-bd74-20d016c932db" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-b70af115-7b54-4a83-9818-81254d4e8a89" as="h2" variant="h3" tone="accent">{children}</Typography>{action}</header>;
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
  return <article shuku-edit-id="e-69d4f4bb-6ea9-4bfc-8f27-3e30e0a86ac9" className="cg-copy-ck-sobel__example">
    <header shuku-edit-id="e-13e1a0ed-1482-4f19-82e6-0b197520246f" className="cg-copy-ck-sobel__example-head"><Typography shuku-edit-id="e-af10e00c-3e31-4918-a39f-a998de29dfc6" as="h2" variant="h3" tone="accent">Sobel {x ? 'X：检测竖直边缘' : 'Y：检测水平边缘'}</Typography></header>
    <div shuku-edit-id="e-b9ac1fdf-a390-44e1-8e82-6a65815225dc" className="cg-copy-ck-sobel__example-visuals">
      <figure shuku-edit-id="e-25aaf8fe-73da-40b7-b9b5-b15065b6e6db"><img shuku-edit-id="e-51d0bc52-364b-4f5f-9174-53b43bbf2c2a" src={images?.input} alt={x ? '左暗右亮的输入图像' : '上暗下亮的输入图像'} /><Typography shuku-edit-id="e-b04d5818-e8d6-404d-9d0b-24aafa38e0ac" as="figcaption" variant="bodySmall" tone="accent">输入图像</Typography></figure>
      <div shuku-edit-id="e-45e0fff8-925a-4954-bdbd-55bb3edca14d" className="cg-copy-ck-sobel__apply"><MathFormulaStatic latex={x ? 'K_x*' : 'K_y*'} /><span shuku-edit-id="e-0f5b798d-b2c0-4d89-ba52-54ba3c7bf933" aria-hidden="true">→</span></div>
      <figure shuku-edit-id="e-a75bf144-8aca-4b0b-ab5c-669c878f8faf"><img shuku-edit-id="e-cf030d7f-d4b7-4481-b551-28bba290940e" src={images?.output} alt={x ? '竖直亮线响应' : '水平亮线响应'} /><Typography shuku-edit-id="e-0b975edb-022f-44be-b474-9cbd5025af09" as="figcaption" variant="bodySmall" tone="accent">输出响应（{x ? '竖直' : '水平'}边缘突出）</Typography></figure>
    </div>
  </article>;
}

export function SobelConstructionPage() {
  const examples = useExamples();
  const [axis, setAxis] = useState<'x' | 'y'>('x');
  const isX = axis === 'x';
  return <ContentBlock shuku-edit-id="e-df2ebbfe-517c-4b37-95aa-b3b2dddaa821" headingLevel={1} className="cg-copy-ck-sobel" title="从一阶差分到 Sobel" subtitle="Sobel 在目标方向上计算差分，在垂直方向上汇聚邻域信息。">
    <section shuku-edit-id="e-7dc33e8a-1e32-4f50-a6ee-263603337271" className="cg-copy-ck-sobel__construction" aria-label={`Sobel ${axis.toUpperCase()} 卷积核的构造过程`}>
      <article shuku-edit-id="e-7af227a7-ac0a-47e5-8bf3-1c54b8e6642d" className="cg-copy-ck-sobel__step"><StepHeader number="1">一维差分算子</StepHeader><div shuku-edit-id="e-233f7a6e-a108-4e98-9447-9463805f7e28" className={`cg-copy-ck-sobel__step-main ${isX ? '' : 'cg-copy-ck-sobel__step-main--vertical-diff'}`}><Matrix values={isX ? [[-1, 0, 1]] : [[-1], [0], [1]]} label={`${axis} 方向一维差分核：负一、零、一`} className={isX ? 'cg-copy-ck-sobel__matrix--row' : 'cg-copy-ck-sobel__matrix--column'} /><div shuku-edit-id="e-adfc5dd4-2f4a-4297-b1bc-a98381d0e68a" className="cg-copy-ck-sobel__step-copy"><Typography shuku-edit-id="e-5e4bcea1-326f-4310-9b29-e4f559d2552c" variant="h3" tone="accent">比较{isX ? '左右' : '上下'}两侧</Typography><Typography shuku-edit-id="e-ccace8b7-c882-45e1-ad7b-74c1d168e7f6" variant="body" tone="muted">对 {axis} 方向变化敏感</Typography></div></div></article>
      <article shuku-edit-id="e-53735cee-f91d-4483-b0b1-aec98d5acbc3" className="cg-copy-ck-sobel__step"><StepHeader number="2">一维平滑权重</StepHeader><div shuku-edit-id="e-f95c4d14-5210-4791-8b22-baca5dd13624" className={`cg-copy-ck-sobel__step-main cg-copy-ck-sobel__step-main--smoothing ${isX ? '' : 'cg-copy-ck-sobel__step-main--horizontal-smoothing'}`}><Matrix values={isX ? [[1], [2], [1]] : [[1, 2, 1]]} label={`${isX ? '垂直' : '水平'}方向平滑权重：一、二、一`} className={isX ? 'cg-copy-ck-sobel__matrix--column' : 'cg-copy-ck-sobel__matrix--row'} /><div shuku-edit-id="e-4e509e3a-f881-4e83-a499-4fb4f42c3a65" className="cg-copy-ck-sobel__step-copy"><Typography shuku-edit-id="e-738e3cc5-08dc-4007-b51f-e9f32907bcf7" variant="h3" tone="accent">在 {isX ? 'y' : 'x'} 方向加权平均</Typography><Typography shuku-edit-id="e-2cc7f975-acb6-4a56-a6b1-b5b305b156f3" variant="body" tone="muted">中心{isX ? '行' : '列'}权重更大</Typography></div></div></article>
      <article shuku-edit-id="e-e5a5c895-9e7e-42bf-8a15-b0b9e697fd6c" className="cg-copy-ck-sobel__step"><StepHeader number="3" action={<Switch label={isX ? 'Y' : 'X'} checked={!isX} onChange={(event) => setAxis(event.target.checked ? 'y' : 'x')} aria-label="切换 Sobel X 与 Sobel Y" />}>组合得到 Sobel {axis.toUpperCase()}</StepHeader><div shuku-edit-id="e-62116a51-9dbb-48c9-a67c-f61d01e9866f" className="cg-copy-ck-sobel__step-main cg-copy-ck-sobel__step-main--combined"><MathFormulaBlock ariaLabel={`Sobel ${axis.toUpperCase()} 由差分与正交方向平滑组合`} className="cg-copy-ck-sobel__composition"><MathFormulaTerm latex={isX ? 'K_x' : 'K_y'} tooltip={`Sobel ${axis.toUpperCase()} 卷积核，突出${isX ? '竖直' : '水平'}边缘。`} /><MathFormulaStatic latex="=" /><MathFormulaTerm latex={isX ? '[1\\quad2\\quad1]^T' : '[-1\\quad0\\quad1]^T'} tooltip={isX ? '垂直方向的一、二、一平滑权重。' : '垂直方向的差分权重。'} /><MathFormulaTerm latex={isX ? '[-1\\quad0\\quad1]' : '[1\\quad2\\quad1]'} tooltip={isX ? '水平方向的差分权重。' : '水平方向的一、二、一平滑权重。'} /></MathFormulaBlock><div shuku-edit-id="e-a48a8965-9a03-473a-892d-dc9a0d05bca6" className="cg-copy-ck-sobel__combination"><Matrix values={isX ? SOBEL_X : SOBEL_Y} label={`Sobel ${axis.toUpperCase()} 三乘三卷积核`} className="cg-copy-ck-sobel__matrix--sobel" /><Typography shuku-edit-id="e-9ad4c6d4-1ed0-4483-9dc9-bf09a8528a11" variant="h3" tone="accent">方向差分 ×<br shuku-edit-id="e-c6b54dea-0775-4f74-8ecc-9e110366b164" />正交方向平滑</Typography></div></div></article>
    </section>
    <section shuku-edit-id="e-40acb44b-dbc3-434c-a395-94e41d6d3e75" className="cg-copy-ck-sobel__examples" aria-label="Sobel X 与 Sobel Y 对应的边缘响应"><Example axis="x" images={examples?.x} /><Example axis="y" images={examples?.y} /></section>
    <footer shuku-edit-id="e-21ca1a90-560e-4525-bbd6-388dffdd7ce7" className="cg-copy-ck-sobel__summary"><span shuku-edit-id="e-8db55084-e978-439f-a40f-d1621d3748fb" className="cg-copy-ck-sobel__summary-icon"><Light theme="outline" size="32" fill="currentColor" /></span><Typography shuku-edit-id="e-e1f01a95-e8c6-44fc-9191-f7e4f29fb977" as="h2" variant="h3" tone="accent">要点：</Typography><Typography shuku-edit-id="e-9bb84c0c-ffc2-4332-935b-e7026aa2dce9" variant="body" tone="accent">Sobel 核 = 一阶差分（检测变化）× 正交方向平滑（抑制噪声），因此既有方向性，又更稳定。</Typography></footer>
  </ContentBlock>;
}

