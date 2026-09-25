import { useEffect, useState, type ReactNode } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
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

function cropValues(values: Float32Array, width: number, height: number, x: number, y: number, cropWidth: number, cropHeight: number) {
  const safeX = Math.max(0, Math.min(width - 1, x));
  const safeY = Math.max(0, Math.min(height - 1, y));
  const safeWidth = Math.min(cropWidth, width - safeX);
  const safeHeight = Math.min(cropHeight, height - safeY);
  const crop = new Float32Array(safeWidth * safeHeight);
  for (let row = 0; row < safeHeight; row += 1) {
    crop.set(values.subarray((safeY + row) * width + safeX, (safeY + row) * width + safeX + safeWidth), row * safeWidth);
  }
  return { values: crop, width: safeWidth, height: safeHeight };
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
  // Keep both response maps on the same source window so their structures are directly comparable.
  const firstCrop = cropValues(first.values, first.width, first.height, 70, 390, 420, 330);
  const secondCrop = cropValues(second.values, second.width, second.height, 70, 390, 420, 330);
  return {
    input: source.toDataURL('image/png'),
    first: renderGray(firstCrop.values, firstCrop.width, firstCrop.height, responseScale(firstCrop.values)),
    second: renderGray(secondCrop.values, secondCrop.width, secondCrop.height, responseScale(secondCrop.values)),
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

export function SecondDifferencePage() {
  const images = useDifferenceImages();
  return (
    <ContentBlock headingLevel={1} className="ck-second" title="二阶变化" subtitle="先看一阶差分，再对它求一次差分。">
      <div className="ck-second__layout">
        <article className="ck-second__panel">
          <StepHeader number="1">输入图像</StepHeader>
          <DifferenceImage src={images?.input} alt="缩小后的采尔马特输入图" className="ck-second__image--input" />
          <Typography variant="h3" tone="accent">原图</Typography>
        </article>

        <article className="ck-second__panel">
          <StepHeader number="2">一阶差分</StepHeader>
          <MathFormulaBlock ariaLabel="水平方向一阶差分公式">
            <MathFormulaStatic latex={String.raw`G_x=I*[-1\quad 1]`} />
          </MathFormulaBlock>
          <DifferenceImage src={images?.first} alt="采尔马特局部的真实水平一阶差分图" className="ck-second__image--first" />
          <Typography variant="h3" tone="accent">一阶差分图</Typography>
        </article>

        <article className="ck-second__panel ck-second__result">
          <StepHeader number="3">二阶差分</StepHeader>
          <div className="ck-second__example" aria-label="一维信号的两次差分示例">
            <div className="ck-second__example-step"><Typography variant="bodySmall" tone="accent">原始一维信号（示例）</Typography><Signal values={['2', '2', '2', '8', '8', '8']} /></div>
            <Typography as="span" variant="h3" tone="accent" aria-hidden="true">→</Typography>
            <div className="ck-second__example-step"><Typography variant="bodySmall" tone="accent">一阶差分</Typography><Signal values={['0', '0', '+6', '0', '0']} tone="is-first" /></div>
            <Typography as="span" variant="h3" tone="accent" aria-hidden="true">→</Typography>
            <div className="ck-second__example-step"><Typography variant="bodySmall" tone="accent">二阶差分</Typography><Signal values={['0', '+6', '−6', '0']} tone="is-second" /></div>
          </div>
          <DifferenceImage src={images?.second} alt="采尔马特局部的真实水平二阶差分图" className="ck-second__image--second" />
          <Typography variant="h3" tone="accent">二阶差分图</Typography>
        </article>
      </div>

      <footer className="ck-second__summary">
        <Typography as="span" variant="h3" tone="accent">总结：</Typography>
        <Typography variant="body">一阶看变化，二阶看变化如何变化。</Typography>
      </footer>
    </ContentBlock>
  );
}
