import { useEffect, useState, type ReactNode } from 'react';
import { Light } from '@icon-park/react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Switch, Typography } from "@shuku/course-style/react";
import './SobelConstructionPage.css';

const SOBEL_X = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
const SOBEL_Y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

function Matrix({ values, label, className = '' }: { values: number[][]; label: string; className?: string }) {
  return <div shuku-edit-id="e-b70e5d94-b3f9-40eb-b798-4589c855d264" className={`aipe-replay-cg-copy-ck-sobel__matrix ${className}`} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }} role="img" aria-label={label}>
    {values.flatMap((row, y) => row.map((value, x) => <span shuku-edit-id="e-085e4610-72cd-4f1c-8307-f4289e533f9e" className={value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : 'is-zero'} key={`${y}-${x}`}><MathFormulaStatic latex={String(value)} /></span>))}
  </div>;
}

function StepHeader({ number, children, action }: { number: string; children: ReactNode; action?: ReactNode }) {
  return <header shuku-edit-id="e-e2dc081d-66e5-4490-bfdf-942fa04998b8" className="aipe-replay-cg-copy-ck-sobel__step-header"><span shuku-edit-id="e-2484715b-2047-4511-89e4-a6e4a42da88e" className="aipe-replay-cg-copy-ck-sobel__step-number"><Typography shuku-edit-id="e-061fedbd-f8e3-4a15-adb8-a3bda53675fc" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-82177090-d660-45c7-8802-67852c6573c6" as="h2" variant="h3" tone="accent">{children}</Typography>{action}</header>;
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
  return <article shuku-edit-id="e-45e1fcda-cb37-496f-b3b5-0d59e01b9acd" className="aipe-replay-cg-copy-ck-sobel__example">
    <header shuku-edit-id="e-98294f13-41ae-4fc3-92a2-933afc8f2934" className="aipe-replay-cg-copy-ck-sobel__example-head"><Typography shuku-edit-id="e-753392e4-51ce-45f9-a53c-70f9595f779f" as="h2" variant="h3" tone="accent">Sobel {x ? 'X：检测竖直边缘' : 'Y：检测水平边缘'}</Typography></header>
    <div shuku-edit-id="e-d61fb6e3-c6e2-4764-8ade-b971c9bd5e0a" className="aipe-replay-cg-copy-ck-sobel__example-visuals">
      <figure shuku-edit-id="e-f2a3ea56-ef98-4855-ba11-739fa12c6a10"><img shuku-edit-id="e-f8ddebba-2f7c-4396-8f0e-123bebc383ee" src={images?.input} alt={x ? '左暗右亮的输入图像' : '上暗下亮的输入图像'} /><Typography shuku-edit-id="e-d8934939-3980-4b23-ae31-245a499d9809" as="figcaption" variant="bodySmall" tone="accent">输入图像</Typography></figure>
      <div shuku-edit-id="e-ad723a2a-50a1-47d5-b046-de6ca1f94626" className="aipe-replay-cg-copy-ck-sobel__apply"><MathFormulaStatic latex={x ? 'K_x*' : 'K_y*'} /><span shuku-edit-id="e-b0067cec-7a72-47cb-afca-c41f485134f6" aria-hidden="true">→</span></div>
      <figure shuku-edit-id="e-18c2257d-c074-4521-9e1f-fadc8d853b13"><img shuku-edit-id="e-456b50be-8c74-4dba-af12-29ce284578af" src={images?.output} alt={x ? '竖直亮线响应' : '水平亮线响应'} /><Typography shuku-edit-id="e-121e3ba0-eb26-4ad6-b651-e4084412c7c1" as="figcaption" variant="bodySmall" tone="accent">输出响应（{x ? '竖直' : '水平'}边缘突出）</Typography></figure>
    </div>
  </article>;
}

