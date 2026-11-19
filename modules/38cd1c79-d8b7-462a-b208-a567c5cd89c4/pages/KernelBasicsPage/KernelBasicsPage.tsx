import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import { useGomokuOutcome } from '../../LessonContext';
import './KernelBasicsPage.css';

const moduleAssetId = '38cd1c79-d8b7-462a-b208-a567c5cd89c4';
const cityImage = moduleAssetUrl("mengdelian.webp");
const bridgeImage = moduleAssetUrl("xielaqiao.webp");

const GRID_WIDTH = 16;
const GRID_HEIGHT = 9;
const KERNEL_SIZE = 3;
const INPUT_WIDTH = 370;
const PREVIEW_WIDTH = GRID_WIDTH - KERNEL_SIZE + 1;
const PREVIEW_HEIGHT = GRID_HEIGHT - KERNEL_SIZE + 1;
const INITIAL_POSITION = { row: 3, col: 6 };

type FilterDirection = 'horizontal' | 'vertical' | 'descending' | 'ascending';

const FILTERS: Record<FilterDirection, { image: string; name: string; kernel: number[][] }> = {
  horizontal: {
    image: cityImage,
    name: '水平直线检测核',
    kernel: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]],
  },
  vertical: {
    image: cityImage,
    name: '竖直直线检测核',
    kernel: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
  },
  descending: {
    image: bridgeImage,
    name: '斜线检测核 ↘',
    kernel: [[2, -1, -1], [-1, 2, -1], [-1, -1, 2]],
  },
  ascending: {
    image: bridgeImage,
    name: '斜线检测核 ↙',
    kernel: [[-1, -1, 2], [-1, 2, -1], [2, -1, -1]],
  },
};

function directionFromDesign(designedKernel: number[][] | null): FilterDirection {
  if (!designedKernel) return 'descending';
  const size = designedKernel.length;
  const scores: { direction: FilterDirection; count: number }[] = [
    { direction: 'horizontal', count: Math.max(...designedKernel.map(row => row.filter(value => value === 1).length)) },
    { direction: 'vertical', count: Math.max(...designedKernel[0].map((_, col) => designedKernel.reduce((sum, row) => sum + Number(row[col] === 1), 0))) },
    { direction: 'descending', count: designedKernel.reduce((sum, row, index) => sum + Number(row[index] === 1), 0) },
    { direction: 'ascending', count: designedKernel.reduce((sum, row, index) => sum + Number(row[size - 1 - index] === 1), 0) },
  ];
  return scores.reduce((best, current) => current.count > best.count ? current : best).direction;
}

interface ConvolutionData {
  inputImageUrl?: string;
  inputWidth: number;
  inputHeight: number;
  output: Float32Array;
  outputWidth: number;
  outputHeight: number;
}

function crossCorrelation(input: Float32Array, inputWidth: number, inputHeight: number, kernel: number[][]): ConvolutionData {
  const outputHeight = inputHeight - kernel.length + 1;
  const outputWidth = inputWidth - kernel[0].length + 1;
  const output = new Float32Array(outputWidth * outputHeight);
  for (let row = 0; row < outputHeight; row += 1) {
    for (let col = 0; col < outputWidth; col += 1) {
      let sum = 0;
      for (let kernelRow = 0; kernelRow < kernel.length; kernelRow += 1) {
        for (let kernelCol = 0; kernelCol < kernel[0].length; kernelCol += 1) {
          // Y[i,j] = sum W[u,v] X[i+u,j+v]. The patch is indexed from its top-left corner.
          sum += kernel[kernelRow][kernelCol] * input[(row + kernelRow) * inputWidth + col + kernelCol];
        }
      }
      output[row * outputWidth + col] = sum;
    }
  }
  return { inputWidth, inputHeight, output, outputWidth, outputHeight };
}

function previewRegion(index: number, outputSize: number, previewSize: number) {
  return {
    start: Math.floor(index * outputSize / previewSize),
    end: Math.ceil((index + 1) * outputSize / previewSize),
  };
}

