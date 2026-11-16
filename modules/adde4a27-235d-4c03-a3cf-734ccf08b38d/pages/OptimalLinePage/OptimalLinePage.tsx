import { useMemo } from 'react';
import { ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
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
  if (!data.length) return <ContentBlock shuku-edit-id="e-4c50cd4c-e463-4612-9c78-249882c5984f" title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  if (!model.xx) return <ContentBlock shuku-edit-id="e-c34cd848-e55b-4422-84f5-8fdeb32ed051" title="输入相同时，参数无法唯一确定" subtitle="请先记录不同累计石重下的观测。" />;
  return <ContentBlock shuku-edit-id="e-bca40ebd-5ecb-4f29-8ed2-feb2f6d9daef" headingLevel={1} title="得到最优直线" subtitle="先求斜率，再求截距，代入模型得到最优直线。" className="rl-optline-page">
    <div shuku-edit-id="e-f7ea28e1-4060-4104-838f-7720f736c746" className="rl-optline-layout">
      <section shuku-edit-id="e-2c18574b-75be-4b53-962c-59886b48152f" className="rl-optline-calculation" aria-label="依次计算最优斜率与截距">
        <section shuku-edit-id="e-8fceb25b-2419-4e36-9f14-d2a0e48a2711" className="rl-optline-result-card" aria-label="第一步：计算最优斜率">
          <div shuku-edit-id="e-a6cc9fe1-dfac-4e38-8fe5-5042a86d2c9d" className="rl-optline-card-heading"><Typography shuku-edit-id="e-bffce75f-fbe5-40f3-bb2f-f7cf5e67c18d" as="span" variant="body" tone="inherit" className="rl-optline-number">1</Typography><Typography shuku-edit-id="e-45b504c3-b42d-4a93-bc9e-03014f17b04b" variant="h3" tone="accent">计算最优斜率</Typography></div>
          <MathFormulaBlock appearance="plain" className="rl-optline-parameter-formula" ariaLabel="利用中心化观测求最优斜率"><MathFormulaTerm latex="w^*=\frac{\sum_i(x_i-\bar x)(y_i-\bar y)}{\sum_i(x_i-\bar x)^2}" tooltip="将全部实际记录代入第14页得到的公式。输入不全相同，分母为正；计算使用未舍入数据。" /></MathFormulaBlock>
          <div shuku-edit-id="e-fc108b24-b98b-40fa-883f-41092a4a9676" className="rl-optline-value"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="w^*=" /></MathFormulaBlock><Typography shuku-edit-id="e-4b29cb07-bd43-43f2-b2ca-f4cab02bc1f7" variant="h2" tone="inherit">{model.w.toFixed(4)}</Typography></div>
        </section>
        <section shuku-edit-id="e-f7fe7afb-edd0-4766-99c3-bf9d19ec3e05" className="rl-optline-result-card rl-optline-intercept-card" aria-label="第二步：计算最优截距">
          <div shuku-edit-id="e-8eb07517-0096-4b58-808c-493bbcc81ee6" className="rl-optline-card-heading"><Typography shuku-edit-id="e-f8b9b9aa-8517-483a-9dc9-f63d5ea8132b" as="span" variant="body" tone="inherit" className="rl-optline-number">2</Typography><Typography shuku-edit-id="e-0c58138c-b8cc-4d1c-a52a-6a957738f4a5" variant="h3" tone="accent">计算最优截距</Typography></div>
          <div shuku-edit-id="e-b192b05d-e265-41dc-affa-2c2d82a86207" className="rl-optline-intercept-detail">
            <MathFormulaBlock appearance="plain" className="rl-optline-parameter-formula" ariaLabel="利用最优斜率和样本均值求最优截距"><MathFormulaTerm latex="b^*=\bar y-w^*\bar x" tooltip="把刚算出的最优斜率代回截距公式，得到对应的最优截距。截距不要求为零。" /></MathFormulaBlock>
            <Typography shuku-edit-id="e-b191ec6a-3eff-4206-8669-11e9dd4199e1" variant="body" tone="muted" align="center">将刚求出的 w* 代入</Typography>
          </div>
          <div shuku-edit-id="e-dc15d8a8-9ee8-4bd0-9288-f86baa2ff84f" className="rl-optline-value"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="b^*=" /></MathFormulaBlock><Typography shuku-edit-id="e-d87073dd-e368-4522-ab67-11dc7bf023f2" variant="h2" tone="inherit">{model.b.toFixed(1)}</Typography></div>
        </section>
      </section>
      <section shuku-edit-id="e-e1b8b8a6-3fc9-4ff9-a940-5ba861dfc56a" className="rl-optline-visual" aria-label="第三步：代入参数得到最优直线，再比较拟合效果">
        <div shuku-edit-id="e-e090dfa6-4874-48ad-9b72-b5782358502c" className="rl-optline-card-heading"><Typography shuku-edit-id="e-bead9cfe-16df-47ea-8342-3a769294989b" as="span" variant="body" tone="inherit" className="rl-optline-number rl-optline-number--result">3</Typography><Typography shuku-edit-id="e-7239a809-bf22-4d56-aa99-ab8582d1a2ea" variant="h3" tone="accent">代入，得到最优直线</Typography></div>
        <MathFormulaBlock appearance="plain" className="rl-optline-equation" ariaLabel="将最优斜率与截距代入预测模型"><MathFormulaStatic latex={String.raw`\hat{y}=\textcolor{#009eaa}{${model.w.toFixed(4)}}x${model.b < 0 ? '-' : '+'}\textcolor{#009eaa}{${Math.abs(model.b).toFixed(1)}}`} /></MathFormulaBlock>
        <div shuku-edit-id="e-8f5e37f2-a339-47db-a840-68aab26a5d75" className="rl-optline-chart-area">
          <div shuku-edit-id="e-fa25f963-a56a-4994-bf64-eaaf659ae177" className="rl-optline-chart-legend"><Typography shuku-edit-id="e-ac1e5396-67ba-432d-b361-34ff341402e9" as="span" variant="body" tone="muted"><i shuku-edit-id="e-dce5ca45-972d-49c6-8695-fa02f3fb3f3e" className="rl-optline-line-key" />手动拟合</Typography><Typography shuku-edit-id="e-bff72bbf-d1b1-48e1-846e-825489bf8b4b" as="span" variant="body" tone="accent"><i shuku-edit-id="e-c2c1116b-2cb1-436e-9573-96760861f5b5" className="rl-optline-line-key is-optimal" />最小二乘</Typography></div>
          <EChartsChart option={option} className="rl-optline-chart" minHeight={0} aria-label="实际观测、已保存的手动拟合直线和最小二乘直线" />
        </div>
        <div shuku-edit-id="e-6f424558-131c-4cd9-beb7-e04bada356c4" className="rl-optline-comparison" aria-label="手动拟合与最小二乘的MSE比较">
          <Typography shuku-edit-id="e-ad2dd000-c099-41fa-95de-a18da1b4bba5" variant="body" tone="muted">手动拟合 MSE <strong shuku-edit-id="e-e21d199e-d660-4e6b-9640-c1cc48590414">{model.manualMse.toFixed(1)}</strong></Typography>
          <Typography shuku-edit-id="e-075b5ad8-bcfb-4b8a-b7b7-74cfdeca47ed" as="span" variant="body" tone="muted" aria-hidden="true">→</Typography>
          <Typography shuku-edit-id="e-f6c8f9fc-88fe-4435-9abf-df474666fe16" variant="body" tone="inherit" className="rl-optline-optimal-mse">最小二乘 MSE <strong shuku-edit-id="e-f7d7fd7b-4149-421a-9aea-8c4f7bfa2d04">{model.optimalMse.toFixed(1)}</strong></Typography>
        </div>
      </section>
    </div>
  </ContentBlock>;
}
