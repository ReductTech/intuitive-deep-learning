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

  return <ContentBlock shuku-edit-id="e-da404626-62ea-4d5b-9452-03a9e4dac3f0" headingLevel={1} className="cg-copy-ck-deform" title="可变形卷积" subtitle="权重不变，采样位置可偏移。">
    <div shuku-edit-id="e-c6c8f5d0-6ba2-414e-a32b-5efea56e7dc4" className="cg-copy-ck-deform__equation-row">
    <MathFormulaBlock ariaLabel={mode === 'standard' ? '标准卷积在规则采样位置加权求和' : '可变形卷积在偏移后的采样位置加权求和'} className="cg-copy-ck-deform__formula">
      <MathFormulaTerm latex="y(p_0)" tooltip="当前位置的输出响应。" /><MathFormulaStatic latex="=" />
      <MathFormulaTerm latex={String.raw`\sum_{n=1}^{9}`} tooltip="对卷积核的九个采样位置求和。" />
      <MathFormulaTerm latex="w_n" tooltip="第 n 个固定卷积权重；切换模式时权重不变。" />
      <MathFormulaTerm latex="x" tooltip="输入特征图；非整数位置使用双线性插值取值。" /><MathFormulaStatic latex="(" />
      <MathFormulaTerm latex="p_0" tooltip="当前输出位置对应的输入中心。" /><MathFormulaStatic latex="+" />
      <MathFormulaTerm latex="p_n" tooltip="普通三乘三卷积的规则采样偏移。" />
      {mode === 'deformable' && <><MathFormulaStatic latex="+" /><MathFormulaTerm latex={String.raw`\Delta p_n`} tooltip="第 n 个采样位置的额外二维偏移。" /></>}<MathFormulaStatic latex=")" />
    </MathFormulaBlock>
    <div shuku-edit-id="e-145ef8bd-d166-4675-bb37-5041f7e35d60" className="cg-copy-ck-deform__mode" role="group" aria-label="切换卷积采样方式">
      <button shuku-edit-id="e-1b12a8a3-925e-4e9f-9b6d-a14682a8a61b" type="button" className={mode === 'standard' ? 'is-selected' : ''} aria-pressed={mode === 'standard'} onClick={() => setMode('standard')}><Typography shuku-edit-id="e-0cbfe972-cc4b-470f-8880-5c1253591197" as="span" variant="body" tone="inherit">标准卷积</Typography></button>
      <button shuku-edit-id="e-3d32791b-327c-47a6-8f1f-9915bf314e07" type="button" className={mode === 'deformable' ? 'is-selected' : ''} aria-pressed={mode === 'deformable'} onClick={() => setMode('deformable')}><Typography shuku-edit-id="e-6f918d46-3ab6-48e5-b378-6c675fb222f9" as="span" variant="body" tone="inherit">可变形卷积</Typography></button>
    </div>
    </div>
    <div shuku-edit-id="e-5722d956-f189-4132-8fc2-267a604e4ec7" className="cg-copy-ck-deform__workspace">
      <section shuku-edit-id="e-60d62b55-094f-4eec-822d-98c3010ccb1f" className="cg-copy-ck-deform__panel cg-copy-ck-deform__input" aria-label="输入特征图和采样位置">
        <Typography shuku-edit-id="e-c7d4fef7-5972-4295-b1b7-412e3ac1559a" as="h2" variant="h3" tone="accent">输入特征图 · 采样位置</Typography>
        <div shuku-edit-id="e-f0c6e1ec-74bc-444e-b532-e5c24681f127" className="cg-copy-ck-deform__image">
          <canvas shuku-edit-id="e-12646653-1276-4e34-b033-c7dd900323bf" ref={inputCanvas} width={SIZE} height={SIZE} aria-label="弯曲的亮色带输入图像" />
          <div shuku-edit-id="e-0d98375b-befa-456a-960f-1c6ad589a4d9" className="cg-copy-ck-deform__grid-lines" aria-hidden="true" />
          {mode === 'deformable' && originalPoint && selectedOffset && <>
            <svg shuku-edit-id="e-ba1f8d89-0a09-4094-af67-7a0b6dd48fa5" className="cg-copy-ck-deform__offset-guide" viewBox={`0 0 ${SIZE} ${SIZE}`} preserveAspectRatio="none" aria-hidden="true">
              <line shuku-edit-id="e-54e349a3-1035-462b-98df-755249143740" x1={originalPoint.x} y1={originalPoint.y} x2={originalPoint.x + selectedOffset.dx} y2={originalPoint.y + selectedOffset.dy} />
            </svg>
            <span shuku-edit-id="e-e78a0e36-768f-4fd0-a189-feac0ba3e8f7" className="cg-copy-ck-deform__original-point" style={{ left: `${originalPoint.x / SIZE * 100}%`, top: `${originalPoint.y / SIZE * 100}%` }} aria-hidden="true" />
          </>}
          {Array.from({ length: 9 }, (_, index) => {
            const row = Math.floor(index / 3), col = index % 3;
            const baseX = ANCHOR_X + (col - 1) * SAMPLE_STEP;
            const baseY = ANCHOR_Y + (row - 1) * SAMPLE_STEP;
            const offset = offsetAt(mode, ANCHOR_X, ANCHOR_Y, row, col);
            const style = { left: `${(baseX + offset.dx) / SIZE * 100}%`, top: `${(baseY + offset.dy) / SIZE * 100}%` } as CSSProperties;
            return <button shuku-edit-id="e-5af86c44-e7ec-4cf1-81bf-c2482f7bc9c5" key={index} type="button" className={`cg-copy-ck-deform__sample ${hovered === index ? 'is-hovered' : ''}`} style={style} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} aria-label={`第${row + 1}行第${col + 1}列采样点，权重${WEIGHTS[row][col]}/16，水平偏移${offset.dx.toFixed(1)}，垂直偏移${offset.dy.toFixed(1)}`} />;
          })}
        </div>
        <Typography shuku-edit-id="e-82c4d0ed-c22e-47f3-9f23-929829fc51d0" variant="bodySmall" tone="muted">{mode === 'deformable' ? '悬浮蓝点，对照原位。' : '切换模式，观察采样偏移。'}</Typography>
      </section>
      <section shuku-edit-id="e-6a9f52b7-b5dc-40d0-8242-48bcb2e73e6a" className="cg-copy-ck-deform__panel cg-copy-ck-deform__kernel" aria-label="固定卷积核与采样偏移">
        <Typography shuku-edit-id="e-8cb232f7-9353-418b-8d25-cc185eedfcba" as="h2" variant="h3" tone="accent">权重固定 · 位置可变</Typography>
        <div shuku-edit-id="e-e6a5894b-3dcd-4c40-8f07-dcbbfec6777c" className="cg-copy-ck-deform__kernel-grid" role="img" aria-label="三乘三卷积核，权重为一二一、二四二、一二一，整体除以十六">
          {WEIGHTS.flat().map((weight, index) => <span shuku-edit-id="e-f714f804-774a-4ee3-96ec-7b2bc4b71252" key={index}>{weight}</span>)}
        </div>
        <div shuku-edit-id="e-5772876a-5328-4b42-a913-2d9517b7e2b7" className="cg-copy-ck-deform__point-info">
          <Typography shuku-edit-id="e-7a927c80-a95c-4ddc-86d1-f25893f9255f" variant="body" tone="accent">{selectedPoint ? `采样点 ${selectedPoint.row + 1}, ${selectedPoint.col + 1}` : '采样位置'}</Typography>
          <Typography shuku-edit-id="e-548c8eb0-b0f8-4afe-911b-7afda7198938" variant="body" tone="muted">{selectedPoint && selectedOffset ? `w = ${WEIGHTS[selectedPoint.row][selectedPoint.col]}/16 · Δp = (${selectedOffset.dx.toFixed(1)}, ${selectedOffset.dy.toFixed(1)})` : mode === 'standard' ? '规则网格：Δp = (0, 0)' : '示意偏移：蓝点沿局部曲线移动'}</Typography>
        </div>
        <Typography shuku-edit-id="e-a743ecbd-0c68-419c-a44c-280411caedab" variant="body" tone="muted">偏移由网络学习；图中为示意。</Typography>
      </section>
      <section shuku-edit-id="e-1a7a3d45-a61c-43e9-ab66-89e44b31411c" className="cg-copy-ck-deform__panel cg-copy-ck-deform__output" aria-label="卷积输出响应图">
        <Typography shuku-edit-id="e-53f9254f-cb0d-4e5e-9172-03841c879fd4" as="h2" variant="h3" tone="accent">输出响应图</Typography>
        <div shuku-edit-id="e-2c5c67ed-b85f-44a0-9bce-901a20511ff7" className="cg-copy-ck-deform__image"><canvas shuku-edit-id="e-04ed7bee-176c-4b6a-90ae-0a96bde8b21b" ref={outputCanvas} width={SIZE} height={SIZE} aria-label={`${mode === 'standard' ? '标准' : '可变形'}卷积计算得到的响应图`} /></div>
        <Typography shuku-edit-id="e-582f97c7-c38d-42cb-8498-abef501dd43f" variant="bodySmall" tone="muted">按当前采样位置计算。</Typography>
      </section>
    </div>
  </ContentBlock>;
}
