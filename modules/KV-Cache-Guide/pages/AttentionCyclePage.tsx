import { useState, type ReactNode } from 'react';
import { Button, Typography } from '../../shared/react';
import { FlowMatrix } from '../components/FlowMatrix';
import './AttentionCyclePage.css';

const STEPS = [
  '沿用上一页的 Q、K、V，走完一次注意力计算。',
  'Q 横向展开；K 转置后纵向展开。',
  'Q [4, 64] × Kᵀ [64, 4]，形成 [4, 4] 的匹配分数。',
  '遮住未来位置，再按行做 Softmax，得到 [4, 4] 的注意力权重。',
  '权重 A 乘 V，得到注意力输出 O。',
  '最后一层隐藏状态经语言模型头得到 Logits；只取最后一行预测下一个 token。',
] as const;

const ACTIONS = [
  '显示 Q、K、V', '计算匹配分数', '加遮罩并归一化', '乘上 V', '继续到词表预测', '从头重播',
] as const;

function Reveal({ from, step, className = '', children }: { from: number; step: number; className?: string; children: ReactNode }) {
  return <div className={`kvc2-reveal ${className} ${step >= from ? 'is-visible' : ''}`}>{children}</div>;
}

function Operator({ from, step, children, label }: { from: number; step: number; children: string; label?: string }) {
  return <Reveal from={from} step={step} className="kvc2-operator">
    {label && <Typography as="span" variant="bodySmall" tone="muted" className="kvc2-operator-label">{label}</Typography>}
    <Typography as="span" variant="h3" tone="inherit">{children}</Typography>
  </Reveal>;
}

function MatrixNode({ from, step, kind, label, shape, rows, columns, tone, cellState }: {
  from: number; step: number; kind: string; label: ReactNode; shape: string; rows: number; columns: number;
  tone: 'q' | 'k' | 'v' | 'score' | 'output'; cellState?: (row: number, col: number) => 'masked' | 'probability';
}) {
  return <Reveal from={from} step={step} className={`kvc2-node kvc2-node--${kind}`}>
    <FlowMatrix label={label} shape={shape} rows={rows} columns={columns} tone={tone} cellState={cellState} />
  </Reveal>;
}

function ContinuationMatrix({ label, shape, rows, tone, caption, detail }: {
  label: ReactNode; shape: string; rows: number; tone: 'output' | 'neutral'; caption: string; detail?: string;
}) {
  return <div className="kvc2-continuation-matrix">
    <FlowMatrix label={label} shape={shape} rows={rows} columns={7} tone={tone} />
    <div className="kvc2-continuation-caption">
      <Typography as="span" variant="bodySmall" tone="main" align="center">{caption}</Typography>
      {detail && <Typography as="span" variant="bodySmall" tone="muted" align="center">{detail}</Typography>}
    </div>
  </div>;
}

export function AttentionCyclePage() {
  const [step, setStep] = useState(0);
  const advance = () => setStep((current) => current === 5 ? 0 : current + 1);

  return <section className="kvc2-slide" aria-label="KV Cache 第二页：一次注意力计算">
    <header className="kvc2-header">
      <Typography as="h1" variant="h1" tone="main">Q、K、V 怎样完成一次计算？</Typography>
      <Typography as="p" variant="bodySmall" tone="muted">接住上一页的矩阵，沿箭头一步步得到本层注意力输出。</Typography>
    </header>

    <main className="kvc2-stage">
      <div className="kvc2-flow">
        <MatrixNode from={1} step={step} kind="wide" label="Q" shape="[4, 64]" rows={4} columns={7} tone="q" />
        <Operator from={1} step={step}>×</Operator>
        <MatrixNode from={1} step={step} kind="tall" label={<>K<sup>T</sup></>} shape="[64, 4]" rows={7} columns={4} tone="k" />
        <Operator from={2} step={step}>=</Operator>
        <MatrixNode from={2} step={step} kind="square" label="匹配分数 S" shape="[4, 4]" rows={4} columns={4} tone="score" />
        <Operator from={3} step={step} label="因果遮罩 + Softmax">→</Operator>
        <MatrixNode from={3} step={step} kind="square" label="注意力权重 A" shape="[4, 4]" rows={4} columns={4} tone="score" cellState={(row, col) => col > row ? 'masked' : 'probability'} />
        <Operator from={4} step={step}>×</Operator>
        <MatrixNode from={4} step={step} kind="wide" label="V" shape="[4, 64]" rows={4} columns={7} tone="v" />
        <Operator from={4} step={step}>=</Operator>
        <MatrixNode from={4} step={step} kind="wide" label="O" shape="[4, 64]" rows={4} columns={7} tone="output" />
      </div>
      <Reveal from={5} step={step} className="kvc2-continuation">
        <Typography as="span" variant="body">O → 后续模型层 →</Typography>
        <ContinuationMatrix label={<>H<sub>final</sub></>} shape="[4, 512]" rows={4} tone="output" caption="最后一层隐藏状态" detail="每个 token 一行向量" />
        <Typography as="span" variant="body">×</Typography>
        <ContinuationMatrix label={<>W<sub>vocab</sub></>} shape="[512, 词表大小]" rows={5} tone="neutral" caption="语言模型头的权重" detail="映射成词表分数" />
        <Typography as="span" variant="body">=</Typography>
        <ContinuationMatrix label="Logits" shape="[4, 词表大小]" rows={4} tone="output" caption="未归一化的预测分数" />
        <Typography as="span" variant="body">→ 最后一行 →「新」</Typography>
      </Reveal>
    </main>

    <footer className="kvc2-footer">
      <Typography as="p" variant="body" tone="main" aria-live="polite">{STEPS[step]}</Typography>
      <Button variant="primary" onClick={advance}>{ACTIONS[step]} →</Button>
    </footer>
  </section>;
}
