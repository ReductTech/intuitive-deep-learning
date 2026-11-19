import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useState, type ReactNode } from 'react';
import { Light } from '@icon-park/react';
import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './LaplacianConstructionPage.css';

const buildingImage = moduleAssetUrl("xiandaijianzhu.webp");

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
    image.onload = () => { if (active) setResponses(buildResponses(image)); };
    image.src = buildingImage;
    return () => { active = false; };
  }, []);
  return responses;
}

function Matrix({ values, label, className = '' }: { values: number[][]; label: string; className?: string }) {
  return <div shuku-edit-id="e-eac73598-0393-4261-bade-81a07b37e81b" className={`ck-laplacian__matrix ${className}`} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }} role="img" aria-label={label}>
    {values.flatMap((row, y) => row.map((value, x) => <span shuku-edit-id="e-f928668b-910b-46ee-9793-d1e14f7e11be" className={value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : 'is-zero'} key={`${y}-${x}`}><MathFormulaStatic latex={String(value)} /></span>))}
  </div>;
}

function StepHeader({ number, children }: { number: string; children: ReactNode }) {
  return <header shuku-edit-id="e-191a2ecf-8f09-41c3-9910-9978dd602f87" className="ck-laplacian__step-header"><span shuku-edit-id="e-ba00558d-60ae-4b01-8e1e-aca05ea867e7" className="ck-laplacian__step-number"><Typography shuku-edit-id="e-403d774b-dbda-4598-a8d2-d24cb7d62018" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-aefb50d8-0aa1-46de-af65-0291690f2448" as="h2" variant="h3" tone="accent">{children}</Typography></header>;
}

function ImageCard({ src, alt, title }: { src?: string; alt: string; title: ReactNode }) {
  return <article shuku-edit-id="e-38ba4647-286d-4ae6-8610-9ff59cccf73a" className="ck-laplacian__image-card"><div shuku-edit-id="e-850bdbdf-755e-46a4-a81d-2054c98b1b54" className="ck-laplacian__image-wrap">{src ? <img shuku-edit-id="e-54192fbf-9f1c-4767-811b-777e892a8f0e" src={src} alt={alt} /> : <div shuku-edit-id="e-63bc1667-d95a-44d3-b54e-15394ba4a96e" className="ck-laplacian__loading" role="img" aria-label={`${alt}正在计算`} />}</div><div shuku-edit-id="e-d7a491d1-b91b-43d3-aeee-0a3ef402af70" className="ck-laplacian__image-caption"><Typography shuku-edit-id="e-03882194-d435-442c-b4aa-be73efdb855e" as="h3" variant="h3" tone="accent">{title}</Typography></div></article>;
}

export function LaplacianConstructionPage() {
  const responses = useResponses();
  return <ContentBlock shuku-edit-id="e-593b1473-89a1-436c-99bd-463be03d08e6" headingLevel={1} className="ck-laplacian" title="从二阶差分到 Laplacian" subtitle={<>把 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的二阶差分相加，就得到二维二阶差分核。</>}>
    <section shuku-edit-id="e-400bc264-1c2a-41ff-a723-5efa7a39a187" className="ck-laplacian__construction" aria-label="从一维二阶差分构造 Laplacian 卷积核">
      <article shuku-edit-id="e-b2600e51-3286-4ee5-b48c-32511d163944" className="ck-laplacian__step"><StepHeader number="1">一维二阶差分</StepHeader><div shuku-edit-id="e-3085c0e3-4a38-4b36-a481-5026477eae62" className="ck-laplacian__one-dimensional"><span shuku-edit-id="e-54f6e055-8fd7-4629-acf5-695e46e89281" className="ck-laplacian__bracket" aria-hidden="true">[</span><Matrix values={[[1, -2, 1]]} label="一维二阶差分核：一、负二、一" className="ck-laplacian__matrix--row" /><span shuku-edit-id="e-3176f067-d9e9-4621-904a-ed4d012eb8d9" className="ck-laplacian__bracket" aria-hidden="true">]</span></div></article>
      <span shuku-edit-id="e-007fbc36-e21f-4704-bd24-59b35035b83d" className="ck-laplacian__arrow" aria-hidden="true">→</span>
      <article shuku-edit-id="e-29ab5199-7f89-49a3-9a61-7437bfa67db5" className="ck-laplacian__step"><StepHeader number="2">放到两个方向</StepHeader><div shuku-edit-id="e-1f71d4ec-b63f-475e-a09e-ec44cfec0946" className="ck-laplacian__directions"><div shuku-edit-id="e-01dc677a-c6c2-4305-b143-053ea2553dd5"><Matrix values={SECOND_X} label="x 方向二阶差分核" /></div><div shuku-edit-id="e-edc22843-6407-4e2d-9d3a-9e528f58caa8"><Matrix values={SECOND_Y} label="y 方向二阶差分核" /></div></div></article>
      <span shuku-edit-id="e-2b11ce70-6c94-4c36-83a5-7bc0ab6b0210" className="ck-laplacian__arrow" aria-hidden="true">→</span>
      <article shuku-edit-id="e-306d90d1-c79c-489f-805d-c1b34294152e" className="ck-laplacian__step"><StepHeader number="3">相加得到 Laplacian</StepHeader><div shuku-edit-id="e-16f9776c-bac6-41bb-b877-248b45cd9b61" className="ck-laplacian__result"><Matrix values={LAPLACIAN} label="Laplacian 卷积核：中心负四，上下左右为一" /></div></article>
    </section>
    <section shuku-edit-id="e-36406d58-c123-48ca-b281-a92cf77357d1" className="ck-laplacian__images" aria-label="原图、梯度幅值与 Laplacian 响应的比较">
      <ImageCard src={responses?.input} alt="现代建筑的灰度原图" title="原图" />
      <ImageCard src={responses?.gradient} alt="同一建筑的梯度幅值图，亮处表示局部变化强" title={<>梯度幅值 <MathFormulaStatic latex={String.raw`|\nabla I|`} /></>} />
      <ImageCard src={responses?.laplacian} alt="同一建筑的带符号 Laplacian 响应，中灰表示零响应，明暗分别表示正负" title="Laplacian" />
    </section>
    <footer shuku-edit-id="e-a1d5401f-9290-4662-973e-cca9ce349ea7" className="ck-laplacian__summary"><span shuku-edit-id="e-a6c88f36-2d23-481b-8f73-72059aeb714d" className="ck-laplacian__summary-icon"><Light theme="outline" size="32" fill="currentColor" /></span><Typography shuku-edit-id="e-f4a1301b-7209-4042-a707-1174d4f27e98" as="h2" variant="h3" tone="accent">要点：</Typography><Typography shuku-edit-id="e-fba61b09-8499-48d6-b6f3-52eaa4473459" variant="body" tone="accent">Laplacian 是 x、y 方向二阶差分的和。梯度幅值看变化强度，Laplacian 看二阶变化。</Typography></footer>
  </ContentBlock>;
}
