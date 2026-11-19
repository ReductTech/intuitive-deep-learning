import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { creatorGuideAssetUrl } from '../../../../../creatorGuideAssets';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Down, Up, UploadPicture } from '@icon-park/react';
import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './CommonKernelsPage.css';

const moduleAssetId = '444f8951-dd2e-42dc-94e5-c5a878618631';
const buildingImage = creatorGuideAssetUrl(moduleAssetId, "workflow/convolution-course/xiandaijianzhu.webp");
const bridgeImage = creatorGuideAssetUrl(moduleAssetId, "workflow/convolution-course/xielaqiao.webp");
const mountainImage = creatorGuideAssetUrl(moduleAssetId, "workflow/convolution-course/caiermate.webp");
const zebraImage = creatorGuideAssetUrl(moduleAssetId, "workflow/convolution-course/zebra.webp");
const pineappleImage = creatorGuideAssetUrl(moduleAssetId, "workflow/convolution-course/pineapple.webp");
const cityImage = creatorGuideAssetUrl(moduleAssetId, "workflow/convolution-course/be_city.webp");

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
  return <div shuku-edit-id="e-b6503f8a-9d6a-4ba6-9049-6f6a3c61b2db" className={`aipe-replay-cg-copy-ck-common__matrix ${mini ? 'is-mini' : ''}`} role="img" aria-label={values.map((row) => row.join('，')).join('；')}>
    {values.flatMap((row, y) => row.map((value, x) => <span shuku-edit-id="e-7d0f6917-6e10-4d06-97df-1bbe5485b078" key={`${y}-${x}`} className={value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : 'is-zero'}><MathFormulaStatic latex={String(value)} /></span>))}
  </div>;
}

