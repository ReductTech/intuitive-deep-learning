import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { creatorGuideAssetUrl } from '../../../../../creatorGuideAssets';
import { useEffect, useState, type ReactNode } from 'react';
import { Light, Picture } from '@icon-park/react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './GradientPage.css';

const buildingImage = creatorGuideAssetUrl('444f8951-dd2e-42dc-94e5-c5a878618631', 'workflow/convolution-course/xiandaijianzhu.jpg');

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
  return <header shuku-edit-id="e-48ebd04d-fc97-4dc8-bcc7-7a0769e652f6" className="aipe-replay-cg-copy-ck-gradient__step-header"><span shuku-edit-id="e-9aade889-a361-47a3-868c-c26d87991846" className="aipe-replay-cg-copy-ck-gradient__step-number"><Typography shuku-edit-id="e-efb1ca99-c462-43ad-85b3-831dea3c29c7" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-67d6983f-82b5-4833-bfbe-1553d441f040" as="h2" variant="h3" tone="accent">{children}</Typography></header>;
}

function EdgeImage({ src, className = '', alt }: { src?: string; className?: string; alt: string }) {
  return src ? <img shuku-edit-id="e-c5478c99-072a-4707-a286-68926eb2bc8a" className={`aipe-replay-cg-copy-ck-gradient__image ${className}`} src={src} alt={alt} /> : <div shuku-edit-id="e-59755a7d-ab72-4ac4-8f75-7342cfee87c9" className={`aipe-replay-cg-copy-ck-gradient__loading ${className}`} role="img" aria-label={`${alt}正在计算`} />;
}

function DifferenceKernel({ vertical }: { vertical?: boolean }) {
  return <div shuku-edit-id="e-f9679023-3056-4094-919f-7ff4af2b893b" className={`aipe-replay-cg-copy-ck-gradient__kernel ${vertical ? 'is-vertical' : ''}`} role="img" aria-label={vertical ? 'y 方向差分核，上方负一，下方正一' : 'x 方向差分核，左侧负一，右侧正一'}>
    <span shuku-edit-id="e-3e56bf86-34c1-414c-b541-86dd7f2448f5"><MathFormulaStatic latex="-1" /></span><span shuku-edit-id="e-ebeec3dd-a39f-4c4e-b12d-96038b08bce8"><MathFormulaStatic latex="1" /></span>
  </div>;
}

function DifferenceCard({ axis, image }: { axis: 'x' | 'y'; image?: string }) {
  const isX = axis === 'x';
  return <section shuku-edit-id="e-0ce692d1-26ca-4794-98fa-ca12e0f7466b" className="aipe-replay-cg-copy-ck-gradient__difference-card">
    <Typography shuku-edit-id="e-629c9f80-c29f-4c26-ab51-a3da3630b62e" variant="body" tone="accent"><MathFormulaStatic latex={axis} /> 方向差分</Typography>
    <div shuku-edit-id="e-3b266062-a920-430c-9e1e-e414248f3b30" className="aipe-replay-cg-copy-ck-gradient__kernel-display"><DifferenceKernel vertical={!isX} /></div>
    <MathFormulaStatic latex={isX ? 'G_x' : 'G_y'} className="aipe-replay-cg-copy-ck-gradient__result-symbol" />
    <div shuku-edit-id="e-34dc1176-f204-4e4f-af8c-df2d1221f83d" className="aipe-replay-cg-copy-ck-gradient__preview">
      <button shuku-edit-id="e-82c41165-093d-46f8-b341-5026f013080b" className="aipe-replay-cg-copy-ck-gradient__preview-trigger" type="button" aria-label={`查看 ${axis} 方向差分图`} aria-describedby={`aipe-replay-cg-copy-ck-gradient-preview-${axis}`}><Picture theme="outline" size="26" strokeWidth={3} /></button>
      <div shuku-edit-id="e-e8149f61-d457-48b6-bc29-e21dab0f9ed9" className="aipe-replay-cg-copy-ck-gradient__preview-popover" id={`aipe-replay-cg-copy-ck-gradient-preview-${axis}`} role="tooltip">
        <EdgeImage src={image} className="aipe-replay-cg-copy-ck-gradient__edge-image" alt={`${axis} 方向的一阶差分图`} />
      </div>
    </div>
    <Typography shuku-edit-id="e-e452d4b3-628f-4021-bb1b-1c33634721e8" variant="bodySmall" tone="muted">亮处表示{isX ? '左右' : '上下'}变化强</Typography>
  </section>;
}

