import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import "./WeightedSumPage.css";
import { effectiveInput, useLesson } from '../../LessonContext';

const teacherVideo = moduleAssetUrl('teacher_female_10s_wb.mp4');

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
    <ContentBlock shuku-edit-id="e-dc64495b-5ecc-4ac6-a4ef-2235b1f0cd03"
      headingLevel={1}
      className="ngtw-analysis-stage ngtw-weighted-sum"
      title={`把“${factor.name}”翻译成神经元的输入`}
      subtitle={`神经元只能处理数值，所以我们先把“${factor.valueQuestion}”统一转换到 0 ～ 1。`}
    >
      <div shuku-edit-id="e-1409ad18-ef6c-4ada-ac0f-ea71c1598efa" className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-[18px] bg-[#fbfdff] px-[26px] py-[6px]" aria-label="从现实回答到神经元输入">
        <div shuku-edit-id="e-3c1d4690-3b34-4b2a-ad27-670b35f0ded1" className="mt-[34px] grid min-w-0 grid-cols-[minmax(0,1.42fr)_minmax(48px,.18fr)_minmax(145px,.64fr)_minmax(48px,.18fr)_minmax(240px,1fr)] items-center gap-3 self-start">
          <section shuku-edit-id="e-4d888a13-af88-4525-a4f9-77ae51eaa0a6" className="grid min-h-[300px] min-w-0 content-center gap-6 rounded-[14px] border border-[#d9e4f0] bg-white/85 px-8 pb-[22px] pt-6 shadow-[0_12px_28px_rgba(48,76,113,.08)]" aria-label="现实问题">
            <div shuku-edit-id="e-16f0c090-e5f9-4486-a54d-7396bde0eee7" className="grid min-w-0 gap-[7px]">
              <Typography shuku-edit-id="e-b743460a-caa6-4ef3-9b02-658d0f6f86a6" as="strong" variant="h3" tone="accent">{factor.valueQuestion}</Typography>
              <Typography shuku-edit-id="e-e3687064-f755-43aa-a0b0-f972cda64df2" variant="bodySmall" tone="light">{factor.explanation}</Typography>
            </div>
            <div shuku-edit-id="e-e0ae10dc-de42-4449-b428-93d48aed8246" className="relative grid min-w-0 gap-[10px]">
              <input shuku-edit-id="e-39a3f6a0-abf5-4413-a4ef-8a79d67db834"
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
              <div shuku-edit-id="e-4d046297-5b75-496c-9000-12e070e3af31" className="grid min-w-0 grid-cols-2 [&_span:last-child]:text-right">
                <Typography shuku-edit-id="e-cd3a7e12-f2dc-4862-ad12-ba74d97a2005" as="span" variant="bodySmall" tone="muted">{factor.minDesc}</Typography>
                <Typography shuku-edit-id="e-86593c87-d649-42df-94d8-1c264ced51c1" as="span" variant="bodySmall" tone="muted">{factor.maxDesc}</Typography>
              </div>
              <div shuku-edit-id="e-32d9eedb-50fb-4c62-ad44-369a2efa5ad1" className="grid min-w-0 grid-cols-6 text-center font-mono text-[#8293aa] [&_span:first-child]:text-left [&_span:last-child]:text-right" aria-hidden="true">
                {[0, 2, 4, 6, 8, 10].map((tick) => <span shuku-edit-id="e-504aa774-285e-49ad-8021-146c115397b7" key={tick}>{tick}</span>)}
              </div>
            </div>
          </section>
          <div shuku-edit-id="e-5cf695ca-7b3d-44a7-b7f1-1b9303f7bc7e" className="grid place-items-center font-mono text-[46px] font-extrabold text-[#5a76a2]" aria-hidden="true"><span shuku-edit-id="e-bbbb73f1-a071-4fa3-af30-35dc8d21b2a6">→</span></div>
          <section shuku-edit-id="e-3e99dd66-162d-49b4-a9a0-6c6a53dc269a" className="grid min-h-[188px] min-w-0 justify-items-center gap-4 rounded-[14px] border border-[#d9e4f0] bg-[#f5f9fe] px-4 py-6 text-center shadow-[0_12px_28px_rgba(48,76,113,.08)]" aria-label="统一到 0 到 1">
            <Typography shuku-edit-id="e-c32a4ffd-31e9-4275-af9e-58567ba1739e" variant="body" tone="accent">统一到 0 ～ 1</Typography>
            <div shuku-edit-id="e-7767740e-4fb9-4a25-8158-275e29f05401" className="flex flex-wrap items-center justify-center gap-2 text-center font-mono text-[24px] font-extrabold text-[#385576]">
              {isInverse ? '1 − (x₁ ÷ 10)' : 'x₁ ÷ 10'}
            </div>
            {isInverse && (
              <Typography shuku-edit-id="e-5b67ca62-1905-4c63-8fbc-ea7cef613c29" as="span" variant="bodySmall" tone="muted" className="max-w-[180px] text-center">
                这是反向计入：评分越高，代表对当前决定的支持越弱。
              </Typography>
            )}
          </section>
          <div shuku-edit-id="e-639206b1-b071-48c0-97d8-39920f1847fc" className="grid place-items-center font-mono text-[46px] font-extrabold text-[#5a76a2]" aria-hidden="true"><span shuku-edit-id="e-03516e9d-631e-484e-ad26-fc75ed91ce82">→</span></div>
          <section shuku-edit-id="e-f5c29d5b-4614-4e64-88e8-53b29aa34367" className="grid min-h-[246px] min-w-0 content-center gap-[18px] rounded-[14px] border border-[#d9e4f0] bg-white/85 px-7 py-6 shadow-[0_12px_28px_rgba(48,76,113,.08)]" aria-label="神经元的输入">
            <Typography shuku-edit-id="e-5f25a790-ff2c-4f58-8bb2-fed5c207c9e1" variant="h3" tone="accent">神经元的输入</Typography>
            <div shuku-edit-id="e-e3e541a9-ff50-4c0d-965d-882e1ff2f310" className="grid min-h-[86px] place-items-center rounded-[11px] bg-[#e2f2ee]">
              <Typography shuku-edit-id="e-e2372e4f-028b-4d34-94b3-c74f86c58b02" as="strong" variant="h2" tone="success">x₁ = {normalizedValue.toFixed(2)}</Typography>
            </div>
          </section>
        </div>

        <div shuku-edit-id="e-42144a0c-e92c-48a8-b1a1-162083ea018e" className="grid min-h-[128px] min-w-0 grid-cols-[196px_minmax(0,1fr)] items-stretch overflow-hidden rounded-lesson-lg border border-[#e1e1e1] bg-[#f9f9f9]">
          <div shuku-edit-id="e-7b72baa1-cdeb-4e09-af9a-cc59453f6808" className="min-w-0 overflow-hidden bg-[#f9f9f9]"><video shuku-edit-id="e-423996cb-21a9-4cd5-b884-dee2ff7a782f" className="block h-full w-full object-cover object-[center_24%]" src={teacherVideo} autoPlay loop muted playsInline aria-label="教师提示视频" /></div>
          <div shuku-edit-id="e-23c6bdbf-7ae2-4194-b148-df125e8b094d" className="grid min-w-0 content-center gap-2 px-[30px] py-[18px]">
            <Typography shuku-edit-id="e-1e048b2f-33f2-42b2-9f05-68ed31c3298f" as="strong" variant="h3" tone="accent">小提示</Typography>
            <Typography shuku-edit-id="e-53bf54d8-b3c1-4906-bd60-83f71428c71d" as="p" variant="body" tone="muted">无论是 1～5 分、1～10 分，还是“非常低～非常高”，都可以通过简单的转换，变成 0～1 之间的数。这样不同的问题都可以用相同的数值尺度输入到神经元中。</Typography>
          </div>
        </div>
      </div>
    </ContentBlock>
  );
}





