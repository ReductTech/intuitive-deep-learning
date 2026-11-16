import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Down, Up, UploadPicture } from '@icon-park/react';
import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './CommonKernelsPage.css';

const moduleAssetId = 'b8d86e85-2150-47e3-9e1a-aa7cc7cce15c';
const buildingImage = moduleAssetUrl('workflow/convolution-course/xiandaijianzhu.jpg');
const bridgeImage = moduleAssetUrl('workflow/convolution-course/xielaqiao.jpg');
const mountainImage = moduleAssetUrl('workflow/convolution-course/caiermate.jpg');
const zebraImage = moduleAssetUrl('workflow/convolution-course/zebra.jpg');
const pineappleImage = moduleAssetUrl('workflow/convolution-course/pineapple.jpg');
const cityImage = moduleAssetUrl('workflow/convolution-course/be_city.jpg');

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
  return <div shuku-edit-id="e-3b3e3f34-90b6-45ae-bb30-adf3dad04611" className={`cg-copy-ck-common__matrix ${mini ? 'is-mini' : ''}`} role="img" aria-label={values.map((row) => row.join('，')).join('；')}>
    {values.flatMap((row, y) => row.map((value, x) => <span shuku-edit-id="e-cf5364e5-cc9b-40be-97e6-341b0a20fb08" key={`${y}-${x}`} className={value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : 'is-zero'}><MathFormulaStatic latex={String(value)} /></span>))}
  </div>;
}

