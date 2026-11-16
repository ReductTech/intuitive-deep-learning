import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useState, type ReactNode } from 'react';
import { Light } from '@icon-park/react';
import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './LaplacianConstructionPage.css';

const buildingImage = moduleAssetUrl('workflow/convolution-course/xiandaijianzhu.jpg');

const SECOND_X = [[0, 0, 0], [1, -2, 1], [0, 0, 0]];
const SECOND_Y = [[0, 1, 0], [0, -2, 0], [0, 1, 0]];
const LAPLACIAN = [[0, 1, 0], [1, -4, 1], [0, 1, 0]];

interface ResponseImages { input: string; gradient: string; laplacian: string; }

function scaleAt(values: Float32Array, quantile: number) {
  const sorted = Array.from(values, (value) => Math.abs(value)).sort((a, b) => a - b);
  return Math.max(.015, sorted[Math.floor(sorted.length * quantile)] ?? .015);
}

function renderField(values: Float32Array, width: number, height: number, scale: number, signed = false) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return '';
  const image = context.createImageData(width, height);
  for (let index = 0; index < values.length; index += 1) {
    const normalized = signed ? .5 + values[index] / (2 * scale) : Math.abs(values[index]) / scale;
    const shade = Math.round(Math.max(0, Math.min(1, normalized)) * 255);
    image.data.set([shade, shade, shade, 255], index * 4);
  }
  context.putImageData(image, 0, 0);
  return canvas.toDataURL('image/png');
}

function buildResponses(image: HTMLImageElement): ResponseImages | null {
  const width = 640;
  const height = Math.round(width * image.naturalHeight / image.naturalWidth);
  const source = document.createElement('canvas');
  source.width = width;
  source.height = height;
  const context = source.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  const gray = new Float32Array(width * height);
  const gradient = new Float32Array(gray.length);
  const laplacian = new Float32Array(gray.length);
  for (let index = 0; index < gray.length; index += 1) {
    const offset = index * 4;
    gray[index] = (pixels[offset] * .299 + pixels[offset + 1] * .587 + pixels[offset + 2] * .114) / 255;
  }
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const left = gray[index - 1];
      const right = gray[index + 1];
      const up = gray[index - width];
      const down = gray[index + width];
      gradient[index] = Math.hypot(right - left, down - up);
      laplacian[index] = left + right + up + down - 4 * gray[index];
    }
  }
  return {
    input: renderField(gray, width, height, 1),
    gradient: renderField(gradient, width, height, scaleAt(gradient, .985)),
    laplacian: renderField(laplacian, width, height, scaleAt(laplacian, .985), true),
  };
}

function useResponses() {
  const [responses, setResponses] = useState<ResponseImages | null>(null);
  useEffect(() => {
    let active = true;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => { if (active) setResponses(buildResponses(image)); };
    image.src = buildingImage;
    return () => { active = false; };
  }, []);
  return responses;
}

function Matrix({ values, label, className = '' }: { values: number[][]; label: string; className?: string }) {
  return <div shuku-edit-id="e-0337a198-03c4-48ba-b8a6-5ac90a6402ca" className={`cg-copy-ck-laplacian__matrix ${className}`} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }} role="img" aria-label={label}>
    {values.flatMap((row, y) => row.map((value, x) => <span shuku-edit-id="e-5d57bb91-76be-4162-a9d3-d299b23b6e76" className={value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : 'is-zero'} key={`${y}-${x}`}><MathFormulaStatic latex={String(value)} /></span>))}
  </div>;
}

function StepHeader({ number, children }: { number: string; children: ReactNode }) {
  return <header shuku-edit-id="e-149861c9-2da2-4d1c-9767-3772957d6039" className="cg-copy-ck-laplacian__step-header"><span shuku-edit-id="e-f88a6a5c-0e59-4ed8-8239-69b83a9e7cb6" className="cg-copy-ck-laplacian__step-number"><Typography shuku-edit-id="e-1fdbfc8e-cefa-4c3e-ba9d-e083edd7a52a" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-055d796a-c955-4ecb-a744-a6cf8a61b72a" as="h2" variant="h3" tone="accent">{children}</Typography></header>;
}

function ImageCard({ src, alt, title }: { src?: string; alt: string; title: ReactNode }) {
  return <article shuku-edit-id="e-2bff940c-cd4b-4c78-a3c1-1c0b89f3d801" className="cg-copy-ck-laplacian__image-card"><div shuku-edit-id="e-48797a8d-48f8-43f0-a6ca-2c7be413e79a" className="cg-copy-ck-laplacian__image-wrap">{src ? <img shuku-edit-id="e-6b02bd75-4a95-4152-b03f-b679618e958a" src={src} alt={alt} /> : <div shuku-edit-id="e-5761ec04-6849-468a-870c-ca1633c2a355" className="cg-copy-ck-laplacian__loading" role="img" aria-label={`${alt}正在计算`} />}</div><div shuku-edit-id="e-6ff0d171-7881-4d2c-9b94-426c26174f87" className="cg-copy-ck-laplacian__image-caption"><Typography shuku-edit-id="e-e7bd38c1-c764-4151-ad67-bfef019c1b27" as="h3" variant="h3" tone="accent">{title}</Typography></div></article>;
}

