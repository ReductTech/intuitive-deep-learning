import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useState, type ReactNode } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import './SecondDifferencePage.css';

const zermattImage = moduleAssetUrl("workflow/convolution-course/caiermate.webp");

interface DifferenceImages {
  input: string;
  first: string;
  second: string;
}

function toGray(pixels: Uint8ClampedArray, width: number, height: number) {
  const gray = new Float32Array(width * height);
  for (let index = 0; index < gray.length; index += 1) {
    const offset = index * 4;
    gray[index] = (pixels[offset] * 0.299 + pixels[offset + 1] * 0.587 + pixels[offset + 2] * 0.114) / 255;
  }
  return gray;
}

function difference(values: Float32Array, width: number, height: number, kernel: number[]) {
  const outputWidth = width - kernel.length + 1;
  const output = new Float32Array(outputWidth * height);
  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < outputWidth; col += 1) {
      let sum = 0;
      for (let kernelCol = 0; kernelCol < kernel.length; kernelCol += 1) {
        sum += kernel[kernelCol] * values[row * width + col + kernelCol];
      }
      output[row * outputWidth + col] = sum;
    }
  }
  return { values: output, width: outputWidth, height };
}

function responseScale(values: Float32Array) {
  const magnitudes = Array.from(values, (value) => Math.abs(value)).sort((a, b) => a - b);
  return Math.max(0.02, magnitudes[Math.floor(magnitudes.length * 0.985)] ?? 0.02);
}

function renderGray(values: Float32Array, width: number, height: number, scale: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return '';
  const output = context.createImageData(width, height);
  for (let index = 0; index < values.length; index += 1) {
    const shade = Math.round(Math.min(1, Math.abs(values[index]) / scale) * 255);
    const offset = index * 4;
    output.data[offset] = shade;
    output.data[offset + 1] = shade;
    output.data[offset + 2] = shade;
    output.data[offset + 3] = 255;
  }
  context.putImageData(output, 0, 0);
  return canvas.toDataURL('image/png');
}

function buildDifferenceImages(image: HTMLImageElement): DifferenceImages | null {
  const width = 560;
  const height = Math.max(1, Math.round(width * image.naturalHeight / image.naturalWidth));
  const source = document.createElement('canvas');
  source.width = width;
  source.height = height;
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  if (!sourceContext) return null;
  sourceContext.drawImage(image, 0, 0, width, height);
  const input = toGray(sourceContext.getImageData(0, 0, width, height).data, width, height);
  const first = difference(input, width, height, [-1, 1]);
  const second = difference(first.values, first.width, first.height, [-1, 1]);
  return {
    input: source.toDataURL('image/png'),
    first: renderGray(first.values, first.width, first.height, responseScale(first.values)),
    second: renderGray(second.values, second.width, second.height, responseScale(second.values)),
  };
}

function useDifferenceImages() {
  const [images, setImages] = useState<DifferenceImages | null>(null);
  useEffect(() => {
    let active = true;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (active) setImages(buildDifferenceImages(image));
    };
    image.src = zermattImage;
    return () => { active = false; };
  }, []);
  return images;
}

function StepHeader({ number, children }: { number: string; children: ReactNode }) {
  return (
    <header shuku-edit-id="e-a6bd70ac-6324-4bba-9e28-5a8690ad18dd" className="cg-copy-ck-second__step-header">
      <Typography shuku-edit-id="e-5aa28f81-c734-43c7-b535-4fbdda843cab" as="span" variant="h3" tone="light" className="cg-copy-ck-second__step-number">{number}</Typography>
      <Typography shuku-edit-id="e-298a3aee-a318-4f4f-b7bc-acbb3b48de5a" as="h2" variant="h3" tone="accent">{children}</Typography>
    </header>
  );
}

function Signal({ values, tone = '' }: { values: string[]; tone?: string }) {
  return (
    <div shuku-edit-id="e-7f47b643-d12e-4c5b-81d2-6edf7905d4c3" className={`cg-copy-ck-second__signal ${tone}`} role="img" aria-label={values.join('，')}>
      {values.map((value, index) => <Typography shuku-edit-id="e-8b6ea0d7-be06-4808-8b68-53c1be0888ec" as="span" variant="bodySmall" tone="accent" key={`${value}-${index}`}>{value}</Typography>)}
    </div>
  );
}

