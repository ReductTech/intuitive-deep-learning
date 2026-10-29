import { useRecordedData, examplePrediction } from '../../regressionData';
import { useEffect, useMemo, useState } from 'react';
import { Button, Switch, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import '../MaePage/MaePage.css';
import '../MaePage/MergedMaePage.css';
import { MergedAbsoluteErrorPlot, type MaeStage } from '../MaePage/MergedAbsoluteErrorPlot';

const steps = [
  { title: '计算残差', formula: 'e_i=y_i-\\hat{y}_i', description: '从预测直线出发，逐条形成有正有负的残差柱。' },
  { title: '平方', formula: 'e_i^2=(y_i-\\hat{y}_i)^2', description: '残差平方后都变为正数，柱顶落在平方曲线上。' },
  { title: '求平均', formula: '\\mathrm{MSE}=\\frac{1}{n}\\sum_{i=1}^{n}e_i^2', description: '对全部平方误差求平均，显示 MSE 水平线。' },
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
        <div className="rl-mae-merged-steps">{steps.map((step, index) => <button key={step.title} type="button" className={`rl-mae-merged-step${stage === index ? ' is-current' : ''}`} aria-pressed={stage === index} onClick={() => chooseStage(index as MaeStage)}><div className="rl-mae-merged-step-head"><span className="rl-mae-step-number"><Typography variant="h3" tone="inherit">{index + 1}</Typography></span><Typography variant="h3" tone="accent">{step.title}</Typography><Typography as="span" variant="body" className="rl-mae-stage-play" tone="muted" aria-hidden="true">▷</Typography></div><MathFormulaBlock appearance="plain"><MathFormulaStatic latex={step.formula} /></MathFormulaBlock></button>)}</div>
      </aside>
      <section className="rl-mae-merged-main" aria-label="残差形成、平方与求平均的动态演示">
        <div className="rl-mae-merged-heading"><Typography variant="h3" tone="accent">平方函数与误差</Typography><div className="rl-loss-mode-switch"><Typography variant="bodySmall" tone="accent">原始</Typography><Switch label={<Typography variant="bodySmall" tone="accent">MSE</Typography>} aria-label="原始与MSE切换" checked={stage > 0} onChange={event => chooseStage(event.target.checked ? 2 : 0)} /></div></div>
        <div className="rl-mae-merged-info"><Typography variant="bodySmall" tone="accent" className="rl-mae-explanation">{steps[stage].description}</Typography><MathFormulaBlock appearance="plain"><MathFormulaStatic latex={stage === 0 ? '\\ell(e)=e' : '\\ell(e)=e^2'} /></MathFormulaBlock></div>
        <MergedAbsoluteErrorPlot loss="squared" errors={errors} stage={stage} replay={replay} onAnimationComplete={() => setCompletedRun(run)} onInteraction={() => setAuto(false)} />
        <div className="rl-mae-merged-playback"><Typography variant="bodySmall" tone="muted">点击左侧步骤，可逐步演示或重播</Typography><Button onClick={() => setAuto(value => !value)}>{auto ? '暂停自动演示' : '开启自动演示'}</Button></div>
      </section>
      <div className="rl-mae-takeaway"><Typography variant="body" tone="accent">MSE 对较大偏差更敏感，偏差越大，平方后的损失增长越快。</Typography></div>
    </div>
  </ContentBlock>;
}
