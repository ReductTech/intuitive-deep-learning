import { useMemo, useState } from 'react';
import { Button, ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, RangeControl, Typography } from '../../../shared/react';
import { useRecordedData } from '../../regressionData';
import { InterceptLossPlot } from './InterceptLossPlot';
import './OptimalInterceptPage.css';
const fixedSlope = .014;
export function OptimalInterceptPage() {
  const data = useRecordedData();
  const [offset, setOffset] = useState(1.3);
  const model = useMemo(() => {
    const n = data.length;
    const meanX = n ? data.reduce((s, p) => s + p.mass, 0) / n : 0;
    const meanY = n ? data.reduce((s, p) => s + p.depth, 0) / n : 0;
    const optimalB = meanY - fixedSlope * meanX;
    const minimum = data.reduce((s, p) => s + (p.depth - fixedSlope * p.mass - optimalB) ** 2, 0);
    return { n, optimalB, minimum };
  }, [data]);
  const b = model.optimalB + offset;
  const predictionOption = useMemo(() => ({
    animation: false, tooltip: { trigger: 'item' },
    grid: { left: 65, right: 24, top: 50, bottom: 49 },
    xAxis: { type: 'value', min: 0, max: 1600, interval: 500, name: '石重（千克）', nameLocation: 'middle', nameGap: 27, nameTextStyle: { fontSize: 19, color: '#27446e' }, axisLabel: { fontSize: 17 }, splitLine: { show: false } },
    yAxis: { type: 'value', min: Math.min(0, Math.floor(b / 5) * 5), max: Math.max(30, Math.ceil((fixedSlope * 1600 + b) / 10) * 10), name: '深度（厘米）', nameGap: 18, nameTextStyle: { fontSize: 18, color: '#27446e', align: 'left' }, axisLabel: { fontSize: 17 }, splitLine: { lineStyle: { color: '#e5edf6' } } },
    series: [
      { type: 'line', symbol: 'none', connectNulls: false, data: data.flatMap(p => [[p.mass, p.depth], [p.mass, fixedSlope * p.mass + b], [null, null]]), lineStyle: { color: '#ed9867', width: 2 }, silent: true },
      { type: 'line', symbol: 'none', data: [[0, b], [1600, fixedSlope * 1600 + b]], lineStyle: { color: '#009eaa', width: 4 }, silent: true },
      { type: 'scatter', data: data.map(p => [p.mass, p.depth]), symbolSize: 12, itemStyle: { color: '#367de8' } },
    ],
  }), [data, b]);
  if (!data.length) return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock headingLevel={1} title="先求最优截距" subtitle="固定斜率，调整直线上下位置，寻找平方误差最小的位置。" className="rl-intercept-page">
    <div className="rl-intercept-layout">
      <div className="rl-intercept-control"><RangeControl label="调整预测直线的截距 b" value={b} min={Math.min(model.optimalB - 6, b)} max={Math.max(model.optimalB + 6, b)} step={.1} digits={1} prefix="当前 b = " onChange={e => setOffset(Number(e.currentTarget.value) - model.optimalB)} /><Button onClick={() => setOffset(0)}>定位最低点</Button></div>
      <section className="rl-intercept-visual">
        <div className="rl-intercept-plot-intro"><Typography variant="h3" tone="accent">改变截距 b，直线上下移动</Typography><MathFormulaBlock appearance="plain" className="rl-intercept-b-label"><MathFormulaTerm latex={String.raw`w=${fixedSlope}`} tooltip="斜率固定为0.014。改变截距b只会使这条直线上下平移，橙色竖线是各条记录的误差。" /></MathFormulaBlock></div>
        <EChartsChart option={predictionOption} minHeight={0} className="rl-intercept-prediction-chart" aria-label="固定斜率的预测直线，橙色竖线表示误差" />
      </section>
      <div className="rl-intercept-link"><Typography variant="h2" tone="accent">↔</Typography></div>
      <section className="rl-intercept-visual">
        <Typography variant="h3" tone="accent">每个截距 b，对应一个平方误差总和</Typography>
        <InterceptLossPlot n={model.n} optimum={model.optimalB} minimum={model.minimum} b={b} onChange={value => setOffset(value - model.optimalB)} />
      </section>
      <section className="rl-intercept-derivation" aria-label="最优截距的三步推导">
        <div className="rl-intercept-step"><div className="rl-intercept-heading"><span className="rl-intercept-number"><Typography as="span" variant="body" tone="inherit">1</Typography></span><Typography variant="h3" tone="accent">建立目标</Typography></div><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="S(b;w)" tooltip="固定w后，把全部观测的平方误差之和看成关于截距b的函数。" /><MathFormulaStatic latex="=" /><MathFormulaTerm latex="\sum_{i=1}^{n}" tooltip="对第一页全部实际记录求和。" /><MathFormulaTerm latex="(y_i-wx_i-b)^2" tooltip="每条橙色竖线对应一个观测误差，平方后相加得到右图的高度。" /></MathFormulaBlock></div>
        <div className="rl-intercept-step"><div className="rl-intercept-heading"><span className="rl-intercept-number"><Typography as="span" variant="body" tone="inherit">2</Typography></span><Typography variant="h3" tone="accent">对 b 求导</Typography></div><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="S'(b)" tooltip="右图在当前点的切线斜率，描述增大b时平方和的变化率。" /><MathFormulaStatic latex="=" /><MathFormulaTerm latex="-2" tone="warm" tooltip="链式法则：外层平方求导得到2，内层−b求导得到−1，因此出现−2。" /><MathFormulaTerm latex="\sum_{i=1}^{n}(y_i-wx_i-b)" tooltip="将每个平方误差的导数相加。" /></MathFormulaBlock></div>
        <div className="rl-intercept-step rl-intercept-result"><div className="rl-intercept-heading"><span className="rl-intercept-number"><Typography as="span" variant="body" tone="inherit">3</Typography></span><Typography variant="h3" tone="accent">令导数为零</Typography></div><MathFormulaBlock appearance="plain" className="rl-intercept-stationary"><MathFormulaTerm latex="S'(b)=0" tooltip="因此Σ(yᵢ−wxᵢ−b)=0，整理得到nb=Σyᵢ−wΣxᵢ，两边除以n即得到下方答案。" /><MathFormulaStatic latex="\Longrightarrow" /></MathFormulaBlock><MathFormulaBlock appearance="plain" className="rl-intercept-answer"><MathFormulaTerm latex="b^*(w)" tooltip="给定斜率w时使平方误差最小的截距，不是右侧抛物线的截距。" tooltipPlacement="top" /><MathFormulaStatic latex="=" /><MathFormulaTerm latex="\bar y" tooltip="全部观测深度的平均值。" tooltipPlacement="top" /><MathFormulaStatic latex="-" /><MathFormulaTerm latex="w" tooltip="本页固定的预测直线斜率。" tooltipPlacement="top" /><MathFormulaTerm latex="\bar x" tooltip="全部累计石重的平均值。" tooltipPlacement="top" /></MathFormulaBlock></div>
      </section>
    </div>
  </ContentBlock>;
}


