import { useRecordedData, examplePrediction } from '../../regressionData';
import { useEffect, useMemo, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import '../MaePage/MaePage.css';
import '../MaePage/MergedMaePage.css';
import { MergedAbsoluteErrorPlot, type MaeStage } from '../MaePage/MergedAbsoluteErrorPlot';

const steps = [
  { title: '计算残差', formula: 'e_i=y_i-\\hat{y}_i', heading: '先看每一次预测差了多少', description: '观测减预测：正值表示低估，负值表示高估。' },
  { title: '平方', formula: 'e_i^2=(y_i-\\hat{y}_i)^2', heading: '让大偏差承担更高代价', description: '残差平方后非负，较大的偏差会被更强地惩罚。' },
  { title: '求平均', formula: '\\mathrm{MSE}=\\frac{1}{n}\\sum_{i=1}^{n}e_i^2', heading: '把平方误差汇成一个平均值', description: '平方误差相加，再除以记录数，得到 MSE。' },
];

export function MsePage() {
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
  if (!n) return <ContentBlock shuku-edit-id="e-836d7e0e-f943-4746-9d2a-6df2e5b252ab" title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock shuku-edit-id="e-fbce4c07-590c-4832-b29d-7dca4a6c4423" headingLevel={1} title="均方误差（MSE）" subtitle="对每个残差平方，再求平均，较大的偏差会带来更高的损失。" className="rl-mae-page rl-mae-merged-page">
    <div shuku-edit-id="e-7eb8efc5-86e6-4f33-8f46-99e4f09383ca" className="rl-mae-merged-layout">
      <aside shuku-edit-id="e-a5c08a9f-63c6-4ed5-8a52-7de82eefa17c" className="rl-mae-merged-side" aria-label="点击切换MSE计算阶段">
        <div shuku-edit-id="e-48a86dfc-66d7-4c0f-8047-b1b098cec06f" className="rl-mae-merged-steps">{steps.map((step, index) => <button shuku-edit-id="e-aa798712-d5ef-490c-b660-f85d896e361f" key={step.title} type="button" className={`rl-mae-merged-step${stage === index ? ' is-current' : ''}`} aria-pressed={stage === index} onClick={() => chooseStage(index as MaeStage)}><div shuku-edit-id="e-f8298475-216f-415d-b98a-b6646f01a5d5" className="rl-mae-merged-step-head"><span shuku-edit-id="e-86c6a02c-b5fe-460b-bf32-2b6493243133" className="rl-mae-step-number"><Typography shuku-edit-id="e-50fad369-fb67-4a1c-949e-4cfcc88d145c" variant="h3" tone="inherit">{index + 1}</Typography></span><Typography shuku-edit-id="e-807eae50-593d-4eae-978b-6cf556410759" variant="h3" tone="accent">{step.title}</Typography><svg shuku-edit-id="e-6f2ce9a2-d936-4398-a788-a8066a9b76ff" className="rl-mae-stage-play" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><path shuku-edit-id="e-d3989d8f-4692-4aea-98e1-8c8ac44a3c7f" d="m8 4 12 8-12 8Z" /></svg></div><MathFormulaBlock appearance="plain"><MathFormulaStatic latex={step.formula} /></MathFormulaBlock></button>)}</div>
      </aside>
      <section shuku-edit-id="e-478fd0c0-270e-4f9c-a5a2-bfc4b2657151" className="rl-mae-merged-main" aria-label="残差形成、平方与求平均的动态演示">
        <header shuku-edit-id="e-5f6ad5fa-0f36-4c4d-bd04-f3d467e7126d" className="rl-mae-merged-heading">
          <div shuku-edit-id="e-a810e8ea-6719-44ea-a7b4-82623534466c" className="rl-mae-merged-copy" aria-live="polite"><Typography shuku-edit-id="e-408956a3-2fed-4d25-a9b7-5ce40984d164" variant="h3" tone="accent">{steps[stage].heading}</Typography><Typography shuku-edit-id="e-49286af4-5615-40cd-ae49-7515c2d873e3" variant="bodySmall" tone="muted">{steps[stage].description}</Typography></div>
          <div shuku-edit-id="e-053137fb-dfc4-41ac-9deb-28eaa0e923ba" className="rl-mae-merged-legend" aria-label="按原始残差的符号着色"><span shuku-edit-id="e-6092d276-3cf2-4cfa-a7e8-dcb454002936"><i shuku-edit-id="e-d4c3e4d3-2013-4e7e-93e5-b6cca883819f" className="is-negative" />原本为负</span><span shuku-edit-id="e-e728f074-8726-482a-bd3a-52f5efdb9e83"><i shuku-edit-id="e-dd20269a-6ef2-4ff0-be49-8ac1be75acb2" className="is-positive" />原本为正</span></div>
        </header>
        <MergedAbsoluteErrorPlot loss="squared" errors={errors} stage={stage} replay={replay} onAnimationComplete={() => setCompletedRun(run)} onInteraction={() => setAuto(false)} />
      </section>
      <div shuku-edit-id="e-91321d28-e7a0-471c-b183-28f5ded6b3d4" className="rl-mae-takeaway"><Typography shuku-edit-id="e-30502768-f343-4390-bdfb-b5e3305f4abc" variant="body" tone="accent">MSE 对较大偏差更敏感，偏差越大，平方后的损失增长越快。</Typography></div>
    </div>
  </ContentBlock>;
}
