import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { creatorGuideAssetUrl } from '../../../../../creatorGuideAssets';
import { useEffect, useState, type ReactNode } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import './SecondDifferencePage.css';

const zermattImage = creatorGuideAssetUrl('444f8951-dd2e-42dc-94e5-c5a878618631', 'workflow/convolution-course/caiermate.jpg');

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
    <header shuku-edit-id="e-00c9bdf6-60d2-41cc-80cc-dec1b14b00fb" className="aipe-replay-cg-copy-ck-second__step-header">
      <Typography shuku-edit-id="e-86ddd725-5a94-415d-be4c-e47945e5d1a6" as="span" variant="h3" tone="light" className="aipe-replay-cg-copy-ck-second__step-number">{number}</Typography>
      <Typography shuku-edit-id="e-ef62e21f-1da4-4da2-a168-df56681d7993" as="h2" variant="h3" tone="accent">{children}</Typography>
    </header>
  );
}

function Signal({ values, tone = '' }: { values: string[]; tone?: string }) {
  return (
    <div shuku-edit-id="e-a0c33a02-4fde-49f3-8623-9641e602f9b6" className={`aipe-replay-cg-copy-ck-second__signal ${tone}`} role="img" aria-label={values.join('，')}>
      {values.map((value, index) => <Typography shuku-edit-id="e-6a7b3704-9b97-44df-a158-9f6052ed126f" as="span" variant="bodySmall" tone="accent" key={`${value}-${index}`}>{value}</Typography>)}
    </div>
  );
}

