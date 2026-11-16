import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { creatorGuideAssetUrl } from '../../../../../creatorGuideAssets';
import { useEffect, useRef, useState } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import { useGomokuOutcome } from '../../LessonContext';
import './KernelBasicsPage.css';

const moduleAssetId = '444f8951-dd2e-42dc-94e5-c5a878618631';
const cityImage = creatorGuideAssetUrl(moduleAssetId, 'workflow/convolution-course/mengdelian.jpg');
const bridgeImage = creatorGuideAssetUrl(moduleAssetId, 'workflow/convolution-course/xielaqiao.jpg');

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
    <div shuku-edit-id="e-002f5517-7123-4ba8-adc5-c09d7926fd2b" className={`aipe-replay-cg-copy-ck-convolution__matrix ${className}`} role="img" aria-label={label} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }}>
      {values.flatMap((row, rowIndex) => row.map((value, colIndex) => (
        <div shuku-edit-id="e-fa9c8774-9c6b-48c4-8e53-884a5f697f1f" key={`${rowIndex}-${colIndex}`} className={`aipe-replay-cg-copy-ck-convolution__matrix-cell ${value < 0 ? 'is-negative' : ''} ${value > 0 ? 'is-positive' : ''}`}>
          <Typography shuku-edit-id="e-2f60bf95-9db1-4e2e-88c4-5e7f4ed7ea2c" as="span" variant="bodySmall" tone={value === 0 ? 'muted' : 'inherit'} aria-hidden="true">{value}</Typography>
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
    <div shuku-edit-id="e-f060f5c7-f0e9-4aa5-a349-e6fd5d3a6f94" className="aipe-replay-cg-copy-ck-convolution__image-frame" style={data ? { aspectRatio: `${data.inputWidth} / ${data.inputHeight}` } : undefined}>
      <img shuku-edit-id="e-73623864-aed1-4bc3-955e-810f09390af3" src={imageSrc} alt="缩小后的灰度图，用于卷积演示" />
      {patchStyle && <div shuku-edit-id="e-22576978-54da-4b05-8255-6e15212ab949" className="aipe-replay-cg-copy-ck-convolution__patch" style={patchStyle} aria-hidden="true" />}
      <div shuku-edit-id="e-e7ff2dae-3dc9-4d8d-adf4-e7cc5ae669e7"
        className="aipe-replay-cg-copy-ck-convolution__image-hover-target"
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

  return <canvas shuku-edit-id="e-8e13eee2-e2b3-4f54-a467-37ceacccca51" ref={canvasRef} className="aipe-replay-cg-copy-ck-convolution__output-canvas" aria-hidden="true" />;
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
    <div shuku-edit-id="e-e866c5d9-78c4-424f-9d50-2bf1d84c8cfd" className="aipe-replay-cg-copy-ck-convolution__output-map" style={{ aspectRatio: `${data.outputWidth} / ${data.outputHeight}` }}>
      <ResponseCanvas output={data.output} width={data.outputWidth} height={data.outputHeight} />
      <div shuku-edit-id="e-389cf7ce-16ba-466c-aa1e-2efdaad9e619" className="aipe-replay-cg-copy-ck-convolution__output-grid" role="grid" aria-label="卷积输出特征图，点击任意区域查看其中的平均响应" style={{ gridTemplateColumns: `repeat(${PREVIEW_WIDTH}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${PREVIEW_HEIGHT}, minmax(0, 1fr))` }}>
        {Array.from({ length: PREVIEW_WIDTH * PREVIEW_HEIGHT }, (_, index) => {
          const rowIndex = Math.floor(index / PREVIEW_WIDTH);
          const colIndex = index % PREVIEW_WIDTH;
          const value = averageAt(rowIndex, colIndex);
          const isSelected = selected.row === rowIndex && selected.col === colIndex;
          return (
            <button shuku-edit-id="e-1d0f3b96-8202-466f-acec-c877c80a1de6"
              type="button"
              key={`${rowIndex}-${colIndex}`}
              className={`aipe-replay-cg-copy-ck-convolution__output-cell ${isSelected ? 'is-selected' : ''}`}
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
    <ContentBlock shuku-edit-id="e-84379aa2-99bc-47e7-a1c0-ca0d81816e41"
      headingLevel={1}
      className="aipe-replay-cg-copy-ck-convolution"
      title="卷积核"
      subtitle="卷积核在输入图像的局部区域上计算响应，并逐位置生成输出特征图。"
    >
      <div shuku-edit-id="e-e666a833-8ad0-4aff-b1bc-6037804ac4a6" className="aipe-replay-cg-copy-ck-convolution__workspace">
        <section shuku-edit-id="e-d9c0d2eb-9b52-47be-8070-42bd2217888d" className="aipe-replay-cg-copy-ck-convolution__flow" aria-label="输入图像、卷积核与输出特征图">
          <div shuku-edit-id="e-f2395aff-cb91-4763-b78d-3604a5f374af" className="aipe-replay-cg-copy-ck-convolution__stage">
            <Typography shuku-edit-id="e-438f66e4-da92-4d74-a2f8-ea07577e90fe" as="h2" variant="h3" tone="accent">输入图像 X</Typography>
            <InputImage selected={selected} imageSrc={data?.inputImageUrl ?? filter.image} data={data} onHover={selectOutput} />
            <Typography shuku-edit-id="e-df96dde1-7983-477b-9f2b-113658598d24" variant="bodySmall" tone="muted" className="aipe-replay-cg-copy-ck-convolution__stage-note">蓝框表示当前参与计算的局部窗口</Typography>
          </div>

          <div shuku-edit-id="e-531388c8-6242-4a7b-ac27-2e8e8e4dacf5" className="aipe-replay-cg-copy-ck-convolution__flow-arrow" aria-hidden="true"><Typography shuku-edit-id="e-bca180b8-265a-49e8-a917-eeee3d0b02f3" as="span" variant="h2" tone="accent">→</Typography></div>

          <div shuku-edit-id="e-bc15a4ac-95a8-488b-bc3b-de2aaa9c7c70" className="aipe-replay-cg-copy-ck-convolution__kernel-stage">
            <Typography shuku-edit-id="e-0a586d02-f3b5-4b13-a637-db245617b145" as="h2" variant="h3" tone="accent">卷积核 W</Typography>
            <Matrix values={filter.kernel} label={`${filter.name}`} className="aipe-replay-cg-copy-ck-convolution__kernel-matrix" />
            <Typography shuku-edit-id="e-872776b5-80ca-4db2-85c5-837b2fe54977" variant="bodySmall" tone="muted">在局部窗口上逐元素相乘并求和</Typography>
          </div>

          <div shuku-edit-id="e-5c02114f-0f82-4cae-902a-0420b0862280" className="aipe-replay-cg-copy-ck-convolution__flow-arrow" aria-hidden="true"><Typography shuku-edit-id="e-2b6ebfa1-0cf5-4d0f-8050-7e998544422b" as="span" variant="h2" tone="accent">→</Typography></div>

          <div shuku-edit-id="e-cc780b57-c892-48f5-89ee-71e1607e31a8" className="aipe-replay-cg-copy-ck-convolution__stage">
            <Typography shuku-edit-id="e-2fcbe345-5988-4b35-a723-63c6a687cc4b" as="h2" variant="h3" tone="accent">输出特征图 Y</Typography>
            {data ? <OutputMap data={data} selected={selected} onSelect={selectOutput} /> : <div shuku-edit-id="e-ebf5abce-d0d1-4381-834f-7080c86972bd" className="aipe-replay-cg-copy-ck-convolution__loading"><Typography shuku-edit-id="e-338062e5-18a1-4722-89c9-d687c5e2c844" variant="bodySmall" tone="muted">正在读取图像…</Typography></div>}
            <Typography shuku-edit-id="e-95dd4e33-0037-42de-a96c-f2a2d44f318a" variant="bodySmall" tone="muted" className="aipe-replay-cg-copy-ck-convolution__stage-note">一个局部窗口对应一个输出位置</Typography>
          </div>
        </section>
      </div>

      <div shuku-edit-id="e-4b0c38bc-d119-40e8-80be-cf6209a7070e" className="aipe-replay-cg-copy-ck-convolution__explanation"><Typography shuku-edit-id="e-a71ac6b7-e2ee-4fb2-8fa2-b52d28ca5a97" variant="body" tone="accent">局部窗口经过卷积核计算得到<strong shuku-edit-id="e-195db257-2fd2-4594-bbcd-49896e1be517">一个响应值</strong>；窗口在输入图像上滑动后，所有响应共同组成<strong shuku-edit-id="e-764e0fac-b962-4eb1-a7ad-d8834532a479">输出特征图</strong>。</Typography></div>
    </ContentBlock>
  );
}
