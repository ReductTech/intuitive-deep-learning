import { useMemo, useState } from 'react';
import { Button, ExplainPanelButton, ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import { useRecordedData } from '../../regressionData';
import './PredictionErrorPage.css';

const toY = (depth: number) => 12 + (1 - depth / 40) * 74;

export function PredictionErrorPage() {
  const calibration = useRecordedData();
  const sample = calibration[Math.min(4,calibration.length-1)] ?? {mass:0,depth:0};
  const plotX = 10 + sample.mass / 1750 * 84;
  const [overestimate, setOverestimate] = useState(false);
  const w = overestimate ? .020 : .010;
  const b = 2;
  const predicted = w * sample.mass + b;
  const residual = sample.depth - predicted;
  const signed = `${residual > 0 ? '+' : ''}${residual.toFixed(1)}`;
  const option = useMemo(() => ({
    animation: false,
    grid: { left: '10%', right: '6%', top: '12%', bottom: '14%' },
    xAxis: { type: 'value', min: 0, max: 1750, interval: 500, name: '累计石重（千克）', nameLocation: 'middle', nameGap: 43,
      nameTextStyle: { color: '#27446e', fontSize: 27 }, axisLabel: { color: '#526582', fontSize: 23 }, axisLine: { show: true }, splitLine: { show: false } },
    yAxis: { type: 'value', min: 0, max: 40, interval: 10, name: '下沉深度（厘米）', nameGap: 24,
      nameTextStyle: { color: '#27446e', fontSize: 27, align: 'left' }, axisLabel: { color: '#526582', fontSize: 23 }, axisLine: { show: true }, splitLine: { lineStyle: { color: '#dfe6ec' } } },
    series: [
      { type: 'line', symbol: 'none', data: [[0, b], [1750, w * 1750 + b]], lineStyle: { color: '#168c97', width: 4 }, silent: true },
      { type: 'scatter', symbolSize: 15, data: calibration.filter(p => p.mass !== sample.mass).map(p => [p.mass, p.depth]), itemStyle: { color: '#7aace5' }, silent: true },
      { type: 'line', symbol: 'none', data: [[sample.mass, sample.depth], [sample.mass, predicted]], lineStyle: { color: '#df7a20', width: 2, type: 'dashed' }, silent: true },
      { type: 'scatter', symbolSize: 20, data: [[sample.mass, sample.depth]], itemStyle: { color: '#df7a20', borderWidth: 2, borderColor: '#fff' }, label: { show: true, position: overestimate ? 'bottom' : 'top', offset: [-40, overestimate ? 13 : -13], formatter: `观测 y = ${sample.depth.toFixed(1)}`, color: '#b35d0b', fontSize: 25 }, silent: true, z: 7 },
      { type: 'scatter', symbolSize: 20, data: [[sample.mass, predicted]], itemStyle: { color: '#168c97', borderWidth: 2, borderColor: '#fff' }, label: { show: true, position: overestimate ? 'top' : 'bottom', offset: [-20, overestimate ? -13 : 13], formatter: `预测 ŷ = ${predicted.toFixed(1)}`, color: '#168c97', fontSize: 25 }, silent: true, z: 7 },
    ],
  }), [w, b, predicted, overestimate]);
  if(!calibration.length)return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock headingLevel={1} title="预测误差" subtitle="在同一载重下，比较预测结果与观测记录的差距。" className="rl-error-page">
    <div className="rl-error-layout">
      <section className="rl-error-plot" aria-label="同一载重下的观测值、预测值和误差">
        <EChartsChart className="rl-error-chart" option={option} minHeight={0} aria-label={`载重${sample.mass}千克，观测${sample.depth.toFixed(1)}厘米，预测${predicted.toFixed(1)}厘米，误差${signed}厘米`} />
        <svg className="rl-error-arrow" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
          <defs><marker id="rl-error-arrow-tip" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M0 0L8 4L0 8Z" fill="#27446e" /></marker></defs>
          <path d={`M${(plotX + 2) * 10} ${Math.min(toY(sample.depth), toY(predicted)) * 10 + 8}V${Math.max(toY(sample.depth), toY(predicted)) * 10 - 8}`} stroke="#27446e" strokeWidth="3" fill="none" markerStart="url(#rl-error-arrow-tip)" markerEnd="url(#rl-error-arrow-tip)" />
        </svg>
        <div className="rl-error-gap" style={{ left: `${plotX + 4}%`, top: `${(toY(sample.depth) + toY(predicted)) / 2}%` }}><Typography variant="bodySmall" tone="accent">误差</Typography><Typography variant="h3" tone="accent">e = {signed}</Typography></div>
        <Typography className="rl-error-input" variant="bodySmall" tone="accent">固定载重：{sample.mass} 千克</Typography>
      </section>
      <section className="rl-error-notes" aria-label="误差计算与解释">
        <div className="rl-error-card rl-error-definition"><Typography variant="h3" tone="accent">误差的计算</Typography><MathFormulaBlock appearance="plain" ariaLabel="误差等于观测值减预测值"><MathFormulaStatic latex="e=y-\hat{y}" /></MathFormulaBlock></div>
        <div className="rl-error-card rl-error-sample"><Typography variant="h3" tone="accent">当前记录</Typography>
          <div className="rl-error-values"><div><Typography variant="bodySmall" tone="accent">观测值 y</Typography><Typography variant="h3" tone="inherit" className="rl-error-observed">{sample.depth.toFixed(1)} 厘米</Typography></div><div><Typography variant="bodySmall" tone="accent">预测值 ŷ</Typography><Typography variant="h3" tone="inherit" className="rl-error-predicted">{predicted.toFixed(1)} 厘米</Typography></div></div>
          <div className="rl-error-result"><Typography variant="h2" tone="accent">e = {signed} 厘米</Typography></div>
        </div>
        <div className="rl-error-card rl-error-direction"><div><Typography variant="h3" tone="accent">{residual > 0 ? '误差为正：预测偏小' : residual < 0 ? '误差为负：预测偏大' : '误差为零：预测与观测一致'}</Typography><Typography variant="bodySmall" tone="muted">{residual > 0 ? '观测值大于预测值。' : residual < 0 ? '观测值小于预测值。' : '观测值等于预测值。'}</Typography><Button onClick={() => setOverestimate(value => !value)}>{overestimate ? '观察低估示例' : '观察高估示例'}</Button></div>
          <div className="rl-error-mini" aria-hidden="true"><svg viewBox="0 0 130 110"><path d="M10 94L120 65" stroke="#168c97" strokeWidth="4" fill="none"/><path d={overestimate ? 'M53 82V98' : 'M53 20V82'} stroke="#df7a20" strokeWidth="2" strokeDasharray="5 4"/><circle cx="53" cy="82" r="9" fill="#168c97" stroke="white" strokeWidth="2"/><circle cx="53" cy={overestimate ? 98 : 20} r="9" fill="#df7a20" stroke="white" strokeWidth="2"/></svg><MathFormulaStatic latex={overestimate ? 'e<0' : 'e>0'} /></div>
        </div>
      </section>
      <div className="rl-error-takeaway"><svg className="rl-error-bulb" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="#c7dcfa"/><path d="M14 24C6 13 17 6 23 11C29 14 29 19 25 24L24 29H16L14 24ZM17 32H23M17 28V20L14 17M23 28V20L26 17" fill="none" stroke="#27446e" strokeWidth="2" strokeLinecap="round"/></svg><Typography variant="body" tone="accent">误差有方向、有大小，单位与观测值相同。</Typography><div className="rl-error-term-note"><Typography variant="bodySmall" tone="muted">这里的“误差”严格指残差。</Typography><ExplainPanelButton label="了解误差与残差的区别"><Typography variant="h3" tone="accent">为什么称为残差？</Typography><Typography variant="bodySmall">观测值减去模型预测值，统计学中称为残差。本页先用“误差”帮助理解预测偏差，实际计算的是残差；它不同于观测值与未知真实回归关系之间的统计误差。</Typography></ExplainPanelButton></div></div>
    </div>
  </ContentBlock>;
}
