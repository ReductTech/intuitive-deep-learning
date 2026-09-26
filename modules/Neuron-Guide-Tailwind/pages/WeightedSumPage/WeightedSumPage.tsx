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
      className="ngtw-analysis-stage ngtw-weighted-sum"
      title={`把“${factor.name}”翻译成神经元的输入`}
      subtitle={`神经元只能处理数值，所以我们先把“${factor.valueQuestion}”统一转换到 0 ～ 1。`}
    >
      <div className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-[18px] bg-[#fbfdff] px-[26px] py-[6px]" aria-label="从现实回答到神经元输入">
        <div className="mt-[34px] grid min-w-0 grid-cols-[minmax(0,1.42fr)_minmax(48px,.18fr)_minmax(145px,.64fr)_minmax(48px,.18fr)_minmax(240px,1fr)] items-center gap-3 self-start">
          <section className="grid min-h-[300px] min-w-0 content-center gap-6 rounded-[14px] border border-[#d9e4f0] bg-white/85 px-8 pb-[22px] pt-6 shadow-[0_12px_28px_rgba(48,76,113,.08)]" aria-label="现实问题">
            <div className="grid min-w-0 gap-[7px]">
              <Typography as="strong" variant="h3" tone="accent">{factor.valueQuestion}</Typography>
              <Typography variant="bodySmall" tone="light">{factor.explanation}</Typography>
            </div>
            <div className="relative grid min-w-0 gap-[10px]">
              <input
                className="ngtw-weighted-sum__range w-full cursor-ew-resize accent-[#3b5784]"
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
              <div className="grid min-w-0 grid-cols-2 [&_span:last-child]:text-right">
                <Typography as="span" variant="bodySmall" tone="muted">{factor.minDesc}</Typography>
                <Typography as="span" variant="bodySmall" tone="muted">{factor.maxDesc}</Typography>
              </div>
              <div className="grid min-w-0 grid-cols-6 text-center font-mono text-[#8293aa] [&_span:first-child]:text-left [&_span:last-child]:text-right" aria-hidden="true">
                {[0, 2, 4, 6, 8, 10].map((tick) => <span key={tick}>{tick}</span>)}
              </div>
            </div>
          </section>
          <div className="grid place-items-center font-mono text-[46px] font-extrabold text-[#5a76a2]" aria-hidden="true"><span>→</span></div>
          <section className="grid min-h-[188px] min-w-0 justify-items-center gap-4 rounded-[14px] border border-[#d9e4f0] bg-[#f5f9fe] px-4 py-6 text-center shadow-[0_12px_28px_rgba(48,76,113,.08)]" aria-label="统一到 0 到 1">
            <Typography variant="body" tone="accent">统一到 0 ～ 1</Typography>
            <div className="flex flex-wrap items-center justify-center gap-2 text-center font-mono text-[24px] font-extrabold text-[#385576]">
              {isInverse ? '1 − (x₁ ÷ 10)' : 'x₁ ÷ 10'}
            </div>
            {isInverse && (
              <Typography as="span" variant="bodySmall" tone="muted" className="max-w-[180px] text-center">
                这是反向计入：评分越高，代表对当前决定的支持越弱。
              </Typography>
            )}
          </section>
          <div className="grid place-items-center font-mono text-[46px] font-extrabold text-[#5a76a2]" aria-hidden="true"><span>→</span></div>
          <section className="grid min-h-[246px] min-w-0 content-center gap-[18px] rounded-[14px] border border-[#d9e4f0] bg-white/85 px-7 py-6 shadow-[0_12px_28px_rgba(48,76,113,.08)]" aria-label="神经元的输入">
            <Typography variant="h3" tone="accent">神经元的输入</Typography>
            <div className="grid min-h-[86px] place-items-center rounded-[11px] bg-[#e2f2ee]">
              <Typography as="strong" variant="h2" tone="success">x₁ = {normalizedValue.toFixed(2)}</Typography>
            </div>
          </section>
        </div>

        <div className="grid min-h-[128px] min-w-0 grid-cols-[196px_minmax(0,1fr)] items-stretch overflow-hidden rounded-lesson-lg border border-[#e1e1e1] bg-[#f9f9f9]">
          <div className="min-w-0 overflow-hidden bg-[#f9f9f9]"><video className="block h-full w-full object-cover object-[center_24%]" src={teacherVideo} autoPlay loop muted playsInline aria-label="教师提示视频" /></div>
          <div className="grid min-w-0 content-center gap-2 px-[30px] py-[18px]">
            <Typography as="strong" variant="h3" tone="accent">小提示</Typography>
            <Typography as="p" variant="body" tone="muted">无论是 1～5 分、1～10 分，还是“非常低～非常高”，都可以通过简单的转换，变成 0～1 之间的数。这样不同的问题都可以用相同的数值尺度输入到神经元中。</Typography>
          </div>
        </div>
      </div>
    </ContentBlock>
  );
}





