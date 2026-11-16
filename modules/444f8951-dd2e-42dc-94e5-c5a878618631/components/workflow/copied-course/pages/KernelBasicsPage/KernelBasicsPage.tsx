import mengdelianAsset0 from '../../../../../assets/workflow/convolution-course/mengdelian.jpg';
import xielaqiaoAsset1 from '../../../../../assets/workflow/convolution-course/xielaqiao.jpg';
import { useEffect, useRef, useState } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import { useGomokuOutcome } from '../../LessonContext';
import './KernelBasicsPage.css';

const cityImage = mengdelianAsset0;
const bridgeImage = xielaqiaoAsset1;

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
    image.crossOrigin = 'anonymous';
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
    <div shuku-edit-id="e-df86d7d0-d034-4c6f-ab37-caacf061e98e" className={`cg-copy-ck-convolution__matrix ${className}`} role="img" aria-label={label} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }}>
      {values.flatMap((row, rowIndex) => row.map((value, colIndex) => (
        <div shuku-edit-id="e-d71db993-8737-4e3c-b041-48c500397000" key={`${rowIndex}-${colIndex}`} className={`cg-copy-ck-convolution__matrix-cell ${value < 0 ? 'is-negative' : ''} ${value > 0 ? 'is-positive' : ''}`}>
          <Typography shuku-edit-id="e-57338b04-6158-4b93-9d44-87b63f86a03a" as="span" variant="bodySmall" tone={value === 0 ? 'muted' : 'inherit'} aria-hidden="true">{value}</Typography>
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
    <div shuku-edit-id="e-c075ab0d-e419-45f6-8fab-40a2f8be7e9e" className="cg-copy-ck-convolution__image-frame" style={data ? { aspectRatio: `${data.inputWidth} / ${data.inputHeight}` } : undefined}>
      <img shuku-edit-id="e-d3eba7cb-df05-4424-92a1-ab2fbd4d8084" src={imageSrc} alt="缩小后的灰度图，用于卷积演示" />
      {patchStyle && <div shuku-edit-id="e-f04ccad9-8087-4c4a-86d6-1fb1fc40bf41" className="cg-copy-ck-convolution__patch" style={patchStyle} aria-hidden="true" />}
      <div shuku-edit-id="e-14ddab0a-0e7f-40b8-bfb8-fe3c213f94bd"
        className="cg-copy-ck-convolution__image-hover-target"
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

  return <canvas shuku-edit-id="e-485bf9c8-0393-4ee1-aaea-2877d6544667" ref={canvasRef} className="cg-copy-ck-convolution__output-canvas" aria-hidden="true" />;
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
    <div shuku-edit-id="e-9bbdc033-8949-46c8-af14-bd20c39c7777" className="cg-copy-ck-convolution__output-map" style={{ aspectRatio: `${data.outputWidth} / ${data.outputHeight}` }}>
      <ResponseCanvas output={data.output} width={data.outputWidth} height={data.outputHeight} />
      <div shuku-edit-id="e-ff06b73b-8585-410d-9bcb-fa8f163c0ca6" className="cg-copy-ck-convolution__output-grid" role="grid" aria-label="卷积输出特征图，点击任意区域查看其中的平均响应" style={{ gridTemplateColumns: `repeat(${PREVIEW_WIDTH}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${PREVIEW_HEIGHT}, minmax(0, 1fr))` }}>
        {Array.from({ length: PREVIEW_WIDTH * PREVIEW_HEIGHT }, (_, index) => {
          const rowIndex = Math.floor(index / PREVIEW_WIDTH);
          const colIndex = index % PREVIEW_WIDTH;
          const value = averageAt(rowIndex, colIndex);
          const isSelected = selected.row === rowIndex && selected.col === colIndex;
          return (
            <button shuku-edit-id="e-000052bf-b68b-4f43-9e9e-bcbee147c8bb"
              type="button"
              key={`${rowIndex}-${colIndex}`}
              className={`cg-copy-ck-convolution__output-cell ${isSelected ? 'is-selected' : ''}`}
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
    <ContentBlock shuku-edit-id="e-d37bc847-73a3-45b2-b0c2-d54885b1ede4"
      headingLevel={1}
      className="cg-copy-ck-convolution"
      title="卷积核"
      subtitle="卷积核在输入图像的局部区域上计算响应，并逐位置生成输出特征图。"
    >
      <div shuku-edit-id="e-b069d69d-422c-4df3-9d33-1a6d2933c983" className="cg-copy-ck-convolution__workspace">
        <section shuku-edit-id="e-e60c7fdb-56a3-42e1-a17e-0cfc76b6d7d6" className="cg-copy-ck-convolution__flow" aria-label="输入图像、卷积核与输出特征图">
          <div shuku-edit-id="e-ebb7d22d-d9c9-4432-92ae-7f5c799da59e" className="cg-copy-ck-convolution__stage">
            <Typography shuku-edit-id="e-d9f6eb83-601f-424a-ae35-35e1631ee010" as="h2" variant="h3" tone="accent">输入图像 X</Typography>
            <InputImage selected={selected} imageSrc={data?.inputImageUrl ?? filter.image} data={data} onHover={selectOutput} />
            <Typography shuku-edit-id="e-96e13297-f071-4832-a54a-8ecb50909fc2" variant="bodySmall" tone="muted" className="cg-copy-ck-convolution__stage-note">蓝框表示当前参与计算的局部窗口</Typography>
          </div>

          <div shuku-edit-id="e-96837039-f861-42af-b5dd-997c657779c0" className="cg-copy-ck-convolution__flow-arrow" aria-hidden="true"><Typography shuku-edit-id="e-66d8b9b3-78d9-4b32-ad03-5784fefe263b" as="span" variant="h2" tone="accent">→</Typography></div>

          <div shuku-edit-id="e-3f332571-8ad4-46f7-8b28-4533f68396fe" className="cg-copy-ck-convolution__kernel-stage">
            <Typography shuku-edit-id="e-bf3ba58c-6dfb-4e13-be5f-6cd2fa0d9156" as="h2" variant="h3" tone="accent">卷积核 W</Typography>
            <Matrix values={filter.kernel} label={`${filter.name}`} className="cg-copy-ck-convolution__kernel-matrix" />
            <Typography shuku-edit-id="e-cfa7f020-cf0b-4c72-a12a-2ca875d1d124" variant="bodySmall" tone="muted">在局部窗口上逐元素相乘并求和</Typography>
          </div>

          <div shuku-edit-id="e-24b55426-bc61-4ba0-b7da-1c05fc26c6aa" className="cg-copy-ck-convolution__flow-arrow" aria-hidden="true"><Typography shuku-edit-id="e-48306270-1c92-4274-ab4e-853ae919b679" as="span" variant="h2" tone="accent">→</Typography></div>

          <div shuku-edit-id="e-eb9e607a-ad8a-4cf1-b7b5-61531a51f099" className="cg-copy-ck-convolution__stage">
            <Typography shuku-edit-id="e-ef1f5280-486b-44ab-b560-dc3fd8790973" as="h2" variant="h3" tone="accent">输出特征图 Y</Typography>
            {data ? <OutputMap data={data} selected={selected} onSelect={selectOutput} /> : <div shuku-edit-id="e-a8c1764a-f70c-49f7-b341-18077d16dad3" className="cg-copy-ck-convolution__loading"><Typography shuku-edit-id="e-32e93d37-8220-4d0e-83b6-e5436d18131a" variant="bodySmall" tone="muted">正在读取图像…</Typography></div>}
            <Typography shuku-edit-id="e-f905f00e-4807-4fd8-9117-dbb9d50dbb94" variant="bodySmall" tone="muted" className="cg-copy-ck-convolution__stage-note">一个局部窗口对应一个输出位置</Typography>
          </div>
        </section>
      </div>

      <div shuku-edit-id="e-86a568ac-9b78-447d-b12a-4c49cd921843" className="cg-copy-ck-convolution__explanation"><Typography shuku-edit-id="e-5a59b501-4467-44b3-ab38-07cb423f6199" variant="body" tone="accent">局部窗口经过卷积核计算得到<strong shuku-edit-id="e-b1872609-cdee-40d5-a04c-8fe8de9d1ae5">一个响应值</strong>；窗口在输入图像上滑动后，所有响应共同组成<strong shuku-edit-id="e-bc3a6988-be09-4909-b514-bf16041fcb9b">输出特征图</strong>。</Typography></div>
    </ContentBlock>
  );
}
