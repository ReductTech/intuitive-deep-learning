import { useEffect, useState, type CSSProperties } from 'react';
import { Button, MathFormulaStatic, Typography } from "@shuku/course-style/react";
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
  return <div shuku-edit-id="e-cccf0428-1196-464a-86f6-1cb7bc171625" className={`nkr-cell ${className}`} style={delay === undefined ? undefined : {'--nkr-delay':`${delay}s`} as CSSProperties}>
    <Typography shuku-edit-id="e-7c2516f7-0bdd-4e0c-b2b0-e05bb4fc0d5e" as="span" variant={compact ? 'bodySmall' : 'body'} align="center">{value}</Typography>
  </div>;
}

function InputMatrix({ count }: { count: number }) {
  return <div shuku-edit-id="e-0af3ed4d-ecac-46b8-92f8-c88878f43ec1" className="nkr-input">
    <Typography shuku-edit-id="e-128a914d-859c-4eb3-83c4-9d6ccaaf33ec" as="p" variant="h2" align="center"><MathFormulaStatic latex="X" /></Typography>
    <Typography shuku-edit-id="e-dd814919-c761-4f07-8ac7-d2b1cc2e6da0" as="p" variant="bodySmall" align="center" tone="muted">[{count}, 2]</Typography>
    <div shuku-edit-id="e-778ef113-4e77-448f-a16c-db2db024473e" className="nkr-input-grid">
      {INPUT.slice(0, count).map((row, index) => <div shuku-edit-id="e-8b898f01-a999-449c-bc52-4941fafb82a6" className={`nkr-input-row ${index >= 4 && index === count - 1 ? 'is-added' : ''}`} key={TOKENS[index]}>
        <Typography shuku-edit-id="e-ee11f9fa-0f72-4e0d-99ff-b35577322f39" as="p" variant="h3" align="center">{TOKENS[index]}</Typography>
        {row.map((value, column) => <NumberCell key={column} value={value} />)}
      </div>)}
    </div>
    <Typography shuku-edit-id="e-d8496315-1c40-4c17-b1dc-11d315f4d11c" as="p" variant="bodySmall" align="center" tone="muted">二维整数示例<br shuku-edit-id="e-af5ec087-588f-4a67-8efa-114088b647df" />非模型实测</Typography>
  </div>;
}

function WeightMatrix({ kind }: { kind: 'K' | 'V' }) {
  const weight = kind === 'K' ? WK : WV;
  return <div shuku-edit-id="e-e8b72a35-9a6d-486e-a74f-6e570e8fb43d" className={`nkr-weight nkr-tone--${kind.toLowerCase()}`}>
    <Typography shuku-edit-id="e-a2fa8616-65d8-4cef-924f-aab7709f9e44" as="p" variant="h2" align="center"><MathFormulaStatic latex={kind === 'K' ? 'W^K' : 'W^V'} /></Typography>
    <div shuku-edit-id="e-41c2cb42-946b-4c8d-a286-f411a18e55c9" className="nkr-weight-grid">{weight.flatMap((row, r) => row.map((value, c) => <NumberCell value={value} key={`${r}-${c}`} />))}</div>
    <Typography shuku-edit-id="e-c9cc1bdd-517b-4bb9-a0bb-86455f226a80" as="p" variant="bodySmall" align="center">固定投影 [2, 2]</Typography>
  </div>;
}

