import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Down, Refresh, Up, UploadPicture } from '@icon-park/react';
import { ContentBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import buildingImage from '../../assets/xiandaijianzhu.png';
import bridgeImage from '../../assets/xielaqiao.png';
import mountainImage from '../../assets/caiermate.png';
import zebraImage from '../../assets/zebra.png';
import pineappleImage from '../../assets/pineapple.png';
import cityImage from '../../assets/be_city.png';
import './CommonKernelsPage.css';

type Matrix3 = readonly [readonly [number, number, number], readonly [number, number, number], readonly [number, number, number]];
type ViewMode = 'gray' | 'edge' | 'signed';
interface KernelDefinition { name: string; matrix: Matrix3; divisor: number; mode: ViewMode; note: string; }
interface ImageOption { name: string; src: string; }

const IMAGE_OPTIONS: ImageOption[] = [
  { name: '现代建筑', src: buildingImage },
  { name: '斜拉桥', src: bridgeImage },
  { name: '山间建筑', src: mountainImage },
  { name: '斑马', src: zebraImage },
  { name: '菠萝', src: pineappleImage },
  { name: '城市街区', src: cityImage },
];

const KERNELS: KernelDefinition[] = [
  { name: '均值模糊', matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], divisor: 9, mode: 'gray', note: '九个位置等权平均' },
  { name: 'Gaussian 模糊', matrix: [[1, 2, 1], [2, 4, 2], [1, 2, 1]], divisor: 16, mode: 'gray', note: '中心权重更高' },
  { name: '锐化', matrix: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], divisor: 1, mode: 'gray', note: '增强局部对比' },
  { name: '垂直边缘', matrix: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], divisor: 1, mode: 'edge', note: 'Prewitt X：突出竖直边缘' },
  { name: 'Sobel X', matrix: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], divisor: 1, mode: 'edge', note: '突出竖直边缘' },
  { name: 'Sobel Y', matrix: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]], divisor: 1, mode: 'edge', note: '突出水平边缘' },
  { name: '水平边缘', matrix: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]], divisor: 1, mode: 'edge', note: 'Prewitt Y：突出水平边缘' },
  { name: 'Laplacian', matrix: [[0, 1, 0], [1, -4, 1], [0, 1, 0]], divisor: 1, mode: 'signed', note: '二阶变化的带符号响应' },
];

const DEFAULT_KERNEL_INDEX = 4;
const CANVAS_SIZE = 512;

function wrap(index: number, length: number) { return (index + length) % length; }

function computeConvolution(image: HTMLImageElement, kernel: KernelDefinition) {
  const source = document.createElement('canvas');
  source.width = CANVAS_SIZE;
  source.height = CANVAS_SIZE;
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  if (!sourceContext) return '';
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - side) / 2;
  const sourceY = (image.naturalHeight - side) / 2;
  sourceContext.drawImage(image, sourceX, sourceY, side, side, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const rgba = sourceContext.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;
  const gray = new Float32Array(CANVAS_SIZE * CANVAS_SIZE);
  for (let index = 0; index < gray.length; index += 1) {
    const offset = index * 4;
    gray[index] = (rgba[offset] * .299 + rgba[offset + 1] * .587 + rgba[offset + 2] * .114) / 255;
  }
  const output = document.createElement('canvas');
  output.width = CANVAS_SIZE;
  output.height = CANVAS_SIZE;
  const outputContext = output.getContext('2d');
  if (!outputContext) return '';
  const pixels = outputContext.createImageData(CANVAS_SIZE, CANVAS_SIZE);
  const positiveWeight = kernel.matrix.flat().reduce((sum, weight) => sum + Math.max(0, weight), 0);
  for (let y = 0; y < CANVAS_SIZE; y += 1) {
    for (let x = 0; x < CANVAS_SIZE; x += 1) {
      let response = 0;
      for (let ky = -1; ky <= 1; ky += 1) {
        for (let kx = -1; kx <= 1; kx += 1) {
          const sampleX = Math.max(0, Math.min(CANVAS_SIZE - 1, x + kx));
          const sampleY = Math.max(0, Math.min(CANVAS_SIZE - 1, y + ky));
          response += gray[sampleY * CANVAS_SIZE + sampleX] * kernel.matrix[ky + 1][kx + 1];
        }
      }
      const value = kernel.mode === 'gray'
        ? response / kernel.divisor
        : kernel.mode === 'signed'
          ? .5 + response * 1.2 / positiveWeight
          : Math.abs(response) * 2.4 / positiveWeight;
      const shade = Math.round(Math.max(0, Math.min(1, value)) * 255);
      const offset = (y * CANVAS_SIZE + x) * 4;
      pixels.data.set([shade, shade, shade, 255], offset);
    }
  }
  outputContext.putImageData(pixels, 0, 0);
  return output.toDataURL('image/png');
}

