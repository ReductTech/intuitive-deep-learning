import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
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
    <section className={`nrnn-gradient-limits__rnn-map is-${emphasis}`} aria-label="只保留 W₂ 的时间步 RNN 图">
      <div className="nrnn-gradient-limits__map-heading">
        <Typography as="strong" variant="h3" tone="main">教学简化：这里只保留 W₂</Typography>
      </div>
      <div className="nrnn-gradient-limits__map-note">
        <Typography as="span" variant="bodySmall" tone="light">天气、ReLU、W₃、输出</Typography>
        <Typography as="span" variant="bodySmall" tone="muted">已省略</Typography>
      </div>
      <div className="nrnn-gradient-limits__map-stack">
        {nodes.map((node, index) => (
          <div className={`nrnn-gradient-limits__map-row${index <= activeLoops ? ' is-active' : ''}`} key={node}>
            <Typography as="span" variant="bodySmall" tone="muted" className="nrnn-gradient-limits__step-label">t{index === 0 ? '' : `+${index}`}</Typography>
            <div className="nrnn-gradient-limits__map-box is-input">
              <Typography as="span" variant="bodySmall" tone="muted">输入</Typography>
              <Typography as="strong" variant="h3" tone="inherit">{node}</Typography>
            </div>
            <Typography as="span" variant="h3" tone="light" className="nrnn-gradient-limits__map-arrow">→</Typography>
            <div className="nrnn-gradient-limits__map-box is-relu">
              <ReluGlyph />
              <Typography as="span" variant="bodySmall" tone="inherit">ReLU</Typography>
            </div>
            <Typography as="span" variant="h3" tone="light" className="nrnn-gradient-limits__map-arrow">→</Typography>
            <div className="nrnn-gradient-limits__map-box is-output">
              <Typography as="strong" variant="h3" tone="inherit">h{index + 1}</Typography>
              <Typography as="span" variant="bodySmall" tone="inherit">隐状态</Typography>
            </div>
            {index < nodes.length - 1 && (
              <div className={`nrnn-gradient-limits__feedback${index < activeLoops ? ' is-active' : ''}`} aria-hidden="true">
                <Typography as="span" variant="bodySmall" tone="inherit">W₂</Typography>
              </div>
            )}
          </div>
        ))}
      </div>
      <Typography as="span" variant="bodySmall" tone="muted" className="nrnn-gradient-limits__map-equation">xₙ = W₂ⁿ × x₀</Typography>
    </section>
  );
}

function IterationPanel({ phase, loops }: { phase: Phase; loops: number }) {
  const visible = phase.values.slice(0, loops + 1);
  return (
    <section className={`nrnn-gradient-limits__iteration is-${phase.tone}`} aria-label={`${phase.title}数值演示`}>
      <header className="nrnn-gradient-limits__iteration-head">
        <Typography as="strong" variant="h2" tone="inherit">{phase.title}</Typography>
        <Typography as="span" variant="body" tone="muted">W₂ = {phase.factor}</Typography>
      </header>
      <Typography as="span" variant="bodySmall" tone="muted" className="nrnn-gradient-limits__iteration-intro">每个时间步，都把上一步的结果乘上同一个 W₂。</Typography>
      <div className="nrnn-gradient-limits__value-stack">
        {visible.map((value, index) => (
          <div className={`nrnn-gradient-limits__value-row${index === loops ? ' is-current' : ''}`} key={`${phase.key}-${index}`}>
            <Typography as="span" variant="bodySmall" tone="muted">x{index}</Typography>
            {index > 0 && <Typography as="span" variant="bodySmall" tone="inherit">× {phase.factor}</Typography>}
            <Typography as="strong" variant="h2" tone="inherit">{formatValue(value)}</Typography>
          </div>
        ))}
      </div>
      {loops === maxLoops && (
        <div className="nrnn-gradient-limits__far-result">
          <Typography as="span" variant="bodySmall" tone="muted">继续到 50 个时间步</Typography>
          <Typography as="strong" variant="h3" tone="inherit">{phase.far}</Typography>
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
    <ContentBlock
      headingLevel={1}
      className="nrnn-gradient-limits"
      title="梯度爆炸与梯度消失"
      subtitle="上一页的梯度公式需要计算 x₁…xₙ；这里把 RNN 简化成只剩反复传递的 W₂。"
    >
      <div className="nrnn-gradient-limits__lesson">
        <SimplifiedRnnPath phase={phase} loops={loops} />
        {phase === 'summary' ? (
          <section className="nrnn-gradient-limits__summary" aria-label="梯度爆炸与梯度消失总结">
            <Typography as="span" variant="bodySmall" tone="muted">同一条时间路径，W₂ 取值不同</Typography>
            <Typography as="strong" variant="h2" tone="main">xₙ = W₂ⁿ × x₀</Typography>
            <div className="nrnn-gradient-limits__summary-rules">
              <div className="is-danger"><Typography as="strong" variant="h3" tone="inherit">W₂ &gt; 1</Typography><Typography as="span" variant="bodySmall" tone="inherit">反复相乘变大 → 梯度爆炸</Typography></div>
              <div className="is-accent"><Typography as="strong" variant="h3" tone="inherit">W₂ &lt; 1</Typography><Typography as="span" variant="bodySmall" tone="inherit">反复相乘变小 → 梯度消失</Typography></div>
            </div>
          </section>
        ) : (
          <IterationPanel phase={current!} loops={loops} />
        )}
      </div>
      <div className={`nrnn-gradient-limits__status${phase === 'summary' ? ' is-success' : ''}`}>
        <Typography as="p" variant="body" tone="inherit">{status}</Typography>
        {buttonLabel && <Button variant="primary" onClick={advance} disabled={playing}><Typography as="span" variant="body" tone="inherit">{buttonLabel}</Typography></Button>}
      </div>
    </ContentBlock>
  );
}