function DifferenceImage({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  return src
    ? <img shuku-edit-id="e-81bbfd12-f4a1-4f8a-b069-64a3d4d6e0c9" className={`cg-copy-ck-second__image ${className}`} src={src} alt={alt} />
    : <div shuku-edit-id="e-529851de-d863-4c9d-89cd-bee4b1c29f80" className={`cg-copy-ck-second__image-loading ${className}`} role="img" aria-label={`${alt}正在计算`} />;
}

function DifferenceFormula({ order }: { order: 1 | 2 }) {
  const input = order === 1 ? 'I' : 'D^{(1)}';
  return (
    <MathFormulaBlock ariaLabel={`${order === 1 ? '一阶' : '二阶'}差分公式`} className="cg-copy-ck-second__formula">
      <MathFormulaTerm latex={`D^{(${order})}`} tooltip={`D 的上标 ${order}：第 ${order} 次差分的结果。`} ariaLabel={`第 ${order} 次差分的结果`} />
      <MathFormulaStatic latex="=" />
      <MathFormulaTerm latex={input} tooltip={order === 1 ? 'I：输入的灰度图像。' : 'D 的上标 1：已经计算出的一阶差分。'} ariaLabel={order === 1 ? '输入灰度图像' : '一阶差分结果'} />
      <MathFormulaTerm latex="*" tooltip="将相邻位置与差分核对应相乘并求和。" ariaLabel="应用差分核" />
      <MathFormulaStatic latex="[" />
      <MathFormulaTerm latex="-1" tooltip="−1：减去当前像素值。" ariaLabel="负一，减去当前像素值" />
      <MathFormulaTerm latex="1" tooltip="1：加上右侧相邻像素值。" ariaLabel="正一，加上右侧相邻像素值" className="cg-copy-ck-second__kernel-next" />
      <MathFormulaStatic latex="]" />
    </MathFormulaBlock>
  );
}

export function SecondDifferencePage() {
  const images = useDifferenceImages();
  return (
    <ContentBlock shuku-edit-id="e-29fe5870-4c24-4be4-9ab2-be14f9526ced" headingLevel={1} className="cg-copy-ck-second" title="二阶差分：变化如何继续变化" subtitle="一阶差分描述局部变化，二阶差分进一步描述变化率是否发生突变。">
      <div shuku-edit-id="e-1fd2c025-c171-46b6-b97a-b987c53595cf" className="cg-copy-ck-second__layout">
        <article shuku-edit-id="e-9c393b22-d5de-4f52-b868-e9b12cfd4861" className="cg-copy-ck-second__panel cg-copy-ck-second__panel--input">
          <StepHeader number="1">原图 <MathFormulaStatic latex="I" /></StepHeader>
          <DifferenceImage src={images?.input} alt="采尔马特山间建筑的灰度原图" className="cg-copy-ck-second__image--input" />
          <div shuku-edit-id="e-8bce499d-c19b-434a-b668-cff7bee4a3e9" className="cg-copy-ck-second__explanation"><Typography shuku-edit-id="e-47ddbbcd-7b95-4d09-8a9a-238f7656a84e" variant="body" tone="accent">像素值本身</Typography><Typography shuku-edit-id="e-c5364e85-18e6-4ae9-941f-5290be994a07" variant="body" tone="accent">不直接表示变化</Typography></div>
        </article>
        <Typography shuku-edit-id="e-4fc1adbc-bb44-40cf-8ca6-bb29dfcdf806" as="span" variant="h1" tone="accent" className="cg-copy-ck-second__arrow" aria-hidden="true">→</Typography>
        <article shuku-edit-id="e-594d04f0-786d-42fc-8bd1-d415ab669e11" className="cg-copy-ck-second__panel cg-copy-ck-second__panel--difference">
          <StepHeader number="2">一阶差分</StepHeader>
          <DifferenceFormula order={1} />
          <DifferenceImage src={images?.first} alt="采尔马特建筑局部的一阶差分图" className="cg-copy-ck-second__image--first" />
          <div shuku-edit-id="e-b31a7706-3f8a-4598-a6cd-c2ee413ba645" className="cg-copy-ck-second__explanation"><Typography shuku-edit-id="e-d0104fe4-fb14-4b18-a022-edf38d120135" variant="body" tone="accent">比较相邻像素，描述变化强弱；<br shuku-edit-id="e-5565535f-732e-4661-bac6-18e156bd5708" />常突出边缘。</Typography></div>
        </article>
        <Typography shuku-edit-id="e-e3b365a0-11c9-435a-9257-1cf824984755" as="span" variant="h1" tone="accent" className="cg-copy-ck-second__arrow" aria-hidden="true">→</Typography>
        <article shuku-edit-id="e-1d6a60b8-7a50-40d5-953f-d8f0ab6d9f76" className="cg-copy-ck-second__panel cg-copy-ck-second__panel--difference">
          <StepHeader number="3">二阶差分</StepHeader>
          <DifferenceFormula order={2} />
          <DifferenceImage src={images?.second} alt="采尔马特建筑局部的二阶差分图" className="cg-copy-ck-second__image--second" />
          <div shuku-edit-id="e-c2b5406d-f44c-4c45-9c6b-dd3e85332741" className="cg-copy-ck-second__explanation"><Typography shuku-edit-id="e-269025e6-16f6-4cab-b7bb-83649aaab20e" variant="body" tone="accent">再次求差，观察变化率突变；<br shuku-edit-id="e-03b6db18-bc7c-4d91-84c4-8ce42c06b550" />对尖锐边缘更敏感。</Typography></div>
        </article>
      </div>
      <section shuku-edit-id="e-a60c6ba1-b60b-4cdf-b1ac-181fc73047e4" className="cg-copy-ck-second__example" aria-label="一维信号的两次差分示例">
        <Typography shuku-edit-id="e-44c7c19a-71c9-4ab1-a994-5cf644cba9bc" variant="h3" tone="light" className="cg-copy-ck-second__example-badge">一维示例</Typography>
        <div shuku-edit-id="e-d1f12c54-14b5-4f4a-8693-dea434a50eff" className="cg-copy-ck-second__example-signals">
          <div shuku-edit-id="e-5cdc4b7b-426b-4327-9b49-8fcda51a6ace"><Typography shuku-edit-id="e-390b171f-4606-413b-9d27-133a9034b479" variant="bodySmall" tone="accent">原始信号 <MathFormulaStatic latex="f(x)" />：</Typography><Signal values={['2', '2', '2', '8', '8', '8']} /></div>
          <div shuku-edit-id="e-b4d97aa7-fa46-44b7-a2e7-c26dc758f52d"><Typography shuku-edit-id="e-626b7028-33c1-4291-9f27-1125f5763055" variant="bodySmall" tone="accent">一阶差分 <MathFormulaStatic latex="D^{(1)}" />：</Typography><Signal values={['0', '0', '+6', '0', '0']} tone="is-first" /></div>
          <div shuku-edit-id="e-a7798c7f-35d6-4f15-b2a8-df29d3833a84"><Typography shuku-edit-id="e-ba52404a-8b2c-46e8-8973-e9c355052c21" variant="bodySmall" tone="accent">二阶差分 <MathFormulaStatic latex="D^{(2)}" />：</Typography><Signal values={['0', '+6', '−6', '0']} tone="is-second" /></div>
        </div>
        <div shuku-edit-id="e-05351920-0008-40cf-97cb-e053f7d2f7b9" className="cg-copy-ck-second__example-takeaway"><Typography shuku-edit-id="e-0166d556-0543-4a19-a252-36c52c23311a" variant="body" tone="accent">一阶差分找哪里<strong shuku-edit-id="e-aecd1e7f-eede-42fc-850b-6fda8ba1d93d">开始变</strong>，</Typography><Typography shuku-edit-id="e-01c1de32-41fb-4f62-8214-4a42b30e1ce5" variant="body" tone="accent">二阶差分看变化在哪里<strong shuku-edit-id="e-512693e0-2bb3-481a-86f1-16cbd16fa348">突然发生</strong>。</Typography></div>
      </section>
      <footer shuku-edit-id="e-45462fd2-ed98-41e8-830d-54b369162196" className="cg-copy-ck-second__summary">
        <Typography shuku-edit-id="e-b275c410-ed51-44ad-88fc-76d0abde1a04" as="span" variant="h3" tone="accent">总结：</Typography>
        <Typography shuku-edit-id="e-12b2d716-b4cb-47a0-9592-1699b49bc566" variant="body">一阶差分看局部变化，二阶差分看变化率如何变化。前者强调“有没有变化”，后者强调“变化是否突变”。</Typography>
      </footer>
    </ContentBlock>
  );
}