function Matrix({ values, mini = false }: { values: Matrix3; mini?: boolean }) {
  return <div className={`ck-common__matrix ${mini ? 'is-mini' : ''}`} role="img" aria-label={values.map((row) => row.join('，')).join('；')}>
    {values.flatMap((row, y) => row.map((value, x) => <span key={`${y}-${x}`} className={value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : 'is-zero'}><MathFormulaStatic latex={String(value)} /></span>))}
  </div>;
}

function StageHeader({ number, title }: { number: string; title: string }) {
  return <header className="ck-common__stage-header"><span className="ck-common__stage-number"><Typography as="span" variant="h3" tone="light">{number}</Typography></span><Typography as="h2" variant="h3" tone="accent">{title}</Typography></header>;
}

export function CommonKernelsPage() {
  const [imageIndex, setImageIndex] = useState(0);
  const [imageDirection, setImageDirection] = useState<'up' | 'down'>('down');
  const [kernelIndex, setKernelIndex] = useState(DEFAULT_KERNEL_INDEX);
  const [customImage, setCustomImage] = useState<ImageOption | null>(null);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const uploadRef = useRef<HTMLInputElement>(null);
  const imageSelectorRef = useRef<HTMLDivElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const images = customImage ? [...IMAGE_OPTIONS, customImage] : IMAGE_OPTIONS;
  const selectedImage = images[imageIndex] ?? IMAGE_OPTIONS[0];
  const selectedKernel = KERNELS[kernelIndex];
  const previousImage = images[wrap(imageIndex - 1, images.length)];
  const nextImage = images[wrap(imageIndex + 1, images.length)];
  const previousKernel = KERNELS[wrap(kernelIndex - 1, KERNELS.length)];
  const nextKernel = KERNELS[wrap(kernelIndex + 1, KERNELS.length)];

  useEffect(() => () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); }, []);
  useEffect(() => {
    const selector = imageSelectorRef.current;
    if (!selector) return;
    let wheelDelta = 0;
    let lastSwitch = 0;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const now = performance.now();
      if (now - lastSwitch < 280) return;
      wheelDelta += event.deltaY;
      if (Math.abs(wheelDelta) < 40) return;
      const direction = Math.sign(wheelDelta);
      wheelDelta = 0;
      lastSwitch = now;
      setImageDirection(direction > 0 ? 'down' : 'up');
      setImageIndex((current) => wrap(current + direction, images.length));
    };
    selector.addEventListener('wheel', handleWheel, { passive: false });
    return () => selector.removeEventListener('wheel', handleWheel);
  }, [images.length]);
  useEffect(() => {
    let active = true;
    setResult('');
    const image = new Image();
    image.onload = () => { if (active) { setResult(computeConvolution(image, selectedKernel)); setError(''); } };
    image.onerror = () => { if (active) setError('图像无法读取，请选择另一张。'); };
    image.src = selectedImage.src;
    return () => { active = false; };
  }, [selectedImage.src, selectedKernel]);

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('请选择图片文件。'); return; }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setCustomImage({ name: file.name, src: url });
    setImageIndex(IMAGE_OPTIONS.length);
    setError('');
  }

  function reset() {
    setImageIndex(0);
    setImageDirection('down');
    setKernelIndex(DEFAULT_KERNEL_INDEX);
    setCustomImage(null);
    setError('');
    if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; }
  }

  return <ContentBlock headingLevel={1} className="ck-common" title="卷积核工作台" subtitle="选择图像与卷积核，实时观察不同算子产生的真实卷积输出。">
    <button className="ck-common__reset" type="button" onClick={reset}><Refresh theme="outline" size="22" /><Typography as="span" variant="bodySmall" tone="inherit">重置</Typography></button>
    <div className="ck-common__workspace">
      <section className="ck-common__stage ck-common__stage--images" aria-label="选择图像"><StageHeader number="1" title="选择图像" />
        <div className="ck-common__image-selector" ref={imageSelectorRef}>
          <button className="ck-common__arrow-button" type="button" aria-label="上一张图像" onClick={() => { setImageDirection('up'); setImageIndex(wrap(imageIndex - 1, images.length)); }}><Up theme="outline" size="30" /></button>
          <div className="ck-common__image-stack"><img className="ck-common__image-ghost is-before" src={previousImage.src} alt="" aria-hidden="true" /><div key={selectedImage.src} className={`ck-common__active-image is-from-${imageDirection}`}><img src={selectedImage.src} alt={`${selectedImage.name}输入图像`} /><Typography as="span" variant="bodySmall" tone="light">{selectedImage.name}</Typography></div><img className="ck-common__image-ghost is-after" src={nextImage.src} alt="" aria-hidden="true" /></div>
          <button className="ck-common__arrow-button" type="button" aria-label="下一张图像" onClick={() => { setImageDirection('down'); setImageIndex(wrap(imageIndex + 1, images.length)); }}><Down theme="outline" size="30" /></button>
        </div>
        <input ref={uploadRef} className="ck-common__file-input" type="file" accept="image/*" onChange={handleUpload} aria-label="上传图像" />
        <button className="ck-common__upload" type="button" onClick={() => uploadRef.current?.click()}><UploadPicture theme="outline" size="23" /><Typography as="span" variant="bodySmall" tone="inherit">上传图片</Typography></button>
      </section>
      <section className="ck-common__stage ck-common__stage--kernels" aria-label="选择卷积核"><StageHeader number="2" title="选择卷积核" />
        <div className="ck-common__kernel-selector">
          <button className="ck-common__arrow-button" type="button" aria-label="上一个卷积核" onClick={() => setKernelIndex(wrap(kernelIndex - 1, KERNELS.length))}><Up theme="outline" size="30" /></button>
          <div className="ck-common__kernel-stack"><div className="ck-common__kernel-ghost is-before"><Matrix values={previousKernel.matrix} mini /><Typography variant="bodySmall" tone="muted">{previousKernel.name}</Typography></div><div className="ck-common__active-kernel"><Matrix values={selectedKernel.matrix} /><Typography as="h3" variant="h3" tone="accent">{selectedKernel.name}</Typography><Typography variant="bodySmall" tone="muted">{selectedKernel.note}</Typography></div><div className="ck-common__kernel-ghost is-after"><Matrix values={nextKernel.matrix} mini /><Typography variant="bodySmall" tone="muted">{nextKernel.name}</Typography></div></div>
          <button className="ck-common__arrow-button" type="button" aria-label="下一个卷积核" onClick={() => setKernelIndex(wrap(kernelIndex + 1, KERNELS.length))}><Down theme="outline" size="30" /></button>
        </div>
      </section>
      <section className="ck-common__stage ck-common__stage--result" aria-label="卷积运算结果"><StageHeader number="3" title="卷积运算结果" />
        <div className="ck-common__result-frame">{result ? <img src={result} alt={`${selectedImage.name}经过${selectedKernel.name}处理后的真实卷积输出`} /> : <Typography variant="body" tone="muted">{error || '正在计算…'}</Typography>}</div>
        <Typography variant="bodySmall" tone="muted" className="ck-common__result-note">{selectedKernel.mode === 'gray' ? '灰度值表示输出亮度' : selectedKernel.mode === 'signed' ? '中灰为零；明暗分别表示正、负响应' : '亮度表示响应幅值，正负响应合并显示'}</Typography>
      </section>
    </div>
  </ContentBlock>;
}
