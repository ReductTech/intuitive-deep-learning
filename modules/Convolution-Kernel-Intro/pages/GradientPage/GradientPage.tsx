import { useEffect, useState, type ReactNode } from 'react';
import { Light, Picture } from '@icon-park/react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import buildingImage from '../../assets/xiandaijianzhu.png';
import './GradientPage.css';

interface GradientImages { horizontal: string; vertical: string; magnitude: string; }

function buildGradientImages(image: HTMLImageElement): GradientImages | null {
  const width = 460;
  const height = Math.max(1, Math.round(width * image.naturalHeight / image.naturalWidth));
  const source = document.createElement('canvas');
  source.width = width;
  source.height = height;
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  if (!sourceContext) return null;
  sourceContext.drawImage(image, 0, 0, width, height);
  const pixels = sourceContext.getImageData(0, 0, width, height).data;
  const gray = new Float32Array(width * height);
  for (let index = 0; index < gray.length; index += 1) {
    const offset = index * 4;
    gray[index] = (pixels[offset] * .299 + pixels[offset + 1] * .587 + pixels[offset + 2] * .114) / 255;
  }

  const gx = new Float32Array(gray.length);
  const gy = new Float32Array(gray.length);
  const magnitude = new Float32Array(gray.length);
  const strengths: number[] = [];
  for (let y = 0; y < height - 1; y += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      const index = y * width + x;
      gx[index] = gray[index + 1] - gray[index];
      gy[index] = gray[index + width] - gray[index];
      magnitude[index] = Math.hypot(gx[index], gy[index]);
      strengths.push(magnitude[index]);
    }
  }
  strengths.sort((a, b) => a - b);
  const sharedScale = Math.max(.025, strengths[Math.floor(strengths.length * .985)] ?? .025);
  const render = (field: Float32Array) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return '';
    const output = context.createImageData(width, height);
    for (let index = 0; index < field.length; index += 1) {
      const shade = Math.round(Math.min(1, Math.abs(field[index]) / sharedScale) * 255);
      const offset = index * 4;
      output.data[offset] = shade;
      output.data[offset + 1] = shade;
      output.data[offset + 2] = shade;
      output.data[offset + 3] = 255;
    }
    context.putImageData(output, 0, 0);
    return canvas.toDataURL('image/png');
  };
  return { horizontal: render(gx), vertical: render(gy), magnitude: render(magnitude) };
}

function useGradientImages() {
  const [images, setImages] = useState<GradientImages | null>(null);
  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => { if (active) setImages(buildGradientImages(image)); };
    image.src = buildingImage;
    return () => { active = false; };
  }, []);
  return images;
}

function StepHeader({ number, children }: { number: string; children: ReactNode }) {
  return <header className="ck-gradient__step-header"><span className="ck-gradient__step-number"><Typography as="span" variant="h3" tone="light">{number}</Typography></span><Typography as="h2" variant="h3" tone="accent">{children}</Typography></header>;
}

function EdgeImage({ src, className = '', alt }: { src?: string; className?: string; alt: string }) {
  return src ? <img className={`ck-gradient__image ${className}`} src={src} alt={alt} /> : <div className={`ck-gradient__loading ${className}`} role="img" aria-label={`${alt}正在计算`} />;
}

function DifferenceKernel({ vertical }: { vertical?: boolean }) {
  return <div className={`ck-gradient__kernel ${vertical ? 'is-vertical' : ''}`} role="img" aria-label={vertical ? 'y 方向差分核，上方负一，下方正一' : 'x 方向差分核，左侧负一，右侧正一'}>
    <span><MathFormulaStatic latex="-1" /></span><span><MathFormulaStatic latex="1" /></span>
  </div>;
}

