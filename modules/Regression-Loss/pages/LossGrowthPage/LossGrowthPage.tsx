import { useMemo, useState } from 'react';
import { LossSurfacePlot } from './LossSurfacePlot';
import { Button, ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import { useRecordedData } from '../../regressionData';
import './LossGrowthPage.css';

type Point = { u: number; v: number };
export function LossGrowthPage() {
  const data = useRecordedData();
  const [offset, setOffset] = useState<Point>({ u: 0, v: 0 });
  const model = useMemo(() => {
    const n = data.length;
    const mx = n ? data.reduce((s, p) => s + p.mass, 0) / n : 0;
    const my = n ? data.reduce((s, p) => s + p.depth, 0) / n : 0;
    const xx = data.reduce((s, p) => s + (p.mass - mx) ** 2, 0);
    const w = xx ? data.reduce((s, p) => s + (p.mass - mx) * (p.depth - my), 0) / xx : 0;
    const b = my - w * mx;
    const loss = n ? data.reduce((s, p) => s + (p.depth - w * p.mass - b) ** 2, 0) / n : 0;
    const g11 = n ? data.reduce((s, p) => s + (p.mass / 1000) ** 2, 0) / n : 0;
    const g12 = mx / 1000;
    const angle = .5 * Math.atan2(2 * g12, g11 - 1);
    const fast = { u: 2.8 * Math.cos(angle), v: 2.8 * Math.sin(angle) };
    const slow = { u: 2.8 * Math.sin(angle), v: -2.8 * Math.cos(angle) };
    return { n, w, b, xx, loss, g11, g12, fast, slow };
  }, [data]);
  const increment = (p: Point) => Math.max(0, model.g11 * p.u ** 2 + 2 * model.g12 * p.u * p.v + p.v ** 2);
  const currentIncrease = increment(offset);
  const option = useMemo(() => {
    const variants = [{ name: '最优直线', p: { u: 0, v: 0 }, color: '#009eaa', dash: false }, { name: '方向① · 增长慢', p: model.slow, color: '#ed655a', dash: true }, { name: '方向② · 增长快', p: model.fast, color: '#287af0', dash: true }, { name: '当前参数', p: offset, color: '#8a59ce', dash: false }];
    const predict = (x: number, p: Point) => (model.w + p.u / 1000) * x + model.b + p.v;
    const values = variants.flatMap(s => [predict(0, s.p), predict(1600, s.p)]);
    return {
      animation: false, tooltip: { trigger: 'item' },
      legend: { bottom: 0, data: ['最优直线', '方向① · 增长慢', '方向② · 增长快', '当前参数'], textStyle: { fontSize: 17, color: '#27446e' }, itemGap: 12, padding: 6 },
      grid: { left: 59, right: 17, top: 65, bottom: 99 },
      xAxis: { type: 'value', min: 0, max: 1600, interval: 500, name: '累计石重（千克）', nameLocation: 'middle', nameGap: 33, nameTextStyle: { fontSize: 21, color: '#27446e' }, axisLabel: { fontSize: 18 }, splitLine: { show: false } },
      yAxis: { type: 'value', min: Math.min(0, Math.floor(Math.min(...values) / 5) * 5), max: Math.max(30, Math.ceil(Math.max(...values, ...data.map(p => p.depth)) / 10) * 10), name: '下沉深度（厘米）', nameTextStyle: { fontSize: 21, color: '#27446e', align: 'left' }, axisLabel: { fontSize: 18 }, splitLine: { lineStyle: { color: '#e4edf8', type: 'dashed' } } },
      series: [...variants.map(s => ({ name: s.name, type: 'line', symbol: 'none', data: [[0, predict(0, s.p)], [1600, predict(1600, s.p)]], lineStyle: { color: s.color, width: s.name === '当前参数' ? 3 : 3.5, type: s.dash ? 'dashed' : 'solid' }, silent: true })), { type: 'scatter', data: data.map(p => [p.mass, p.depth]), symbolSize: 10, itemStyle: { color: '#7c90ac', borderColor: '#fff', borderWidth: 1 }, z: 6 }],
    };
  }, [data, model, offset]);
  if (!data.length || !model.xx) return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页全部实际记录计算损失。" />;
  return <ContentBlock headingLevel={1} title="离开最优解，损失怎样变化？" subtitle="将几何关系转写到参数空间，观察不同方向上的损失增长。" className="rl-growth-page">
    <div className="rl-growth-layout">
      <section className="rl-growth-chart-panel"><div className="rl-growth-heading"><Typography variant="h3" tone="accent">预测空间</Typography><Typography variant="bodySmall" tone="muted">参数变化 → 预测变化</Typography></div><EChartsChart option={option} minHeight={0} className="rl-growth-chart" aria-label="实际记录、最优直线与不同方向扰动后的预测" /></section>
      <section className="rl-growth-bridge">
        <Typography variant="bodySmall" tone="accent" align="center">同一个损失关系</Typography>
        <div className="rl-growth-identity">
          <MathFormulaBlock appearance="plain"><MathFormulaTerm latex="L(\theta^*+\Delta)" tooltip="离开最优参数后的MSE。Δ包含斜率变化与截距变化；不是某个样本的误差。" /></MathFormulaBlock>
          <MathFormulaBlock appearance="plain"><MathFormulaStatic latex="=" /><MathFormulaTerm latex="L(\theta^*)" tooltip="最小二乘解的最小MSE；一般不等于零。" /><MathFormulaStatic latex="+" /></MathFormulaBlock>
          <MathFormulaBlock appearance="plain" className="rl-growth-extra"><MathFormulaTerm latex="\frac1n" tooltip="将全部记录的平方变化求和后除以记录数，得到MSE的增量。" /><MathFormulaTerm latex="\Vert" tooltip="向量长度。" /><MathFormulaTerm latex="X" tooltip="固定设计矩阵，列分别是石重与常数1。" /><MathFormulaTerm latex="\Delta" tooltip="参数变化。XΔ是全部样本预测值的变化向量。" /><MathFormulaTerm latex="\Vert_2^2" tooltip="每条预测变化平方后求和。该项非负，因而损失不会低于最优值。" /></MathFormulaBlock>
        </div>
        <Typography variant="bodySmall" tone="muted" align="center">残差正交，交叉项为零。</Typography>
        <div className="rl-growth-current"><Typography variant="bodySmall" tone="muted">当前增加的 MSE</Typography><Typography variant="h2" tone="accent">+{currentIncrease.toFixed(1)}</Typography><Typography variant="bodySmall" tone="muted">平方厘米</Typography></div>
        <MathFormulaBlock appearance="plain" className="rl-growth-current-loss"><MathFormulaTerm latex={String.raw`L=${model.loss.toFixed(1)}+${currentIncrease.toFixed(1)}\approx ${(model.loss + currentIncrease).toFixed(1)}`} tooltip="内部使用未舍入数据计算；显示值保留一位小数，所以显示的两项相加可能有舍入差异。" /></MathFormulaBlock>
      </section>
      <section className="rl-growth-surface-panel"><div className="rl-growth-heading"><Typography variant="h3" tone="accent">参数空间</Typography><Button explain="斜率与截距单位不同。图中坐标使用(1000Δw, Δb)，相当于以1000千克为输入单位，两坐标均为厘米。两种示例扰动在这套坐标中的长度相同，均为2.8。曲面由第一页记录的MSE直接计算。">坐标尺度 ⓘ</Button></div>
        <LossSurfacePlot model={model} offset={offset} onChange={setOffset} />
        <div className="rl-growth-directions"><Button className="rl-growth-slow" onClick={() => setOffset(model.slow)} explain="在当前统一坐标尺度下，取损失增长最慢的方向。扰动长度与蓝色方向相同。">① 增长慢 +{increment(model.slow).toFixed(1)}</Button><Button className="rl-growth-fast" onClick={() => setOffset(model.fast)} explain="在当前统一坐标尺度下，取损失增长最快的方向。扰动长度与红色方向相同。">② 增长快 +{increment(model.fast).toFixed(1)}</Button><Button onClick={() => setOffset({ u: 0, v: 0 })}>回到最优解</Button></div>
        <Typography variant="bodySmall" tone="muted" align="center">拖动旋转 · 滚轮缩放 · 点选曲面调整参数</Typography>
      </section>
      <div className="rl-growth-footer"><Typography variant="body" tone="accent">相同尺度下，同样大小的参数扰动，预测变化越大，损失增加越多。</Typography></div>
    </div>
  </ContentBlock>;
}
