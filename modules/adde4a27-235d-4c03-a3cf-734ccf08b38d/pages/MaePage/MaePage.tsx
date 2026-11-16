import { useRecordedData, examplePrediction } from '../../regressionData';
import { useEffect, useMemo, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './MaePage.css';
import './MergedMaePage.css';
import { MergedAbsoluteErrorPlot, type MaeStage } from './MergedAbsoluteErrorPlot';

const steps = [
  { title: '计算残差', formula: 'e_i=y_i-\\hat{y}_i', heading: '先看每一次预测差了多少', description: '观测减预测：正值表示低估，负值表示高估。' },
  { title: '取绝对值', formula: '|e_i|=|y_i-\\hat{y}_i|', heading: '让偏差不再相互抵消', description: '负残差向上翻转，保留每次偏差的大小。' },
  { title: '求平均', formula: '\\mathrm{MAE}=\\frac{1}{n}\\sum_{i=1}^{n}|e_i|', heading: '用一个平均值概括整体偏差', description: '绝对误差相加，再除以记录数，得到 MAE。' },
];

export function MaePage() {
  const data = useRecordedData();
  const errors = useMemo(() => data.map(point => point.depth - examplePrediction(point.mass)), [data]);
  const n = errors.length;
  const [stage, setStage] = useState<MaeStage>(0);
  const [auto, setAuto] = useState(true);
  const [replay, setReplay] = useState(0);
  const [completedRun, setCompletedRun] = useState<string | null>(null);
  const run = `${stage}:${replay}`;
  useEffect(() => {
    if (!auto || completedRun !== run) return;
    const timer = window.setTimeout(() => {
      setCompletedRun(null);
      setStage(value => ((value + 1) % 3) as MaeStage);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [auto, completedRun, run]);
  const chooseStage = (value: MaeStage) => {
    setAuto(false);
    setCompletedRun(null);
    setStage(value);
    setReplay(count => count + 1);
  };
  if (!n) return <ContentBlock shuku-edit-id="e-6400fac7-59fa-4069-b809-1d98f3b9f0ca" title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock shuku-edit-id="e-8e5dae19-d8eb-4c6b-bd8b-0daa4707db72" headingLevel={1} title="平均绝对误差（MAE）" subtitle="对每个残差取绝对值，再求平均，衡量预测的平均偏差大小。" className="rl-mae-page rl-mae-merged-page">
    <div shuku-edit-id="e-bf6c1dad-9d90-4c18-99c7-5476eaeb46a6" className="rl-mae-merged-layout">
      <aside shuku-edit-id="e-52861ede-a470-43a8-98b4-0b7befe24422" className="rl-mae-merged-side" aria-label="点击切换MAE计算阶段">
        <div shuku-edit-id="e-f9546ae6-ee93-44bc-bcd7-a2c8b8c8792b" className="rl-mae-merged-steps">{steps.map((step, index) => <button shuku-edit-id="e-a243ff5a-d9a9-4926-94c7-66146c459e1f" key={step.title} type="button" className={`rl-mae-merged-step${stage === index ? ' is-current' : ''}`} aria-pressed={stage === index} onClick={() => chooseStage(index as MaeStage)}><div shuku-edit-id="e-ed34a77f-f313-4902-a525-c48d7a3eeaa4" className="rl-mae-merged-step-head"><span shuku-edit-id="e-f9358e6f-8a2c-4f81-bc20-f285060ec08b" className="rl-mae-step-number"><Typography shuku-edit-id="e-6d45dcaf-e869-4c20-b6cb-2925a79d235f" variant="h3" tone="inherit">{index + 1}</Typography></span><Typography shuku-edit-id="e-f921d9b9-25ec-475d-925a-7cef3f73a72d" variant="h3" tone="accent">{step.title}</Typography><svg shuku-edit-id="e-ea1370b0-fd6c-4c9b-afff-f3e7e84c2ea6" className="rl-mae-stage-play" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><path shuku-edit-id="e-329b2110-373c-47b9-b054-5b411e9f5729" d="m8 4 12 8-12 8Z" /></svg></div><MathFormulaBlock appearance="plain"><MathFormulaStatic latex={step.formula} /></MathFormulaBlock></button>)}</div>
      </aside>
      <section shuku-edit-id="e-54dbc64d-bcff-44cb-a6fe-ef8e1081931f" className="rl-mae-merged-main" aria-label="残差形成、取绝对值与求平均的动态演示">
        <header shuku-edit-id="e-aeeff85f-a697-495a-9961-e3ac68eff345" className="rl-mae-merged-heading">
          <div shuku-edit-id="e-a9850301-3bbf-41a1-86ed-18db974eae27" className="rl-mae-merged-copy" aria-live="polite"><Typography shuku-edit-id="e-e1141028-c2a2-4e1f-b7ef-247e7f02c337" variant="h3" tone="accent">{steps[stage].heading}</Typography><Typography shuku-edit-id="e-6b8d3e0a-c50c-4ca4-9123-2b46e13480c9" variant="bodySmall" tone="muted">{steps[stage].description}</Typography></div>
          <div shuku-edit-id="e-1df18fa9-5eaf-4c82-a59b-d3c04bc30b85" className="rl-mae-merged-legend" aria-label="按原始残差的符号着色"><span shuku-edit-id="e-2d94434b-1624-44fb-98e7-8d3168dd10a7"><i shuku-edit-id="e-c8c9f19a-ad75-43c8-aadd-0e85cbe45f44" className="is-negative" />原本为负</span><span shuku-edit-id="e-3670a484-d543-4271-8551-85f168d21e4b"><i shuku-edit-id="e-1e46fb74-ccd4-43a3-b9b7-6ec83e06b807" className="is-positive" />原本为正</span></div>
        </header>
        <MergedAbsoluteErrorPlot errors={errors} stage={stage} replay={replay} onAnimationComplete={() => setCompletedRun(run)} onInteraction={() => setAuto(false)} />
      </section>
      <div shuku-edit-id="e-dd435311-53cc-44c4-a6c7-83a2beee0dcc" className="rl-mae-takeaway"><Typography shuku-edit-id="e-57b765d8-72a7-4360-aee0-7190e199932e" variant="body" tone="accent">MAE 不区分高估与低估，衡量平均每次偏差的大小。</Typography></div>
    </div>
  </ContentBlock>;
}
