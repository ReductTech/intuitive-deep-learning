import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { creatorGuideAssetUrl } from '../../../../../creatorGuideAssets';
import { useEffect, useState, type ReactNode } from 'react';
import { Light } from '@icon-park/react';
import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './LaplacianConstructionPage.css';

const buildingImage = creatorGuideAssetUrl('444f8951-dd2e-42dc-94e5-c5a878618631', "workflow/convolution-course/xiandaijianzhu.webp");

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
  return <div shuku-edit-id="e-daf625ca-f937-4838-922e-da54583af881" className={`aipe-replay-cg-copy-ck-laplacian__matrix ${className}`} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }} role="img" aria-label={label}>
    {values.flatMap((row, y) => row.map((value, x) => <span shuku-edit-id="e-5c88ec54-cf4f-4972-87e2-0e70e3210875" className={value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : 'is-zero'} key={`${y}-${x}`}><MathFormulaStatic latex={String(value)} /></span>))}
  </div>;
}

function StepHeader({ number, children }: { number: string; children: ReactNode }) {
  return <header shuku-edit-id="e-750dfc61-9d3a-4bb0-87fd-ef2d1c866700" className="aipe-replay-cg-copy-ck-laplacian__step-header"><span shuku-edit-id="e-cc6eb6d9-4a5b-4a76-a890-406c561e769e" className="aipe-replay-cg-copy-ck-laplacian__step-number"><Typography shuku-edit-id="e-dfdddcff-38fa-4841-8889-acacce60c307" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-d6c06389-8f3e-4507-9471-096af9c6e495" as="h2" variant="h3" tone="accent">{children}</Typography></header>;
}

function ImageCard({ src, alt, title }: { src?: string; alt: string; title: ReactNode }) {
  return <article shuku-edit-id="e-112581de-6951-469b-b222-0073dc570f5a" className="aipe-replay-cg-copy-ck-laplacian__image-card"><div shuku-edit-id="e-e96110fc-56e0-4593-afa9-e81094a571d3" className="aipe-replay-cg-copy-ck-laplacian__image-wrap">{src ? <img shuku-edit-id="e-2ab903d6-afaf-498d-bdc2-cac009f02391" src={src} alt={alt} /> : <div shuku-edit-id="e-77a4a3f1-4d1c-402c-bf48-8f61b6f26b79" className="aipe-replay-cg-copy-ck-laplacian__loading" role="img" aria-label={`${alt}正在计算`} />}</div><div shuku-edit-id="e-02d2288a-e0b9-4f66-be8e-d340dbabb8a3" className="aipe-replay-cg-copy-ck-laplacian__image-caption"><Typography shuku-edit-id="e-4e981f65-c7bc-46e3-8e92-b1b935828def" as="h3" variant="h3" tone="accent">{title}</Typography></div></article>;
}

