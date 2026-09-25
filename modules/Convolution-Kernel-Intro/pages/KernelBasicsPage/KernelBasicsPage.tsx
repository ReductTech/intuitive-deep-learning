import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import buildingImage from '../../assets/xiandaijianzhu.png';
import './KernelBasicsPage.css';

const GRID_WIDTH = 16;
const GRID_HEIGHT = 9;
const KERNEL_SIZE = 3;
const INITIAL_POSITION = { row: 3, col: 6 };

/** W is the mathematical kernel. Strict convolution applies W after a 180-degree rotation. */
const KERNEL = [
  [-1, -1, -1],
  [0, 0, 0],
  [1, 1, 1],
];
const ROTATED_KERNEL = KERNEL.slice().reverse().map((row) => row.slice().reverse());

interface ConvolutionData {
  input: number[][];
  output: number[][];
  outputAbsMax: number;
}

function strictConvolution(input: number[][], kernel: number[][]): ConvolutionData {
  const outputHeight = input.length - kernel.length + 1;
  const outputWidth = input[0].length - kernel[0].length + 1;
  const output = Array.from({ length: outputHeight }, (_, row) => Array.from({ length: outputWidth }, (_, col) => {
    let sum = 0;
    for (let kernelRow = 0; kernelRow < kernel.length; kernelRow += 1) {
      for (let kernelCol = 0; kernelCol < kernel[0].length; kernelCol += 1) {
        // Y[i,j] = sum W[u,v] X[i-u,j-v]. The patch is indexed from its top-left corner.
        sum += kernel[kernelRow][kernelCol]
          * input[row + kernel.length - 1 - kernelRow][col + kernel[0].length - 1 - kernelCol];
      }
    }
    return sum;
  }));
  const outputAbsMax = Math.max(1, ...output.flat().map((value) => Math.abs(value)));
  return { input, output, outputAbsMax };
}

function useConvolutionData(): ConvolutionData | null {
  const [data, setData] = useState<ConvolutionData | null>(null);

  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      const canvas = document.createElement('canvas');
      canvas.width = GRID_WIDTH;
      canvas.height = GRID_HEIGHT;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      context.drawImage(image, 0, 0, GRID_WIDTH, GRID_HEIGHT);
      const pixels = context.getImageData(0, 0, GRID_WIDTH, GRID_HEIGHT).data;
      const input = Array.from({ length: GRID_HEIGHT }, (_, row) => Array.from({ length: GRID_WIDTH }, (_, col) => {
        const offset = (row * GRID_WIDTH + col) * 4;
        return (0.299 * pixels[offset] + 0.587 * pixels[offset + 1] + 0.114 * pixels[offset + 2]) / 255;
      }));
      setData(strictConvolution(input, KERNEL));
    };
    image.src = buildingImage;
    return () => { active = false; };
  }, []);

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

function InputImage({ selected }: { selected: { row: number; col: number } }) {
  const patchStyle = {
    left: `${selected.col / GRID_WIDTH * 100}%`,
    top: `${selected.row / GRID_HEIGHT * 100}%`,
    width: `${KERNEL_SIZE / GRID_WIDTH * 100}%`,
    height: `${KERNEL_SIZE / GRID_HEIGHT * 100}%`,
  };
  return (
    <div className="ck-convolution__image-frame">
      <img src={buildingImage} alt="用于卷积演示的现代建筑灰度图" />
      <div className="ck-convolution__image-grid" aria-hidden="true">
        {Array.from({ length: GRID_WIDTH * GRID_HEIGHT }, (_, index) => <span key={index} />)}
      </div>
      <div className="ck-convolution__patch" style={patchStyle} aria-hidden="true" />
    </div>
  );
}

