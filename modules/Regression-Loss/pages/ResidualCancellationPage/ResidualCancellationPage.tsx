import { useRecordedData } from '../../regressionData';
import { useMemo, useRef, useState, type PointerEvent } from 'react';
import type { EChartsEvent, EChartsInstance } from '../../../shared/react/visuals/EChartsChart';
import { ContentBlock, EChartsChart, Typography } from '../../../shared/react';
import './ResidualCancellationPage.css';

const positive = '#e87c59';
const negative = '#467fe3';
const signed = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}`;

export function ResidualCancellationPage() {
  const data = useRecordedData();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 16, y: 16 });
  const pointerPosition = useRef({ x: 16, y: 16 });
  const layoutRef = useRef<HTMLDivElement>(null);
  const scatterChart = useRef<EChartsInstance | null>(null);
  const barsChart = useRef<EChartsInstance | null>(null);
  const model = useMemo(()=>{
    if(!data.length)return {w:.016,b:0};
    const mx=data.reduce((sum,p)=>sum+p.mass,0)/data.length;
    const my=data.reduce((sum,p)=>sum+p.depth,0)/data.length;
    const xx=data.reduce((sum,p)=>sum+(p.mass-mx)**2,0);
    const w=xx?data.reduce((sum,p)=>sum+(p.mass-mx)*(p.depth-my),0)/xx:.016;
    return {w,b:my-w*mx};
  },[data]);
  const modelIntercept = model.b;
  const samples = useMemo(()=>data.map(p=>{
    const prediction=Math.round((model.w*p.mass+model.b)*10)/10;
    return {x:p.mass,y:p.depth,prediction,e:Math.round((p.depth-prediction)*10)/10};
  }),[data,model]);
  const errors = useMemo(() => samples.map(p => p.e), [samples]);
  const positiveTotal = errors.reduce((total, error) => total + Math.max(0, Math.round(error * 10)), 0) / 10;
  const negativeTotal = errors.reduce((total, error) => total + Math.min(0, Math.round(error * 10)), 0) / 10;
  const sum = Math.round((positiveTotal + negativeTotal) * 10) / 10;
  const positiveIndex = errors.reduce((best, error, index) => error > 0 && (best < 0 || error > errors[best]) ? index : best, -1);
  const negativeIndex = errors.reduce((best, error, index) => error < 0 && (best < 0 || error < errors[best]) ? index : best, -1);
  const labelSample = (index: number) => index === positiveIndex || index === negativeIndex;
  const errorBound = Math.max(5, Math.ceil(Math.max(0, ...errors.map(Math.abs))));
  const highlight = (index: number | null) => {
    for (const chart of [scatterChart.current, barsChart.current]) chart?.dispatchAction({ type: 'downplay' });
    if (index === null || !samples[index]) return;
    scatterChart.current?.dispatchAction({ type: 'highlight', seriesIndex: samples.length + 1, dataIndex: index });
    scatterChart.current?.dispatchAction({ type: 'highlight', seriesIndex: index + 1 });
    barsChart.current?.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: index });
  };
  const hoverEvents = (seriesType: 'scatter' | 'bar') => ({
    mouseover: (event: EChartsEvent) => {
      if (event.componentType !== 'series' || event.seriesType !== seriesType || event.dataIndex === undefined || !samples[event.dataIndex]) return;
      setHoveredIndex(event.dataIndex);
      setTooltipPosition(pointerPosition.current);
      highlight(event.dataIndex);
    },
    mouseout: (event: EChartsEvent) => {
      if (event.seriesType !== seriesType) return;
      setHoveredIndex(null);
      highlight(null);
    },
    globalout: () => { setHoveredIndex(null); highlight(null); },
  });
  const trackPointer = (event: PointerEvent<HTMLDivElement>) => {
    const layout = layoutRef.current;
    if (!layout) return;
    const rect = layout.getBoundingClientRect();
    const x = (event.clientX - rect.left) * layout.clientWidth / rect.width;
    const y = (event.clientY - rect.top) * layout.clientHeight / rect.height;
    pointerPosition.current = {
      x: Math.max(12, Math.min(x + 20, layout.clientWidth - 360)),
      y: Math.max(12, Math.min(y + 18, layout.clientHeight - 280)),
    };
    if (hoveredIndex !== null) setTooltipPosition(pointerPosition.current);
  };
  const hoveredSample = hoveredIndex === null ? undefined : samples[hoveredIndex];
  const scatter = useMemo(() => ({
    animation: false,
    tooltip: { show: false },
    grid: { left: 74, right: 30, top: 60, bottom: 70 },
    xAxis: { type: 'value', min: 0, max: 1700, interval: 500, name: '累计石重（千克）', nameLocation: 'middle', nameGap: 40, nameTextStyle: { fontSize: 25, color: '#27446e' }, axisLabel: { fontSize: 22, color: '#526582' }, axisLine: { show: true }, splitLine: { show: false } },
    yAxis: { type: 'value', min: 0, max: 36, interval: 10, name: '下沉深度（厘米）', nameGap: 23, nameTextStyle: { fontSize: 25, color: '#27446e', align: 'left' }, axisLabel: { fontSize: 22, color: '#526582' }, axisLine: { show: true }, splitLine: { lineStyle: { color: '#e4ebf3' } } },
    series: [
      { type: 'line', symbol: 'none', data: [[0, modelIntercept], [1700, model.w*1700+modelIntercept]], lineStyle: { color: '#168c97', width: 3 }, silent: true },
      ...samples.map(p => ({ type: 'line', symbol: 'none', data: [[p.x, p.prediction], [p.x, p.y]], lineStyle: { color: p.e > 0 ? positive : negative, width: 2 }, emphasis: { lineStyle: { width: 5 } }, silent: true })),
      { type: 'scatter', symbolSize: 15, data: samples.map((p, index) => ({ value: [p.x, p.y], label: { show: labelSample(index), position: p.e > 0 ? 'top' : 'bottom', formatter: `${signed(p.e)} cm`, color: p.e > 0 ? positive : negative, fontSize: 22, distance: 9 } })), itemStyle: { color: '#5f7f9f', borderColor: '#fff', borderWidth: 1 }, label: { show: true }, emphasis: { scale: 1.6, itemStyle: { borderColor: '#27446e', borderWidth: 3 } }, silent: false, z: 5 },
    ],
  }), [samples, modelIntercept, model.w, positiveIndex, negativeIndex]);
  const bars = useMemo(() => ({
    animation: false,
    tooltip: { show: false },
    grid: { left: 60, right: 24, top: 48, bottom: 54 },
    xAxis: { type: 'category', data: errors.map((_, i) => `${i + 1}`), axisLabel: { fontSize: 20, color: '#526582' }, axisTick: { show: false }, axisLine: { onZero: false, lineStyle: { color: '#718098' } }, name: '样本', nameLocation: 'middle', nameGap: 29, nameTextStyle: { fontSize: 21, color: '#27446e' } },
    yAxis: { type: 'value', min: -errorBound, max: errorBound, interval: errorBound, name: '误差（厘米）', nameGap: 20, nameTextStyle: { fontSize: 23, color: '#27446e', align: 'left' }, axisLabel: { show: true, fontSize: 18, color: '#72849e' }, axisTick: { show: false }, axisLine: { show: false }, splitLine: { lineStyle: { color: '#e5ecf4', type: 'dashed' } } },
    series: [{ type: 'bar', barMaxWidth: 30, emphasis: { itemStyle: { borderColor: '#27446e', borderWidth: 3, shadowBlur: 8, shadowColor: '#27446e33' } }, data: errors.map(e => ({ value: e, itemStyle: { color: e > 0 ? positive : negative, borderRadius: e > 0 ? [5, 5, 0, 0] : [0, 0, 5, 5] }, label: { show: false, position: e > 0 ? 'top' : 'bottom', formatter: signed(e), color: e > 0 ? positive : negative } })), label: { show: false }, markLine: { silent: true, symbol: 'none', label: { show: false }, lineStyle: { color: '#526582', width: 1, type: 'solid' }, data: [{ yAxis: 0 }] } }],
  }), [errors, positiveIndex, negativeIndex, errorBound]);
  if(!data.length)return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock headingLevel={1} title="误差不能直接相加" subtitle="每条预测都有偏差，为什么相加后却几乎为零？" className="rl-cancel-page">
    <div className="rl-cancel-layout" ref={layoutRef} onPointerMove={trackPointer} onPointerLeave={() => { setHoveredIndex(null); highlight(null); }}>
      <section className="rl-cancel-observations" aria-label="各样本的有向误差">
        <header className="rl-cancel-plot-head"><Typography variant="h3" tone="accent">误差从哪里来</Typography><div className="rl-cancel-legend"><span><i className="is-line" />预测直线</span><span><i className="is-point" />观测值</span></div></header>
        <EChartsChart className="rl-cancel-chart" option={scatter} minHeight={0} onEvents={hoverEvents('scatter')} onReady={chart => { scatterChart.current = chart; highlight(hoveredIndex); }} aria-label="共享观测记录、预测直线及正负竖直误差，标注最大正误差和最大负误差" />
        <Typography variant="bodySmall" tone="muted" className="rl-cancel-plot-caption">向上与向下的偏差都会影响预测</Typography>
      </section>
      <section className="rl-cancel-summary" aria-label="误差抵消与总和">
        <Typography variant="h3" tone="accent">正负偏差，相互抵消</Typography>
        <div className="rl-cancel-bars"><EChartsChart className="rl-cancel-chart" option={bars} minHeight={0} onEvents={hoverEvents('bar')} onReady={chart => { barsChart.current = chart; highlight(hoveredIndex); }} aria-label="每条记录的正负误差，正值向上、负值向下" /></div>
        <div className="rl-cancel-total" aria-live="polite">
          <Typography variant="bodySmall" tone="accent" className="rl-cancel-total-title">直接求和（厘米）</Typography>
          <div className="rl-cancel-addends"><div className="rl-cancel-positive"><Typography variant="h2" tone="inherit">{signed(positiveTotal)}</Typography><Typography variant="bodySmall" tone="accent">正误差之和</Typography></div><span className="rl-cancel-plus" aria-hidden="true">＋</span><div className="rl-cancel-negative"><Typography variant="h2" tone="inherit">{signed(negativeTotal)}</Typography><Typography variant="bodySmall" tone="accent">负误差之和</Typography></div></div>
          <svg className="rl-cancel-bracket" viewBox="0 0 500 26" preserveAspectRatio="none" aria-hidden="true"><path d="M12 2 Q12 15 30 15 H226 Q250 15 250 25 Q250 15 274 15 H470 Q488 15 488 2" fill="none" stroke="#8aa0bc" strokeWidth="2" /></svg>
          <div className="rl-cancel-result"><Typography variant="bodySmall" tone="accent">相加后只剩</Typography><Typography variant="h1" tone="accent">{signed(sum)}<Typography as="span" variant="h3"> cm</Typography></Typography></div>
          <Typography variant="bodySmall" tone="muted" className="rl-cancel-result-note">相加的结果很小，各条误差却并不小。</Typography>
        </div>
      </section>
      {hoveredSample && <div className="rl-cancel-hover-card" role="tooltip" style={{ left: tooltipPosition.x, top: tooltipPosition.y }}>
        <Typography variant="body" tone="accent" className="rl-cancel-hover-heading">样本 {(hoveredIndex ?? 0) + 1}</Typography>
        <Typography variant="body" tone="muted">载重：{hoveredSample.x} 千克</Typography>
        <Typography variant="body" tone="accent">观测：{hoveredSample.y.toFixed(1)} 厘米</Typography>
        <Typography variant="body" tone="accent">预测：{hoveredSample.prediction.toFixed(1)} 厘米</Typography>
        <Typography variant="body" tone="accent">误差：{signed(hoveredSample.e)} 厘米</Typography>
      </div>}
      <div className="rl-cancel-takeaway"><Typography variant="body" tone="accent">误差总和接近零，<strong>不代表</strong>每一次预测都准确。</Typography></div>
    </div>
  </ContentBlock>;
}
