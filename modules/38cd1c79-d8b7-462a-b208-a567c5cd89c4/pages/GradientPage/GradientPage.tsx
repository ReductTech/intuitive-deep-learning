import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useState, type ReactNode } from 'react';
import { Light, Picture } from '@icon-park/react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './GradientPage.css';

const buildingImage = moduleAssetUrl('xiandaijianzhu.jpg');

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
  return <header shuku-edit-id="e-054adb5e-b083-4725-88fa-0e4dbabc450e" className="ck-gradient__step-header"><span shuku-edit-id="e-9613eece-7d45-4b2d-ac16-cfdd894c817c" className="ck-gradient__step-number"><Typography shuku-edit-id="e-48ed547e-44be-4d66-99e8-a4263ed8f75c" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-ef1c7510-c889-4bba-a3c7-b44a999010ef" as="h2" variant="h3" tone="accent">{children}</Typography></header>;
}

function EdgeImage({ src, className = '', alt }: { src?: string; className?: string; alt: string }) {
  return src ? <img shuku-edit-id="e-bd9b0949-7e1d-4876-b6d3-8ae0f96b9fa2" className={`ck-gradient__image ${className}`} src={src} alt={alt} /> : <div shuku-edit-id="e-d514394e-0a0b-4b06-9fbb-043524aeb9de" className={`ck-gradient__loading ${className}`} role="img" aria-label={`${alt}正在计算`} />;
}

function DifferenceKernel({ vertical }: { vertical?: boolean }) {
  return <div shuku-edit-id="e-47496066-0771-4d55-884a-7c1ada2cea6e" className={`ck-gradient__kernel ${vertical ? 'is-vertical' : ''}`} role="img" aria-label={vertical ? 'y 方向差分核，上方负一，下方正一' : 'x 方向差分核，左侧负一，右侧正一'}>
    <span shuku-edit-id="e-f9310be1-cb97-46b3-9899-ccf4c79fc5bc"><MathFormulaStatic latex="-1" /></span><span shuku-edit-id="e-008147c4-8797-4543-a829-ea0bc6ea3335"><MathFormulaStatic latex="1" /></span>
  </div>;
}

function DifferenceCard({ axis, image }: { axis: 'x' | 'y'; image?: string }) {
  const isX = axis === 'x';
  return <section shuku-edit-id="e-6c8232cb-f1b6-45fb-81f9-76dfd2b2b542" className="ck-gradient__difference-card">
    <Typography shuku-edit-id="e-37f1e584-2bf4-4268-badf-822936b2aa4d" variant="body" tone="accent"><MathFormulaStatic latex={axis} /> 方向差分</Typography>
    <div shuku-edit-id="e-1934a701-1292-4382-914b-20fccfdbe0f2" className="ck-gradient__kernel-display"><DifferenceKernel vertical={!isX} /></div>
    <MathFormulaStatic latex={isX ? 'G_x' : 'G_y'} className="ck-gradient__result-symbol" />
    <div shuku-edit-id="e-9724d125-7a2a-4017-a794-a720785d3102" className="ck-gradient__preview">
      <button shuku-edit-id="e-1c78c8e4-af3e-4368-ae27-1aa23dab0388" className="ck-gradient__preview-trigger" type="button" aria-label={`查看 ${axis} 方向差分图`} aria-describedby={`ck-gradient-preview-${axis}`}><Picture theme="outline" size="26" strokeWidth={3} /></button>
      <div shuku-edit-id="e-9178a38b-cb97-45bc-a68b-3526b46fad9c" className="ck-gradient__preview-popover" id={`ck-gradient-preview-${axis}`} role="tooltip">
        <EdgeImage src={image} className="ck-gradient__edge-image" alt={`${axis} 方向的一阶差分图`} />
      </div>
    </div>
    <Typography shuku-edit-id="e-72859c5e-715b-4e8f-9e2a-79c8534b762f" variant="bodySmall" tone="muted">亮处表示{isX ? '左右' : '上下'}变化强</Typography>
  </section>;
}

