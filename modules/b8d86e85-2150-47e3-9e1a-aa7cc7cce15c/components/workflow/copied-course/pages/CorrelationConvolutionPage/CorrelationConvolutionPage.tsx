import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import './CorrelationConvolutionPage.css';

const INPUT_SYMBOLS = Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, col) => `x_{${row + 1}${col + 1}}`));
const KERNEL_SYMBOLS = Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, col) => `k_{${row + 1}${col + 1}}`));
const ROTATED_KERNEL_SYMBOLS = KERNEL_SYMBOLS.slice().reverse().map((row) => row.slice().reverse());
const KERNEL_CELL_COLORS = ['#dcecff', '#cee2fc', '#bad7fa', '#fff0df', '#ffe3ca', '#fbd5b5', '#e1f5e8', '#ccebdc', '#b5e2cc'];

function Matrix({ values, label, warm = false, rotated = false }: { values: string[][]; label: string; warm?: boolean; rotated?: boolean }) {
  return (
    <div shuku-edit-id="e-7ab3a8be-fac4-4f02-8335-4d8d36098091" className={`cg-copy-ck-correlation__matrix ${warm ? 'is-warm' : ''}`} role="img" aria-label={label} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }}>
      {values.flatMap((row, rowIndex) => row.map((value, colIndex) => (
        <div shuku-edit-id="e-c64a6279-fe1e-4e7a-ae7b-6f987cef71f6" key={`${rowIndex}-${colIndex}`} className="cg-copy-ck-correlation__matrix-cell" style={warm ? { backgroundColor: KERNEL_CELL_COLORS[rotated ? 8 - (rowIndex * 3 + colIndex) : rowIndex * 3 + colIndex] } : undefined}>
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
    <ContentBlock shuku-edit-id="e-95c2b0cc-c072-4bc0-b8ae-aaf0b85a3e06"
      headingLevel={1}
      className="cg-copy-ck-correlation"
      title="互相关与卷积"
      subtitle="严格卷积需要先将核旋转 180°；深度学习中的“卷积”通常实际采用互相关。"
    >
      <div shuku-edit-id="e-f84d697f-b55f-46b6-afa4-611f0bc04c1f" className="cg-copy-ck-correlation__comparison">
        <section shuku-edit-id="e-2326f392-f74b-493e-9a0c-3f78f49b6061" className="cg-copy-ck-correlation__panel" aria-labelledby="cross-correlation-title">
          <header shuku-edit-id="e-63e924ab-1bcf-4ebe-b230-9b8c70ddc4e7" className="cg-copy-ck-correlation__panel-head">
            <Typography shuku-edit-id="e-d3e867a5-f721-4c00-94e9-7957f3088470" as="h2" variant="h3" tone="accent" id="cross-correlation-title">互相关 <span shuku-edit-id="e-64c0795e-e4fb-4149-a31e-58e04ee8abbe">(cross-correlation)</span></Typography>
            <Typography shuku-edit-id="e-00f47795-0f54-42f2-ba58-b65b19d387f5" variant="bodySmall" tone="muted">直接使用卷积核 <strong shuku-edit-id="e-bd635109-e216-483e-b393-d33c8ce1b08f">K</strong>，不做旋转。</Typography>
          </header>
          <CorrelationFormula strict={false} />
          <div shuku-edit-id="e-df22452e-0372-4589-b45a-2e54866d0bf2" className="cg-copy-ck-correlation__operation">
            <div shuku-edit-id="e-ca752e84-8e0e-4dcb-9cbb-7ad72564e73f" className="cg-copy-ck-correlation__object">
              <Typography shuku-edit-id="e-f0b4213c-1a93-4b06-bfde-f9144add3dd6" variant="bodySmall" tone="muted">输入局部窗口</Typography>
              <Matrix values={INPUT_SYMBOLS} label="互相关的代数输入局部窗口，元素为 x11 到 x33" />
            </div>
            <Typography shuku-edit-id="e-fbe710ce-f095-4c7e-853f-8f14cdfd78b7" as="span" variant="h2" tone="accent" className="cg-copy-ck-correlation__multiply" aria-hidden="true">×</Typography>
            <div shuku-edit-id="e-4f0108a5-643c-4fcd-ab07-b815aaeec637" className="cg-copy-ck-correlation__object">
              <Typography shuku-edit-id="e-ccb0dbb7-a3d7-4c03-8ce9-86f8fcf743c3" variant="bodySmall" tone="muted">原始卷积核</Typography>
              <Matrix values={KERNEL_SYMBOLS} label="互相关直接使用的代数卷积核，元素为 k11 到 k33" warm />
            </div>
            <Typography shuku-edit-id="e-38bdcba3-3fd2-4922-9be7-a8246a924015" as="span" variant="h2" tone="accent" className="cg-copy-ck-correlation__arrow" aria-hidden="true">→</Typography>
            <div shuku-edit-id="e-81fd15a4-d999-4337-937b-053eb9f63726" className="cg-copy-ck-correlation__output" aria-label="互相关输出 y i j">
              <Typography shuku-edit-id="e-386e5a84-ea4a-46bc-8535-1d931aea05ee" variant="bodySmall" tone="muted">输出</Typography>
              <MathFormulaStatic latex="y(i,j)" aria-label="y i j" />
            </div>
          </div>
        </section>

        <section shuku-edit-id="e-5f6c49b7-6586-492f-a474-217185364062" className="cg-copy-ck-correlation__panel cg-copy-ck-correlation__panel--strict" aria-labelledby="convolution-title">
          <header shuku-edit-id="e-77050eb2-dc64-4947-8fff-b6302d14a6ed" className="cg-copy-ck-correlation__panel-head">
            <Typography shuku-edit-id="e-d2ea0946-f5e0-4613-8a0f-33415e9fbc38" as="h2" variant="h3" tone="accent" id="convolution-title">严格卷积 <span shuku-edit-id="e-9737cb9d-21f4-43fc-b694-07471f78a0f9">(convolution)</span></Typography>
            <Typography shuku-edit-id="e-0f91f6bd-5ae0-4766-af7e-bf37814f77e8" variant="bodySmall" tone="muted">先将卷积核旋转 180°，再逐元素相乘并求和。</Typography>
          </header>
          <CorrelationFormula strict />
          <div shuku-edit-id="e-d8d7aee7-5f0a-4526-b81d-b8c30b1796b7" className="cg-copy-ck-correlation__operation">
            <div shuku-edit-id="e-eb07f77b-dd9b-48b8-bf14-366fb52b0f8d" className="cg-copy-ck-correlation__object">
              <Typography shuku-edit-id="e-67a3d203-10a9-430b-bba6-ea1b75b8552f" variant="bodySmall" tone="muted">输入局部窗口</Typography>
              <Matrix values={INPUT_SYMBOLS} label="严格卷积的代数输入局部窗口，元素为 x11 到 x33" />
            </div>
            <Typography shuku-edit-id="e-b7841fdf-f354-4018-863c-93cc745afc2b" as="span" variant="h2" tone="accent" className="cg-copy-ck-correlation__multiply" aria-hidden="true">×</Typography>
            <div shuku-edit-id="e-7e370ea9-5b01-4756-95be-9740c5c044ca" className="cg-copy-ck-correlation__object">
              <Typography shuku-edit-id="e-16def3a7-000a-4702-8957-815eaf011682" variant="bodySmall" tone="muted">旋转后的卷积核</Typography>
              <Matrix values={ROTATED_KERNEL_SYMBOLS} label="严格卷积的旋转代数卷积核，元素次序由 k33 到 k11" warm rotated />
            </div>
            <Typography shuku-edit-id="e-538f1616-f101-474b-b55b-62356dad0161" as="span" variant="h2" tone="accent" className="cg-copy-ck-correlation__arrow" aria-hidden="true">→</Typography>
            <div shuku-edit-id="e-6e2247d7-6562-4c8f-8509-b740215cb326" className="cg-copy-ck-correlation__output" aria-label="严格卷积输出 y i j">
              <Typography shuku-edit-id="e-5704eed2-b4b5-4447-b4c6-500c062a27b7" variant="bodySmall" tone="muted">输出</Typography>
              <MathFormulaStatic latex="y(i,j)" aria-label="y i j" />
            </div>
          </div>
        </section>
      </div>

      <div shuku-edit-id="e-56eab3c6-b936-46f6-bf2a-2f298c26f78b" className="cg-copy-ck-correlation__conclusion">
        <Typography shuku-edit-id="e-3544ac02-4f93-46cc-b4f7-894849e7e71d" as="span" variant="h3" tone="accent">结论：</Typography>
        <Typography shuku-edit-id="e-b1e2e304-166b-4974-894a-24dcdd7b4890" variant="body">严格卷积先旋转核 180°；深度学习中的“卷积”通常指互相关。</Typography>
      </div>
    </ContentBlock>
  );
}
