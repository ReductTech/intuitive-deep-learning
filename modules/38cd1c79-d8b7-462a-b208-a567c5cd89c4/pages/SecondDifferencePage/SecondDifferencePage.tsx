import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useState, type ReactNode } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import './SecondDifferencePage.css';

const zermattImage = moduleAssetUrl('caiermate.jpg');

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
    <header shuku-edit-id="e-ef77b638-a95e-45db-a4a4-b4e7681d1491" className="ck-second__step-header">
      <Typography shuku-edit-id="e-cc263ecc-593b-49de-b431-7ed2658dac81" as="span" variant="h3" tone="light" className="ck-second__step-number">{number}</Typography>
      <Typography shuku-edit-id="e-8e94e88e-1884-459b-ba78-f28535832022" as="h2" variant="h3" tone="accent">{children}</Typography>
    </header>
  );
}

function Signal({ values, tone = '' }: { values: string[]; tone?: string }) {
  return (
    <div shuku-edit-id="e-e80e3c5c-35e5-408c-abb1-0402fe7ea14d" className={`ck-second__signal ${tone}`} role="img" aria-label={values.join('，')}>
      {values.map((value, index) => <Typography shuku-edit-id="e-c92a21aa-703e-4f4e-8966-a2c59c29cf3f" as="span" variant="bodySmall" tone="accent" key={`${value}-${index}`}>{value}</Typography>)}
    </div>
  );
}