function StageHeader({ number, title }: { number: string; title: string }) {
  return <header shuku-edit-id="e-90dcfa9a-e1e3-4504-aa67-436fd3fe6d54" className="cg-copy-ck-common__stage-header"><span shuku-edit-id="e-e096d503-e28e-488c-a15b-ce47e5bdb803" className="cg-copy-ck-common__stage-number"><Typography shuku-edit-id="e-84403e21-e11b-474b-8f78-4ab2978aae8a" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-99b7bc74-1d1a-4c6b-bc5d-25838fc1a7c0" as="h2" variant="h3" tone="accent">{title}</Typography></header>;
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
  const kernelSelectorRef = useRef<HTMLDivElement>(null);
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
    const selector = kernelSelectorRef.current;
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
      setKernelIndex((current) => wrap(current + direction, KERNELS.length));
    };
    selector.addEventListener('wheel', handleWheel, { passive: false });
    return () => selector.removeEventListener('wheel', handleWheel);
  }, []);
  useEffect(() => {
    let active = true;
    setResult('');
    const image = new Image();
    image.crossOrigin = 'anonymous';
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

  return <ContentBlock shuku-edit-id="e-c83b9698-e57d-4e78-bda9-7653a5295e7b" headingLevel={1} className="cg-copy-ck-common" title="卷积核工作台" subtitle="选择图像与卷积核，实时观察不同算子产生的真实卷积输出。">
    <div shuku-edit-id="e-4456370c-ee6d-4ca0-8158-95299dffd69a" className="cg-copy-ck-common__workspace">
      <section shuku-edit-id="e-148d8603-d981-4f8b-94ef-4a28307de97c" className="cg-copy-ck-common__stage cg-copy-ck-common__stage--images" aria-label="选择图像"><StageHeader number="1" title="选择图像" />
        <div shuku-edit-id="e-624314b1-c50b-4e62-9d1e-2da0829f8bd3" className="cg-copy-ck-common__image-selector" ref={imageSelectorRef}>
          <button shuku-edit-id="e-97df47a5-fa65-4fde-acb9-10b08b4bfb11" className="cg-copy-ck-common__arrow-button" type="button" aria-label="上一张图像" onClick={() => { setImageDirection('up'); setImageIndex(wrap(imageIndex - 1, images.length)); }}><Up theme="outline" size="30" /></button>
          <div shuku-edit-id="e-cdf2eaf3-59f3-4356-b4a3-6ed802cd2fd6" className="cg-copy-ck-common__image-stack"><img shuku-edit-id="e-95aeca8d-fe80-4404-a697-0884407fdd39" className="cg-copy-ck-common__image-ghost is-before" src={previousImage.src} alt="" aria-hidden="true" /><div shuku-edit-id="e-1f9a8ee8-beb6-40ca-951b-e15268c19524" key={selectedImage.src} className={`cg-copy-ck-common__active-image is-from-${imageDirection}`}><img shuku-edit-id="e-0cf34fee-3e59-430b-ad22-a2eec9650518" src={selectedImage.src} alt={`${selectedImage.name}输入图像`} /><Typography shuku-edit-id="e-256aac27-6637-4e3b-959b-6a4aaa0cd3a8" as="span" variant="bodySmall" tone="light">{selectedImage.name}</Typography></div><img shuku-edit-id="e-a03ed173-9512-4484-af57-044ed20d9aaf" className="cg-copy-ck-common__image-ghost is-after" src={nextImage.src} alt="" aria-hidden="true" /></div>
          <button shuku-edit-id="e-a20fdaa2-f5b5-4463-9feb-b38fb9dd7b70" className="cg-copy-ck-common__arrow-button" type="button" aria-label="下一张图像" onClick={() => { setImageDirection('down'); setImageIndex(wrap(imageIndex + 1, images.length)); }}><Down theme="outline" size="30" /></button>
        </div>
        <input shuku-edit-id="e-beb074b8-469c-4da1-972b-ab644730c921" ref={uploadRef} className="cg-copy-ck-common__file-input" type="file" accept="image/*" onChange={handleUpload} aria-label="上传图像" />
        <button shuku-edit-id="e-a567cdf3-014f-4ff9-bf9e-19933ba1e3cf" className="cg-copy-ck-common__upload" type="button" onClick={() => uploadRef.current?.click()}><UploadPicture theme="outline" size="23" /><Typography shuku-edit-id="e-7a174587-9988-4552-ac5d-c32c531f033b" as="span" variant="bodySmall" tone="inherit">上传图片</Typography></button>
      </section>
      <section shuku-edit-id="e-a81a547d-1b9c-48be-96b2-219f4be8c6d0" className="cg-copy-ck-common__stage cg-copy-ck-common__stage--kernels" aria-label="选择卷积核"><StageHeader number="2" title="选择卷积核" />
        <div shuku-edit-id="e-dceb1ed1-6e0f-4278-a87e-c320cc10e6a5" className="cg-copy-ck-common__kernel-selector" ref={kernelSelectorRef}>
          <button shuku-edit-id="e-64ef2069-5a59-4f82-91af-393fca6ddde6" className="cg-copy-ck-common__arrow-button" type="button" aria-label="上一个卷积核" onClick={() => setKernelIndex(wrap(kernelIndex - 1, KERNELS.length))}><Up theme="outline" size="30" /></button>
          <div shuku-edit-id="e-2831f016-1172-452f-ba04-6e430d33f24e" className="cg-copy-ck-common__kernel-stack"><div shuku-edit-id="e-6d6a754c-7a23-4ec6-975e-9f675aa1945c" className="cg-copy-ck-common__kernel-ghost is-before"><Matrix values={previousKernel.matrix} mini /><Typography shuku-edit-id="e-4c37da09-9e22-4676-a3f3-831e19e7e98d" variant="bodySmall" tone="muted">{previousKernel.name}</Typography></div><div shuku-edit-id="e-926495b9-01b9-44ed-b54c-1834878a7adf" className="cg-copy-ck-common__active-kernel"><Matrix values={selectedKernel.matrix} /><Typography shuku-edit-id="e-db153e87-584b-4c71-b840-895cb32b7dec" as="h3" variant="h3" tone="accent">{selectedKernel.name}</Typography><Typography shuku-edit-id="e-f377d139-3c17-4586-adb9-e1aa798b8e65" variant="bodySmall" tone="muted">{selectedKernel.note}</Typography></div><div shuku-edit-id="e-80c2c158-c775-46c9-b286-a0521475db46" className="cg-copy-ck-common__kernel-ghost is-after"><Matrix values={nextKernel.matrix} mini /><Typography shuku-edit-id="e-7a5193f3-95e0-440d-adf0-fa92aadc1f3a" variant="bodySmall" tone="muted">{nextKernel.name}</Typography></div></div>
          <button shuku-edit-id="e-2f6615ae-dea2-4370-94ba-2991df0179c1" className="cg-copy-ck-common__arrow-button" type="button" aria-label="下一个卷积核" onClick={() => setKernelIndex(wrap(kernelIndex + 1, KERNELS.length))}><Down theme="outline" size="30" /></button>
        </div>
      </section>
      <section shuku-edit-id="e-55b1e9f2-52ee-4a7b-b043-a0bee8d4dd29" className="cg-copy-ck-common__stage cg-copy-ck-common__stage--result" aria-label="卷积运算结果"><StageHeader number="3" title="卷积运算结果" />
        <div shuku-edit-id="e-8a39d780-9bcc-4f79-8155-3a4560ce938a" className="cg-copy-ck-common__result-frame">{result ? <img shuku-edit-id="e-3eb54c0f-3b04-4012-b204-bbb92b41ee55" src={result} alt={`${selectedImage.name}经过${selectedKernel.name}处理后的真实卷积输出`} /> : <Typography shuku-edit-id="e-6e5c2e9d-9179-47ca-8ded-f456d1bd246c" variant="body" tone="muted">{error || '正在计算…'}</Typography>}</div>
        <Typography shuku-edit-id="e-606e4070-5d15-4045-8077-07aee5f451b7" variant="bodySmall" tone="muted" className="cg-copy-ck-common__result-note">{selectedKernel.mode === 'gray' ? '灰度值表示输出亮度' : selectedKernel.mode === 'signed' ? '中灰为零；明暗分别表示正、负响应' : '亮度表示响应幅值，正负响应合并显示'}</Typography>
      </section>
    </div>
  </ContentBlock>;
}