function useConvolutionData(imageSource: string, kernel: number[][]): ConvolutionData | null {
  const [data, setData] = useState<ConvolutionData | null>(null);

  useEffect(() => {
    let active = true;
    setData(null);
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      const inputWidth = INPUT_WIDTH;
      const inputHeight = Math.round(image.naturalHeight / image.naturalWidth * inputWidth);
      const canvas = document.createElement('canvas');
      canvas.width = inputWidth;
      canvas.height = inputHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      // Resize once to the displayed input resolution, then convolve that exact pixel grid.
      context.drawImage(image, 0, 0, inputWidth, inputHeight);
      const imageData = context.getImageData(0, 0, inputWidth, inputHeight);
      const pixels = imageData.data;
      const input = new Float32Array(inputWidth * inputHeight);
      for (let row = 0; row < inputHeight; row += 1) for (let col = 0; col < inputWidth; col += 1) {
        const offset = (row * inputWidth + col) * 4;
        const luminance = Math.round(0.299 * pixels[offset] + 0.587 * pixels[offset + 1] + 0.114 * pixels[offset + 2]);
        input[row * inputWidth + col] = luminance / 255;
        pixels[offset] = luminance;
        pixels[offset + 1] = luminance;
        pixels[offset + 2] = luminance;
      }
      context.putImageData(imageData, 0, 0);
      setData({ ...crossCorrelation(input, inputWidth, inputHeight, kernel), inputImageUrl: canvas.toDataURL('image/png') });
    };
    image.src = imageSource;
    return () => { active = false; };
  }, [imageSource, kernel]);

  return data;
}

function Matrix({ values, label, className = '' }: { values: number[][]; label: string; className?: string }) {
  return (
    <div shuku-edit-id="e-53250e9e-3453-4ffc-8053-edcf2df5d3f2" className={`ck-convolution__matrix ${className}`} role="img" aria-label={label} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }}>
      {values.flatMap((row, rowIndex) => row.map((value, colIndex) => (
        <div shuku-edit-id="e-298ea31a-62e1-4c02-9890-7b483d31da60" key={`${rowIndex}-${colIndex}`} className={`ck-convolution__matrix-cell ${value < 0 ? 'is-negative' : ''} ${value > 0 ? 'is-positive' : ''}`}>
          <Typography shuku-edit-id="e-4360b99e-8bda-4080-82ce-54d257b5d8c5" as="span" variant="bodySmall" tone={value === 0 ? 'muted' : 'inherit'} aria-hidden="true">{value}</Typography>
        </div>
      )))}
    </div>
  );
}

function InputImage({ selected, imageSrc, data, onHover }: { selected: { row: number; col: number }; imageSrc: string; data: ConvolutionData | null; onHover: (position: { row: number; col: number }) => void }) {
  const cols = data && previewRegion(selected.col, data.outputWidth, PREVIEW_WIDTH);
  const rows = data && previewRegion(selected.row, data.outputHeight, PREVIEW_HEIGHT);
  const patchStyle = data && cols && rows ? {
    left: `${cols.start / data.inputWidth * 100}%`,
    top: `${rows.start / data.inputHeight * 100}%`,
    width: `${(cols.end - cols.start + KERNEL_SIZE - 1) / data.inputWidth * 100}%`,
    height: `${(rows.end - rows.start + KERNEL_SIZE - 1) / data.inputHeight * 100}%`,
  } : undefined;
  return (
    <div shuku-edit-id="e-fe396fbe-5093-4427-b649-a5503b7ce1d9" className="ck-convolution__image-frame" style={data ? { aspectRatio: `${data.inputWidth} / ${data.inputHeight}` } : undefined}>
      <img shuku-edit-id="e-14eb66ce-c867-4164-ad8a-5146b6fe6a68" src={imageSrc} alt="缩小后的灰度图，用于卷积演示" />
      {patchStyle && <div shuku-edit-id="e-802505f4-edc3-43ee-a255-fae9da20730c" className="ck-convolution__patch" style={patchStyle} aria-hidden="true" />}
      <div shuku-edit-id="e-eaa7a7cb-9991-493f-a87b-3f553640aacd"
        className="ck-convolution__image-hover-target"
        aria-hidden="true"
        onPointerMove={(event) => {
          if (!data) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const sourceCol = ((event.clientX - rect.left) / rect.width) * data.inputWidth - (KERNEL_SIZE - 1) / 2;
          const sourceRow = ((event.clientY - rect.top) / rect.height) * data.inputHeight - (KERNEL_SIZE - 1) / 2;
          const col = Math.max(0, Math.min(PREVIEW_WIDTH - 1, Math.floor(sourceCol / data.outputWidth * PREVIEW_WIDTH)));
          const row = Math.max(0, Math.min(PREVIEW_HEIGHT - 1, Math.floor(sourceRow / data.outputHeight * PREVIEW_HEIGHT)));
          onHover({ row, col });
        }}
      />
    </div>
  );
}

