import { ContentBlock, ExplainPanelButton, RangeControl, Typography } from '../../../shared/react';
import "./ExtraInputsPage.css";
import {
  effectiveInput,
  formatScore,
  normalizedWeight,
  weightedContributions,
  useLesson,
} from '../../LessonContext';
import teacherVideo from '../../assets/teacher_male_10s_wb.mp4';

const subscripts = ['₁', '₂', '₃'] as const;

export interface ExtraInputsPageProps {
  onComplete: () => void;
}

export function ExtraInputsPage({ onComplete }: ExtraInputsPageProps) {
  const { state, scenario, setValueDraft, commitValues } = useLesson();
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
      title={scenario.question}
      subtitle="每个因素先变成输入 x，再乘上对应的重要性 w，最后汇总成神经元的总输入。"
    >
      <div className="ng-three-factor-sum__layout">
        <section className="ng-three-factor-sum__factor-list" aria-label="三个影响因素">
          <div className="ng-three-factor-sum__column-labels" aria-hidden="true">
            <Typography variant="bodySmall" tone="muted">现实因素</Typography>
            <Typography variant="bodySmall" tone="accent">输入</Typography>
            <Typography variant="bodySmall" tone="muted">权重（重要性）</Typography>
            <Typography variant="bodySmall" tone="muted">贡献</Typography>
          </div>

          {scenario.factors.map((factor, index) => {
            const rawValue = values[index];
            const input = effectiveInput(factor, rawValue);
            const weight = normalizedWeight(factor.suggestedImportance);
            const contribution = contributions[index];

            return (
              <article className="ng-three-factor-sum__factor-row" key={`${factor.name}-${index}`}>
                <div className="ng-three-factor-sum__factor-info">
                  <Typography as="span" variant="h3" tone="muted" wrap="nowrap" className="ng-three-factor-sum__factor-number">0{index + 1}</Typography>
                  <div className="ng-three-factor-sum__factor-copy">
                    <div className="ng-three-factor-sum__factor-title">
                      <Typography as="h3" variant="body" tone="accent">{factor.name}</Typography>
                      <ExplainPanelButton label={`查看${factor.name}的说明`}>
                        <Typography as="strong" variant="bodySmall" tone="accent">{factor.valueQuestion}</Typography>
                        <Typography variant="bodySmall" tone="muted">{factor.explanation}</Typography>
                      </ExplainPanelButton>
                    </div>
                  </div>
                </div>

                <RangeControl
                  label={`输入 x${subscripts[index]}`}
                  value={rawValue}
                  min={0}
                  max={10}
                  step={1}
                  discrete
                  scale={['0', '5 / 10', '10']}
                  formatValue={() => formatScore(input)}
                  hint={index === 0}
                  controlClassName="ng-three-factor-sum__factor-control"
                  aria-label={`${factor.name}，当前评分 ${rawValue} / 10`}
                  onChange={(event) => {
                    setValueDraft(index, Number(event.currentTarget.value));
                    commitValue();
                  }}
                />

                <RangeControl
                  label={`w${subscripts[index]}`}
                  value={weight}
                  min={0}
                  max={1}
                  step={0.1}
                  discrete
                  scale={['0', '0.5', '1']}
                  digits={1}
                  disabled
                  controlClassName="ng-three-factor-sum__weight-control"
                  aria-label={`${factor.name}的权重 ${formatScore(weight)}`}
                />

                <div className="ng-three-factor-sum__contribution" aria-label={`${factor.name}的加权贡献`}>
                  <Typography variant="bodySmall" tone="muted">贡献</Typography>
                  <Typography as="strong" variant="body" tone="success">{formatScore(contribution)}</Typography>
                </div>
              </article>
            );
          })}
        </section>

        <div className="ng-three-factor-sum__connector" aria-hidden="true">→</div>

        <aside className="ng-three-factor-sum__result" aria-label="加权求和">
          <Typography variant="bodySmall" tone="muted">加权求和</Typography>
          <div className="ng-three-factor-sum__sigma">Σ</div>
        </aside>

        <div className="ng-three-factor-sum__connector" aria-hidden="true">→</div>

        <aside className="ng-three-factor-sum__output" aria-label="神经元的总输入">
          <div className="ng-three-factor-sum__total">
            <Typography variant="body" tone="warning">输出 y</Typography>
            <Typography as="strong" variant="h1" tone="warning">= {formatScore(output)}</Typography>
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
