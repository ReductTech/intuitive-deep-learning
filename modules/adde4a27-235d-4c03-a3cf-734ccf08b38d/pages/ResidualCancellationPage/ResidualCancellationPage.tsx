import { useRecordedData } from '../../regressionData';
import { useMemo, useRef, useState, type PointerEvent } from 'react';
import type { EChartsEvent, EChartsInstance } from "@shuku/course-style/react/visuals/EChartsChart";
import { ContentBlock, EChartsChart, Typography } from "@shuku/course-style/react";
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
  if(!data.length)return <ContentBlock shuku-edit-id="e-7111831c-1d23-470a-85c0-53bf21da0f19" title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock shuku-edit-id="e-c7d5d242-7472-4efd-a364-248787f874f1" headingLevel={1} title="误差不能直接相加" subtitle="每条预测都有偏差，为什么相加后却几乎为零？" className="rl-cancel-page">
    <div shuku-edit-id="e-76c5cae6-11dc-4c26-bf22-1a18b34e5e7a" className="rl-cancel-layout" ref={layoutRef} onPointerMove={trackPointer} onPointerLeave={() => { setHoveredIndex(null); highlight(null); }}>
      <section shuku-edit-id="e-cd1302c0-ca03-4ffd-93ee-8b610eceaf14" className="rl-cancel-observations" aria-label="各样本的有向误差">
        <header shuku-edit-id="e-404f0cc2-3c86-4d92-ae0c-d9c2926d84fa" className="rl-cancel-plot-head"><Typography shuku-edit-id="e-a78b0c5b-a14b-42ab-b372-32ed1eacf09f" variant="h3" tone="accent">误差从哪里来</Typography><div shuku-edit-id="e-2facf753-26b4-46f6-95e0-49ea31a4eabb" className="rl-cancel-legend"><span shuku-edit-id="e-30676d1d-08c3-400f-85dd-4d610a3f19c2"><i shuku-edit-id="e-526e0272-fb80-4c13-849b-1542042dddb2" className="is-line" />预测直线</span><span shuku-edit-id="e-80b70318-b5b0-4106-ad64-2da1dca343ea"><i shuku-edit-id="e-d02ba1be-af68-4adb-b0ae-3650d689b6c0" className="is-point" />观测值</span></div></header>
        <EChartsChart className="rl-cancel-chart" option={scatter} minHeight={0} onEvents={hoverEvents('scatter')} onReady={chart => { scatterChart.current = chart; highlight(hoveredIndex); }} aria-label="共享观测记录、预测直线及正负竖直误差，标注最大正误差和最大负误差" />
        <Typography shuku-edit-id="e-75cb4213-2037-4b61-a1d9-86579650360b" variant="bodySmall" tone="muted" className="rl-cancel-plot-caption">向上与向下的偏差都会影响预测</Typography>
      </section>
      <section shuku-edit-id="e-40547264-aeaa-4dca-a27d-107a22519c60" className="rl-cancel-summary" aria-label="误差抵消与总和">
        <Typography shuku-edit-id="e-377ccc87-c0de-4595-821c-a3ce1e8e0dc4" variant="h3" tone="accent">正负偏差，相互抵消</Typography>
        <div shuku-edit-id="e-4e971c55-b66b-4478-918a-6a7aaaf2e782" className="rl-cancel-bars"><EChartsChart className="rl-cancel-chart" option={bars} minHeight={0} onEvents={hoverEvents('bar')} onReady={chart => { barsChart.current = chart; highlight(hoveredIndex); }} aria-label="每条记录的正负误差，正值向上、负值向下" /></div>
        <div shuku-edit-id="e-8b4e102c-b108-47ab-a748-73313fc23cd8" className="rl-cancel-total" aria-live="polite">
          <Typography shuku-edit-id="e-5ed295e0-1f16-411d-b6f3-1c6913cd1bd5" variant="bodySmall" tone="accent" className="rl-cancel-total-title">直接求和（厘米）</Typography>
          <div shuku-edit-id="e-a23e4592-06e5-424f-bb00-926a6ba9b68d" className="rl-cancel-addends"><div shuku-edit-id="e-f1f990f8-9b56-4ae5-b7bf-105aa83de471" className="rl-cancel-positive"><Typography shuku-edit-id="e-c941ba78-c3ae-4975-b312-e90835032f38" variant="h2" tone="inherit">{signed(positiveTotal)}</Typography><Typography shuku-edit-id="e-fa67fe79-aa13-41df-b3d0-de2e06d3a3dc" variant="bodySmall" tone="accent">正误差之和</Typography></div><span shuku-edit-id="e-6a9a3aee-d445-4fc4-a9b2-e6aeace9adcb" className="rl-cancel-plus" aria-hidden="true">＋</span><div shuku-edit-id="e-f103f212-1ba4-436b-8814-9e227c8ce8ce" className="rl-cancel-negative"><Typography shuku-edit-id="e-39ecf839-1cb5-44cd-8f80-647eed5ab146" variant="h2" tone="inherit">{signed(negativeTotal)}</Typography><Typography shuku-edit-id="e-8734f84a-e801-4551-bd96-0a9b01ee892f" variant="bodySmall" tone="accent">负误差之和</Typography></div></div>
          <svg shuku-edit-id="e-bfeff1a0-128e-468a-9513-14a78cbbb4a0" className="rl-cancel-bracket" viewBox="0 0 500 26" preserveAspectRatio="none" aria-hidden="true"><path shuku-edit-id="e-560a3890-8dc9-46b9-88aa-dedabf9467e1" d="M12 2 Q12 15 30 15 H226 Q250 15 250 25 Q250 15 274 15 H470 Q488 15 488 2" fill="none" stroke="#8aa0bc" strokeWidth="2" /></svg>
          <div shuku-edit-id="e-27a9a904-2750-4788-a138-392a05dc7387" className="rl-cancel-result"><Typography shuku-edit-id="e-f2d48962-289b-49ce-80a3-b816e0aa5710" variant="bodySmall" tone="accent">相加后只剩</Typography><Typography shuku-edit-id="e-c111a38b-aa1b-487b-af5b-eaf66ec41671" variant="h1" tone="accent">{signed(sum)}<Typography shuku-edit-id="e-cc31796a-d884-44f1-8f28-7d59638462bd" as="span" variant="h3"> cm</Typography></Typography></div>
          <Typography shuku-edit-id="e-ff53fd22-04f8-4242-bfca-72e856686deb" variant="bodySmall" tone="muted" className="rl-cancel-result-note">相加的结果很小，各条误差却并不小。</Typography>
        </div>
      </section>
      {hoveredSample && <div shuku-edit-id="e-52712513-ea23-4b10-90e2-d1fbfa4cdcb6" className="rl-cancel-hover-card" role="tooltip" style={{ left: tooltipPosition.x, top: tooltipPosition.y }}>
        <Typography shuku-edit-id="e-a4b3fdf1-daaa-48ff-a866-65332a25c100" variant="body" tone="accent" className="rl-cancel-hover-heading">样本 {(hoveredIndex ?? 0) + 1}</Typography>
        <Typography shuku-edit-id="e-aecdc474-95bd-4254-9146-30a281dc51b2" variant="body" tone="muted">载重：{hoveredSample.x} 千克</Typography>
        <Typography shuku-edit-id="e-ab172a7d-cd14-497c-ac44-3320d6bfb78e" variant="body" tone="accent">观测：{hoveredSample.y.toFixed(1)} 厘米</Typography>
        <Typography shuku-edit-id="e-aeb79b4b-512e-4a7d-96a5-3ab3a52492f6" variant="body" tone="accent">预测：{hoveredSample.prediction.toFixed(1)} 厘米</Typography>
        <Typography shuku-edit-id="e-5012e4b4-d344-468f-a7d5-aa314beddc00" variant="body" tone="accent">误差：{signed(hoveredSample.e)} 厘米</Typography>
      </div>}
      <div shuku-edit-id="e-7e1ba6da-fee2-4fa0-908c-9281d690ff22" className="rl-cancel-takeaway"><Typography shuku-edit-id="e-397a1e48-32d5-46c1-964b-3fb1242bcb0f" variant="body" tone="accent">误差总和接近零，<strong shuku-edit-id="e-d6ac35d5-f726-4231-94ed-7ca7bba65b42">不代表</strong>每一次预测都准确。</Typography></div>
    </div>
  </ContentBlock>;
}
