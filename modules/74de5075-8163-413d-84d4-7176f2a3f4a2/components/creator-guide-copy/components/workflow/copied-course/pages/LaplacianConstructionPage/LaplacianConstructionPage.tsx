import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { creatorGuideAssetUrl } from '../../../../../creatorGuideAssets';
import { useEffect, useState, type ReactNode } from 'react';
import { Light } from '@icon-park/react';
import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './LaplacianConstructionPage.css';

const buildingImage = creatorGuideAssetUrl('444f8951-dd2e-42dc-94e5-c5a878618631', 'workflow/convolution-course/xiandaijianzhu.jpg');

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
  return <div shuku-edit-id="e-826894bc-e276-4d5b-980a-0946cd9fdc77" className={`aipe-replay-cg-copy-ck-laplacian__matrix ${className}`} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }} role="img" aria-label={label}>
    {values.flatMap((row, y) => row.map((value, x) => <span shuku-edit-id="e-18efc2eb-4024-4dbd-80be-575b9ed4824b" className={value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : 'is-zero'} key={`${y}-${x}`}><MathFormulaStatic latex={String(value)} /></span>))}
  </div>;
}

function StepHeader({ number, children }: { number: string; children: ReactNode }) {
  return <header shuku-edit-id="e-b639811c-c673-4074-8b7f-767aea575c87" className="aipe-replay-cg-copy-ck-laplacian__step-header"><span shuku-edit-id="e-72a0e0d2-a926-4e00-a0e6-e7acb50e734e" className="aipe-replay-cg-copy-ck-laplacian__step-number"><Typography shuku-edit-id="e-28543445-8e08-4410-8d7e-fe3d151f87f8" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-34628fb7-7caf-4bfb-a32d-722ec84d2bae" as="h2" variant="h3" tone="accent">{children}</Typography></header>;
}

function ImageCard({ src, alt, title }: { src?: string; alt: string; title: ReactNode }) {
  return <article shuku-edit-id="e-71d95b33-9bc8-4b3b-8577-94d11429e198" className="aipe-replay-cg-copy-ck-laplacian__image-card"><div shuku-edit-id="e-449d962c-0b3f-4c21-96e5-e888d5617369" className="aipe-replay-cg-copy-ck-laplacian__image-wrap">{src ? <img shuku-edit-id="e-b5f64ae7-52dc-42cd-be14-75a7232c0f2c" src={src} alt={alt} /> : <div shuku-edit-id="e-ad25aa1c-4ee8-485c-b94c-aa2ec2cd5406" className="aipe-replay-cg-copy-ck-laplacian__loading" role="img" aria-label={`${alt}正在计算`} />}</div><div shuku-edit-id="e-8102cd82-fb0d-4fae-b435-c26a71f31cf2" className="aipe-replay-cg-copy-ck-laplacian__image-caption"><Typography shuku-edit-id="e-dc51be2e-dcc5-425f-ba7c-84c3b9572e74" as="h3" variant="h3" tone="accent">{title}</Typography></div></article>;
}