function ResultMatrix({ kind, step, current = false }: { kind: 'K' | 'V'; step: number; current?: boolean }) {
  const count = rowCount(step);
  const length = current || step < 2 ? count : count - 1;
  const values = (kind === 'K' ? ALL_K : ALL_V).slice(0, length);
  const visible = step >= 1;
  return <div shuku-edit-id="e-2472d0a0-943f-4023-8e19-1e5b4df64648" className={`nkr-result nkr-tone--${kind.toLowerCase()} ${!current && step < 2 ? 'is-hidden' : ''}`}>
    <Typography shuku-edit-id="e-06fa13c6-6c0b-44b3-be59-c23e3de3e4da" as="p" variant="bodySmall" align="center">{current ? step < 2 ? '计算结果' : '本轮' : '上一轮'} {kind} [{length}, 2]</Typography>
    <div shuku-edit-id="e-3c026d07-11e5-459a-af50-195b91e19ec7" className={`nkr-result-grid ${comparing(step) ? 'is-comparing' : ''}`} key={`${step}-${current}`}>
      {Array.from({length:count}, (_, row) => <div shuku-edit-id="e-b4a28710-ccd4-4e7e-b4bb-2602b70c53cc" className={`nkr-result-row ${row >= length ? 'is-empty' : row === count - 1 && step >= 2 ? 'is-new' : comparing(step) ? 'is-same' : ''}`} key={row} aria-label={`${TOKENS[row]}对应行`}>
        {[0, 1].map(column => <NumberCell key={column} value={visible && row < values.length ? values[row][column] : '·'} className={current && visible && row < values.length && (step === 1 || (step >= 2 && step <= 6 && step % 2 === 0)) ? 'is-calculated' : ''} delay={row * .16} compact />)}
      </div>)}
    </div>
  </div>;
}

function ProjectionRow({ kind, step }: { kind: 'K' | 'V'; step: number }) {
  return <div shuku-edit-id="e-66043a66-1db9-4ae9-8fdb-0e0ba1ba24d1" className="nkr-projection-row">
    <Typography shuku-edit-id="e-5306bc0c-2c04-49d3-80ba-6ec7fea8e3b1" as="p" variant="h2" align="center">×</Typography>
    <WeightMatrix kind={kind} />
    <Typography shuku-edit-id="e-51817f9d-b4f7-4d4f-b270-fb64ff44ce1c" as="p" variant="h2" align="center">＝</Typography>
    <ResultMatrix kind={kind} step={step} current />
    <div shuku-edit-id="e-ae0350e9-667d-4e4e-9935-bd7e9736e5fb" className={`nkr-compare-mark ${comparing(step) ? 'is-visible' : ''}`} aria-hidden={!comparing(step)}><Typography shuku-edit-id="e-351e0572-ce8a-45a0-af15-b8e3a4b03bc5" as="p" variant="bodySmall" align="center" tone="success">旧行<br shuku-edit-id="e-e1d6c9b1-a15a-4d7b-b522-72c316ff3848" />相同</Typography></div>
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
  return <section shuku-edit-id="e-22e2060d-0e91-475e-b4fd-bce36a6dd5eb" className="nkr-slide" aria-label="新增 token 前后，数值 K、V 的重复计算" data-nkr-step={step}>
    <header shuku-edit-id="e-2d4c8215-5ab2-4ffa-8e89-ae67831ec29d" className="nkr-header">
      <Typography shuku-edit-id="e-e3adc5dd-ef0e-48a4-af25-cb6d70cf85f5" as="h1" variant="h1" align="center">{step >= 8 ? '为什么旧 K、V 可以直接复用？' : '新增一个 token，旧 K、V 会变吗？'}</Typography>
    </header>
    <main shuku-edit-id="e-60dd3700-87b0-4be5-a61a-0d449cff8c4b" className="nkr-stage">
      <InputMatrix count={rowCount(step)} />
      <svg shuku-edit-id="e-f5d36cc9-7c1a-4c73-95a6-7ee4bd8204ee" className="nkr-branches" viewBox="0 0 70 340" aria-hidden="true"><path shuku-edit-id="e-c5455195-7b95-4fca-906d-41550424f906" d="M2 170C35 170 35 20 64 20 M54 12L64 20L54 28 M2 170C35 170 35 320 64 320 M54 312L64 320L54 328" /></svg>
      <div shuku-edit-id="e-37269337-48ea-409c-82d0-0ec092168979" className="nkr-projections"><ProjectionRow kind="K" step={step} /><ProjectionRow kind="V" step={step} /></div>
    </main>
    <footer shuku-edit-id="e-fb8071a2-85cb-4a56-bade-2aeca221982c" className="nkr-footer">
      <Typography shuku-edit-id="e-1e16c6d4-0d84-45ac-8b29-da9d3b240f1f" as="p" variant="h2" align="center" aria-live="polite">{CAPTIONS[step]}</Typography>
      <Button variant="primary" disabled={busy} onClick={event => {event.stopPropagation();advance();}}>{busy ? '正在计算…' : `${ACTIONS[step]} →`}</Button>
    </footer>
  </section>;
}
