import xiandaijianzhuAsset0 from '../../../../../assets/workflow/convolution-course/xiandaijianzhu.jpg';
import { useEffect, useState, type ReactNode } from 'react';
import { Light, Picture } from '@icon-park/react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './GradientPage.css';

const buildingImage = xiandaijianzhuAsset0;

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
  return <header shuku-edit-id="e-9633fc68-0a2b-4b9d-8d86-56c4b5a57111" className="cg-copy-ck-gradient__step-header"><span shuku-edit-id="e-93b575dc-12cf-469e-9507-16c8d208a0c6" className="cg-copy-ck-gradient__step-number"><Typography shuku-edit-id="e-5129223e-9624-4303-80f6-39f837f7d30c" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-6ea7c1dc-d868-4ac3-baf8-0cee02f23ec3" as="h2" variant="h3" tone="accent">{children}</Typography></header>;
}

function EdgeImage({ src, className = '', alt }: { src?: string; className?: string; alt: string }) {
  return src ? <img shuku-edit-id="e-8377e101-4ba6-470d-a1dd-190ee6b88836" className={`cg-copy-ck-gradient__image ${className}`} src={src} alt={alt} /> : <div shuku-edit-id="e-07359d77-6186-43f6-be22-4d552329885d" className={`cg-copy-ck-gradient__loading ${className}`} role="img" aria-label={`${alt}正在计算`} />;
}

function DifferenceKernel({ vertical }: { vertical?: boolean }) {
  return <div shuku-edit-id="e-196b185c-dcb1-4416-a9a1-efeec3fd72b1" className={`cg-copy-ck-gradient__kernel ${vertical ? 'is-vertical' : ''}`} role="img" aria-label={vertical ? 'y 方向差分核，上方负一，下方正一' : 'x 方向差分核，左侧负一，右侧正一'}>
    <span shuku-edit-id="e-c3bf6eef-9b30-4e47-adb6-d9282594b71e"><MathFormulaStatic latex="-1" /></span><span shuku-edit-id="e-22e5dd79-3aaa-4dcd-b597-8bd9b1c9df49"><MathFormulaStatic latex="1" /></span>
  </div>;
}

function DifferenceCard({ axis, image }: { axis: 'x' | 'y'; image?: string }) {
  const isX = axis === 'x';
  return <section shuku-edit-id="e-270f6f31-03ff-4cc1-9f22-d2f06e366b4b" className="cg-copy-ck-gradient__difference-card">
    <Typography shuku-edit-id="e-809e4446-5bfc-41f6-b57f-fa480786ce50" variant="body" tone="accent"><MathFormulaStatic latex={axis} /> 方向差分</Typography>
    <div shuku-edit-id="e-e077f602-bc80-4152-94f0-0d09a00369a7" className="cg-copy-ck-gradient__kernel-display"><DifferenceKernel vertical={!isX} /></div>
    <MathFormulaStatic latex={isX ? 'G_x' : 'G_y'} className="cg-copy-ck-gradient__result-symbol" />
    <div shuku-edit-id="e-205c0743-c8f7-4e8e-bc61-659057a74329" className="cg-copy-ck-gradient__preview">
      <button shuku-edit-id="e-9027872c-7190-401b-a0a8-c9a767e5d40e" className="cg-copy-ck-gradient__preview-trigger" type="button" aria-label={`查看 ${axis} 方向差分图`} aria-describedby={`cg-copy-ck-gradient-preview-${axis}`}><Picture theme="outline" size="26" strokeWidth={3} /></button>
      <div shuku-edit-id="e-a3bed9db-56a9-42b0-998f-891492de8bce" className="cg-copy-ck-gradient__preview-popover" id={`cg-copy-ck-gradient-preview-${axis}`} role="tooltip">
        <EdgeImage src={image} className="cg-copy-ck-gradient__edge-image" alt={`${axis} 方向的一阶差分图`} />
      </div>
    </div>
    <Typography shuku-edit-id="e-752e9336-5bb3-4bc3-8164-5b5dbd841759" variant="bodySmall" tone="muted">亮处表示{isX ? '左右' : '上下'}变化强</Typography>
  </section>;
}

