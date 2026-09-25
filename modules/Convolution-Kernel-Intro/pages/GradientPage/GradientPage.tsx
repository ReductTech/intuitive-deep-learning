import { useEffect, useState, type ReactNode } from 'react';
import { Light } from '@icon-park/react';
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
    gray[index] = (pixels[offset] * 0.299 + pixels[offset + 1] * 0.587 + pixels[offset + 2] * 0.114) / 255;
  }

  const gx = new Float32Array(gray.length);
  const gy = new Float32Array(gray.length);
  const magnitude = new Float32Array(gray.length);
  const values: number[][] = [[], [], []];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      gx[index] = gray[index + 1] - gray[index - 1];
      gy[index] = gray[index + width] - gray[index - width];
      magnitude[index] = Math.hypot(gx[index], gy[index]);
      values[0].push(Math.abs(gx[index]));
      values[1].push(Math.abs(gy[index]));
      values[2].push(magnitude[index]);
    }
  }
  const scales = values.map((row) => {
    row.sort((a, b) => a - b);
    return Math.max(0.025, row[Math.floor(row.length * 0.985)] ?? 0.025);
  });
  const render = (field: Float32Array, scale: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return '';
    const output = context.createImageData(width, height);
    for (let index = 0; index < field.length; index += 1) {
      const shade = Math.round(Math.min(1, Math.abs(field[index]) / scale) * 255);
      const offset = index * 4;
      output.data[offset] = shade;
      output.data[offset + 1] = shade;
      output.data[offset + 2] = shade;
      output.data[offset + 3] = 255;
    }
    context.putImageData(output, 0, 0);
    return canvas.toDataURL('image/png');
  };
  return {
    horizontal: render(gx, scales[0]),
    vertical: render(gy, scales[1]),
    magnitude: render(magnitude, scales[2]),
  };
}

function useGradientImages() {
  const [images, setImages] = useState<GradientImages | null>(null);
  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (active) setImages(buildGradientImages(image));
    };
    image.src = buildingImage;
    return () => { active = false; };
  }, []);
  return images;
}

function KernelFormula({ latex, label, vertical = false }: { latex: string; label: string; vertical?: boolean }) {
  return (
    <div className={`ck-gradient__kernel-formula ${vertical ? 'is-vertical' : ''}`} role="img" aria-label={label}>
      <MathFormulaBlock ariaLabel={label}><MathFormulaStatic latex={latex} /></MathFormulaBlock>
    </div>
  );
}

function StepHeader({ number, children }: { number: string; children: ReactNode }) {
  return <header className="ck-gradient__step-header"><span className="ck-gradient__step-number"><Typography as="span" variant="h3" tone="light">{number}</Typography></span><Typography as="h2" variant="h3" tone="accent">{children}</Typography></header>;
}

function EdgeImage({ src, className = '', alt }: { src?: string; className?: string; alt: string }) {
  return src ? <img className={`ck-gradient__image ${className}`} src={src} alt={alt} /> : <div className={`ck-gradient__loading ${className}`} role="img" aria-label={`${alt}正在计算`} />;
}

