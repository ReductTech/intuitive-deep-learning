import { useRecordedData, examplePrediction } from '../../regressionData';
import { useEffect, useMemo, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
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
  if (!n) return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock headingLevel={1} title="均方误差（MSE）" subtitle="对每个残差平方，再求平均，较大的偏差会带来更高的损失。" className="rl-mae-page rl-mae-merged-page">
    <div className="rl-mae-merged-layout">
      <aside className="rl-mae-merged-side" aria-label="点击切换MSE计算阶段">
        <div className="rl-mae-merged-steps">{steps.map((step, index) => <button key={step.title} type="button" className={`rl-mae-merged-step${stage === index ? ' is-current' : ''}`} aria-pressed={stage === index} onClick={() => chooseStage(index as MaeStage)}><div className="rl-mae-merged-step-head"><span className="rl-mae-step-number"><Typography variant="h3" tone="inherit">{index + 1}</Typography></span><Typography variant="h3" tone="accent">{step.title}</Typography><svg className="rl-mae-stage-play" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><path d="m8 4 12 8-12 8Z" /></svg></div><MathFormulaBlock appearance="plain"><MathFormulaStatic latex={step.formula} /></MathFormulaBlock></button>)}</div>
      </aside>
      <section className="rl-mae-merged-main" aria-label="残差形成、平方与求平均的动态演示">
        <header className="rl-mae-merged-heading">
          <div className="rl-mae-merged-copy" aria-live="polite"><Typography variant="h3" tone="accent">{steps[stage].heading}</Typography><Typography variant="bodySmall" tone="muted">{steps[stage].description}</Typography></div>
          <div className="rl-mae-merged-legend" aria-label="按原始残差的符号着色"><span><i className="is-negative" />原本为负</span><span><i className="is-positive" />原本为正</span></div>
        </header>
        <MergedAbsoluteErrorPlot loss="squared" errors={errors} stage={stage} replay={replay} onAnimationComplete={() => setCompletedRun(run)} onInteraction={() => setAuto(false)} />
      </section>
      <div className="rl-mae-takeaway"><Typography variant="body" tone="accent">MSE 对较大偏差更敏感，偏差越大，平方后的损失增长越快。</Typography></div>
    </div>
  </ContentBlock>;
}
