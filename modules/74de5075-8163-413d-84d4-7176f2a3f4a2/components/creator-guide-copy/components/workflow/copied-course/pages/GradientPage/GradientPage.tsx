import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { creatorGuideAssetUrl } from '../../../../../creatorGuideAssets';
import { useEffect, useState, type ReactNode } from 'react';
import { Light, Picture } from '@icon-park/react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './GradientPage.css';

const buildingImage = creatorGuideAssetUrl('444f8951-dd2e-42dc-94e5-c5a878618631', "workflow/convolution-course/xiandaijianzhu.webp");

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
  return <header shuku-edit-id="e-fe5a2196-8868-46a4-8ada-177433840241" className="aipe-replay-cg-copy-ck-gradient__step-header"><span shuku-edit-id="e-d441c545-325f-4edb-9f9e-01147dc24bc2" className="aipe-replay-cg-copy-ck-gradient__step-number"><Typography shuku-edit-id="e-91d5c081-2a33-4ce0-a2b0-638e2a3dc303" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-3858ccbd-6572-4faa-b0fe-13e3815f599b" as="h2" variant="h3" tone="accent">{children}</Typography></header>;
}

function EdgeImage({ src, className = '', alt }: { src?: string; className?: string; alt: string }) {
  return src ? <img shuku-edit-id="e-69657bb1-4d68-4ebe-a9fa-fec69f273442" className={`aipe-replay-cg-copy-ck-gradient__image ${className}`} src={src} alt={alt} /> : <div shuku-edit-id="e-63bdcb25-e348-4f1f-aff3-d1d1f979df80" className={`aipe-replay-cg-copy-ck-gradient__loading ${className}`} role="img" aria-label={`${alt}正在计算`} />;
}

function DifferenceKernel({ vertical }: { vertical?: boolean }) {
  return <div shuku-edit-id="e-c9c60aa6-3660-4bf5-a4d1-e84ca5380ce1" className={`aipe-replay-cg-copy-ck-gradient__kernel ${vertical ? 'is-vertical' : ''}`} role="img" aria-label={vertical ? 'y 方向差分核，上方负一，下方正一' : 'x 方向差分核，左侧负一，右侧正一'}>
    <span shuku-edit-id="e-a4cea303-886a-47d4-b99e-6a69c2f9e562"><MathFormulaStatic latex="-1" /></span><span shuku-edit-id="e-e1aa8d66-feb3-4325-9bb5-b4a6e81b3a49"><MathFormulaStatic latex="1" /></span>
  </div>;
}

function DifferenceCard({ axis, image }: { axis: 'x' | 'y'; image?: string }) {
  const isX = axis === 'x';
  return <section shuku-edit-id="e-b0f0caad-92e1-484a-a915-d7e50d4eae84" className="aipe-replay-cg-copy-ck-gradient__difference-card">
    <Typography shuku-edit-id="e-7a4243a1-d205-4270-bbe2-bb5f26f5cec8" variant="body" tone="accent"><MathFormulaStatic latex={axis} /> 方向差分</Typography>
    <div shuku-edit-id="e-e6c82c2c-37f2-48a0-ae7e-9cfecacafe4a" className="aipe-replay-cg-copy-ck-gradient__kernel-display"><DifferenceKernel vertical={!isX} /></div>
    <MathFormulaStatic latex={isX ? 'G_x' : 'G_y'} className="aipe-replay-cg-copy-ck-gradient__result-symbol" />
    <div shuku-edit-id="e-f24b9a77-43a0-414c-aaca-83132c8c1222" className="aipe-replay-cg-copy-ck-gradient__preview">
      <button shuku-edit-id="e-f10f2b32-dad9-4858-9c62-97edaefb7e86" className="aipe-replay-cg-copy-ck-gradient__preview-trigger" type="button" aria-label={`查看 ${axis} 方向差分图`} aria-describedby={`aipe-replay-cg-copy-ck-gradient-preview-${axis}`}><Picture theme="outline" size="26" strokeWidth={3} /></button>
      <div shuku-edit-id="e-6e9d4d8e-ddd0-4a8b-81e2-fa74d9f1ed54" className="aipe-replay-cg-copy-ck-gradient__preview-popover" id={`aipe-replay-cg-copy-ck-gradient-preview-${axis}`} role="tooltip">
        <EdgeImage src={image} className="aipe-replay-cg-copy-ck-gradient__edge-image" alt={`${axis} 方向的一阶差分图`} />
      </div>
    </div>
    <Typography shuku-edit-id="e-97de3de5-71f3-4f8b-9aae-c11c70aa3756" variant="bodySmall" tone="muted">亮处表示{isX ? '左右' : '上下'}变化强</Typography>
  </section>;
}

