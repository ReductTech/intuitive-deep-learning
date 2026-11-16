import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useState, type ReactNode } from 'react';
import { Light, Picture } from '@icon-park/react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './GradientPage.css';

const buildingImage = moduleAssetUrl('workflow/convolution-course/xiandaijianzhu.jpg');

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
    image.crossOrigin = 'anonymous';
    image.onload = () => { if (active) setImages(buildGradientImages(image)); };
    image.src = buildingImage;
    return () => { active = false; };
  }, []);
  return images;
}

function StepHeader({ number, children }: { number: string; children: ReactNode }) {
  return <header shuku-edit-id="e-d1ec385e-1462-464e-9342-788cd105b0a4" className="cg-copy-ck-gradient__step-header"><span shuku-edit-id="e-ea65a8c6-b021-421c-b1a2-75771785e23b" className="cg-copy-ck-gradient__step-number"><Typography shuku-edit-id="e-6ac1fac5-fd58-4931-a818-b7f6d9f0de4f" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-300a08c9-033d-4bff-9ea4-f6a8c625f80c" as="h2" variant="h3" tone="accent">{children}</Typography></header>;
}

function EdgeImage({ src, className = '', alt }: { src?: string; className?: string; alt: string }) {
  return src ? <img shuku-edit-id="e-691c6e93-cc1f-4a71-aa96-c449aed2f496" className={`cg-copy-ck-gradient__image ${className}`} src={src} alt={alt} /> : <div shuku-edit-id="e-ce73d821-e685-43f3-a8f7-0e3b389c4b3d" className={`cg-copy-ck-gradient__loading ${className}`} role="img" aria-label={`${alt}正在计算`} />;
}

function DifferenceKernel({ vertical }: { vertical?: boolean }) {
  return <div shuku-edit-id="e-af9a773a-7cbe-4756-8184-80ba8f6e95d9" className={`cg-copy-ck-gradient__kernel ${vertical ? 'is-vertical' : ''}`} role="img" aria-label={vertical ? 'y 方向差分核，上方负一，下方正一' : 'x 方向差分核，左侧负一，右侧正一'}>
    <span shuku-edit-id="e-7792ae39-c20e-447d-8c11-f4a0a2d7f306"><MathFormulaStatic latex="-1" /></span><span shuku-edit-id="e-cec0cdd2-29c0-48fa-bd6e-75c951594ca7"><MathFormulaStatic latex="1" /></span>
  </div>;
}

function DifferenceCard({ axis, image }: { axis: 'x' | 'y'; image?: string }) {
  const isX = axis === 'x';
  return <section shuku-edit-id="e-7d577434-72fb-40b4-aed2-fca7c79e7d5f" className="cg-copy-ck-gradient__difference-card">
    <Typography shuku-edit-id="e-7fc214ec-6dc3-4c46-8704-5c75b68bb37f" variant="body" tone="accent"><MathFormulaStatic latex={axis} /> 方向差分</Typography>
    <div shuku-edit-id="e-942af184-e540-4f3f-82f9-94c7d21adfa8" className="cg-copy-ck-gradient__kernel-display"><DifferenceKernel vertical={!isX} /></div>
    <MathFormulaStatic latex={isX ? 'G_x' : 'G_y'} className="cg-copy-ck-gradient__result-symbol" />
    <div shuku-edit-id="e-a2a37621-89e3-4283-aa5d-a23e2813a818" className="cg-copy-ck-gradient__preview">
      <button shuku-edit-id="e-22c82df2-955c-4bf8-b6d9-69c2b11a357c" className="cg-copy-ck-gradient__preview-trigger" type="button" aria-label={`查看 ${axis} 方向差分图`} aria-describedby={`cg-copy-ck-gradient-preview-${axis}`}><Picture theme="outline" size="26" strokeWidth={3} /></button>
      <div shuku-edit-id="e-a3139401-9c24-43fe-8186-33d388836bc6" className="cg-copy-ck-gradient__preview-popover" id={`cg-copy-ck-gradient-preview-${axis}`} role="tooltip">
        <EdgeImage src={image} className="cg-copy-ck-gradient__edge-image" alt={`${axis} 方向的一阶差分图`} />
      </div>
    </div>
    <Typography shuku-edit-id="e-eb203877-4bad-43da-9816-13a9cd3eab68" variant="bodySmall" tone="muted">亮处表示{isX ? '左右' : '上下'}变化强</Typography>
  </section>;
}

