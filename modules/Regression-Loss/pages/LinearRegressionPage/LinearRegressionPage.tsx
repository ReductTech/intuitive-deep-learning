import { useMemo, useState, type CSSProperties } from 'react';
import { ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, RangeControl, Typography, moduleAssetUrl } from '../../../shared/react';
import { useRecordedData } from '../../regressionData';
import './LinearRegressionPage.css';

export function LinearRegressionPage() {
  const calibration = useRecordedData();
  const selected = 4;
  const [w, setW] = useState(.016);
  const [b, setB] = useState(0);
  const point = calibration[Math.min(selected,calibration.length-1)] ?? {mass:0,depth:0};
  const predicted = w * point.mass + b;
  const option = useMemo(() => ({
    animation: false,
    grid: { left: 80, right: 45, top: 65, bottom: 75 },
    xAxis: { type: 'value', min: 0, max: 1750, interval: 500, name: '累计石重（千克）', nameLocation: 'middle', nameGap: 43,
      nameTextStyle: { color: '#27446e', fontSize: 27 }, axisLabel: { color: '#526582', fontSize: 22 }, axisLine: { show: true }, splitLine: { show: false } },
    yAxis: { type: 'value', min: 0, max: 48, interval: 16, name: '下沉深度（厘米）', nameGap: 24,
      nameTextStyle: { color: '#27446e', fontSize: 27, align: 'left' }, axisLabel: { color: '#526582', fontSize: 22 }, axisLine: { show: true }, splitLine: { lineStyle: { color: '#dfe6ec' } } },
    series: [
      { type: 'line', symbol: 'none', data: [[0, b], [1750, w * 1750 + b]], lineStyle: { color: '#168c97', width: 4 }, silent: true },
      { type: 'scatter', symbolSize: 14, data: calibration.filter((_, i) => i !== selected).map(p => [p.mass, p.depth]), itemStyle: { color: '#64748b' }, silent: true },
      { type: 'line', symbol: 'none', data: [[point.mass, 0], [point.mass, Math.max(point.depth, predicted)]], lineStyle: { color: '#75849b', width: 1, type: 'dashed' }, silent: true },
      { type: 'scatter', symbolSize: 16, data: [[point.mass, point.depth]], itemStyle: { color: '#c06d17', borderWidth: 2, borderColor: '#fff' }, label: { show: true, position: predicted >= point.depth ? 'bottom' : 'top', offset: [-55, predicted >= point.depth ? 15 : -15], formatter: `观测 y = ${point.depth.toFixed(1)}`, color: '#a65a0d', fontSize: 24 }, silent: true, z: 6 },
      { type: 'scatter', symbolSize: 22, data: [[point.mass, predicted]], itemStyle: { color: 'rgba(255,255,255,0)', borderWidth: 3, borderColor: '#168c97' }, label: { show: true, position: predicted >= point.depth ? 'top' : 'bottom', offset: [-25, predicted >= point.depth ? -15 : 15], formatter: `预测 ŷ = ${predicted.toFixed(1)}`, color: '#168c97', fontSize: 24 }, silent: true, z: 7 },
    ],
  }), [point, predicted, selected, w, b]);
  if(!calibration.length)return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock headingLevel={1} title="线性回归模型" subtitle="以对参数线性的模型描述因变量的条件均值。" className="rl-linear-page" style={{ '--rl-linear-background': `url("${moduleAssetUrl('adde4a27-235d-4c03-a3cf-734ccf08b38d', 'cao-chong/estimate-background.png')}")` } as CSSProperties}>
    <div className="rl-linear-layout">
      <section className="rl-linear-data" aria-label="观测数据与可调预测直线">
        <EChartsChart className="rl-linear-chart" option={option} minHeight={0} aria-label={`载重 ${point.mass} 千克，观测深度 ${point.depth.toFixed(1)} 厘米，预测深度 ${predicted.toFixed(1)} 厘米`} />
      </section>
      <section className="rl-linear-controls" aria-label="预测公式与模型参数">
        <MathFormulaBlock appearance="plain" className="rl-linear-model" ariaLabel="预测值等于斜率乘输入加截距"><MathFormulaStatic latex="\hat{y}=wx+b" /></MathFormulaBlock>
        <div className="rl-linear-variables">
          <div><MathFormulaStatic latex="x" /><Typography variant="bodySmall">输入：累计石重（千克）</Typography></div>
          <div><MathFormulaStatic latex="y" /><Typography variant="bodySmall">观测：实测下沉深度（厘米）</Typography></div>
          <div><MathFormulaStatic latex="\hat{y}" /><Typography variant="bodySmall">预测：模型计算的下沉深度（厘米）</Typography></div>
        </div>
        <div className="rl-linear-parameter"><RangeControl label="w：斜率" aria-label="斜率 w" min={.008} max={.024} step={.001} digits={3} suffix=" 厘米/千克" value={w} onChange={event => setW(Number(event.target.value))} /><Typography variant="bodySmall" tone="muted">w 增大，直线变陡。</Typography></div>
        <div className="rl-linear-parameter"><RangeControl label="b：截距" aria-label="截距 b" min={0} max={6} step={.5} digits={1} suffix=" 厘米" value={b} onChange={event => setB(Number(event.target.value))} /><Typography variant="bodySmall" tone="muted">b 增大，直线整体上移。</Typography></div>
        <Typography variant="bodySmall" tone="muted">参数由观测数据估计；此处通过手动调整观察其作用。</Typography>
      </section>
    </div>
  </ContentBlock>;
}
