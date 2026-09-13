import type { CSSProperties } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import "./ExtraInputsPage.css";
import { useNeuronLesson } from '../../model/NeuronLessonContext';
import {
  effectiveInput,
  formatScore,
  normalizedWeight,
  weightedContributions,
} from '../../model/neuronMath';
import teacherVideo from '../../assets/teacher_male_10s_wb.mp4';

export interface ExtraInputsPageProps {
  onComplete: () => void;
}

export function ExtraInputsPage({ onComplete }: ExtraInputsPageProps) {
  const { state, scenario, setValueDraft, commitValues } = useNeuronLesson();
  const values = scenario.factors.map((factor, index) => state.values[index] ?? factor.suggestedValue);
  const contributions = weightedContributions(scenario, values);
  const output = contributions.reduce((sum, contribution) => sum + contribution, 0);

  const commitValue = () => {
    commitValues();
    onComplete();
  };

  return (
    <ContentBlock
      headingLevel={1}
      className="ng-multi-stage ng-three-factor-sum"
      title="一个决定，通常由多个因素共同推动"
      subtitle="每个因素先变成输入 x，再乘上对应的重要性 w，最后汇总成神经元的总输入。"
    >
      <div className="ng-three-factor-sum__decision">
        <Typography variant="bodySmall" tone="muted">当前正在分析</Typography>
        <Typography as="strong" variant="body" tone="accent">{scenario.question}</Typography>
      </div>

      <div className="ng-three-factor-sum__layout">
        <section className="ng-three-factor-sum__factor-list" aria-label="三个影响因素">
          <div className="ng-three-factor-sum__column-labels" aria-hidden="true">
            <Typography variant="bodySmall" tone="muted">现实因素与输入值</Typography>
            <Typography variant="bodySmall" tone="muted">权重（重要性）</Typography>
          </div>

          {scenario.factors.map((factor, index) => {
            const rawValue = values[index];
            const input = effectiveInput(factor, rawValue);
            const weight = normalizedWeight(factor.suggestedImportance);
            const contribution = contributions[index];

            return (
              <article className="ng-three-factor-sum__factor-row" key={`${factor.name}-${index}`}>
                <div className="ng-three-factor-sum__factor-info">
                  <div className="ng-three-factor-sum__factor-number">0{index + 1}</div>
                  <div className="ng-three-factor-sum__factor-copy">
                    <Typography as="h3" variant="body" tone="accent">{factor.name}</Typography>
                    <Typography variant="bodySmall" tone="muted">{factor.valueQuestion}</Typography>
                    <Typography variant="bodySmall" tone="light">{factor.explanation}</Typography>
                  </div>
                  <div className="ng-three-factor-sum__factor-control">
                    <div className="ng-three-factor-sum__value-head">
                      <Typography variant="bodySmall" tone="muted">输入 x{index + 1}</Typography>
                      <Typography as="strong" variant="bodySmall" tone="accent">{formatScore(input)}</Typography>
                    </div>
                    <input
                      className="ng-three-factor-sum__range"
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={rawValue}
                      disabled={!state || !scenario}
                      aria-label={`${factor.name}，当前评分 ${rawValue} / 10`}
                      onChange={(event) => setValueDraft(index, Number(event.currentTarget.value))}
                      onPointerUp={commitValue}
                      onPointerCancel={commitValue}
                      onKeyUp={commitValue}
                      onBlur={commitValue}
                    />
                    <div className="ng-three-factor-sum__range-scale">
                      <Typography as="span" variant="bodySmall" tone="light">0</Typography>
                      <Typography as="span" variant="bodySmall" tone="light">{rawValue} / 10</Typography>
                      <Typography as="span" variant="bodySmall" tone="light">10</Typography>
                    </div>
                  </div>
                </div>

                <div className="ng-three-factor-sum__weight">
                  <Typography variant="bodySmall" tone="muted">w{index + 1}</Typography>
                  <div className="ng-three-factor-sum__weight-meter" style={{ '--ng-weight-level': weight } as CSSProperties}>
                    <span />
                  </div>
                  <Typography as="strong" variant="body" tone="warning">{formatScore(weight)}</Typography>
                  {factor.valueTransform === 'inverse' && <Typography variant="bodySmall" tone="muted">反向</Typography>}
                </div>

                <div className="ng-three-factor-sum__contribution" aria-label={`${factor.name}的加权贡献`}>
                  <Typography variant="bodySmall" tone="muted">贡献</Typography>
                  <Typography as="strong" variant="body" tone="success">{formatScore(contribution)}</Typography>
                </div>
              </article>
            );
          })}
        </section>

        <aside className="ng-three-factor-sum__result" aria-label="加权求和结果">
          <Typography variant="bodySmall" tone="muted">加权求和</Typography>
          <div className="ng-three-factor-sum__sigma">Σ</div>
          <Typography variant="bodySmall" tone="muted">三个因素的加权贡献</Typography>
          <div className="ng-three-factor-sum__total">
            <Typography variant="bodySmall" tone="warning">神经元的总输入</Typography>
            <Typography as="strong" variant="h1" tone="warning">y = {formatScore(output)}</Typography>
          </div>
        </aside>
      </div>

      <section className="ng-three-factor-sum__tip">
        <div className="ng-three-factor-sum__video">
          <video src={teacherVideo} autoPlay loop muted playsInline aria-label="教师提示视频" />
        </div>
        <div className="ng-three-factor-sum__tip-copy">
          <Typography as="strong" variant="h3" tone="accent">你发现了什么？</Typography>
          <Typography as="p" variant="body" tone="muted">
            每个因素都会贡献一部分“推动力”，权重越大，贡献越大。这里的总输入不一定限制在 0～1 之间，它表示所有因素加在一起的强度。
          </Typography>
        </div>
      </section>
    </ContentBlock>
  );
}
