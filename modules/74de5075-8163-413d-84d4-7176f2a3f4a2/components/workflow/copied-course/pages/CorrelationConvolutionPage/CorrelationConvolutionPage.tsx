import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import './CorrelationConvolutionPage.css';

const INPUT_SYMBOLS = Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, col) => `x_{${row + 1}${col + 1}}`));
const KERNEL_SYMBOLS = Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, col) => `k_{${row + 1}${col + 1}}`));
const ROTATED_KERNEL_SYMBOLS = KERNEL_SYMBOLS.slice().reverse().map((row) => row.slice().reverse());
const KERNEL_CELL_COLORS = ['#dcecff', '#cee2fc', '#bad7fa', '#fff0df', '#ffe3ca', '#fbd5b5', '#e1f5e8', '#ccebdc', '#b5e2cc'];

function Matrix({ values, label, warm = false, rotated = false }: { values: string[][]; label: string; warm?: boolean; rotated?: boolean }) {
  return (
    <div shuku-edit-id="e-54cd821e-d08e-46ec-a1fa-a00341fad0a2" className={`cg-copy-ck-correlation__matrix ${warm ? 'is-warm' : ''}`} role="img" aria-label={label} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }}>
      {values.flatMap((row, rowIndex) => row.map((value, colIndex) => (
        <div shuku-edit-id="e-da798617-2055-45f9-a964-bf88332d3dfe" key={`${rowIndex}-${colIndex}`} className="cg-copy-ck-correlation__matrix-cell" style={warm ? { backgroundColor: KERNEL_CELL_COLORS[rotated ? 8 - (rowIndex * 3 + colIndex) : rowIndex * 3 + colIndex] } : undefined}>
          <MathFormulaStatic latex={value} aria-label={value.replace(/[{}]/g, '')} />
        </div>
      )))}
    </div>
  );
}

