import { useState, type KeyboardEvent } from 'react';
import { ContentBlock, RangeControl, Typography, type QuestionCheckResult } from '../../../shared/react';
import { RtgQuestion } from '../../components/RtgQuestion/RtgQuestion';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import './ZeroResidualPage.css';

const input = [2, 1, 0, 0, 2, 1, 1, 0, 2];
const residual = [-1, 2, 0, 1, -3, 2, 0, 1, -4];
const format = (value: number) => String(Math.round(value * 10) / 10);
const signed = (value: number) => value < 0 ? `(${format(value)})` : format(value);

function Matrix({ id, title, values, selected, onSelect, matched }: { id: string; title: string; values: number[]; selected: number; onSelect: (index: number) => void; matched: boolean }) {
  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-cell]');
    if (!button || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    const index = Number(button.dataset.cell);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 8 : (index + ({ ArrowLeft: 8, ArrowRight: 1, ArrowUp: 6, ArrowDown: 3 }[event.key] ?? 0)) % 9;
    onSelect(next); event.currentTarget.querySelector<HTMLButtonElement>(`[data-cell="${next}"]`)?.focus({ preventScroll: true });
  }
  return <article className={`rtg-zero-residual__matrix-block is-${id}${matched ? ' is-matched' : ''}`} data-matrix={id}>
    <Typography as="h2" variant="bodySmall" tone={id === 'residual' ? 'warning' : 'accent'}>{title}</Typography>
    <div className="rtg-zero-residual__matrix-viewport"><div className="rtg-zero-residual__matrix" role="group" aria-label={title} onKeyDown={navigate}>
      {values.map((value, index) => <button type="button" key={index} data-cell={index} data-number={format(value)} className={selected === index ? 'is-selected' : ''} aria-pressed={selected === index}
        aria-label={`${title}，第${Math.floor(index / 3) + 1}行第${index % 3 + 1}列，${format(value)}`} onClick={() => onSelect(index)} onPointerEnter={() => onSelect(index)} onFocus={() => onSelect(index)}><Typography as="span" variant="body" tone="inherit">{format(value)}</Typography></button>)}
    </div></div>
  </article>;
}

export interface ZeroResidualPageProps { onComplete?: () => void; }
export function ZeroResidualPage({ onComplete }: ZeroResidualPageProps) {
  const [strength, setStrength] = useState(100);
  const [selected, setSelected] = useState(4);
  const [visitedZero, setVisitedZero] = useState(false);
  const [result, setResult] = useState<QuestionCheckResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const scaled = residual.map(value => value * strength / 100);
  const output = input.map((value, index) => value + scaled[index]);
  const atZero = strength === 0;
  const complete = visitedZero && Boolean(result?.ok);
  useCompleteOnce(complete, onComplete);
  function change(value: number) { setStrength(value); if (value === 0) setVisitedZero(true); }
  function restart() { setStrength(100); setSelected(4); setVisitedZero(false); setResult(null); setAttempt(value => value + 1); }

  return <ContentBlock headingLevel={1} className="rtg-zero-residual" data-strength={strength} data-selected={selected} data-complete={complete} data-visited-zero={visitedZero}
    title="当残差分支输出为 0，信息会消失吗？" subtitle="固定快捷路径，让修正逐渐归零；观察输入与相加结果能否逐项重合。"
    onKeyDown={event => {
      if ((event.key === ' ' || event.key === 'Enter') && (event.target as Element).closest('button')) { event.stopPropagation(); if (event.repeat) event.preventDefault(); }
      if ((event.target as Element).matches('input[type="range"]')) event.stopPropagation();
    }}>
    <div className="rtg-zero-residual__toolbar"><Typography variant="bodySmall" tone="accent">恒等映射验证台 · 只调整中间的修正</Typography><div className="rtg-zero-residual__presets" role="group" aria-label="修正强度预设">{[100, 50, 0].map(value => <button key={value} type="button" data-strength-preset={value} aria-pressed={strength === value} onClick={() => change(value)}><Typography as="span" variant="bodySmall" tone="inherit">{value}%</Typography></button>)}</div><button type="button" className="rtg-zero-residual__reset" onClick={restart}><Typography as="span" variant="bodySmall" tone="inherit">↶ 重新验证</Typography></button></div>
    <section className={`rtg-zero-residual__lab${atZero ? ' is-zero' : ''}`} aria-label="输入加上残差修正，得到相加结果">
      <div className="rtg-zero-residual__matrices">
        <Matrix id="input" title="输入 x" values={input} selected={selected} onSelect={setSelected} matched={atZero} />
        <Typography as="span" variant="h2" tone="muted" className="rtg-zero-residual__operator">+</Typography>
        <Matrix id="residual" title="修正 λF(x)" values={scaled} selected={selected} onSelect={setSelected} matched={false} />
        <Typography as="span" variant="h2" tone="muted" className="rtg-zero-residual__operator">=</Typography>
        <Matrix id="output" title="相加结果 H(x)" values={output} selected={selected} onSelect={setSelected} matched={atZero} />
      </div>
      <div className="rtg-zero-residual__controls">
        <Typography as="code" variant="bodySmall" tone="accent">x 的系数始终为 1</Typography>
        <RangeControl label="修正强度 λ" min={0} max={100} step={10} value={strength} suffix="%" aria-label="修正强度" onChange={event => change(Number(event.currentTarget.value))} />
        <Typography as="code" variant="bodySmall" tone={atZero ? 'success' : 'accent'}>{atZero ? 'x + 0 = x' : 'H(x) = x + λF(x)'}</Typography>
      </div>
    </section>
    <div className="rtg-zero-residual__checkpoint">
      {complete ? <div className="rtg-zero-residual__insight is-complete"><Typography as="h2" variant="body" tone="success">已验证：修正为 0 时，原信息仍然保留</Typography><Typography variant="bodySmall" tone="muted">归零的是残差分支的贡献，快捷路径仍将输入送到相加节点。可以继续拖动滑杆对照。</Typography></div>
      : visitedZero ? <RtgQuestion key={attempt} pageId="16-zero-residual" questionId={`zero-result-attempt-${attempt}`} className="rtg-zero-residual__question" type="choice" typeLabel="理解检查" title="修正为 0 时，为什么输入没有消失？" answer="shortcut" options={[
        { key: <Typography as="span" variant="bodySmall" tone="inherit" className="rtg-zero-residual__letter">A</Typography>, value: 'shortcut', label: '快捷路径仍将 x 送到相加节点' },
        { key: <Typography as="span" variant="bodySmall" tone="inherit" className="rtg-zero-residual__letter">B</Typography>, value: 'guess', label: '残差分支重新猜测了输入 x' },
        { key: <Typography as="span" variant="bodySmall" tone="inherit" className="rtg-zero-residual__letter">C</Typography>, value: 'label', label: '训练标签直接补回了输入 x' },
      ]} showFeedback={result?.ok === false} feedback={{ wrong: '请回看快捷路径：修正为 0，并不会切断输入 x 的传递。' }} onCheck={setResult} />
      : <div className="rtg-zero-residual__insight"><Typography as="h2" variant="body" tone="accent">同一位置：{format(input[selected])} + {signed(scaled[selected])} = {format(output[selected])}</Typography><Typography variant="bodySmall" tone="muted">点击任意格，联动检查同一位置。把中间的修正强度拖到 0%，观察左右矩阵。</Typography></div>}
    </div>
  </ContentBlock>;
}
