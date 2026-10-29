import { Star } from '@icon-park/react';
import { ELEPHANT_KG, TARGET_DEPTH_CM } from '../CaoChongPage/experiment';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Button, ContentBlock, EChartsChart, Typography, moduleAssetUrl } from '../../../shared/react';
import { getManualFit, saveManualFit, useRecordedData } from '../../showcaseRegressionData';
import './EstimateWeightPage.css';

const clamp = (value: number) => Math.max(.008, Math.min(.04, value));

export function EstimateWeightPage({ showLoss = false }: { showLoss?: boolean } = {}) {
  const calibration = useRecordedData();
  const [slope, setSlope] = useState(() => showLoss ? getManualFit(calibration)?.w ?? 46 / 3000 : 46 / 3000);
  useEffect(() => { if (showLoss && calibration.length) saveManualFit(slope, calibration); }, [showLoss, slope, calibration]);
  const [submittedMass,setSubmittedMass] = useState<number|null>(null);
  const endpointX = Math.min(3000, 48 / slope);
  const endpointY = slope * endpointX;
  const plotRef = useRef<HTMLDivElement>(null);
  // Read the student's chosen line; do not calculate a best-fit line or grade it.
  const mass = TARGET_DEPTH_CM / slope;
  const errors = calibration.map(p=>p.depth-slope*p.mass);
  const mae = errors.length ? errors.reduce((sum,e)=>sum+Math.abs(e),0)/errors.length : 0;
  const mse = errors.length ? errors.reduce((sum,e)=>sum+e*e,0)/errors.length : 0;
  const inRange = mass <= 3000;
  const difference = submittedMass === null ? 0 : Number(Math.abs(submittedMass-ELEPHANT_KG).toFixed(1));
  const stars = difference<=100 ? 3 : difference<=300 ? 2 : 1;
  const adjust = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(1, (event.clientX - rect.left - rect.width * .10) / (rect.width * .84) * 3000);
    const y = Math.max(0, (1 - (event.clientY - rect.top - rect.height * .12) / (rect.height * .74)) * 48);
    const next = clamp(y / x); setSlope(next); if (showLoss) saveManualFit(next, calibration);
  };
  const option = useMemo(() => ({
    animation: false,
    grid: { left: '10%', right: '6%', top: '12%', bottom: '14%' },
    tooltip: { trigger: 'item', formatter: (item: { value: number[] }) => `${item.value[0]} 千克 · ${item.value[1].toFixed(1)} 厘米` },
    xAxis: { type: 'value', min: 0, max: 3000, interval: 1000, name: '累计石重（千克）', nameLocation: 'middle', nameGap: 44,
      nameTextStyle: { color: '#27446e', fontSize: 28 }, axisLabel: { color: '#526582', fontSize: 24 }, axisLine: { show: true, lineStyle: { color: '#526582' } }, splitLine: { show: false } },
    yAxis: { type: 'value', min: 0, max: 48, interval: 16, name: '下沉深度（厘米）', nameGap: 25,
      nameTextStyle: { color: '#27446e', fontSize: 28, align: 'left' }, axisLabel: { color: '#526582', fontSize: 24 }, axisLine: { show: true, lineStyle: { color: '#526582' } }, splitLine: { lineStyle: { color: 'rgba(82,101,130,.16)' } } },
    series: [
      ...(showLoss ? calibration.map(p => ({ type: 'line', symbol: 'none', data: [[p.mass, slope * p.mass], [p.mass, p.depth]], lineStyle: { color: '#dda15a', width: 2, opacity: .8 }, silent: true })) : []),
      { type: 'line', symbol: 'none', data: [[0, 0], [Math.min(1500, endpointX), slope * Math.min(1500, endpointX)]], lineStyle: { color: '#168c97', width: 4 }, silent: true },
      { type: 'line', symbol: 'none', data: endpointX > 1500 ? [[1500, slope * 1500], [endpointX, endpointY]] : [], lineStyle: { color: '#168c97', width: 4, type: 'dashed' }, silent: true },
      { type: 'scatter', symbolSize: 17, data: calibration.map(p => [p.mass, p.depth]), itemStyle: { color: '#27446e', borderColor: '#fff', borderWidth: 2 }, z: 5 },
      { type: 'line', symbol: 'none', data: [[0, TARGET_DEPTH_CM], [inRange ? mass : 3000, TARGET_DEPTH_CM]], lineStyle: { color: '#ca740f', width: 2, type: 'dashed' }, silent: true },
      { type: 'line', symbol: 'none', data: inRange ? [[mass, TARGET_DEPTH_CM], [mass, 0]] : [], lineStyle: { color: '#ca740f', width: 3, type: 'dashed' }, silent: true },
      { type: 'scatter', symbolSize: 19, data: inRange ? [[mass, TARGET_DEPTH_CM]] : [], itemStyle: { color: '#ca740f' }, silent: true, z: 7 },
    ],
  }), [slope, endpointX, endpointY, inRange, mass, calibration, showLoss, TARGET_DEPTH_CM]);
  if(!calibration.length)return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock headingLevel={1} title={showLoss ? "调整直线，估计象重" : "石头不足，如何估计象重？"} subtitle={showLoss ? "让直线贴近观测，观察损失与象重估计的变化。" : "根据已有观测，选择一条直线进行估计。"} className={`aipe-showcase-rl-estimate-page${showLoss ? ' aipe-showcase-rl-estimate-challenge-page' : ''}`}
    style={{ '--aipe-showcase-rl-est-background': `url("${moduleAssetUrl('b8d86e85-2150-47e3-9e1a-aa7cc7cce15c', 'cao-chong/estimate-background.png')}")` } as CSSProperties}>
    <div className={`aipe-showcase-rl-estimate-content${showLoss ? ' aipe-showcase-rl-estimate-content--loss' : ''}`}>
    <div className="aipe-showcase-rl-estimate-layout">
      <section className="aipe-showcase-rl-estimate-plot" aria-label="调整直线并根据大象水位估计重量">
        {showLoss && <div className="aipe-showcase-rl-estimate-plot-heading"><Typography variant="h3" tone="accent">观测与预测</Typography><Typography variant="bodySmall" className="aipe-showcase-rl-estimate-drag-hint">拖动端点调整直线</Typography></div>}
        <div className="aipe-showcase-rl-estimate-plot-canvas" ref={plotRef}>
        <EChartsChart className="aipe-showcase-rl-estimate-chart" option={option} minHeight={0} aria-label="石重与下沉深度的观测记录，实线表示已测范围，虚线表示趋势延伸" />
        <button className="aipe-showcase-rl-estimate-handle" role="slider" aria-label="直线端点" aria-valuemin={.008} aria-valuemax={.04} aria-valuenow={slope} aria-valuetext={`端点：${Math.round(endpointX)} 千克，${endpointY.toFixed(1)} 厘米；方向键调整直线`} title="沿上边缘或右边缘拖动，或使用方向键调整"
          style={{ left: `${10 + endpointX / 3000 * 84}%`, top: `${12 + (1 - endpointY / 48) * 74}%` }}
          onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); adjust(event); }}
          onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) adjust(event); }}
          onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
          onKeyDown={event => {
            if (['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
              event.preventDefault();
              const next = event.key === 'Home' ? .008 : event.key === 'End' ? .04 : clamp(slope + (event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? .0002 : -.0002));
              setSlope(next); if (showLoss) saveManualFit(next, calibration);
            }
          }}><span aria-hidden="true">↗</span></button>
        <Typography className="aipe-showcase-rl-estimate-water-label" variant="bodySmall" tone="inherit" style={{top:`${12+(1-TARGET_DEPTH_CM/48)*74}%`}}>{TARGET_DEPTH_CM.toFixed(1)}</Typography>
        </div>
        {showLoss && <div className="aipe-showcase-rl-estimate-legend"><Typography variant="bodySmall"><i className="aipe-showcase-rl-estimate-legend-dot" />观测记录</Typography><Typography variant="bodySmall"><i className="aipe-showcase-rl-estimate-legend-line" />预测直线</Typography><Typography variant="bodySmall"><i className="aipe-showcase-rl-estimate-legend-error" />预测误差</Typography></div>}
      </section>
      <section className="aipe-showcase-rl-estimate-reasoning" aria-label="实时估重与可靠性问题">
        {showLoss && <div className="aipe-showcase-rl-estimate-loss-card"><Typography variant="h3" tone="accent">当前拟合损失</Typography><div className="aipe-showcase-rl-estimate-loss-strip" aria-live="polite"><div><Typography variant="body" className="aipe-showcase-rl-estimate-metric-label" title="平均绝对误差">MAE</Typography><Typography variant="h1" tone="accent">{mae.toFixed(1)}</Typography></div><div><Typography variant="body" className="aipe-showcase-rl-estimate-metric-label" title="均方误差">MSE</Typography><Typography variant="h1" tone="accent">{mse.toFixed(1)}</Typography></div></div><Typography variant="bodySmall" tone="muted" className="aipe-showcase-rl-estimate-loss-caption">调整直线时实时更新</Typography></div>}
        <div className="aipe-showcase-rl-estimate-instruction"><Typography variant="h3" tone="accent">用直线估计象重</Typography><Typography variant="bodySmall" tone="muted">{showLoss ? "拖动端点，尝试降低 MAE 或 MSE，再观察象重估计。" : "拖动端点，使直线贴近散点的整体趋势。"}</Typography></div>
        <div className="aipe-showcase-rl-estimate-estimation"><Typography variant={showLoss ? "h3" : "body"} tone="accent">{showLoss ? "当前估计象重" : `下沉 ${TARGET_DEPTH_CM.toFixed(1)} 厘米，对应的估计重量`}</Typography>
          <div className="aipe-showcase-rl-estimate-value" aria-live="polite"><Typography variant="h1" tone="accent">{showLoss ? <>{mass.toFixed(1)}<Typography as="span" variant="h3"> 千克</Typography></> : `约 ${mass.toFixed(1)} 千克`}</Typography>{!showLoss && <Typography variant="bodySmall" tone="muted">随所选直线实时变化</Typography>}</div>
          {showLoss && <Typography variant="bodySmall" tone="muted">{inRange ? `由 ${TARGET_DEPTH_CM.toFixed(1)} 厘米水位反推` : '交点位于图示范围之外。'}</Typography>}
          {!showLoss && !inRange && <Typography variant="bodySmall" tone="muted">交点位于图示范围之外。</Typography>}
        </div>
        {showLoss ? <div className="aipe-showcase-rl-estimate-question aipe-showcase-rl-estimate-game">
          {submittedMass === null ? <><Typography variant="h3" tone="accent">这次估重有多准确？</Typography><Typography variant="bodySmall" tone="muted">调整直线后，提交当前估计，揭晓模拟中的真实象重。</Typography><Button variant="primary" onClick={()=>{ saveManualFit(slope, calibration); setSubmittedMass(mass); }}>揭晓真实象重</Button></> : <>
            <div className="aipe-showcase-rl-estimate-stars" aria-label={`${stars}星评价`}><span className="aipe-showcase-rl-estimate-star-icons">{[1,2,3].map(n=><Star key={n} theme={n<=stars?'filled':'outline'} size={30} fill={n<=stars?'#df9326':'#bac7d6'} />)}</span><Typography variant="h3" tone="accent">{stars===3?'估计准确':stars===2?'接近真实重量':'继续调整试试'}</Typography></div>
            <div className="aipe-showcase-rl-estimate-game-values"><div><Typography variant="bodySmall" tone="muted">真实象重</Typography><Typography variant="h3" tone="accent">{ELEPHANT_KG.toFixed(1)}<Typography as="span" variant="bodySmall"> 千克</Typography></Typography></div><div><Typography variant="bodySmall" tone="muted">{submittedMass===ELEPHANT_KG ? "估重" : submittedMass>ELEPHANT_KG ? "高估" : "低估"}偏差</Typography><Typography variant="h3" className="aipe-showcase-rl-estimate-bias">{difference.toFixed(1)}<Typography as="span" variant="bodySmall"> 千克</Typography></Typography></div></div>
            <Button onClick={()=>setSubmittedMass(null)}>重新挑战</Button>
          </>}
          <Typography className="aipe-showcase-rl-estimate-rating-rule" variant="bodySmall" tone="muted">偏差（千克）：≤100 三星 · ≤300 两星 · &gt;300 一星</Typography>
        </div> : <div className="aipe-showcase-rl-estimate-question"><Typography variant="h2" tone="accent">怎样判断估计是否可靠？</Typography><Typography variant="body">大象的真实重量未知，无法直接核对。</Typography><Typography variant="bodySmall" tone="accent">能否先检验这条直线对已有石重记录的预测？</Typography></div>}
      </section>
    </div>
    {showLoss && <Typography variant="bodySmall" tone="accent" className="aipe-showcase-rl-estimate-takeaway">损失衡量已有记录的拟合程度，象重则来自直线的外推。</Typography>}
    </div>
  </ContentBlock>;
}
