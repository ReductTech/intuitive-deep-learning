import { useEffect, useMemo, useState } from 'react';
import { Button, ContentBlock, EChartsChart, Typography } from '../../../shared/react';
import { useRecordedData, type RecordedObservation } from '../../regressionData';
import './AutomaticSearchPage.css';

const blue = '#367de8';
const teal = '#009eaa';
const candidates = Array.from({ length: 12 }, (_, i) => 6 + i * 3);
const loss = (data: RecordedObservation[], depth: number) => data.reduce((sum, p) => sum + (p.depth - depth * p.mass / 1500) ** 2, 0) / Math.max(1, data.length);
const makeGrid = (step: number) => Array.from({ length: Math.round(45 / step) + 1 }, (_, i) => i * step);
function observationPlot(data: RecordedObservation[], current: number | undefined, best: number | undefined) {
  return {
    animation: false, tooltip: { trigger: 'item' },
    grid: { left: 78, right: 26, top: 72, bottom: 70 },
    legend: { top: 12, right: 12, textStyle: { fontSize: 19, color: '#27446e' }, data: ['当前候选', '目前最佳'] },
    xAxis: { type: 'value', min: 0, max: 1600, interval: 500, name: '累计石重（千克）', nameLocation: 'middle', nameGap: 43, nameTextStyle: { fontSize: 24, color: '#27446e' }, axisLabel: { fontSize: 21 }, splitLine: { show: false } },
    yAxis: { type: 'value', min: 0, max: 45, interval: 10, name: '下沉深度（厘米）', nameGap: 25, nameTextStyle: { fontSize: 24, color: '#27446e', align: 'left' }, axisLabel: { fontSize: 21 }, splitLine: { lineStyle: { color: '#e5edf6' } } },
    series: [
      { name: '当前候选', type: 'line', symbol: 'none', data: current === undefined ? [] : [[0, 0], [1500, current]], lineStyle: { width: 3, type: 'dashed', color: blue }, silent: true },
      { name: '目前最佳', type: 'line', symbol: 'none', data: best === undefined ? [] : [[0, 0], [1500, best]], lineStyle: { width: 4, color: teal }, silent: true },
      { name: '观测记录', type: 'scatter', symbolSize: 14, itemStyle: { color: blue, borderColor: '#fff', borderWidth: 2 }, data: data.map(p => [p.mass, p.depth]) },
    ],
  };
}

export function AutomaticSearchPage() {
  const data = useRecordedData();
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => { setRunning(false); setCount(0); }, [data]);
  useEffect(() => {
    if (!running || count >= candidates.length) return;
    const timer = window.setTimeout(() => setCount(n => n + 1), 650);
    return () => window.clearTimeout(timer);
  }, [running, count]);
  const evaluated = useMemo(() => candidates.slice(0, count).map((depth, i) => ({ depth, i, mse: loss(data, depth) })), [data, count]);
  const best = evaluated.reduce<(typeof evaluated)[number] | undefined>((result, row) => !result || row.mse < result.mse ? row : result, undefined);
  const current = evaluated.at(-1);
  const finished = count === candidates.length;
  const plot = useMemo(() => observationPlot(data, current?.depth, best?.depth), [data, current?.depth, best?.depth]);
  if (!data.length) return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock headingLevel={1} title="能否让计算机自动找线？" subtitle="逐一尝试候选直线，计算 MSE，保留目前最佳结果。" className="rl-search-page">
    <div className="rl-search-layout">
      <section className="rl-search-plot"><EChartsChart option={plot} minHeight={0} className="rl-search-chart" aria-label="实际称象记录与自动搜索的当前候选和目前最佳直线" /></section>
      <section className="rl-search-side">
        <Typography variant="h3" tone="accent">{finished ? '候选搜索完成' : running ? '自动搜索中' : count ? '搜索已暂停' : '让计算机逐条尝试'}</Typography>
        <div className="rl-search-metric"><Typography variant="body" tone="accent">当前候选 · MSE</Typography><Typography variant="h2" tone="accent">{current ? current.mse.toFixed(1) : '—'} <Typography as="span" variant="bodySmall">平方厘米</Typography></Typography></div>
        <div className="rl-search-metric rl-search-best"><Typography variant="body" tone="accent">目前最佳 · MSE</Typography><Typography variant="h2" tone="accent">{best ? best.mse.toFixed(1) : '—'} <Typography as="span" variant="bodySmall">平方厘米</Typography></Typography></div>
        <div className="rl-search-records"><Typography variant="body" tone="accent">最近尝试</Typography><div className="rl-search-row"><Typography variant="bodySmall" tone="muted">候选</Typography><Typography variant="bodySmall" tone="muted">MSE（平方厘米）</Typography></div>{evaluated.slice(-4).map(row => <div className={`rl-search-row${row.i === best?.i ? ' rl-search-row-best' : ''}`} key={row.i}><Typography variant="bodySmall">{String(row.i + 1).padStart(2, '0')}{row.i === best?.i ? ' · 最佳' : ''}</Typography><Typography variant="bodySmall">{row.mse.toFixed(1)}</Typography></div>)}</div>
        <div className="rl-search-controls"><Typography variant="bodySmall" tone="muted">已尝试 {count} / {candidates.length} 条</Typography><progress value={count} max={candidates.length} aria-label="搜索进度" /><div className="rl-search-buttons"><Button variant="primary" disabled={finished} onClick={() => setRunning(value => !value)}>{running && !finished ? '暂停搜索' : count ? '继续搜索' : '开始搜索'}</Button><Button onClick={() => { setCount(0); setRunning(false); }}>重新开始</Button></div></div>
      </section>
      <div className="rl-search-footer"><Typography variant="body" tone="accent">尝试一条直线 → 计算 MSE → 更新最佳结果</Typography><Typography variant="bodySmall" tone="muted">最佳仅指已尝试的候选；所有直线通过原点。</Typography></div>
    </div>
  </ContentBlock>;
}

