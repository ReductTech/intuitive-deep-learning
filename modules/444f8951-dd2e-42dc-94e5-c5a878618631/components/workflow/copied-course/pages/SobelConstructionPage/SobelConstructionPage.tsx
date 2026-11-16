import { useEffect, useState, type ReactNode } from 'react';
import { Light } from '@icon-park/react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Switch, Typography } from "@shuku/course-style/react";
import './SobelConstructionPage.css';

const SOBEL_X = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
const SOBEL_Y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

function Matrix({ values, label, className = '' }: { values: number[][]; label: string; className?: string }) {
  return <div shuku-edit-id="e-71bfb8f6-14fc-47b6-bcba-8cf54c9913d1" className={`cg-copy-ck-sobel__matrix ${className}`} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }} role="img" aria-label={label}>
    {values.flatMap((row, y) => row.map((value, x) => <span shuku-edit-id="e-01c36e51-dc35-477e-8755-67644c1e761b" className={value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : 'is-zero'} key={`${y}-${x}`}><MathFormulaStatic latex={String(value)} /></span>))}
  </div>;
}

function StepHeader({ number, children, action }: { number: string; children: ReactNode; action?: ReactNode }) {
  return <header shuku-edit-id="e-3021e8d9-3a47-4566-9f01-5e727933715f" className="cg-copy-ck-sobel__step-header"><span shuku-edit-id="e-41f5dd91-422c-4e2d-b76c-83d81edb74b4" className="cg-copy-ck-sobel__step-number"><Typography shuku-edit-id="e-75786818-2801-40ea-8bce-5d757d4fef4f" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-2e44985b-92fb-48a5-a282-065860784b06" as="h2" variant="h3" tone="accent">{children}</Typography>{action}</header>;
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
  return <article shuku-edit-id="e-14bce996-883e-4a1e-bb28-56ddd1b04c26" className="cg-copy-ck-sobel__example">
    <header shuku-edit-id="e-696105e6-0385-44d7-8fcc-89c05d21fdf3" className="cg-copy-ck-sobel__example-head"><Typography shuku-edit-id="e-8bec535f-da15-4216-968c-75b0cdcf1904" as="h2" variant="h3" tone="accent">Sobel {x ? 'X：检测竖直边缘' : 'Y：检测水平边缘'}</Typography></header>
    <div shuku-edit-id="e-a888546c-6bdb-40e5-94b1-adf22c7ea421" className="cg-copy-ck-sobel__example-visuals">
      <figure shuku-edit-id="e-0f2ea431-71a5-410d-8f20-383ddd10b243"><img shuku-edit-id="e-f4b4de6a-79c1-47b1-a8f4-be055149cfae" src={images?.input} alt={x ? '左暗右亮的输入图像' : '上暗下亮的输入图像'} /><Typography shuku-edit-id="e-aa7fe082-3487-49d3-9833-b86131fb8d51" as="figcaption" variant="bodySmall" tone="accent">输入图像</Typography></figure>
      <div shuku-edit-id="e-fe5350e1-a364-48da-8cfc-c13cd1824848" className="cg-copy-ck-sobel__apply"><MathFormulaStatic latex={x ? 'K_x*' : 'K_y*'} /><span shuku-edit-id="e-a8e3f826-b23e-4634-8996-196c111bc83a" aria-hidden="true">→</span></div>
      <figure shuku-edit-id="e-9722d904-5a9e-4ce4-8df1-5ee0c04a9740"><img shuku-edit-id="e-a2a36e5e-cd45-4f44-be0b-4f476716e76a" src={images?.output} alt={x ? '竖直亮线响应' : '水平亮线响应'} /><Typography shuku-edit-id="e-e923e511-d6f0-432a-a01f-ced053cacd8d" as="figcaption" variant="bodySmall" tone="accent">输出响应（{x ? '竖直' : '水平'}边缘突出）</Typography></figure>
    </div>
  </article>;
}

