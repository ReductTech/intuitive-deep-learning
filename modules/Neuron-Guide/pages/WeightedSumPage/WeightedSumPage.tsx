import { ContentBlock, Typography } from '../../../shared/react';
import "./WeightedSumPage.css";
import { effectiveInput, useLesson } from '../../LessonContext';
import teacherVideo from '../../assets/teacher_female_10s_wb.mp4';

export interface WeightedSumPageProps {
  onComplete: () => void;
}

export function WeightedSumPage({ onComplete }: WeightedSumPageProps) {
  const {
    state,
    setValueDraft,
    scenario,
  } = useLesson();
  const factor = scenario.factors[0];
  const rawValue = state.values[0] ?? factor.suggestedValue;
  const normalizedValue = effectiveInput(factor, rawValue);
  const isInverse = factor.valueTransform === 'inverse';

  return (
    <ContentBlock
      headingLevel={1}
      className="ng-analysis-stage ng-weighted-sum-redesign"
      title={`把“${factor.name}”翻译成神经元的输入`}
      subtitle={`神经元只能处理数值，所以我们先把“${factor.valueQuestion}”统一转换到 0 ～ 1。`}
    >
      <div className="ng-weighted-sum-redesign__canvas" aria-label="从现实回答到神经元输入">
        <div className="ng-weighted-sum-redesign__top-flow">
          <section className="ng-weighted-sum-redesign__question" aria-label="现实问题">
            <div className="ng-weighted-sum-redesign__question-copy">
              <Typography as="strong" variant="h3" tone="accent">{factor.valueQuestion}</Typography>
              <Typography variant="bodySmall" tone="light">{factor.explanation}</Typography>
            </div>
            <div className="ng-weighted-sum-redesign__range-wrap">
              <input
                className="ng-weighted-sum-redesign__range"
                type="range"
                min="0"
                max="10"
                step="1"
                value={rawValue}
                aria-label={`${factor.name}，评分 0 到 10`}
                onChange={(event) => {
                  setValueDraft(0, Number(event.currentTarget.value));
                  onComplete();
                }}
              />
              <div className="ng-weighted-sum-redesign__scale">
                <Typography as="span" variant="bodySmall" tone="muted">{factor.minDesc}</Typography>
                <Typography as="span" variant="bodySmall" tone="muted">{factor.maxDesc}</Typography>
              </div>
              <div className="ng-weighted-sum-redesign__ticks" aria-hidden="true">
                {[0, 2, 4, 6, 8, 10].map((tick) => <span key={tick}>{tick}</span>)}
              </div>
            </div>
          </section>
          <div className="ng-weighted-sum-redesign__connector" aria-hidden="true"><span>→</span></div>
          <section className={`ng-weighted-sum-redesign__normalize${isInverse ? ' is-inverse' : ''}`} aria-label="统一到 0 到 1">
            <Typography variant="body" tone="accent">统一到 0 ～ 1</Typography>
            <div className="ng-weighted-sum-redesign__operation">
              {isInverse ? '1 − (x₁ ÷ 10)' : 'x₁ ÷ 10'}
            </div>
            {isInverse && (
              <Typography as="span" variant="bodySmall" tone="muted" className="ng-weighted-sum-redesign__inverse-note">
                这是反向计入：评分越高，代表对当前决定的支持越弱。
              </Typography>
            )}
          </section>
          <div className="ng-weighted-sum-redesign__connector" aria-hidden="true"><span>→</span></div>
          <section className="ng-weighted-sum-redesign__output" aria-label="神经元的输入">
            <Typography variant="h3" tone="accent">神经元的输入</Typography>
            <div className="ng-weighted-sum-redesign__input-value">
              <Typography as="strong" variant="h2" tone="success">x₁ = {normalizedValue.toFixed(2)}</Typography>
            </div>
          </section>
        </div>

        <div className="ng-weighted-sum-redesign__tip">
          <div className="ng-weighted-sum-redesign__video"><video src={teacherVideo} autoPlay loop muted playsInline aria-label="教师提示视频" /></div>
          <div className="ng-weighted-sum-redesign__tip-copy">
            <Typography as="strong" variant="h3" tone="accent">小提示</Typography>
            <Typography as="p" variant="body" tone="muted">无论是 1～5 分、1～10 分，还是“非常低～非常高”，都可以通过简单的转换，变成 0～1 之间的数。这样不同的问题都可以用相同的数值尺度输入到神经元中。</Typography>
          </div>
        </div>
      </div>
    </ContentBlock>
  );
}



