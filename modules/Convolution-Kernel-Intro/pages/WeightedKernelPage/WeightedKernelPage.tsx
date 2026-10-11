import { useState, type CSSProperties } from 'react';
import { ContentBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import './WeightedKernelPage.css';

const KERNEL = [[1, -1], [1, -1]];
const PATTERNS = [
  { id: 'left-bright', label: '左亮右暗', values: [[8, 2], [8, 2]] },
  { id: 'right-bright', label: '左暗右亮', values: [[2, 8], [2, 8]] },
  { id: 'equal', label: '左右相等', values: [[5, 5], [5, 5]] },
] as const;

function Matrix({ values, kind, label }: { values: readonly (readonly number[])[]; kind: 'input' | 'kernel'; label: string }) {
  return <div className={`ck-weighted__matrix ck-weighted__matrix--${kind}`} role="img" aria-label={label}>
    {values.flatMap((row, rowIndex) => row.map((value, colIndex) => <div key={`${rowIndex}-${colIndex}`} className={`ck-weighted__cell ${kind === 'input' ? value > 5 ? 'is-bright' : value < 5 ? 'is-dark' : 'is-neutral' : value < 0 ? 'is-negative' : 'is-positive'}`}><MathFormulaStatic latex={String(value)} /></div>))}
  </div>;
}

export function WeightedKernelPage() {
  const [patternId, setPatternId] = useState<(typeof PATTERNS)[number]['id']>('left-bright');
  const pattern = PATTERNS.find((item) => item.id === patternId) ?? PATTERNS[0];
  const [[topLeft, topRight], [bottomLeft, bottomRight]] = pattern.values;
  const output = (topLeft - topRight) + (bottomLeft - bottomRight);
  const activeIndex = output < 0 ? 0 : output > 0 ? 2 : 1;
  const interpretation = output < 0 ? '右边比左边更亮。' : output > 0 ? '左边比右边更亮。' : '左右亮度相同。';
  const markerStyle = { left: `${50 + Math.max(-12, Math.min(12, output)) / 12 * 43}%` } as CSSProperties;

  return <ContentBlock headingLevel={1} className="ck-weighted" title="权重决定局部响应" subtitle="每个位置的输入按对应权重参与求和；符号、大小和排列共同决定输出。">
    <div className="ck-weighted__body">
      <section className="ck-weighted__concepts" aria-label="权重的三个作用">
        <div className="ck-weighted__concept"><span className="ck-weighted__concept-icon" aria-hidden="true">±</span><div><Typography as="h2" variant="h3" tone="accent">符号</Typography><Typography variant="bodySmall" tone="muted">w &gt; 0 加入，w &lt; 0 减去，w = 0 忽略</Typography></div></div>
        <div className="ck-weighted__concept"><span className="ck-weighted__concept-icon" aria-hidden="true">▂▅▇</span><div><Typography as="h2" variant="h3" tone="accent">大小</Typography><Typography variant="bodySmall" tone="muted">|w| 越大，影响越强</Typography></div></div>
        <div className="ck-weighted__concept"><span className="ck-weighted__concept-icon" aria-hidden="true">▦</span><div><Typography as="h2" variant="h3" tone="accent">排列</Typography><Typography variant="bodySmall" tone="muted">决定要比较哪种局部结构</Typography></div></div>
      </section>

      <div className="ck-weighted__flow">
        <section className="ck-weighted__panel" aria-label="选择输入区域">
          <header><Typography as="h2" variant="h3" tone="accent">输入区域 <MathFormulaStatic latex="x" /></Typography></header>
          <Matrix values={pattern.values} kind="input" label={`输入区域：${pattern.label}`} />
          <Typography variant="body" tone="accent">{pattern.label}</Typography>
          <div className="ck-weighted__patterns" role="group" aria-label="选择输入明暗模式">
            {PATTERNS.map((item) => <button key={item.id} type="button" className={patternId === item.id ? 'is-selected' : ''} aria-pressed={patternId === item.id} onClick={() => setPatternId(item.id)}><Typography as="span" variant="bodySmall" tone="inherit">{item.label}</Typography></button>)}
          </div>
        </section>
        <span className="ck-weighted__arrow" aria-hidden="true">→</span>
        <section className="ck-weighted__panel ck-weighted__panel--kernel" aria-label="卷积核及当前比较">
          <header><Typography as="h2" variant="h3" tone="accent">卷积核 <MathFormulaStatic latex="w" /></Typography></header>
          <Matrix values={KERNEL} kind="kernel" label="卷积核：左列为正一，右列为负一" />
          <div className="ck-weighted__question"><Typography variant="body" tone="accent">这个核在比较：左边是否比右边更亮？</Typography></div>
        </section>
        <span className="ck-weighted__arrow" aria-hidden="true">→</span>
        <section className="ck-weighted__panel ck-weighted__panel--response" aria-label="局部响应与符号含义">
          <header><Typography as="h2" variant="h3" tone="accent">局部响应 <MathFormulaStatic latex="y" /></Typography></header>
          <div className={`ck-weighted__result ${output < 0 ? 'is-negative' : output === 0 ? 'is-zero' : ''}`}><MathFormulaStatic latex={`y=${output > 0 ? '+' : ''}${output}`} /></div>
          <div className="ck-weighted__scale" aria-label={`当前局部响应 ${output}`}>
            <div className="ck-weighted__scale-bar"><span className={`ck-weighted__marker ${output < 0 ? 'is-negative' : output === 0 ? 'is-zero' : ''}`} style={markerStyle}>{output > 0 ? '+' : ''}{output}</span></div>
            <div className="ck-weighted__scale-labels">
              {['右边更亮', '左右相同', '左边更亮'].map((label, index) => <div key={label} className={activeIndex === index ? 'is-active' : ''}><MathFormulaStatic latex={index === 0 ? 'y<0' : index === 1 ? 'y=0' : 'y>0'} /><Typography variant="body" tone="inherit">{label}</Typography></div>)}
            </div>
          </div>
          <div className="ck-weighted__reading"><Typography variant="body" tone="accent">{interpretation}</Typography></div>
        </section>
      </div>

      <footer className="ck-weighted__summary"><Typography variant="h3" tone="accent">这个卷积核回答的问题：左边是否比右边更亮？</Typography></footer>
    </div>
  </ContentBlock>;
}