export function SobelConstructionPage() {
  const examples = useExamples();
  const [axis, setAxis] = useState<'x' | 'y'>('x');
  const isX = axis === 'x';
  return <ContentBlock shuku-edit-id="e-2abcf9ff-94cb-45c8-a792-77d8668a3141" headingLevel={1} className="cg-copy-ck-sobel" title="从一阶差分到 Sobel" subtitle="Sobel 在目标方向上计算差分，在垂直方向上汇聚邻域信息。">
    <section shuku-edit-id="e-9a01b4c5-8aa9-4056-98f6-7278dd671036" className="cg-copy-ck-sobel__construction" aria-label={`Sobel ${axis.toUpperCase()} 卷积核的构造过程`}>
      <article shuku-edit-id="e-ef94b76c-5a4b-442c-8107-92c292a2b6a1" className="cg-copy-ck-sobel__step"><StepHeader number="1">一维差分算子</StepHeader><div shuku-edit-id="e-ceccddcc-5024-439a-8723-a27fe156e74c" className={`cg-copy-ck-sobel__step-main ${isX ? '' : 'cg-copy-ck-sobel__step-main--vertical-diff'}`}><Matrix values={isX ? [[-1, 0, 1]] : [[-1], [0], [1]]} label={`${axis} 方向一维差分核：负一、零、一`} className={isX ? 'cg-copy-ck-sobel__matrix--row' : 'cg-copy-ck-sobel__matrix--column'} /><div shuku-edit-id="e-44378f2a-f3af-4776-9c3c-1f633dfd6514" className="cg-copy-ck-sobel__step-copy"><Typography shuku-edit-id="e-e3c7d407-4b27-4cde-aaba-a39388d7abee" variant="h3" tone="accent">比较{isX ? '左右' : '上下'}两侧</Typography><Typography shuku-edit-id="e-ea96d500-66d8-4b41-abe5-794d512aa255" variant="body" tone="muted">对 {axis} 方向变化敏感</Typography></div></div></article>
      <article shuku-edit-id="e-13572690-a975-49c3-9f22-93520ec9f795" className="cg-copy-ck-sobel__step"><StepHeader number="2">一维平滑权重</StepHeader><div shuku-edit-id="e-7eaeba17-6a14-4b85-b98a-6ed86036d599" className={`cg-copy-ck-sobel__step-main cg-copy-ck-sobel__step-main--smoothing ${isX ? '' : 'cg-copy-ck-sobel__step-main--horizontal-smoothing'}`}><Matrix values={isX ? [[1], [2], [1]] : [[1, 2, 1]]} label={`${isX ? '垂直' : '水平'}方向平滑权重：一、二、一`} className={isX ? 'cg-copy-ck-sobel__matrix--column' : 'cg-copy-ck-sobel__matrix--row'} /><div shuku-edit-id="e-abd077c7-ac91-44c5-adaa-299873f3f6fa" className="cg-copy-ck-sobel__step-copy"><Typography shuku-edit-id="e-29bf5906-3bc9-48b9-8eb0-52c24804fc3b" variant="h3" tone="accent">在 {isX ? 'y' : 'x'} 方向加权平均</Typography><Typography shuku-edit-id="e-ba54c2b1-99fa-4702-9be6-5925e77bddf0" variant="body" tone="muted">中心{isX ? '行' : '列'}权重更大</Typography></div></div></article>
      <article shuku-edit-id="e-5ca08b8e-e0c4-483c-a7b6-80aee83ddb49" className="cg-copy-ck-sobel__step"><StepHeader number="3" action={<Switch label={isX ? 'Y' : 'X'} checked={!isX} onChange={(event) => setAxis(event.target.checked ? 'y' : 'x')} aria-label="切换 Sobel X 与 Sobel Y" />}>组合得到 Sobel {axis.toUpperCase()}</StepHeader><div shuku-edit-id="e-646bad8c-b2ac-47af-8e45-c95ffbd276c9" className="cg-copy-ck-sobel__step-main cg-copy-ck-sobel__step-main--combined"><MathFormulaBlock ariaLabel={`Sobel ${axis.toUpperCase()} 由差分与正交方向平滑组合`} className="cg-copy-ck-sobel__composition"><MathFormulaTerm latex={isX ? 'K_x' : 'K_y'} tooltip={`Sobel ${axis.toUpperCase()} 卷积核，突出${isX ? '竖直' : '水平'}边缘。`} /><MathFormulaStatic latex="=" /><MathFormulaTerm latex={isX ? '[1\\quad2\\quad1]^T' : '[-1\\quad0\\quad1]^T'} tooltip={isX ? '垂直方向的一、二、一平滑权重。' : '垂直方向的差分权重。'} /><MathFormulaTerm latex={isX ? '[-1\\quad0\\quad1]' : '[1\\quad2\\quad1]'} tooltip={isX ? '水平方向的差分权重。' : '水平方向的一、二、一平滑权重。'} /></MathFormulaBlock><div shuku-edit-id="e-d70e6a1f-0879-49b5-8ebb-19c1cee0e198" className="cg-copy-ck-sobel__combination"><Matrix values={isX ? SOBEL_X : SOBEL_Y} label={`Sobel ${axis.toUpperCase()} 三乘三卷积核`} className="cg-copy-ck-sobel__matrix--sobel" /><Typography shuku-edit-id="e-7d0b479b-c5e4-49ff-94e9-5027765dfca6" variant="h3" tone="accent">方向差分 ×<br shuku-edit-id="e-42c54267-bc43-4774-a2bb-f2bd25b64ae0" />正交方向平滑</Typography></div></div></article>
    </section>
    <section shuku-edit-id="e-838aab09-bac2-420a-bce0-d7c2762e79b9" className="cg-copy-ck-sobel__examples" aria-label="Sobel X 与 Sobel Y 对应的边缘响应"><Example axis="x" images={examples?.x} /><Example axis="y" images={examples?.y} /></section>
    <footer shuku-edit-id="e-0ef46f39-0383-4965-a0a2-4fdef836a733" className="cg-copy-ck-sobel__summary"><span shuku-edit-id="e-7b96de7a-27ed-4d20-95ea-2930e2f25a5e" className="cg-copy-ck-sobel__summary-icon"><Light theme="outline" size="32" fill="currentColor" /></span><Typography shuku-edit-id="e-4f220963-c6ff-4399-b48c-321393482290" as="h2" variant="h3" tone="accent">要点：</Typography><Typography shuku-edit-id="e-412b7181-b3f9-4092-adcf-09a271f07e8a" variant="body" tone="accent">Sobel 核 = 一阶差分（检测变化）× 正交方向平滑（抑制噪声），因此既有方向性，又更稳定。</Typography></footer>
  </ContentBlock>;
}