function CorrelationFormula({ strict }: { strict: boolean }) {
  return (
    <MathFormulaBlock ariaLabel={strict ? '严格卷积公式' : '互相关公式'} className="cg-copy-ck-correlation__formula">
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
    <ContentBlock shuku-edit-id="e-25926111-41f8-4a0c-aa24-42173fc3d760"
      headingLevel={1}
      className="cg-copy-ck-correlation"
      title="互相关与卷积"
      subtitle="严格卷积需要先将核旋转 180°；深度学习中的“卷积”通常实际采用互相关。"
    >
      <div shuku-edit-id="e-970ba14f-77c6-4d9e-98c8-06b5c734e42e" className="cg-copy-ck-correlation__comparison">
        <section shuku-edit-id="e-b7d237d6-f8b2-4a3e-900c-c03a608d5e28" className="cg-copy-ck-correlation__panel" aria-labelledby="cross-correlation-title">
          <header shuku-edit-id="e-af980efe-7c85-4df2-8980-47595bce4cf4" className="cg-copy-ck-correlation__panel-head">
            <Typography shuku-edit-id="e-3e8a88fe-bb52-4406-bf81-6211efe89fd3" as="h2" variant="h3" tone="accent" id="cross-correlation-title">互相关 <span shuku-edit-id="e-bbc9c593-7913-4776-bb81-a65604c9ff79">(cross-correlation)</span></Typography>
            <Typography shuku-edit-id="e-0cacef80-e66b-46a4-97ab-533545de38b2" variant="bodySmall" tone="muted">直接使用卷积核 <strong shuku-edit-id="e-bd8dd06b-4a28-49d7-ba19-60cd59816f3c">K</strong>，不做旋转。</Typography>
          </header>
          <CorrelationFormula strict={false} />
          <div shuku-edit-id="e-207e0be0-a1c1-431f-880a-bbbe5ea14b65" className="cg-copy-ck-correlation__operation">
            <div shuku-edit-id="e-d7ceadd1-db41-4590-8a3d-dcc38c375f38" className="cg-copy-ck-correlation__object">
              <Typography shuku-edit-id="e-18640138-122f-4e43-8b5b-2d51bac35f10" variant="bodySmall" tone="muted">输入局部窗口</Typography>
              <Matrix values={INPUT_SYMBOLS} label="互相关的代数输入局部窗口，元素为 x11 到 x33" />
            </div>
            <Typography shuku-edit-id="e-26909403-a0ed-4388-bd74-85343868a0c5" as="span" variant="h2" tone="accent" className="cg-copy-ck-correlation__multiply" aria-hidden="true">×</Typography>
            <div shuku-edit-id="e-a582b8d9-666d-438e-b111-d7715173a0e1" className="cg-copy-ck-correlation__object">
              <Typography shuku-edit-id="e-ac22b751-1d26-413b-9d97-2793c323b663" variant="bodySmall" tone="muted">原始卷积核</Typography>
              <Matrix values={KERNEL_SYMBOLS} label="互相关直接使用的代数卷积核，元素为 k11 到 k33" warm />
            </div>
            <Typography shuku-edit-id="e-29ca78b6-7db3-4ec3-99db-e08d87e25255" as="span" variant="h2" tone="accent" className="cg-copy-ck-correlation__arrow" aria-hidden="true">→</Typography>
            <div shuku-edit-id="e-7a5f9ba1-75d5-46eb-879d-0b09f6e68401" className="cg-copy-ck-correlation__output" aria-label="互相关输出 y i j">
              <Typography shuku-edit-id="e-28c79090-15ec-4ec2-926b-ec190b8c3941" variant="bodySmall" tone="muted">输出</Typography>
              <MathFormulaStatic latex="y(i,j)" aria-label="y i j" />
            </div>
          </div>
        </section>

        <section shuku-edit-id="e-a46f62fe-a771-4cd3-9841-25d738364af1" className="cg-copy-ck-correlation__panel cg-copy-ck-correlation__panel--strict" aria-labelledby="convolution-title">
          <header shuku-edit-id="e-3166876f-f667-470c-b327-88897be49a35" className="cg-copy-ck-correlation__panel-head">
            <Typography shuku-edit-id="e-8a148e16-9361-4ef8-9bc8-6253721dbc2f" as="h2" variant="h3" tone="accent" id="convolution-title">严格卷积 <span shuku-edit-id="e-2c94eb00-49a9-4391-aed9-525a7df45a36">(convolution)</span></Typography>
            <Typography shuku-edit-id="e-7c99e261-6136-4b1a-9aab-bc7b41a54a2d" variant="bodySmall" tone="muted">先将卷积核旋转 180°，再逐元素相乘并求和。</Typography>
          </header>
          <CorrelationFormula strict />
          <div shuku-edit-id="e-61f93d98-c4fc-4d8d-8557-a374d058cbbc" className="cg-copy-ck-correlation__operation">
            <div shuku-edit-id="e-3ea2bd30-0b8d-4122-84da-11edfdcc45e8" className="cg-copy-ck-correlation__object">
              <Typography shuku-edit-id="e-3e28f253-e14b-4368-b0af-678fad58e16c" variant="bodySmall" tone="muted">输入局部窗口</Typography>
              <Matrix values={INPUT_SYMBOLS} label="严格卷积的代数输入局部窗口，元素为 x11 到 x33" />
            </div>
            <Typography shuku-edit-id="e-5113790e-1f0c-4042-b4e9-6ae34bc47aff" as="span" variant="h2" tone="accent" className="cg-copy-ck-correlation__multiply" aria-hidden="true">×</Typography>
            <div shuku-edit-id="e-ac1f13f8-d82c-4667-8419-b2daa2f26db9" className="cg-copy-ck-correlation__object">
              <Typography shuku-edit-id="e-4375ef26-8161-42e0-97d3-c6401b9f2f76" variant="bodySmall" tone="muted">旋转后的卷积核</Typography>
              <Matrix values={ROTATED_KERNEL_SYMBOLS} label="严格卷积的旋转代数卷积核，元素次序由 k33 到 k11" warm rotated />
            </div>
            <Typography shuku-edit-id="e-17612976-0c7f-4995-b030-a60157e6ceae" as="span" variant="h2" tone="accent" className="cg-copy-ck-correlation__arrow" aria-hidden="true">→</Typography>
            <div shuku-edit-id="e-40e24d93-1207-4209-b37b-088fafdfbded" className="cg-copy-ck-correlation__output" aria-label="严格卷积输出 y i j">
              <Typography shuku-edit-id="e-9b9069b0-3988-4ded-9043-3e856b22dc84" variant="bodySmall" tone="muted">输出</Typography>
              <MathFormulaStatic latex="y(i,j)" aria-label="y i j" />
            </div>
          </div>
        </section>
      </div>

      <div shuku-edit-id="e-970e83ca-bf8f-43a0-83e2-266874903b3d" className="cg-copy-ck-correlation__conclusion">
        <Typography shuku-edit-id="e-c1be05dc-0818-4a00-825b-279e0e34429d" as="span" variant="h3" tone="accent">结论：</Typography>
        <Typography shuku-edit-id="e-b2b4c418-b87e-44e8-b8c4-9b2a30e9d099" variant="body">严格卷积先旋转核 180°；深度学习中的“卷积”通常指互相关。</Typography>
      </div>
    </ContentBlock>
  );
}
