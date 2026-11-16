import { Typography } from "@shuku/course-style/react";
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
    <svg shuku-edit-id="e-3ab58137-0a75-4ca4-9e94-2808f9597214" className="nrnn-cell-chain__relu" viewBox="0 0 64 44" aria-hidden="true">
      <path shuku-edit-id="e-69c2578b-b400-48c3-be88-ad874e98a0c6" d="M6 38 H58 M20 6 V40" fill="none" stroke="#C7D1E0" strokeWidth="2" />
      <path shuku-edit-id="e-5a78beee-b8c8-4d7c-8d3c-f4b0a92de987" d="M20 36 H38 L56 8" fill="none" stroke="#6FA84A" strokeLinecap="round" strokeWidth="4" />
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
    <div shuku-edit-id="e-451d5fc5-ef28-48be-88bb-0845dd567d6a" className={className ? `nrnn-cell-chain ${className}` : 'nrnn-cell-chain'}>
      {boxes.map((box, index) => (
        <div shuku-edit-id="e-ce85206f-52a5-47af-aab3-712b4e948890" className="nrnn-cell-chain__unit" key={box.part}>
          {index > 0 && <Typography shuku-edit-id="e-6957b557-27c4-400b-9f14-e54ac6d46673" as="span" variant="h3" tone="light" className="nrnn-cell-chain__arrow">→</Typography>}
          <div shuku-edit-id="e-8e74fc72-01f5-4d5b-9425-21eb865a3007" className={`nrnn-cell-chain__box is-${box.part}${highlight === box.part ? ' is-highlighted' : ''}`}>
            <Typography shuku-edit-id="e-b1943148-9341-49c9-af49-6047a4d6fc5d" as="span" variant="bodySmall" tone="muted">{box.label}</Typography>
            {box.glyph
              ? <ReluGlyph />
              : <Typography shuku-edit-id="e-c1bbb699-f3ad-47e6-b722-f88a9887034e" as="strong" variant="h3" tone="main">{box.value}</Typography>}
          </div>
        </div>
      ))}
    </div>
  );
}
