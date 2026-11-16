import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { creatorGuideAssetUrl } from '../../../../../creatorGuideAssets';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Down, Up, UploadPicture } from '@icon-park/react';
import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './CommonKernelsPage.css';

const moduleAssetId = '444f8951-dd2e-42dc-94e5-c5a878618631';
const buildingImage = creatorGuideAssetUrl(moduleAssetId, 'workflow/convolution-course/xiandaijianzhu.jpg');
const bridgeImage = creatorGuideAssetUrl(moduleAssetId, 'workflow/convolution-course/xielaqiao.jpg');
const mountainImage = creatorGuideAssetUrl(moduleAssetId, 'workflow/convolution-course/caiermate.jpg');
const zebraImage = creatorGuideAssetUrl(moduleAssetId, 'workflow/convolution-course/zebra.jpg');
const pineappleImage = creatorGuideAssetUrl(moduleAssetId, 'workflow/convolution-course/pineapple.jpg');
const cityImage = creatorGuideAssetUrl(moduleAssetId, 'workflow/convolution-course/be_city.jpg');

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
  return <div shuku-edit-id="e-2e7bda14-66aa-4f52-a418-c43ee33dc6d9" className={`aipe-replay-cg-copy-ck-common__matrix ${mini ? 'is-mini' : ''}`} role="img" aria-label={values.map((row) => row.join('，')).join('；')}>
    {values.flatMap((row, y) => row.map((value, x) => <span shuku-edit-id="e-7f88e9ba-14f5-48a8-b1f5-3f48e7dffee6" key={`${y}-${x}`} className={value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : 'is-zero'}><MathFormulaStatic latex={String(value)} /></span>))}
  </div>;
}

