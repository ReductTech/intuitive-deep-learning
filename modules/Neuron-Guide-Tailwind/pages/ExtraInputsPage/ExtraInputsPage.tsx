import { useState, type CSSProperties } from 'react';
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
  // 逐个引导：先调完 x₁，再轮到 x₂、x₃；三个都碰过以后权重列才点亮。
  const [guidedIndex, setGuidedIndex] = useState(0);
  const weightsLit = guidedIndex >= scenario.factors.length;

  const advanceGuide = (index: number) => {
    setGuidedIndex((current) => (
      index === current ? Math.min(index + 1, scenario.factors.length) : current
    ));
  };

  const commitValue = () => {
    commitValues();
    onComplete();
  };

  return (
    <ContentBlock
      headingLevel={1}
      className="ngtw-multi-stage ngtw-three-factor-sum"
      title={scenario.question}
      subtitle="每个因素先变成输入 x，再乘上对应的重要性 w，最后汇总成神经元的总输入。"
    >
      <div className="grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)_44px_minmax(116px,128px)_44px_minmax(170px,188px)] items-stretch gap-[10px]">
        <section className="grid min-h-0 min-w-0 grid-rows-[auto_repeat(3,minmax(0,1fr))] gap-[10px]" aria-label="三个影响因素">
          <div className="ngtw-three-factor-sum__column-labels grid grid-cols-[minmax(0,1fr)_210px_220px_88px] items-end gap-[18px] px-[14px] pb-[2px]">
            <Typography variant="bodySmall" tone="muted" aria-hidden="true">现实因素</Typography>
            <Typography variant="bodySmall" tone="accent" aria-hidden="true">输入</Typography>
            <div className="ngtw-three-factor-sum__weight-label flex min-w-0 items-center justify-center gap-[6px]">
              <Typography variant="bodySmall" tone="muted">权重（重要性）</Typography>
              <ExplainPanelButton label="查看权重（重要性）的说明">
                <Typography as="strong" variant="bodySmall" tone="accent">权重由 AI 建议</Typography>
                <Typography variant="bodySmall" tone="muted">
                  由 AI 根据经验给出，示例里固定不变，不开放修改；你只需要调节左边的输入 x。
                </Typography>
              </ExplainPanelButton>
            </div>
            <Typography variant="bodySmall" tone="muted" aria-hidden="true">贡献</Typography>
          </div>

          {scenario.factors.map((factor, index) => {
            const rawValue = values[index];
            const input = effectiveInput(factor, rawValue);
            const weight = normalizedWeight(factor.suggestedImportance);
            const contribution = contributions[index];
            const isUnlocked = index <= guidedIndex;
            const isGuiding = index === guidedIndex;

            return (
              <article className="grid min-w-0 grid-cols-[minmax(0,1fr)_210px_220px_88px] items-center gap-[18px] rounded-lesson-md border border-[#e1e8f0] bg-lesson-card px-[14px] py-3 shadow-[0_7px_18px_rgba(44,70,105,.06)]" key={`${factor.name}-${index}`}>
                <div className="grid min-w-0 grid-cols-[48px_minmax(0,1fr)] items-center gap-[10px]">
                  <Typography as="span" variant="h3" tone="muted" wrap="nowrap" className="grid h-[44px] w-[44px] place-items-center rounded-lesson-sm bg-[#f1f5fa]">0{index + 1}</Typography>
                  <div className="grid min-w-0 gap-[2px]">
                    <div className="ngtw-three-factor-sum__factor-title flex min-w-0 items-center gap-2">
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
                  disabled={!isUnlocked}
                  controlClassName={`ngtw-three-factor-sum__factor-control grid min-w-0 gap-[3px]${isUnlocked ? '' : ' is-pending'}${isGuiding ? ' is-guiding edu-attention-hint' : ''}`}
                  aria-label={`${factor.name}，当前评分 ${rawValue} / 10`}
                  onPointerEnter={() => advanceGuide(index)}
                  onFocus={() => advanceGuide(index)}
                  onChange={(event) => {
                    advanceGuide(index);
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
                  style={{ '--weight-ratio': String(weight) } as CSSProperties}
                  controlClassName={`ngtw-three-factor-sum__weight-control${weightsLit ? ' is-lit' : ''}`}
                  aria-label={`${factor.name}的权重 ${formatScore(weight)}`}
                />

                <div className="grid justify-items-end gap-px border-l border-[#e4ebf2] pl-3" aria-label={`${factor.name}的加权贡献`}>
                  <Typography variant="bodySmall" tone="muted">贡献</Typography>
                  <Typography as="strong" variant="body" tone="success">{formatScore(contribution)}</Typography>
                </div>
              </article>
            );
          })}
        </section>

        <div className="grid min-w-0 place-items-center font-mono text-[34px] font-extrabold text-[#5a76a2]" aria-hidden="true">→</div>

        <aside className="grid min-h-0 min-w-0 content-center justify-items-center gap-2 p-4 text-center" aria-label="加权求和">
          <Typography variant="bodySmall" tone="muted">加权求和</Typography>
          <div className="grid h-[76px] w-[76px] place-items-center rounded-full bg-[#e58b4e] font-[Georgia] text-[48px] font-bold text-white shadow-[0_10px_20px_rgba(196,105,48,.18)]">Σ</div>
        </aside>

        <div className="grid min-w-0 place-items-center font-mono text-[34px] font-extrabold text-[#5a76a2]" aria-hidden="true">→</div>

        <aside className="grid min-h-0 min-w-0 content-center justify-items-center gap-2 p-4 text-center" aria-label="神经元的总输入">
          <div className="grid w-full gap-[5px] rounded-[10px] bg-[#fff0ec] px-[10px] py-[14px] text-center">
            <Typography variant="body" tone="warning">输出 y</Typography>
            <Typography as="strong" variant="h1" tone="warning">= {formatScore(output)}</Typography>
          </div>
        </aside>
      </div>

      <section className="grid min-h-[124px] min-w-0 grid-cols-[180px_minmax(0,1fr)] items-stretch overflow-hidden rounded-[16px] border border-[#e1e1e1] bg-[#f9f9f9]">
        <div className="min-w-0 overflow-hidden bg-[#f9f9f9]">
          <video className="block h-full w-full object-cover object-[center_22%]" src={teacherVideo} autoPlay loop muted playsInline aria-label="教师提示视频" />
        </div>
        <div className="grid min-w-0 content-center gap-[6px] px-[26px] py-4 [&_p]:w-full [&_p]:max-w-none [&_p]:[overflow-wrap:anywhere]">
          <Typography as="strong" variant="h3" tone="accent">你发现了什么？</Typography>
          <Typography as="p" variant="body" tone="muted">
            每个因素都会贡献一部分“推动力”，权重越大，贡献越大。这里的总输入不一定限制在 0～1 之间，它表示所有因素加在一起的强度。
          </Typography>
        </div>
      </section>
    </ContentBlock>
  );
}



