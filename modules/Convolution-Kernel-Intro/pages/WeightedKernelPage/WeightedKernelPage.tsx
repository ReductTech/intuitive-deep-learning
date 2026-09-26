import { useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import './WeightedKernelPage.css';

const INPUT = [[8, 2], [8, 2]];
const KERNEL = [[1, -1], [1, -1]];
const INPUT_PATTERNS = [
  { id: 'left-bright', label: '左亮右暗', values: INPUT },
  { id: 'left-dark', label: '左暗右亮', values: [[2, 8], [2, 8]] },
  { id: 'balanced', label: '左右相等', values: [[5, 5], [5, 5]] },
] as const;
function Matrix({ values, label, kind }: { values: readonly (readonly number[])[]; label: string; kind: 'input' | 'kernel' }) {
  return (
    <div className={`ck-weighted-kernel__matrix ck-weighted-kernel__matrix--${kind}`} role="img" aria-label={label}>
      {values.flatMap((row, rowIndex) => row.map((value, colIndex) => (
        <div className={`ck-weighted-kernel__cell ${value < 0 ? 'is-negative' : ''} ${kind === 'input' ? (value > 5 ? 'is-bright' : value < 5 ? 'is-dark' : 'is-neutral') : ''}`} key={`${rowIndex}-${colIndex}`}>
          <MathFormulaStatic latex={String(value)} aria-label={String(value)} />
        </div>
      )))}
    </div>
  );
}

function PatternButton({ pattern, selected, onSelect }: { pattern: typeof INPUT_PATTERNS[number]; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" className={`ck-weighted-kernel__pattern ${selected ? 'is-selected' : ''}`} onClick={onSelect} aria-pressed={selected}>
      <span className="ck-weighted-kernel__pattern-swatch" aria-hidden="true">
        {pattern.values.flatMap((row, rowIndex) => row.map((value, colIndex) => <i className={value > 5 ? 'is-bright' : value < 5 ? 'is-dark' : 'is-neutral'} key={`${rowIndex}-${colIndex}`} />))}
      </span>
      <Typography as="span" variant="bodySmall" tone={selected ? 'accent' : 'muted'}>{pattern.label}</Typography>
    </button>
  );
}

export function WeightedKernelPage() {
  const [selectedPatternId, setSelectedPatternId] = useState<(typeof INPUT_PATTERNS)[number]['id']>('left-bright');
  const selectedPattern = INPUT_PATTERNS.find((pattern) => pattern.id === selectedPatternId) ?? INPUT_PATTERNS[0];
  const output = selectedPattern.values.flat().reduce((sum, value, index) => sum + value * KERNEL.flat()[index], 0);
  const [topLeft, topRight, bottomLeft, bottomRight] = selectedPattern.values.flat();
  return (
    <ContentBlock
      headingLevel={1}
      className="ck-weighted-kernel"
      title="权重决定局部响应"
      subtitle="每个位置的输入按对应权重参与求和，权重的符号、大小和空间排列共同决定输出响应。"
    >
      <div className="ck-weighted-kernel__body">
        <section className="ck-weighted-kernel__concepts" aria-label="卷积核权重如何决定局部响应">
          <Typography variant="bodySmall" tone="muted">卷积的计算形式</Typography>
          <MathFormulaBlock ariaLabel="局部加权求和公式" className="ck-weighted-kernel__concept-formula">
            <MathFormulaTerm latex="y" tooltip="y：当前位置的局部响应。" ariaLabel="y，局部响应" />
            <MathFormulaStatic latex="=" />
            <MathFormulaTerm latex="\sum" tooltip="Σ：把局部区域内各位置的乘积相加。" ariaLabel="求和符号，累加各位置乘积" />
            <MathFormulaTerm latex="x_{uv}" tooltip="x：输入数值；u、v 分别是局部区域的行、列索引。" ariaLabel="x 下标 u v，输入区域中第 u 行第 v 列的数值" />
            <MathFormulaTerm latex="w_{uv}" tooltip="w：对应位置的卷积核权重；u、v 分别是行、列索引。" ariaLabel="w 下标 u v，卷积核第 u 行第 v 列的权重" />
          </MathFormulaBlock>
          <div className="ck-weighted-kernel__concept-card ck-weighted-kernel__concept-card--sign">
            <span className="ck-weighted-kernel__concept-icon" aria-hidden="true">±</span>
            <div><Typography variant="h3" tone="danger">符号</Typography><Typography variant="bodySmall" tone="muted">w &gt; 0 加入，w &lt; 0 减去；w = 0 忽略</Typography></div>
          </div>
          <div className="ck-weighted-kernel__concept-card ck-weighted-kernel__concept-card--size">
            <span className="ck-weighted-kernel__concept-icon" aria-hidden="true">▂▅▇</span>
            <div><Typography variant="h3" tone="accent">大小</Typography><Typography variant="bodySmall" tone="muted"><MathFormulaStatic latex="|w|" /> 越大，贡献幅度越大</Typography></div>
          </div>
          <div className="ck-weighted-kernel__concept-card ck-weighted-kernel__concept-card--arrangement">
            <span className="ck-weighted-kernel__concept-icon" aria-hidden="true">▦</span>
            <div><Typography variant="h3">排列</Typography><Typography variant="bodySmall" tone="muted">空间排列决定响应哪种局部结构</Typography></div>
          </div>
        </section>

        <section className="ck-weighted-kernel__calculation" aria-label="一次局部加权计算">
          <article className="ck-weighted-kernel__step">
            <header className="ck-weighted-kernel__step-head">
              <span className="ck-weighted-kernel__step-number"><Typography as="span" variant="h3" tone="light">1</Typography></span>
              <Typography as="h2" variant="h3" tone="accent">输入区域 <MathFormulaStatic latex="x" /></Typography>
            </header>
            <Matrix values={selectedPattern.values} label={`输入矩阵：${selectedPattern.label}`} kind="input" />
            <div className="ck-weighted-kernel__input-footer">
              <Typography variant="body" tone="accent" className="ck-weighted-kernel__matrix-caption">{selectedPattern.label}</Typography>
              <div className="ck-weighted-kernel__patterns" aria-label="切换输入明暗模式">
                {INPUT_PATTERNS.map((pattern) => <PatternButton key={pattern.id} pattern={pattern} selected={selectedPatternId === pattern.id} onSelect={() => setSelectedPatternId(pattern.id)} />)}
              </div>
            </div>
          </article>

          <Typography as="span" variant="h1" tone="accent" className="ck-weighted-kernel__operator" aria-hidden="true">×</Typography>

          <article className="ck-weighted-kernel__step">
            <header className="ck-weighted-kernel__step-head">
              <span className="ck-weighted-kernel__step-number"><Typography as="span" variant="h3" tone="light">2</Typography></span>
              <Typography as="h2" variant="h3" tone="accent">卷积核 <MathFormulaStatic latex="w" /></Typography>
            </header>
            <Matrix values={KERNEL} label="卷积核矩阵：第一列为正一，第二列为负一" kind="kernel" />
            <div className="ck-weighted-kernel__kernel-callout">
              <Typography variant="body" tone="accent">左列相加，右列相减</Typography>
              <MathFormulaStatic latex={`${topLeft}\\times1+${topRight}\\times(-1)+${bottomLeft}\\times1+${bottomRight}\\times(-1)`} />
              <MathFormulaStatic latex={`=(${topLeft}+${bottomLeft})-(${topRight}+${bottomRight})=${output}`} />
            </div>
          </article>

          <Typography as="span" variant="h1" tone="accent" className="ck-weighted-kernel__operator" aria-hidden="true">→</Typography>

          <article className="ck-weighted-kernel__step ck-weighted-kernel__step--output">
            <header className="ck-weighted-kernel__step-head">
              <span className="ck-weighted-kernel__step-number"><Typography as="span" variant="h3" tone="light">3</Typography></span>
              <Typography as="h2" variant="h3" tone="accent">局部响应 <MathFormulaStatic latex="y" /></Typography>
            </header>
              <div className="ck-weighted-kernel__output">
              <MathFormulaStatic latex={`y=${output > 0 ? '+' : ''}${output}`} aria-label={`y 等于 ${output}`} />
            </div>
            <div className="ck-weighted-kernel__interpretations">
              <div className={output > 0 ? 'is-active' : ''}><MathFormulaStatic latex="y>0" /><Typography variant="bodySmall" tone="inherit">左侧更亮</Typography></div>
              <div className={output < 0 ? 'is-active' : ''}><MathFormulaStatic latex="y<0" /><Typography variant="bodySmall" tone="inherit">右侧更亮</Typography></div>
              <div className={output === 0 ? 'is-active' : ''}><MathFormulaStatic latex="y=0" /><Typography variant="bodySmall" tone="inherit">左右相同</Typography></div>
            </div>
          </article>
        </section>

        <footer className="ck-weighted-kernel__summary">
          <span className="ck-weighted-kernel__summary-mark" aria-hidden="true"><Typography as="span" variant="h3" tone="light">i</Typography></span>
          <Typography as="span" variant="h3" tone="accent">总结：</Typography>
          <Typography variant="body">正负权重的组合，可以把局部差异转化为带符号的响应。</Typography>
        </footer>
      </div>
    </ContentBlock>
  );
}