function DifferenceImage({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  return src
    ? <img shuku-edit-id="e-3b753850-08ac-4be1-bea5-4d0594050dde" className={`ck-second__image ${className}`} src={src} alt={alt} />
    : <div shuku-edit-id="e-fc6a887c-40aa-45eb-8a9b-2a67ef33f9c2" className={`ck-second__image-loading ${className}`} role="img" aria-label={`${alt}正在计算`} />;
}

function DifferenceFormula({ order }: { order: 1 | 2 }) {
  const input = order === 1 ? 'I' : 'D^{(1)}';
  return (
    <MathFormulaBlock ariaLabel={`${order === 1 ? '一阶' : '二阶'}差分公式`} className="ck-second__formula">
      <MathFormulaTerm latex={`D^{(${order})}`} tooltip={`D 的上标 ${order}：第 ${order} 次差分的结果。`} ariaLabel={`第 ${order} 次差分的结果`} />
      <MathFormulaStatic latex="=" />
      <MathFormulaTerm latex={input} tooltip={order === 1 ? 'I：输入的灰度图像。' : 'D 的上标 1：已经计算出的一阶差分。'} ariaLabel={order === 1 ? '输入灰度图像' : '一阶差分结果'} />
      <MathFormulaTerm latex="*" tooltip="将相邻位置与差分核对应相乘并求和。" ariaLabel="应用差分核" />
      <MathFormulaStatic latex="[" />
      <MathFormulaTerm latex="-1" tooltip="−1：减去当前像素值。" ariaLabel="负一，减去当前像素值" />
      <MathFormulaTerm latex="1" tooltip="1：加上右侧相邻像素值。" ariaLabel="正一，加上右侧相邻像素值" className="ck-second__kernel-next" />
      <MathFormulaStatic latex="]" />
    </MathFormulaBlock>
  );
}

export function SecondDifferencePage() {
  const images = useDifferenceImages();
  return (
    <ContentBlock shuku-edit-id="e-e8a63040-5be5-40d3-bb73-26102e919d32" headingLevel={1} className="ck-second" title="二阶差分：变化如何继续变化" subtitle="一阶差分描述局部变化，二阶差分进一步描述变化率是否发生突变。">
      <div shuku-edit-id="e-c9cd474d-8c20-423e-a68f-b4b5cf071c39" className="ck-second__layout">
        <article shuku-edit-id="e-7982dd32-f547-489f-bb38-58edbd80f1b6" className="ck-second__panel ck-second__panel--input">
          <StepHeader number="1">原图 <MathFormulaStatic latex="I" /></StepHeader>
          <DifferenceImage src={images?.input} alt="采尔马特山间建筑的灰度原图" className="ck-second__image--input" />
          <div shuku-edit-id="e-92ea53cf-e9f0-452f-8ea6-f4ffae750b15" className="ck-second__explanation"><Typography shuku-edit-id="e-7ddef14f-6cc7-4002-ade4-00693f0bd04d" variant="body" tone="accent">像素值本身</Typography><Typography shuku-edit-id="e-2e98ad78-3486-4c84-996d-4b44eab57eda" variant="body" tone="accent">不直接表示变化</Typography></div>
        </article>
        <Typography shuku-edit-id="e-aea5dc91-dc5e-40d6-b52e-45feca596e03" as="span" variant="h1" tone="accent" className="ck-second__arrow" aria-hidden="true">→</Typography>
        <article shuku-edit-id="e-eb5c989b-282f-4145-ae66-021469aa9aeb" className="ck-second__panel ck-second__panel--difference">
          <StepHeader number="2">一阶差分</StepHeader>
          <DifferenceFormula order={1} />
          <DifferenceImage src={images?.first} alt="采尔马特建筑局部的一阶差分图" className="ck-second__image--first" />
          <div shuku-edit-id="e-604abd4b-da90-49c0-9e48-ac4635056e42" className="ck-second__explanation"><Typography shuku-edit-id="e-ffa2e3c3-ea84-40fa-9762-34b78129591c" variant="body" tone="accent">比较相邻像素，描述变化强弱；<br shuku-edit-id="e-92fe4ff3-ad53-460d-b7cd-7819c832a2fa" />常突出边缘。</Typography></div>
        </article>
        <Typography shuku-edit-id="e-40fde592-c640-4d14-8633-64f200e292da" as="span" variant="h1" tone="accent" className="ck-second__arrow" aria-hidden="true">→</Typography>
        <article shuku-edit-id="e-f396e220-a997-4275-9fd8-fb76a16d3e15" className="ck-second__panel ck-second__panel--difference">
          <StepHeader number="3">二阶差分</StepHeader>
          <DifferenceFormula order={2} />
          <DifferenceImage src={images?.second} alt="采尔马特建筑局部的二阶差分图" className="ck-second__image--second" />
          <div shuku-edit-id="e-7e88ec47-3dd9-4cf9-8388-16513d4bc58f" className="ck-second__explanation"><Typography shuku-edit-id="e-5532c0b9-b840-4d44-adf8-17c8fc2e5608" variant="body" tone="accent">再次求差，观察变化率突变；<br shuku-edit-id="e-50cd57f2-2041-4419-a43f-ca1eb0cc3d02" />对尖锐边缘更敏感。</Typography></div>
        </article>
      </div>
      <section shuku-edit-id="e-1cab1b42-eff6-44c7-bfe3-65fff8aa3223" className="ck-second__example" aria-label="一维信号的两次差分示例">
        <Typography shuku-edit-id="e-dcc1f91d-e28f-44ff-a41a-055e8bd7b464" variant="h3" tone="light" className="ck-second__example-badge">一维示例</Typography>
        <div shuku-edit-id="e-bc93a3b0-316f-4512-8237-7a0ce17fc7e9" className="ck-second__example-signals">
          <div shuku-edit-id="e-5f3cd294-52c3-4c35-8c10-aeff4df2a09b"><Typography shuku-edit-id="e-4384454d-5f30-4517-aa88-1adc8902b719" variant="bodySmall" tone="accent">原始信号 <MathFormulaStatic latex="f(x)" />：</Typography><Signal values={['2', '2', '2', '8', '8', '8']} /></div>
          <div shuku-edit-id="e-75244ea2-8eb3-4f9f-80d3-ba04fc754f3f"><Typography shuku-edit-id="e-fa22d99b-468e-4d3b-828c-43b1766557b9" variant="bodySmall" tone="accent">一阶差分 <MathFormulaStatic latex="D^{(1)}" />：</Typography><Signal values={['0', '0', '+6', '0', '0']} tone="is-first" /></div>
          <div shuku-edit-id="e-835083ac-a1ef-4d35-9aca-2e9217f735ee"><Typography shuku-edit-id="e-4009d91d-d340-4917-9ab7-e2ae9f1a27d7" variant="bodySmall" tone="accent">二阶差分 <MathFormulaStatic latex="D^{(2)}" />：</Typography><Signal values={['0', '+6', '−6', '0']} tone="is-second" /></div>
        </div>
        <div shuku-edit-id="e-6417ceb0-6413-4709-9d40-925470b25723" className="ck-second__example-takeaway"><Typography shuku-edit-id="e-18413ad6-4d5d-43d2-802e-4922d0bae419" variant="body" tone="accent">一阶差分找哪里<strong shuku-edit-id="e-858a2824-b8b6-49f7-b00a-36c05b3d5def">开始变</strong>，</Typography><Typography shuku-edit-id="e-87ea7772-4b08-4bee-a502-3c4ceb3ceae1" variant="body" tone="accent">二阶差分看变化在哪里<strong shuku-edit-id="e-7b522389-0b91-450c-b626-98ff3427c071">突然发生</strong>。</Typography></div>
      </section>
      <footer shuku-edit-id="e-3685488b-09f8-4e78-8d0c-ce9a2b53ff23" className="ck-second__summary">
        <Typography shuku-edit-id="e-ebee3162-4339-4425-ad91-e3e21f067b22" as="span" variant="h3" tone="accent">总结：</Typography>
        <Typography shuku-edit-id="e-048dabd9-cd72-436c-ac94-cdf949eb10a7" variant="body">一阶差分看局部变化，二阶差分看变化率如何变化。前者强调“有没有变化”，后者强调“变化是否突变”。</Typography>
      </footer>
    </ContentBlock>
  );
}
