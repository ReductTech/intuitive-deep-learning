import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import './DeformableConvolutionPage.css';

type Mode = 'standard' | 'deformable';
const SIZE = 128;
const SAMPLE_STEP = 8;
const ANCHOR_X = 64;
const WEIGHTS = [[1, 2, 1], [2, 4, 2], [1, 2, 1]];
const curveY = (x: number) => 37 + .48 * x + 18 * Math.sin((x - 15) / 29);
const ANCHOR_Y = curveY(ANCHOR_X);

const input = Float32Array.from({ length: SIZE * SIZE }, (_, index) => {
  const x = index % SIZE, y = Math.floor(index / SIZE);
  const distance = (y - curveY(x)) / 3.5;
  return Math.min(1, .045 + .9 * Math.exp(-distance * distance));
});

function bilinear(x: number, y: number) {
  const left = Math.floor(x), top = Math.floor(y);
  const fx = x - left, fy = y - top;
  const at = (row: number, col: number) => row < 0 || col < 0 || row >= SIZE || col >= SIZE ? 0 : input[row * SIZE + col];
  return at(top, left) * (1 - fx) * (1 - fy) + at(top, left + 1) * fx * (1 - fy)
    + at(top + 1, left) * (1 - fx) * fy + at(top + 1, left + 1) * fx * fy;
}

function offsetAt(mode: Mode, x: number, y: number, row: number, col: number) {
  if (mode === 'standard') return { dx: 0, dy: 0 };
  const horizontal = (col - 1) * SAMPLE_STEP;
  return {
    dx: 1.2 * Math.sin((x + y) * .065 + row * 1.5 + col * .7),
    dy: curveY(x + horizontal) - curveY(x) + .45 * Math.sin(row * 2.1 + col * 1.3),
  };
}

function responseImage(mode: Mode) {
  const pixels = new Uint8ClampedArray(SIZE * SIZE);
  for (let y = 0; y < SIZE; y += 1) for (let x = 0; x < SIZE; x += 1) {
    let response = 0;
    for (let row = 0; row < 3; row += 1) for (let col = 0; col < 3; col += 1) {
      const offset = offsetAt(mode, x, y, row, col);
      response += WEIGHTS[row][col] * bilinear(x + (col - 1) * SAMPLE_STEP + offset.dx, y + (row - 1) * SAMPLE_STEP + offset.dy);
    }
    pixels[y * SIZE + x] = Math.round(Math.pow(response / 16, .78) * 255);
  }
  return pixels;
}

function paint(canvas: HTMLCanvasElement | null, pixels: ArrayLike<number>) {
  const context = canvas?.getContext('2d');
  if (!context) return;
  const image = context.createImageData(SIZE, SIZE);
  for (let index = 0; index < SIZE * SIZE; index += 1) {
    const value = Math.round(pixels[index] * (pixels === input ? 255 : 1));
    image.data[index * 4] = value;
    image.data[index * 4 + 1] = value;
    image.data[index * 4 + 2] = value;
    image.data[index * 4 + 3] = 255;
  }
  context.putImageData(image, 0, 0);
}

