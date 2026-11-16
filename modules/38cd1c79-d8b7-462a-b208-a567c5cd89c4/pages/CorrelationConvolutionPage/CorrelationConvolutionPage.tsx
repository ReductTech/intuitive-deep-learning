import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import './CorrelationConvolutionPage.css';

const INPUT_SYMBOLS = Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, col) => `x_{${row + 1}${col + 1}}`));
const KERNEL_SYMBOLS = Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, col) => `k_{${row + 1}${col + 1}}`));
const ROTATED_KERNEL_SYMBOLS = KERNEL_SYMBOLS.slice().reverse().map((row) => row.slice().reverse());
const KERNEL_CELL_COLORS = ['#dcecff', '#cee2fc', '#bad7fa', '#fff0df', '#ffe3ca', '#fbd5b5', '#e1f5e8', '#ccebdc', '#b5e2cc'];

function Matrix({ values, label, warm = false, rotated = false }: { values: string[][]; label: string; warm?: boolean; rotated?: boolean }) {
  return (
    <div shuku-edit-id="e-2fd710ea-fb59-4560-a2c2-589c20730cd2" className={`ck-correlation__matrix ${warm ? 'is-warm' : ''}`} role="img" aria-label={label} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }}>
      {values.flatMap((row, rowIndex) => row.map((value, colIndex) => (
        <div shuku-edit-id="e-57ee4b50-4a6f-425b-a544-a5e28e43e704" key={`${rowIndex}-${colIndex}`} className="ck-correlation__matrix-cell" style={warm ? { backgroundColor: KERNEL_CELL_COLORS[rotated ? 8 - (rowIndex * 3 + colIndex) : rowIndex * 3 + colIndex] } : undefined}>
          <MathFormulaStatic latex={value} aria-label={value.replace(/[{}]/g, '')} />
        </div>
      )))}
    </div>
  );
}

