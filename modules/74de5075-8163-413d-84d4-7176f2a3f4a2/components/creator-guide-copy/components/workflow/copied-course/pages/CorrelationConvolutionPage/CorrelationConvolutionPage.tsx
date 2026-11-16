import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import './CorrelationConvolutionPage.css';

const INPUT_SYMBOLS = Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, col) => `x_{${row + 1}${col + 1}}`));
const KERNEL_SYMBOLS = Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, col) => `k_{${row + 1}${col + 1}}`));
const ROTATED_KERNEL_SYMBOLS = KERNEL_SYMBOLS.slice().reverse().map((row) => row.slice().reverse());
const KERNEL_CELL_COLORS = ['#dcecff', '#cee2fc', '#bad7fa', '#fff0df', '#ffe3ca', '#fbd5b5', '#e1f5e8', '#ccebdc', '#b5e2cc'];

function Matrix({ values, label, warm = false, rotated = false }: { values: string[][]; label: string; warm?: boolean; rotated?: boolean }) {
  return (
    <div shuku-edit-id="e-2e450a58-a99d-489f-a725-f1cb0feb5a97" className={`aipe-replay-cg-copy-ck-correlation__matrix ${warm ? 'is-warm' : ''}`} role="img" aria-label={label} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }}>
      {values.flatMap((row, rowIndex) => row.map((value, colIndex) => (
        <div shuku-edit-id="e-9016d621-68d6-4a9c-90fb-352660ea6cb9" key={`${rowIndex}-${colIndex}`} className="aipe-replay-cg-copy-ck-correlation__matrix-cell" style={warm ? { backgroundColor: KERNEL_CELL_COLORS[rotated ? 8 - (rowIndex * 3 + colIndex) : rowIndex * 3 + colIndex] } : undefined}>
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
    <ContentBlock shuku-edit-id="e-36c46e14-69e9-4e91-bed2-d819535fc119"
      headingLevel={1}
      className="aipe-replay-cg-copy-ck-correlation"
      title="互相关与卷积"
      subtitle="严格卷积需要先将核旋转 180°；深度学习中的“卷积”通常实际采用互相关。"
    >
      <div shuku-edit-id="e-d62ee134-5f67-4793-a6fd-d24b3e3e2c72" className="aipe-replay-cg-copy-ck-correlation__comparison">
        <section shuku-edit-id="e-7797525d-caef-4ed8-a29a-4909f557c1b9" className="aipe-replay-cg-copy-ck-correlation__panel" aria-labelledby="cross-correlation-title">
          <header shuku-edit-id="e-a9216414-7694-4ced-b0dd-fddc3311f17d" className="aipe-replay-cg-copy-ck-correlation__panel-head">
            <Typography shuku-edit-id="e-b43f5fb4-3e36-4f19-a539-f48522fa9fb3" as="h2" variant="h3" tone="accent" id="cross-correlation-title">互相关 <span shuku-edit-id="e-70343977-e124-4708-96ed-759d8d235cf3">(cross-correlation)</span></Typography>
            <Typography shuku-edit-id="e-9fc32f0c-254e-461b-961d-e3e11f51a78b" variant="bodySmall" tone="muted">直接使用卷积核 <strong shuku-edit-id="e-13192af1-5778-413e-9064-92d0bd09c460">K</strong>，不做旋转。</Typography>
          </header>
          <CorrelationFormula strict={false} />
          <div shuku-edit-id="e-fcb8520e-6228-4ca6-831d-85af07e14c0f" className="aipe-replay-cg-copy-ck-correlation__operation">
            <div shuku-edit-id="e-f857a0a3-24d9-401d-8b28-15864e7b07a3" className="aipe-replay-cg-copy-ck-correlation__object">
              <Typography shuku-edit-id="e-89953b77-13fa-43ec-b6f6-83ce75271f45" variant="bodySmall" tone="muted">输入局部窗口</Typography>
              <Matrix values={INPUT_SYMBOLS} label="互相关的代数输入局部窗口，元素为 x11 到 x33" />
            </div>
            <Typography shuku-edit-id="e-741760c5-cb93-490b-9493-63de894ed695" as="span" variant="h2" tone="accent" className="aipe-replay-cg-copy-ck-correlation__multiply" aria-hidden="true">×</Typography>
            <div shuku-edit-id="e-b46f087b-9d75-4b81-b677-e19debac854d" className="aipe-replay-cg-copy-ck-correlation__object">
              <Typography shuku-edit-id="e-151e452c-3845-4fd5-ad3b-3b2d85b6f539" variant="bodySmall" tone="muted">原始卷积核</Typography>
              <Matrix values={KERNEL_SYMBOLS} label="互相关直接使用的代数卷积核，元素为 k11 到 k33" warm />
            </div>
            <Typography shuku-edit-id="e-0ed426d0-aa23-4958-b997-6d38e3602587" as="span" variant="h2" tone="accent" className="aipe-replay-cg-copy-ck-correlation__arrow" aria-hidden="true">→</Typography>
            <div shuku-edit-id="e-df6ee5aa-fce3-457e-905e-a37b0e0044b4" className="aipe-replay-cg-copy-ck-correlation__output" aria-label="互相关输出 y i j">
              <Typography shuku-edit-id="e-31453e79-41f9-4ee7-8618-863c8bd8b63a" variant="bodySmall" tone="muted">输出</Typography>
              <MathFormulaStatic latex="y(i,j)" aria-label="y i j" />
            </div>
          </div>
        </section>

        <section shuku-edit-id="e-c8935104-6c59-44af-ba9c-12a3568dc571" className="aipe-replay-cg-copy-ck-correlation__panel aipe-replay-cg-copy-ck-correlation__panel--strict" aria-labelledby="convolution-title">
          <header shuku-edit-id="e-1425c4a0-91db-4402-9d01-c303433161ba" className="aipe-replay-cg-copy-ck-correlation__panel-head">
            <Typography shuku-edit-id="e-e1d8dae8-c985-4044-bf2a-593d919b7af3" as="h2" variant="h3" tone="accent" id="convolution-title">严格卷积 <span shuku-edit-id="e-e7478cce-607a-457a-8401-de6d0c75f11a">(convolution)</span></Typography>
            <Typography shuku-edit-id="e-d583ac66-6f51-45b0-87d7-150bf05d2b4b" variant="bodySmall" tone="muted">先将卷积核旋转 180°，再逐元素相乘并求和。</Typography>
          </header>
          <CorrelationFormula strict />
          <div shuku-edit-id="e-893f5acc-98bc-4962-8191-72ea84f0c092" className="aipe-replay-cg-copy-ck-correlation__operation">
            <div shuku-edit-id="e-5d0a474a-75e2-4555-a1f3-5bb2729751d9" className="aipe-replay-cg-copy-ck-correlation__object">
              <Typography shuku-edit-id="e-316cf94f-57da-4936-bf6f-5953e1dec006" variant="bodySmall" tone="muted">输入局部窗口</Typography>
              <Matrix values={INPUT_SYMBOLS} label="严格卷积的代数输入局部窗口，元素为 x11 到 x33" />
            </div>
            <Typography shuku-edit-id="e-1eae3333-7257-4457-adb6-799ed6da76e6" as="span" variant="h2" tone="accent" className="aipe-replay-cg-copy-ck-correlation__multiply" aria-hidden="true">×</Typography>
            <div shuku-edit-id="e-17f9fdcf-d6be-4e4b-9892-50ccb18839ae" className="aipe-replay-cg-copy-ck-correlation__object">
              <Typography shuku-edit-id="e-4b683f29-398e-468a-9ac0-fafcd32b2bd9" variant="bodySmall" tone="muted">旋转后的卷积核</Typography>
              <Matrix values={ROTATED_KERNEL_SYMBOLS} label="严格卷积的旋转代数卷积核，元素次序由 k33 到 k11" warm rotated />
            </div>
            <Typography shuku-edit-id="e-1f07c362-858c-4b0b-b6f2-3436288e0a3f" as="span" variant="h2" tone="accent" className="aipe-replay-cg-copy-ck-correlation__arrow" aria-hidden="true">→</Typography>
            <div shuku-edit-id="e-6dbe28a7-cd53-49d0-90e5-070d5859cff7" className="aipe-replay-cg-copy-ck-correlation__output" aria-label="严格卷积输出 y i j">
              <Typography shuku-edit-id="e-5a64db67-f9b4-43bf-91d7-b9ccd10e1322" variant="bodySmall" tone="muted">输出</Typography>
              <MathFormulaStatic latex="y(i,j)" aria-label="y i j" />
            </div>
          </div>
        </section>
      </div>

      <div shuku-edit-id="e-e816adcb-fb2c-446a-b60e-011a2500baa6" className="aipe-replay-cg-copy-ck-correlation__conclusion">
        <Typography shuku-edit-id="e-239e4bb4-55ce-4cef-a0e4-5865e50e6847" as="span" variant="h3" tone="accent">结论：</Typography>
        <Typography shuku-edit-id="e-f0dc1765-4108-4879-a1c9-26f03adcba3c" variant="body">严格卷积先旋转核 180°；深度学习中的“卷积”通常指互相关。</Typography>
      </div>
    </ContentBlock>
  );
}