function StageHeader({ number, title }: { number: string; title: string }) {
  return <header shuku-edit-id="e-a7d3de62-0a6f-4c0f-a12c-d7e97e1cf4b1" className="aipe-replay-cg-copy-ck-common__stage-header"><span shuku-edit-id="e-49e53c53-6fdd-4428-bee5-e58d9baaedd6" className="aipe-replay-cg-copy-ck-common__stage-number"><Typography shuku-edit-id="e-ffa22d6f-84c1-4466-9cdb-b42b3a4aa2e7" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-c0722a9b-3942-4f4e-ac90-230fa4c0c0da" as="h2" variant="h3" tone="accent">{title}</Typography></header>;
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

  return <ContentBlock shuku-edit-id="e-830460f8-7956-4661-82b9-efcc0e1bdada" headingLevel={1} className="aipe-replay-cg-copy-ck-common" title="卷积核工作台" subtitle="选择图像与卷积核，实时观察不同算子产生的真实卷积输出。">
    <div shuku-edit-id="e-2e7c3652-92d7-4885-a4ba-9b29e6b0c6ee" className="aipe-replay-cg-copy-ck-common__workspace">
      <section shuku-edit-id="e-870fdbe1-2b0b-4e22-be6b-27ec0d337c0a" className="aipe-replay-cg-copy-ck-common__stage aipe-replay-cg-copy-ck-common__stage--images" aria-label="选择图像"><StageHeader number="1" title="选择图像" />
        <div shuku-edit-id="e-ad808f7c-6744-477f-8d8f-3c44f053f368" className="aipe-replay-cg-copy-ck-common__image-selector" ref={imageSelectorRef}>
          <button shuku-edit-id="e-bd74826f-b881-4b70-9f23-01e9f6863533" className="aipe-replay-cg-copy-ck-common__arrow-button" type="button" aria-label="上一张图像" onClick={() => { setImageDirection('up'); setImageIndex(wrap(imageIndex - 1, images.length)); }}><Up theme="outline" size="30" /></button>
          <div shuku-edit-id="e-5345151b-715d-42e2-be69-9c7e800e600e" className="aipe-replay-cg-copy-ck-common__image-stack"><img shuku-edit-id="e-e9524238-c506-4731-b63f-78fe71d60df7" className="aipe-replay-cg-copy-ck-common__image-ghost is-before" src={previousImage.src} alt="" aria-hidden="true" /><div shuku-edit-id="e-98e831ec-84e7-48c3-9cb5-ec4354a0ef44" key={selectedImage.src} className={`aipe-replay-cg-copy-ck-common__active-image is-from-${imageDirection}`}><img shuku-edit-id="e-ea130bbc-6cd7-4968-aaa2-cd55a13e8d82" src={selectedImage.src} alt={`${selectedImage.name}输入图像`} /><Typography shuku-edit-id="e-36b9c645-7028-4322-95c1-4454315e9d4d" as="span" variant="bodySmall" tone="light">{selectedImage.name}</Typography></div><img shuku-edit-id="e-4c4bdd76-96da-465a-8c6a-28795fbbec66" className="aipe-replay-cg-copy-ck-common__image-ghost is-after" src={nextImage.src} alt="" aria-hidden="true" /></div>
          <button shuku-edit-id="e-ca63255e-0124-43ec-8917-eb08d8ad2151" className="aipe-replay-cg-copy-ck-common__arrow-button" type="button" aria-label="下一张图像" onClick={() => { setImageDirection('down'); setImageIndex(wrap(imageIndex + 1, images.length)); }}><Down theme="outline" size="30" /></button>
        </div>
        <input shuku-edit-id="e-6ab2f499-71f3-4934-9712-f309195f71f0" ref={uploadRef} className="aipe-replay-cg-copy-ck-common__file-input" type="file" accept="image/*" onChange={handleUpload} aria-label="上传图像" />
        <button shuku-edit-id="e-009a962e-b12c-4e34-87b1-cd93306c8302" className="aipe-replay-cg-copy-ck-common__upload" type="button" onClick={() => uploadRef.current?.click()}><UploadPicture theme="outline" size="23" /><Typography shuku-edit-id="e-ccf7aef5-97c7-4140-ae58-f36b71b0bc27" as="span" variant="bodySmall" tone="inherit">上传图片</Typography></button>
      </section>
      <section shuku-edit-id="e-a12b5c89-2280-4acc-a55d-3012bdc7d821" className="aipe-replay-cg-copy-ck-common__stage aipe-replay-cg-copy-ck-common__stage--kernels" aria-label="选择卷积核"><StageHeader number="2" title="选择卷积核" />
        <div shuku-edit-id="e-ba2f0fa9-12da-4cd2-a9a8-99f3b51974db" className="aipe-replay-cg-copy-ck-common__kernel-selector" ref={kernelSelectorRef}>
          <button shuku-edit-id="e-e376a6c9-67e1-418c-89fe-52a95dc7939e" className="aipe-replay-cg-copy-ck-common__arrow-button" type="button" aria-label="上一个卷积核" onClick={() => setKernelIndex(wrap(kernelIndex - 1, KERNELS.length))}><Up theme="outline" size="30" /></button>
          <div shuku-edit-id="e-00a5add7-3c4a-42b5-9535-5a37ac1f34f3" className="aipe-replay-cg-copy-ck-common__kernel-stack"><div shuku-edit-id="e-d355dff5-7185-4174-a87a-dad8fd0479e4" className="aipe-replay-cg-copy-ck-common__kernel-ghost is-before"><Matrix values={previousKernel.matrix} mini /><Typography shuku-edit-id="e-93dfd554-1434-4e62-876b-0fdfa4d40a7d" variant="bodySmall" tone="muted">{previousKernel.name}</Typography></div><div shuku-edit-id="e-c500b352-8bbf-4aff-b2b8-3482d219aee9" className="aipe-replay-cg-copy-ck-common__active-kernel"><Matrix values={selectedKernel.matrix} /><Typography shuku-edit-id="e-d14ee909-e6a7-4e12-8711-34ff7caf0fc7" as="h3" variant="h3" tone="accent">{selectedKernel.name}</Typography><Typography shuku-edit-id="e-8402d5c5-4a17-4155-bc24-d2e5ef964263" variant="bodySmall" tone="muted">{selectedKernel.note}</Typography></div><div shuku-edit-id="e-25c1579c-2c62-4a26-b9a1-ff6c9c27fc9d" className="aipe-replay-cg-copy-ck-common__kernel-ghost is-after"><Matrix values={nextKernel.matrix} mini /><Typography shuku-edit-id="e-ae33fe74-3f96-4075-9197-56fc2a3bcadc" variant="bodySmall" tone="muted">{nextKernel.name}</Typography></div></div>
          <button shuku-edit-id="e-42d315cb-b1cd-4200-b171-80a460321eb9" className="aipe-replay-cg-copy-ck-common__arrow-button" type="button" aria-label="下一个卷积核" onClick={() => setKernelIndex(wrap(kernelIndex + 1, KERNELS.length))}><Down theme="outline" size="30" /></button>
        </div>
      </section>
      <section shuku-edit-id="e-f6d9a116-ba7f-4161-9d76-27c6edae562f" className="aipe-replay-cg-copy-ck-common__stage aipe-replay-cg-copy-ck-common__stage--result" aria-label="卷积运算结果"><StageHeader number="3" title="卷积运算结果" />
        <div shuku-edit-id="e-5b7fd458-fa16-42b9-ad6d-5eb29949a4e8" className="aipe-replay-cg-copy-ck-common__result-frame">{result ? <img shuku-edit-id="e-d2fa7a78-8293-449d-8e88-2d8a55290af7" src={result} alt={`${selectedImage.name}经过${selectedKernel.name}处理后的真实卷积输出`} /> : <Typography shuku-edit-id="e-6eb5f0e3-e628-4ec2-9752-02433f4dadb7" variant="body" tone="muted">{error || '正在计算…'}</Typography>}</div>
        <Typography shuku-edit-id="e-ee5a1b4b-096f-4a0a-aa8e-f16bd60b228e" variant="bodySmall" tone="muted" className="aipe-replay-cg-copy-ck-common__result-note">{selectedKernel.mode === 'gray' ? '灰度值表示输出亮度' : selectedKernel.mode === 'signed' ? '中灰为零；明暗分别表示正、负响应' : '亮度表示响应幅值，正负响应合并显示'}</Typography>
      </section>
    </div>
  </ContentBlock>;
}