export function GradientPage() {
  const images = useGradientImages();
  return <ContentBlock shuku-edit-id="e-f2105877-ff88-431e-a485-eff40ba854a6" headingLevel={1} className="cg-copy-ck-gradient" title="一阶差分：从方向变化到梯度" subtitle={<>分别计算 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的局部变化，再合成为梯度幅值。</>}>
    <section shuku-edit-id="e-ca577469-e751-4ad2-9653-a2745069ba94" className="cg-copy-ck-gradient__formula-strip" aria-label="两个方向的一阶差分及梯度幅值公式">
      <div shuku-edit-id="e-6a9615b0-6413-4a6c-b6bd-99cefd62b487"><Typography shuku-edit-id="e-80e8b423-99ce-43cb-bbd3-916fc25dd2b8" variant="body" tone="accent"><MathFormulaStatic latex="x" /> 方向差分</Typography><MathFormulaBlock ariaLabel="x 方向差分公式"><MathFormulaStatic latex={String.raw`G_x=I*K_x`} /></MathFormulaBlock></div>
      <div shuku-edit-id="e-31f5153a-7fd1-4578-a560-7238e65c1961"><Typography shuku-edit-id="e-f20f4c4d-7715-49fd-9bfc-7da66d613458" variant="body" tone="accent"><MathFormulaStatic latex="y" /> 方向差分</Typography><MathFormulaBlock ariaLabel="y 方向差分公式"><MathFormulaStatic latex={String.raw`G_y=I*K_y`} /></MathFormulaBlock></div>
      <div shuku-edit-id="e-e94ee4b0-803c-4ad8-aadb-8b9d0d4300b2"><Typography shuku-edit-id="e-f0ccdd06-50ab-4fa9-9db8-68751b11b4d8" variant="body" tone="accent">梯度幅值</Typography><MathFormulaBlock ariaLabel="梯度幅值公式"><MathFormulaStatic latex={String.raw`\left|\nabla I\right|=\sqrt{G_x^2+G_y^2}`} /></MathFormulaBlock></div>
    </section>
    <div shuku-edit-id="e-23b9cd1b-04a4-4e43-8fa0-44b96ad435f8" className="cg-copy-ck-gradient__columns">
      <article shuku-edit-id="e-36b9c8e8-51c6-45d9-9987-5df6e4e67918" className="cg-copy-ck-gradient__panel cg-copy-ck-gradient__panel--input">
        <StepHeader number="1">输入图像</StepHeader>
        <img shuku-edit-id="e-5841df17-6947-4676-aeae-696a7c8b6ad7" className="cg-copy-ck-gradient__image cg-copy-ck-gradient__input-image" src={buildingImage} alt="建筑灰度输入图" />
        <Typography shuku-edit-id="e-813e95d0-89bd-4112-9f10-431d5fccae4e" variant="body" tone="accent">灰度图像 <MathFormulaStatic latex="I" /></Typography>
      </article>
      <article shuku-edit-id="e-e4821636-5fcb-469e-98a0-b4981058bafc" className="cg-copy-ck-gradient__panel cg-copy-ck-gradient__panel--difference">
        <StepHeader number="2">两个方向的一阶差分</StepHeader>
        <div shuku-edit-id="e-44ee6537-e76d-41fb-95d2-a36a35e0c3d1" className="cg-copy-ck-gradient__difference-grid">
          <DifferenceCard axis="x" image={images?.horizontal} />
          <DifferenceCard axis="y" image={images?.vertical} />
        </div>
      </article>
      <article shuku-edit-id="e-63999a13-c3ea-4a39-a41f-c2f26d67effa" className="cg-copy-ck-gradient__panel cg-copy-ck-gradient__panel--gradient">
        <StepHeader number="3">梯度幅值</StepHeader>
        <EdgeImage src={images?.magnitude} className="cg-copy-ck-gradient__gradient-image" alt="合成后的梯度幅值图" />
        <MathFormulaStatic latex={String.raw`\left|\nabla I\right|=\sqrt{G_x^2+G_y^2}`} className="cg-copy-ck-gradient__magnitude-caption" />
      </article>
    </div>
    <footer shuku-edit-id="e-e8bab13b-0e3c-4494-9eef-f2f15ee7bd3b" className="cg-copy-ck-gradient__summary"><span shuku-edit-id="e-0e16e208-0fd9-47c8-a9bf-d37d66b0fc8e" className="cg-copy-ck-gradient__summary-icon" aria-hidden="true"><Light theme="outline" size="32" strokeWidth={3} /></span><Typography shuku-edit-id="e-cd1aaaaf-c03a-4189-b89b-7eafd65ccc17" as="span" variant="h3" tone="accent">总结：</Typography><Typography shuku-edit-id="e-50d4a74d-b872-4c28-ac46-4c03d3e9e9de" variant="body">一阶差分分别度量 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的局部变化，梯度幅值将它们合成为与方向无关的变化强度。</Typography></footer>
  </ContentBlock>;
}