function CorrelationFormula({ strict }: { strict: boolean }) {
  return (
    <MathFormulaBlock ariaLabel={strict ? '严格卷积公式' : '互相关公式'} className="ck-correlation__formula">
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
    <ContentBlock shuku-edit-id="e-4f5efd2f-860e-404c-bdb3-3282246773f5"
      headingLevel={1}
      className="ck-correlation"
      title="互相关与卷积"
      subtitle="严格卷积需要先将核旋转 180°；深度学习中的“卷积”通常实际采用互相关。"
    >
      <div shuku-edit-id="e-aced8c89-f2d7-43db-89b4-c679e30cb9a0" className="ck-correlation__comparison">
        <section shuku-edit-id="e-dff1c37b-4a2f-4fd5-91ac-75fb863e7e4b" className="ck-correlation__panel" aria-labelledby="cross-correlation-title">
          <header shuku-edit-id="e-ef15ec5f-ba79-4508-9429-b0cce31f0269" className="ck-correlation__panel-head">
            <Typography shuku-edit-id="e-6d2ddbc5-d450-467b-a4c0-782f5d782940" as="h2" variant="h3" tone="accent" id="cross-correlation-title">互相关 <span shuku-edit-id="e-a9268333-0b84-47b9-9a5f-ca0609371838">(cross-correlation)</span></Typography>
            <Typography shuku-edit-id="e-f9d0321f-9a88-4023-9574-40840d152fe8" variant="bodySmall" tone="muted">直接使用卷积核 <strong shuku-edit-id="e-2c790e62-4728-40da-aa23-45b73534de34">K</strong>，不做旋转。</Typography>
          </header>
          <CorrelationFormula strict={false} />
          <div shuku-edit-id="e-9fcdf086-2173-4b19-9f55-53bef275a228" className="ck-correlation__operation">
            <div shuku-edit-id="e-aaf15474-201a-4dc9-bab5-dcdee4c60ad2" className="ck-correlation__object">
              <Typography shuku-edit-id="e-a0a615ad-faeb-4d42-b84f-2d8b919efd82" variant="bodySmall" tone="muted">输入局部窗口</Typography>
              <Matrix values={INPUT_SYMBOLS} label="互相关的代数输入局部窗口，元素为 x11 到 x33" />
            </div>
            <Typography shuku-edit-id="e-4e4b17bd-5bcc-4a53-9ccc-505d80f36e0e" as="span" variant="h2" tone="accent" className="ck-correlation__multiply" aria-hidden="true">×</Typography>
            <div shuku-edit-id="e-d542ae8d-5d3b-45a6-b8d3-addf578dcd6a" className="ck-correlation__object">
              <Typography shuku-edit-id="e-c0a59806-2937-458d-b7f7-10d91cec5525" variant="bodySmall" tone="muted">原始卷积核</Typography>
              <Matrix values={KERNEL_SYMBOLS} label="互相关直接使用的代数卷积核，元素为 k11 到 k33" warm />
            </div>
            <Typography shuku-edit-id="e-31eafb1e-88e1-4619-804a-801edcb4fa75" as="span" variant="h2" tone="accent" className="ck-correlation__arrow" aria-hidden="true">→</Typography>
            <div shuku-edit-id="e-4845bb7d-1a1c-48fc-9c9d-368ea122effb" className="ck-correlation__output" aria-label="互相关输出 y i j">
              <Typography shuku-edit-id="e-5ba333a8-a544-43c1-b5bd-f09ac9c0401b" variant="bodySmall" tone="muted">输出</Typography>
              <MathFormulaStatic latex="y(i,j)" aria-label="y i j" />
            </div>
          </div>
        </section>

        <section shuku-edit-id="e-16a49974-f14d-449d-abb1-0388cf9a0e39" className="ck-correlation__panel ck-correlation__panel--strict" aria-labelledby="convolution-title">
          <header shuku-edit-id="e-7bb162d7-4ab6-4ba5-8118-2b855d1cd0a9" className="ck-correlation__panel-head">
            <Typography shuku-edit-id="e-626d50c0-28e7-479c-b977-12fe2d29ba2c" as="h2" variant="h3" tone="accent" id="convolution-title">严格卷积 <span shuku-edit-id="e-4fb7f1c5-a83f-4e59-b6cf-8f140f981e20">(convolution)</span></Typography>
            <Typography shuku-edit-id="e-2299aeaa-0003-46dd-a97d-bf9745ca2ea8" variant="bodySmall" tone="muted">先将卷积核旋转 180°，再逐元素相乘并求和。</Typography>
          </header>
          <CorrelationFormula strict />
          <div shuku-edit-id="e-6ab4e31a-443f-4592-b33e-b8ecec9d6bd3" className="ck-correlation__operation">
            <div shuku-edit-id="e-880d5cc7-6a2f-4dd4-9960-fc76a2618c38" className="ck-correlation__object">
              <Typography shuku-edit-id="e-110827ea-cb13-4542-8168-27d9b2ce8b8d" variant="bodySmall" tone="muted">输入局部窗口</Typography>
              <Matrix values={INPUT_SYMBOLS} label="严格卷积的代数输入局部窗口，元素为 x11 到 x33" />
            </div>
            <Typography shuku-edit-id="e-8c0a457e-a7e0-4e81-a206-723bba36b992" as="span" variant="h2" tone="accent" className="ck-correlation__multiply" aria-hidden="true">×</Typography>
            <div shuku-edit-id="e-b9179a77-a29b-440a-9390-2f6e700394d7" className="ck-correlation__object">
              <Typography shuku-edit-id="e-10de9e53-d181-4628-b74f-117ca74fcc16" variant="bodySmall" tone="muted">旋转后的卷积核</Typography>
              <Matrix values={ROTATED_KERNEL_SYMBOLS} label="严格卷积的旋转代数卷积核，元素次序由 k33 到 k11" warm rotated />
            </div>
            <Typography shuku-edit-id="e-2df67015-c8f0-4b32-a383-175d6e22b29c" as="span" variant="h2" tone="accent" className="ck-correlation__arrow" aria-hidden="true">→</Typography>
            <div shuku-edit-id="e-8f15e239-0ccd-47fd-ad46-a2d95bf5f93b" className="ck-correlation__output" aria-label="严格卷积输出 y i j">
              <Typography shuku-edit-id="e-4be86e3d-7ab3-4e82-abc2-2472b4d7f2c0" variant="bodySmall" tone="muted">输出</Typography>
              <MathFormulaStatic latex="y(i,j)" aria-label="y i j" />
            </div>
          </div>
        </section>
      </div>

      <div shuku-edit-id="e-f787a43b-46e2-4ab0-a871-a1a2a3982369" className="ck-correlation__conclusion">
        <Typography shuku-edit-id="e-894180ae-28f4-4d5b-92ce-720c66692f17" as="span" variant="h3" tone="accent">结论：</Typography>
        <Typography shuku-edit-id="e-2a313952-82a4-4a47-b4f6-16c655aa386d" variant="body">严格卷积先旋转核 180°；深度学习中的“卷积”通常指互相关。</Typography>
      </div>
    </ContentBlock>
  );
}
