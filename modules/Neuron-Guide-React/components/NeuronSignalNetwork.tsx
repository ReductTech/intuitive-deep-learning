import { useId } from 'react';
import { Typography } from '../../shared/react';
import {
  formatScore,
  effectiveInput,
  normalizedWeight,
  weightedContributions,
  type DecisionScenario,
} from '../model/neuronMath';

export interface NeuronSignalNetworkProps {
  scenario: DecisionScenario;
  values: Array<number | null>;
  count?: 1 | 3;
}

export function NeuronSignalNetwork({ scenario, values, count = 3 }: NeuronSignalNetworkProps) {
  const titleId = useId();
  const descriptionId = useId();
  const factors = scenario.factors.slice(0, count);
  const contributions = weightedContributions(scenario, values).slice(0, count);
  const output = contributions.reduce((sum, item) => sum + item, 0);
  const nodeYs = count === 1 ? [126] : [58, 126, 194];
  const subscripts = ['₁', '₂', '₃'];

  return (
    <figure className={`ng-network-wrap${count === 1 ? ' ng-network-wrap--single' : ''}`}>
      <svg viewBox={count === 1 ? '0 34 760 162' : '0 14 760 214'} role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
        <title id={titleId}>输入信号经过权重进入神经元</title>
        <desc id={descriptionId}>每个输入先乘以自己的权重，再在神经元中求和，形成一个输出。</desc>
        <defs>
          <marker id={`${titleId}-arrow`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" className="ng-network-arrow" />
          </marker>
        </defs>
        {factors.map((factor, index) => {
          const y = nodeYs[index];
          const input = effectiveInput(factor, values[index]);
          const weight = normalizedWeight(factor.suggestedImportance);
          return (
            <g key={factor.name}>
              {count !== 1 && (
                <foreignObject className="ng-network-label-object" x="4" y={y - 27} width="116" height="54">
                  <div className="ng-network-label-box">
                    <Typography variant="bodySmall" tone="accent">{factor.valueLabel}</Typography>
                  </div>
                </foreignObject>
              )}
              <circle className="ng-network-node ng-network-node--input" cx="155" cy={y} r="28" />
              <Typography as="text" variant="bodySmall" tone="inherit" className="ng-network-node-symbol" x="155" y={y - 2}>x{subscripts[index]}</Typography>
              <Typography as="text" variant="bodySmall" tone="inherit" className="ng-network-input-value" x="155" y={y + 16}>{formatScore(input)}</Typography>
              {count === 1 && <Typography as="text" variant="bodySmall" tone="accent" className="ng-network-node-label" x="155" y={y + 54}>{factor.valueLabel}</Typography>}
              <line className="ng-network-edge" x1="183" y1={y} x2="424" y2="126" style={{ strokeWidth: 1.5 + weight * 4 }} />
              <g className="ng-network-weight" transform={`translate(278 ${y - 16})`}>
                <rect width="92" height="30" rx="15" />
                <Typography as="text" variant="bodySmall" tone="warning" x="46" y="20">w{subscripts[index]} = {formatScore(weight)}</Typography>
              </g>
            </g>
          );
        })}
        <circle className="ng-network-node ng-network-node--unit" cx="462" cy="126" r="40" />
        <Typography as="text" variant="h3" tone="inherit" className="ng-network-node-symbol ng-network-node-symbol--unit" x="462" y="126">Σ</Typography>
        <Typography as="text" variant="bodySmall" tone="accent" className="ng-network-node-label" x="462" y={count === 1 ? 184 : 181}>加权求和</Typography>
        <line className="ng-network-output-edge" x1="502" y1="126" x2="612" y2="126" markerEnd={`url(#${titleId}-arrow)`} />
        <circle className="ng-network-node ng-network-node--output" cx="652" cy="126" r="34" />
        <Typography as="text" variant="bodySmall" tone="inherit" className="ng-network-node-symbol" x="652" y="122">y</Typography>
        <Typography as="text" variant="bodySmall" tone="warning" className="ng-network-output-value" x="652" y="143">{formatScore(output)}</Typography>
        {count !== 1 && <Typography as="text" variant="bodySmall" tone="accent" className="ng-network-external-label ng-network-external-label--output" x="720" y="131">判断分数</Typography>}
        {count === 1 && <Typography as="text" variant="bodySmall" tone="accent" className="ng-network-node-label" x="652" y="184">判断分数</Typography>}
      </svg>
    </figure>
  );
}
