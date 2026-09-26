import { useEffect, useRef, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import cityImage from '../../assets/mengdelian.png';
import bridgeImage from '../../assets/xielaqiao.png';
import { useGomokuOutcome } from '../../LessonContext';
import './KernelBasicsPage.css';

const GRID_WIDTH = 16;
const GRID_HEIGHT = 9;
const KERNEL_SIZE = 3;
const INPUT_WIDTH = 370;
const DISPLAY_SCALE = 3;
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
    <div className={`ck-convolution__matrix ${className}`} role="img" aria-label={label} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }}>
      {values.flatMap((row, rowIndex) => row.map((value, colIndex) => (
        <div key={`${rowIndex}-${colIndex}`} className={`ck-convolution__matrix-cell ${value < 0 ? 'is-negative' : ''} ${value > 0 ? 'is-positive' : ''}`}>
          <Typography as="span" variant="bodySmall" tone={value === 0 ? 'muted' : 'inherit'} aria-hidden="true">{value}</Typography>
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
    <div className="ck-convolution__image-frame">
      <img src={imageSrc} alt="缩小后的灰度图，用于卷积演示" />
      {patchStyle && <div className="ck-convolution__patch" style={patchStyle} aria-hidden="true" />}
      <div
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

/** Fixed signed scale for every image: negative is dark, zero is mid gray, positive is light. */
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
    output.forEach((value, index) => {
      const rowIndex = Math.floor(index / width);
      const colIndex = index % width;
      const normalized = Math.max(-1, Math.min(1, value / DISPLAY_SCALE));
      const gray = Math.round((normalized + 1) * 127.5);
      const offset = (rowIndex * width + colIndex) * 4;
      pixels.data[offset] = gray;
      pixels.data[offset + 1] = gray;
      pixels.data[offset + 2] = gray;
      pixels.data[offset + 3] = 255;
    });
    context.putImageData(pixels, 0, 0);
  }, [output, width, height]);

  return <canvas ref={canvasRef} className="ck-convolution__output-canvas" aria-hidden="true" />;
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
    <div className="ck-convolution__output-map" style={{ aspectRatio: `${data.outputWidth} / ${data.outputHeight}` }}>
      <ResponseCanvas output={data.output} width={data.outputWidth} height={data.outputHeight} />
      <div className="ck-convolution__output-grid" role="grid" aria-label="卷积输出特征图，点击任意区域查看其中的平均响应" style={{ gridTemplateColumns: `repeat(${PREVIEW_WIDTH}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${PREVIEW_HEIGHT}, minmax(0, 1fr))` }}>
        {Array.from({ length: PREVIEW_WIDTH * PREVIEW_HEIGHT }, (_, index) => {
          const rowIndex = Math.floor(index / PREVIEW_WIDTH);
          const colIndex = index % PREVIEW_WIDTH;
          const value = averageAt(rowIndex, colIndex);
          const isSelected = selected.row === rowIndex && selected.col === colIndex;
          return (
            <button
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
    <ContentBlock
      headingLevel={1}
      className="ck-convolution"
      title="卷积核"
      subtitle="卷积核是一个较小的权重矩阵，用来提取输入图像中的局部模式。"
    >
      <div className="ck-convolution__workspace">
        <section className="ck-convolution__flow" aria-label="输入图像、卷积核与输出特征图">
          <div className="ck-convolution__stage">
            <Typography as="h2" variant="h3" tone="accent">输入图像 X</Typography>
            <Typography variant="bodySmall" tone="muted">缩小后的灰度图 · 每次读取 3×3 像素</Typography>
            <InputImage selected={selected} imageSrc={data?.inputImageUrl ?? filter.image} data={data} onHover={selectOutput} />
            <Typography variant="bodySmall" tone="muted" className="ck-convolution__stage-note">蓝框：右侧所选区域读取的输入范围</Typography>
          </div>

          <div className="ck-convolution__flow-arrow" aria-hidden="true"><Typography as="span" variant="h2" tone="accent">→</Typography></div>

          <div className="ck-convolution__kernel-stage">
            <Typography as="h2" variant="h3" tone="accent">卷积核 W</Typography>
            <Typography variant="bodySmall" tone="muted">{filter.name}</Typography>
            <Matrix values={filter.kernel} label={`${filter.name}`} className="ck-convolution__kernel-matrix" />
          </div>

          <div className="ck-convolution__flow-arrow" aria-hidden="true"><Typography as="span" variant="h2" tone="accent">→</Typography></div>

          <div className="ck-convolution__stage">
            <Typography as="h2" variant="h3" tone="accent">输出特征图 Y</Typography>
            <Typography variant="bodySmall" tone="muted">统一 ±3：浅正 · 深负 · 中灰零</Typography>
            {data ? <OutputMap data={data} selected={selected} onSelect={selectOutput} /> : <div className="ck-convolution__loading"><Typography variant="bodySmall" tone="muted">正在读取图像…</Typography></div>}
            <Typography variant="bodySmall" tone="muted" className="ck-convolution__stage-note">悬浮或点击，查看对应输入范围</Typography>
          </div>
        </section>
      </div>

      <div className="ck-convolution__explanation">
        <div className="ck-convolution__definition">
          <div className="ck-convolution__definition-label"><Typography as="span" variant="h3" tone="accent">定义</Typography></div>
          <div className="ck-convolution__definition-copy">
            <Typography variant="body">卷积核 <strong>W</strong> 在输入图像 <strong>X</strong> 的局部区域上滑动，逐元素相乘并求和，得到输出值 <strong>Y</strong>。</Typography>
            <Typography variant="bodySmall" tone="muted">一个局部窗口对应输出特征图中的一个位置。</Typography>
          </div>
          <MathFormulaBlock ariaLabel="二维互相关公式" className="ck-convolution__definition-formula">
            <MathFormulaTerm latex="Y_{i,j}" tooltip="Y：输出特征图在位置 i,j 的值。" ariaLabel="Y i j，输出值" />
            <MathFormulaStatic latex="=" />
            <MathFormulaStatic latex="\sum_{u=0}^{K_h-1}\sum_{v=0}^{K_w-1}" />
            <MathFormulaTerm latex="W_{u,v}" tooltip="W：卷积核中的权重。" ariaLabel="W u v，卷积核权重" />
            <MathFormulaTerm latex="X_{i+u,j+v}" tooltip="X：输入图像中对应局部窗口的像素。" ariaLabel="X i 加 u，j 加 v，输入像素" />
          </MathFormulaBlock>
        </div>
        <aside className="ck-convolution__features" aria-labelledby="convolution-features-title">
          <Typography as="h2" variant="h3" tone="accent" id="convolution-features-title">卷积核的关键特征</Typography>
          <div className="ck-convolution__feature-list">
            <div className="ck-convolution__feature-item">
              <span className="ck-convolution__feature-number">1</span>
              <div><Typography as="h3" variant="h3" tone="accent">尺寸</Typography><Typography variant="bodySmall" tone="muted">卷积核只看输入中的一个小窗口。</Typography></div>
            </div>
            <div className="ck-convolution__feature-item">
              <span className="ck-convolution__feature-number">2</span>
              <div><Typography as="h3" variant="h3" tone="accent">权重</Typography><Typography variant="bodySmall" tone="muted">每个元素都是可正可负的权重，用于强调或抑制不同位置。</Typography></div>
            </div>
            <div className="ck-convolution__feature-item">
              <span className="ck-convolution__feature-number">3</span>
              <div><Typography as="h3" variant="h3" tone="accent">局部作用</Typography><Typography variant="bodySmall" tone="muted">卷积核在输入上移动，把每个局部窗口变成一个响应值。</Typography></div>
            </div>
          </div>
        </aside>
      </div>
    </ContentBlock>
  );
}