export function LaplacianConstructionPage() {
  const responses = useResponses();
  return <ContentBlock shuku-edit-id="e-815c8aed-8696-4637-abae-93391232fcf4" headingLevel={1} className="aipe-replay-cg-copy-ck-laplacian" title="从二阶差分到 Laplacian" subtitle={<>把 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的二阶差分相加，就得到二维二阶差分核。</>}>
    <section shuku-edit-id="e-fcbf8eb3-c4f8-4f9d-aebb-ec2ca0f34bf4" className="aipe-replay-cg-copy-ck-laplacian__construction" aria-label="从一维二阶差分构造 Laplacian 卷积核">
      <article shuku-edit-id="e-c2ab21fc-dfd5-45c6-ba01-f36189154113" className="aipe-replay-cg-copy-ck-laplacian__step"><StepHeader number="1">一维二阶差分</StepHeader><div shuku-edit-id="e-3e300aa7-b558-4f11-9c19-1a8b230e6f4e" className="aipe-replay-cg-copy-ck-laplacian__one-dimensional"><span shuku-edit-id="e-3f4f2dd8-3a4a-4d6b-a9b6-1e747ce77217" className="aipe-replay-cg-copy-ck-laplacian__bracket" aria-hidden="true">[</span><Matrix values={[[1, -2, 1]]} label="一维二阶差分核：一、负二、一" className="aipe-replay-cg-copy-ck-laplacian__matrix--row" /><span shuku-edit-id="e-e9a34461-b4d5-4809-8d6a-f934667750e6" className="aipe-replay-cg-copy-ck-laplacian__bracket" aria-hidden="true">]</span></div></article>
      <span shuku-edit-id="e-4c6dac31-58d9-46a1-b2cc-367975b08990" className="aipe-replay-cg-copy-ck-laplacian__arrow" aria-hidden="true">→</span>
      <article shuku-edit-id="e-c1e2fdc5-245d-41e9-93fd-bc2efee2a9aa" className="aipe-replay-cg-copy-ck-laplacian__step"><StepHeader number="2">放到两个方向</StepHeader><div shuku-edit-id="e-506f07ed-e927-4938-8e08-d5168d30fb54" className="aipe-replay-cg-copy-ck-laplacian__directions"><div shuku-edit-id="e-234e5778-03e8-4bce-8b25-6999e7380fd2"><Matrix values={SECOND_X} label="x 方向二阶差分核" /></div><div shuku-edit-id="e-153245f7-b1ef-4ada-a343-a32a5cca106c"><Matrix values={SECOND_Y} label="y 方向二阶差分核" /></div></div></article>
      <span shuku-edit-id="e-77d396b2-ba85-4232-a020-fbee37b10026" className="aipe-replay-cg-copy-ck-laplacian__arrow" aria-hidden="true">→</span>
      <article shuku-edit-id="e-0c180f7b-1c43-4320-93a6-ef9ffa435c8a" className="aipe-replay-cg-copy-ck-laplacian__step"><StepHeader number="3">相加得到 Laplacian</StepHeader><div shuku-edit-id="e-f131ed63-c375-4bca-9a54-364def5268d0" className="aipe-replay-cg-copy-ck-laplacian__result"><Matrix values={LAPLACIAN} label="Laplacian 卷积核：中心负四，上下左右为一" /></div></article>
    </section>
    <section shuku-edit-id="e-3be3042a-7def-41f7-b289-c0b17ffcb4d2" className="aipe-replay-cg-copy-ck-laplacian__images" aria-label="原图、梯度幅值与 Laplacian 响应的比较">
      <ImageCard src={responses?.input} alt="现代建筑的灰度原图" title="原图" />
      <ImageCard src={responses?.gradient} alt="同一建筑的梯度幅值图，亮处表示局部变化强" title={<>梯度幅值 <MathFormulaStatic latex={String.raw`|\nabla I|`} /></>} />
      <ImageCard src={responses?.laplacian} alt="同一建筑的带符号 Laplacian 响应，中灰表示零响应，明暗分别表示正负" title="Laplacian" />
    </section>
    <footer shuku-edit-id="e-d94d16f7-c5b6-445c-a970-4255ec730ebf" className="aipe-replay-cg-copy-ck-laplacian__summary"><span shuku-edit-id="e-97542c78-f343-4bd5-8430-bb1d78aae358" className="aipe-replay-cg-copy-ck-laplacian__summary-icon"><Light theme="outline" size="32" fill="currentColor" /></span><Typography shuku-edit-id="e-8d4ec883-8454-4a4d-a2a8-278bec9d811f" as="h2" variant="h3" tone="accent">要点：</Typography><Typography shuku-edit-id="e-7c0a6315-67ee-467d-a557-b6b2a315117b" variant="body" tone="accent">Laplacian 是 x、y 方向二阶差分的和。梯度幅值看变化强度，Laplacian 看二阶变化。</Typography></footer>
  </ContentBlock>;
}
