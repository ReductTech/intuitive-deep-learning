import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import './CorrelationConvolutionPage.css';

const INPUT_SYMBOLS = Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, col) => `x_{${row + 1}${col + 1}}`));
const KERNEL_SYMBOLS = Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, col) => `k_{${row + 1}${col + 1}}`));
const ROTATED_KERNEL_SYMBOLS = KERNEL_SYMBOLS.slice().reverse().map((row) => row.slice().reverse());
const KERNEL_CELL_COLORS = ['#dcecff', '#cee2fc', '#bad7fa', '#fff0df', '#ffe3ca', '#fbd5b5', '#e1f5e8', '#ccebdc', '#b5e2cc'];

function Matrix({ values, label, warm = false, rotated = false }: { values: string[][]; label: string; warm?: boolean; rotated?: boolean }) {
  return (
    <div shuku-edit-id="e-07234b7c-0c3a-44a5-b056-f3d29492e505" className={`aipe-replay-cg-copy-ck-correlation__matrix ${warm ? 'is-warm' : ''}`} role="img" aria-label={label} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }}>
      {values.flatMap((row, rowIndex) => row.map((value, colIndex) => (
        <div shuku-edit-id="e-313d42ef-df4a-43eb-9362-33aa7f0bccc5" key={`${rowIndex}-${colIndex}`} className="aipe-replay-cg-copy-ck-correlation__matrix-cell" style={warm ? { backgroundColor: KERNEL_CELL_COLORS[rotated ? 8 - (rowIndex * 3 + colIndex) : rowIndex * 3 + colIndex] } : undefined}>
          <MathFormulaStatic latex={value} aria-label={value.replace(/[{}]/g, '')} />
        </div>
      )))}
    </div>
  );
}

function CorrelationFormula({ strict }: { strict: boolean }) {
  return (
    <MathFormulaBlock ariaLabel={strict ? '严格卷积公式' : '互相关公式'} className="aipe-replay-cg-copy-ck-correlation__formula">
      <MathFormulaTerm latex="y(i,j)=" tooltip="位置 (i,j) 的输出响应。" />
      <MathFormulaTerm latex={String.raw`\sum_{u=0}^{m-1}`} tooltip="沿卷积核的 m 行求和；u 是行索引。" />
      <MathFormulaTerm latex={String.raw`\sum_{v=0}^{n-1}`} tooltip="沿卷积核的 n 列求和；v 是列索引。" />
      <MathFormulaTerm latex="X(i+u,j+v)" tooltip="输入图像在当前窗口内 (u,v) 位置的像素。" />
      <MathFormulaTerm latex={strict ? String.raw`\widetilde{K}(u,v)` : 'K(u,v)'} tooltip={strict ? '旋转 180° 后的卷积核在 (u,v) 处的权重。' : '原始卷积核在 (u,v) 处的权重。'} />
    </MathFormulaBlock>
  );
}

export interface CorrelationConvolutionPageProps {
  onComplete: () => void;
}

