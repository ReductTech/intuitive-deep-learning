import { Typography } from '../../../shared/react';
import './CellChain.css';

/** 一格里的哪一段需要高亮：梯度公式的每一项都对应其中一段。 */
export type CellPart = 'input' | 'weight' | 'bias' | 'activation' | 'outWeight' | 'outBias' | 'output';

export interface CellChainProps {
  /** 这一格的输入值，例如 0。 */
  input: string;
  /** 激活函数输出的名字，例如 y₁。 */
  activation: string;
  /** 输出值；还没有预测出来时传 null。 */
  output?: string | null;
  /** 需要点亮的部位。 */
  highlight?: CellPart | null;
  className?: string;
}

export function ReluGlyph() {
  return (
    <svg className="nrnn-cell-chain__relu" viewBox="0 0 64 44" aria-hidden="true">
      <path d="M6 38 H58 M20 6 V40" fill="none" stroke="#C7D1E0" strokeWidth="2" />
      <path d="M20 36 H38 L56 8" fill="none" stroke="#6FA84A" strokeLinecap="round" strokeWidth="4" />
    </svg>
  );
}

interface BoxSpec {
  part: CellPart;
  label: string;
  value?: string;
  glyph?: boolean;
}

export function CellChain({ input, activation, output = null, highlight = null, className }: CellChainProps) {
  const boxes: BoxSpec[] = [
    { part: 'input', label: '输入', value: input },
    { part: 'weight', label: 'W₁', value: '×1.8' },
    { part: 'bias', label: 'b₁', value: '+0.0' },
    { part: 'activation', label: activation, glyph: true },
    { part: 'outWeight', label: 'W₃', value: '×1.1' },
    { part: 'outBias', label: 'b₃', value: '+0.0' },
    { part: 'output', label: '输出', value: output ?? '' },
  ];

  return (
    <div className={className ? `nrnn-cell-chain ${className}` : 'nrnn-cell-chain'}>
      {boxes.map((box, index) => (
        <div className="nrnn-cell-chain__unit" key={box.part}>
          {index > 0 && <Typography as="span" variant="h3" tone="light" className="nrnn-cell-chain__arrow">→</Typography>}
          <div className={`nrnn-cell-chain__box is-${box.part}${highlight === box.part ? ' is-highlighted' : ''}`}>
            <Typography as="span" variant="bodySmall" tone="muted">{box.label}</Typography>
            {box.glyph
              ? <ReluGlyph />
              : <Typography as="strong" variant="h3" tone="main">{box.value}</Typography>}
          </div>
        </div>
      ))}
    </div>
  );
}
