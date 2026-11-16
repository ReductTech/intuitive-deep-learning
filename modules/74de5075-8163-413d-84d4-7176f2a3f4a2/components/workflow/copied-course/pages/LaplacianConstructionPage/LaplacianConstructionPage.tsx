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
  return <div shuku-edit-id="e-cbe08a98-6073-4cd6-b670-f36407a1ffed" className={`cg-copy-ck-laplacian__matrix ${className}`} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }} role="img" aria-label={label}>
    {values.flatMap((row, y) => row.map((value, x) => <span shuku-edit-id="e-e2542bd1-42a8-4a3f-8331-7877a59d48f9" className={value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : 'is-zero'} key={`${y}-${x}`}><MathFormulaStatic latex={String(value)} /></span>))}
  </div>;
}

function StepHeader({ number, children }: { number: string; children: ReactNode }) {
  return <header shuku-edit-id="e-da06f33e-c871-4b9f-a39a-03228a1f51ac" className="cg-copy-ck-laplacian__step-header"><span shuku-edit-id="e-4a87811c-670f-4199-8c91-342178454274" className="cg-copy-ck-laplacian__step-number"><Typography shuku-edit-id="e-5d0ef200-f783-4ded-beaa-a835874bf8d9" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-7e2beab6-81fb-48ff-9a93-98f396bbba46" as="h2" variant="h3" tone="accent">{children}</Typography></header>;
}

function ImageCard({ src, alt, title }: { src?: string; alt: string; title: ReactNode }) {
  return <article shuku-edit-id="e-5550836f-ab8c-4e93-a863-054261fbf265" className="cg-copy-ck-laplacian__image-card"><div shuku-edit-id="e-65993e5a-d2fe-403e-a454-ba40497cd19c" className="cg-copy-ck-laplacian__image-wrap">{src ? <img shuku-edit-id="e-ba7ebb4e-4994-4eea-a1c4-4d03f0a7e4cd" src={src} alt={alt} /> : <div shuku-edit-id="e-54f03c49-3b3e-4c6b-b81d-c3aa76a38f38" className="cg-copy-ck-laplacian__loading" role="img" aria-label={`${alt}正在计算`} />}</div><div shuku-edit-id="e-c31d513c-e5bc-435a-9951-5d4f1558b19a" className="cg-copy-ck-laplacian__image-caption"><Typography shuku-edit-id="e-34635e0e-44c9-4816-bf02-e731b4fbdc86" as="h3" variant="h3" tone="accent">{title}</Typography></div></article>;
}

export function LaplacianConstructionPage() {
  const responses = useResponses();
  return <ContentBlock shuku-edit-id="e-f43ac8bf-f27a-4e20-a8d3-d34c54b5b4b3" headingLevel={1} className="cg-copy-ck-laplacian" title="从二阶差分到 Laplacian" subtitle={<>把 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的二阶差分相加，就得到二维二阶差分核。</>}>
    <section shuku-edit-id="e-abc7cd75-b5d6-40fb-a029-3b9d15fa237c" className="cg-copy-ck-laplacian__construction" aria-label="从一维二阶差分构造 Laplacian 卷积核">
      <article shuku-edit-id="e-da9dcea8-dbdf-4967-830f-ba9500f383a0" className="cg-copy-ck-laplacian__step"><StepHeader number="1">一维二阶差分</StepHeader><div shuku-edit-id="e-9817f673-7dae-4ffc-87ec-000d56693196" className="cg-copy-ck-laplacian__one-dimensional"><span shuku-edit-id="e-e5415e81-67ec-437b-be58-422a65e7be00" className="cg-copy-ck-laplacian__bracket" aria-hidden="true">[</span><Matrix values={[[1, -2, 1]]} label="一维二阶差分核：一、负二、一" className="cg-copy-ck-laplacian__matrix--row" /><span shuku-edit-id="e-5ba8066c-c954-4b19-ba0e-97ac4da0d276" className="cg-copy-ck-laplacian__bracket" aria-hidden="true">]</span></div></article>
      <span shuku-edit-id="e-72e37a9c-62dd-48c8-a53a-53293940b878" className="cg-copy-ck-laplacian__arrow" aria-hidden="true">→</span>
      <article shuku-edit-id="e-885b3d0c-a495-487d-a508-01d519d5485c" className="cg-copy-ck-laplacian__step"><StepHeader number="2">放到两个方向</StepHeader><div shuku-edit-id="e-570b498d-dc5a-4133-95d0-491d9da941d4" className="cg-copy-ck-laplacian__directions"><div shuku-edit-id="e-b96b7103-f9fb-43b2-850b-044fd8fe3367"><Matrix values={SECOND_X} label="x 方向二阶差分核" /></div><div shuku-edit-id="e-e56723cf-5efb-450a-ae40-7aa968d2abf9"><Matrix values={SECOND_Y} label="y 方向二阶差分核" /></div></div></article>
      <span shuku-edit-id="e-986813b7-d33d-4b70-8088-036f090d7efd" className="cg-copy-ck-laplacian__arrow" aria-hidden="true">→</span>
      <article shuku-edit-id="e-f9e122e4-2d17-41d4-bbca-545a2598e46d" className="cg-copy-ck-laplacian__step"><StepHeader number="3">相加得到 Laplacian</StepHeader><div shuku-edit-id="e-2ad59143-c599-49c7-a2ff-8e6cafeb10e6" className="cg-copy-ck-laplacian__result"><Matrix values={LAPLACIAN} label="Laplacian 卷积核：中心负四，上下左右为一" /></div></article>
    </section>
    <section shuku-edit-id="e-47b134ae-2052-492f-8a65-c42a6d7eace8" className="cg-copy-ck-laplacian__images" aria-label="原图、梯度幅值与 Laplacian 响应的比较">
      <ImageCard src={responses?.input} alt="现代建筑的灰度原图" title="原图" />
      <ImageCard src={responses?.gradient} alt="同一建筑的梯度幅值图，亮处表示局部变化强" title={<>梯度幅值 <MathFormulaStatic latex={String.raw`|\nabla I|`} /></>} />
      <ImageCard src={responses?.laplacian} alt="同一建筑的带符号 Laplacian 响应，中灰表示零响应，明暗分别表示正负" title="Laplacian" />
    </section>
    <footer shuku-edit-id="e-e3ca5227-8bff-4d65-910e-e2cd95282079" className="cg-copy-ck-laplacian__summary"><span shuku-edit-id="e-32a6340b-7f9c-4823-9236-1858cf91e04a" className="cg-copy-ck-laplacian__summary-icon"><Light theme="outline" size="32" fill="currentColor" /></span><Typography shuku-edit-id="e-713b199a-9d14-48ec-8b14-670bd71c3b45" as="h2" variant="h3" tone="accent">要点：</Typography><Typography shuku-edit-id="e-5d16c709-eedf-4cc7-95a3-012202ca547c" variant="body" tone="accent">Laplacian 是 x、y 方向二阶差分的和。梯度幅值看变化强度，Laplacian 看二阶变化。</Typography></footer>
  </ContentBlock>;
}
