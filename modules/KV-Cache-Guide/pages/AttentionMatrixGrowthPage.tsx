import { useState } from 'react';
import { RangeControl, Typography } from '../../shared/react';
import './AttentionMatrixGrowthPage.css';

const LENGTHS = [4, 8, 16, 32] as const;
const WORDS = ['我', '爱', '学', '习'];

function VectorRows({ kind, count }: { kind: 'q' | 'k'; count: number }) {
  return <div className={`kvg-vector kvg-vector--${kind}`}>
    <Typography as="strong" variant="h2" align="center">{kind.toUpperCase()}</Typography>
    <div className="kvg-vector-rows" aria-label={`${kind.toUpperCase()} 有 ${count} 行`}>
      {Array.from({ length: count }, (_, index) => <span key={index} />)}
    </div>
    <Typography as="span" variant="h3" align="center">{count} 行</Typography>
  </div>;
}

export function AttentionMatrixGrowthPage() {
  const [lengthIndex, setLengthIndex] = useState(0);
  const length = LENGTHS[lengthIndex];
  const squareStyle = { width: length * 10.5, height: length * 10.5, backgroundSize: `${100 / length}% ${100 / length}%` };

  return <section className="kvg-slide" aria-label="注意力中间矩阵随上下文长度增长">
    <header className="kvg-header">
      <Typography as="h1" variant="display">注意力的临时显存来自这些大矩阵</Typography>
    </header>

    <div className="kvg-stage">
      <div className="kvg-tokens" aria-label="示例输入：我爱学习">
        {WORDS.map(word => <div className="kvg-token" key={word}><Typography as="span" variant="h3">{word}</Typography></div>)}
        {length > 4 && <Typography as="span" variant="h3" tone="muted" align="center">…</Typography>}
      </div>
      <div className="kvg-vector-pair">
        <VectorRows kind="q" count={length} />
        <Typography as="span" variant="h2" tone="muted">×</Typography>
        <VectorRows kind="k" count={length} />
        <Typography as="span" variant="h2" tone="muted">→</Typography>
      </div>
      <div className="kvg-result">
        <div className="kvg-result-matrix">
          <Typography as="strong" variant="h3">S = QK<sup>T</sup></Typography>
          <div className="kvg-square kvg-square--score" style={squareStyle} role="img" aria-label={`分数矩阵 S，${length} 乘 ${length}，共 ${length * length} 个位置`} />
          <Typography as="strong" variant="h3" tone="success">{length} × {length}</Typography>
        </div>
        <Typography as="span" variant="h3" align="center" className="kvg-softmax-arrow">Softmax →</Typography>
        <div className="kvg-result-matrix">
          <Typography as="strong" variant="h3">P = Softmax(S)</Typography>
          <div className="kvg-square kvg-square--probability" style={squareStyle} role="img" aria-label={`权重矩阵 P，${length} 乘 ${length}，共 ${length * length} 个位置`} />
          <Typography as="strong" variant="h3" tone="success">{length} × {length}</Typography>
        </div>
      </div>
    </div>

    <footer className="kvg-footer">
      <div className="kvg-slider-heading">
        <Typography as="strong" variant="h3">长度 T：{length}</Typography>
        <Typography as="strong" variant="h3" tone="success">T ×2 → 面积 ×4</Typography>
      </div>
      <RangeControl
        id="kvg-length"
        label=""
        aria-label="上下文 token 数量"
        min={0}
        max={3}
        step={1}
        discrete
        scale={LENGTHS.map(value => String(value))}
        value={lengthIndex}
        formatValue={value => `${LENGTHS[Number(value)]} token`}
        onChange={event => setLengthIndex(Number(event.currentTarget.value))}
      />
    </footer>
  </section>;
}