export function SearchLimitsPage() {
  const data = useRecordedData();
  const [step, setStep] = useState(5);
  const results = useMemo(() => [5, 1, .5].map(interval => {
    const points = makeGrid(interval).map(depth => ({ depth, mse: loss(data, depth) }));
    const best = points.reduce((a, b) => a.mse <= b.mse ? a : b);
    return { interval, points, best };
  }), [data]);
  const selected = results.find(result => result.interval === step)!;
  const curve = useMemo(() => ({
    animation: false, tooltip: { trigger: 'item', valueFormatter: (value: number) => Number(value).toFixed(1) },
    grid: { left: 86, right: 30, top: 72, bottom: 87 },
    xAxis: { type: 'value', min: 0, max: 45, interval: 10, name: '1500 千克时的预测深度（厘米）', nameLocation: 'middle', nameGap: 46, nameTextStyle: { fontSize: 23, color: '#27446e' }, axisLabel: { fontSize: 21 } },
    yAxis: { type: 'value', name: 'MSE（平方厘米）', nameGap: 25, nameTextStyle: { fontSize: 23, color: '#27446e', align: 'left' }, axisLabel: { fontSize: 20 }, splitLine: { lineStyle: { color: '#e5edf6' } } },
    series: [
      { type: 'line', symbol: 'none', data: makeGrid(.1).map(depth => [depth, loss(data, depth)]), lineStyle: { width: 3, color: '#b5c7df' }, silent: true },
      { name: '已检查候选', type: 'scatter', symbolSize: step === 5 ? 14 : 8, itemStyle: { color: blue }, data: selected.points.map(p => [p.depth, p.mse]) },
      { name: '网格最佳', type: 'scatter', symbolSize: 21, itemStyle: { color: teal, borderColor: '#fff', borderWidth: 3 }, data: [[selected.best.depth, selected.best.mse]], label: { show: true, position: 'top', formatter: '网格最佳', fontSize: 20, color: teal } },
    ],
  }), [data, selected, step]);
  if (!data.length) return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock headingLevel={1} title="遍历搜索的局限" subtitle="搜索更细，需要检查更多候选；参数增多，组合数量迅速增长。" className="rl-search-page">
    <div className="rl-search-layout rl-search-limits-layout">
      <section className="rl-search-plot rl-search-loss-plot"><div className="rl-search-grid-controls"><Typography variant="body" tone="accent">搜索间隔</Typography>{results.map(result => <Button key={result.interval} active={step === result.interval} variant={step === result.interval ? 'primary' : 'default'} onClick={() => setStep(result.interval)}>{result.interval.toFixed(1)} 厘米</Button>)}</div><EChartsChart option={curve} minHeight={0} className="rl-search-chart" aria-label="同一批记录的MSE曲线与不同间隔的搜索网格" /></section>
      <section className="rl-search-side rl-search-limit-side">
        <Typography variant="h3" tone="accent">精度与计算量的取舍</Typography>
        <div className="rl-search-comparison"><div className="rl-search-compare-row"><Typography variant="bodySmall" tone="muted">间隔 / 厘米</Typography><Typography variant="bodySmall" tone="muted">候选数</Typography><Typography variant="bodySmall" tone="muted">最佳 MSE</Typography></div>{results.map(result => <div key={result.interval} className={`rl-search-compare-row${step === result.interval ? ' rl-search-row-best' : ''}`}><Typography variant="body">{result.interval.toFixed(1)}</Typography><Typography variant="body">{result.points.length}</Typography><Typography variant="body">{result.best.mse.toFixed(1)}</Typography></div>)}</div>
        <Typography variant="bodySmall" tone="muted">搜索范围固定为 0.0—45.0 厘米；MSE 单位为平方厘米。</Typography>
        <div className="rl-search-growth"><Typography variant="h3" tone="accent">若每个参数都检查 {selected.points.length} 个值</Typography>{[1, 2, 5].map(d => <div className="rl-search-row" key={d}><Typography variant="body">{d} 个参数</Typography><Typography variant="body" tone="accent">{(selected.points.length ** d).toLocaleString('zh-CN')} 次</Typography></div>)}<Typography variant="bodySmall" tone="muted">参数维数示意：组合数等于每维候选数的连乘。</Typography></div>
        <div className="rl-search-question"><Typography variant="h3" tone="accent">能否利用模型的数学结构，直接找到最优参数？</Typography></div>
      </section>
      <div className="rl-search-footer"><Typography variant="body" tone="accent">网格上的最佳候选，不一定是连续参数空间中的最优解。</Typography></div>
    </div>
  </ContentBlock>;
}
