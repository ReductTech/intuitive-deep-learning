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
  const option = useMemo(() => ({
    animation: false,
    tooltip: { trigger: 'item' },
    legend: { bottom: 7, data: ['观测值', '最优直线', '误差'], itemGap: 23, textStyle: { fontSize: 20, color: '#27446e' } },
    grid: { left: 73, right: 22, top: 70, bottom: 113 },
    xAxis: { type: 'value', min: 0, max: 1600, interval: 500, name: '累计石重（千克）', nameLocation: 'middle', nameGap: 39, nameTextStyle: { fontSize: 24, color: '#27446e' }, axisLabel: { fontSize: 21, color: '#526582' }, axisLine: { show: true }, splitLine: { show: false } },
    yAxis: { type: 'value', min: Math.min(0, Math.floor(model.b / 5) * 5), max: Math.max(30, Math.ceil(Math.max(...data.map(p => p.depth), model.w * 1600 + model.b) / 10) * 10), interval: 10, name: '下沉深度（厘米）', nameGap: 25, nameTextStyle: { fontSize: 24, color: '#27446e', align: 'left' }, axisLabel: { fontSize: 21, color: '#526582' }, axisLine: { show: true }, splitLine: { lineStyle: { color: '#e6edf5' } } },
    series: [
      { name: '误差', type: 'line', symbol: 'none', connectNulls: false, data: data.flatMap(p => [[p.mass, p.depth], [p.mass, model.w * p.mass + model.b], [null, null]]), lineStyle: { color: '#ed9660', width: 2.5, type: 'dashed' }, silent: true, z: 2 },
      { name: '最优直线', type: 'line', symbol: 'none', data: [[0, model.b], [1600, model.w * 1600 + model.b]], lineStyle: { color: '#009eaa', width: 4 }, silent: true, z: 3 },
      { name: '观测值', type: 'scatter', symbolSize: 13, data: data.map(p => [p.mass, p.depth]), itemStyle: { color: '#367de8', borderColor: '#fff', borderWidth: 2 }, z: 5, tooltip: { formatter: (p: { value: number[] }) => { const [x, y] = p.value; const prediction = model.w * x + model.b; return `石重：${x.toFixed(1)} 千克<br/>观测：${y.toFixed(1)} 厘米<br/>预测：${prediction.toFixed(1)} 厘米<br/>误差：${(y - prediction).toFixed(1)} 厘米`; } } },
    ],
  }), [data, model]);
  if (!data.length) return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock headingLevel={1} title="最小二乘：从搜索到求解" subtitle="能否不再逐条尝试，而是直接求出最优参数？" className="rl-least-page">
    <div className="rl-least-layout">
      <section className="rl-least-observations">
        <Typography variant="h3" tone="accent">最优直线与误差</Typography>
        <EChartsChart option={option} minHeight={0} className="rl-least-chart" aria-label="实际称象记录、最小二乘最优直线及每条记录的竖直误差线" />
      </section>
      <section className="rl-least-problem" aria-label="最小二乘目标与参数估计">
        <div className="rl-least-givens">
          <div><Typography variant="bodySmall" tone="muted">固定观测</Typography><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="\{(x_i,y_i)\}_{i=1}^{n}" tooltip="第一页记录的全部样本。xᵢ为累计石重，yᵢ为实测深度，n为记录数。求解时保持数据固定。" /></MathFormulaBlock></div>
          <div><Typography variant="bodySmall" tone="muted">求解参数</Typography><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="w" tooltip="待求斜率：载重每增加一千克，预测深度增加多少厘米。" /><MathFormulaStatic latex="," /><MathFormulaTerm latex="b" tooltip="待求截距：载重为零时模型预测的深度。" /></MathFormulaBlock></div>
        </div>
        <div className="rl-least-objective-area">
          <Typography variant="h3" tone="accent">平方误差之和</Typography>
          <MathFormulaBlock appearance="plain" className="rl-least-objective" ariaLabel="对全部观测的误差平方求和">
            <MathFormulaTerm latex="S(w,b)" tooltip="关于斜率与截距的目标函数，单位为平方厘米。" /><MathFormulaStatic latex="=" /><MathFormulaTerm latex="\sum_{i=1}^{n}" tooltip="全部记录参与求和，而不是只使用某一个点。" /><MathFormulaStatic latex="(" /><MathFormulaTerm latex="y_i" tooltip="第i条记录的实际观测深度。" tone="warm" /><MathFormulaStatic latex="-" /><MathFormulaTerm latex="wx_i" tooltip="斜率乘第i条记录的累计石重；模型预测为wxᵢ+b。" /><MathFormulaStatic latex="-" /><MathFormulaTerm latex="b" tooltip="截距。观测减预测yᵢ−(wxᵢ+b)展开为yᵢ−wxᵢ−b。" /><MathFormulaStatic latex=")^2" />
          </MathFormulaBlock>
          <Typography variant="bodySmall" tone="muted">将每条竖直误差平方，再对全部记录求和。</Typography>
        </div>
        <div className="rl-least-solution-area">
          <Typography variant="body" tone="accent">寻找使平方和最小的参数</Typography>
          <MathFormulaBlock appearance="plain" className="rl-least-solution" ariaLabel="最优参数是目标函数的最小化参数">
            <MathFormulaTerm latex="(w^*,b^*)" tooltip="使平方误差之和最小的参数，星号不代表误差为零。" /><MathFormulaStatic latex="=" /><MathFormulaTerm latex="\underset{w,b}{\operatorname{arg\,min}}" tooltip="在斜率与截距的所有取值中寻找最小化参数。arg min返回参数，而min返回目标值。样本数固定时，这也使MSE最小。" /><MathFormulaTerm latex="S(w,b)" tooltip="最小二乘的优化目标是同一批数据上的平方误差之和。" />
          </MathFormulaBlock>
          <Typography variant="bodySmall" tone="muted">这就是最小二乘估计。</Typography>
        </div>
      </section>
    </div>
  </ContentBlock>;
}