function DifferenceCard({ axis, image }: { axis: 'x' | 'y'; image?: string }) {
  const isX = axis === 'x';
  return <section className="ck-gradient__difference-card">
    <Typography variant="body" tone="accent"><MathFormulaStatic latex={axis} /> 方向差分</Typography>
    <div className="ck-gradient__kernel-display"><DifferenceKernel vertical={!isX} /></div>
    <MathFormulaStatic latex={isX ? 'G_x' : 'G_y'} className="ck-gradient__result-symbol" />
    <div className="ck-gradient__preview">
      <button className="ck-gradient__preview-trigger" type="button" aria-label={`查看 ${axis} 方向差分图`} aria-describedby={`ck-gradient-preview-${axis}`}><Picture theme="outline" size="26" strokeWidth={3} /></button>
      <div className="ck-gradient__preview-popover" id={`ck-gradient-preview-${axis}`} role="tooltip">
        <EdgeImage src={image} className="ck-gradient__edge-image" alt={`${axis} 方向的一阶差分图`} />
      </div>
    </div>
    <Typography variant="bodySmall" tone="muted">亮处表示{isX ? '左右' : '上下'}变化强</Typography>
  </section>;
}

export function GradientPage() {
  const images = useGradientImages();
  return <ContentBlock headingLevel={1} className="ck-gradient" title="一阶差分：从方向变化到梯度" subtitle={<>分别计算 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的局部变化，再合成为梯度幅值。</>}>
    <section className="ck-gradient__formula-strip" aria-label="两个方向的一阶差分及梯度幅值公式">
      <div><Typography variant="body" tone="accent"><MathFormulaStatic latex="x" /> 方向差分</Typography><MathFormulaBlock ariaLabel="x 方向差分公式"><MathFormulaStatic latex={String.raw`G_x=I*K_x`} /></MathFormulaBlock></div>
      <div><Typography variant="body" tone="accent"><MathFormulaStatic latex="y" /> 方向差分</Typography><MathFormulaBlock ariaLabel="y 方向差分公式"><MathFormulaStatic latex={String.raw`G_y=I*K_y`} /></MathFormulaBlock></div>
      <div><Typography variant="body" tone="accent">梯度幅值</Typography><MathFormulaBlock ariaLabel="梯度幅值公式"><MathFormulaStatic latex={String.raw`\left|\nabla I\right|=\sqrt{G_x^2+G_y^2}`} /></MathFormulaBlock></div>
    </section>
    <div className="ck-gradient__columns">
      <article className="ck-gradient__panel ck-gradient__panel--input">
        <StepHeader number="1">输入图像</StepHeader>
        <img className="ck-gradient__image ck-gradient__input-image" src={buildingImage} alt="建筑灰度输入图" />
        <Typography variant="body" tone="accent">灰度图像 <MathFormulaStatic latex="I" /></Typography>
      </article>
      <article className="ck-gradient__panel ck-gradient__panel--difference">
        <StepHeader number="2">两个方向的一阶差分</StepHeader>
        <div className="ck-gradient__difference-grid">
          <DifferenceCard axis="x" image={images?.horizontal} />
          <DifferenceCard axis="y" image={images?.vertical} />
        </div>
      </article>
      <article className="ck-gradient__panel ck-gradient__panel--gradient">
        <StepHeader number="3">梯度幅值</StepHeader>
        <EdgeImage src={images?.magnitude} className="ck-gradient__gradient-image" alt="合成后的梯度幅值图" />
        <MathFormulaStatic latex={String.raw`\left|\nabla I\right|=\sqrt{G_x^2+G_y^2}`} className="ck-gradient__magnitude-caption" />
      </article>
    </div>
    <footer className="ck-gradient__summary"><span className="ck-gradient__summary-icon" aria-hidden="true"><Light theme="outline" size="32" strokeWidth={3} /></span><Typography as="span" variant="h3" tone="accent">总结：</Typography><Typography variant="body">一阶差分分别度量 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的局部变化，梯度幅值将它们合成为与方向无关的变化强度。</Typography></footer>
  </ContentBlock>;
}
