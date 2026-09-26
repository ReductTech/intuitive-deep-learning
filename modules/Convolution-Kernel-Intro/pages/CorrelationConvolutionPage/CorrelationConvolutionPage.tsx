import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import './CorrelationConvolutionPage.css';

const INPUT_SYMBOLS = Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, col) => `x_{${row + 1}${col + 1}}`));
const KERNEL_SYMBOLS = Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, col) => `k_{${row + 1}${col + 1}}`));
const ROTATED_KERNEL_SYMBOLS = KERNEL_SYMBOLS.slice().reverse().map((row) => row.slice().reverse());

function Matrix({ values, label, warm = false, rotated = false }: { values: string[][]; label: string; warm?: boolean; rotated?: boolean }) {
  return (
    <div className={`ck-correlation__matrix ${warm ? 'is-warm' : ''}`} role="img" aria-label={label} style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }}>
      {values.flatMap((row, rowIndex) => row.map((value, colIndex) => (
        <div key={`${rowIndex}-${colIndex}`} className={`ck-correlation__matrix-cell${warm ? ` is-kernel-row-${rotated ? 3 - rowIndex : rowIndex + 1}` : ''}`}>
          <MathFormulaStatic latex={value} aria-label={value.replace(/[{}]/g, '')} />
        </div>
      )))}
    </div>
  );
}

function SumSymbol({ index, limit }: { index: 'u' | 'v'; limit: 'm' | 'n' }) {
  return (
    <span className="ck-correlation__sum" aria-label={`${index} 从零到 ${limit} 减一`}>
      <span className="ck-correlation__sum-bound"><MathFormulaTerm latex={limit} tooltip={`${limit}：卷积核的${limit === 'm' ? '行数' : '列数'}。`} ariaLabel={`${limit}，卷积核${limit === 'm' ? '行数' : '列数'}`} /><MathFormulaStatic latex="-1" /></span>
      <MathFormulaStatic latex="\sum" className="ck-correlation__sum-symbol" />
      <span className="ck-correlation__sum-bound"><MathFormulaTerm latex={index} tooltip={`${index}：卷积核中的${index === 'u' ? '行' : '列'}索引。`} ariaLabel={`${index}，卷积核${index === 'u' ? '行' : '列'}索引`} /><MathFormulaStatic latex="=0" /></span>
    </span>
  );
}

function CorrelationFormula({ strict }: { strict: boolean }) {
  return (
    <MathFormulaBlock ariaLabel={strict ? '严格卷积公式' : '互相关公式'} className="ck-correlation__formula">
      <MathFormulaTerm latex="y" tooltip="y：当前位置的输出值。" ariaLabel="y，输出值" />
      <MathFormulaStatic latex="(" />
      <MathFormulaTerm latex="i" tooltip="i：输出位置的行索引。" ariaLabel="i，输出行索引" />
      <MathFormulaStatic latex="," />
      <MathFormulaTerm latex="j" tooltip="j：输出位置的列索引。" ariaLabel="j，输出列索引" />
      <MathFormulaStatic latex=")=" />
      <SumSymbol index="u" limit="m" />
      <SumSymbol index="v" limit="n" />
      <MathFormulaTerm latex="X" tooltip="X：输入图像。" ariaLabel="X，输入图像" />
      <MathFormulaStatic latex="(" />
      <MathFormulaTerm latex="i" tooltip="i：当前窗口的起始行。" ariaLabel="i，窗口起始行" />
      <MathFormulaStatic latex="+" />
      <MathFormulaTerm latex="u" tooltip="u：卷积核中的行偏移。" ariaLabel="u，行偏移" />
      <MathFormulaStatic latex="," />
      <MathFormulaTerm latex="j" tooltip="j：当前窗口的起始列。" ariaLabel="j，窗口起始列" />
      <MathFormulaStatic latex="+" />
      <MathFormulaTerm latex="v" tooltip="v：卷积核中的列偏移。" ariaLabel="v，列偏移" />
      <MathFormulaStatic latex=")" />
      <MathFormulaTerm latex={strict ? '\widetilde K' : 'K'} tooltip={strict ? 'K：这里使用旋转 180° 后的卷积核。' : 'K：这里直接使用原始卷积核。'} ariaLabel={strict ? 'K，旋转后的卷积核' : 'K，原始卷积核'} />
      <MathFormulaStatic latex="(" />
      <MathFormulaTerm latex="u" tooltip="u：卷积核的行索引。" ariaLabel="u，卷积核行索引" />
      <MathFormulaStatic latex="," />
      <MathFormulaTerm latex="v" tooltip="v：卷积核的列索引。" ariaLabel="v，卷积核列索引" />
      <MathFormulaStatic latex=")" />
    </MathFormulaBlock>
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
          <CorrelationFormula strict={false} />
          <div className="ck-correlation__operation">
            <div className="ck-correlation__object">
              <Typography variant="bodySmall" tone="muted">输入局部窗口</Typography>
              <Matrix values={INPUT_SYMBOLS} label="互相关的代数输入局部窗口，元素为 x11 到 x33" />
            </div>
            <Typography as="span" variant="h2" tone="accent" className="ck-correlation__multiply" aria-hidden="true">×</Typography>
            <div className="ck-correlation__object">
              <Typography variant="bodySmall" tone="muted">原始卷积核</Typography>
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
          <CorrelationFormula strict />
          <div className="ck-correlation__operation">
            <div className="ck-correlation__object">
              <Typography variant="bodySmall" tone="muted">输入局部窗口</Typography>
              <Matrix values={INPUT_SYMBOLS} label="严格卷积的代数输入局部窗口，元素为 x11 到 x33" />
            </div>
            <Typography as="span" variant="h2" tone="accent" className="ck-correlation__multiply" aria-hidden="true">×</Typography>
            <div className="ck-correlation__object">
              <Typography variant="bodySmall" tone="muted">旋转后的卷积核</Typography>
              <Matrix values={ROTATED_KERNEL_SYMBOLS} label="严格卷积的旋转代数卷积核，元素次序由 k33 到 k11" warm rotated />
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
        <Typography variant="body">严格卷积先旋转核 180°；深度学习中的“卷积”通常指互相关。</Typography>
      </div>
    </ContentBlock>
  );
}
