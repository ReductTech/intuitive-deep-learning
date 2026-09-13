import { useRef, useState, type CSSProperties } from 'react';
import "./BiasThresholdTheoryPage.css";
import { ContentBlock, FormulaBlock, FormulaTerm, Typography } from '../../../shared/react';
import { formatScore, weightedSum } from '../../model/neuronMath';
import { useNeuronLesson } from '../../model/NeuronLessonContext';

const thresholdPresets = [
  { label: '宽松', value: 0.8 },
  { label: '中间', value: 1.5 },
  { label: '严格', value: 2.2 },
];

function clampPosition(value: number): number {
  return Math.max(0, Math.min(100, (value / 3) * 100));
}

export function BiasThresholdTheoryPage({ onComplete }: { onComplete?: () => void }) {
  const { state, scenario } = useNeuronLesson();
  const [threshold, setThreshold] = useState(1.5);
  const [thresholdTouched, setThresholdTouched] = useState(false);
  const completedRef = useRef(false);

  const values = scenario.factors.map((factor, index) => state.values[index] ?? factor.suggestedValue);
  const score = weightedSum(scenario, values);
  const bias = -threshold;
  const centeredScore = score + bias;
  const isActive = score > threshold;
  const tendency = isActive ? scenario.positiveLabel : scenario.negativeLabel;
  const thresholdDisplay = threshold.toFixed(2);
  const scoreDisplay = formatScore(score);
  const centeredScoreDisplay = formatScore(centeredScore);
  const zPosition = clampPosition(score);
  const thresholdPosition = clampPosition(threshold);

  const markComplete = () => {
    setThresholdTouched(true);
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  };

  const updateThreshold = (nextValue: number) => {
    setThreshold(nextValue);
    markComplete();
  };

  const stageStyle = {
    '--ng-z-position': `${zPosition}%`,
    '--ng-threshold-position': `${thresholdPosition}%`,
  } as CSSProperties;

  return (
    <ContentBlock
      headingLevel={1}
      className="ng-bias-theory"
      title={`为什么需要 bias，才能判断“${scenario.positiveLabel}”？`}
      subtitle={`权重决定“看重什么”，bias 决定“${scenario.positiveLabel}”需要多大总输入才算够。`}
    >
      <div className="ng-bias-theory__context">
        <Typography as="span" variant="body" tone="muted">上一页得到总输入</Typography>
        <FormulaTerm tooltip="z：三个输入经过加权求和后的总输入">
          z = WᵀX = {scoreDisplay}
        </FormulaTerm>
        <Typography as="span" variant="body" tone="muted">当前决定：{scenario.question}</Typography>
      </div>

      <section className="ng-bias-theory__experiment" aria-live="polite" style={stageStyle}>
        <div className="ng-bias-theory__steps" aria-label="偏置实验步骤">
          <div className="ng-bias-theory__step is-complete">
            <span className="ng-bias-theory__step-number">1</span>
            <span>
              <Typography as="strong" variant="body" tone="main">固定总输入 z</Typography>
              <Typography as="span" variant="bodySmall" tone="muted">保持输入和权重不变</Typography>
            </span>
          </div>
          <span className="ng-bias-theory__step-arrow" aria-hidden="true">›</span>
          <div className={`ng-bias-theory__step ${thresholdTouched ? 'is-complete' : 'is-current'}`}>
            <span className="ng-bias-theory__step-number">2</span>
            <span>
              <Typography as="strong" variant="body" tone="main">拖动门槛 θ</Typography>
              <Typography as="span" variant="bodySmall" tone="muted">调整需要多少总输入才激活</Typography>
            </span>
          </div>
          <span className="ng-bias-theory__step-arrow" aria-hidden="true">›</span>
          <div className={`ng-bias-theory__step ${thresholdTouched ? 'is-current' : ''}`}>
            <span className="ng-bias-theory__step-number">3</span>
            <span>
              <Typography as="strong" variant="body" tone="main">观察 b 和输出</Typography>
              <Typography as="span" variant="bodySmall" tone="muted">看门槛变化如何影响输出</Typography>
            </span>
          </div>
        </div>

        <div className="ng-bias-theory__workspace">
          <div className="ng-bias-theory__numberline-panel">
            <div className="ng-bias-theory__marker-labels">
              <Typography variant="body" tone="success">
                总输入 <FormulaTerm tooltip="固定不变的加权总输入">z = {scoreDisplay}</FormulaTerm>
              </Typography>
              <Typography variant="body" tone="warning">
                门槛 <FormulaTerm tooltip="神经元需要达到的激活门槛">θ = {thresholdDisplay}</FormulaTerm>
              </Typography>
            </div>

            <div className="ng-bias-theory__numberline" aria-label={`总输入 ${scoreDisplay}，门槛 ${thresholdDisplay}`}>
              <div className="ng-bias-theory__track" />
              <div className="ng-bias-theory__ticks" aria-hidden="true">
                {[0, 1, 2, 3].map((tick) => (
                  <span key={tick} style={{ left: `${(tick / 3) * 100}%` }}>{tick}</span>
                ))}
              </div>
              <span className="ng-bias-theory__marker ng-bias-theory__marker--z" aria-hidden="true" />
              <span className="ng-bias-theory__marker ng-bias-theory__marker--threshold" aria-hidden="true" />
              <input
                className="ng-bias-theory__range"
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={threshold}
                aria-label="调整判断门槛"
                onChange={(event) => updateThreshold(Number(event.target.value))}
              />
            </div>

            <div className="ng-bias-theory__drag-label">
              <Typography variant="body" tone="warning">拖动门槛 θ</Typography>
              <Typography as="span" variant="bodySmall" tone="muted">试试看：门槛越高，越不容易输出 1</Typography>
            </div>

            <FormulaBlock ariaLabel="总输入加上偏置后的结果">
              <FormulaTerm tooltip="z：输入和权重相乘后加总的结果">z</FormulaTerm>
              {' + '}
              <FormulaTerm tooltip="b：偏置，等于门槛的相反数">b</FormulaTerm>
              {' = '}
              <FormulaTerm tooltip="固定的总输入">{scoreDisplay}</FormulaTerm>
              {' + ('}
              <FormulaTerm tooltip={`b = −θ = −${thresholdDisplay}`}>{formatScore(bias)}</FormulaTerm>
              {') = '}
              <FormulaTerm className={isActive ? 'ng-bias-theory__formula-result--active' : 'ng-bias-theory__formula-result--inactive'} tooltip="送入激活函数前的净输入">
                {centeredScoreDisplay}
              </FormulaTerm>
            </FormulaBlock>
            <Typography variant="bodySmall" tone="muted">
              其中 <FormulaTerm tooltip="偏置与判断门槛方向相反">b = −θ</FormulaTerm>
            </Typography>
          </div>

          <aside className={`ng-bias-theory__output ${isActive ? 'is-active' : ''}`}>
            <Typography variant="body" tone="muted">输出</Typography>
            <Typography as="strong" variant="h1" tone={isActive ? 'success' : 'warning'}>
              {isActive ? '1' : '0'}
            </Typography>
            <Typography variant="body" tone="muted">
              因为 {scoreDisplay} {isActive ? '>' : '≤'} {thresholdDisplay}
            </Typography>
            <div className="ng-bias-theory__output-divider" />
            <Typography variant="body" tone={isActive ? 'success' : 'accent'}>
              更倾向于“{tendency}”
            </Typography>
          </aside>
        </div>

        <div className="ng-bias-theory__controls">
          <Typography as="strong" variant="body" tone="main">快速设置门槛：</Typography>
          <div className="ng-bias-theory__presets">
            {thresholdPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`ng-bias-theory__preset ${threshold === preset.value ? 'is-selected' : ''}`}
                onClick={() => updateThreshold(preset.value)}
              >
                <Typography as="span" variant="body" tone={threshold === preset.value ? 'warning' : 'main'}>
                  {preset.label} <FormulaTerm tooltip="当前预设对应的判断门槛">θ = {preset.value.toFixed(1)}</FormulaTerm>
                </Typography>
              </button>
            ))}
          </div>
          <div className="ng-bias-theory__controls-note">
            <FormulaTerm tooltip="偏置不会改变输入和权重，只改变神经元的启动标准">b = −θ</FormulaTerm>
            <Typography as="span" variant="bodySmall" tone="muted">不改权重，只改启动标准</Typography>
          </div>
        </div>
      </section>

      <div className="ng-bias-theory__key-point">
        <span className="ng-bias-theory__key-point-mark" aria-hidden="true">i</span>
        <Typography as="strong" variant="body" tone="main">
          bias 不是新的输入因素，而是神经元自己的<strong>启动标准</strong>。
        </Typography>
        <Typography as="span" variant="body" tone="muted">
          它让模型在不改变各输入权重关系的前提下，整体调高或调低“够不够”的标准。
        </Typography>
      </div>
    </ContentBlock>
  );
}
