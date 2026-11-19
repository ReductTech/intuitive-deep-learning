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
    <header shuku-edit-id="e-2c0800f2-a892-4388-b253-7264b1cecefe" className="cg-copy-ck-second__step-header">
      <Typography shuku-edit-id="e-fd67df15-ae26-49cc-90fb-8d2d0aa5cf5e" as="span" variant="h3" tone="light" className="cg-copy-ck-second__step-number">{number}</Typography>
      <Typography shuku-edit-id="e-300e3391-5bec-450d-9408-24c5759b27b8" as="h2" variant="h3" tone="accent">{children}</Typography>
    </header>
  );
}

function Signal({ values, tone = '' }: { values: string[]; tone?: string }) {
  return (
    <div shuku-edit-id="e-c2b10649-6932-43ec-ac89-7ee38b3c76b1" className={`cg-copy-ck-second__signal ${tone}`} role="img" aria-label={values.join('，')}>
      {values.map((value, index) => <Typography shuku-edit-id="e-4162e610-3549-4493-9332-14b930df5d59" as="span" variant="bodySmall" tone="accent" key={`${value}-${index}`}>{value}</Typography>)}
    </div>
  );
}

function DifferenceImage({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  return src
    ? <img shuku-edit-id="e-5ffe5db3-b97a-4ac8-8474-0b3ccddfbdff" className={`cg-copy-ck-second__image ${className}`} src={src} alt={alt} />
    : <div shuku-edit-id="e-2e6b9449-9e26-46a0-a69a-704229d508c5" className={`cg-copy-ck-second__image-loading ${className}`} role="img" aria-label={`${alt}正在计算`} />;
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
    <ContentBlock shuku-edit-id="e-53bb99d3-2866-4b3d-bdb9-54f8d56f4014" headingLevel={1} className="cg-copy-ck-second" title="二阶差分：变化如何继续变化" subtitle="一阶差分描述局部变化，二阶差分进一步描述变化率是否发生突变。">
      <div shuku-edit-id="e-ae42d3df-ff7c-42d0-a445-40485c0e69ef" className="cg-copy-ck-second__layout">
        <article shuku-edit-id="e-b4eb79d1-e433-4ce5-89f9-3a1a9a1edc45" className="cg-copy-ck-second__panel cg-copy-ck-second__panel--input">
          <StepHeader number="1">原图 <MathFormulaStatic latex="I" /></StepHeader>
          <DifferenceImage src={images?.input} alt="采尔马特山间建筑的灰度原图" className="cg-copy-ck-second__image--input" />
          <div shuku-edit-id="e-f350ceb5-2830-4d06-8c24-31a3f9cb50a9" className="cg-copy-ck-second__explanation"><Typography shuku-edit-id="e-0e7aa13e-0af2-4c16-b453-216750a4bf73" variant="body" tone="accent">像素值本身</Typography><Typography shuku-edit-id="e-75acffda-70b8-45f7-a6e2-846fbffd2c9c" variant="body" tone="accent">不直接表示变化</Typography></div>
        </article>
        <Typography shuku-edit-id="e-5d41a1e7-49e9-4d51-b83d-36934f2242dc" as="span" variant="h1" tone="accent" className="cg-copy-ck-second__arrow" aria-hidden="true">→</Typography>
        <article shuku-edit-id="e-71523d09-ddc9-4ca7-8e59-882d05ea86b1" className="cg-copy-ck-second__panel cg-copy-ck-second__panel--difference">
          <StepHeader number="2">一阶差分</StepHeader>
          <DifferenceFormula order={1} />
          <DifferenceImage src={images?.first} alt="采尔马特建筑局部的一阶差分图" className="cg-copy-ck-second__image--first" />
          <div shuku-edit-id="e-6529a4c9-1c53-43af-aeb4-5ad4fa1acd06" className="cg-copy-ck-second__explanation"><Typography shuku-edit-id="e-4f010b39-75da-4afd-b60d-f82a5212ee87" variant="body" tone="accent">比较相邻像素，描述变化强弱；<br shuku-edit-id="e-b7d69604-2f0e-4b0f-a58d-35839d46a01d" />常突出边缘。</Typography></div>
        </article>
        <Typography shuku-edit-id="e-b3910721-688b-4272-a63d-fa8df864a791" as="span" variant="h1" tone="accent" className="cg-copy-ck-second__arrow" aria-hidden="true">→</Typography>
        <article shuku-edit-id="e-b6ff2cd7-871f-4eee-8b13-73ead1906301" className="cg-copy-ck-second__panel cg-copy-ck-second__panel--difference">
          <StepHeader number="3">二阶差分</StepHeader>
          <DifferenceFormula order={2} />
          <DifferenceImage src={images?.second} alt="采尔马特建筑局部的二阶差分图" className="cg-copy-ck-second__image--second" />
          <div shuku-edit-id="e-e4ac80fe-2307-4fbc-a230-1dbfec39c99f" className="cg-copy-ck-second__explanation"><Typography shuku-edit-id="e-987bfd7c-d11f-46ee-8c2d-9d05541da4e2" variant="body" tone="accent">再次求差，观察变化率突变；<br shuku-edit-id="e-24c97ecf-bf27-4282-9b68-51690dfc6fa9" />对尖锐边缘更敏感。</Typography></div>
        </article>
      </div>
      <section shuku-edit-id="e-d38e117b-0d6f-4408-9ef0-341e8b5cbe77" className="cg-copy-ck-second__example" aria-label="一维信号的两次差分示例">
        <Typography shuku-edit-id="e-ca1852dd-484d-4fd1-84ad-031c2e4f174c" variant="h3" tone="light" className="cg-copy-ck-second__example-badge">一维示例</Typography>
        <div shuku-edit-id="e-6d31adc6-4920-4ba7-a9f5-0f188df24bb3" className="cg-copy-ck-second__example-signals">
          <div shuku-edit-id="e-398244de-b832-4689-b0cc-336416222029"><Typography shuku-edit-id="e-707f5178-c49a-4333-8439-60ac98c95a08" variant="bodySmall" tone="accent">原始信号 <MathFormulaStatic latex="f(x)" />：</Typography><Signal values={['2', '2', '2', '8', '8', '8']} /></div>
          <div shuku-edit-id="e-2dcffe07-8989-4cff-9ec4-dfec2ef30038"><Typography shuku-edit-id="e-3900d4a4-8fbb-4d55-b5e3-767cd8b59211" variant="bodySmall" tone="accent">一阶差分 <MathFormulaStatic latex="D^{(1)}" />：</Typography><Signal values={['0', '0', '+6', '0', '0']} tone="is-first" /></div>
          <div shuku-edit-id="e-dd6bbf91-70ad-4f2d-9dc8-5c596ccf3f6e"><Typography shuku-edit-id="e-932fde99-15f7-4deb-837f-d3ed1ddd969a" variant="bodySmall" tone="accent">二阶差分 <MathFormulaStatic latex="D^{(2)}" />：</Typography><Signal values={['0', '+6', '−6', '0']} tone="is-second" /></div>
        </div>
        <div shuku-edit-id="e-0b5c774b-429e-4796-b4f5-0564cc60bf5a" className="cg-copy-ck-second__example-takeaway"><Typography shuku-edit-id="e-b0cf9e8c-b121-45ae-addb-fd92926da178" variant="body" tone="accent">一阶差分找哪里<strong shuku-edit-id="e-107c2c70-214f-4fcf-8ee3-772f69c418c1">开始变</strong>，</Typography><Typography shuku-edit-id="e-a2d813d0-bac4-45a7-80ad-d435f5cf5c9c" variant="body" tone="accent">二阶差分看变化在哪里<strong shuku-edit-id="e-906abd8f-b8a5-4bb1-a53f-fa4a81d558ae">突然发生</strong>。</Typography></div>
      </section>
      <footer shuku-edit-id="e-d48d3da3-10d7-455e-8fd4-dbdd3c2f8f48" className="cg-copy-ck-second__summary">
        <Typography shuku-edit-id="e-4b342642-445c-4e6e-b147-2242ce8b493b" as="span" variant="h3" tone="accent">总结：</Typography>
        <Typography shuku-edit-id="e-56bd9c58-01f4-4b81-a3fd-af7f75ca06d8" variant="body">一阶差分看局部变化，二阶差分看变化率如何变化。前者强调“有没有变化”，后者强调“变化是否突变”。</Typography>
      </footer>
    </ContentBlock>
  );
}