function OutputMap({ data, selected, onSelect }: { data: ConvolutionData; selected: { row: number; col: number }; onSelect: (position: { row: number; col: number }) => void }) {
  return (
    <div className="ck-convolution__output-map" role="grid" aria-label="卷积输出特征图，点击任意位置查看该位置的计算">
      {data.output.flatMap((row, rowIndex) => row.map((value, colIndex) => {
        const intensity = Math.min(1, Math.abs(value) / data.outputAbsMax);
        const style = { '--response-alpha': String(0.08 + intensity * 0.82), '--response-color': value >= 0 ? '240, 126, 71' : '39, 68, 110' } as CSSProperties;
        const isSelected = selected.row === rowIndex && selected.col === colIndex;
        return (
          <button
            type="button"
            key={`${rowIndex}-${colIndex}`}
            className={`ck-convolution__output-cell ${isSelected ? 'is-selected' : ''}`}
            style={style}
            onClick={() => onSelect({ row: rowIndex, col: colIndex })}
            aria-label={`输出第 ${rowIndex + 1} 行第 ${colIndex + 1} 列，值 ${value.toFixed(2)}`}
          >
            <Typography as="span" variant="bodySmall" tone="inherit" aria-hidden="true">{value.toFixed(1)}</Typography>
          </button>
        );
      }))}
    </div>
  );
}

export interface KernelBasicsPageProps {
  onComplete: () => void;
}

