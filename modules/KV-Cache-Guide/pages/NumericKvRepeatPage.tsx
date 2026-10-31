import { useEffect, useState, type CSSProperties } from 'react';
import { Button, MathFormulaStatic, Typography } from '../../shared/react';
import './NumericKvRepeatPage.css';

// A two-dimensional projection example, not activations sampled from an LLM.
// All displayed results are computed from these inputs and fixed weights.
const TOKENS = ['我', '爱', '学', '习', '新', '知', '识'];
const INPUT = [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [2, 0], [2, 2]];
const WK = [[1, 2], [0, 1]];
const WV = [[2, 0], [1, 1]];
function project(input: number[][], weight: number[][]) {
  return input.map(row => weight[0].map((_, column) => row.reduce((sum, value, i) => sum + value * weight[i][column], 0)));
}
const ALL_K = project(INPUT, WK);
const ALL_V = project(INPUT, WV);
const rowCount = (step: number) => step < 2 ? 4 : Math.min(7, 5 + Math.floor((step - 2) / 2));
const comparing = (step: number) => step >= 3 && (step % 2 === 1 || step >= 8);
const CAPTIONS = [
  '先计算「我爱学习」的 K、V。',
  '四行已算好，接下来加入「新」。',
  '输入增加一行，全部五行重新参与计算。',
  '第一轮：前四行重新算，结果完全相同。',
  '再加入「知」，全部六行重新计算。',
  '第二轮：前五行重新算，结果仍然相同。',
  '再加入「识」，全部七行重新计算。',
  '第三轮：前六行重新算，结果依旧相同。',
  '因果注意力：旧位置看不到后续 token，旧表示不变。',
  '旧表示与投影权重不变，旧 K、V 可以缓存复用。',
];
const ACTIONS = ['计算四行', '加入「新」，全部重算', '对齐比较旧行', '加入「知」，全部重算', '对齐比较旧行', '加入「识」，全部重算', '对齐比较旧行', '为什么没变？', '得出结论', '重新演示'];

function NumberCell({ value, className = '', delay, compact = false }: { value: number | string; className?: string; delay?: number; compact?: boolean }) {
  return <div className={`nkr-cell ${className}`} style={delay === undefined ? undefined : {'--nkr-delay':`${delay}s`} as CSSProperties}>
    <Typography as="span" variant={compact ? 'bodySmall' : 'body'} align="center">{value}</Typography>
  </div>;
}

function InputMatrix({ count }: { count: number }) {
  return <div className="nkr-input">
    <Typography as="p" variant="h2" align="center"><MathFormulaStatic latex="X" /></Typography>
    <Typography as="p" variant="bodySmall" align="center" tone="muted">[{count}, 2]</Typography>
    <div className="nkr-input-grid">
      {INPUT.slice(0, count).map((row, index) => <div className={`nkr-input-row ${index >= 4 && index === count - 1 ? 'is-added' : ''}`} key={TOKENS[index]}>
        <Typography as="p" variant="h3" align="center">{TOKENS[index]}</Typography>
        {row.map((value, column) => <NumberCell key={column} value={value} />)}
      </div>)}
    </div>
    <Typography as="p" variant="bodySmall" align="center" tone="muted">二维整数示例<br />非模型实测</Typography>
  </div>;
}

function WeightMatrix({ kind }: { kind: 'K' | 'V' }) {
  const weight = kind === 'K' ? WK : WV;
  return <div className={`nkr-weight nkr-tone--${kind.toLowerCase()}`}>
    <Typography as="p" variant="h2" align="center"><MathFormulaStatic latex={kind === 'K' ? 'W^K' : 'W^V'} /></Typography>
    <div className="nkr-weight-grid">{weight.flatMap((row, r) => row.map((value, c) => <NumberCell value={value} key={`${r}-${c}`} />))}</div>
    <Typography as="p" variant="bodySmall" align="center">固定投影 [2, 2]</Typography>
  </div>;
}

function ResultMatrix({ kind, step, current = false }: { kind: 'K' | 'V'; step: number; current?: boolean }) {
  const count = rowCount(step);
  const length = current || step < 2 ? count : count - 1;
  const values = (kind === 'K' ? ALL_K : ALL_V).slice(0, length);
  const visible = step >= 1;
  return <div className={`nkr-result nkr-tone--${kind.toLowerCase()} ${!current && step < 2 ? 'is-hidden' : ''}`}>
    <Typography as="p" variant="bodySmall" align="center">{current ? step < 2 ? '计算结果' : '本轮' : '上一轮'} {kind} [{length}, 2]</Typography>
    <div className={`nkr-result-grid ${comparing(step) ? 'is-comparing' : ''}`} key={`${step}-${current}`}>
      {Array.from({length:count}, (_, row) => <div className={`nkr-result-row ${row >= length ? 'is-empty' : row === count - 1 && step >= 2 ? 'is-new' : comparing(step) ? 'is-same' : ''}`} key={row} aria-label={`${TOKENS[row]}对应行`}>
        {[0, 1].map(column => <NumberCell key={column} value={visible && row < values.length ? values[row][column] : '·'} className={current && visible && row < values.length && (step === 1 || (step >= 2 && step <= 6 && step % 2 === 0)) ? 'is-calculated' : ''} delay={row * .16} compact />)}
      </div>)}
    </div>
  </div>;
}

function ProjectionRow({ kind, step }: { kind: 'K' | 'V'; step: number }) {
  return <div className="nkr-projection-row">
    <Typography as="p" variant="h2" align="center">×</Typography>
    <WeightMatrix kind={kind} />
    <Typography as="p" variant="h2" align="center">＝</Typography>
    <ResultMatrix kind={kind} step={step} current />
    <div className={`nkr-compare-mark ${comparing(step) ? 'is-visible' : ''}`} aria-hidden={!comparing(step)}><Typography as="p" variant="bodySmall" align="center" tone="success">旧行<br />相同</Typography></div>
    <ResultMatrix kind={kind} step={step} />
  </div>;
}

export function NumericKvRepeatPage() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!busy) return;
    const timer = window.setTimeout(() => setBusy(false), 1600);
    return () => window.clearTimeout(timer);
  }, [busy]);
  const advance = () => {
    if (busy) return;
    const next = step === 9 ? 0 : step + 1;
    setStep(next);
    if (next >= 1 && next <= 7) setBusy(true);
  };
  return <section className="nkr-slide" aria-label="新增 token 前后，数值 K、V 的重复计算" data-nkr-step={step}>
    <header className="nkr-header">
      <Typography as="h1" variant="h1" align="center">{step >= 8 ? '为什么旧 K、V 可以直接复用？' : '新增一个 token，旧 K、V 会变吗？'}</Typography>
    </header>
    <main className="nkr-stage">
      <InputMatrix count={rowCount(step)} />
      <svg className="nkr-branches" viewBox="0 0 70 340" aria-hidden="true"><path d="M2 170C35 170 35 20 64 20 M54 12L64 20L54 28 M2 170C35 170 35 320 64 320 M54 312L64 320L54 328" /></svg>
      <div className="nkr-projections"><ProjectionRow kind="K" step={step} /><ProjectionRow kind="V" step={step} /></div>
    </main>
    <footer className="nkr-footer">
      <Typography as="p" variant="h2" align="center" aria-live="polite">{CAPTIONS[step]}</Typography>
      <Button variant="primary" disabled={busy} onClick={event => {event.stopPropagation();advance();}}>{busy ? '正在计算…' : `${ACTIONS[step]} →`}</Button>
    </footer>
  </section>;
}