/** Match page 8: response magnitude is shown as brightness on a black background. */
function ResponseCanvas({ output, width, height }: { output: Float32Array; width: number; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0 || height === 0) return;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return;
    const pixels = context.createImageData(width, height);
    const strengths = Array.from(output, (value) => Math.abs(value)).sort((a, b) => a - b);
    const scale = Math.max(.025, strengths[Math.floor(strengths.length * .985)] ?? .025);
    output.forEach((value, index) => {
      const rowIndex = Math.floor(index / width);
      const colIndex = index % width;
      const gray = Math.round(Math.min(1, Math.abs(value) / scale) * 255);
      const offset = (rowIndex * width + colIndex) * 4;
      pixels.data[offset] = gray;
      pixels.data[offset + 1] = gray;
      pixels.data[offset + 2] = gray;
      pixels.data[offset + 3] = 255;
    });
    context.putImageData(pixels, 0, 0);
  }, [output, width, height]);

  return <canvas shuku-edit-id="e-b3001b26-a43e-4cfd-8824-f03a4fdf2c74" ref={canvasRef} className="ck-convolution__output-canvas" aria-hidden="true" />;
}

function OutputMap({ data, selected, onSelect }: { data: ConvolutionData; selected: { row: number; col: number }; onSelect: (position: { row: number; col: number }) => void }) {
  const averageAt = (row: number, col: number) => {
    const rows = previewRegion(row, data.outputHeight, PREVIEW_HEIGHT);
    const cols = previewRegion(col, data.outputWidth, PREVIEW_WIDTH);
    let total = 0;
    for (let sourceRow = rows.start; sourceRow < rows.end; sourceRow += 1) {
      for (let sourceCol = cols.start; sourceCol < cols.end; sourceCol += 1) {
        total += data.output[sourceRow * data.outputWidth + sourceCol];
      }
    }
    return total / ((rows.end - rows.start) * (cols.end - cols.start));
  };
  return (
    <div shuku-edit-id="e-7249ad83-18a1-412a-b292-7753fa571e4f" className="ck-convolution__output-map" style={{ aspectRatio: `${data.outputWidth} / ${data.outputHeight}` }}>
      <ResponseCanvas output={data.output} width={data.outputWidth} height={data.outputHeight} />
      <div shuku-edit-id="e-eb4b4109-ca23-464d-95fc-84ea26eaa2f6" className="ck-convolution__output-grid" role="grid" aria-label="卷积输出特征图，点击任意区域查看其中的平均响应" style={{ gridTemplateColumns: `repeat(${PREVIEW_WIDTH}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${PREVIEW_HEIGHT}, minmax(0, 1fr))` }}>
        {Array.from({ length: PREVIEW_WIDTH * PREVIEW_HEIGHT }, (_, index) => {
          const rowIndex = Math.floor(index / PREVIEW_WIDTH);
          const colIndex = index % PREVIEW_WIDTH;
          const value = averageAt(rowIndex, colIndex);
          const isSelected = selected.row === rowIndex && selected.col === colIndex;
          return (
            <button shuku-edit-id="e-e7da5c78-9baf-4794-aac9-a5ecc2755ac0"
              type="button"
              key={`${rowIndex}-${colIndex}`}
              className={`ck-convolution__output-cell ${isSelected ? 'is-selected' : ''}`}
              onClick={() => onSelect({ row: rowIndex, col: colIndex })}
              onPointerEnter={() => onSelect({ row: rowIndex, col: colIndex })}
              onFocus={() => onSelect({ row: rowIndex, col: colIndex })}
              aria-label={`输出第 ${rowIndex + 1} 行第 ${colIndex + 1} 个区域，平均响应 ${value.toFixed(2)}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export interface KernelBasicsPageProps {
  onComplete: () => void;
}

export function KernelBasicsPage({ onComplete }: KernelBasicsPageProps) {
  const { designedKernel } = useGomokuOutcome();
  const filter = FILTERS[directionFromDesign(designedKernel)];
  const data = useConvolutionData(filter.image, filter.kernel);
  const [selected, setSelected] = useState(INITIAL_POSITION);
  const completedRef = useRef(false);
  const selectOutput = (position: { row: number; col: number }) => {
    setSelected(position);
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  return (
    <ContentBlock shuku-edit-id="e-8e1b5321-3b73-42a0-a0fe-d37a0ed9ca9e"
      headingLevel={1}
      className="ck-convolution"
      title="卷积核"
      subtitle="卷积核在输入图像的局部区域上计算响应，并逐位置生成输出特征图。"
    >
      <div shuku-edit-id="e-c226937f-070d-4fb8-bf16-0a720f90196b" className="ck-convolution__workspace">
        <section shuku-edit-id="e-61f3f72e-4326-4b06-8940-3f0794cf220d" className="ck-convolution__flow" aria-label="输入图像、卷积核与输出特征图">
          <div shuku-edit-id="e-90d25672-61f6-4712-b010-06eed5e16593" className="ck-convolution__stage">
            <Typography shuku-edit-id="e-eb52e93d-c10d-4c95-8181-f2bfbc877325" as="h2" variant="h3" tone="accent">输入图像 X</Typography>
            <InputImage selected={selected} imageSrc={data?.inputImageUrl ?? filter.image} data={data} onHover={selectOutput} />
            <Typography shuku-edit-id="e-d577adb1-067c-4f4e-ac06-af0fdf20d497" variant="bodySmall" tone="muted" className="ck-convolution__stage-note">蓝框表示当前参与计算的局部窗口</Typography>
          </div>

          <div shuku-edit-id="e-a3a0ee98-b12a-4075-b404-bc3eed2b7044" className="ck-convolution__flow-arrow" aria-hidden="true"><Typography shuku-edit-id="e-109a53a1-9317-4e9c-8ec1-e1bcea471a44" as="span" variant="h2" tone="accent">→</Typography></div>

          <div shuku-edit-id="e-16b631c7-dd49-430e-912a-8647f0046f4d" className="ck-convolution__kernel-stage">
            <Typography shuku-edit-id="e-377d7104-a28c-4ae4-a109-7e08232784ab" as="h2" variant="h3" tone="accent">卷积核 W</Typography>
            <Matrix values={filter.kernel} label={`${filter.name}`} className="ck-convolution__kernel-matrix" />
            <Typography shuku-edit-id="e-060791f9-6960-479b-9758-b53648bccb08" variant="bodySmall" tone="muted">在局部窗口上逐元素相乘并求和</Typography>
          </div>

          <div shuku-edit-id="e-94a044e8-40d7-493b-982e-dd766e872d3c" className="ck-convolution__flow-arrow" aria-hidden="true"><Typography shuku-edit-id="e-2957f615-4b5e-457f-8405-92c85c8ab264" as="span" variant="h2" tone="accent">→</Typography></div>

          <div shuku-edit-id="e-5ed989f5-e2c4-46bf-a478-ab7bbf5a91b2" className="ck-convolution__stage">
            <Typography shuku-edit-id="e-91c2d0b5-9d71-48bc-91fe-6d18a0f6c946" as="h2" variant="h3" tone="accent">输出特征图 Y</Typography>
            {data ? <OutputMap data={data} selected={selected} onSelect={selectOutput} /> : <div shuku-edit-id="e-fbe8fd7d-1560-447d-99de-11a3202e29f3" className="ck-convolution__loading"><Typography shuku-edit-id="e-0689ff1a-68f1-4765-a31e-56ba8818b571" variant="bodySmall" tone="muted">正在读取图像…</Typography></div>}
            <Typography shuku-edit-id="e-9cee0030-a4c1-43fa-98b3-cf7e5a680e64" variant="bodySmall" tone="muted" className="ck-convolution__stage-note">一个局部窗口对应一个输出位置</Typography>
          </div>
        </section>
      </div>

      <div shuku-edit-id="e-6cd6e54c-7231-4033-a118-5a05d7dbb653" className="ck-convolution__explanation"><Typography shuku-edit-id="e-709c0b57-f343-4f03-9402-19e98168c8bb" variant="body" tone="accent">局部窗口经过卷积核计算得到<strong shuku-edit-id="e-5622c97e-cf6f-49da-b85d-cbd48901f6d2">一个响应值</strong>；窗口在输入图像上滑动后，所有响应共同组成<strong shuku-edit-id="e-907875bf-b448-4e27-a5e9-406fa465b75a">输出特征图</strong>。</Typography></div>
    </ContentBlock>
  );
}
