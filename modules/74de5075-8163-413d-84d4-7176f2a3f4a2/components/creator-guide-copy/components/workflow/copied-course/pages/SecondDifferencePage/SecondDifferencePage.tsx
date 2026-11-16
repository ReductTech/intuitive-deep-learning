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
    <header shuku-edit-id="e-96261432-ba41-4a6e-9292-efca12c5d834" className="aipe-replay-cg-copy-ck-second__step-header">
      <Typography shuku-edit-id="e-e3db2c54-1833-4620-b965-461a4cd4d4a0" as="span" variant="h3" tone="light" className="aipe-replay-cg-copy-ck-second__step-number">{number}</Typography>
      <Typography shuku-edit-id="e-115bccd4-e4a7-40ac-87fa-94e5bf9184a0" as="h2" variant="h3" tone="accent">{children}</Typography>
    </header>
  );
}

function Signal({ values, tone = '' }: { values: string[]; tone?: string }) {
  return (
    <div shuku-edit-id="e-cd3167f5-2652-4bba-93b8-98ee6aace6c0" className={`aipe-replay-cg-copy-ck-second__signal ${tone}`} role="img" aria-label={values.join('，')}>
      {values.map((value, index) => <Typography shuku-edit-id="e-186218d2-981b-4db8-a5fa-94ee648db676" as="span" variant="bodySmall" tone="accent" key={`${value}-${index}`}>{value}</Typography>)}
    </div>
  );
}

