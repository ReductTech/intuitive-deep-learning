import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Down, Up, UploadPicture } from '@icon-park/react';
import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './CommonKernelsPage.css';

const moduleAssetId = '74de5075-8163-413d-84d4-7176f2a3f4a2';
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
  return <div shuku-edit-id="e-08cf3133-9791-4876-ada4-8ea5e2977be4" className={`cg-copy-ck-common__matrix ${mini ? 'is-mini' : ''}`} role="img" aria-label={values.map((row) => row.join('，')).join('；')}>
    {values.flatMap((row, y) => row.map((value, x) => <span shuku-edit-id="e-7516a127-6138-4b52-96f7-1e6d1fb0aaed" key={`${y}-${x}`} className={value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : 'is-zero'}><MathFormulaStatic latex={String(value)} /></span>))}
  </div>;
}

function StageHeader({ number, title }: { number: string; title: string }) {
  return <header shuku-edit-id="e-66626b43-e8f3-4fc5-93be-cea09f4fc6ac" className="cg-copy-ck-common__stage-header"><span shuku-edit-id="e-28a3fbd7-a7c3-4a69-b626-14241adabb00" className="cg-copy-ck-common__stage-number"><Typography shuku-edit-id="e-b3c48d7a-e08b-44dd-83bb-97e2e941f237" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-e91dd69b-06c6-4f47-9c68-bb72f975f564" as="h2" variant="h3" tone="accent">{title}</Typography></header>;
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

  return <ContentBlock shuku-edit-id="e-1ad026dc-e91e-4b0e-a130-b4eb14573baa" headingLevel={1} className="cg-copy-ck-common" title="卷积核工作台" subtitle="选择图像与卷积核，实时观察不同算子产生的真实卷积输出。">
    <div shuku-edit-id="e-51cc425c-edec-4a38-8897-955792b93069" className="cg-copy-ck-common__workspace">
      <section shuku-edit-id="e-1773dad9-1103-4968-b16a-47ee408df76f" className="cg-copy-ck-common__stage cg-copy-ck-common__stage--images" aria-label="选择图像"><StageHeader number="1" title="选择图像" />
        <div shuku-edit-id="e-07be0e4d-4051-4ac8-9dab-cc11ed5d9eec" className="cg-copy-ck-common__image-selector" ref={imageSelectorRef}>
          <button shuku-edit-id="e-d7e0da77-b7dc-4d1c-98e0-cb4812613ac3" className="cg-copy-ck-common__arrow-button" type="button" aria-label="上一张图像" onClick={() => { setImageDirection('up'); setImageIndex(wrap(imageIndex - 1, images.length)); }}><Up theme="outline" size="30" /></button>
          <div shuku-edit-id="e-9b1351f9-685c-4818-8efb-968a64f74313" className="cg-copy-ck-common__image-stack"><img shuku-edit-id="e-63a387f5-cbe0-4c82-a375-a582818ff639" className="cg-copy-ck-common__image-ghost is-before" src={previousImage.src} alt="" aria-hidden="true" /><div shuku-edit-id="e-551d4249-ea38-4f52-a3b0-8ccba4a4ea71" key={selectedImage.src} className={`cg-copy-ck-common__active-image is-from-${imageDirection}`}><img shuku-edit-id="e-e3a53d19-31c7-4fc7-9995-23faa627279f" src={selectedImage.src} alt={`${selectedImage.name}输入图像`} /><Typography shuku-edit-id="e-5156ea1c-030e-4340-be29-fcdcf80b178b" as="span" variant="bodySmall" tone="light">{selectedImage.name}</Typography></div><img shuku-edit-id="e-5579a497-1aeb-4710-88c4-eeaa93edab53" className="cg-copy-ck-common__image-ghost is-after" src={nextImage.src} alt="" aria-hidden="true" /></div>
          <button shuku-edit-id="e-31633045-d61a-4eb0-90aa-9675d4a98124" className="cg-copy-ck-common__arrow-button" type="button" aria-label="下一张图像" onClick={() => { setImageDirection('down'); setImageIndex(wrap(imageIndex + 1, images.length)); }}><Down theme="outline" size="30" /></button>
        </div>
        <input shuku-edit-id="e-0d5e96c0-12fe-45ce-a2f6-3a0afca9e7fc" ref={uploadRef} className="cg-copy-ck-common__file-input" type="file" accept="image/*" onChange={handleUpload} aria-label="上传图像" />
        <button shuku-edit-id="e-dc9a7955-8f65-427d-b43f-3b93c917c65d" className="cg-copy-ck-common__upload" type="button" onClick={() => uploadRef.current?.click()}><UploadPicture theme="outline" size="23" /><Typography shuku-edit-id="e-13d5f5fb-f66b-4fc6-b096-779d0fc589bf" as="span" variant="bodySmall" tone="inherit">上传图片</Typography></button>
      </section>
      <section shuku-edit-id="e-3186063c-138f-4dff-bf47-8a6ed2df4dab" className="cg-copy-ck-common__stage cg-copy-ck-common__stage--kernels" aria-label="选择卷积核"><StageHeader number="2" title="选择卷积核" />
        <div shuku-edit-id="e-2ea33865-dd75-4c39-9beb-2e2d8cb6a39e" className="cg-copy-ck-common__kernel-selector" ref={kernelSelectorRef}>
          <button shuku-edit-id="e-68f43cf0-e625-421a-9427-c88ee2c6cf48" className="cg-copy-ck-common__arrow-button" type="button" aria-label="上一个卷积核" onClick={() => setKernelIndex(wrap(kernelIndex - 1, KERNELS.length))}><Up theme="outline" size="30" /></button>
          <div shuku-edit-id="e-6b5b03e1-2643-484f-ab8c-a2f36f05f662" className="cg-copy-ck-common__kernel-stack"><div shuku-edit-id="e-0817e1cb-4ae9-4d73-9e6f-be91bc20a86d" className="cg-copy-ck-common__kernel-ghost is-before"><Matrix values={previousKernel.matrix} mini /><Typography shuku-edit-id="e-d62eca55-9cc3-4990-970f-320b9787b790" variant="bodySmall" tone="muted">{previousKernel.name}</Typography></div><div shuku-edit-id="e-6a8ee996-ef59-47c8-9431-5ac8a9f67a53" className="cg-copy-ck-common__active-kernel"><Matrix values={selectedKernel.matrix} /><Typography shuku-edit-id="e-a58779da-e56a-4638-9a54-2c90acb1951a" as="h3" variant="h3" tone="accent">{selectedKernel.name}</Typography><Typography shuku-edit-id="e-d3c601fe-c0a0-4fa6-9a5b-b4ee8448b15f" variant="bodySmall" tone="muted">{selectedKernel.note}</Typography></div><div shuku-edit-id="e-78a1ad0f-262b-48b1-b89d-ec01fada0538" className="cg-copy-ck-common__kernel-ghost is-after"><Matrix values={nextKernel.matrix} mini /><Typography shuku-edit-id="e-f5e73946-2560-4e6e-891a-5db8083a7d6f" variant="bodySmall" tone="muted">{nextKernel.name}</Typography></div></div>
          <button shuku-edit-id="e-cd1088eb-c011-4cfa-9dd6-c2c1d0a0757e" className="cg-copy-ck-common__arrow-button" type="button" aria-label="下一个卷积核" onClick={() => setKernelIndex(wrap(kernelIndex + 1, KERNELS.length))}><Down theme="outline" size="30" /></button>
        </div>
      </section>
      <section shuku-edit-id="e-ba68ceac-4318-424f-8e1c-d37eb27d900a" className="cg-copy-ck-common__stage cg-copy-ck-common__stage--result" aria-label="卷积运算结果"><StageHeader number="3" title="卷积运算结果" />
        <div shuku-edit-id="e-79323fc0-82fb-4fb4-8c44-c6a84bbd8c05" className="cg-copy-ck-common__result-frame">{result ? <img shuku-edit-id="e-52abd409-1e68-441f-9b91-5bf6a6ceae54" src={result} alt={`${selectedImage.name}经过${selectedKernel.name}处理后的真实卷积输出`} /> : <Typography shuku-edit-id="e-0a1f09b3-22b2-4b8e-b7bb-f9bdc097c1e4" variant="body" tone="muted">{error || '正在计算…'}</Typography>}</div>
        <Typography shuku-edit-id="e-20c58557-2ec8-409d-a89b-9903a5b04775" variant="bodySmall" tone="muted" className="cg-copy-ck-common__result-note">{selectedKernel.mode === 'gray' ? '灰度值表示输出亮度' : selectedKernel.mode === 'signed' ? '中灰为零；明暗分别表示正、负响应' : '亮度表示响应幅值，正负响应合并显示'}</Typography>
      </section>
    </div>
  </ContentBlock>;
}