export function LaplacianConstructionPage() {
  const responses = useResponses();
  return <ContentBlock shuku-edit-id="e-6ca2c1ef-1af0-44e1-b8a5-7b54df7eae76" headingLevel={1} className="aipe-replay-cg-copy-ck-laplacian" title="从二阶差分到 Laplacian" subtitle={<>把 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的二阶差分相加，就得到二维二阶差分核。</>}>
    <section shuku-edit-id="e-32efb670-8d73-4fc6-861e-97577a004eaf" className="aipe-replay-cg-copy-ck-laplacian__construction" aria-label="从一维二阶差分构造 Laplacian 卷积核">
      <article shuku-edit-id="e-66d26b86-3d92-4b2f-a401-61845a999c49" className="aipe-replay-cg-copy-ck-laplacian__step"><StepHeader number="1">一维二阶差分</StepHeader><div shuku-edit-id="e-7804c0a1-2c6f-4b41-ac6c-360b8a7bb611" className="aipe-replay-cg-copy-ck-laplacian__one-dimensional"><span shuku-edit-id="e-62602c1f-3760-49b0-8600-75b9f87e18d2" className="aipe-replay-cg-copy-ck-laplacian__bracket" aria-hidden="true">[</span><Matrix values={[[1, -2, 1]]} label="一维二阶差分核：一、负二、一" className="aipe-replay-cg-copy-ck-laplacian__matrix--row" /><span shuku-edit-id="e-76208618-fe4b-4ca9-9e76-f464e2bbf6bc" className="aipe-replay-cg-copy-ck-laplacian__bracket" aria-hidden="true">]</span></div></article>
      <span shuku-edit-id="e-a11bbcfa-6c6b-44e0-8c93-6bd545d69e4c" className="aipe-replay-cg-copy-ck-laplacian__arrow" aria-hidden="true">→</span>
      <article shuku-edit-id="e-8b08f784-b4d8-40dc-8173-589592f93c38" className="aipe-replay-cg-copy-ck-laplacian__step"><StepHeader number="2">放到两个方向</StepHeader><div shuku-edit-id="e-f474a6f6-9da8-4d73-99d8-c5ed7553b2b1" className="aipe-replay-cg-copy-ck-laplacian__directions"><div shuku-edit-id="e-b13c9637-a038-4567-9db6-c511a35438ec"><Matrix values={SECOND_X} label="x 方向二阶差分核" /></div><div shuku-edit-id="e-ddb2b746-5b73-4590-a83d-5137eb29c9fa"><Matrix values={SECOND_Y} label="y 方向二阶差分核" /></div></div></article>
      <span shuku-edit-id="e-5cd5aebe-2795-4b61-b9bf-b1196b0ec5ce" className="aipe-replay-cg-copy-ck-laplacian__arrow" aria-hidden="true">→</span>
      <article shuku-edit-id="e-06420391-3d2b-4184-a1a1-b806df7d9969" className="aipe-replay-cg-copy-ck-laplacian__step"><StepHeader number="3">相加得到 Laplacian</StepHeader><div shuku-edit-id="e-2a06bf1e-ff87-4b83-8a44-352751f38060" className="aipe-replay-cg-copy-ck-laplacian__result"><Matrix values={LAPLACIAN} label="Laplacian 卷积核：中心负四，上下左右为一" /></div></article>
    </section>
    <section shuku-edit-id="e-97988085-e70e-40a9-a6d6-0a0f69a3c787" className="aipe-replay-cg-copy-ck-laplacian__images" aria-label="原图、梯度幅值与 Laplacian 响应的比较">
      <ImageCard src={responses?.input} alt="现代建筑的灰度原图" title="原图" />
      <ImageCard src={responses?.gradient} alt="同一建筑的梯度幅值图，亮处表示局部变化强" title={<>梯度幅值 <MathFormulaStatic latex={String.raw`|\nabla I|`} /></>} />
      <ImageCard src={responses?.laplacian} alt="同一建筑的带符号 Laplacian 响应，中灰表示零响应，明暗分别表示正负" title="Laplacian" />
    </section>
    <footer shuku-edit-id="e-325a3833-db72-4703-be42-ccda5ce62225" className="aipe-replay-cg-copy-ck-laplacian__summary"><span shuku-edit-id="e-eb50b334-5ddd-46ab-a4ba-bc9c9f40aced" className="aipe-replay-cg-copy-ck-laplacian__summary-icon"><Light theme="outline" size="32" fill="currentColor" /></span><Typography shuku-edit-id="e-24b8d68b-4e08-44cf-8b73-29331002fe09" as="h2" variant="h3" tone="accent">要点：</Typography><Typography shuku-edit-id="e-d97f689e-59be-4d7d-b898-d282b117d42b" variant="body" tone="accent">Laplacian 是 x、y 方向二阶差分的和。梯度幅值看变化强度，Laplacian 看二阶变化。</Typography></footer>
  </ContentBlock>;
}