export function GradientPage() {
  const images = useGradientImages();
  return <ContentBlock shuku-edit-id="e-81da3ea2-cc32-4336-a82e-050a5d96021e" headingLevel={1} className="ck-gradient" title="一阶差分：从方向变化到梯度" subtitle={<>分别计算 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的局部变化，再合成为梯度幅值。</>}>
    <section shuku-edit-id="e-6658b643-d32f-4b95-8a8a-d71f15b50aed" className="ck-gradient__formula-strip" aria-label="两个方向的一阶差分及梯度幅值公式">
      <div shuku-edit-id="e-fb3d733d-8e93-4ef1-9d40-eb07249e4c34"><Typography shuku-edit-id="e-a6ae3748-288f-4956-87b4-5d1d4287f489" variant="body" tone="accent"><MathFormulaStatic latex="x" /> 方向差分</Typography><MathFormulaBlock ariaLabel="x 方向差分公式"><MathFormulaStatic latex={String.raw`G_x=I*K_x`} /></MathFormulaBlock></div>
      <div shuku-edit-id="e-453d94e5-9fc9-4e48-89f5-d66e7ad2fdbb"><Typography shuku-edit-id="e-1a51e1f5-3cb2-464e-8907-735a215a44e4" variant="body" tone="accent"><MathFormulaStatic latex="y" /> 方向差分</Typography><MathFormulaBlock ariaLabel="y 方向差分公式"><MathFormulaStatic latex={String.raw`G_y=I*K_y`} /></MathFormulaBlock></div>
      <div shuku-edit-id="e-0c3ca768-bf1d-4ddb-b2e1-cc17c36257b1"><Typography shuku-edit-id="e-6c86cefd-a8aa-449a-a332-6634dd1dd995" variant="body" tone="accent">梯度幅值</Typography><MathFormulaBlock ariaLabel="梯度幅值公式"><MathFormulaStatic latex={String.raw`\left|\nabla I\right|=\sqrt{G_x^2+G_y^2}`} /></MathFormulaBlock></div>
    </section>
    <div shuku-edit-id="e-95afa9a7-5b09-4d6c-9950-1a6b802c0bdb" className="ck-gradient__columns">
      <article shuku-edit-id="e-229a5d4b-5877-416f-91b6-743cd707c10c" className="ck-gradient__panel ck-gradient__panel--input">
        <StepHeader number="1">输入图像</StepHeader>
        <img shuku-edit-id="e-fcfd99ce-ae5b-4ad7-81c3-a3cb5898dfbf" className="ck-gradient__image ck-gradient__input-image" src={buildingImage} alt="建筑灰度输入图" />
        <Typography shuku-edit-id="e-031235c6-e8f1-467f-80ef-d4f6188f6d82" variant="body" tone="accent">灰度图像 <MathFormulaStatic latex="I" /></Typography>
      </article>
      <article shuku-edit-id="e-12083b5b-92f0-450a-a8ca-3678fc3b5ad6" className="ck-gradient__panel ck-gradient__panel--difference">
        <StepHeader number="2">两个方向的一阶差分</StepHeader>
        <div shuku-edit-id="e-049891b2-ef21-4e67-9714-9fd94d1a1701" className="ck-gradient__difference-grid">
          <DifferenceCard axis="x" image={images?.horizontal} />
          <DifferenceCard axis="y" image={images?.vertical} />
        </div>
      </article>
      <article shuku-edit-id="e-162de6f8-9737-48ba-884f-8290f89f7959" className="ck-gradient__panel ck-gradient__panel--gradient">
        <StepHeader number="3">梯度幅值</StepHeader>
        <EdgeImage src={images?.magnitude} className="ck-gradient__gradient-image" alt="合成后的梯度幅值图" />
        <MathFormulaStatic latex={String.raw`\left|\nabla I\right|=\sqrt{G_x^2+G_y^2}`} className="ck-gradient__magnitude-caption" />
      </article>
    </div>
    <footer shuku-edit-id="e-63c8f2f9-2952-4353-b9c4-d52dff66d1a5" className="ck-gradient__summary"><span shuku-edit-id="e-43d32813-5bd7-4798-a1ab-824f80e601bd" className="ck-gradient__summary-icon" aria-hidden="true"><Light theme="outline" size="32" strokeWidth={3} /></span><Typography shuku-edit-id="e-41ab2a59-5e8a-464f-a6a2-643ddd85cbfe" as="span" variant="h3" tone="accent">总结：</Typography><Typography shuku-edit-id="e-89dae4b9-59df-4dba-9619-6eda0ba02fdb" variant="body">一阶差分分别度量 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的局部变化，梯度幅值将它们合成为与方向无关的变化强度。</Typography></footer>
  </ContentBlock>;
}
