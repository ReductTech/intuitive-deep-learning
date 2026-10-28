import { useEffect, useMemo, useState } from 'react';
import { Button, ContentBlock, EChartsChart, Typography } from '../../../shared/react';
import { useRecordedData, type RecordedObservation } from '../../regressionData';
import './AutomaticSearchPage.css';

const blue = '#367de8';
const teal = '#009eaa';
const candidates = Array.from({ length: 12 }, (_, i) => 6 + i * 3);
const loss = (data: RecordedObservation[], depth: number) => data.reduce((sum, p) => sum + (p.depth - depth * p.mass / 1500) ** 2, 0) / Math.max(1, data.length);
function observationPlot(data: RecordedObservation[], current: number | undefined, best: number | undefined, currentIndex?: number, bestIndex?: number) {
  return {
    animation: false, tooltip: { trigger: 'item' },
    grid: { left: 78, right: 26, top: 54, bottom: 70 },
    xAxis: { type: 'value', min: 0, max: 1600, interval: 500, name: '累计石重（千克）', nameLocation: 'middle', nameGap: 43, nameTextStyle: { fontSize: 24, color: '#27446e' }, axisLabel: { fontSize: 21 }, splitLine: { show: false } },
    yAxis: { type: 'value', min: 0, max: 45, interval: 10, name: '下沉深度（厘米）', nameGap: 25, nameTextStyle: { fontSize: 24, color: '#27446e', align: 'left' }, axisLabel: { fontSize: 21 }, splitLine: { lineStyle: { color: '#e5edf6' } } },
    series: [
      { name: '当前候选', type: 'line', symbol: 'none', data: current === undefined ? [] : [[0, 0], [1500, current]], lineStyle: { width: 3, type: 'dashed', color: blue }, silent: true },
      { name: '目前最佳', type: 'line', symbol: 'none', data: best === undefined ? [] : [[0, 0], [1500, best]], lineStyle: { width: 4, color: teal }, silent: true },
      { name: '观测记录', type: 'scatter', symbolSize: 14, itemStyle: { color: '#27446e', borderColor: '#fff', borderWidth: 2 }, data: data.map(p => [p.mass, p.depth]) },
      { type: 'scatter', data: current === undefined ? [] : [[1500, current]], symbolSize: 10, itemStyle: { color: blue }, label: { show: true, position: 'top', formatter: `候选 ${String((currentIndex ?? 0) + 1).padStart(2, '0')}`, fontSize: 18, color: blue, backgroundColor: '#edf4ff', padding: [5, 8], borderRadius: 5 }, silent: true },
      { type: 'scatter', data: best === undefined ? [] : [[1500, best]], symbolSize: 10, itemStyle: { color: teal }, label: { show: true, position: 'bottom', formatter: `最佳 ${String((bestIndex ?? 0) + 1).padStart(2, '0')}`, fontSize: 18, color: teal, backgroundColor: '#e5f7f5', padding: [5, 8], borderRadius: 5 }, silent: true },
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
  const plot = useMemo(() => observationPlot(data, current?.depth, best?.depth, current?.i, best?.i), [data, current?.depth, best?.depth, current?.i, best?.i]);
  if (!data.length) return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  const status = finished ? '候选搜索完成' : running ? '自动搜索中' : count ? '搜索已暂停' : '等待开始搜索';
  const explanation = !current ? '开始搜索，比较每条候选直线的误差。' : current.i === best?.i ? '当前候选误差最小，更新目前最佳直线。' : '当前候选误差更大，保留已有最佳直线。';
  const recent = evaluated.slice(-4);
  return <ContentBlock headingLevel={1} title="能否让计算机自动找线？" subtitle="逐一尝试候选直线，计算 MSE，保留目前最佳结果。" className="rl-search-page rl-auto-page">
    <Typography variant="bodySmall" className={`rl-auto-status${running && !finished ? ' is-running' : ''}`} role="status">{status}</Typography>
    <div className="rl-auto-content">
      <ol className="rl-auto-process" aria-label="自动搜索步骤">{['尝试一条直线', '计算 MSE', '保留更优结果'].map((label, index) => <li key={label}><span className="rl-auto-step-number">0{index + 1}</span><Typography variant="h3" tone="accent">{label}</Typography>{index < 2 && <span className="rl-auto-step-arrow" aria-hidden="true">⟶</span>}</li>)}</ol>
      <div className="rl-auto-main">
        <section className="rl-search-plot rl-auto-plot" aria-label="观测与候选直线">
          <div className="rl-auto-plot-head"><Typography variant="h3" tone="accent">观测与候选直线</Typography><div className="rl-auto-legend"><span><i className="is-observation" />观测</span><span><i className="is-current" />当前候选</span><span><i className="is-best" />目前最佳</span></div></div>
          <EChartsChart option={plot} minHeight={0} className="rl-search-chart" aria-label="观测散点、蓝色虚线当前候选与青色实线目前最佳直线" />
        </section>
        <section className="rl-auto-side" aria-label="候选比较与最近尝试">
          <div className="rl-auto-metrics" aria-live="polite">
            <div className="rl-auto-metric"><Typography variant="h3">当前候选{current ? ` · ${String(current.i + 1).padStart(2, '0')}` : ''}</Typography><Typography variant="bodySmall">MSE</Typography><Typography variant="h1" className="rl-auto-metric-value">{current ? current.mse.toFixed(1) : '—'}</Typography><Typography variant="bodySmall">平方厘米</Typography></div>
            <div className="rl-auto-metric is-best"><Typography variant="h3">目前最佳{best ? ` · ${String(best.i + 1).padStart(2, '0')}` : ''}</Typography><Typography variant="bodySmall">MSE</Typography><Typography variant="h1" className="rl-auto-metric-value">{best ? best.mse.toFixed(1) : '—'}</Typography><Typography variant="bodySmall">平方厘米</Typography></div>
          </div>
          <Typography variant="bodySmall" tone="muted" className="rl-auto-explanation">{explanation}</Typography>
          <section className="rl-auto-records" aria-label="最近四次尝试"><div className="rl-auto-records-head"><Typography variant="h3" tone="accent">最近尝试</Typography><Typography variant="bodySmall" tone="muted">MSE / 平方厘米</Typography></div>
            <table><thead><tr><th scope="col">候选</th><th scope="col">MSE</th></tr></thead><tbody>{Array.from({ length: 4 }, (_, index) => {
              const row = recent[index];
              return <tr key={row?.i ?? `empty-${index}`} className={row?.i === current?.i && row ? 'is-current' : ''}><td>{row ? <><span className="rl-auto-row-dot" aria-hidden="true" />{String(row.i + 1).padStart(2, '0')}{row.i === best?.i && <span className="rl-auto-best-tag">最佳</span>}</> : '—'}</td><td>{row ? row.mse.toFixed(1) : '—'}</td></tr>;
            })}</tbody></table>
          </section>
        </section>
      </div>
      <section className="rl-auto-controls" aria-label="搜索控制">
        <div className="rl-auto-progress"><Typography variant="h3" tone="accent">搜索进度 <span>{count} / {candidates.length}</span></Typography><div className="rl-auto-segments" role="progressbar" aria-label="已尝试的候选直线" aria-valuemin={0} aria-valuemax={candidates.length} aria-valuenow={count}>{candidates.map((_, index) => <i key={index} className={index < count ? 'is-done' : ''} />)}</div><Typography variant="bodySmall" tone="muted">已尝试 {count} 条候选直线</Typography></div>
        <div className="rl-search-buttons"><Button variant="primary" disabled={finished} onClick={() => setRunning(value => !value)}>{finished ? '搜索完成' : running ? 'Ⅱ 暂停搜索' : count ? '继续搜索' : '开始搜索'}</Button><Button onClick={() => { setCount(0); setRunning(false); }}>重新开始</Button></div>
      </section>
      <Typography variant="bodySmall" tone="muted" className="rl-auto-footnote">目前最佳仅指已尝试的候选；本页所有直线均通过原点。</Typography>
    </div>
  </ContentBlock>;
}

export { SearchLimitsPage } from './SearchLimitsPage';