export function KernelBasicsPage({ onComplete }: KernelBasicsPageProps) {
  const data = useConvolutionData();
  const [selected, setSelected] = useState(INITIAL_POSITION);
  const completedRef = useRef(false);
  const patch = useMemo(() => data
    ? data.input.slice(selected.row, selected.row + KERNEL_SIZE).map((row) => row.slice(selected.col, selected.col + KERNEL_SIZE))
    : [], [data, selected]);
  const selectedValue = data?.output[selected.row]?.[selected.col] ?? 0;

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
      subtitle="严格卷积：先将卷积核旋转 180°，再在局部区域逐元素相乘并求和。"
    >
      <div className="ck-convolution__definition">
        <div className="ck-convolution__definition-label"><Typography as="span" variant="h3" tone="accent">定义</Typography></div>
        <div className="ck-convolution__definition-copy">
          <Typography variant="body">二维离散卷积用一个较小的权重矩阵 <strong>W</strong>，在输入图像 <strong>X</strong> 的局部区域上滑动，得到输出特征图 <strong>Y</strong>。</Typography>
          <Typography variant="bodySmall" tone="muted">这里采用 valid 边界：不补零，只保留卷积核完全落在图像内部的位置。</Typography>
        </div>
        <MathFormulaBlock ariaLabel="严格二维离散卷积公式" className="ck-convolution__definition-formula">
          <MathFormulaTerm latex="Y_{i,j}" tooltip="Y：输出特征图在位置 i,j 的值。" ariaLabel="Y i j，输出值" />
          <MathFormulaStatic latex="=" />
          <MathFormulaStatic latex="\sum_{u=0}^{K_h-1}\sum_{v=0}^{K_w-1}" />
          <MathFormulaTerm latex="W_{u,v}" tooltip="W：原始卷积核中的权重。" ariaLabel="W u v，卷积核权重" />
          <MathFormulaTerm latex="X_{i-u,j-v}" tooltip="X：输入图像；索引反向体现严格卷积。" ariaLabel="X i 减 u，j 减 v，输入像素" />
        </MathFormulaBlock>
      </div>

      <div className="ck-convolution__workspace">
        <section className="ck-convolution__flow" aria-label="输入图像、卷积核与输出特征图">
          <div className="ck-convolution__stage">
            <Typography as="h2" variant="h3" tone="accent">输入图像 X</Typography>
            <Typography variant="bodySmall" tone="muted">灰度图，单通道 · {GRID_WIDTH} × {GRID_HEIGHT}</Typography>
            <InputImage selected={selected} />
            <Typography variant="bodySmall" tone="muted" className="ck-convolution__stage-note">蓝框：当前取出的局部区域</Typography>
          </div>

          <div className="ck-convolution__flow-arrow" aria-hidden="true"><Typography as="span" variant="h2" tone="accent">→</Typography></div>

          <div className="ck-convolution__kernel-stage">
            <Typography as="h2" variant="h3" tone="accent">卷积核 W</Typography>
            <Typography variant="bodySmall" tone="muted">3 × 3 · 水平边缘核</Typography>
            <Matrix values={KERNEL} label="原始卷积核 W" className="ck-convolution__kernel-matrix" />
            <Typography variant="bodySmall" tone="muted" className="ck-convolution__rotate-note">旋转 180° 后参与计算</Typography>
            <Matrix values={ROTATED_KERNEL} label="旋转 180 度后的卷积核" className="ck-convolution__kernel-matrix ck-convolution__kernel-matrix--rotated" />
          </div>

          <div className="ck-convolution__flow-arrow" aria-hidden="true"><Typography as="span" variant="h2" tone="accent">→</Typography></div>

          <div className="ck-convolution__stage">
            <Typography as="h2" variant="h3" tone="accent">输出特征图 Y</Typography>
            <Typography variant="bodySmall" tone="muted">响应强度 · {GRID_WIDTH - 2} × {GRID_HEIGHT - 2}</Typography>
            {data ? <OutputMap data={data} selected={selected} onSelect={selectOutput} /> : <div className="ck-convolution__loading"><Typography variant="bodySmall" tone="muted">正在读取图像…</Typography></div>}
            <Typography variant="bodySmall" tone="muted" className="ck-convolution__stage-note">点击任意格子，查看这一格是怎样得到的</Typography>
          </div>
        </section>

        <aside className="ck-convolution__calculation" aria-labelledby="convolution-calculation-title">
          <Typography as="h2" variant="h3" tone="accent" id="convolution-calculation-title">当前位置的计算</Typography>
          <Typography variant="bodySmall" tone="muted">输入局部与旋转后的卷积核逐位置相乘，再把所有乘积相加。</Typography>
          {patch.length > 0 && (
            <div className="ck-convolution__selected-calculation">
              <div className="ck-convolution__selected-matrices">
                <div><Typography variant="bodySmall" tone="muted">输入局部</Typography><Matrix values={patch} label="当前选中的输入局部" className="ck-convolution__small-matrix" /></div>
                <Typography as="span" variant="h3" tone="accent" aria-hidden="true">×</Typography>
                <div><Typography variant="bodySmall" tone="muted">旋转后的核</Typography><Matrix values={ROTATED_KERNEL} label="当前计算使用的旋转卷积核" className="ck-convolution__small-matrix" /></div>
              </div>
              <MathFormulaBlock ariaLabel="当前输出位置的卷积求和" className="ck-convolution__calculation-formula">
                <MathFormulaTerm latex="Y_{i,j}" tooltip="当前输出位置的值。" ariaLabel="当前输出值" />
                <MathFormulaStatic latex="=" />
                <MathFormulaStatic latex="\sum" />
                <MathFormulaStatic latex="W_{u,v}X_{i-u,j-v}" />
                <MathFormulaStatic latex="=" />
                <MathFormulaTerm latex={selectedValue.toFixed(2)} tooltip="当前窗口的真实卷积结果。" ariaLabel={`当前卷积结果 ${selectedValue.toFixed(2)}`} tone="warm" />
              </MathFormulaBlock>
              <Typography variant="bodySmall" tone="muted">当前输出位置：({selected.row + 1}, {selected.col + 1}) · 数值：<strong className="ck-convolution__value">{selectedValue.toFixed(2)}</strong></Typography>
            </div>
          )}
          <div className="ck-convolution__strict-note"><Typography variant="bodySmall" tone="accent">严格卷积的关键：</Typography><Typography variant="bodySmall" tone="muted">原核先旋转 180°，所以参与计算的是右侧显示的旋转核。</Typography></div>
        </aside>
      </div>
    </ContentBlock>
  );
}
