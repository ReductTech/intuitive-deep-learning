import { useMemo, useState } from 'react';
import { ExplainPanelButton, MathFormulaBlock, MathFormulaStatic, RangeControl, Typography } from '../../shared/react';
import { WormholeScene } from './WormholeScene';
import { PLAYBACK_RATE, TRAVEL_SPEED, matterModel, travelComparison } from './wormholeMatter';
import './WormholeLab.css';

export function WormholeLab() {
  const [tension, setTension] = useState(1);
  const [energyDensity, setEnergyDensity] = useState(-.5);
  const result = useMemo(() => travelComparison(tension, energyDensity), [tension, energyDensity]);
  const saved = result.wormholeTime === null ? null : result.originalTime - result.wormholeTime;
  const model = matterModel(tension, energyDensity);
  return <div className="cg-wormhole-lab" data-tension={tension} data-energy-density={energyDensity} data-valid={model.valid}>
    <Typography as="h2" variant="h3" tone="accent">虫洞几何与通行时间</Typography>
    <div className="cg-wormhole-lab-main">
      <div className="cg-wormhole-visual"><WormholeScene throat={model.throat} ratio={model.ratio} valid={model.valid} paths={result.paths} routeMode="available" throatDetails={<>
        <Typography variant="bodySmall" tone="accent">曲面形状（本页模型）</Typography>
        <MathFormulaBlock appearance="plain" ariaLabel="形状函数b(r)等于R乘以r除以R的能量密度与径向拉应力比次方；曲面高度z对r的导数为正负根号下b除以r减b；R等于10米除以拉应力相对值的平方根">
          <MathFormulaStatic latex={String.raw`\begin{gathered}b(r)=R\left(\frac{r}{R}\right)^{\varepsilon/\tau},\quad R=\frac{10\,\mathrm{m}}{\sqrt{\tau}}\\[6pt]\frac{dz}{dr}=\pm\left[\frac{b(r)}{r-b(r)}\right]^{1/2}\end{gathered}`} />
        </MathFormulaBlock>
        <Typography variant="bodySmall" tone="muted">τ：径向拉应力　ε：能量密度<br />均为相对值；z 为曲面高度。</Typography>
      </>} /></div>
      <div className="cg-wormhole-controls">
        <RangeControl label="径向拉应力（相对值）" min={.6} max={2.4} step={.1} value={tension} digits={1} onChange={event => { setTension(Number(event.currentTarget.value)); }} hint />
        <div className="cg-wormhole-energy-control">
          <RangeControl label="能量密度（相对值）" min={-1.5} max={1.5} step={.1} value={energyDensity} digits={1} onChange={event => { setEnergyDensity(Number(event.currentTarget.value)); }} />
          <span className="cg-wormhole-energy-help"><ExplainPanelButton label="为什么能量密度有正负？为什么范围是负1.5到正1.5？">
            <Typography as="div" variant="bodySmall" tone="accent">为什么能量密度有正负？</Typography>
            <Typography as="div" variant="bodySmall">这里表示喉部静止观察者测得的局部能量密度。正值表示正能量密度；负值表示模型假设的负能量密度，普通物质通常不具备这种性质。</Typography>
            <Typography as="div" variant="bodySmall">“相对值”是除以一个固定的正能量密度基准，并非减去平均值，所以归一化不会改变正负号。</Typography>
            <Typography as="div" variant="bodySmall">−1.5～1.5 是本演示选定的探索范围，不是物理上下限；±1.5 表示该基准的 ±1.5 倍。</Typography>
            <Typography as="div" variant="bodySmall">本页静态模型要求能量密度 ε 小于径向拉应力 τ，因此 ε 为正时也可能满足条件。例如 ε = 0.5、τ = 1；此时仍违反径向零能量条件（ε − τ &lt; 0）。</Typography>
          </ExplainPanelButton></span>
        </div>
        <div className="cg-wormhole-result"><Typography variant="bodySmall" tone="muted">喉部半径</Typography><Typography as="output" variant="h3" tone="accent">{model.valid ? model.radiusMetres.toFixed(1) + ' m' : '—'}</Typography></div>
        <Typography variant="bodySmall" tone={model.valid ? "success" : "warning"}>{model.valid ? "能量密度低于拉应力" : "能量密度须低于拉应力"}</Typography>
        <Typography variant="bodySmall" tone="muted">恒速 {TRAVEL_SPEED} m/s<br />每秒 1 个示踪点 · 动画 {PLAYBACK_RATE} 倍速</Typography>
      </div>
    </div>
    <section className="cg-wormhole-times" aria-label="A到B的通行时间对比">
      <div className="cg-wormhole-time-card cg-wormhole-time-card--original"><Typography variant="bodySmall" tone="inherit">原有路径</Typography><Typography as="output" variant="h3" tone="inherit">{result.originalTime.toFixed(1)} 秒</Typography></div>
      <div className="cg-wormhole-time-card cg-wormhole-time-card--shortcut"><Typography variant="bodySmall" tone="inherit">虫洞路径</Typography><Typography as="output" variant="h3" tone="inherit">{result.wormholeTime === null ? '无通路' : result.wormholeTime.toFixed(1) + ' 秒'}</Typography></div>
      <div className="cg-wormhole-time-card cg-wormhole-time-card--saving"><div className="cg-wormhole-time-card-heading"><Typography variant="bodySmall" tone="inherit">{saved !== null && saved < 0 ? '增加时间' : '节省时间'}</Typography>{saved !== null && <Typography as="span" variant="bodySmall" tone="muted">{Math.abs(saved / result.originalTime * 100).toFixed(1)}%</Typography>}</div><Typography as="output" variant="h3" tone="inherit">{saved === null ? '—' : Math.abs(saved).toFixed(1) + ' 秒'}</Typography></div>
    </section>
  </div>;
}
