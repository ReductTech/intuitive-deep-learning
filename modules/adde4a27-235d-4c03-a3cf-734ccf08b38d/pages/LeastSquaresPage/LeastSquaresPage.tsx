import { useMemo } from 'react';
import { ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
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
  if (!data.length) return <ContentBlock shuku-edit-id="e-7658a31f-2a1a-47b9-b8ef-092d6fb173d8" title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock shuku-edit-id="e-9bea063a-7b47-459e-a1c5-8225f4f925e0" headingLevel={1} title="最小二乘：从搜索到求解" subtitle="不再逐条尝试，而是求让平方误差最小的参数。" className="rl-least-page">
    <div shuku-edit-id="e-ba128cd6-2d3e-4f48-bfdb-cad2b864e78f" className="rl-least-layout">
      <section shuku-edit-id="e-5f904369-be2f-405e-8a9c-259d2cd8f545" className="rl-least-observations" aria-label="观测与预测直线之间的竖直误差">
        <Typography shuku-edit-id="e-077eec50-c8a2-4467-aefc-8c6147107b42" variant="h3" tone="accent">直线与观测之间的距离</Typography>
        <EChartsChart option={option} minHeight={0} className="rl-least-chart" aria-label="共享称象记录、最小二乘直线和每条观测的竖直误差" />
        <div shuku-edit-id="e-72981a97-2208-4663-ae1f-4fce39b34f48" className="rl-least-legend"><span shuku-edit-id="e-e4777fda-42b2-4f7d-afd9-f3506be56273"><i shuku-edit-id="e-4c2d7f05-c2a2-481a-823e-1147466b4ee5" className="is-observation" />观测值</span><span shuku-edit-id="e-9c359199-296f-4645-a1eb-36df55c24fb2"><i shuku-edit-id="e-1e6d2221-5cff-483c-ba33-e0c065fefb7b" className="is-line" />预测直线</span><span shuku-edit-id="e-8bc670f2-a1b9-49c7-94fa-460521b4d159"><i shuku-edit-id="e-932b0fbf-6f67-40b8-90ac-66acfe51e5e3" className="is-residual" />竖直误差</span></div>
      </section>
      <section shuku-edit-id="e-369f8fa1-575f-4b7f-be5d-916f1914cd9d" className="rl-least-problem" aria-label="让平方误差之和最小">
        <Typography shuku-edit-id="e-6aaae3e2-d5c7-4bdb-9ed1-528a8b64fcdc" variant="h2" tone="accent" className="rl-least-goal">让平方误差之和最小</Typography>
        <Typography shuku-edit-id="e-e45e9e66-e792-4b46-9805-f3e06ede7aa6" variant="body" tone="muted" className="rl-least-adjust">调整参数 w、b</Typography>
        <MathFormulaBlock appearance="plain" className="rl-least-objective" ariaLabel="调整斜率w和截距b，使全部观测的预测误差平方和最小">
          <MathFormulaStatic latex={'\\min_{w,b}\\sum_{i=1}^{n}'} />
          <MathFormulaTerm latex={'(y_i-\\hat{y}_i)^2'} tooltip="第i条观测值减预测值，再将差值平方。对所有观测求和；调整w、b，让这个总和最小。" />
        </MathFormulaBlock>
        <div shuku-edit-id="e-11818cb1-4f0d-4b2a-9eb5-93b4d9f7c022" className="rl-least-model"><Typography shuku-edit-id="e-6a6e1974-f7ac-46b1-a9f5-7ec0a7be5568" variant="body" tone="accent">其中</Typography><MathFormulaBlock appearance="plain" ariaLabel="预测值等于斜率乘输入加截距"><MathFormulaStatic latex={'\\hat{y}_i=wx_i+b'} /></MathFormulaBlock></div>
        <ul shuku-edit-id="e-2228f687-336f-4d7f-9cb5-c9b61e4eb6c7" className="rl-least-explanations"><li shuku-edit-id="e-6d7c4e12-cced-4d36-bdf1-d6fb7748b9c4"><Typography shuku-edit-id="e-96c03906-e3eb-4b27-b898-56f391fe6bef" variant="bodySmall" tone="muted">平方：避免正负误差相互抵消</Typography></li><li shuku-edit-id="e-40f80abd-877c-49fe-b5dc-7e1f78f756c8"><Typography shuku-edit-id="e-9b4ba4da-0432-493e-80a7-ab1cf01b7775" variant="bodySmall" tone="muted">求和：衡量整组观测的偏差</Typography></li></ul>
      </section>
    </div>
  </ContentBlock>;
}
