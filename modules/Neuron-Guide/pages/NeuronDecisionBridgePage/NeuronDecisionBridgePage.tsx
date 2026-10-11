import { useState } from 'react';
import "./NeuronDecisionBridgePage.css";
import { ContentBlock, Typography } from '../../../shared/react';

const neurons = [
  { label: '发现食物', short: '食物', x: 14, y: 18 },
  { label: '感到危险', short: '危险', x: 10, y: 50 },
  { label: '正在饥饿', short: '饥饿', x: 14, y: 82 },
] as const;

const outcomes = [
  { title: '休息等待', rule: '三个单元都为 0：没有信号被激活。' },
  { title: '寻找食物', rule: '只有饥饿为 1：开始寻找食物。' },
  { title: '立即回避', rule: '只有危险为 1：优先避开风险。' },
  { title: '忍饥避险', rule: '危险与饥饿同为 1：先回避。' },
  { title: '靠近食物', rule: '只有食物为 1：向食物靠近。' },
  { title: '立即觅食', rule: '食物与饥饿同为 1：快速靠近。' },
  { title: '放弃食物', rule: '食物与危险同为 1：回避优先。' },
  { title: '绕行觅食', rule: '三个单元都为 1：避险后再觅食。' },
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
      headingLevel={1}
      className="ngtw-lecture-stage ngtw-neuron-decision-bridge"
      title="一个神经元很简单，组合起来却极其复杂"
    >
      <section className="ngtw-neuron-decision-bridge__stage grid min-w-0 max-w-full grid-cols-[minmax(0,1.55fr)_minmax(0,.75fr)] gap-[18px]" aria-label="神经元组合状态实验">
        <div className="ngtw-neuron-decision-bridge__network relative min-w-0 max-w-full min-h-[390px] overflow-hidden rounded-[28px]">
          <svg className="ngtw-neuron-decision-bridge__wires absolute inset-0 w-full h-full max-w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="ngtw-signal-gradient" x1="0" x2="1">
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
              className={`ngtw-neuron-decision-bridge__neuron absolute grid w-[112px] max-w-[22%] gap-[2px] rounded-[50%] bg-[rgba(255,255,255,.92)] text-center ${states[index] ? 'is-active' : ''}`}
              style={{ left: `${neuron.x}%`, top: `${neuron.y}%` }}
              type="button"
              aria-pressed={states[index]}
              key={neuron.label}
              onClick={() => setStates((current) => current.map((state, itemIndex) => itemIndex === index ? !state : state))}
            >
              <span className="ngtw-neuron-decision-bridge__neuron-pulse absolute inset-[-1px] rounded-[inherit]" aria-hidden="true" />
              <Typography as="strong" variant="h3" tone="inherit">{neuron.short}</Typography>
              <Typography as="span" variant="bodySmall" tone="inherit">{states[index] ? '1 · 响应' : '0 · 静默'}</Typography>
            </button>
          ))}

          <div className="ngtw-neuron-decision-bridge__core absolute left-[61%] top-[50%] grid w-[190px] h-[190px] justify-items-center gap-[1px] overflow-visible rounded-[50%] bg-[rgba(255,255,255,.94)] text-center" aria-live="polite">
            <span className="ngtw-neuron-decision-bridge__core-orbit absolute inset-[-23px] rounded-[50%]" aria-hidden="true" />
            <Typography variant="body" tone="muted">三个输出组合</Typography>
            <Typography as="span" variant="body" tone="accent">{stateCode}</Typography>
            <Typography as="strong" variant="body" tone="success">{outcome.title}</Typography>
          </div>

          <div className="ngtw-neuron-decision-bridge__decision absolute right-[4%] top-[50%] grid w-[22%] min-w-0 gap-[5px] p-[9px_0_9px_12px]">
            <Typography variant="body" tone="warning">组合后的状态</Typography>
            <Typography as="strong" variant="h3" tone="accent">{outcome.title}</Typography>
            <Typography variant="body" tone="muted">{outcome.rule}</Typography>
          </div>
        </div>

        <div className="ngtw-neuron-decision-bridge__states grid min-w-0 max-w-full grid-rows-[minmax(0,1fr)_auto] gap-[12px] rounded-[28px] p-[20px]" aria-label="八种组合状态">
          <div className="ngtw-neuron-decision-bridge__state-grid grid min-w-0 grid-cols-[repeat(2,minmax(0,1fr))] content-center gap-[8px]">
            {combinations.map((combination, index) => (
              <button
                type="button"
                className={index === stateIndex ? 'is-current' : ''}
                aria-pressed={index === stateIndex}
                key={combination}
                onClick={() => chooseCombination(index)}
              >
                <span className="ngtw-neuron-decision-bridge__bits flex gap-[2px]" aria-hidden="true">
                  {combination.split('').map((bit, bitIndex) => <i className={bit === '1' ? 'is-on' : ''} key={bitIndex} />)}
                </span>
                <Typography as="code" variant="body" tone="inherit">{combination}</Typography>
                <Typography as="span" variant="body" tone="inherit">{outcomes[index].title}</Typography>
              </button>
            ))}
          </div>
          <div className="ngtw-neuron-decision-bridge__scale grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-[10px] pt-[14px] text-center">
            <div><Typography variant="body" tone="muted" wrap="nowrap">3 个二值输出</Typography><Typography as="strong" variant="h1" tone="accent" wrap="nowrap">2³ = 8</Typography></div>
            <Typography as="span" variant="h3" tone="warning" aria-hidden="true">→</Typography>
            <div><Typography variant="body" tone="muted" wrap="nowrap">秀丽隐杆线虫的302 个神经元</Typography><Typography as="strong" variant="h1" tone="accent" wrap="nowrap">2³⁰² ≈ 8.1 × 10⁹⁰</Typography></div>
          </div>
        </div>
      </section>

      <div className="ngtw-neuron-decision-bridge__conclusion grid min-w-0 max-w-full items-center p-[14px_20px]">
        <Typography as="strong" variant="h3" tone="accent">在极度简化的二值模型中，每增加一个神经元，可能的状态组合数就翻一倍。</Typography>
      </div>
    </ContentBlock>
  );
}