export function SobelConstructionPage() {
  const examples = useExamples();
  const [axis, setAxis] = useState<'x' | 'y'>('x');
  const isX = axis === 'x';
  return <ContentBlock shuku-edit-id="e-46090c61-3db7-49c3-b322-d5c58e7f700a" headingLevel={1} className="aipe-replay-cg-copy-ck-sobel" title="从一阶差分到 Sobel" subtitle="Sobel 在目标方向上计算差分，在垂直方向上汇聚邻域信息。">
    <section shuku-edit-id="e-b2679c22-4e47-4796-86fe-bd10a3a0a2b6" className="aipe-replay-cg-copy-ck-sobel__construction" aria-label={`Sobel ${axis.toUpperCase()} 卷积核的构造过程`}>
      <article shuku-edit-id="e-05219e5a-2707-4e68-8dce-8e065607c1cc" className="aipe-replay-cg-copy-ck-sobel__step"><StepHeader number="1">一维差分算子</StepHeader><div shuku-edit-id="e-34fd406c-44f4-476d-a052-eaa0aea1a2f5" className={`aipe-replay-cg-copy-ck-sobel__step-main ${isX ? '' : 'aipe-replay-cg-copy-ck-sobel__step-main--vertical-diff'}`}><Matrix values={isX ? [[-1, 0, 1]] : [[-1], [0], [1]]} label={`${axis} 方向一维差分核：负一、零、一`} className={isX ? 'aipe-replay-cg-copy-ck-sobel__matrix--row' : 'aipe-replay-cg-copy-ck-sobel__matrix--column'} /><div shuku-edit-id="e-89e08c3e-72a1-44c3-8e9b-1889c2baa88f" className="aipe-replay-cg-copy-ck-sobel__step-copy"><Typography shuku-edit-id="e-7bad0c4f-5384-4ca1-9999-1e3fe9edd730" variant="h3" tone="accent">比较{isX ? '左右' : '上下'}两侧</Typography><Typography shuku-edit-id="e-d5fe7856-0dbd-4d94-b579-1c614c585514" variant="body" tone="muted">对 {axis} 方向变化敏感</Typography></div></div></article>
      <article shuku-edit-id="e-6f212bb2-9625-4a14-9cc4-aa3cc9f0ba66" className="aipe-replay-cg-copy-ck-sobel__step"><StepHeader number="2">一维平滑权重</StepHeader><div shuku-edit-id="e-f4c608cf-c721-4587-99f9-8c4bfff2da04" className={`aipe-replay-cg-copy-ck-sobel__step-main aipe-replay-cg-copy-ck-sobel__step-main--smoothing ${isX ? '' : 'aipe-replay-cg-copy-ck-sobel__step-main--horizontal-smoothing'}`}><Matrix values={isX ? [[1], [2], [1]] : [[1, 2, 1]]} label={`${isX ? '垂直' : '水平'}方向平滑权重：一、二、一`} className={isX ? 'aipe-replay-cg-copy-ck-sobel__matrix--column' : 'aipe-replay-cg-copy-ck-sobel__matrix--row'} /><div shuku-edit-id="e-d61c68de-bc2b-4b08-9e9a-67ed092c1c71" className="aipe-replay-cg-copy-ck-sobel__step-copy"><Typography shuku-edit-id="e-f3481db2-a30e-4693-bccb-e6a3df7c1233" variant="h3" tone="accent">在 {isX ? 'y' : 'x'} 方向加权平均</Typography><Typography shuku-edit-id="e-b3d20067-52f3-4d2d-8b46-eb1c4beafbc8" variant="body" tone="muted">中心{isX ? '行' : '列'}权重更大</Typography></div></div></article>
      <article shuku-edit-id="e-689aefa0-39e1-400f-bf59-d771872ca935" className="aipe-replay-cg-copy-ck-sobel__step"><StepHeader number="3" action={<Switch label={isX ? 'Y' : 'X'} checked={!isX} onChange={(event) => setAxis(event.target.checked ? 'y' : 'x')} aria-label="切换 Sobel X 与 Sobel Y" />}>组合得到 Sobel {axis.toUpperCase()}</StepHeader><div shuku-edit-id="e-7c81e682-e5e1-4892-9098-f77466dfe51e" className="aipe-replay-cg-copy-ck-sobel__step-main aipe-replay-cg-copy-ck-sobel__step-main--combined"><MathFormulaBlock ariaLabel={`Sobel ${axis.toUpperCase()} 由差分与正交方向平滑组合`} className="aipe-replay-cg-copy-ck-sobel__composition"><MathFormulaTerm latex={isX ? 'K_x' : 'K_y'} tooltip={`Sobel ${axis.toUpperCase()} 卷积核，突出${isX ? '竖直' : '水平'}边缘。`} /><MathFormulaStatic latex="=" /><MathFormulaTerm latex={isX ? '[1\\quad2\\quad1]^T' : '[-1\\quad0\\quad1]^T'} tooltip={isX ? '垂直方向的一、二、一平滑权重。' : '垂直方向的差分权重。'} /><MathFormulaTerm latex={isX ? '[-1\\quad0\\quad1]' : '[1\\quad2\\quad1]'} tooltip={isX ? '水平方向的差分权重。' : '水平方向的一、二、一平滑权重。'} /></MathFormulaBlock><div shuku-edit-id="e-afa2ae74-c312-4466-8a9e-e9841ae58cbc" className="aipe-replay-cg-copy-ck-sobel__combination"><Matrix values={isX ? SOBEL_X : SOBEL_Y} label={`Sobel ${axis.toUpperCase()} 三乘三卷积核`} className="aipe-replay-cg-copy-ck-sobel__matrix--sobel" /><Typography shuku-edit-id="e-d6e7e8db-527b-49d1-bfc5-21cebc6f7567" variant="h3" tone="accent">方向差分 ×<br shuku-edit-id="e-399e2976-a5f7-4127-98eb-d273a1d5f7c3" />正交方向平滑</Typography></div></div></article>
    </section>
    <section shuku-edit-id="e-237f8a27-1b42-4176-8d37-925fb77e7a85" className="aipe-replay-cg-copy-ck-sobel__examples" aria-label="Sobel X 与 Sobel Y 对应的边缘响应"><Example axis="x" images={examples?.x} /><Example axis="y" images={examples?.y} /></section>
    <footer shuku-edit-id="e-9abcf907-c2e6-4d0e-bf9b-dce21ab9ae5f" className="aipe-replay-cg-copy-ck-sobel__summary"><span shuku-edit-id="e-0f047a1c-3530-400e-b752-d601490b6371" className="aipe-replay-cg-copy-ck-sobel__summary-icon"><Light theme="outline" size="32" fill="currentColor" /></span><Typography shuku-edit-id="e-6ec78d13-5e07-4d6a-a0e2-9cbeb3f860f8" as="h2" variant="h3" tone="accent">要点：</Typography><Typography shuku-edit-id="e-13349e0a-88d8-45ea-a423-37d0dfbfc2d6" variant="body" tone="accent">Sobel 核 = 一阶差分（检测变化）× 正交方向平滑（抑制噪声），因此既有方向性，又更稳定。</Typography></footer>
  </ContentBlock>;
}

