import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useState, type CSSProperties } from 'react';
import { ContentBlock, ExplainPanelButton, RangeControl, Typography } from "@shuku/course-style/react";
import "./ExtraInputsPage.css";
import {
  effectiveInput,
  formatScore,
  normalizedWeight,
  weightedContributions,
  useLesson,
} from '../../LessonContext';

const teacherVideo = moduleAssetUrl('teacher_male_10s_wb.mp4');

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
    <ContentBlock shuku-edit-id="e-f4885d16-8e0b-4622-a353-d0fabf868d06"
      headingLevel={1}
      className="ngtw-multi-stage ngtw-three-factor-sum"
      title={scenario.question}
      subtitle="每个因素先变成输入 x，再乘上对应的重要性 w，最后汇总成神经元的总输入。"
    >
      <div shuku-edit-id="e-b4a8512c-61a2-43cf-b92b-781f408a6ceb" className="grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)_44px_minmax(116px,128px)_44px_minmax(170px,188px)] items-stretch gap-[10px]">
        <section shuku-edit-id="e-12394393-d5eb-474e-972a-f8c3d6b06f76" className="grid min-h-0 min-w-0 grid-rows-[auto_repeat(3,minmax(0,1fr))] gap-[10px]" aria-label="三个影响因素">
          <div shuku-edit-id="e-7b7f2efd-6be3-44ed-8628-8284a62fc826" className="ngtw-three-factor-sum__column-labels grid grid-cols-[minmax(0,1fr)_210px_220px_88px] items-end gap-[18px] px-[14px] pb-[2px]">
            <Typography shuku-edit-id="e-16f252d8-58ac-4139-a60a-1106ce889cc6" variant="bodySmall" tone="muted" aria-hidden="true">现实因素</Typography>
            <Typography shuku-edit-id="e-80135153-991b-43c8-839e-b2d4734ec607" variant="bodySmall" tone="accent" aria-hidden="true">输入</Typography>
            <div shuku-edit-id="e-8bf77c57-0cd6-4d4a-b409-08befb2627fb" className="ngtw-three-factor-sum__weight-label flex min-w-0 items-center justify-center gap-[6px]">
              <Typography shuku-edit-id="e-f5db723b-a98c-45cc-990e-050c5d75603b" variant="bodySmall" tone="muted">权重（重要性）</Typography>
              <ExplainPanelButton label="查看权重（重要性）的说明">
                <Typography shuku-edit-id="e-6d2d8453-c823-4a53-8cea-2c4f7e2964a4" as="strong" variant="bodySmall" tone="accent">权重由 AI 建议</Typography>
                <Typography shuku-edit-id="e-880f0cb4-642f-4701-aac3-8d0ab58211ca" variant="bodySmall" tone="muted">
                  由 AI 根据经验给出，示例里固定不变，不开放修改；你只需要调节左边的输入 x。
                </Typography>
              </ExplainPanelButton>
            </div>
            <Typography shuku-edit-id="e-e1dd61a0-a4a1-4517-a331-c4b65eafe225" variant="bodySmall" tone="muted" aria-hidden="true">贡献</Typography>
          </div>

          {scenario.factors.map((factor, index) => {
            const rawValue = values[index];
            const input = effectiveInput(factor, rawValue);
            const weight = normalizedWeight(factor.suggestedImportance);
            const contribution = contributions[index];
            const isUnlocked = index <= guidedIndex;
            const isGuiding = index === guidedIndex;

            return (
              <article shuku-edit-id="e-65ae0c95-ee8a-41f0-8ad2-395f7bf1be4f" className="grid min-w-0 grid-cols-[minmax(0,1fr)_210px_220px_88px] items-center gap-[18px] rounded-lesson-md border border-[#e1e8f0] bg-lesson-card px-[14px] py-3 shadow-[0_7px_18px_rgba(44,70,105,.06)]" key={`${factor.name}-${index}`}>
                <div shuku-edit-id="e-ffc2e9a2-321d-4214-b9e0-9962c2551743" className="grid min-w-0 grid-cols-[48px_minmax(0,1fr)] items-center gap-[10px]">
                  <Typography shuku-edit-id="e-a6b11a40-d720-4aa3-89ce-ca14ed43f44f" as="span" variant="h3" tone="muted" wrap="nowrap" className="grid h-[44px] w-[44px] place-items-center rounded-lesson-sm bg-[#f1f5fa]">0{index + 1}</Typography>
                  <div shuku-edit-id="e-9b26f022-44b2-49cf-86d0-8ee484b5e171" className="grid min-w-0 gap-[2px]">
                    <div shuku-edit-id="e-6072b176-4cde-4e6d-9df3-a347fe637188" className="ngtw-three-factor-sum__factor-title flex min-w-0 items-center gap-2">
                      <Typography shuku-edit-id="e-08d4e6d2-f852-47ea-89fb-e6f66f067843" as="h3" variant="body" tone="accent">{factor.name}</Typography>
                      <ExplainPanelButton label={`查看${factor.name}的说明`}>
                        <Typography shuku-edit-id="e-1e5dd429-d458-4163-8ea7-1a018aa6192b" as="strong" variant="bodySmall" tone="accent">{factor.valueQuestion}</Typography>
                        <Typography shuku-edit-id="e-27414f38-ffc6-47b3-ab24-4c6db2ef8c69" variant="bodySmall" tone="muted">{factor.explanation}</Typography>
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

                <div shuku-edit-id="e-46b6fe07-a681-49ae-9cbd-dd5b1339027d" className="grid justify-items-end gap-px border-l border-[#e4ebf2] pl-3" aria-label={`${factor.name}的加权贡献`}>
                  <Typography shuku-edit-id="e-3edc7466-4bb1-4930-a7c5-6a76defaf407" variant="bodySmall" tone="muted">贡献</Typography>
                  <Typography shuku-edit-id="e-0130de5c-403a-436e-a95d-a13cfac06768" as="strong" variant="body" tone="success">{formatScore(contribution)}</Typography>
                </div>
              </article>
            );
          })}
        </section>

        <div shuku-edit-id="e-911f2e1a-37c2-4b0c-9516-b3debe9a6e2b" className="grid min-w-0 place-items-center font-mono text-[34px] font-extrabold text-[#5a76a2]" aria-hidden="true">→</div>

        <aside shuku-edit-id="e-7b2bfa4b-e2af-417b-be61-0f46959d03cc" className="grid min-h-0 min-w-0 content-center justify-items-center gap-2 p-4 text-center" aria-label="加权求和">
          <Typography shuku-edit-id="e-2f0a1b54-f018-420c-8f9c-20b116582c13" variant="bodySmall" tone="muted">加权求和</Typography>
          <div shuku-edit-id="e-5cc35433-d8f4-4776-b550-960c21e269b7" className="grid h-[76px] w-[76px] place-items-center rounded-full bg-[#e58b4e] font-[Georgia] text-[48px] font-bold text-white shadow-[0_10px_20px_rgba(196,105,48,.18)]">Σ</div>
        </aside>

        <div shuku-edit-id="e-23cb9a34-a027-4b5b-9568-1f19841ffe18" className="grid min-w-0 place-items-center font-mono text-[34px] font-extrabold text-[#5a76a2]" aria-hidden="true">→</div>

        <aside shuku-edit-id="e-c9858851-724f-4e31-8462-79555204bfdf" className="grid min-h-0 min-w-0 content-center justify-items-center gap-2 p-4 text-center" aria-label="神经元的总输入">
          <div shuku-edit-id="e-ee83530e-8950-444d-b730-5f1c586db72e" className="grid w-full gap-[5px] rounded-[10px] bg-[#fff0ec] px-[10px] py-[14px] text-center">
            <Typography shuku-edit-id="e-f61c5295-4b17-43d2-b108-0a08c0afee5a" variant="body" tone="warning">输出 y</Typography>
            <Typography shuku-edit-id="e-91a8eb13-4843-46b6-8130-0abab2073d62" as="strong" variant="h1" tone="warning">= {formatScore(output)}</Typography>
          </div>
        </aside>
      </div>

      <section shuku-edit-id="e-02413b56-990a-459a-85d7-fe5328111564" className="grid min-h-[124px] min-w-0 grid-cols-[180px_minmax(0,1fr)] items-stretch overflow-hidden rounded-[16px] border border-[#e1e1e1] bg-[#f9f9f9]">
        <div shuku-edit-id="e-171cc3ca-9bb1-467f-91f2-d2e4b1115b98" className="min-w-0 overflow-hidden bg-[#f9f9f9]">
          <video shuku-edit-id="e-d8c066f9-b903-4fc1-aa44-d785fc65561b" className="block h-full w-full object-cover object-[center_22%]" src={teacherVideo} autoPlay loop muted playsInline aria-label="教师提示视频" />
        </div>
        <div shuku-edit-id="e-04dc94ae-01a8-41ef-8645-e77bb6f56d45" className="grid min-w-0 content-center gap-[6px] px-[26px] py-4 [&_p]:w-full [&_p]:max-w-none [&_p]:[overflow-wrap:anywhere]">
          <Typography shuku-edit-id="e-7607a515-7fea-4776-ac93-0f65e08d0d43" as="strong" variant="h3" tone="accent">你发现了什么？</Typography>
          <Typography shuku-edit-id="e-21455e69-3577-4a89-88d3-f00a30099255" as="p" variant="body" tone="muted">
            每个因素都会贡献一部分“推动力”，权重越大，贡献越大。这里的总输入不一定限制在 0～1 之间，它表示所有因素加在一起的强度。
          </Typography>
        </div>
      </section>
    </ContentBlock>
  );
}



