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

  return <ContentBlock shuku-edit-id="e-041786c6-95ef-4d30-ac27-a60aaea465ae" headingLevel={1} className="ck-deform" title="可变形卷积" subtitle="权重不变，采样位置可偏移。">
    <div shuku-edit-id="e-6105a281-cb83-41ee-9a7d-c29dc8d52f1d" className="ck-deform__equation-row">
    <MathFormulaBlock ariaLabel={mode === 'standard' ? '标准卷积在规则采样位置加权求和' : '可变形卷积在偏移后的采样位置加权求和'} className="ck-deform__formula">
      <MathFormulaTerm latex="y(p_0)" tooltip="当前位置的输出响应。" /><MathFormulaStatic latex="=" />
      <MathFormulaTerm latex={String.raw`\sum_{n=1}^{9}`} tooltip="对卷积核的九个采样位置求和。" />
      <MathFormulaTerm latex="w_n" tooltip="第 n 个固定卷积权重；切换模式时权重不变。" />
      <MathFormulaTerm latex="x" tooltip="输入特征图；非整数位置使用双线性插值取值。" /><MathFormulaStatic latex="(" />
      <MathFormulaTerm latex="p_0" tooltip="当前输出位置对应的输入中心。" /><MathFormulaStatic latex="+" />
      <MathFormulaTerm latex="p_n" tooltip="普通三乘三卷积的规则采样偏移。" />
      {mode === 'deformable' && <><MathFormulaStatic latex="+" /><MathFormulaTerm latex={String.raw`\Delta p_n`} tooltip="第 n 个采样位置的额外二维偏移。" /></>}<MathFormulaStatic latex=")" />
    </MathFormulaBlock>
    <div shuku-edit-id="e-51f60d3b-974f-4626-b69a-fd197ad71c08" className="ck-deform__mode" role="group" aria-label="切换卷积采样方式">
      <button shuku-edit-id="e-48b9147b-cf5f-4ec2-a10c-af0bc84abbfe" type="button" className={mode === 'standard' ? 'is-selected' : ''} aria-pressed={mode === 'standard'} onClick={() => setMode('standard')}><Typography shuku-edit-id="e-ea357144-987d-4b06-b90a-a96545e32538" as="span" variant="body" tone="inherit">标准卷积</Typography></button>
      <button shuku-edit-id="e-195969c7-2926-4ce3-b247-f29d2157cc1a" type="button" className={mode === 'deformable' ? 'is-selected' : ''} aria-pressed={mode === 'deformable'} onClick={() => setMode('deformable')}><Typography shuku-edit-id="e-3b2d2ab0-bb24-4e77-9bf1-e2f40da8c046" as="span" variant="body" tone="inherit">可变形卷积</Typography></button>
    </div>
    </div>
    <div shuku-edit-id="e-ae4afc57-63c4-4591-8233-df4048d85690" className="ck-deform__workspace">
      <section shuku-edit-id="e-9458ebf3-a9fa-4dad-9f46-8b609ea4c985" className="ck-deform__panel ck-deform__input" aria-label="输入特征图和采样位置">
        <Typography shuku-edit-id="e-edbe04ab-0304-4630-9e81-5433f1783a4c" as="h2" variant="h3" tone="accent">输入特征图 · 采样位置</Typography>
        <div shuku-edit-id="e-2e6cfd7c-64d4-4442-bc16-c920ddf6cd6d" className="ck-deform__image">
          <canvas shuku-edit-id="e-174b9a54-cc5b-4b8f-b666-ebb08ce05fc3" ref={inputCanvas} width={SIZE} height={SIZE} aria-label="弯曲的亮色带输入图像" />
          <div shuku-edit-id="e-35928cd9-72bc-4d3c-bf1b-058b44b9ce20" className="ck-deform__grid-lines" aria-hidden="true" />
          {mode === 'deformable' && originalPoint && selectedOffset && <>
            <svg shuku-edit-id="e-5ec54a6e-6546-450a-9cf2-a3aa69be557a" className="ck-deform__offset-guide" viewBox={`0 0 ${SIZE} ${SIZE}`} preserveAspectRatio="none" aria-hidden="true">
              <line shuku-edit-id="e-db602dec-4afc-456e-b0f3-85dd2d55d2a1" x1={originalPoint.x} y1={originalPoint.y} x2={originalPoint.x + selectedOffset.dx} y2={originalPoint.y + selectedOffset.dy} />
            </svg>
            <span shuku-edit-id="e-630dc7ee-80be-4a30-920a-d429dbbe51ad" className="ck-deform__original-point" style={{ left: `${originalPoint.x / SIZE * 100}%`, top: `${originalPoint.y / SIZE * 100}%` }} aria-hidden="true" />
          </>}
          {Array.from({ length: 9 }, (_, index) => {
            const row = Math.floor(index / 3), col = index % 3;
            const baseX = ANCHOR_X + (col - 1) * SAMPLE_STEP;
            const baseY = ANCHOR_Y + (row - 1) * SAMPLE_STEP;
            const offset = offsetAt(mode, ANCHOR_X, ANCHOR_Y, row, col);
            const style = { left: `${(baseX + offset.dx) / SIZE * 100}%`, top: `${(baseY + offset.dy) / SIZE * 100}%` } as CSSProperties;
            return <button shuku-edit-id="e-fbaf7b02-f9e4-4ccc-bd41-291db70c23dc" key={index} type="button" className={`ck-deform__sample ${hovered === index ? 'is-hovered' : ''}`} style={style} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} aria-label={`第${row + 1}行第${col + 1}列采样点，权重${WEIGHTS[row][col]}/16，水平偏移${offset.dx.toFixed(1)}，垂直偏移${offset.dy.toFixed(1)}`} />;
          })}
        </div>
        <Typography shuku-edit-id="e-13bf5bde-5756-4b82-890c-716c1fdfc6b3" variant="bodySmall" tone="muted">{mode === 'deformable' ? '悬浮蓝点，对照原位。' : '切换模式，观察采样偏移。'}</Typography>
      </section>
      <section shuku-edit-id="e-009c382a-d139-41f3-b1ac-3a59d995cec7" className="ck-deform__panel ck-deform__kernel" aria-label="固定卷积核与采样偏移">
        <Typography shuku-edit-id="e-f0a6a424-cf10-4712-807a-12ed2a8ebc7c" as="h2" variant="h3" tone="accent">权重固定 · 位置可变</Typography>
        <div shuku-edit-id="e-37af66eb-89b5-4803-a2a4-9585bd07ab03" className="ck-deform__kernel-grid" role="img" aria-label="三乘三卷积核，权重为一二一、二四二、一二一，整体除以十六">
          {WEIGHTS.flat().map((weight, index) => <span shuku-edit-id="e-5ccc0e5e-523f-4181-aeda-e20864240544" key={index}>{weight}</span>)}
        </div>
        <div shuku-edit-id="e-8d1e89d0-5a9a-412b-b232-dc1ad713130a" className="ck-deform__point-info">
          <Typography shuku-edit-id="e-c8e89adf-8f3b-4d23-bcb0-8615c23d00d9" variant="body" tone="accent">{selectedPoint ? `采样点 ${selectedPoint.row + 1}, ${selectedPoint.col + 1}` : '采样位置'}</Typography>
          <Typography shuku-edit-id="e-9abbd08e-90ba-47fc-b5d9-0ec587627fe6" variant="body" tone="muted">{selectedPoint && selectedOffset ? `w = ${WEIGHTS[selectedPoint.row][selectedPoint.col]}/16 · Δp = (${selectedOffset.dx.toFixed(1)}, ${selectedOffset.dy.toFixed(1)})` : mode === 'standard' ? '规则网格：Δp = (0, 0)' : '示意偏移：蓝点沿局部曲线移动'}</Typography>
        </div>
        <Typography shuku-edit-id="e-9f2844ea-aa7b-4966-9cb9-d4b2f7a49457" variant="body" tone="muted">偏移由网络学习；图中为示意。</Typography>
      </section>
      <section shuku-edit-id="e-6ee8329f-9590-49fd-ab18-ceb2e6ca0488" className="ck-deform__panel ck-deform__output" aria-label="卷积输出响应图">
        <Typography shuku-edit-id="e-8ae0fd6e-97d8-4e76-86a1-0509d8dd4cd7" as="h2" variant="h3" tone="accent">输出响应图</Typography>
        <div shuku-edit-id="e-72754fa8-f9ee-489f-8229-b5487a32b312" className="ck-deform__image"><canvas shuku-edit-id="e-bad9de17-1391-44a0-94f0-6e6adb69350d" ref={outputCanvas} width={SIZE} height={SIZE} aria-label={`${mode === 'standard' ? '标准' : '可变形'}卷积计算得到的响应图`} /></div>
        <Typography shuku-edit-id="e-7dda94ea-7a63-4042-88fb-7766acfb98e3" variant="bodySmall" tone="muted">按当前采样位置计算。</Typography>
      </section>
    </div>
  </ContentBlock>;
}
