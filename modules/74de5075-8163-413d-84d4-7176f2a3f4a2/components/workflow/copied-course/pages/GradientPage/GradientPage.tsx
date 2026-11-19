import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useState, type ReactNode } from 'react';
import { Light, Picture } from '@icon-park/react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './GradientPage.css';

const buildingImage = moduleAssetUrl("workflow/convolution-course/xiandaijianzhu.webp");

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
  return <header shuku-edit-id="e-e6bdb5fe-6d30-4098-adc3-00e2f341afb8" className="cg-copy-ck-gradient__step-header"><span shuku-edit-id="e-e4547d0c-34c3-4aa8-a51e-bb3831d90ca6" className="cg-copy-ck-gradient__step-number"><Typography shuku-edit-id="e-70e11753-5a06-49a7-b85f-e3d085e4f62c" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-3880ca53-24cd-43ab-87f8-8930be2a4d32" as="h2" variant="h3" tone="accent">{children}</Typography></header>;
}

function EdgeImage({ src, className = '', alt }: { src?: string; className?: string; alt: string }) {
  return src ? <img shuku-edit-id="e-ec1f324d-6e56-41aa-9b48-b147715fb54e" className={`cg-copy-ck-gradient__image ${className}`} src={src} alt={alt} /> : <div shuku-edit-id="e-998b8df7-b0b5-429c-aacb-ed78f9783970" className={`cg-copy-ck-gradient__loading ${className}`} role="img" aria-label={`${alt}正在计算`} />;
}

function DifferenceKernel({ vertical }: { vertical?: boolean }) {
  return <div shuku-edit-id="e-7058d3d0-cf6b-48a4-8fab-9acd5d15c3e0" className={`cg-copy-ck-gradient__kernel ${vertical ? 'is-vertical' : ''}`} role="img" aria-label={vertical ? 'y 方向差分核，上方负一，下方正一' : 'x 方向差分核，左侧负一，右侧正一'}>
    <span shuku-edit-id="e-c3cbc9f1-a999-4b46-ad38-a228edeb6c58"><MathFormulaStatic latex="-1" /></span><span shuku-edit-id="e-65762178-302c-4fb0-b1a9-3b998cfcaccb"><MathFormulaStatic latex="1" /></span>
  </div>;
}

function DifferenceCard({ axis, image }: { axis: 'x' | 'y'; image?: string }) {
  const isX = axis === 'x';
  return <section shuku-edit-id="e-2bb4e014-0475-43d6-b162-d2a8cf4b4eab" className="cg-copy-ck-gradient__difference-card">
    <Typography shuku-edit-id="e-d00bf846-7c50-484c-932a-870c9afb2b66" variant="body" tone="accent"><MathFormulaStatic latex={axis} /> 方向差分</Typography>
    <div shuku-edit-id="e-8be2645d-018f-4572-9bf5-75d04918cd96" className="cg-copy-ck-gradient__kernel-display"><DifferenceKernel vertical={!isX} /></div>
    <MathFormulaStatic latex={isX ? 'G_x' : 'G_y'} className="cg-copy-ck-gradient__result-symbol" />
    <div shuku-edit-id="e-79b38fe2-0132-4287-bf71-fbf5ec93f5a8" className="cg-copy-ck-gradient__preview">
      <button shuku-edit-id="e-0c1b26c1-2e4c-487c-9558-5c013c661143" className="cg-copy-ck-gradient__preview-trigger" type="button" aria-label={`查看 ${axis} 方向差分图`} aria-describedby={`cg-copy-ck-gradient-preview-${axis}`}><Picture theme="outline" size="26" strokeWidth={3} /></button>
      <div shuku-edit-id="e-2908ecea-da04-4de0-b48a-0a6fee9e5425" className="cg-copy-ck-gradient__preview-popover" id={`cg-copy-ck-gradient-preview-${axis}`} role="tooltip">
        <EdgeImage src={image} className="cg-copy-ck-gradient__edge-image" alt={`${axis} 方向的一阶差分图`} />
      </div>
    </div>
    <Typography shuku-edit-id="e-babb6462-5218-4481-b02e-3cedecf380e1" variant="bodySmall" tone="muted">亮处表示{isX ? '左右' : '上下'}变化强</Typography>
  </section>;
}

