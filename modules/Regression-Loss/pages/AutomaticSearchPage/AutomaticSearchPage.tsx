import { ArrowRight, CheckOne } from '@icon-park/react';
import { useEffect, useMemo, useState } from 'react';
import { Button, ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
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
  if (!data.length) return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock headingLevel={1} title="能否让计算机自动找线？" subtitle="逐一尝试候选直线，计算 MSE，保留误差更小的结果。" className="rl-search-page rl-auto-page">
    <div className="rl-auto-content">
      <ol className="rl-auto-process" aria-label="自动搜索步骤">
        {phaseLabels.map((label, step) => <li key={label} >
          <span className="rl-auto-step-number"><Typography variant="body" tone="inherit">0{step + 1}</Typography></span>
          <Typography variant="bodySmall" tone="muted">{label}</Typography>
          {step < 2 && <span className="rl-auto-step-arrow" aria-hidden="true"><ArrowRight size={30} strokeWidth={1.5} /></span>}
        </li>)}
      </ol>
      <div className="rl-auto-main">
        <section className="rl-search-plot rl-auto-plot" aria-label="观测与候选直线">
          <div className="rl-auto-plot-head">
            <Typography variant="h3" tone="accent">观测与候选直线</Typography>
            <div className="rl-auto-legend">{[['is-observation', '观测'], ['is-current', '当前候选'], ['is-best', '目前最佳']].map(([className, label]) => <Typography as="span" variant="bodySmall" tone="muted" key={label}><i className={className} />{label}</Typography>)}</div>
          </div>
          <EChartsChart option={plot} minHeight={0} className="rl-search-chart" aria-label="观测散点、蓝色虚线当前候选与青色实线目前最佳直线" />
        </section>
        <section className="rl-auto-side" aria-label="固定比较规则与搜索控制">
          <Typography variant="h3" tone="accent">比较标准</Typography>
          <div className="rl-auto-criterion">
            <MathFormulaBlock appearance="plain" ariaLabel="均方误差等于所有残差平方的平均值"><MathFormulaStatic latex="\mathrm{MSE}=\frac{1}{n}\sum_{i=1}^{n}(y_i-\hat{y}_i)^2" /></MathFormulaBlock>
            <Typography variant="bodySmall" tone="accent" align="center">越小，拟合越好</Typography>
          </div>
          <div className="rl-auto-rules">
            <div className="rl-auto-rule is-better"><span className="rl-auto-rule-icon" aria-hidden="true"><CheckOne theme="filled" size={36} fill="currentColor" /></span><div className="rl-auto-rule-copy"><Typography variant="bodySmall" tone="inherit" className="rl-auto-rule-title">新候选更好</Typography><Typography variant="bodySmall" tone="accent">替换目前最佳</Typography></div></div>
            <div className="rl-auto-rule"><span className="rl-auto-rule-icon" aria-hidden="true"><CheckOne theme="outline" size={36} fill="currentColor" /></span><div className="rl-auto-rule-copy"><Typography variant="bodySmall" tone="muted">否则</Typography><Typography variant="bodySmall" tone="accent">继续保留原来的最佳</Typography></div></div>
          </div>
          <div className="rl-auto-controls" aria-label="搜索控制">
            <Button variant="primary" disabled={finished} onClick={() => { setStarted(true); setRunning(value => !value); }}>{finished ? '搜索完成' : running ? '暂停搜索' : started ? '继续搜索' : '开始搜索'}</Button>
            <Button onClick={reset}>重新开始</Button>
          </div>
        </section>
      </div>
      <Typography variant="bodySmall" tone="muted" className="rl-auto-footnote">候选直线不断尝试，最佳直线只在误差更小时更新。</Typography>
    </div>
  </ContentBlock>;
}

export { SearchLimitsPage } from './SearchLimitsPage';