export function DeformableConvolutionPage() {
  const [mode, setMode] = useState<Mode>('deformable');
  const [hovered, setHovered] = useState<number | null>(null);
  const inputCanvas = useRef<HTMLCanvasElement>(null);
  const outputCanvas = useRef<HTMLCanvasElement>(null);
  const output = useMemo(() => responseImage(mode), [mode]);
  useEffect(() => { paint(inputCanvas.current, input); }, []);
  useEffect(() => { paint(outputCanvas.current, output); }, [output]);
  const selectedPoint = hovered === null ? null : { row: Math.floor(hovered / 3), col: hovered % 3 };
  const selectedOffset = selectedPoint && offsetAt(mode, ANCHOR_X, ANCHOR_Y, selectedPoint.row, selectedPoint.col);
  const originalPoint = selectedPoint && {
    x: ANCHOR_X + (selectedPoint.col - 1) * SAMPLE_STEP,
    y: ANCHOR_Y + (selectedPoint.row - 1) * SAMPLE_STEP,
  };

  return <ContentBlock shuku-edit-id="e-f68281d1-f457-47d3-9594-7091fa9c94d6" headingLevel={1} className="cg-copy-ck-deform" title="可变形卷积" subtitle="权重不变，采样位置可偏移。">
    <div shuku-edit-id="e-ebc57970-ef6f-4034-b8b4-37c194e1e149" className="cg-copy-ck-deform__equation-row">
    <MathFormulaBlock ariaLabel={mode === 'standard' ? '标准卷积在规则采样位置加权求和' : '可变形卷积在偏移后的采样位置加权求和'} className="cg-copy-ck-deform__formula">
      <MathFormulaTerm latex="y(p_0)" tooltip="当前位置的输出响应。" /><MathFormulaStatic latex="=" />
      <MathFormulaTerm latex={String.raw`\sum_{n=1}^{9}`} tooltip="对卷积核的九个采样位置求和。" />
      <MathFormulaTerm latex="w_n" tooltip="第 n 个固定卷积权重；切换模式时权重不变。" />
      <MathFormulaTerm latex="x" tooltip="输入特征图；非整数位置使用双线性插值取值。" /><MathFormulaStatic latex="(" />
      <MathFormulaTerm latex="p_0" tooltip="当前输出位置对应的输入中心。" /><MathFormulaStatic latex="+" />
      <MathFormulaTerm latex="p_n" tooltip="普通三乘三卷积的规则采样偏移。" />
      {mode === 'deformable' && <><MathFormulaStatic latex="+" /><MathFormulaTerm latex={String.raw`\Delta p_n`} tooltip="第 n 个采样位置的额外二维偏移。" /></>}<MathFormulaStatic latex=")" />
    </MathFormulaBlock>
    <div shuku-edit-id="e-8c3fd878-f1a7-4b7f-a188-523c03a908e7" className="cg-copy-ck-deform__mode" role="group" aria-label="切换卷积采样方式">
      <button shuku-edit-id="e-73268a01-be51-45b5-ac9f-11012cb29c74" type="button" className={mode === 'standard' ? 'is-selected' : ''} aria-pressed={mode === 'standard'} onClick={() => setMode('standard')}><Typography shuku-edit-id="e-febb009e-3125-4439-8d32-548aee4b7c74" as="span" variant="body" tone="inherit">标准卷积</Typography></button>
      <button shuku-edit-id="e-9bf3558d-9bd1-47b6-9bac-9cc6806feb7e" type="button" className={mode === 'deformable' ? 'is-selected' : ''} aria-pressed={mode === 'deformable'} onClick={() => setMode('deformable')}><Typography shuku-edit-id="e-3af187f1-fa64-4139-b6b9-8f5b5632f7a7" as="span" variant="body" tone="inherit">可变形卷积</Typography></button>
    </div>
    </div>
    <div shuku-edit-id="e-a457b53f-cd5c-4638-bc38-d5f28d913360" className="cg-copy-ck-deform__workspace">
      <section shuku-edit-id="e-c3bbace4-82c7-4612-86a9-10c8c1155a86" className="cg-copy-ck-deform__panel cg-copy-ck-deform__input" aria-label="输入特征图和采样位置">
        <Typography shuku-edit-id="e-cc678534-c9fe-4141-97e4-9621e91c53c3" as="h2" variant="h3" tone="accent">输入特征图 · 采样位置</Typography>
        <div shuku-edit-id="e-38588019-a902-43a6-a3e5-b8ecb395728a" className="cg-copy-ck-deform__image">
          <canvas shuku-edit-id="e-bfc84dc2-7462-4b7d-aea4-1bafda4359ae" ref={inputCanvas} width={SIZE} height={SIZE} aria-label="弯曲的亮色带输入图像" />
          <div shuku-edit-id="e-a00173e1-562c-43dd-9b4d-87e7a7c8d016" className="cg-copy-ck-deform__grid-lines" aria-hidden="true" />
          {mode === 'deformable' && originalPoint && selectedOffset && <>
            <svg shuku-edit-id="e-21a66290-774f-4fc1-a5d8-5d510a7f86f3" className="cg-copy-ck-deform__offset-guide" viewBox={`0 0 ${SIZE} ${SIZE}`} preserveAspectRatio="none" aria-hidden="true">
              <line shuku-edit-id="e-27cc6c3b-e28a-4b7e-90df-0bdf3304a8c1" x1={originalPoint.x} y1={originalPoint.y} x2={originalPoint.x + selectedOffset.dx} y2={originalPoint.y + selectedOffset.dy} />
            </svg>
            <span shuku-edit-id="e-b8cc0c64-21f1-40db-af56-8715cc55027c" className="cg-copy-ck-deform__original-point" style={{ left: `${originalPoint.x / SIZE * 100}%`, top: `${originalPoint.y / SIZE * 100}%` }} aria-hidden="true" />
          </>}
          {Array.from({ length: 9 }, (_, index) => {
            const row = Math.floor(index / 3), col = index % 3;
            const baseX = ANCHOR_X + (col - 1) * SAMPLE_STEP;
            const baseY = ANCHOR_Y + (row - 1) * SAMPLE_STEP;
            const offset = offsetAt(mode, ANCHOR_X, ANCHOR_Y, row, col);
            const style = { left: `${(baseX + offset.dx) / SIZE * 100}%`, top: `${(baseY + offset.dy) / SIZE * 100}%` } as CSSProperties;
            return <button shuku-edit-id="e-3731da0f-a1cc-409a-9f8a-20e531e46372" key={index} type="button" className={`cg-copy-ck-deform__sample ${hovered === index ? 'is-hovered' : ''}`} style={style} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} aria-label={`第${row + 1}行第${col + 1}列采样点，权重${WEIGHTS[row][col]}/16，水平偏移${offset.dx.toFixed(1)}，垂直偏移${offset.dy.toFixed(1)}`} />;
          })}
        </div>
        <Typography shuku-edit-id="e-47c8a53c-2203-406d-be3f-2739911f5ac9" variant="bodySmall" tone="muted">{mode === 'deformable' ? '悬浮蓝点，对照原位。' : '切换模式，观察采样偏移。'}</Typography>
      </section>
      <section shuku-edit-id="e-ed373dff-f6c2-44f3-b21d-ac85623d4eb8" className="cg-copy-ck-deform__panel cg-copy-ck-deform__kernel" aria-label="固定卷积核与采样偏移">
        <Typography shuku-edit-id="e-58b5f109-7087-48ab-b885-8045b5ebe8d5" as="h2" variant="h3" tone="accent">权重固定 · 位置可变</Typography>
        <div shuku-edit-id="e-f77354d4-623b-4cde-a878-9dee102b8b52" className="cg-copy-ck-deform__kernel-grid" role="img" aria-label="三乘三卷积核，权重为一二一、二四二、一二一，整体除以十六">
          {WEIGHTS.flat().map((weight, index) => <span shuku-edit-id="e-a9ba762a-a0ef-4534-8920-045e873b4ac5" key={index}>{weight}</span>)}
        </div>
        <div shuku-edit-id="e-cb85af96-65d5-44ac-93ae-f734442dcb95" className="cg-copy-ck-deform__point-info">
          <Typography shuku-edit-id="e-ca3a0adb-969c-42d5-a9d0-228a45f5f212" variant="body" tone="accent">{selectedPoint ? `采样点 ${selectedPoint.row + 1}, ${selectedPoint.col + 1}` : '采样位置'}</Typography>
          <Typography shuku-edit-id="e-8ee6be96-0049-4650-ac8d-be01bdf7ea46" variant="body" tone="muted">{selectedPoint && selectedOffset ? `w = ${WEIGHTS[selectedPoint.row][selectedPoint.col]}/16 · Δp = (${selectedOffset.dx.toFixed(1)}, ${selectedOffset.dy.toFixed(1)})` : mode === 'standard' ? '规则网格：Δp = (0, 0)' : '示意偏移：蓝点沿局部曲线移动'}</Typography>
        </div>
        <Typography shuku-edit-id="e-8d3c8eab-9f2c-44f3-947d-0d242ebdcb2f" variant="body" tone="muted">偏移由网络学习；图中为示意。</Typography>
      </section>
      <section shuku-edit-id="e-d39891e8-7322-40b9-816b-512891e55f6b" className="cg-copy-ck-deform__panel cg-copy-ck-deform__output" aria-label="卷积输出响应图">
        <Typography shuku-edit-id="e-99ba9f12-a804-49ac-b96c-8399f03a4b47" as="h2" variant="h3" tone="accent">输出响应图</Typography>
        <div shuku-edit-id="e-b8b514d1-5195-4dfd-91f3-d4d49f892165" className="cg-copy-ck-deform__image"><canvas shuku-edit-id="e-9e7fa092-6f90-4a3c-8630-cb0e1872109e" ref={outputCanvas} width={SIZE} height={SIZE} aria-label={`${mode === 'standard' ? '标准' : '可变形'}卷积计算得到的响应图`} /></div>
        <Typography shuku-edit-id="e-54b100ea-11a3-4f66-a213-23fc5e8f3f8d" variant="bodySmall" tone="muted">按当前采样位置计算。</Typography>
      </section>
    </div>
  </ContentBlock>;
}
