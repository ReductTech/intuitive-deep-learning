import { useState } from 'react';
import { ContentBlock, Typography } from '../../shared/react';

const neurons = [
  { label: '发现食物', short: '食物', x: 14, y: 18 },
  { label: '感到危险', short: '危险', x: 10, y: 50 },
  { label: '正在饥饿', short: '饥饿', x: 14, y: 82 },
] as const;

const outcomes = [
  { title: '休息等待', rule: '没有显著信号，暂时保持当前状态。' },
  { title: '寻找食物', rule: '感到饥饿，但附近还没有明确的食物线索。' },
  { title: '立即回避', rule: '危险信号出现，优先避开风险。' },
  { title: '忍饥避险', rule: '即使感到饥饿，也先离开危险区域。' },
  { title: '靠近食物', rule: '发现食物且没有危险，开始接近。' },
  { title: '立即觅食', rule: '既发现食物又感到饥饿，于是快速靠近。' },
  { title: '放弃食物', rule: '食物与危险同时出现，回避优先。' },
  { title: '绕行觅食', rule: '食物、危险和饥饿同时出现：绕开风险再接近食物。' },
] as const;

const combinations = Array.from({ length: 8 }, (_, index) => index.toString(2).padStart(3, '0'));

export function NeuronDecisionBridgePage() {
  const [states, setStates] = useState([true, false, true]);
  const stateIndex = states.reduce((value, active, index) => value + (active ? 2 ** (2 - index) : 0), 0);
  const outcome = outcomes[stateIndex];
  const stateCode = combinations[stateIndex];

  const chooseCombination = (index: number) => {
    setStates(combinations[index].split('').map((bit) => bit === '1'));
  };

  return (
    <ContentBlock
      className="ng-lecture-stage ng-neuron-decision-bridge"
      title="神经元究竟在做什么？"
      subtitle="早期二值模型把单个神经元简化为 0 或 1；许多简单状态组合起来，却能形成丰富的判断与行为。"
    >
      <section className="ng-neuron-decision-bridge__stage" aria-label="神经元组合状态实验">
        <div className="ng-neuron-decision-bridge__network">
          <svg className="ng-neuron-decision-bridge__wires" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="ng-signal-gradient" x1="0" x2="1">
                <stop offset="0" stopColor="#2d7d68" />
                <stop offset="1" stopColor="#f07e47" />
              </linearGradient>
            </defs>
            {neurons.map((neuron, index) => (
              <path key={neuron.short} className={states[index] ? 'is-active' : ''} d={`M ${neuron.x + 7} ${neuron.y} C 39 ${neuron.y}, 43 50, 61 50`} />
            ))}
          </svg>

          {neurons.map((neuron, index) => (
            <button
              className={`ng-neuron-decision-bridge__neuron ${states[index] ? 'is-active' : ''}`}
              style={{ left: `${neuron.x}%`, top: `${neuron.y}%` }}
              type="button"
              aria-pressed={states[index]}
              key={neuron.label}
              onClick={() => setStates((current) => current.map((state, itemIndex) => itemIndex === index ? !state : state))}
            >
              <span className="ng-neuron-decision-bridge__neuron-pulse" aria-hidden="true" />
              <Typography as="strong" variant="h3" tone="inherit">{neuron.short}</Typography>
              <Typography as="span" variant="bodySmall" tone="inherit">{states[index] ? '1 · 响应' : '0 · 静默'}</Typography>
            </button>
          ))}

          <div className="ng-neuron-decision-bridge__core" aria-live="polite">
            <span className="ng-neuron-decision-bridge__core-orbit" aria-hidden="true" />
            <Typography variant="bodySmall" tone="muted">组合状态</Typography>
            <Typography as="code" variant="display" tone="accent">{stateCode}</Typography>
            <Typography as="strong" variant="h2" tone="success">{outcome.title}</Typography>
          </div>

          <div className="ng-neuron-decision-bridge__decision">
            <Typography variant="bodySmall" tone="warning">当前判断</Typography>
            <Typography as="strong" variant="h3" tone="accent">{outcome.title}</Typography>
            <Typography variant="bodySmall" tone="muted">{outcome.rule}</Typography>
          </div>
        </div>

        <div className="ng-neuron-decision-bridge__states" aria-label="八种组合状态">
          <div className="ng-neuron-decision-bridge__states-head">
            <Typography variant="bodySmall" tone="warning">状态星图</Typography>
            <Typography variant="bodySmall" tone="muted">选择一种组合</Typography>
          </div>
          <div className="ng-neuron-decision-bridge__state-grid">
            {combinations.map((combination, index) => (
              <button
                type="button"
                className={index === stateIndex ? 'is-current' : ''}
                aria-pressed={index === stateIndex}
                key={combination}
                onClick={() => chooseCombination(index)}
              >
                <span className="ng-neuron-decision-bridge__bits" aria-hidden="true">
                  {combination.split('').map((bit, bitIndex) => <i className={bit === '1' ? 'is-on' : ''} key={bitIndex} />)}
                </span>
                <Typography as="code" variant="bodySmall" tone="inherit">{combination}</Typography>
                <Typography as="span" variant="bodySmall" tone="inherit">{outcomes[index].title}</Typography>
              </button>
            ))}
          </div>
          <div className="ng-neuron-decision-bridge__scale">
            <div><Typography variant="bodySmall" tone="muted">3 个神经元</Typography><Typography as="strong" variant="h2" tone="accent">2³ = 8</Typography></div>
            <Typography as="span" variant="h3" tone="warning" aria-hidden="true">→</Typography>
            <div><Typography variant="bodySmall" tone="muted">10 个神经元</Typography><Typography as="strong" variant="h2" tone="accent">2¹⁰ = 1024</Typography></div>
          </div>
        </div>
      </section>

      <div className="ng-neuron-decision-bridge__conclusion">
        <Typography as="strong" variant="h3" tone="accent">复杂行为，不一定需要复杂单元；简单的“是 / 否”经过组合与连接，也能形成丰富的判断。</Typography>
      </div>
    </ContentBlock>
  );
}



