import { useState, type ReactNode } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
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
  return <div shuku-edit-id="e-d63241a8-79cf-47bc-a8f5-d161855ba00d" className={`kvc2-reveal ${className} ${step >= from ? 'is-visible' : ''}`}>{children}</div>;
}

function Operator({ from, step, children, label }: { from: number; step: number; children: string; label?: string }) {
  return <Reveal from={from} step={step} className="kvc2-operator">
    {label && <Typography shuku-edit-id="e-1adf82c8-65dd-4590-a4fa-81991f613cc7" as="span" variant="bodySmall" tone="muted" className="kvc2-operator-label">{label}</Typography>}
    <Typography shuku-edit-id="e-edb2cc15-b34a-4012-9c04-1f585e668b11" as="span" variant="h3" tone="inherit">{children}</Typography>
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
  return <div shuku-edit-id="e-8f497fff-0942-4e53-9bf6-6d22bab66092" className="kvc2-continuation-matrix">
    <FlowMatrix label={label} shape={shape} rows={rows} columns={7} tone={tone} />
    <div shuku-edit-id="e-8bbeeaab-8806-4023-9df7-bf338f917b0b" className="kvc2-continuation-caption">
      <Typography shuku-edit-id="e-176b6a24-be07-4a5c-aa57-8b7900007e26" as="span" variant="bodySmall" tone="main" align="center">{caption}</Typography>
      {detail && <Typography shuku-edit-id="e-8ea10526-1c30-4fb5-889f-b0d381866663" as="span" variant="bodySmall" tone="muted" align="center">{detail}</Typography>}
    </div>
  </div>;
}

export function AttentionCyclePage() {
  const [step, setStep] = useState(0);
  const advance = () => setStep((current) => current === 5 ? 0 : current + 1);

  return <section shuku-edit-id="e-3f5c1c07-6bf0-4514-9b69-e45d51b29c24" className="kvc2-slide" aria-label="KV Cache 第二页：一次注意力计算">
    <header shuku-edit-id="e-a9e55d94-d198-439d-980c-8137ce9d96bd" className="kvc2-header">
      <Typography shuku-edit-id="e-a490de3a-319e-453d-9b66-115f14582936" as="h1" variant="h1" tone="main">Q、K、V 怎样完成一次计算？</Typography>
      <Typography shuku-edit-id="e-46e3e263-57e9-4210-9212-e4f90fb320c9" as="p" variant="bodySmall" tone="muted">接住上一页的矩阵，沿箭头一步步得到本层注意力输出。</Typography>
    </header>

    <main shuku-edit-id="e-5084edc9-63af-4efa-b0e2-428a8481327e" className="kvc2-stage">
      <div shuku-edit-id="e-06d3791c-2cb7-47f1-8377-fef43131b58f" className="kvc2-flow">
        <MatrixNode from={1} step={step} kind="wide" label="Q" shape="[4, 64]" rows={4} columns={7} tone="q" />
        <Operator from={1} step={step}>×</Operator>
        <MatrixNode from={1} step={step} kind="tall" label={<>K<sup shuku-edit-id="e-cb3fc68b-33b9-488f-8a37-66142943e927">T</sup></>} shape="[64, 4]" rows={7} columns={4} tone="k" />
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
        <Typography shuku-edit-id="e-b3414ee5-ecb1-4563-8451-74ed814c0010" as="span" variant="body">O → 后续模型层 →</Typography>
        <ContinuationMatrix label={<>H<sub shuku-edit-id="e-567613ed-ee3c-47b6-9f6e-99fc57eb8655">final</sub></>} shape="[4, 512]" rows={4} tone="output" caption="最后一层隐藏状态" detail="每个 token 一行向量" />
        <Typography shuku-edit-id="e-3ecaca10-f4be-40bd-8afa-362a1e064e1f" as="span" variant="body">×</Typography>
        <ContinuationMatrix label={<>W<sub shuku-edit-id="e-dc327f31-e7fb-46cb-9556-69a2a9f11a11">vocab</sub></>} shape="[512, 词表大小]" rows={5} tone="neutral" caption="语言模型头的权重" detail="映射成词表分数" />
        <Typography shuku-edit-id="e-1db3e5d1-d758-4b4c-89ce-b4ab18069c39" as="span" variant="body">=</Typography>
        <ContinuationMatrix label="Logits" shape="[4, 词表大小]" rows={4} tone="output" caption="未归一化的预测分数" />
        <Typography shuku-edit-id="e-2b755878-7d17-4354-89b3-45e919f97c7b" as="span" variant="body">→ 最后一行 →「新」</Typography>
      </Reveal>
    </main>

    <footer shuku-edit-id="e-2e59d83d-137b-415c-877e-f677e7214d3b" className="kvc2-footer">
      <Typography shuku-edit-id="e-1609d41a-6ae4-41ab-a6be-8d84db5c5977" as="p" variant="body" tone="main" aria-live="polite">{STEPS[step]}</Typography>
      <Button variant="primary" onClick={advance}>{ACTIONS[step]} →</Button>
    </footer>
  </section>;
}
