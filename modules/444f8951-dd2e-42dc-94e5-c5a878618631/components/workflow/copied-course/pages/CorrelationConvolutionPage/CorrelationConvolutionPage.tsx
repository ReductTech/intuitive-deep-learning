import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import './CorrelationConvolutionPage.css';

const INPUT_SYMBOLS = Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, col) => `x_{${row + 1}${col + 1}}`));
const KERNEL_SYMBOLS = Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, col) => `k_{${row + 1}${col + 1}}`));
const ROTATED_KERNEL_SYMBOLS = KERNEL_SYMBOLS.slice().reverse().map((row) => row.slice().reverse());
const KERNEL_CELL_COLORS = ['#dcecff', '#cee2fc', '#bad7fa', '#fff0df', '#ffe3ca', '#fbd5b5', '#e1f5e8', '#ccebdc', '#b5e2cc'];

function Matrix({ values, label, warm = false, rotated = false }: { values: string[][]; label: string; warm?: boolean; rotated?: boolean }) {
  return (
    <div shuku-edit-id="e-f1862671-250a-4012-b60a-2fd115e247f3" className={`cg-copy-ck-correlation__matrix ${warm ? 'is-warm' : ''}`} role="img" aria-label={label} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }}>
      {values.flatMap((row, rowIndex) => row.map((value, colIndex) => (
        <div shuku-edit-id="e-feb61fd2-3a99-405b-a934-1f9715ab0501" key={`${rowIndex}-${colIndex}`} className="cg-copy-ck-correlation__matrix-cell" style={warm ? { backgroundColor: KERNEL_CELL_COLORS[rotated ? 8 - (rowIndex * 3 + colIndex) : rowIndex * 3 + colIndex] } : undefined}>
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
    <ContentBlock shuku-edit-id="e-e8dcd585-30e4-416f-88e9-2bfc6f753bdb"
      headingLevel={1}
      className="cg-copy-ck-correlation"
      title="互相关与卷积"
      subtitle="严格卷积需要先将核旋转 180°；深度学习中的“卷积”通常实际采用互相关。"
    >
      <div shuku-edit-id="e-23e2c235-a117-427b-9a6d-f50dd9038098" className="cg-copy-ck-correlation__comparison">
        <section shuku-edit-id="e-efa8c3f6-8c0f-49a7-a308-2e27be54ba0c" className="cg-copy-ck-correlation__panel" aria-labelledby="cross-correlation-title">
          <header shuku-edit-id="e-10f41c93-3bbb-4cbb-899e-ceade0a680ff" className="cg-copy-ck-correlation__panel-head">
            <Typography shuku-edit-id="e-c0f9bd18-6aa5-46c6-bc89-babed0c395e0" as="h2" variant="h3" tone="accent" id="cross-correlation-title">互相关 <span shuku-edit-id="e-efc2c849-ba11-49f4-9792-7f9deac756e9">(cross-correlation)</span></Typography>
            <Typography shuku-edit-id="e-387a8448-715d-497d-ab25-a38abfe793ac" variant="bodySmall" tone="muted">直接使用卷积核 <strong shuku-edit-id="e-4bd7b84b-350b-4447-8bf0-b39ffabd4ef1">K</strong>，不做旋转。</Typography>
          </header>
          <CorrelationFormula strict={false} />
          <div shuku-edit-id="e-567110b0-9f19-4b4e-9b1b-976903b18342" className="cg-copy-ck-correlation__operation">
            <div shuku-edit-id="e-d404baa9-5911-4e19-9f0f-ca2843504035" className="cg-copy-ck-correlation__object">
              <Typography shuku-edit-id="e-56fdc3e0-fadc-4a99-a06e-2093782c97f5" variant="bodySmall" tone="muted">输入局部窗口</Typography>
              <Matrix values={INPUT_SYMBOLS} label="互相关的代数输入局部窗口，元素为 x11 到 x33" />
            </div>
            <Typography shuku-edit-id="e-4c2d20b3-d374-4e0c-9e44-b04cd608be22" as="span" variant="h2" tone="accent" className="cg-copy-ck-correlation__multiply" aria-hidden="true">×</Typography>
            <div shuku-edit-id="e-bc83537d-5739-47ed-9efe-cbaea8da4455" className="cg-copy-ck-correlation__object">
              <Typography shuku-edit-id="e-3efbbeea-67ea-4cff-bfc7-bfd60ca826c7" variant="bodySmall" tone="muted">原始卷积核</Typography>
              <Matrix values={KERNEL_SYMBOLS} label="互相关直接使用的代数卷积核，元素为 k11 到 k33" warm />
            </div>
            <Typography shuku-edit-id="e-604954c7-3db2-4f94-ade3-e7d41fcbfa87" as="span" variant="h2" tone="accent" className="cg-copy-ck-correlation__arrow" aria-hidden="true">→</Typography>
            <div shuku-edit-id="e-c9449905-c655-4682-8212-8296065157d7" className="cg-copy-ck-correlation__output" aria-label="互相关输出 y i j">
              <Typography shuku-edit-id="e-471ee41e-66dd-4c47-8595-c725b86e2ca7" variant="bodySmall" tone="muted">输出</Typography>
              <MathFormulaStatic latex="y(i,j)" aria-label="y i j" />
            </div>
          </div>
        </section>

        <section shuku-edit-id="e-036c74d1-aad1-4a99-9a82-42a6cdb9ba8d" className="cg-copy-ck-correlation__panel cg-copy-ck-correlation__panel--strict" aria-labelledby="convolution-title">
          <header shuku-edit-id="e-0b1b0bb5-b91e-4ded-a2d9-5b1426322bc3" className="cg-copy-ck-correlation__panel-head">
            <Typography shuku-edit-id="e-422d70e0-2837-4137-bfd0-a53e0655d65c" as="h2" variant="h3" tone="accent" id="convolution-title">严格卷积 <span shuku-edit-id="e-591fd32f-b7ff-4350-bad4-b88650fa177a">(convolution)</span></Typography>
            <Typography shuku-edit-id="e-0f2c0a79-962f-46eb-a51f-108482805398" variant="bodySmall" tone="muted">先将卷积核旋转 180°，再逐元素相乘并求和。</Typography>
          </header>
          <CorrelationFormula strict />
          <div shuku-edit-id="e-396a29fe-e2ca-40ee-8595-05c951257ebe" className="cg-copy-ck-correlation__operation">
            <div shuku-edit-id="e-8b451bb5-9c16-4e27-bea6-d4ff8e1c33fb" className="cg-copy-ck-correlation__object">
              <Typography shuku-edit-id="e-f61dfcaa-84ea-45ca-83d9-31f3bea4d7f4" variant="bodySmall" tone="muted">输入局部窗口</Typography>
              <Matrix values={INPUT_SYMBOLS} label="严格卷积的代数输入局部窗口，元素为 x11 到 x33" />
            </div>
            <Typography shuku-edit-id="e-1ac32d67-7149-4342-bb01-74e7d37dc438" as="span" variant="h2" tone="accent" className="cg-copy-ck-correlation__multiply" aria-hidden="true">×</Typography>
            <div shuku-edit-id="e-18fab109-ae77-46dc-b417-13e55f3ae145" className="cg-copy-ck-correlation__object">
              <Typography shuku-edit-id="e-29146955-1ee7-4b75-8449-94efd9e768c9" variant="bodySmall" tone="muted">旋转后的卷积核</Typography>
              <Matrix values={ROTATED_KERNEL_SYMBOLS} label="严格卷积的旋转代数卷积核，元素次序由 k33 到 k11" warm rotated />
            </div>
            <Typography shuku-edit-id="e-b768acae-5c88-42da-9978-bda58588a695" as="span" variant="h2" tone="accent" className="cg-copy-ck-correlation__arrow" aria-hidden="true">→</Typography>
            <div shuku-edit-id="e-f51e47cb-bb8c-49f3-9966-0ba8cfc59783" className="cg-copy-ck-correlation__output" aria-label="严格卷积输出 y i j">
              <Typography shuku-edit-id="e-f97e2ab4-fa92-4ae2-9ba6-4dc18f671e7b" variant="bodySmall" tone="muted">输出</Typography>
              <MathFormulaStatic latex="y(i,j)" aria-label="y i j" />
            </div>
          </div>
        </section>
      </div>

      <div shuku-edit-id="e-796bf640-1bcd-418e-a1e6-2ced4d35ad5f" className="cg-copy-ck-correlation__conclusion">
        <Typography shuku-edit-id="e-42268e6b-8f5a-4ee1-9757-60fd9b5fc99b" as="span" variant="h3" tone="accent">结论：</Typography>
        <Typography shuku-edit-id="e-0b3719d1-04a9-4867-8162-8449de3f1852" variant="body">严格卷积先旋转核 180°；深度学习中的“卷积”通常指互相关。</Typography>
      </div>
    </ContentBlock>
  );
}