export function GradientPage() {
  const images = useGradientImages();
  return <ContentBlock shuku-edit-id="e-f79af350-ed14-4da8-a1aa-998464f490c7" headingLevel={1} className="cg-copy-ck-gradient" title="一阶差分：从方向变化到梯度" subtitle={<>分别计算 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的局部变化，再合成为梯度幅值。</>}>
    <section shuku-edit-id="e-f3281a48-0f08-45ee-b44d-6c14ce75780c" className="cg-copy-ck-gradient__formula-strip" aria-label="两个方向的一阶差分及梯度幅值公式">
      <div shuku-edit-id="e-13558977-d0e5-47e0-b40e-35aa66245462"><Typography shuku-edit-id="e-da07db5f-2261-4ae9-bdaa-57cfcb13e973" variant="body" tone="accent"><MathFormulaStatic latex="x" /> 方向差分</Typography><MathFormulaBlock ariaLabel="x 方向差分公式"><MathFormulaStatic latex={String.raw`G_x=I*K_x`} /></MathFormulaBlock></div>
      <div shuku-edit-id="e-afd5728d-ec7d-4c93-8c7d-fff90c976f1d"><Typography shuku-edit-id="e-74b90e34-c4e4-4a3d-9c44-45d9f432d82a" variant="body" tone="accent"><MathFormulaStatic latex="y" /> 方向差分</Typography><MathFormulaBlock ariaLabel="y 方向差分公式"><MathFormulaStatic latex={String.raw`G_y=I*K_y`} /></MathFormulaBlock></div>
      <div shuku-edit-id="e-2dea5e11-e108-4142-9c83-c9a78c79262d"><Typography shuku-edit-id="e-e89498c6-b26b-4c82-badd-f44de6b71b63" variant="body" tone="accent">梯度幅值</Typography><MathFormulaBlock ariaLabel="梯度幅值公式"><MathFormulaStatic latex={String.raw`\left|\nabla I\right|=\sqrt{G_x^2+G_y^2}`} /></MathFormulaBlock></div>
    </section>
    <div shuku-edit-id="e-5b05c722-6dd6-42ac-a18a-90d84f9401bd" className="cg-copy-ck-gradient__columns">
      <article shuku-edit-id="e-f3f905af-edcc-42b9-ade3-701aaaa0ca1e" className="cg-copy-ck-gradient__panel cg-copy-ck-gradient__panel--input">
        <StepHeader number="1">输入图像</StepHeader>
        <img shuku-edit-id="e-c76480ee-50fb-4742-bbd8-3af0d359d1c2" className="cg-copy-ck-gradient__image cg-copy-ck-gradient__input-image" src={buildingImage} alt="建筑灰度输入图" />
        <Typography shuku-edit-id="e-a18bcc0d-5809-47f9-bf0e-cfa57f9f6231" variant="body" tone="accent">灰度图像 <MathFormulaStatic latex="I" /></Typography>
      </article>
      <article shuku-edit-id="e-dc858bcc-324b-4c83-95e2-4fdf6eae6354" className="cg-copy-ck-gradient__panel cg-copy-ck-gradient__panel--difference">
        <StepHeader number="2">两个方向的一阶差分</StepHeader>
        <div shuku-edit-id="e-2658bad0-ddb8-44bf-8a42-d6fe8de57b5e" className="cg-copy-ck-gradient__difference-grid">
          <DifferenceCard axis="x" image={images?.horizontal} />
          <DifferenceCard axis="y" image={images?.vertical} />
        </div>
      </article>
      <article shuku-edit-id="e-98c0c763-1d9b-4a13-9086-1e43c95a9080" className="cg-copy-ck-gradient__panel cg-copy-ck-gradient__panel--gradient">
        <StepHeader number="3">梯度幅值</StepHeader>
        <EdgeImage src={images?.magnitude} className="cg-copy-ck-gradient__gradient-image" alt="合成后的梯度幅值图" />
        <MathFormulaStatic latex={String.raw`\left|\nabla I\right|=\sqrt{G_x^2+G_y^2}`} className="cg-copy-ck-gradient__magnitude-caption" />
      </article>
    </div>
    <footer shuku-edit-id="e-e36443b8-a33a-4657-abe9-fc736f93cc78" className="cg-copy-ck-gradient__summary"><span shuku-edit-id="e-2ff4b08e-bd09-456d-a431-b6c307176aeb" className="cg-copy-ck-gradient__summary-icon" aria-hidden="true"><Light theme="outline" size="32" strokeWidth={3} /></span><Typography shuku-edit-id="e-b0fdf6fa-d6da-40b6-abd6-1d80b12799fa" as="span" variant="h3" tone="accent">总结：</Typography><Typography shuku-edit-id="e-b2d6a02b-5384-4b62-bb37-5bc3c8545d80" variant="body">一阶差分分别度量 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的局部变化，梯度幅值将它们合成为与方向无关的变化强度。</Typography></footer>
  </ContentBlock>;
}
