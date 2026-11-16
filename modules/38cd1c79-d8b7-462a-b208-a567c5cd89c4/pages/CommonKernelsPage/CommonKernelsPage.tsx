import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Down, Up, UploadPicture } from '@icon-park/react';
import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './CommonKernelsPage.css';

const moduleAssetId = '38cd1c79-d8b7-462a-b208-a567c5cd89c4';
const buildingImage = moduleAssetUrl('xiandaijianzhu.jpg');
const bridgeImage = moduleAssetUrl('xielaqiao.jpg');
const mountainImage = moduleAssetUrl('caiermate.jpg');
const zebraImage = moduleAssetUrl('zebra.jpg');
const pineappleImage = moduleAssetUrl('pineapple.jpg');
const cityImage = moduleAssetUrl('be_city.jpg');

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
  return <div shuku-edit-id="e-763121b5-0a86-460c-a06c-b17c238a6406" className={`ck-common__matrix ${mini ? 'is-mini' : ''}`} role="img" aria-label={values.map((row) => row.join('，')).join('；')}>
    {values.flatMap((row, y) => row.map((value, x) => <span shuku-edit-id="e-d772a021-09c2-48a6-a3f6-26bc8c0ebd91" key={`${y}-${x}`} className={value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : 'is-zero'}><MathFormulaStatic latex={String(value)} /></span>))}
  </div>;
}

