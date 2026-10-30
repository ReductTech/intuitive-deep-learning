import { useMemo } from 'react';
import { ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import { useManualFit, useRecordedData } from '../../regressionData';
import './OptimalLinePage.css';

export function OptimalLinePage() {
  const data = useRecordedData();
  const manual = useManualFit();
  const manualSlope = manual?.w ?? 46 / 3000;
  const model = useMemo(() => {
    const n = data.length;
    const mx = n ? data.reduce((sum, p) => sum + p.mass, 0) / n : 0;
    const my = n ? data.reduce((sum, p) => sum + p.depth, 0) / n : 0;
    const xx = data.reduce((sum, p) => sum + (p.mass - mx) ** 2, 0);
    const w = xx > 0 ? data.reduce((sum, p) => sum + (p.mass - mx) * (p.depth - my), 0) / xx : 0;
    const b = my - w * mx;
    const mse = (slope: number, intercept: number) => n ? data.reduce((sum, p) => sum + (p.depth - slope * p.mass - intercept) ** 2, 0) / n : 0;
    return { xx, w, b, manualMse: mse(manualSlope, 0), optimalMse: mse(w, b) };
  }, [data, manualSlope]);
  const option = useMemo(() => ({
    animation: false, tooltip: { trigger: 'item' },
    legend: { show: false },
    grid: { left: 78, right: 30, top: 60, bottom: 70 },
    xAxis: { type: 'value', min: 0, max: 1600, interval: 500, name: '累计石重（千克）', nameLocation: 'middle', nameGap: 41, nameTextStyle: { fontSize: 25, color: '#27446e' }, axisLabel: { fontSize: 21, color: '#526582' }, axisLine: { show: true }, splitLine: { show: false } },
    yAxis: { type: 'value', min: Math.floor(Math.min(0, model.b, ...data.map(p => p.depth)) / 10) * 10, max: Math.max(30, Math.ceil(Math.max(...data.map(p => p.depth), model.w * 1500 + model.b, manualSlope * 1500) / 10) * 10), interval: 10, name: '下沉深度（厘米）', nameGap: 26, nameTextStyle: { fontSize: 25, color: '#27446e', align: 'left' }, axisLabel: { fontSize: 21, color: '#526582' }, splitLine: { lineStyle: { color: '#dfeafa', type: 'dashed' } } },
    series: [
      { name: '手动拟合', type: 'line', symbol: 'none', data: [[0, 0], [1500, manualSlope * 1500]], lineStyle: { width: 3, type: 'dashed', color: '#9aa6b5' }, silent: true },
      { name: '最小二乘', type: 'line', symbol: 'none', data: [[0, model.b], [1500, model.w * 1500 + model.b]], lineStyle: { width: 4, color: '#009eaa' }, silent: true },
      { name: '观测记录', type: 'scatter', symbolSize: 14, data: data.map(p => [p.mass, p.depth]), itemStyle: { color: '#367de8', borderWidth: 2, borderColor: '#fff' }, z: 5 },
    ],
  }), [data, manualSlope, model]);
  if (!data.length) return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  if (!model.xx) return <ContentBlock title="输入相同时，参数无法唯一确定" subtitle="请先记录不同累计石重下的观测。" />;
  return <ContentBlock headingLevel={1} title="得到最优直线" subtitle="先求斜率，再求截距，代入模型得到最优直线。" className="rl-optline-page">
    <div className="rl-optline-layout">
      <section className="rl-optline-calculation" aria-label="依次计算最优斜率与截距">
        <section className="rl-optline-result-card" aria-label="第一步：计算最优斜率">
          <div className="rl-optline-card-heading"><Typography as="span" variant="body" tone="inherit" className="rl-optline-number">1</Typography><Typography variant="h3" tone="accent">计算最优斜率</Typography></div>
          <MathFormulaBlock appearance="plain" className="rl-optline-parameter-formula" ariaLabel="利用中心化观测求最优斜率"><MathFormulaTerm latex="w^*=\frac{\sum_i(x_i-\bar x)(y_i-\bar y)}{\sum_i(x_i-\bar x)^2}" tooltip="将全部实际记录代入第14页得到的公式。输入不全相同，分母为正；计算使用未舍入数据。" /></MathFormulaBlock>
          <div className="rl-optline-value"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="w^*=" /></MathFormulaBlock><Typography variant="h2" tone="inherit">{model.w.toFixed(4)}</Typography></div>
        </section>
        <section className="rl-optline-result-card rl-optline-intercept-card" aria-label="第二步：计算最优截距">
          <div className="rl-optline-card-heading"><Typography as="span" variant="body" tone="inherit" className="rl-optline-number">2</Typography><Typography variant="h3" tone="accent">计算最优截距</Typography></div>
          <div className="rl-optline-intercept-detail">
            <MathFormulaBlock appearance="plain" className="rl-optline-parameter-formula" ariaLabel="利用最优斜率和样本均值求最优截距"><MathFormulaTerm latex="b^*=\bar y-w^*\bar x" tooltip="把刚算出的最优斜率代回截距公式，得到对应的最优截距。截距不要求为零。" /></MathFormulaBlock>
            <Typography variant="body" tone="muted" align="center">将刚求出的 w* 代入</Typography>
          </div>
          <div className="rl-optline-value"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="b^*=" /></MathFormulaBlock><Typography variant="h2" tone="inherit">{model.b.toFixed(1)}</Typography></div>
        </section>
      </section>
      <section className="rl-optline-visual" aria-label="第三步：代入参数得到最优直线，再比较拟合效果">
        <div className="rl-optline-card-heading"><Typography as="span" variant="body" tone="inherit" className="rl-optline-number rl-optline-number--result">3</Typography><Typography variant="h3" tone="accent">代入，得到最优直线</Typography></div>
        <MathFormulaBlock appearance="plain" className="rl-optline-equation" ariaLabel="将最优斜率与截距代入预测模型"><MathFormulaStatic latex={String.raw`\hat{y}=\textcolor{#009eaa}{${model.w.toFixed(4)}}x${model.b < 0 ? '-' : '+'}\textcolor{#009eaa}{${Math.abs(model.b).toFixed(1)}}`} /></MathFormulaBlock>
        <div className="rl-optline-chart-area">
          <div className="rl-optline-chart-legend"><Typography as="span" variant="body" tone="muted"><i className="rl-optline-line-key" />手动拟合</Typography><Typography as="span" variant="body" tone="accent"><i className="rl-optline-line-key is-optimal" />最小二乘</Typography></div>
          <EChartsChart option={option} className="rl-optline-chart" minHeight={0} aria-label="实际观测、已保存的手动拟合直线和最小二乘直线" />
        </div>
        <div className="rl-optline-comparison" aria-label="手动拟合与最小二乘的MSE比较">
          <Typography variant="body" tone="muted">手动拟合 MSE <strong>{model.manualMse.toFixed(1)}</strong></Typography>
          <Typography as="span" variant="body" tone="muted" aria-hidden="true">→</Typography>
          <Typography variant="body" tone="inherit" className="rl-optline-optimal-mse">最小二乘 MSE <strong>{model.optimalMse.toFixed(1)}</strong></Typography>
        </div>
      </section>
    </div>
  </ContentBlock>;
}
