import xiandaijianzhuAsset0 from '../../../../../assets/workflow/convolution-course/xiandaijianzhu.jpg';
import { useEffect, useState, type ReactNode } from 'react';
import { Light } from '@icon-park/react';
import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './LaplacianConstructionPage.css';

const buildingImage = xiandaijianzhuAsset0;

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
  return <div shuku-edit-id="e-e258babc-63de-405d-a41b-1729021d3fca" className={`cg-copy-ck-laplacian__matrix ${className}`} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }} role="img" aria-label={label}>
    {values.flatMap((row, y) => row.map((value, x) => <span shuku-edit-id="e-fcaa702a-0582-4721-b4c8-610ee5b85708" className={value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : 'is-zero'} key={`${y}-${x}`}><MathFormulaStatic latex={String(value)} /></span>))}
  </div>;
}

function StepHeader({ number, children }: { number: string; children: ReactNode }) {
  return <header shuku-edit-id="e-6d38d152-afb3-4809-84a6-5fd61b83b6cd" className="cg-copy-ck-laplacian__step-header"><span shuku-edit-id="e-f6ce9b87-97e3-4d00-9824-d4ffb7a0b3a6" className="cg-copy-ck-laplacian__step-number"><Typography shuku-edit-id="e-2e16ad70-42ed-4875-b73e-080a9623a115" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-b66a3d54-bf7c-4ae5-aa33-d31966b1085b" as="h2" variant="h3" tone="accent">{children}</Typography></header>;
}

function ImageCard({ src, alt, title }: { src?: string; alt: string; title: ReactNode }) {
  return <article shuku-edit-id="e-ede39eed-b895-4edd-bf2b-4817bc32d89a" className="cg-copy-ck-laplacian__image-card"><div shuku-edit-id="e-78d5d14c-4a86-4924-ba0c-2efcb4b10c42" className="cg-copy-ck-laplacian__image-wrap">{src ? <img shuku-edit-id="e-156df2c8-aa21-439f-b830-b1054b5b72b7" src={src} alt={alt} /> : <div shuku-edit-id="e-dc4bbcfd-ccce-4846-84ed-170d9284b45f" className="cg-copy-ck-laplacian__loading" role="img" aria-label={`${alt}正在计算`} />}</div><div shuku-edit-id="e-87a355d7-a0f0-4b52-a474-d65530d66b81" className="cg-copy-ck-laplacian__image-caption"><Typography shuku-edit-id="e-14d161d9-ef41-4a2c-90f1-3f8f9b687049" as="h3" variant="h3" tone="accent">{title}</Typography></div></article>;
}

export function LaplacianConstructionPage() {
  const responses = useResponses();
  return <ContentBlock shuku-edit-id="e-dbbfa4e8-85a4-40a2-98a9-d9bf413fc4f9" headingLevel={1} className="cg-copy-ck-laplacian" title="从二阶差分到 Laplacian" subtitle={<>把 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的二阶差分相加，就得到二维二阶差分核。</>}>
    <section shuku-edit-id="e-35ae1119-e10c-4d8b-9c0c-ec50e0e4a732" className="cg-copy-ck-laplacian__construction" aria-label="从一维二阶差分构造 Laplacian 卷积核">
      <article shuku-edit-id="e-e784fcf2-93a2-4065-9142-b6924b4fcf4e" className="cg-copy-ck-laplacian__step"><StepHeader number="1">一维二阶差分</StepHeader><div shuku-edit-id="e-35d2fbf6-8edd-474d-b2b1-f49837193cdc" className="cg-copy-ck-laplacian__one-dimensional"><span shuku-edit-id="e-8f5b82be-a858-491b-83e2-e11fe3f7fdd7" className="cg-copy-ck-laplacian__bracket" aria-hidden="true">[</span><Matrix values={[[1, -2, 1]]} label="一维二阶差分核：一、负二、一" className="cg-copy-ck-laplacian__matrix--row" /><span shuku-edit-id="e-7bd63f71-5fe6-4d3f-a9e0-b10dc8e7d17f" className="cg-copy-ck-laplacian__bracket" aria-hidden="true">]</span></div></article>
      <span shuku-edit-id="e-36a7dd82-0801-479b-9433-149d572aadac" className="cg-copy-ck-laplacian__arrow" aria-hidden="true">→</span>
      <article shuku-edit-id="e-3e0f0e80-a95f-482f-bdbd-e32b1a338e33" className="cg-copy-ck-laplacian__step"><StepHeader number="2">放到两个方向</StepHeader><div shuku-edit-id="e-d82559b2-0eb4-45b8-a9d7-c4b7f2684818" className="cg-copy-ck-laplacian__directions"><div shuku-edit-id="e-318ef125-f1ba-4cfd-ac20-7d543d1541a5"><Matrix values={SECOND_X} label="x 方向二阶差分核" /></div><div shuku-edit-id="e-b3b8779e-4a71-4247-a050-604c6d174e75"><Matrix values={SECOND_Y} label="y 方向二阶差分核" /></div></div></article>
      <span shuku-edit-id="e-32adba73-eee6-4c74-88ad-d8d388a5280f" className="cg-copy-ck-laplacian__arrow" aria-hidden="true">→</span>
      <article shuku-edit-id="e-85220b53-7483-45cf-944d-09c280550a35" className="cg-copy-ck-laplacian__step"><StepHeader number="3">相加得到 Laplacian</StepHeader><div shuku-edit-id="e-213f341f-25e2-445d-af88-77c5164dbac1" className="cg-copy-ck-laplacian__result"><Matrix values={LAPLACIAN} label="Laplacian 卷积核：中心负四，上下左右为一" /></div></article>
    </section>
    <section shuku-edit-id="e-639e3e1e-90d3-45af-8f65-48905897683f" className="cg-copy-ck-laplacian__images" aria-label="原图、梯度幅值与 Laplacian 响应的比较">
      <ImageCard src={responses?.input} alt="现代建筑的灰度原图" title="原图" />
      <ImageCard src={responses?.gradient} alt="同一建筑的梯度幅值图，亮处表示局部变化强" title={<>梯度幅值 <MathFormulaStatic latex={String.raw`|\nabla I|`} /></>} />
      <ImageCard src={responses?.laplacian} alt="同一建筑的带符号 Laplacian 响应，中灰表示零响应，明暗分别表示正负" title="Laplacian" />
    </section>
    <footer shuku-edit-id="e-77041da3-ef90-446a-ac0b-ec904fb8dfde" className="cg-copy-ck-laplacian__summary"><span shuku-edit-id="e-17a8fd23-12f7-4b1a-a8c3-06478ef653ed" className="cg-copy-ck-laplacian__summary-icon"><Light theme="outline" size="32" fill="currentColor" /></span><Typography shuku-edit-id="e-d6ba98df-d67f-4d1c-b6f3-96d739009376" as="h2" variant="h3" tone="accent">要点：</Typography><Typography shuku-edit-id="e-68567777-13a2-451f-8846-08f4e6b5b04d" variant="body" tone="accent">Laplacian 是 x、y 方向二阶差分的和。梯度幅值看变化强度，Laplacian 看二阶变化。</Typography></footer>
  </ContentBlock>;
}
