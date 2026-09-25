import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import './CorrelationConvolutionPage.css';

const INPUT_SYMBOLS = Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, col) => `x_{${row + 1}${col + 1}}`));
const KERNEL_SYMBOLS = Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, col) => `k_{${row + 1}${col + 1}}`));
const ROTATED_KERNEL_SYMBOLS = KERNEL_SYMBOLS.slice().reverse().map((row) => row.slice().reverse());

function Matrix({ values, label, warm = false }: { values: string[][]; label: string; warm?: boolean }) {
  return (
    <div className={`ck-correlation__matrix ${warm ? 'is-warm' : ''}`} role="img" aria-label={label} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }}>
      {values.flatMap((row, rowIndex) => row.map((value, colIndex) => (
        <div key={`${rowIndex}-${colIndex}`} className="ck-correlation__matrix-cell">
          <MathFormulaStatic latex={value} aria-label={value.replace(/[{}]/g, '')} />
        </div>
      )))}
    </div>
  );
}

export interface CorrelationConvolutionPageProps {
  onComplete: () => void;
}

export function CorrelationConvolutionPage({ onComplete }: CorrelationConvolutionPageProps) {
  return (
    <ContentBlock
      headingLevel={1}
      className="ck-correlation"
      title="互相关与卷积"
      subtitle="严格卷积需要先将核旋转 180°；深度学习中的“卷积”通常实际采用互相关。"
    >
      <div className="ck-correlation__comparison">
        <section className="ck-correlation__panel" aria-labelledby="cross-correlation-title">
          <header className="ck-correlation__panel-head">
            <Typography as="h2" variant="h3" tone="accent" id="cross-correlation-title">互相关 <span>(cross-correlation)</span></Typography>
            <Typography variant="bodySmall" tone="muted">直接使用卷积核 <strong>K</strong>，不做旋转。</Typography>
          </header>
          <MathFormulaBlock ariaLabel="互相关公式" className="ck-correlation__formula">
            <MathFormulaTerm latex="y(i,j)" tooltip="互相关在位置 i,j 的输出。" ariaLabel="y i j，互相关输出" />
            <MathFormulaStatic latex="=" />
            <MathFormulaStatic latex="\sum_{u=0}^{m-1}\sum_{v=0}^{n-1}" />
            <MathFormulaStatic latex="X(i+u,j+v)K(u,v)" />
          </MathFormulaBlock>
          <div className="ck-correlation__operation">
            <div className="ck-correlation__object">
              <Typography variant="bodySmall" tone="muted">输入局部窗口 X</Typography>
              <Matrix values={INPUT_SYMBOLS} label="互相关的代数输入局部窗口，元素为 x11 到 x33" />
            </div>
            <Typography as="span" variant="h2" tone="accent" className="ck-correlation__multiply" aria-hidden="true">×</Typography>
            <div className="ck-correlation__object">
              <Typography variant="bodySmall" tone="muted">原始卷积核 K</Typography>
              <Matrix values={KERNEL_SYMBOLS} label="互相关直接使用的代数卷积核，元素为 k11 到 k33" warm />
            </div>
            <Typography as="span" variant="h2" tone="accent" className="ck-correlation__arrow" aria-hidden="true">→</Typography>
            <div className="ck-correlation__output" aria-label="互相关输出 y i j">
              <Typography variant="bodySmall" tone="muted">输出</Typography>
              <MathFormulaStatic latex="y(i,j)" aria-label="y i j" />
            </div>
          </div>
        </section>

        <section className="ck-correlation__panel ck-correlation__panel--strict" aria-labelledby="convolution-title">
          <header className="ck-correlation__panel-head">
            <Typography as="h2" variant="h3" tone="accent" id="convolution-title">严格卷积 <span>(convolution)</span></Typography>
            <Typography variant="bodySmall" tone="muted">先将卷积核旋转 180°，再逐元素相乘并求和。</Typography>
          </header>
          <MathFormulaBlock ariaLabel="严格卷积公式" className="ck-correlation__formula">
            <MathFormulaTerm latex="y(i,j)" tooltip="严格卷积在位置 i,j 的输出。" ariaLabel="y i j，严格卷积输出" />
            <MathFormulaStatic latex="=" />
            <MathFormulaStatic latex="\sum_{u=0}^{m-1}\sum_{v=0}^{n-1}" />
            <MathFormulaStatic latex="X(i+u,j+v)\,\widetilde K(u,v)" />
          </MathFormulaBlock>
          <div className="ck-correlation__operation">
            <div className="ck-correlation__object">
              <Typography variant="bodySmall" tone="muted">输入局部窗口 X</Typography>
              <Matrix values={INPUT_SYMBOLS} label="严格卷积的代数输入局部窗口，元素为 x11 到 x33" />
            </div>
            <Typography as="span" variant="h2" tone="accent" className="ck-correlation__multiply" aria-hidden="true">×</Typography>
            <div className="ck-correlation__object">
              <Typography variant="bodySmall" tone="muted">旋转后的卷积核</Typography>
              <Matrix values={ROTATED_KERNEL_SYMBOLS} label="严格卷积的旋转代数卷积核，元素次序由 k33 到 k11" warm />
            </div>
            <Typography as="span" variant="h2" tone="accent" className="ck-correlation__arrow" aria-hidden="true">→</Typography>
            <div className="ck-correlation__output" aria-label="严格卷积输出 y i j">
              <Typography variant="bodySmall" tone="muted">输出</Typography>
              <MathFormulaStatic latex="y(i,j)" aria-label="y i j" />
            </div>
          </div>
        </section>
      </div>

      <div className="ck-correlation__conclusion">
        <Typography as="span" variant="h3" tone="accent">结论：</Typography>
        <Typography variant="body">严格来说，卷积需要先将核旋转 180°；但在深度学习中，卷积层通常直接采用互相关运算，只是习惯上仍称作“卷积”。</Typography>
      </div>
    </ContentBlock>
  );
}