export function GradientPage() {
  const gradientImages = useGradientImages();
  return <ContentBlock headingLevel={1} className="ck-gradient" title="一阶差分与梯度" subtitle="先分别计算水平方向与垂直方向的一阶差分，再合并为梯度幅值。">
    <section className="ck-gradient__formula-strip" aria-label="一阶差分与梯度公式">
      <div><Typography variant="bodySmall" tone="accent">水平方向差分</Typography><MathFormulaBlock ariaLabel="水平方向差分公式"><MathFormulaStatic latex={String.raw`G_x=I*K_x`} /></MathFormulaBlock></div>
      <div><Typography variant="bodySmall" tone="accent">垂直方向差分</Typography><MathFormulaBlock ariaLabel="垂直方向差分公式"><MathFormulaStatic latex={String.raw`G_y=I*K_y`} /></MathFormulaBlock></div>
      <div><Typography variant="bodySmall" tone="accent">梯度幅值</Typography><MathFormulaBlock ariaLabel="梯度幅值公式"><MathFormulaStatic latex={String.raw`\left|\nabla I\right|=\sqrt{G_x^2+G_y^2}`} /></MathFormulaBlock></div>
    </section>
    <div className="ck-gradient__columns">
      <article className="ck-gradient__panel">
        <StepHeader number="1">输入图像</StepHeader>
        <img className="ck-gradient__image ck-gradient__input-image" src={buildingImage} alt="建筑灰度输入图" />
        <Typography variant="h3" tone="accent">原图</Typography>
        <div className="ck-gradient__caption"><Typography variant="bodySmall" tone="accent">仍在看局部变化</Typography></div>
      </article>
      <article className="ck-gradient__panel ck-gradient__panel--difference">
        <StepHeader number="2">一阶差分</StepHeader>
        <div className="ck-gradient__difference-grid">
          <section className="ck-gradient__difference-card"><Typography variant="body" tone="accent">水平方向差分核</Typography><KernelFormula latex={String.raw`\begin{bmatrix}-1&1\end{bmatrix}`} label="水平方向差分核：负一、一" /><EdgeImage src={gradientImages?.horizontal} className="ck-gradient__edge-image" alt="水平方向差分结果" /><div className="ck-gradient__caption"><Typography variant="bodySmall" tone="accent">水平方向响应</Typography></div></section>
          <section className="ck-gradient__difference-card"><Typography variant="body" tone="accent">垂直方向差分核</Typography><KernelFormula vertical latex={String.raw`\begin{bmatrix}-1\\1\end{bmatrix}`} label="垂直方向差分核：上方负一、下方一" /><EdgeImage src={gradientImages?.vertical} className="ck-gradient__edge-image" alt="垂直方向差分结果" /><div className="ck-gradient__caption"><Typography variant="bodySmall" tone="accent">垂直方向响应</Typography></div></section>
        </div>
      </article>
      <article className="ck-gradient__panel ck-gradient__panel--gradient">
        <StepHeader number="3">梯度</StepHeader>
        <div className="ck-gradient__gradient-flow">
          <div className="ck-gradient__small-results"><div><EdgeImage src={gradientImages?.horizontal} className="ck-gradient__result-thumb" alt="水平方向差分响应" /><Typography variant="bodySmall" tone="accent">水平方向</Typography></div><div><EdgeImage src={gradientImages?.vertical} className="ck-gradient__result-thumb" alt="垂直方向差分响应" /><Typography variant="bodySmall" tone="accent">垂直方向</Typography></div></div>
          <div className="ck-gradient__merge-arrow" aria-hidden="true"><Typography as="span" variant="h1" tone="accent">↘</Typography></div>
          <div className="ck-gradient__merge-box"><Typography variant="body" tone="accent">梯度幅值</Typography><MathFormulaBlock ariaLabel="梯度幅值"><MathFormulaStatic latex={String.raw`\left|\nabla I\right|`} /></MathFormulaBlock></div>
          <div className="ck-gradient__merge-arrow" aria-hidden="true"><Typography as="span" variant="h1" tone="accent">→</Typography></div>
          <EdgeImage src={gradientImages?.magnitude} className="ck-gradient__gradient-image" alt="合并后的梯度强度图" />
        </div>
        <div className="ck-gradient__caption"><Typography variant="bodySmall" tone="accent">亮 = 变化强，暗 = 变化弱</Typography></div>
      </article>
    </div>
    <footer className="ck-gradient__summary"><span className="ck-gradient__summary-icon" aria-hidden="true"><Light theme="outline" size="26" strokeWidth={4} strokeLinecap="square" strokeLinejoin="miter" /></span><Typography as="span" variant="h3" tone="accent">总结：</Typography><Typography variant="body">一阶差分描述单一方向的变化，梯度汇总多个方向的变化强度。</Typography></footer>
  </ContentBlock>;
}