export function GradientPage() {
  const images = useGradientImages();
  return <ContentBlock shuku-edit-id="e-b702320a-aa9a-4f15-9e1e-9ec407047fc7" headingLevel={1} className="aipe-replay-cg-copy-ck-gradient" title="一阶差分：从方向变化到梯度" subtitle={<>分别计算 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的局部变化，再合成为梯度幅值。</>}>
    <section shuku-edit-id="e-8cfd2772-c081-4bf5-8454-7c5b8011c13c" className="aipe-replay-cg-copy-ck-gradient__formula-strip" aria-label="两个方向的一阶差分及梯度幅值公式">
      <div shuku-edit-id="e-8449c0d4-a802-4d97-8536-0b6c87411797"><Typography shuku-edit-id="e-56afc0ec-c443-4eb5-809d-9c2df6af120d" variant="body" tone="accent"><MathFormulaStatic latex="x" /> 方向差分</Typography><MathFormulaBlock ariaLabel="x 方向差分公式"><MathFormulaStatic latex={String.raw`G_x=I*K_x`} /></MathFormulaBlock></div>
      <div shuku-edit-id="e-6d816ff1-129c-4948-b9ec-097360c27a63"><Typography shuku-edit-id="e-e56ef1a7-a968-4a5b-a4a9-c8f9b9c5e555" variant="body" tone="accent"><MathFormulaStatic latex="y" /> 方向差分</Typography><MathFormulaBlock ariaLabel="y 方向差分公式"><MathFormulaStatic latex={String.raw`G_y=I*K_y`} /></MathFormulaBlock></div>
      <div shuku-edit-id="e-f1120fa8-fc60-46b0-be21-0cf3d9718fd6"><Typography shuku-edit-id="e-046c8cb7-6bdf-4645-8c71-b18d39c108ff" variant="body" tone="accent">梯度幅值</Typography><MathFormulaBlock ariaLabel="梯度幅值公式"><MathFormulaStatic latex={String.raw`\left|\nabla I\right|=\sqrt{G_x^2+G_y^2}`} /></MathFormulaBlock></div>
    </section>
    <div shuku-edit-id="e-055882ac-4274-49af-afde-ace5908ca84b" className="aipe-replay-cg-copy-ck-gradient__columns">
      <article shuku-edit-id="e-a6f0dd8c-606c-4c2c-b82d-155fa4a4c632" className="aipe-replay-cg-copy-ck-gradient__panel aipe-replay-cg-copy-ck-gradient__panel--input">
        <StepHeader number="1">输入图像</StepHeader>
        <img shuku-edit-id="e-4b065d67-5c85-44e4-8604-25eba4308305" className="aipe-replay-cg-copy-ck-gradient__image aipe-replay-cg-copy-ck-gradient__input-image" src={buildingImage} alt="建筑灰度输入图" />
        <Typography shuku-edit-id="e-d82a93d2-63f7-455d-b52e-8d0c985ef1b0" variant="body" tone="accent">灰度图像 <MathFormulaStatic latex="I" /></Typography>
      </article>
      <article shuku-edit-id="e-c78b6053-1f2a-4bcb-9d37-e7d3f7da3c88" className="aipe-replay-cg-copy-ck-gradient__panel aipe-replay-cg-copy-ck-gradient__panel--difference">
        <StepHeader number="2">两个方向的一阶差分</StepHeader>
        <div shuku-edit-id="e-23f2b700-a13e-4064-829c-559c60660d67" className="aipe-replay-cg-copy-ck-gradient__difference-grid">
          <DifferenceCard axis="x" image={images?.horizontal} />
          <DifferenceCard axis="y" image={images?.vertical} />
        </div>
      </article>
      <article shuku-edit-id="e-96401a08-0f7e-4220-8f41-becc82fa9774" className="aipe-replay-cg-copy-ck-gradient__panel aipe-replay-cg-copy-ck-gradient__panel--gradient">
        <StepHeader number="3">梯度幅值</StepHeader>
        <EdgeImage src={images?.magnitude} className="aipe-replay-cg-copy-ck-gradient__gradient-image" alt="合成后的梯度幅值图" />
        <MathFormulaStatic latex={String.raw`\left|\nabla I\right|=\sqrt{G_x^2+G_y^2}`} className="aipe-replay-cg-copy-ck-gradient__magnitude-caption" />
      </article>
    </div>
    <footer shuku-edit-id="e-b4577adb-fc3e-41a6-a932-31a2cc919966" className="aipe-replay-cg-copy-ck-gradient__summary"><span shuku-edit-id="e-ce48b550-5b60-4c3e-b00c-98c3ef4c81e6" className="aipe-replay-cg-copy-ck-gradient__summary-icon" aria-hidden="true"><Light theme="outline" size="32" strokeWidth={3} /></span><Typography shuku-edit-id="e-d238b4fe-6f7d-4879-af7f-bae8ece6badc" as="span" variant="h3" tone="accent">总结：</Typography><Typography shuku-edit-id="e-07056f76-1fe1-4a4b-a49f-b2998f2be3f2" variant="body">一阶差分分别度量 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的局部变化，梯度幅值将它们合成为与方向无关的变化强度。</Typography></footer>
  </ContentBlock>;
}
