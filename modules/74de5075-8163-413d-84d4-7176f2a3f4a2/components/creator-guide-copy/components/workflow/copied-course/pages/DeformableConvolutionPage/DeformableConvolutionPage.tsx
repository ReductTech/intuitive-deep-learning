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

  return <ContentBlock shuku-edit-id="e-9d106319-8f65-47ee-a2fa-7ffe15db0e71" headingLevel={1} className="aipe-replay-cg-copy-ck-deform" title="可变形卷积" subtitle="权重不变，采样位置可偏移。">
    <div shuku-edit-id="e-d48d4e8e-1acd-44ee-80f2-69b787e39c0b" className="aipe-replay-cg-copy-ck-deform__equation-row">
    <MathFormulaBlock ariaLabel={mode === 'standard' ? '标准卷积在规则采样位置加权求和' : '可变形卷积在偏移后的采样位置加权求和'} className="aipe-replay-cg-copy-ck-deform__formula">
      <MathFormulaTerm latex="y(p_0)" tooltip="当前位置的输出响应。" /><MathFormulaStatic latex="=" />
      <MathFormulaTerm latex={String.raw`\sum_{n=1}^{9}`} tooltip="对卷积核的九个采样位置求和。" />
      <MathFormulaTerm latex="w_n" tooltip="第 n 个固定卷积权重；切换模式时权重不变。" />
      <MathFormulaTerm latex="x" tooltip="输入特征图；非整数位置使用双线性插值取值。" /><MathFormulaStatic latex="(" />
      <MathFormulaTerm latex="p_0" tooltip="当前输出位置对应的输入中心。" /><MathFormulaStatic latex="+" />
      <MathFormulaTerm latex="p_n" tooltip="普通三乘三卷积的规则采样偏移。" />
      {mode === 'deformable' && <><MathFormulaStatic latex="+" /><MathFormulaTerm latex={String.raw`\Delta p_n`} tooltip="第 n 个采样位置的额外二维偏移。" /></>}<MathFormulaStatic latex=")" />
    </MathFormulaBlock>
    <div shuku-edit-id="e-aef6a27a-e7a4-49a2-aa59-e5072d827be0" className="aipe-replay-cg-copy-ck-deform__mode" role="group" aria-label="切换卷积采样方式">
      <button shuku-edit-id="e-1412e9ee-a459-4c02-b73e-929a738d2123" type="button" className={mode === 'standard' ? 'is-selected' : ''} aria-pressed={mode === 'standard'} onClick={() => setMode('standard')}><Typography shuku-edit-id="e-de6066eb-082f-4c46-ac2f-02c38f538fe2" as="span" variant="body" tone="inherit">标准卷积</Typography></button>
      <button shuku-edit-id="e-8d506955-5959-451c-bf9a-f61d9cb508e6" type="button" className={mode === 'deformable' ? 'is-selected' : ''} aria-pressed={mode === 'deformable'} onClick={() => setMode('deformable')}><Typography shuku-edit-id="e-3c51fdd3-6d8e-4804-814d-b95dfc792470" as="span" variant="body" tone="inherit">可变形卷积</Typography></button>
    </div>
    </div>
    <div shuku-edit-id="e-8e5bcc6e-98da-4e9f-9fa6-72d09a8c86c1" className="aipe-replay-cg-copy-ck-deform__workspace">
      <section shuku-edit-id="e-ff59bff3-180b-42a1-ac85-7af3ec9e1f81" className="aipe-replay-cg-copy-ck-deform__panel aipe-replay-cg-copy-ck-deform__input" aria-label="输入特征图和采样位置">
        <Typography shuku-edit-id="e-3bd98acf-3fd2-4cf4-8d11-64adf646dde3" as="h2" variant="h3" tone="accent">输入特征图 · 采样位置</Typography>
        <div shuku-edit-id="e-ca86a96f-f4d2-4b0b-8cad-4d5049b821e1" className="aipe-replay-cg-copy-ck-deform__image">
          <canvas shuku-edit-id="e-9f525339-b6e8-436e-b2f0-f12afc7e92fc" ref={inputCanvas} width={SIZE} height={SIZE} aria-label="弯曲的亮色带输入图像" />
          <div shuku-edit-id="e-6970ee1b-614e-4f73-913e-0482cc6e0f3d" className="aipe-replay-cg-copy-ck-deform__grid-lines" aria-hidden="true" />
          {mode === 'deformable' && originalPoint && selectedOffset && <>
            <svg shuku-edit-id="e-8de9d8c1-f656-4991-a851-218ae7c6ab48" className="aipe-replay-cg-copy-ck-deform__offset-guide" viewBox={`0 0 ${SIZE} ${SIZE}`} preserveAspectRatio="none" aria-hidden="true">
              <line shuku-edit-id="e-5bc53d76-7e42-4f24-bd2c-00fade8f9aa8" x1={originalPoint.x} y1={originalPoint.y} x2={originalPoint.x + selectedOffset.dx} y2={originalPoint.y + selectedOffset.dy} />
            </svg>
            <span shuku-edit-id="e-4215f6c9-7767-489d-8ca4-9772046e41be" className="aipe-replay-cg-copy-ck-deform__original-point" style={{ left: `${originalPoint.x / SIZE * 100}%`, top: `${originalPoint.y / SIZE * 100}%` }} aria-hidden="true" />
          </>}
          {Array.from({ length: 9 }, (_, index) => {
            const row = Math.floor(index / 3), col = index % 3;
            const baseX = ANCHOR_X + (col - 1) * SAMPLE_STEP;
            const baseY = ANCHOR_Y + (row - 1) * SAMPLE_STEP;
            const offset = offsetAt(mode, ANCHOR_X, ANCHOR_Y, row, col);
            const style = { left: `${(baseX + offset.dx) / SIZE * 100}%`, top: `${(baseY + offset.dy) / SIZE * 100}%` } as CSSProperties;
            return <button shuku-edit-id="e-531edf6f-6ff6-4bd3-9712-257f11fd4418" key={index} type="button" className={`aipe-replay-cg-copy-ck-deform__sample ${hovered === index ? 'is-hovered' : ''}`} style={style} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} aria-label={`第${row + 1}行第${col + 1}列采样点，权重${WEIGHTS[row][col]}/16，水平偏移${offset.dx.toFixed(1)}，垂直偏移${offset.dy.toFixed(1)}`} />;
          })}
        </div>
        <Typography shuku-edit-id="e-3c8b0065-f545-4fba-b19f-ce9c587c607d" variant="bodySmall" tone="muted">{mode === 'deformable' ? '悬浮蓝点，对照原位。' : '切换模式，观察采样偏移。'}</Typography>
      </section>
      <section shuku-edit-id="e-12cc4060-ed4e-41b3-828f-e0d1ea140c52" className="aipe-replay-cg-copy-ck-deform__panel aipe-replay-cg-copy-ck-deform__kernel" aria-label="固定卷积核与采样偏移">
        <Typography shuku-edit-id="e-f158ea8c-fee3-450e-b02f-2bcfe1c663e2" as="h2" variant="h3" tone="accent">权重固定 · 位置可变</Typography>
        <div shuku-edit-id="e-f2ce2ffc-5b29-4056-bf2a-dd329ae79abc" className="aipe-replay-cg-copy-ck-deform__kernel-grid" role="img" aria-label="三乘三卷积核，权重为一二一、二四二、一二一，整体除以十六">
          {WEIGHTS.flat().map((weight, index) => <span shuku-edit-id="e-f505a2b4-2792-472d-9f20-90a8c755db25" key={index}>{weight}</span>)}
        </div>
        <div shuku-edit-id="e-c82827f3-6cac-4206-97f5-b75d2e8a53f2" className="aipe-replay-cg-copy-ck-deform__point-info">
          <Typography shuku-edit-id="e-ca07bab9-1a4e-48de-9770-6eb0313a858e" variant="body" tone="accent">{selectedPoint ? `采样点 ${selectedPoint.row + 1}, ${selectedPoint.col + 1}` : '采样位置'}</Typography>
          <Typography shuku-edit-id="e-5f030377-a2ad-436c-8987-2a274b87add4" variant="body" tone="muted">{selectedPoint && selectedOffset ? `w = ${WEIGHTS[selectedPoint.row][selectedPoint.col]}/16 · Δp = (${selectedOffset.dx.toFixed(1)}, ${selectedOffset.dy.toFixed(1)})` : mode === 'standard' ? '规则网格：Δp = (0, 0)' : '示意偏移：蓝点沿局部曲线移动'}</Typography>
        </div>
        <Typography shuku-edit-id="e-71176374-ae0d-4b8c-a8a6-2e619943b5f8" variant="body" tone="muted">偏移由网络学习；图中为示意。</Typography>
      </section>
      <section shuku-edit-id="e-02dd13d8-fd75-4935-a115-9a40e05560fe" className="aipe-replay-cg-copy-ck-deform__panel aipe-replay-cg-copy-ck-deform__output" aria-label="卷积输出响应图">
        <Typography shuku-edit-id="e-c36f4618-9933-458d-bcc4-fa6ee8cf3377" as="h2" variant="h3" tone="accent">输出响应图</Typography>
        <div shuku-edit-id="e-6a1e42c1-b1b9-49ea-bc0f-fbe028ff211c" className="aipe-replay-cg-copy-ck-deform__image"><canvas shuku-edit-id="e-9b5a3ddd-83a5-4d6a-b941-e58bf32d54ff" ref={outputCanvas} width={SIZE} height={SIZE} aria-label={`${mode === 'standard' ? '标准' : '可变形'}卷积计算得到的响应图`} /></div>
        <Typography shuku-edit-id="e-7e663607-bb35-47de-9419-1e0fd7c53b23" variant="bodySmall" tone="muted">按当前采样位置计算。</Typography>
      </section>
    </div>
  </ContentBlock>;
}