export function CorrelationConvolutionPage({ onComplete }: CorrelationConvolutionPageProps) {
  return (
    <ContentBlock shuku-edit-id="e-e39806a9-e940-4b86-848a-922ad0964b2a"
      headingLevel={1}
      className="aipe-replay-cg-copy-ck-correlation"
      title="互相关与卷积"
      subtitle="严格卷积需要先将核旋转 180°；深度学习中的“卷积”通常实际采用互相关。"
    >
      <div shuku-edit-id="e-c951d7fd-e612-4dc4-bb3f-6c236e957ee1" className="aipe-replay-cg-copy-ck-correlation__comparison">
        <section shuku-edit-id="e-15f97efd-00d2-4bbb-b403-7f5820eb1f54" className="aipe-replay-cg-copy-ck-correlation__panel" aria-labelledby="cross-correlation-title">
          <header shuku-edit-id="e-184dabf2-489c-412a-9878-edae398043bc" className="aipe-replay-cg-copy-ck-correlation__panel-head">
            <Typography shuku-edit-id="e-8b6ae269-7842-436f-be18-695fc3961893" as="h2" variant="h3" tone="accent" id="cross-correlation-title">互相关 <span shuku-edit-id="e-f84e5075-bd33-4281-8b99-845154c3c0d2">(cross-correlation)</span></Typography>
            <Typography shuku-edit-id="e-49cee12e-80ed-49f5-aa49-e0f6715b496d" variant="bodySmall" tone="muted">直接使用卷积核 <strong shuku-edit-id="e-4db2a78c-50f1-4997-b79f-48a521abfc1f">K</strong>，不做旋转。</Typography>
          </header>
          <CorrelationFormula strict={false} />
          <div shuku-edit-id="e-efd94346-ec9d-4db1-b261-9f113b93c445" className="aipe-replay-cg-copy-ck-correlation__operation">
            <div shuku-edit-id="e-21ad4e38-7ef8-411e-9ca0-090f6e2600a2" className="aipe-replay-cg-copy-ck-correlation__object">
              <Typography shuku-edit-id="e-ab2932fc-5477-4b55-ba55-01fd9f16b8b0" variant="bodySmall" tone="muted">输入局部窗口</Typography>
              <Matrix values={INPUT_SYMBOLS} label="互相关的代数输入局部窗口，元素为 x11 到 x33" />
            </div>
            <Typography shuku-edit-id="e-316e0558-3a56-43c8-a214-e9e18a7d33a1" as="span" variant="h2" tone="accent" className="aipe-replay-cg-copy-ck-correlation__multiply" aria-hidden="true">×</Typography>
            <div shuku-edit-id="e-bcd1427e-3ae6-4b5c-b998-a4210dcdf9ae" className="aipe-replay-cg-copy-ck-correlation__object">
              <Typography shuku-edit-id="e-8985e97c-f22b-459e-8b49-1b807207806f" variant="bodySmall" tone="muted">原始卷积核</Typography>
              <Matrix values={KERNEL_SYMBOLS} label="互相关直接使用的代数卷积核，元素为 k11 到 k33" warm />
            </div>
            <Typography shuku-edit-id="e-c44acf4a-b442-4c1c-be61-77e0bec325c3" as="span" variant="h2" tone="accent" className="aipe-replay-cg-copy-ck-correlation__arrow" aria-hidden="true">→</Typography>
            <div shuku-edit-id="e-f6ca85bb-e39d-44c0-98c7-9ebda5b6adc1" className="aipe-replay-cg-copy-ck-correlation__output" aria-label="互相关输出 y i j">
              <Typography shuku-edit-id="e-a0419429-337d-4991-942f-88a224c558fb" variant="bodySmall" tone="muted">输出</Typography>
              <MathFormulaStatic latex="y(i,j)" aria-label="y i j" />
            </div>
          </div>
        </section>

        <section shuku-edit-id="e-201aa74b-be96-485c-8a11-be35ca002deb" className="aipe-replay-cg-copy-ck-correlation__panel aipe-replay-cg-copy-ck-correlation__panel--strict" aria-labelledby="convolution-title">
          <header shuku-edit-id="e-0f7d01a5-8ce0-4b30-b632-f484db5fd6a8" className="aipe-replay-cg-copy-ck-correlation__panel-head">
            <Typography shuku-edit-id="e-2639d888-ce80-45b4-a98f-2d8995d3660b" as="h2" variant="h3" tone="accent" id="convolution-title">严格卷积 <span shuku-edit-id="e-55022e45-888f-45a7-9d1e-44052f33afeb">(convolution)</span></Typography>
            <Typography shuku-edit-id="e-27d8a979-2d1a-4f33-90f8-380944318f3a" variant="bodySmall" tone="muted">先将卷积核旋转 180°，再逐元素相乘并求和。</Typography>
          </header>
          <CorrelationFormula strict />
          <div shuku-edit-id="e-f9c98c2e-a2d9-48fc-ac15-63eedf69ad52" className="aipe-replay-cg-copy-ck-correlation__operation">
            <div shuku-edit-id="e-5f53ad03-b354-477d-9ee9-8c8744059fd1" className="aipe-replay-cg-copy-ck-correlation__object">
              <Typography shuku-edit-id="e-3b6baa9b-1b8d-4962-8368-935459cbd5ff" variant="bodySmall" tone="muted">输入局部窗口</Typography>
              <Matrix values={INPUT_SYMBOLS} label="严格卷积的代数输入局部窗口，元素为 x11 到 x33" />
            </div>
            <Typography shuku-edit-id="e-5bacda14-be33-470d-b393-3435364dbda2" as="span" variant="h2" tone="accent" className="aipe-replay-cg-copy-ck-correlation__multiply" aria-hidden="true">×</Typography>
            <div shuku-edit-id="e-e254da3e-3c4a-4e0c-be78-4ffc493f15bb" className="aipe-replay-cg-copy-ck-correlation__object">
              <Typography shuku-edit-id="e-f54c422f-e845-46ac-9eaf-e38027dba182" variant="bodySmall" tone="muted">旋转后的卷积核</Typography>
              <Matrix values={ROTATED_KERNEL_SYMBOLS} label="严格卷积的旋转代数卷积核，元素次序由 k33 到 k11" warm rotated />
            </div>
            <Typography shuku-edit-id="e-850b7084-10f0-4123-9cb7-2a1937346305" as="span" variant="h2" tone="accent" className="aipe-replay-cg-copy-ck-correlation__arrow" aria-hidden="true">→</Typography>
            <div shuku-edit-id="e-fb2ba278-5cde-4205-9072-9d62a6ec340e" className="aipe-replay-cg-copy-ck-correlation__output" aria-label="严格卷积输出 y i j">
              <Typography shuku-edit-id="e-551af154-f9e4-4b3a-92d4-d0cc05e60dae" variant="bodySmall" tone="muted">输出</Typography>
              <MathFormulaStatic latex="y(i,j)" aria-label="y i j" />
            </div>
          </div>
        </section>
      </div>

      <div shuku-edit-id="e-4eb8c314-e23e-4ffa-981e-0603bd935ecd" className="aipe-replay-cg-copy-ck-correlation__conclusion">
        <Typography shuku-edit-id="e-08e9062a-75ce-4697-a4ea-42d6f975056a" as="span" variant="h3" tone="accent">结论：</Typography>
        <Typography shuku-edit-id="e-315bb25d-6828-45a5-8612-459646e30fe6" variant="body">严格卷积先旋转核 180°；深度学习中的“卷积”通常指互相关。</Typography>
      </div>
    </ContentBlock>
  );
}