export function GradientPage() {
  const images = useGradientImages();
  return <ContentBlock shuku-edit-id="e-11540ea3-39dc-4088-9bc8-b7fe3dbb0eaf" headingLevel={1} className="cg-copy-ck-gradient" title="一阶差分：从方向变化到梯度" subtitle={<>分别计算 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的局部变化，再合成为梯度幅值。</>}>
    <section shuku-edit-id="e-d86af576-a0cc-4557-a578-45171d757021" className="cg-copy-ck-gradient__formula-strip" aria-label="两个方向的一阶差分及梯度幅值公式">
      <div shuku-edit-id="e-d0dc6d84-2f84-41c1-94f6-55ff1cb1bfb5"><Typography shuku-edit-id="e-25487ab4-8bca-4807-b60d-2e9df53ef3b7" variant="body" tone="accent"><MathFormulaStatic latex="x" /> 方向差分</Typography><MathFormulaBlock ariaLabel="x 方向差分公式"><MathFormulaStatic latex={String.raw`G_x=I*K_x`} /></MathFormulaBlock></div>
      <div shuku-edit-id="e-78c6f369-6dd0-4617-8ff7-22d7580b29e9"><Typography shuku-edit-id="e-8ea0400f-fd4b-4f4b-b0c3-6ef9f9d36df2" variant="body" tone="accent"><MathFormulaStatic latex="y" /> 方向差分</Typography><MathFormulaBlock ariaLabel="y 方向差分公式"><MathFormulaStatic latex={String.raw`G_y=I*K_y`} /></MathFormulaBlock></div>
      <div shuku-edit-id="e-037ae334-c57c-4afa-aa2a-6a6c61877627"><Typography shuku-edit-id="e-89654c5a-f0f9-402c-b1e7-b76cf3cab6f1" variant="body" tone="accent">梯度幅值</Typography><MathFormulaBlock ariaLabel="梯度幅值公式"><MathFormulaStatic latex={String.raw`\left|\nabla I\right|=\sqrt{G_x^2+G_y^2}`} /></MathFormulaBlock></div>
    </section>
    <div shuku-edit-id="e-c6c401d4-6cb7-44e9-b75b-babf45f3ed1b" className="cg-copy-ck-gradient__columns">
      <article shuku-edit-id="e-438654cb-425d-4480-8708-3fc0a29615be" className="cg-copy-ck-gradient__panel cg-copy-ck-gradient__panel--input">
        <StepHeader number="1">输入图像</StepHeader>
        <img shuku-edit-id="e-3a02bdc8-4a89-41ab-9e17-ef6679b94116" className="cg-copy-ck-gradient__image cg-copy-ck-gradient__input-image" src={buildingImage} alt="建筑灰度输入图" />
        <Typography shuku-edit-id="e-beaa2a42-9f49-41e0-a6c7-2c289a09790c" variant="body" tone="accent">灰度图像 <MathFormulaStatic latex="I" /></Typography>
      </article>
      <article shuku-edit-id="e-8948656b-a177-48ab-96d7-be76bf0846c4" className="cg-copy-ck-gradient__panel cg-copy-ck-gradient__panel--difference">
        <StepHeader number="2">两个方向的一阶差分</StepHeader>
        <div shuku-edit-id="e-a0a40980-2553-40d3-a167-54de3c2a02ed" className="cg-copy-ck-gradient__difference-grid">
          <DifferenceCard axis="x" image={images?.horizontal} />
          <DifferenceCard axis="y" image={images?.vertical} />
        </div>
      </article>
      <article shuku-edit-id="e-0c042f0c-bf9e-47ab-97f3-f129331014c8" className="cg-copy-ck-gradient__panel cg-copy-ck-gradient__panel--gradient">
        <StepHeader number="3">梯度幅值</StepHeader>
        <EdgeImage src={images?.magnitude} className="cg-copy-ck-gradient__gradient-image" alt="合成后的梯度幅值图" />
        <MathFormulaStatic latex={String.raw`\left|\nabla I\right|=\sqrt{G_x^2+G_y^2}`} className="cg-copy-ck-gradient__magnitude-caption" />
      </article>
    </div>
    <footer shuku-edit-id="e-0e6772ae-643e-47fa-af46-a9c11fb85e80" className="cg-copy-ck-gradient__summary"><span shuku-edit-id="e-698c1933-f75d-46fe-ae01-d7d5ef1943af" className="cg-copy-ck-gradient__summary-icon" aria-hidden="true"><Light theme="outline" size="32" strokeWidth={3} /></span><Typography shuku-edit-id="e-e2d932c4-645e-4d57-8d76-1c22a49625f4" as="span" variant="h3" tone="accent">总结：</Typography><Typography shuku-edit-id="e-e6973aff-5587-4877-a544-4c581a43cef1" variant="body">一阶差分分别度量 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的局部变化，梯度幅值将它们合成为与方向无关的变化强度。</Typography></footer>
  </ContentBlock>;
}
