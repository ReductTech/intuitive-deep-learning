import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { ReluGlyph } from './CellChain';
import './RNNGradientLimitsPage.css';

export interface RNNGradientLimitsPageProps {
  onComplete: () => void;
}

type PhaseKey = 'explode' | 'vanish' | 'summary';

interface Phase {
  key: Exclude<PhaseKey, 'summary'>;
  title: string;
  factor: number;
  values: number[];
  far: string;
  tone: 'danger' | 'accent';
}

const phases: Record<Exclude<PhaseKey, 'summary'>, Phase> = {
  explode: {
    key: 'explode',
    title: '第一幕：梯度爆炸',
    factor: 2,
    values: [1, 2, 4, 8],
    far: 'x₅₀ = 2⁵⁰ ≈ 1.1 × 10¹⁵',
    tone: 'danger',
  },
  vanish: {
    key: 'vanish',
    title: '第二幕：梯度消失',
    factor: 0.5,
    values: [1, 0.5, 0.25, 0.125],
    far: 'x₅₀ = 0.5⁵⁰ ≈ 8.9 × 10⁻¹⁶',
    tone: 'accent',
  },
};

const maxLoops = 3;

function formatValue(value: number) {
  if (value >= 1) return String(value);
  return value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function SimplifiedRnnPath({ phase, loops }: { phase: PhaseKey; loops: number }) {
  const activeLoops = phase === 'summary' ? maxLoops : loops;
  const emphasis = phase === 'summary' ? 'summary' : phase;
  const nodes = ['x₀', 'x₁', 'x₂', 'x₃'];

  return (
    <section shuku-edit-id="e-a458997d-86ac-4286-a85e-6add9354b41a" className={`nrnn-gradient-limits__rnn-map is-${emphasis}`} aria-label="只保留 W₂ 的时间步 RNN 图">
      <div shuku-edit-id="e-a72c5a7b-9e33-4074-8b49-5bc54037acaf" className="nrnn-gradient-limits__map-heading">
        <Typography shuku-edit-id="e-cbeaada0-0a31-4030-b48b-3fffd2e26019" as="strong" variant="h3" tone="main">教学简化：这里只保留 W₂</Typography>
      </div>
      <div shuku-edit-id="e-3a55ae62-8d2d-48a6-b86f-78bbbccb91ec" className="nrnn-gradient-limits__map-note">
        <Typography shuku-edit-id="e-dfa8bc99-575a-4204-989e-0365d8556b12" as="span" variant="bodySmall" tone="light">天气、ReLU、W₃、输出</Typography>
        <Typography shuku-edit-id="e-3861be84-c3bc-4025-912f-38c251790f54" as="span" variant="bodySmall" tone="muted">已省略</Typography>
      </div>
      <div shuku-edit-id="e-0cf32ba3-0179-43ee-b3c9-12d343eaf706" className="nrnn-gradient-limits__map-stack">
        {nodes.map((node, index) => (
          <div shuku-edit-id="e-6c5f7cd8-4c11-49e8-908d-0514ee176b50" className={`nrnn-gradient-limits__map-row${index <= activeLoops ? ' is-active' : ''}`} key={node}>
            <Typography shuku-edit-id="e-b9066773-32b6-43ad-9788-c22d2dd08f2a" as="span" variant="bodySmall" tone="muted" className="nrnn-gradient-limits__step-label">t{index === 0 ? '' : `+${index}`}</Typography>
            <div shuku-edit-id="e-2cebff40-8ed6-4813-8124-9bb023a69468" className="nrnn-gradient-limits__map-box is-input">
              <Typography shuku-edit-id="e-7411d717-7d3f-45ec-8efd-7b25231edc20" as="span" variant="bodySmall" tone="muted">输入</Typography>
              <Typography shuku-edit-id="e-f8e5ba6c-b46b-4371-8064-a826e1dffb68" as="strong" variant="h3" tone="inherit">{node}</Typography>
            </div>
            <Typography shuku-edit-id="e-e0e490f7-a824-4602-86f5-d9c3cc3ba42e" as="span" variant="h3" tone="light" className="nrnn-gradient-limits__map-arrow">→</Typography>
            <div shuku-edit-id="e-d30880bd-dd5b-4f06-b48f-22da51d041ca" className="nrnn-gradient-limits__map-box is-relu">
              <ReluGlyph />
              <Typography shuku-edit-id="e-8c2d12dd-2728-484e-b13d-386dce80f729" as="span" variant="bodySmall" tone="inherit">ReLU</Typography>
            </div>
            <Typography shuku-edit-id="e-4e88b524-5d7f-48c9-bdc2-92d7cc00ff33" as="span" variant="h3" tone="light" className="nrnn-gradient-limits__map-arrow">→</Typography>
            <div shuku-edit-id="e-fcfe9132-f2d8-45e9-952f-e8dac5b532ca" className="nrnn-gradient-limits__map-box is-output">
              <Typography shuku-edit-id="e-c66180c0-5c7c-48cc-b201-27d7c878cd75" as="strong" variant="h3" tone="inherit">h{index + 1}</Typography>
              <Typography shuku-edit-id="e-168ea22d-5be4-47ab-9779-7e47d3959858" as="span" variant="bodySmall" tone="inherit">隐状态</Typography>
            </div>
            {index < nodes.length - 1 && (
              <div shuku-edit-id="e-ff62e981-1efb-49c6-a44d-b9712d1edf9c" className={`nrnn-gradient-limits__feedback${index < activeLoops ? ' is-active' : ''}`} aria-hidden="true">
                <Typography shuku-edit-id="e-9203a79c-4d54-4f88-8c7e-2ef68cca3bfb" as="span" variant="bodySmall" tone="inherit">W₂</Typography>
              </div>
            )}
          </div>
        ))}
      </div>
      <Typography shuku-edit-id="e-92a879ff-989f-426d-97fc-0d01e62ac3dc" as="span" variant="bodySmall" tone="muted" className="nrnn-gradient-limits__map-equation">xₙ = W₂ⁿ × x₀</Typography>
    </section>
  );
}

function IterationPanel({ phase, loops }: { phase: Phase; loops: number }) {
  const visible = phase.values.slice(0, loops + 1);
  return (
    <section shuku-edit-id="e-cfdbdebf-9597-4235-85d0-b9d52abd63d0" className={`nrnn-gradient-limits__iteration is-${phase.tone}`} aria-label={`${phase.title}数值演示`}>
      <header shuku-edit-id="e-f3285b17-8003-44f1-b696-ffef79d1811c" className="nrnn-gradient-limits__iteration-head">
        <Typography shuku-edit-id="e-ddad708f-e05a-41bc-95f7-af4abb82ec07" as="strong" variant="h2" tone="inherit">{phase.title}</Typography>
        <Typography shuku-edit-id="e-9e217407-5623-4d56-a5fe-087d157275b7" as="span" variant="body" tone="muted">W₂ = {phase.factor}</Typography>
      </header>
      <Typography shuku-edit-id="e-ce283d1b-c1ad-4345-ba15-c462ceb75709" as="span" variant="bodySmall" tone="muted" className="nrnn-gradient-limits__iteration-intro">每个时间步，都把上一步的结果乘上同一个 W₂。</Typography>
      <div shuku-edit-id="e-3bd22939-6a0a-400e-992d-ed82c1ce27e6" className="nrnn-gradient-limits__value-stack">
        {visible.map((value, index) => (
          <div shuku-edit-id="e-168b75a1-9a4a-4e83-aa09-cf818eb655aa" className={`nrnn-gradient-limits__value-row${index === loops ? ' is-current' : ''}`} key={`${phase.key}-${index}`}>
            <Typography shuku-edit-id="e-3fcbbfdb-0ac8-41da-9369-b6db240691b4" as="span" variant="bodySmall" tone="muted">x{index}</Typography>
            {index > 0 && <Typography shuku-edit-id="e-daa7dc8b-9f1b-4eef-b826-3b886478375b" as="span" variant="bodySmall" tone="inherit">× {phase.factor}</Typography>}
            <Typography shuku-edit-id="e-20c9b8b2-016f-40f2-a35b-59d06017697d" as="strong" variant="h2" tone="inherit">{formatValue(value)}</Typography>
          </div>
        ))}
      </div>
      {loops === maxLoops && (
        <div shuku-edit-id="e-7b31637a-d501-40e4-8d74-189fd636e71c" className="nrnn-gradient-limits__far-result">
          <Typography shuku-edit-id="e-024b5f5c-872e-4bf4-8477-c9bebfb6830c" as="span" variant="bodySmall" tone="muted">继续到 50 个时间步</Typography>
          <Typography shuku-edit-id="e-9dd0479d-0293-4724-b9c7-fdde9c33dfc0" as="strong" variant="h3" tone="inherit">{phase.far}</Typography>
        </div>
      )}
    </section>
  );
}

export function RNNGradientLimitsPage({ onComplete }: RNNGradientLimitsPageProps) {
  const [phase, setPhase] = useState<PhaseKey>('explode');
  const [loops, setLoops] = useState(0);
  const [playing, setPlaying] = useState(false);
  const completedRef = useRef(false);
  const current = phase === 'summary' ? null : phases[phase];

  useEffect(() => {
    if (!playing || phase === 'summary' || loops >= maxLoops) return undefined;
    const timer = window.setTimeout(() => {
      setLoops((value) => {
        const next = Math.min(value + 1, maxLoops);
        if (next >= maxLoops) setPlaying(false);
        return next;
      });
    }, 1450);
    return () => window.clearTimeout(timer);
  }, [loops, phase, playing]);

  const advance = () => {
    if (phase === 'summary') return;
    if (playing) {
      return;
    }
    if (loops < maxLoops) {
      setPlaying(true);
      return;
    }
    if (phase === 'explode') {
      setPhase('vanish');
      setLoops(0);
      setPlaying(false);
      return;
    }
    setPhase('summary');
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  const buttonLabel = phase === 'summary'
    ? ''
    : playing
      ? '循环中…'
      : loops < maxLoops
        ? '开始循环'
      : phase === 'explode' ? '进入梯度消失' : '总结';

  const status = phase === 'summary'
    ? '完整 RNN 很复杂，但这页只追踪一条反复经过 W₂ 的时间路径：W₂ > 1，梯度可能爆炸；W₂ < 1，梯度可能消失。'
    : loops === 0
      ? '先把完整 RNN 简化成一条 W₂ 链，点击开始后观察时间步从 t 缓慢推进到 t+3。'
      : loops < maxLoops
        ? `循环正在推进：时间步 t${loops === 0 ? '' : `+${loops}`}，x${loops} = ${formatValue(current?.values[loops] ?? 0)}。`
        : phase === 'explode'
          ? 'xₙ 会越来越大，梯度也会变得很大，更新步长难以控制——这就是梯度爆炸。'
          : 'xₙ 会越来越接近 0，梯度也会越来越小，参数几乎无法更新——这就是梯度消失。';

  return (
    <ContentBlock shuku-edit-id="e-579c0828-f12e-40f6-91e9-2e8147a21660"
      headingLevel={1}
      className="nrnn-gradient-limits"
      title="梯度爆炸与梯度消失"
      subtitle="上一页的梯度公式需要计算 x₁…xₙ；这里把 RNN 简化成只剩反复传递的 W₂。"
    >
      <div shuku-edit-id="e-b13c6da5-8ce3-47bf-ab3e-fbf8e18a90a7" className="nrnn-gradient-limits__lesson">
        <SimplifiedRnnPath phase={phase} loops={loops} />
        {phase === 'summary' ? (
          <section shuku-edit-id="e-05814fd0-394e-4a07-98bd-bcb044f00019" className="nrnn-gradient-limits__summary" aria-label="梯度爆炸与梯度消失总结">
            <Typography shuku-edit-id="e-d883c05c-32a3-42c6-b39d-b0b6e006e7a0" as="span" variant="bodySmall" tone="muted">同一条时间路径，W₂ 取值不同</Typography>
            <Typography shuku-edit-id="e-a443c1a4-c0f4-4f26-98c8-0b1d5859cbb2" as="strong" variant="h2" tone="main">xₙ = W₂ⁿ × x₀</Typography>
            <div shuku-edit-id="e-11d4db83-b557-4ce1-8908-03a2a376b21a" className="nrnn-gradient-limits__summary-rules">
              <div shuku-edit-id="e-5d8e42ee-da4b-45aa-8f1d-8e1bbbed73a4" className="is-danger"><Typography shuku-edit-id="e-f88c8487-250c-49ae-a1cd-9056b49bda23" as="strong" variant="h3" tone="inherit">W₂ &gt; 1</Typography><Typography shuku-edit-id="e-33204c82-5d21-4c1e-9a91-f01b25b05bc0" as="span" variant="bodySmall" tone="inherit">反复相乘变大 → 梯度爆炸</Typography></div>
              <div shuku-edit-id="e-91433c59-a68a-4d5e-ad09-fa5262d92d12" className="is-accent"><Typography shuku-edit-id="e-35186f2d-cfab-4bd0-aecc-5f21048759ad" as="strong" variant="h3" tone="inherit">W₂ &lt; 1</Typography><Typography shuku-edit-id="e-92c0fd58-4e34-4ec7-b786-2c78d0f2725b" as="span" variant="bodySmall" tone="inherit">反复相乘变小 → 梯度消失</Typography></div>
            </div>
          </section>
        ) : (
          <IterationPanel phase={current!} loops={loops} />
        )}
      </div>
      <div shuku-edit-id="e-899e441b-496c-461a-8898-26b71ac9f505" className={`nrnn-gradient-limits__status${phase === 'summary' ? ' is-success' : ''}`}>
        <Typography shuku-edit-id="e-895e8e52-1559-4115-be85-72658c7790d1" as="p" variant="body" tone="inherit">{status}</Typography>
        {buttonLabel && <Button variant="primary" onClick={advance} disabled={playing}><Typography shuku-edit-id="e-56d3f5a1-4553-4dc7-b728-5cb1f10e4b16" as="span" variant="body" tone="inherit">{buttonLabel}</Typography></Button>}
      </div>
    </ContentBlock>
  );
}
