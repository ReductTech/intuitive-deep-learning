import { useEffect, useRef, useState } from 'react';
import { ContentBlock, Feedback, Question, RangeControl, ValueTile, emitTelemetry, getTelemetryState } from '../../shared/react';

interface TransposedConvolutionBlockProps { onComplete?: () => void; }
interface TransposedState { stride?: number; reached?: boolean; }
const stateKey = 'experiment:transposed-convolution-stride-v1';
const strideOne = [0, 0, 1, 0, 4, 6, 4, 12, 9];
const strideTwo = [0, 0, 0, 1, 0, 0, 2, 3, 0, 2, 0, 3, 4, 6, 6, 9];

function NumberGrid({ values, size, label }: { values: number[]; size: number; label: string }) {
  return <div className="pvm-number-panel"><strong>{label}</strong><div className="pvm-number-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>{values.map((value, index) => <span key={index}>{value}</span>)}</div></div>;
}

export function TransposedConvolutionBlock({ onComplete }: TransposedConvolutionBlockProps) {
  const [stride, setStride] = useState(1);
  const [reached, setReached] = useState(false);
  const [questionCorrect, setQuestionCorrect] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const completedRef = useRef(false);
  const output = stride === 1 ? strideOne : strideTwo;
  const size = stride === 1 ? 3 : 4;

  useEffect(() => {
    let alive = true;
    void getTelemetryState<TransposedState>(stateKey).then((entry) => {
      if (!alive) return;
      if (entry?.state?.stride === 2) setStride(2);
      if (entry?.state?.reached) setReached(true);
      setHydrated(true);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!hydrated || !reached || !questionCorrect || completedRef.current) return;
    completedRef.current = true; onComplete?.();
  }, [hydrated, onComplete, questionCorrect, reached]);

  function changeStride(next: number) {
    const nextReached = reached || next === 2;
    setStride(next); setReached(nextReached);
    emitTelemetry('transposed_convolution_stride_change', null, { state_key: stateKey, stride: next, output_size: next === 1 ? 3 : 4, reached: nextReached, state: { stride: next, reached: nextReached } });
  }

  return (
    <ContentBlock className="pvm-block pvm-transposed-block" title="转置卷积把每个输入值展开成一块加权卷积核，再把重叠位置相加" subtitle="将步幅从 1 调到 2，观察 2×2 输入和 2×2 卷积核怎样得到更大的输出。">
      <div className="pvm-transposed-layout">
        <div className="pvm-matrix-flow">
          <NumberGrid label="输入 X" size={2} values={[0, 1, 2, 3]} />
          <span aria-hidden="true">⊛ᵀ</span>
          <NumberGrid label="卷积核 K" size={2} values={[0, 1, 2, 3]} />
          <span aria-hidden="true">→</span>
          <NumberGrid label={`输出 Y · ${size}×${size}`} size={size} values={output} />
        </div>
        <div className="pvm-transposed-console">
          <RangeControl label="转置卷积步幅" min={1} max={2} step={1} value={stride} scale={['1 · 有重叠', '2 · 更大间隔']} hint={!reached} onChange={(event) => changeStride(Number(event.currentTarget.value))} />
          <ValueTile label="输出空间尺寸" value={`${size} × ${size}`} tone={stride === 2 ? 'success' : 'blue'} />
          <Feedback status={stride === 2 ? 'correct' : 'hint'} message={stride === 2 ? '步幅增大了各块写入输出画布的间隔，因此输出从 3×3 扩展到 4×4。' : '步幅 1 时相邻卷积核块会重叠，重叠位置的值相加。'} />
        </div>
      </div>
      <Question
        type="choice"
        title="“转置卷积”是否意味着它一定能恢复普通卷积之前的原始数值？"
        options={[
          { key: 'A', value: 'not-inverse', label: '不一定；它对应卷积矩阵的转置并可学习上采样，但通常不是可逆矩阵的逆运算' },
          { key: 'B', value: 'always-inverse', label: '一定可以，只要卷积核尺寸相同就能无损恢复', wrongFeedback: '普通卷积和下采样可能丢失信息，转置卷积无法保证恢复原值。' },
          { key: 'C', value: 'only-copy', label: '它只会复制像素，不包含可学习参数', wrongFeedback: '转置卷积的卷积核参数可以参与训练。' },
        ]}
        answer="not-inverse"
        feedback={{ correct: reached ? '正确。它擅长扩大空间尺寸，但“转置”描述线性变换关系，不等于数值求逆。' : '判断正确；再把步幅调到 2，观察输出尺寸变化。' }}
        persistenceKey="transposed-convolution-meaning-v1"
        onCheck={(result) => setQuestionCorrect(result.ok)}
      />
    </ContentBlock>
  );
}
