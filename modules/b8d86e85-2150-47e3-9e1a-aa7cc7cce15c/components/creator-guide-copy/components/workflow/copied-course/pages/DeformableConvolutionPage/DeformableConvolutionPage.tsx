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

  return <ContentBlock shuku-edit-id="e-cfa6d85f-bbba-4024-9bb0-e035d30d011d" headingLevel={1} className="aipe-replay-cg-copy-ck-deform" title="可变形卷积" subtitle="权重不变，采样位置可偏移。">
    <div shuku-edit-id="e-dd578cac-2cd1-4fcf-b2d9-228a88822955" className="aipe-replay-cg-copy-ck-deform__equation-row">
    <MathFormulaBlock ariaLabel={mode === 'standard' ? '标准卷积在规则采样位置加权求和' : '可变形卷积在偏移后的采样位置加权求和'} className="aipe-replay-cg-copy-ck-deform__formula">
      <MathFormulaTerm latex="y(p_0)" tooltip="当前位置的输出响应。" /><MathFormulaStatic latex="=" />
      <MathFormulaTerm latex={String.raw`\sum_{n=1}^{9}`} tooltip="对卷积核的九个采样位置求和。" />
      <MathFormulaTerm latex="w_n" tooltip="第 n 个固定卷积权重；切换模式时权重不变。" />
      <MathFormulaTerm latex="x" tooltip="输入特征图；非整数位置使用双线性插值取值。" /><MathFormulaStatic latex="(" />
      <MathFormulaTerm latex="p_0" tooltip="当前输出位置对应的输入中心。" /><MathFormulaStatic latex="+" />
      <MathFormulaTerm latex="p_n" tooltip="普通三乘三卷积的规则采样偏移。" />
      {mode === 'deformable' && <><MathFormulaStatic latex="+" /><MathFormulaTerm latex={String.raw`\Delta p_n`} tooltip="第 n 个采样位置的额外二维偏移。" /></>}<MathFormulaStatic latex=")" />
    </MathFormulaBlock>
    <div shuku-edit-id="e-7e49b34c-5cce-4f80-9083-52cb6c839fe8" className="aipe-replay-cg-copy-ck-deform__mode" role="group" aria-label="切换卷积采样方式">
      <button shuku-edit-id="e-7a00324a-19f2-4bb0-9a7b-132d83403287" type="button" className={mode === 'standard' ? 'is-selected' : ''} aria-pressed={mode === 'standard'} onClick={() => setMode('standard')}><Typography shuku-edit-id="e-84372725-88ef-454e-8e7d-dd8a896f7ec0" as="span" variant="body" tone="inherit">标准卷积</Typography></button>
      <button shuku-edit-id="e-ccf81a24-3f89-4574-ac89-1205df9926af" type="button" className={mode === 'deformable' ? 'is-selected' : ''} aria-pressed={mode === 'deformable'} onClick={() => setMode('deformable')}><Typography shuku-edit-id="e-da7a12fe-c7dc-48f9-9381-bd0c847ed304" as="span" variant="body" tone="inherit">可变形卷积</Typography></button>
    </div>
    </div>
    <div shuku-edit-id="e-af979f88-936f-4d92-9d42-f5ab36395a22" className="aipe-replay-cg-copy-ck-deform__workspace">
      <section shuku-edit-id="e-e5d70d27-956c-40d0-949e-19507ddeef8b" className="aipe-replay-cg-copy-ck-deform__panel aipe-replay-cg-copy-ck-deform__input" aria-label="输入特征图和采样位置">
        <Typography shuku-edit-id="e-eb0e1fd7-f361-432f-a837-4b8583589be1" as="h2" variant="h3" tone="accent">输入特征图 · 采样位置</Typography>
        <div shuku-edit-id="e-09be4807-5477-4500-8ecc-b89658e02d72" className="aipe-replay-cg-copy-ck-deform__image">
          <canvas shuku-edit-id="e-d1f4a5a0-c303-4569-8969-2a9032756fd7" ref={inputCanvas} width={SIZE} height={SIZE} aria-label="弯曲的亮色带输入图像" />
          <div shuku-edit-id="e-097791f2-252e-426c-bfc4-cce199380761" className="aipe-replay-cg-copy-ck-deform__grid-lines" aria-hidden="true" />
          {mode === 'deformable' && originalPoint && selectedOffset && <>
            <svg shuku-edit-id="e-27521602-851f-4a91-903e-c8e84782f4d1" className="aipe-replay-cg-copy-ck-deform__offset-guide" viewBox={`0 0 ${SIZE} ${SIZE}`} preserveAspectRatio="none" aria-hidden="true">
              <line shuku-edit-id="e-74cd965c-df9f-4c4e-abac-38393af2334a" x1={originalPoint.x} y1={originalPoint.y} x2={originalPoint.x + selectedOffset.dx} y2={originalPoint.y + selectedOffset.dy} />
            </svg>
            <span shuku-edit-id="e-6cc35d35-1909-429c-9622-76fae3ddebef" className="aipe-replay-cg-copy-ck-deform__original-point" style={{ left: `${originalPoint.x / SIZE * 100}%`, top: `${originalPoint.y / SIZE * 100}%` }} aria-hidden="true" />
          </>}
          {Array.from({ length: 9 }, (_, index) => {
            const row = Math.floor(index / 3), col = index % 3;
            const baseX = ANCHOR_X + (col - 1) * SAMPLE_STEP;
            const baseY = ANCHOR_Y + (row - 1) * SAMPLE_STEP;
            const offset = offsetAt(mode, ANCHOR_X, ANCHOR_Y, row, col);
            const style = { left: `${(baseX + offset.dx) / SIZE * 100}%`, top: `${(baseY + offset.dy) / SIZE * 100}%` } as CSSProperties;
            return <button shuku-edit-id="e-4f313b46-4076-465f-986d-5fb72ba26a72" key={index} type="button" className={`aipe-replay-cg-copy-ck-deform__sample ${hovered === index ? 'is-hovered' : ''}`} style={style} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} aria-label={`第${row + 1}行第${col + 1}列采样点，权重${WEIGHTS[row][col]}/16，水平偏移${offset.dx.toFixed(1)}，垂直偏移${offset.dy.toFixed(1)}`} />;
          })}
        </div>
        <Typography shuku-edit-id="e-15012eb7-8a8c-4607-94d2-475c30bc495c" variant="bodySmall" tone="muted">{mode === 'deformable' ? '悬浮蓝点，对照原位。' : '切换模式，观察采样偏移。'}</Typography>
      </section>
      <section shuku-edit-id="e-360e2819-a191-4aec-ae9e-11a069450940" className="aipe-replay-cg-copy-ck-deform__panel aipe-replay-cg-copy-ck-deform__kernel" aria-label="固定卷积核与采样偏移">
        <Typography shuku-edit-id="e-40eda7de-70b3-4c58-b4ca-2ea7be886a04" as="h2" variant="h3" tone="accent">权重固定 · 位置可变</Typography>
        <div shuku-edit-id="e-16515092-b496-4382-b86d-4223c819fc88" className="aipe-replay-cg-copy-ck-deform__kernel-grid" role="img" aria-label="三乘三卷积核，权重为一二一、二四二、一二一，整体除以十六">
          {WEIGHTS.flat().map((weight, index) => <span shuku-edit-id="e-14af654d-08b3-4685-934e-426285169996" key={index}>{weight}</span>)}
        </div>
        <div shuku-edit-id="e-297c39ab-a76e-460a-900f-e2028a0e39e8" className="aipe-replay-cg-copy-ck-deform__point-info">
          <Typography shuku-edit-id="e-8724fc25-2827-4b27-9a47-d79d2f9d7015" variant="body" tone="accent">{selectedPoint ? `采样点 ${selectedPoint.row + 1}, ${selectedPoint.col + 1}` : '采样位置'}</Typography>
          <Typography shuku-edit-id="e-f77bf4a9-ce88-48cb-901c-d7da6a12276f" variant="body" tone="muted">{selectedPoint && selectedOffset ? `w = ${WEIGHTS[selectedPoint.row][selectedPoint.col]}/16 · Δp = (${selectedOffset.dx.toFixed(1)}, ${selectedOffset.dy.toFixed(1)})` : mode === 'standard' ? '规则网格：Δp = (0, 0)' : '示意偏移：蓝点沿局部曲线移动'}</Typography>
        </div>
        <Typography shuku-edit-id="e-94834142-e26e-48c2-9817-006849aa4ffc" variant="body" tone="muted">偏移由网络学习；图中为示意。</Typography>
      </section>
      <section shuku-edit-id="e-a4e4125c-c797-4763-8bd7-b5159283fc88" className="aipe-replay-cg-copy-ck-deform__panel aipe-replay-cg-copy-ck-deform__output" aria-label="卷积输出响应图">
        <Typography shuku-edit-id="e-6746549d-2ce6-4001-82f8-ffaea26fe78a" as="h2" variant="h3" tone="accent">输出响应图</Typography>
        <div shuku-edit-id="e-33ec81fe-6539-4992-a468-be6209c88417" className="aipe-replay-cg-copy-ck-deform__image"><canvas shuku-edit-id="e-24ba2407-5501-49e7-8312-404e32ff4a64" ref={outputCanvas} width={SIZE} height={SIZE} aria-label={`${mode === 'standard' ? '标准' : '可变形'}卷积计算得到的响应图`} /></div>
        <Typography shuku-edit-id="e-343ba59b-d225-4952-b5f5-1e70605844a1" variant="bodySmall" tone="muted">按当前采样位置计算。</Typography>
      </section>
    </div>
  </ContentBlock>;
}