function StageHeader({ number, title }: { number: string; title: string }) {
  return <header shuku-edit-id="e-9e9d47f4-08b7-4a7f-807e-178b00b5b186" className="aipe-replay-cg-copy-ck-common__stage-header"><span shuku-edit-id="e-ca1a1dd9-a1e2-4421-ac95-9528cea2abc1" className="aipe-replay-cg-copy-ck-common__stage-number"><Typography shuku-edit-id="e-c269e7a3-6a0b-4395-bf5a-601411a7f27c" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-8f03cdc8-6ea8-4570-a0b6-2813b3730684" as="h2" variant="h3" tone="accent">{title}</Typography></header>;
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

  return <ContentBlock shuku-edit-id="e-045a4afc-b988-463d-bf65-701db246d67a" headingLevel={1} className="aipe-replay-cg-copy-ck-common" title="卷积核工作台" subtitle="选择图像与卷积核，实时观察不同算子产生的真实卷积输出。">
    <div shuku-edit-id="e-cd33f0c6-cf2c-4f8f-971a-0ef0f3e097ba" className="aipe-replay-cg-copy-ck-common__workspace">
      <section shuku-edit-id="e-03169328-53f9-42a6-aced-d2057f499c80" className="aipe-replay-cg-copy-ck-common__stage aipe-replay-cg-copy-ck-common__stage--images" aria-label="选择图像"><StageHeader number="1" title="选择图像" />
        <div shuku-edit-id="e-5a52a624-adec-4cbc-8be8-bfbcf0c896f4" className="aipe-replay-cg-copy-ck-common__image-selector" ref={imageSelectorRef}>
          <button shuku-edit-id="e-144802a3-7c6d-4aea-ba5e-8d666635e3fe" className="aipe-replay-cg-copy-ck-common__arrow-button" type="button" aria-label="上一张图像" onClick={() => { setImageDirection('up'); setImageIndex(wrap(imageIndex - 1, images.length)); }}><Up theme="outline" size="30" /></button>
          <div shuku-edit-id="e-b16f55a1-a1d3-4cc7-b578-386e3ff962ed" className="aipe-replay-cg-copy-ck-common__image-stack"><img shuku-edit-id="e-7ef5b173-f58e-4f69-9bb5-fa3d14c44679" className="aipe-replay-cg-copy-ck-common__image-ghost is-before" src={previousImage.src} alt="" aria-hidden="true" /><div shuku-edit-id="e-71d5c54e-8098-4ea4-ad99-846043ac0236" key={selectedImage.src} className={`aipe-replay-cg-copy-ck-common__active-image is-from-${imageDirection}`}><img shuku-edit-id="e-7f884b4b-64f4-47af-9df5-c1f438c54683" src={selectedImage.src} alt={`${selectedImage.name}输入图像`} /><Typography shuku-edit-id="e-ebd71684-108c-4196-b488-b34875498e8c" as="span" variant="bodySmall" tone="light">{selectedImage.name}</Typography></div><img shuku-edit-id="e-5ca9bffd-3b8d-4f79-9502-f650460989af" className="aipe-replay-cg-copy-ck-common__image-ghost is-after" src={nextImage.src} alt="" aria-hidden="true" /></div>
          <button shuku-edit-id="e-f8fae5a6-f1aa-4a1b-acc4-1c3aa8f47ea8" className="aipe-replay-cg-copy-ck-common__arrow-button" type="button" aria-label="下一张图像" onClick={() => { setImageDirection('down'); setImageIndex(wrap(imageIndex + 1, images.length)); }}><Down theme="outline" size="30" /></button>
        </div>
        <input shuku-edit-id="e-47df91d1-5fc8-45b4-ba1f-c5e14b90aaeb" ref={uploadRef} className="aipe-replay-cg-copy-ck-common__file-input" type="file" accept="image/*" onChange={handleUpload} aria-label="上传图像" />
        <button shuku-edit-id="e-e47f9030-5621-461c-bc12-ce52381412b8" className="aipe-replay-cg-copy-ck-common__upload" type="button" onClick={() => uploadRef.current?.click()}><UploadPicture theme="outline" size="23" /><Typography shuku-edit-id="e-2f796864-5a2a-48ea-87d4-790575bf3422" as="span" variant="bodySmall" tone="inherit">上传图片</Typography></button>
      </section>
      <section shuku-edit-id="e-80a70ffa-17cc-474e-821a-6a0e6b87aa87" className="aipe-replay-cg-copy-ck-common__stage aipe-replay-cg-copy-ck-common__stage--kernels" aria-label="选择卷积核"><StageHeader number="2" title="选择卷积核" />
        <div shuku-edit-id="e-d49bb9ba-3bc6-4091-8bb4-b48c24823ded" className="aipe-replay-cg-copy-ck-common__kernel-selector" ref={kernelSelectorRef}>
          <button shuku-edit-id="e-0f3fa591-1f4e-4dbb-a447-82387c763db6" className="aipe-replay-cg-copy-ck-common__arrow-button" type="button" aria-label="上一个卷积核" onClick={() => setKernelIndex(wrap(kernelIndex - 1, KERNELS.length))}><Up theme="outline" size="30" /></button>
          <div shuku-edit-id="e-d6fd1487-454d-4b4e-8d0f-fd3ca95e918a" className="aipe-replay-cg-copy-ck-common__kernel-stack"><div shuku-edit-id="e-e7144fb1-47b0-492d-8c25-05004e3b7c61" className="aipe-replay-cg-copy-ck-common__kernel-ghost is-before"><Matrix values={previousKernel.matrix} mini /><Typography shuku-edit-id="e-627f3cde-eb28-482f-9aec-f3efe79fadce" variant="bodySmall" tone="muted">{previousKernel.name}</Typography></div><div shuku-edit-id="e-4701cf38-b34b-4ba5-a143-1802a04925dc" className="aipe-replay-cg-copy-ck-common__active-kernel"><Matrix values={selectedKernel.matrix} /><Typography shuku-edit-id="e-f380afa7-2ec1-408e-9b8a-fb848377ce1c" as="h3" variant="h3" tone="accent">{selectedKernel.name}</Typography><Typography shuku-edit-id="e-214684aa-8fbd-4a43-8c57-f0d4826c7a3d" variant="bodySmall" tone="muted">{selectedKernel.note}</Typography></div><div shuku-edit-id="e-7653b087-7200-4e62-9d3e-096e1ca2229a" className="aipe-replay-cg-copy-ck-common__kernel-ghost is-after"><Matrix values={nextKernel.matrix} mini /><Typography shuku-edit-id="e-4594f1fd-445f-4002-8207-756dbbcf555d" variant="bodySmall" tone="muted">{nextKernel.name}</Typography></div></div>
          <button shuku-edit-id="e-3e396cab-6241-4a5c-a2ee-60135dafd510" className="aipe-replay-cg-copy-ck-common__arrow-button" type="button" aria-label="下一个卷积核" onClick={() => setKernelIndex(wrap(kernelIndex + 1, KERNELS.length))}><Down theme="outline" size="30" /></button>
        </div>
      </section>
      <section shuku-edit-id="e-1f6e58f6-1f65-45c5-8612-46a18bd2e80d" className="aipe-replay-cg-copy-ck-common__stage aipe-replay-cg-copy-ck-common__stage--result" aria-label="卷积运算结果"><StageHeader number="3" title="卷积运算结果" />
        <div shuku-edit-id="e-64cc66d2-35c4-4879-8eb5-276efc5c6986" className="aipe-replay-cg-copy-ck-common__result-frame">{result ? <img shuku-edit-id="e-72bd5f61-7127-4e49-81f2-3acc447e9fdc" src={result} alt={`${selectedImage.name}经过${selectedKernel.name}处理后的真实卷积输出`} /> : <Typography shuku-edit-id="e-47615ed6-85d4-471d-ac79-1d003c811224" variant="body" tone="muted">{error || '正在计算…'}</Typography>}</div>
        <Typography shuku-edit-id="e-8110bc8a-747e-438e-a1ac-341fd45ad6c9" variant="bodySmall" tone="muted" className="aipe-replay-cg-copy-ck-common__result-note">{selectedKernel.mode === 'gray' ? '灰度值表示输出亮度' : selectedKernel.mode === 'signed' ? '中灰为零；明暗分别表示正、负响应' : '亮度表示响应幅值，正负响应合并显示'}</Typography>
      </section>
    </div>
  </ContentBlock>;
}
