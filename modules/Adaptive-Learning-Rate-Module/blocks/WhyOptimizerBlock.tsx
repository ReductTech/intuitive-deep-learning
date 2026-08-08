import { useMemo, useState } from 'react';
import {
  ContentBlock,
  FormulaBlock,
  FormulaTerm,
  NoticeStrip,
  Question,
  RangeControl,
  ValueTile,
} from '../../shared/react';
import { simulateOneDimensionalSgd } from '../domain/optimizerSimulation';

interface WhyOptimizerBlockProps {
  onComplete?: () => void;
}

function rateReading(learningRate: number) {
  if (learningRate < .18) return { tone: 'blue' as const, label: '步子很小', text: '路线稳定，但 8 步后仍离最低点较远。' };
  if (learningRate <= 1) return { tone: 'green' as const, label: '稳定靠近', text: '每一步都缩小与最低点的距离。' };
  if (learningRate < 2) return { tone: 'orange' as const, label: '来回跨越', text: '仍可能收敛，但会反复越过最低点。' };
  return { tone: 'red' as const, label: '开始发散', text: '每次跨越后离最低点更远，损失会越来越大。' };
}

export function WhyOptimizerBlock({ onComplete }: WhyOptimizerBlockProps) {
  const [learningRate, setLearningRate] = useState(.12);
  const parameters = useMemo(() => simulateOneDimensionalSgd(learningRate), [learningRate]);
  const reading = rateReading(learningRate);
  const finalParameter = parameters.at(-1) ?? 0;
  const visibleParameters = parameters.map((parameter) => Math.max(-6, Math.min(6, parameter)));

  return (
    <ContentBlock
      className="alr-block"
      title="同一个固定步长，为什么很难处处合适？"
      subtitle="学习率决定每次沿梯度走多远。先改变它，观察“太慢”和“来回越过”如何由同一个旋钮产生。"
    >
      <FormulaBlock ariaLabel="最基础的梯度下降更新公式">
        <FormulaTerm tooltip="更新后的参数">θ<sub>t+1</sub></FormulaTerm>
        {' = '}
        <FormulaTerm tooltip="当前参数">θ<sub>t</sub></FormulaTerm>
        {' − '}
        <FormulaTerm tooltip="学习率，决定整体步幅">η</FormulaTerm>
        {' · '}
        <FormulaTerm tooltip="当前梯度，指出上坡方向">g<sub>t</sub></FormulaTerm>
      </FormulaBlock>

      <section className="alr-lab" aria-labelledby="alr-fixed-rate-title">
        <header>
          <div><span>固定学习率实验</span><h3 id="alr-fixed-rate-title">用同一个 η 连走 8 步</h3></div>
          <strong className={`alr-status alr-status--${reading.tone}`}>{reading.label}</strong>
        </header>
        <RangeControl
          label="学习率 η"
          min={.05}
          max={2.1}
          step={.05}
          value={learningRate}
          digits={2}
          scale={['慢而稳', '可能越过', '发散']}
          hint
          onChange={(event) => setLearningRate(Number(event.currentTarget.value))}
        />
        <div className="alr-bowl" role="img" aria-label={`学习率 ${learningRate.toFixed(2)} 下，参数从 4.5 经过八步到达 ${finalParameter.toFixed(2)}`}>
          <svg viewBox="0 0 640 240" aria-hidden="true">
            <path className="alr-bowl-curve" d="M52 35 Q320 380 588 35" />
            <line x1="320" x2="320" y1="196" y2="211" />
            <text x="320" y="229">最低点 θ = 0</text>
            <polyline className="alr-step-line" points={visibleParameters.map((parameter) => `${320 + parameter * 43},${196 - parameter ** 2 * 6.8}`).join(' ')} />
            {visibleParameters.map((parameter, index) => (
              <g key={index}>
                <circle className={index === visibleParameters.length - 1 ? 'alr-step-dot is-final' : 'alr-step-dot'} cx={320 + parameter * 43} cy={196 - parameter ** 2 * 6.8} r={index === 0 ? 7 : 5} />
                {index > 0 && <text className="alr-step-label" x={320 + parameter * 43} y={184 - parameter ** 2 * 6.8}>{index}</text>}
              </g>
            ))}
          </svg>
        </div>
        <div className="alr-values">
          <ValueTile tone="blue" label="起点 |θ|" value="4.50" />
          <ValueTile tone={reading.tone === 'green' ? 'success' : 'orange'} label="8 步后 |θ|" value={Math.abs(finalParameter).toFixed(2)} />
          <ValueTile tone={Math.abs(finalParameter) < .5 ? 'success' : 'danger'} label="离最低点" value={Math.abs(finalParameter) < .5 ? '很近' : '仍较远'} />
        </div>
        <NoticeStrip tone={reading.tone} lead={`${reading.label}：`}>{reading.text}</NoticeStrip>
      </section>

      <Question
        persistenceKey="optimizer-fixed-rate-tradeoff-v1"
        type="choice"
        title="为什么训练不能只把固定学习率设得尽可能大？"
        options={[
          { key: 'A', value: 'overshoot', label: '步长可能反复跨过最低点，甚至让损失发散' },
          { key: 'B', value: 'direction', label: '学习率越大，梯度指出的方向就一定会反转', wrongFeedback: '梯度由损失曲面决定；学习率主要缩放移动距离。' },
          { key: 'C', value: 'accuracy', label: '大学习率会让每个梯度自动变得不准确', wrongFeedback: '梯度的噪声主要来自采样；学习率不会改变已经算出的梯度。' },
        ]}
        answer="overshoot"
        feedback={{ correct: '正确。优化器的任务不只是知道往哪走，还要让更新在速度、噪声与稳定性之间取得平衡。' }}
        onCheck={(result) => { if (result.ok) onComplete?.(); }}
      />
    </ContentBlock>
  );
}
