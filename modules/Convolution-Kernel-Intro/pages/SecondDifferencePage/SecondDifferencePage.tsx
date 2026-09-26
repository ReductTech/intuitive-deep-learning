import { useEffect, useState, type ReactNode } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import zermattImage from '../../assets/caiermate.png';
import './SecondDifferencePage.css';

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
    <header className="ck-second__step-header">
      <Typography as="span" variant="h3" tone="light" className="ck-second__step-number">{number}</Typography>
      <Typography as="h2" variant="h3" tone="accent">{children}</Typography>
    </header>
  );
}

function Signal({ values, tone = '' }: { values: string[]; tone?: string }) {
  return (
    <div className={`ck-second__signal ${tone}`} role="img" aria-label={values.join('，')}>
      {values.map((value, index) => <Typography as="span" variant="bodySmall" tone="accent" key={`${value}-${index}`}>{value}</Typography>)}
    </div>
  );
}

function DifferenceImage({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  return src
    ? <img className={`ck-second__image ${className}`} src={src} alt={alt} />
    : <div className={`ck-second__image-loading ${className}`} role="img" aria-label={`${alt}正在计算`} />;
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
    <ContentBlock headingLevel={1} className="ck-second" title="二阶差分：变化如何继续变化" subtitle="一阶差分描述局部变化，二阶差分进一步描述变化率是否发生突变。">
      <div className="ck-second__layout">
        <article className="ck-second__panel ck-second__panel--input">
          <StepHeader number="1">原图 <MathFormulaStatic latex="I" /></StepHeader>
          <DifferenceImage src={images?.input} alt="采尔马特山间建筑的灰度原图" className="ck-second__image--input" />
          <div className="ck-second__explanation"><Typography variant="body" tone="accent">像素值本身</Typography><Typography variant="body" tone="accent">不直接表示变化</Typography></div>
        </article>
        <Typography as="span" variant="h1" tone="accent" className="ck-second__arrow" aria-hidden="true">→</Typography>
        <article className="ck-second__panel ck-second__panel--difference">
          <StepHeader number="2">一阶差分</StepHeader>
          <DifferenceFormula order={1} />
          <DifferenceImage src={images?.first} alt="采尔马特建筑局部的一阶差分图" className="ck-second__image--first" />
          <div className="ck-second__explanation"><Typography variant="body" tone="accent">比较相邻像素，描述变化强弱；<br />常突出边缘。</Typography></div>
        </article>
        <Typography as="span" variant="h1" tone="accent" className="ck-second__arrow" aria-hidden="true">→</Typography>
        <article className="ck-second__panel ck-second__panel--difference">
          <StepHeader number="3">二阶差分</StepHeader>
          <DifferenceFormula order={2} />
          <DifferenceImage src={images?.second} alt="采尔马特建筑局部的二阶差分图" className="ck-second__image--second" />
          <div className="ck-second__explanation"><Typography variant="body" tone="accent">再次求差，观察变化率突变；<br />对尖锐边缘更敏感。</Typography></div>
        </article>
      </div>
      <section className="ck-second__example" aria-label="一维信号的两次差分示例">
        <Typography variant="h3" tone="light" className="ck-second__example-badge">一维示例</Typography>
        <div className="ck-second__example-signals">
          <div><Typography variant="bodySmall" tone="accent">原始信号 <MathFormulaStatic latex="f(x)" />：</Typography><Signal values={['2', '2', '2', '8', '8', '8']} /></div>
          <div><Typography variant="bodySmall" tone="accent">一阶差分 <MathFormulaStatic latex="D^{(1)}" />：</Typography><Signal values={['0', '0', '+6', '0', '0']} tone="is-first" /></div>
          <div><Typography variant="bodySmall" tone="accent">二阶差分 <MathFormulaStatic latex="D^{(2)}" />：</Typography><Signal values={['0', '+6', '−6', '0']} tone="is-second" /></div>
        </div>
        <div className="ck-second__example-takeaway"><Typography variant="body" tone="accent">一阶差分找哪里<strong>开始变</strong>，</Typography><Typography variant="body" tone="accent">二阶差分看变化在哪里<strong>突然发生</strong>。</Typography></div>
      </section>
      <footer className="ck-second__summary">
        <Typography as="span" variant="h3" tone="accent">总结：</Typography>
        <Typography variant="body">一阶差分看局部变化，二阶差分看变化率如何变化。前者强调“有没有变化”，后者强调“变化是否突变”。</Typography>
      </footer>
    </ContentBlock>
  );
}