function DifferenceImage({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  return src
    ? <img shuku-edit-id="e-78861727-9c10-45dd-956b-0aa134c1c29c" className={`aipe-replay-cg-copy-ck-second__image ${className}`} src={src} alt={alt} />
    : <div shuku-edit-id="e-3aa321cb-fc62-4133-a0e4-41e349906789" className={`aipe-replay-cg-copy-ck-second__image-loading ${className}`} role="img" aria-label={`${alt}正在计算`} />;
}

function DifferenceFormula({ order }: { order: 1 | 2 }) {
  const input = order === 1 ? 'I' : 'D^{(1)}';
  return (
    <MathFormulaBlock ariaLabel={`${order === 1 ? '一阶' : '二阶'}差分公式`} className="aipe-replay-cg-copy-ck-second__formula">
      <MathFormulaTerm latex={`D^{(${order})}`} tooltip={`D 的上标 ${order}：第 ${order} 次差分的结果。`} ariaLabel={`第 ${order} 次差分的结果`} />
      <MathFormulaStatic latex="=" />
      <MathFormulaTerm latex={input} tooltip={order === 1 ? 'I：输入的灰度图像。' : 'D 的上标 1：已经计算出的一阶差分。'} ariaLabel={order === 1 ? '输入灰度图像' : '一阶差分结果'} />
      <MathFormulaTerm latex="*" tooltip="将相邻位置与差分核对应相乘并求和。" ariaLabel="应用差分核" />
      <MathFormulaStatic latex="[" />
      <MathFormulaTerm latex="-1" tooltip="−1：减去当前像素值。" ariaLabel="负一，减去当前像素值" />
      <MathFormulaTerm latex="1" tooltip="1：加上右侧相邻像素值。" ariaLabel="正一，加上右侧相邻像素值" className="aipe-replay-cg-copy-ck-second__kernel-next" />
      <MathFormulaStatic latex="]" />
    </MathFormulaBlock>
  );
}

export function SecondDifferencePage() {
  const images = useDifferenceImages();
  return (
    <ContentBlock shuku-edit-id="e-619212b4-d681-4d4c-9297-ca6d638d8649" headingLevel={1} className="aipe-replay-cg-copy-ck-second" title="二阶差分：变化如何继续变化" subtitle="一阶差分描述局部变化，二阶差分进一步描述变化率是否发生突变。">
      <div shuku-edit-id="e-946c7c43-723f-4fb2-9142-f43f3a2088eb" className="aipe-replay-cg-copy-ck-second__layout">
        <article shuku-edit-id="e-e514aff7-b9fe-40fc-9c95-ee63f2587850" className="aipe-replay-cg-copy-ck-second__panel aipe-replay-cg-copy-ck-second__panel--input">
          <StepHeader number="1">原图 <MathFormulaStatic latex="I" /></StepHeader>
          <DifferenceImage src={images?.input} alt="采尔马特山间建筑的灰度原图" className="aipe-replay-cg-copy-ck-second__image--input" />
          <div shuku-edit-id="e-ddaa1af8-5d30-4712-9e97-ff246b239966" className="aipe-replay-cg-copy-ck-second__explanation"><Typography shuku-edit-id="e-412ea68a-8df5-4556-9740-08fc8ca2f120" variant="body" tone="accent">像素值本身</Typography><Typography shuku-edit-id="e-7c79b1d3-2a70-41de-a74e-798862208082" variant="body" tone="accent">不直接表示变化</Typography></div>
        </article>
        <Typography shuku-edit-id="e-96dcdf03-76e0-4f0d-80df-4ad3aa36b078" as="span" variant="h1" tone="accent" className="aipe-replay-cg-copy-ck-second__arrow" aria-hidden="true">→</Typography>
        <article shuku-edit-id="e-19773875-d0c8-4e35-88c0-72184b9e921b" className="aipe-replay-cg-copy-ck-second__panel aipe-replay-cg-copy-ck-second__panel--difference">
          <StepHeader number="2">一阶差分</StepHeader>
          <DifferenceFormula order={1} />
          <DifferenceImage src={images?.first} alt="采尔马特建筑局部的一阶差分图" className="aipe-replay-cg-copy-ck-second__image--first" />
          <div shuku-edit-id="e-0b228ca3-4222-4467-a4fa-18bfa9a0379e" className="aipe-replay-cg-copy-ck-second__explanation"><Typography shuku-edit-id="e-45d61910-4ebe-41c8-aaec-abc212311029" variant="body" tone="accent">比较相邻像素，描述变化强弱；<br shuku-edit-id="e-d946b0dd-fc05-493e-831f-22fd8407c14d" />常突出边缘。</Typography></div>
        </article>
        <Typography shuku-edit-id="e-bd828a80-5c5c-4374-b117-fc002931baac" as="span" variant="h1" tone="accent" className="aipe-replay-cg-copy-ck-second__arrow" aria-hidden="true">→</Typography>
        <article shuku-edit-id="e-021d63d2-9ddc-4917-91ae-9917650123a1" className="aipe-replay-cg-copy-ck-second__panel aipe-replay-cg-copy-ck-second__panel--difference">
          <StepHeader number="3">二阶差分</StepHeader>
          <DifferenceFormula order={2} />
          <DifferenceImage src={images?.second} alt="采尔马特建筑局部的二阶差分图" className="aipe-replay-cg-copy-ck-second__image--second" />
          <div shuku-edit-id="e-9ce26c18-e999-4a7b-b4ee-c1b684f8299c" className="aipe-replay-cg-copy-ck-second__explanation"><Typography shuku-edit-id="e-26d7fd7b-2645-4d83-a5a0-8b2344fc2873" variant="body" tone="accent">再次求差，观察变化率突变；<br shuku-edit-id="e-c51ec480-31b7-4ac2-9a77-a65586ed0bd1" />对尖锐边缘更敏感。</Typography></div>
        </article>
      </div>
      <section shuku-edit-id="e-e763171a-861c-4c17-90ae-8a1332051d9c" className="aipe-replay-cg-copy-ck-second__example" aria-label="一维信号的两次差分示例">
        <Typography shuku-edit-id="e-e11ff752-1af3-49f9-9f18-f4548f64c796" variant="h3" tone="light" className="aipe-replay-cg-copy-ck-second__example-badge">一维示例</Typography>
        <div shuku-edit-id="e-2b057df7-da57-4ffd-8ca4-3a2ad3f8746b" className="aipe-replay-cg-copy-ck-second__example-signals">
          <div shuku-edit-id="e-d4118003-58e9-4cd8-901a-c4cfab7006dd"><Typography shuku-edit-id="e-f695e826-4388-4dbb-b95d-f79778a3d6fe" variant="bodySmall" tone="accent">原始信号 <MathFormulaStatic latex="f(x)" />：</Typography><Signal values={['2', '2', '2', '8', '8', '8']} /></div>
          <div shuku-edit-id="e-ec50546c-2454-4f00-92dd-fc8cf62bbffc"><Typography shuku-edit-id="e-2e47bd0b-0790-4e25-964e-2ba01f063e5f" variant="bodySmall" tone="accent">一阶差分 <MathFormulaStatic latex="D^{(1)}" />：</Typography><Signal values={['0', '0', '+6', '0', '0']} tone="is-first" /></div>
          <div shuku-edit-id="e-01bd3805-3b36-4960-aa6e-43d1e47b1989"><Typography shuku-edit-id="e-4ee0d494-fe88-4168-a8de-c5062388948c" variant="bodySmall" tone="accent">二阶差分 <MathFormulaStatic latex="D^{(2)}" />：</Typography><Signal values={['0', '+6', '−6', '0']} tone="is-second" /></div>
        </div>
        <div shuku-edit-id="e-fd9a4140-943a-43a9-8a57-902bfde9c7ea" className="aipe-replay-cg-copy-ck-second__example-takeaway"><Typography shuku-edit-id="e-c965746e-eef3-4925-b933-fcc92fe4c546" variant="body" tone="accent">一阶差分找哪里<strong shuku-edit-id="e-394cb664-baf3-461b-a61c-01e67a04c6c7">开始变</strong>，</Typography><Typography shuku-edit-id="e-ff6f4b7f-e382-4136-87c0-6d1d16b756d1" variant="body" tone="accent">二阶差分看变化在哪里<strong shuku-edit-id="e-e09b29be-a3ef-45d3-9e37-6c607d434c01">突然发生</strong>。</Typography></div>
      </section>
      <footer shuku-edit-id="e-bc23a75c-8598-493c-8e5c-8b9c6ccc3198" className="aipe-replay-cg-copy-ck-second__summary">
        <Typography shuku-edit-id="e-02b13f97-a46e-4ca9-9874-d11d6d950dbe" as="span" variant="h3" tone="accent">总结：</Typography>
        <Typography shuku-edit-id="e-a34ef2b1-1261-46d2-bdb4-d1419acbaae8" variant="body">一阶差分看局部变化，二阶差分看变化率如何变化。前者强调“有没有变化”，后者强调“变化是否突变”。</Typography>
      </footer>
    </ContentBlock>
  );
}
