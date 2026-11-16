import { ArrowRight, CheckOne } from '@icon-park/react';
import { useEffect, useMemo, useState } from 'react';
import { Button, ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { useRecordedData, type RecordedObservation } from '../../regressionData';
import './AutomaticSearchPage.css';

const blue = '#367de8';
const teal = '#009eaa';
const candidates = Array.from({ length: 12 }, (_, i) => 6 + i * 3);
const loss = (data: RecordedObservation[], depth: number) => data.reduce((sum, p) => sum + (p.depth - depth * p.mass / 1500) ** 2, 0) / Math.max(1, data.length);
function observationPlot(data: RecordedObservation[], current: number | undefined, best: number | undefined, currentMse?: number, bestMse?: number) {
  return {
    animation: false, tooltip: { trigger: 'item' },
    grid: { left: 78, right: 36, top: 54, bottom: 70 },
    xAxis: { type: 'value', min: 0, max: 1500, interval: 500, name: '累计石重', nameLocation: 'middle', nameGap: 43, nameTextStyle: { fontSize: 24, color: '#27446e' }, axisLabel: { fontSize: 21 }, splitLine: { show: false } },
    yAxis: { type: 'value', min: 0, max: 45, interval: 10, name: '下沉深度', nameGap: 25, nameTextStyle: { fontSize: 24, color: '#27446e', align: 'left' }, axisLabel: { fontSize: 21 }, splitLine: { lineStyle: { color: '#e5edf6' } } },
    series: [
      { name: '当前候选', type: 'line', symbol: 'none', data: current === undefined ? [] : [[0, 0], [1500, current]], lineStyle: { width: 3, type: 'dashed', color: blue }, silent: true },
      { name: '目前最佳', type: 'line', symbol: 'none', data: best === undefined ? [] : [[0, 0], [1500, best]], lineStyle: { width: 4, color: teal }, silent: true },
      { name: '观测记录', type: 'scatter', symbolSize: 14, itemStyle: { color: '#27446e', borderColor: '#fff', borderWidth: 2 }, data: data.map(p => [p.mass, p.depth]) },
      { type: 'scatter', data: current === undefined ? [] : [[1500, current]], symbolSize: 10, itemStyle: { color: blue }, label: { show: true, position: 'top', align: 'right', formatter: `候选 · MSE ${currentMse?.toFixed(1) ?? '—'}`, fontSize: 21, color: blue, backgroundColor: '#edf4ff', padding: [5, 8], borderRadius: 5 }, silent: true },
      { type: 'scatter', data: best === undefined ? [] : [[1500, best]], symbolSize: 10, itemStyle: { color: teal }, label: { show: true, position: 'bottom', align: 'right', formatter: `最佳 · MSE ${bestMse?.toFixed(1) ?? '—'}`, fontSize: 21, color: teal, backgroundColor: '#e5f7f5', padding: [5, 8], borderRadius: 5 }, silent: true },
    ],
  };
}

type SearchPhase = 0 | 1 | 2;
const phaseLabels = ['尝试下一条直线', '计算 MSE', '保留当前最佳'];
const phaseDurations = [900, 1000, 1100];

export function AutomaticSearchPage() {
  const data = useRecordedData();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<SearchPhase>(0);
  const [started, setStarted] = useState(false);
  const [running, setRunning] = useState(false);
  const rows = useMemo(() => candidates.map((depth, i) => ({ depth, i, mse: loss(data, depth) })), [data]);
  const finished = started && index === rows.length - 1 && phase === 2;
  const current = started ? rows[index] : undefined;
  const previousBest = rows.slice(0, index).reduce<(typeof rows)[number] | undefined>((best, row) => !best || row.mse < best.mse ? row : best, undefined);
  const improved = !!current && (!previousBest || current.mse < previousBest.mse);
  const best = phase === 2 && improved ? current : previousBest;

  useEffect(() => {
    setRunning(false);
    setStarted(false);
    setIndex(0);
    setPhase(0);
  }, [data]);
  useEffect(() => {
    if (!running || finished) return;
    const timer = window.setTimeout(() => {
      if (phase < 2) {
        setPhase((phase + 1) as SearchPhase);
        if (phase === 1 && index === rows.length - 1) setRunning(false);
      } else {
        setIndex(value => value + 1);
        setPhase(0);
      }
    }, phaseDurations[phase]);
    return () => window.clearTimeout(timer);
  }, [running, finished, phase, index, rows.length]);

  const plot = useMemo(() => observationPlot(data, current?.depth, best?.depth, current?.mse, best?.mse), [data, current?.depth, best?.depth, current?.mse, best?.mse]);
  const reset = () => { setRunning(false); setStarted(false); setIndex(0); setPhase(0); };
  if (!data.length) return <ContentBlock shuku-edit-id="e-06751668-66ca-4997-9e3d-60721914e720" title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock shuku-edit-id="e-84c3cdcc-65ab-47c7-a1fa-11734713a693" headingLevel={1} title="能否让计算机自动找线？" subtitle="逐一尝试候选直线，计算 MSE，保留误差更小的结果。" className="rl-search-page rl-auto-page">
    <div shuku-edit-id="e-ebbbcc7b-452a-42b2-bd4d-e3b8bd1ae467" className="rl-auto-content">
      <ol shuku-edit-id="e-66758dd5-73bd-4212-a7bb-f04406a5a880" className="rl-auto-process" aria-label="自动搜索步骤">
        {phaseLabels.map((label, step) => <li shuku-edit-id="e-92d30c6d-b01e-48d4-b637-2404a18b93bb" key={label} >
          <span shuku-edit-id="e-17841a68-eb52-4465-bb1e-e381f84bfd3a" className="rl-auto-step-number"><Typography shuku-edit-id="e-db459f95-a8b6-47b6-8906-b982fc3b0356" variant="body" tone="inherit">0{step + 1}</Typography></span>
          <Typography shuku-edit-id="e-b6e14730-960c-4734-b49a-3eaa8b175361" variant="bodySmall" tone="muted">{label}</Typography>
          {step < 2 && <span shuku-edit-id="e-77ed5ad3-02da-40d6-879f-9303cacf12eb" className="rl-auto-step-arrow" aria-hidden="true"><ArrowRight size={30} strokeWidth={1.5} /></span>}
        </li>)}
      </ol>
      <div shuku-edit-id="e-c17a1ec9-f797-4e81-b66e-c5a39b2f21ae" className="rl-auto-main">
        <section shuku-edit-id="e-f48cff88-8b4a-4710-b195-6735c64acbd3" className="rl-search-plot rl-auto-plot" aria-label="观测与候选直线">
          <div shuku-edit-id="e-7ec98a0c-2181-44c4-88c4-bd6a4c27da29" className="rl-auto-plot-head">
            <Typography shuku-edit-id="e-c90bc85f-06de-4d24-a795-d4dd0b8980ff" variant="h3" tone="accent">观测与候选直线</Typography>
            <div shuku-edit-id="e-f3899b79-97f1-4122-a321-25d65492c217" className="rl-auto-legend">{[['is-observation', '观测'], ['is-current', '当前候选'], ['is-best', '目前最佳']].map(([className, label]) => <Typography shuku-edit-id="e-fe031ba4-7d64-4dcc-a380-d7144b1e1bcc" as="span" variant="bodySmall" tone="muted" key={label}><i shuku-edit-id="e-55a79b9c-bc4b-426f-bca8-fc1b6834ae11" className={className} />{label}</Typography>)}</div>
          </div>
          <EChartsChart option={plot} minHeight={0} className="rl-search-chart" aria-label="观测散点、蓝色虚线当前候选与青色实线目前最佳直线" />
        </section>
        <section shuku-edit-id="e-0c3796a1-2af4-441a-9fbe-d69a7d57ccae" className="rl-auto-side" aria-label="固定比较规则与搜索控制">
          <Typography shuku-edit-id="e-c868a587-e783-419f-b2db-f020f46e2a9a" variant="h3" tone="accent">比较标准</Typography>
          <div shuku-edit-id="e-9948824c-0321-4c8e-9b99-aa96f0b1eb2d" className="rl-auto-criterion">
            <MathFormulaBlock appearance="plain" ariaLabel="均方误差等于所有残差平方的平均值"><MathFormulaStatic latex="\mathrm{MSE}=\frac{1}{n}\sum_{i=1}^{n}(y_i-\hat{y}_i)^2" /></MathFormulaBlock>
            <Typography shuku-edit-id="e-f74d9ee4-a67b-4cb8-8b3d-5948ce159454" variant="bodySmall" tone="accent" align="center">越小，拟合越好</Typography>
          </div>
          <div shuku-edit-id="e-f77e8837-b487-44d6-847d-9110fbaaa806" className="rl-auto-rules">
            <div shuku-edit-id="e-e4bf3c7f-6821-4115-a624-4ea299421a7b" className="rl-auto-rule is-better"><span shuku-edit-id="e-a63a67f7-1f2a-4c40-8795-95434dc0e7b4" className="rl-auto-rule-icon" aria-hidden="true"><CheckOne theme="filled" size={36} fill="currentColor" /></span><div shuku-edit-id="e-d0f753eb-8f10-47e6-bafb-7d4d672682a8" className="rl-auto-rule-copy"><Typography shuku-edit-id="e-e49e0822-1fd4-4775-9e1e-f9bebb52c750" variant="bodySmall" tone="inherit" className="rl-auto-rule-title">新候选更好</Typography><Typography shuku-edit-id="e-fd68428f-ec9b-4797-b8da-461b1b2558a5" variant="bodySmall" tone="accent">替换目前最佳</Typography></div></div>
            <div shuku-edit-id="e-ce136497-bdb9-4cf6-8c0e-3929fd0a9f61" className="rl-auto-rule"><span shuku-edit-id="e-411d5c44-2b4c-4c40-8872-bb3f39096d89" className="rl-auto-rule-icon" aria-hidden="true"><CheckOne theme="outline" size={36} fill="currentColor" /></span><div shuku-edit-id="e-d19c0628-ecd6-4f1b-8088-3b67e786e5cf" className="rl-auto-rule-copy"><Typography shuku-edit-id="e-8dfc7f81-93f9-4796-a726-2ea5581149be" variant="bodySmall" tone="muted">否则</Typography><Typography shuku-edit-id="e-096b3717-8bc1-4ef3-ae5d-0b5f58e8c6a8" variant="bodySmall" tone="accent">继续保留原来的最佳</Typography></div></div>
          </div>
          <div shuku-edit-id="e-43840a9f-4ead-4165-8830-d64de22f3806" className="rl-auto-controls" aria-label="搜索控制">
            <Button variant="primary" disabled={finished} onClick={() => { setStarted(true); setRunning(value => !value); }}>{finished ? '搜索完成' : running ? '暂停搜索' : started ? '继续搜索' : '开始搜索'}</Button>
            <Button onClick={reset}>重新开始</Button>
          </div>
        </section>
      </div>
      <Typography shuku-edit-id="e-127a4a7b-e8a9-45ed-86b4-c5cf528c5ace" variant="bodySmall" tone="muted" className="rl-auto-footnote">候选直线不断尝试，最佳直线只在误差更小时更新。</Typography>
    </div>
  </ContentBlock>;
}

export { SearchLimitsPage } from './SearchLimitsPage';