export function GradientPage() {
  const images = useGradientImages();
  return <ContentBlock shuku-edit-id="e-b197fcf0-1686-4ecf-b1db-f5210d8cf564" headingLevel={1} className="aipe-replay-cg-copy-ck-gradient" title="一阶差分：从方向变化到梯度" subtitle={<>分别计算 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的局部变化，再合成为梯度幅值。</>}>
    <section shuku-edit-id="e-0c6dd6e5-ea50-4c50-96ae-36f99da0af68" className="aipe-replay-cg-copy-ck-gradient__formula-strip" aria-label="两个方向的一阶差分及梯度幅值公式">
      <div shuku-edit-id="e-d8449a2f-9f97-452e-8773-45380976be3f"><Typography shuku-edit-id="e-caa8c6ca-e0fe-4689-86e7-bcac5213154f" variant="body" tone="accent"><MathFormulaStatic latex="x" /> 方向差分</Typography><MathFormulaBlock ariaLabel="x 方向差分公式"><MathFormulaStatic latex={String.raw`G_x=I*K_x`} /></MathFormulaBlock></div>
      <div shuku-edit-id="e-20b293e5-4baf-4d20-9f21-34fe10dbc5d3"><Typography shuku-edit-id="e-a5dbdb84-383e-4c40-b80f-bf168cc5474e" variant="body" tone="accent"><MathFormulaStatic latex="y" /> 方向差分</Typography><MathFormulaBlock ariaLabel="y 方向差分公式"><MathFormulaStatic latex={String.raw`G_y=I*K_y`} /></MathFormulaBlock></div>
      <div shuku-edit-id="e-cb7ac681-5ce5-4357-93d8-20be8cd0b56a"><Typography shuku-edit-id="e-872a318a-4a73-44c3-a3b2-536567f81efc" variant="body" tone="accent">梯度幅值</Typography><MathFormulaBlock ariaLabel="梯度幅值公式"><MathFormulaStatic latex={String.raw`\left|\nabla I\right|=\sqrt{G_x^2+G_y^2}`} /></MathFormulaBlock></div>
    </section>
    <div shuku-edit-id="e-dc3214ec-ec94-45fc-a7d1-dd497353d047" className="aipe-replay-cg-copy-ck-gradient__columns">
      <article shuku-edit-id="e-e4c91a3e-98eb-411f-ac10-0fbf8aec4d44" className="aipe-replay-cg-copy-ck-gradient__panel aipe-replay-cg-copy-ck-gradient__panel--input">
        <StepHeader number="1">输入图像</StepHeader>
        <img shuku-edit-id="e-509ae6e7-0537-4ecd-b7cd-5c6b97c7787c" className="aipe-replay-cg-copy-ck-gradient__image aipe-replay-cg-copy-ck-gradient__input-image" src={buildingImage} alt="建筑灰度输入图" />
        <Typography shuku-edit-id="e-30a2d2b7-ee20-49e7-b276-c7972dbb4c93" variant="body" tone="accent">灰度图像 <MathFormulaStatic latex="I" /></Typography>
      </article>
      <article shuku-edit-id="e-7c2c168e-1025-4efc-8273-770c5a7ec4fb" className="aipe-replay-cg-copy-ck-gradient__panel aipe-replay-cg-copy-ck-gradient__panel--difference">
        <StepHeader number="2">两个方向的一阶差分</StepHeader>
        <div shuku-edit-id="e-81bd0204-e2da-40d5-80a3-e9b5f9f7704a" className="aipe-replay-cg-copy-ck-gradient__difference-grid">
          <DifferenceCard axis="x" image={images?.horizontal} />
          <DifferenceCard axis="y" image={images?.vertical} />
        </div>
      </article>
      <article shuku-edit-id="e-88365fc0-72c0-40ed-a381-47d0e4db43d5" className="aipe-replay-cg-copy-ck-gradient__panel aipe-replay-cg-copy-ck-gradient__panel--gradient">
        <StepHeader number="3">梯度幅值</StepHeader>
        <EdgeImage src={images?.magnitude} className="aipe-replay-cg-copy-ck-gradient__gradient-image" alt="合成后的梯度幅值图" />
        <MathFormulaStatic latex={String.raw`\left|\nabla I\right|=\sqrt{G_x^2+G_y^2}`} className="aipe-replay-cg-copy-ck-gradient__magnitude-caption" />
      </article>
    </div>
    <footer shuku-edit-id="e-ab436443-3052-4558-9edf-a3614f6b98bc" className="aipe-replay-cg-copy-ck-gradient__summary"><span shuku-edit-id="e-1f145045-627c-4032-8b8c-056bd62081dd" className="aipe-replay-cg-copy-ck-gradient__summary-icon" aria-hidden="true"><Light theme="outline" size="32" strokeWidth={3} /></span><Typography shuku-edit-id="e-c9c84b66-2fe0-4dd4-b351-ef00d05ed2ae" as="span" variant="h3" tone="accent">总结：</Typography><Typography shuku-edit-id="e-5019b564-60d4-4726-a34d-ce9551963a42" variant="body">一阶差分分别度量 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的局部变化，梯度幅值将它们合成为与方向无关的变化强度。</Typography></footer>
  </ContentBlock>;
}
