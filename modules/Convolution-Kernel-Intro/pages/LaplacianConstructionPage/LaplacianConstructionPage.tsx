import { useEffect, useState, type ReactNode } from 'react';
import { Light } from '@icon-park/react';
import { ContentBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import buildingImage from '../../assets/xiandaijianzhu.png';
import './LaplacianConstructionPage.css';

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
  return <div className={`ck-laplacian__matrix ${className}`} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }} role="img" aria-label={label}>
    {values.flatMap((row, y) => row.map((value, x) => <span className={value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : 'is-zero'} key={`${y}-${x}`}><MathFormulaStatic latex={String(value)} /></span>))}
  </div>;
}

function StepHeader({ number, children }: { number: string; children: ReactNode }) {
  return <header className="ck-laplacian__step-header"><span className="ck-laplacian__step-number"><Typography as="span" variant="h3" tone="light">{number}</Typography></span><Typography as="h2" variant="h3" tone="accent">{children}</Typography></header>;
}

function ImageCard({ src, alt, title, note }: { src?: string; alt: string; title: ReactNode; note?: string }) {
  return <article className="ck-laplacian__image-card"><div className="ck-laplacian__image-wrap">{src ? <img src={src} alt={alt} /> : <div className="ck-laplacian__loading" role="img" aria-label={`${alt}正在计算`} />}</div><div className="ck-laplacian__image-caption"><Typography as="h3" variant="h3" tone="accent">{title}</Typography>{note && <Typography variant="bodySmall" tone="muted">{note}</Typography>}</div></article>;
}

export function LaplacianConstructionPage() {
  const responses = useResponses();
  return <ContentBlock headingLevel={1} className="ck-laplacian" title="从二阶差分到 Laplacian" subtitle={<>把 <MathFormulaStatic latex="x" />、<MathFormulaStatic latex="y" /> 两个方向的二阶差分相加，就得到二维二阶差分核。</>}>
    <section className="ck-laplacian__construction" aria-label="从一维二阶差分构造 Laplacian 卷积核">
      <article className="ck-laplacian__step"><StepHeader number="1">一维二阶差分</StepHeader><div className="ck-laplacian__one-dimensional"><span className="ck-laplacian__bracket" aria-hidden="true">[</span><Matrix values={[[1, -2, 1]]} label="一维二阶差分核：一、负二、一" className="ck-laplacian__matrix--row" /><span className="ck-laplacian__bracket" aria-hidden="true">]</span></div></article>
      <span className="ck-laplacian__arrow" aria-hidden="true">→</span>
      <article className="ck-laplacian__step"><StepHeader number="2">放到两个方向</StepHeader><div className="ck-laplacian__directions"><div><MathFormulaTerm latex="K_{xx}" tooltip="x 方向二阶差分：比较左右邻点与中心的变化。" /><MathFormulaStatic latex="=" /><Matrix values={SECOND_X} label="x 方向二阶差分核" /></div><div><MathFormulaTerm latex="K_{yy}" tooltip="y 方向二阶差分：比较上下邻点与中心的变化。" /><MathFormulaStatic latex="=" /><Matrix values={SECOND_Y} label="y 方向二阶差分核" /></div></div></article>
      <span className="ck-laplacian__arrow" aria-hidden="true">→</span>
      <article className="ck-laplacian__step"><StepHeader number="3">相加得到 Laplacian</StepHeader><div className="ck-laplacian__result"><div className="ck-laplacian__result-matrix"><MathFormulaTerm latex="K_L" tooltip="Laplacian 核：x、y 两个方向的二阶差分核逐格相加。" /><MathFormulaStatic latex="=" /><Matrix values={LAPLACIAN} label="Laplacian 卷积核：中心负四，上下左右为一" /></div><Typography variant="bodySmall" tone="danger" className="ck-laplacian__center-note">中心 −4 = (−2) + (−2)</Typography></div></article>
    </section>
    <section className="ck-laplacian__images" aria-label="原图、梯度幅值与 Laplacian 响应的比较">
      <ImageCard src={responses?.input} alt="现代建筑的灰度原图" title="原图" />
      <ImageCard src={responses?.gradient} alt="同一建筑的梯度幅值图，亮处表示局部变化强" title={<>梯度幅值 <MathFormulaStatic latex={String.raw`|\nabla I|`} /></>} note="一阶综合响应：看变化强度" />
      <ImageCard src={responses?.laplacian} alt="同一建筑的带符号 Laplacian 响应，中灰表示零响应，明暗分别表示正负" title="Laplacian" note="二阶综合响应：中灰为零，明暗表正负" />
    </section>
    <footer className="ck-laplacian__summary"><span className="ck-laplacian__summary-icon"><Light theme="outline" size="32" fill="currentColor" /></span><Typography as="h2" variant="h3" tone="accent">要点：</Typography><Typography variant="body" tone="accent">Laplacian 是 x、y 方向二阶差分的和。梯度幅值看变化强度，Laplacian 看二阶变化。</Typography></footer>
  </ContentBlock>;
}