function StageHeader({ number, title }: { number: string; title: string }) {
  return <header shuku-edit-id="e-f9d526a6-c740-44e2-bef1-9f4792d3ab10" className="ck-common__stage-header"><span shuku-edit-id="e-8833d124-7476-4777-8000-bef780c1790a" className="ck-common__stage-number"><Typography shuku-edit-id="e-41ecca73-76fd-4373-ac27-cd99524a627d" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-0a5d2826-824b-48c9-9dfb-28d16fc46511" as="h2" variant="h3" tone="accent">{title}</Typography></header>;
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

  return <ContentBlock shuku-edit-id="e-2418d839-af69-4c6a-a3a4-632c90558a29" headingLevel={1} className="ck-common" title="卷积核工作台" subtitle="选择图像与卷积核，实时观察不同算子产生的真实卷积输出。">
    <div shuku-edit-id="e-3d16f2b5-09ec-4203-9efa-dc9679f065f3" className="ck-common__workspace">
      <section shuku-edit-id="e-131da64e-69b5-476a-bfed-900c2761548e" className="ck-common__stage ck-common__stage--images" aria-label="选择图像"><StageHeader number="1" title="选择图像" />
        <div shuku-edit-id="e-591c4f68-8f86-49b9-a55c-540235d51262" className="ck-common__image-selector" ref={imageSelectorRef}>
          <button shuku-edit-id="e-b8be02bf-1171-46a8-ba50-d6fd60adc993" className="ck-common__arrow-button" type="button" aria-label="上一张图像" onClick={() => { setImageDirection('up'); setImageIndex(wrap(imageIndex - 1, images.length)); }}><Up theme="outline" size="30" /></button>
          <div shuku-edit-id="e-d1c6dc95-b55b-43a5-9998-0b45523d55e3" className="ck-common__image-stack"><img shuku-edit-id="e-3c686609-8ab5-4e98-81a1-2d22a4517974" className="ck-common__image-ghost is-before" src={previousImage.src} alt="" aria-hidden="true" /><div shuku-edit-id="e-2cd90e03-22ad-434e-8193-493a8ba46287" key={selectedImage.src} className={`ck-common__active-image is-from-${imageDirection}`}><img shuku-edit-id="e-4444701a-2573-4efa-b1e5-e32dd26d8d08" src={selectedImage.src} alt={`${selectedImage.name}输入图像`} /><Typography shuku-edit-id="e-0ddb9995-415c-49a0-9527-f2d9c4629d58" as="span" variant="bodySmall" tone="light">{selectedImage.name}</Typography></div><img shuku-edit-id="e-ba12665e-c493-4e61-958f-18a800d3bac5" className="ck-common__image-ghost is-after" src={nextImage.src} alt="" aria-hidden="true" /></div>
          <button shuku-edit-id="e-fe8229ba-5dc7-4da3-91b4-14eca6067c92" className="ck-common__arrow-button" type="button" aria-label="下一张图像" onClick={() => { setImageDirection('down'); setImageIndex(wrap(imageIndex + 1, images.length)); }}><Down theme="outline" size="30" /></button>
        </div>
        <input shuku-edit-id="e-7884fe92-cd72-41b0-b054-fbe39cd16789" ref={uploadRef} className="ck-common__file-input" type="file" accept="image/*" onChange={handleUpload} aria-label="上传图像" />
        <button shuku-edit-id="e-70625c54-69e3-4f14-88f8-f4a7725f2471" className="ck-common__upload" type="button" onClick={() => uploadRef.current?.click()}><UploadPicture theme="outline" size="23" /><Typography shuku-edit-id="e-fd01c44a-6743-4e8f-a104-18d7c647e0ba" as="span" variant="bodySmall" tone="inherit">上传图片</Typography></button>
      </section>
      <section shuku-edit-id="e-20a2f8b3-21dd-4bc1-8960-2a5332b2e028" className="ck-common__stage ck-common__stage--kernels" aria-label="选择卷积核"><StageHeader number="2" title="选择卷积核" />
        <div shuku-edit-id="e-88bec07c-e427-45a9-bedd-47501be22925" className="ck-common__kernel-selector" ref={kernelSelectorRef}>
          <button shuku-edit-id="e-0d81fc28-7681-4201-88cc-8e26405688d0" className="ck-common__arrow-button" type="button" aria-label="上一个卷积核" onClick={() => setKernelIndex(wrap(kernelIndex - 1, KERNELS.length))}><Up theme="outline" size="30" /></button>
          <div shuku-edit-id="e-0f828fb7-d612-40ea-949a-85ae1cdb0ffc" className="ck-common__kernel-stack"><div shuku-edit-id="e-fe35a290-9ea6-492c-a29c-8a0aa40112f1" className="ck-common__kernel-ghost is-before"><Matrix values={previousKernel.matrix} mini /><Typography shuku-edit-id="e-75a29239-07f9-4e15-8da6-77a02c2e84b4" variant="bodySmall" tone="muted">{previousKernel.name}</Typography></div><div shuku-edit-id="e-853796ad-9de1-441a-9719-3cc85c6dee6f" className="ck-common__active-kernel"><Matrix values={selectedKernel.matrix} /><Typography shuku-edit-id="e-f1a25011-4f2b-4812-8af8-928ec8bb5dec" as="h3" variant="h3" tone="accent">{selectedKernel.name}</Typography><Typography shuku-edit-id="e-8ad13b96-e2f9-4b01-9051-79e084e6bf10" variant="bodySmall" tone="muted">{selectedKernel.note}</Typography></div><div shuku-edit-id="e-7f8c7fab-2b34-4265-9cca-123d920ae315" className="ck-common__kernel-ghost is-after"><Matrix values={nextKernel.matrix} mini /><Typography shuku-edit-id="e-9831e2b4-3605-40d7-947d-47b24ff3ff75" variant="bodySmall" tone="muted">{nextKernel.name}</Typography></div></div>
          <button shuku-edit-id="e-84cd122e-bc08-4ec0-878d-cfc93512de1c" className="ck-common__arrow-button" type="button" aria-label="下一个卷积核" onClick={() => setKernelIndex(wrap(kernelIndex + 1, KERNELS.length))}><Down theme="outline" size="30" /></button>
        </div>
      </section>
      <section shuku-edit-id="e-10575b1c-8fd4-49e5-aab2-c23d6e461927" className="ck-common__stage ck-common__stage--result" aria-label="卷积运算结果"><StageHeader number="3" title="卷积运算结果" />
        <div shuku-edit-id="e-a9827a7f-46b4-4951-a696-50fc6fa0800c" className="ck-common__result-frame">{result ? <img shuku-edit-id="e-33148399-96c5-403c-b2bf-8fcc321366ff" src={result} alt={`${selectedImage.name}经过${selectedKernel.name}处理后的真实卷积输出`} /> : <Typography shuku-edit-id="e-a8d1ec31-71a8-43ce-a0e5-26f061fd2ef2" variant="body" tone="muted">{error || '正在计算…'}</Typography>}</div>
        <Typography shuku-edit-id="e-1b5f5658-647a-4a47-b29a-3e00dd2e73e7" variant="bodySmall" tone="muted" className="ck-common__result-note">{selectedKernel.mode === 'gray' ? '灰度值表示输出亮度' : selectedKernel.mode === 'signed' ? '中灰为零；明暗分别表示正、负响应' : '亮度表示响应幅值，正负响应合并显示'}</Typography>
      </section>
    </div>
  </ContentBlock>;
}