function DifferenceImage({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  return src
    ? <img shuku-edit-id="e-85578e26-892d-47ff-901a-92fa1534497d" className={`aipe-replay-cg-copy-ck-second__image ${className}`} src={src} alt={alt} />
    : <div shuku-edit-id="e-d9395034-f7de-45d8-b9a8-e6e796df75e1" className={`aipe-replay-cg-copy-ck-second__image-loading ${className}`} role="img" aria-label={`${alt}正在计算`} />;
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
    <ContentBlock shuku-edit-id="e-74953fd4-a2b7-4b44-acf6-e7f413e57a3e" headingLevel={1} className="aipe-replay-cg-copy-ck-second" title="二阶差分：变化如何继续变化" subtitle="一阶差分描述局部变化，二阶差分进一步描述变化率是否发生突变。">
      <div shuku-edit-id="e-cd613204-653d-4cff-a85b-a55ce3155c3a" className="aipe-replay-cg-copy-ck-second__layout">
        <article shuku-edit-id="e-f5f17a0c-00f4-4dee-9e6f-aa9c1747a02e" className="aipe-replay-cg-copy-ck-second__panel aipe-replay-cg-copy-ck-second__panel--input">
          <StepHeader number="1">原图 <MathFormulaStatic latex="I" /></StepHeader>
          <DifferenceImage src={images?.input} alt="采尔马特山间建筑的灰度原图" className="aipe-replay-cg-copy-ck-second__image--input" />
          <div shuku-edit-id="e-55b2b321-9289-4aec-8812-68e889341436" className="aipe-replay-cg-copy-ck-second__explanation"><Typography shuku-edit-id="e-6a3f10f7-2d21-4e73-a523-4ce6415cbac3" variant="body" tone="accent">像素值本身</Typography><Typography shuku-edit-id="e-6f1beb02-374f-4f0f-aa1a-65665e184e09" variant="body" tone="accent">不直接表示变化</Typography></div>
        </article>
        <Typography shuku-edit-id="e-a40641dc-7578-4828-9faa-ac00e84646e5" as="span" variant="h1" tone="accent" className="aipe-replay-cg-copy-ck-second__arrow" aria-hidden="true">→</Typography>
        <article shuku-edit-id="e-33a2b733-9df4-4d21-b77c-518ae5d99941" className="aipe-replay-cg-copy-ck-second__panel aipe-replay-cg-copy-ck-second__panel--difference">
          <StepHeader number="2">一阶差分</StepHeader>
          <DifferenceFormula order={1} />
          <DifferenceImage src={images?.first} alt="采尔马特建筑局部的一阶差分图" className="aipe-replay-cg-copy-ck-second__image--first" />
          <div shuku-edit-id="e-67253cfb-be58-43b6-8a2e-654949ad5fdf" className="aipe-replay-cg-copy-ck-second__explanation"><Typography shuku-edit-id="e-8e96910b-ac49-4e31-8316-1a0a5047423e" variant="body" tone="accent">比较相邻像素，描述变化强弱；<br shuku-edit-id="e-ccaa053f-e91b-449a-9504-4d847a09b36d" />常突出边缘。</Typography></div>
        </article>
        <Typography shuku-edit-id="e-5825f594-fa77-4669-9b84-2f20f21a0310" as="span" variant="h1" tone="accent" className="aipe-replay-cg-copy-ck-second__arrow" aria-hidden="true">→</Typography>
        <article shuku-edit-id="e-d72da7f1-b9f8-4bff-8815-43d4fd0182b1" className="aipe-replay-cg-copy-ck-second__panel aipe-replay-cg-copy-ck-second__panel--difference">
          <StepHeader number="3">二阶差分</StepHeader>
          <DifferenceFormula order={2} />
          <DifferenceImage src={images?.second} alt="采尔马特建筑局部的二阶差分图" className="aipe-replay-cg-copy-ck-second__image--second" />
          <div shuku-edit-id="e-23a91658-00ff-4676-821f-f0ea0fbb4557" className="aipe-replay-cg-copy-ck-second__explanation"><Typography shuku-edit-id="e-13011287-1683-407e-82b9-27644c4ffa7f" variant="body" tone="accent">再次求差，观察变化率突变；<br shuku-edit-id="e-8dea5beb-1f93-4adc-8aec-0af8cfb8e517" />对尖锐边缘更敏感。</Typography></div>
        </article>
      </div>
      <section shuku-edit-id="e-cd22bcaa-c104-42af-84dc-34d926c583a6" className="aipe-replay-cg-copy-ck-second__example" aria-label="一维信号的两次差分示例">
        <Typography shuku-edit-id="e-38229b9c-cb9b-4842-a8ab-1542554c4ff9" variant="h3" tone="light" className="aipe-replay-cg-copy-ck-second__example-badge">一维示例</Typography>
        <div shuku-edit-id="e-a245b93a-9a20-416f-b920-70fcaf89674a" className="aipe-replay-cg-copy-ck-second__example-signals">
          <div shuku-edit-id="e-3b7a5811-2eb3-41dd-aeec-0b5873a6d588"><Typography shuku-edit-id="e-264817a2-b8dd-4111-a09c-8aa90bd59c6e" variant="bodySmall" tone="accent">原始信号 <MathFormulaStatic latex="f(x)" />：</Typography><Signal values={['2', '2', '2', '8', '8', '8']} /></div>
          <div shuku-edit-id="e-c3f9cdf6-513e-4057-a965-85a3cd0b9cf3"><Typography shuku-edit-id="e-1443d505-2d0b-440e-b123-9c8578b3e927" variant="bodySmall" tone="accent">一阶差分 <MathFormulaStatic latex="D^{(1)}" />：</Typography><Signal values={['0', '0', '+6', '0', '0']} tone="is-first" /></div>
          <div shuku-edit-id="e-699fbfd2-c727-43d3-878b-6a627ba9e660"><Typography shuku-edit-id="e-89a4ce1d-577b-407d-9a25-8e3004b39085" variant="bodySmall" tone="accent">二阶差分 <MathFormulaStatic latex="D^{(2)}" />：</Typography><Signal values={['0', '+6', '−6', '0']} tone="is-second" /></div>
        </div>
        <div shuku-edit-id="e-e729304a-e3fd-4f4c-8c2d-85060570b43e" className="aipe-replay-cg-copy-ck-second__example-takeaway"><Typography shuku-edit-id="e-95e18ba5-83fc-4796-8a20-b9d220404a2f" variant="body" tone="accent">一阶差分找哪里<strong shuku-edit-id="e-66875010-df0d-44f1-ad8e-9dc3220c3ef0">开始变</strong>，</Typography><Typography shuku-edit-id="e-5a7715dc-9b46-417b-925e-6bb92521f745" variant="body" tone="accent">二阶差分看变化在哪里<strong shuku-edit-id="e-fa9b329d-a839-433b-876b-918ef05dbcd5">突然发生</strong>。</Typography></div>
      </section>
      <footer shuku-edit-id="e-fef36215-9f67-40ef-af1b-df85f5abe0bd" className="aipe-replay-cg-copy-ck-second__summary">
        <Typography shuku-edit-id="e-f5eb49e2-fad3-4732-8e8d-045f3f430a48" as="span" variant="h3" tone="accent">总结：</Typography>
        <Typography shuku-edit-id="e-49d0c56b-cfda-4959-b1d9-84f1f1743ff1" variant="body">一阶差分看局部变化，二阶差分看变化率如何变化。前者强调“有没有变化”，后者强调“变化是否突变”。</Typography>
      </footer>
    </ContentBlock>
  );
}
