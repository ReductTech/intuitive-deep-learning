import { useMemo } from 'react';
import { ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import { useRecordedData } from '../../regressionData';
import './LeastSquaresPage.css';

export function LeastSquaresPage() {
  const data = useRecordedData();
  const model = useMemo(() => {
    const n = data.length;
    const mx = n ? data.reduce((s, p) => s + p.mass, 0) / n : 0;
    const my = n ? data.reduce((s, p) => s + p.depth, 0) / n : 0;
    const xx = data.reduce((s, p) => s + (p.mass - mx) ** 2, 0);
    const w = xx ? data.reduce((s, p) => s + (p.mass - mx) * (p.depth - my), 0) / xx : 0;
    return { w, b: my - w * mx };
  }, [data]);
  const sample = data[Math.floor(data.length / 2)];
  const samplePrediction = sample ? model.w * sample.mass + model.b : 0;
  const option = useMemo(() => ({
    animation: false,
    tooltip: { trigger: 'item' },
    grid: { left: 73, right: 22, top: 48, bottom: 78 },
    xAxis: { type: 'value', min: 0, max: 1600, interval: 500, name: '累计石重 x（千克）', nameLocation: 'middle', nameGap: 39, nameTextStyle: { fontSize: 24, color: '#27446e' }, axisLabel: { fontSize: 21, color: '#526582' }, axisLine: { show: true }, splitLine: { show: false } },
    yAxis: { type: 'value', min: Math.min(0, Math.floor(model.b / 5) * 5), max: Math.max(30, Math.ceil(Math.max(...data.map(p => p.depth), model.w * 1600 + model.b) / 10) * 10), interval: 10, name: '下沉深度（厘米）', nameGap: 25, nameTextStyle: { fontSize: 24, color: '#27446e', align: 'left' }, axisLabel: { fontSize: 21, color: '#526582' }, axisLine: { show: true }, splitLine: { lineStyle: { color: '#e6edf5' } } },
    series: [
      { name: '误差', type: 'line', symbol: 'none', connectNulls: false, data: data.flatMap(p => [[p.mass, p.depth], [p.mass, model.w * p.mass + model.b], [null, null]]), lineStyle: { color: '#aebbc9', width: 2 }, silent: true, z: 2 },
      { name: '最优直线', type: 'line', symbol: 'none', data: [[0, model.b], [1600, model.w * 1600 + model.b]], lineStyle: { color: '#168c97', width: 4 }, silent: true, z: 3 },
      { name: '观测值', type: 'scatter', symbolSize: 13, data: data.map(p => [p.mass, p.depth]), itemStyle: { color: '#668bb2', borderColor: '#fff', borderWidth: 2 }, z: 5, tooltip: { formatter: (p: { value: number[] }) => { const [x, y] = p.value; const prediction = model.w * x + model.b; return `石重：${x.toFixed(1)} 千克<br/>观测：${y.toFixed(1)} 厘米<br/>预测：${prediction.toFixed(1)} 厘米<br/>误差：${(y - prediction).toFixed(1)} 厘米`; } } },
      { type: 'line', symbol: 'none', data: sample ? [[sample.mass, sample.depth], [sample.mass, samplePrediction]] : [], lineStyle: { color: '#168c97', width: 3 }, silent: true, z: 6 },
      { type: 'scatter', symbolSize: 16, data: sample ? [[sample.mass, samplePrediction]] : [], itemStyle: { color: '#fff', borderColor: '#168c97', borderWidth: 3 }, label: { show: true, formatter: '竖直误差', position: 'right', distance: 16, color: '#27446e', fontSize: 22 }, silent: true, z: 7 },
    ],
  }), [data, model, sample, samplePrediction]);
  if (!data.length) return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock headingLevel={1} title="最小二乘：从搜索到求解" subtitle="不再逐条尝试，而是求让平方误差最小的参数。" className="rl-least-page">
    <div className="rl-least-layout">
      <section className="rl-least-observations" aria-label="观测与预测直线之间的竖直误差">
        <Typography variant="h3" tone="accent">直线与观测之间的距离</Typography>
        <EChartsChart option={option} minHeight={0} className="rl-least-chart" aria-label="共享称象记录、最小二乘直线和每条观测的竖直误差" />
        <div className="rl-least-legend"><span><i className="is-observation" />观测值</span><span><i className="is-line" />预测直线</span><span><i className="is-residual" />竖直误差</span></div>
      </section>
      <section className="rl-least-problem" aria-label="让平方误差之和最小">
        <Typography variant="h2" tone="accent" className="rl-least-goal">让平方误差之和最小</Typography>
        <Typography variant="body" tone="muted" className="rl-least-adjust">调整参数 w、b</Typography>
        <MathFormulaBlock appearance="plain" className="rl-least-objective" ariaLabel="调整斜率w和截距b，使全部观测的预测误差平方和最小">
          <MathFormulaStatic latex={'\\min_{w,b}\\sum_{i=1}^{n}'} />
          <MathFormulaTerm latex={'(y_i-\\hat{y}_i)^2'} tooltip="第i条观测值减预测值，再将差值平方。对所有观测求和；调整w、b，让这个总和最小。" />
        </MathFormulaBlock>
        <div className="rl-least-model"><Typography variant="body" tone="accent">其中</Typography><MathFormulaBlock appearance="plain" ariaLabel="预测值等于斜率乘输入加截距"><MathFormulaStatic latex={'\\hat{y}_i=wx_i+b'} /></MathFormulaBlock></div>
        <ul className="rl-least-explanations"><li><Typography variant="bodySmall" tone="muted">平方：避免正负误差相互抵消</Typography></li><li><Typography variant="bodySmall" tone="muted">求和：衡量整组观测的偏差</Typography></li></ul>
      </section>
    </div>
  </ContentBlock>;
}