export function LaplacianConstructionPage() {
  const responses = useResponses();
  return <ContentBlock shuku-edit-id="e-74a28aa4-e584-4c9f-9f7c-55f54d0b1b31" headingLevel={1} className="cg-copy-ck-laplacian" title="从二阶差分到 Laplacian" subtitle={<>把 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的二阶差分相加，就得到二维二阶差分核。</>}>
    <section shuku-edit-id="e-53303203-a9da-4e22-84a5-be68603af387" className="cg-copy-ck-laplacian__construction" aria-label="从一维二阶差分构造 Laplacian 卷积核">
      <article shuku-edit-id="e-b834f4ea-4a74-4a0c-8715-ce3c2ac1c525" className="cg-copy-ck-laplacian__step"><StepHeader number="1">一维二阶差分</StepHeader><div shuku-edit-id="e-9b625330-2b6d-4165-8db0-88cf4b6d6a51" className="cg-copy-ck-laplacian__one-dimensional"><span shuku-edit-id="e-d77adf14-e1d3-4836-9213-4345c3cd23f5" className="cg-copy-ck-laplacian__bracket" aria-hidden="true">[</span><Matrix values={[[1, -2, 1]]} label="一维二阶差分核：一、负二、一" className="cg-copy-ck-laplacian__matrix--row" /><span shuku-edit-id="e-92fb632e-cc19-43fc-8acd-66e5cb0ecb78" className="cg-copy-ck-laplacian__bracket" aria-hidden="true">]</span></div></article>
      <span shuku-edit-id="e-d182e327-74a9-4b27-a1ab-f5e37f59cb81" className="cg-copy-ck-laplacian__arrow" aria-hidden="true">→</span>
      <article shuku-edit-id="e-8cf74265-88b6-43e4-9cdc-ae8e707f4559" className="cg-copy-ck-laplacian__step"><StepHeader number="2">放到两个方向</StepHeader><div shuku-edit-id="e-312593f6-7702-4fc2-bf0b-cbffc606f492" className="cg-copy-ck-laplacian__directions"><div shuku-edit-id="e-cf665448-42b4-48d6-ba72-3b7cc6704cbc"><Matrix values={SECOND_X} label="x 方向二阶差分核" /></div><div shuku-edit-id="e-f81ca40e-b9d7-4795-bded-1deca337526b"><Matrix values={SECOND_Y} label="y 方向二阶差分核" /></div></div></article>
      <span shuku-edit-id="e-ea554d6f-8cc1-4eb7-bc16-dc42edcf1333" className="cg-copy-ck-laplacian__arrow" aria-hidden="true">→</span>
      <article shuku-edit-id="e-2d349bc6-ec67-4be2-9250-7bbf387c22c5" className="cg-copy-ck-laplacian__step"><StepHeader number="3">相加得到 Laplacian</StepHeader><div shuku-edit-id="e-5c6273f0-98c3-4df3-ad98-7e8b17d9d8c4" className="cg-copy-ck-laplacian__result"><Matrix values={LAPLACIAN} label="Laplacian 卷积核：中心负四，上下左右为一" /></div></article>
    </section>
    <section shuku-edit-id="e-bb2bf3d7-e9c1-4f4f-8a8d-d44696e483a0" className="cg-copy-ck-laplacian__images" aria-label="原图、梯度幅值与 Laplacian 响应的比较">
      <ImageCard src={responses?.input} alt="现代建筑的灰度原图" title="原图" />
      <ImageCard src={responses?.gradient} alt="同一建筑的梯度幅值图，亮处表示局部变化强" title={<>梯度幅值 <MathFormulaStatic latex={String.raw`|\nabla I|`} /></>} />
      <ImageCard src={responses?.laplacian} alt="同一建筑的带符号 Laplacian 响应，中灰表示零响应，明暗分别表示正负" title="Laplacian" />
    </section>
    <footer shuku-edit-id="e-a1efa2ae-c550-493d-b2bb-ec12252c18fc" className="cg-copy-ck-laplacian__summary"><span shuku-edit-id="e-44bea372-7ed3-4006-b43a-0911d8e29723" className="cg-copy-ck-laplacian__summary-icon"><Light theme="outline" size="32" fill="currentColor" /></span><Typography shuku-edit-id="e-063e7cdf-0946-4da4-9428-6a3a07874cbd" as="h2" variant="h3" tone="accent">要点：</Typography><Typography shuku-edit-id="e-b051bf9f-5ca7-4aeb-a1a0-ba32a6fabee7" variant="body" tone="accent">Laplacian 是 x、y 方向二阶差分的和。梯度幅值看变化强度，Laplacian 看二阶变化。</Typography></footer>
  </ContentBlock>;
}
