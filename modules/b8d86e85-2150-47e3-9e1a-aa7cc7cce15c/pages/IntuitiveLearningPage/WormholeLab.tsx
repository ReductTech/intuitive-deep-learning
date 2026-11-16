import { useMemo, useState } from 'react';
import { ExplainPanelButton, MathFormulaBlock, MathFormulaStatic, RangeControl, Typography } from "@shuku/course-style/react";
import { WormholeScene } from './WormholeScene';
import { PLAYBACK_RATE, TRAVEL_SPEED, matterModel, travelComparison } from './wormholeMatter';
import './WormholeLab.css';

export function WormholeLab() {
  const [tension, setTension] = useState(1);
  const [energyDensity, setEnergyDensity] = useState(-.5);
  const result = useMemo(() => travelComparison(tension, energyDensity), [tension, energyDensity]);
  const saved = result.wormholeTime === null ? null : result.originalTime - result.wormholeTime;
  const model = matterModel(tension, energyDensity);
  return <div shuku-edit-id="e-d7700372-e584-411b-bd96-22d828c13a5d" className="llmpe-cg-wormhole-lab" data-tension={tension} data-energy-density={energyDensity} data-valid={model.valid}>
    <Typography shuku-edit-id="e-6329bfa4-1a27-4383-bb4d-4eca5f2982a8" as="h2" variant="h3" tone="accent">虫洞几何与通行时间</Typography>
    <div shuku-edit-id="e-a7d338c1-5ef5-474d-ae2b-0beff858f3d4" className="llmpe-cg-wormhole-lab-main">
      <div shuku-edit-id="e-5608f387-33d8-4d8d-ba9a-8d566a9812ac" className="llmpe-cg-wormhole-visual"><WormholeScene throat={model.throat} ratio={model.ratio} valid={model.valid} paths={result.paths} routeMode="available" throatDetails={<>
        <Typography shuku-edit-id="e-13ed6ec7-8e45-486b-a5a4-4005fbe36534" variant="bodySmall" tone="accent">曲面形状（本页模型）</Typography>
        <MathFormulaBlock appearance="plain" ariaLabel="形状函数b(r)等于R乘以r除以R的能量密度与径向拉应力比次方；曲面高度z对r的导数为正负根号下b除以r减b；R等于10米除以拉应力相对值的平方根">
          <MathFormulaStatic latex={String.raw`\begin{gathered}b(r)=R\left(\frac{r}{R}\right)^{\varepsilon/\tau},\quad R=\frac{10\,\mathrm{m}}{\sqrt{\tau}}\\[6pt]\frac{dz}{dr}=\pm\left[\frac{b(r)}{r-b(r)}\right]^{1/2}\end{gathered}`} />
        </MathFormulaBlock>
        <Typography shuku-edit-id="e-b81f44b3-8d2f-4cb6-b055-6cf1431ade5c" variant="bodySmall" tone="muted">τ：径向拉应力　ε：能量密度<br shuku-edit-id="e-c54aef2c-ae8b-42b1-a49c-50ccaa85f368" />均为相对值；z 为曲面高度。</Typography>
      </>} /></div>
      <div shuku-edit-id="e-53409c5e-e788-43f3-843a-390f37e2c3be" className="llmpe-cg-wormhole-controls">
        <RangeControl label="径向拉应力（相对值）" min={.6} max={2.4} step={.1} value={tension} digits={1} onChange={event => { setTension(Number(event.currentTarget.value)); }} hint />
        <div shuku-edit-id="e-a1ce3d92-6ce8-4202-840d-0ce301781813" className="llmpe-cg-wormhole-energy-control">
          <RangeControl label="能量密度（相对值）" min={-1.5} max={1.5} step={.1} value={energyDensity} digits={1} onChange={event => { setEnergyDensity(Number(event.currentTarget.value)); }} />
          <span shuku-edit-id="e-2bf8154c-df31-4808-8f26-a646c3a17626" className="llmpe-cg-wormhole-energy-help"><ExplainPanelButton label="为什么能量密度有正负？为什么范围是负1.5到正1.5？">
            <Typography shuku-edit-id="e-86382070-e66a-4eeb-9737-58647695af24" as="div" variant="bodySmall" tone="accent">为什么能量密度有正负？</Typography>
            <Typography shuku-edit-id="e-aea99c78-cdbd-4f2d-8fb6-7332bdf90d5c" as="div" variant="bodySmall">这里表示喉部静止观察者测得的局部能量密度。正值表示正能量密度；负值表示模型假设的负能量密度，普通物质通常不具备这种性质。</Typography>
            <Typography shuku-edit-id="e-64837e4e-38fd-4805-ac46-17dfc3c75906" as="div" variant="bodySmall">“相对值”是除以一个固定的正能量密度基准，并非减去平均值，所以归一化不会改变正负号。</Typography>
            <Typography shuku-edit-id="e-02729dbf-5716-4f5f-a584-515f8fec4035" as="div" variant="bodySmall">−1.5～1.5 是本演示选定的探索范围，不是物理上下限；±1.5 表示该基准的 ±1.5 倍。</Typography>
            <Typography shuku-edit-id="e-a4caf9b3-b2d4-4b74-a709-af8799c045b6" as="div" variant="bodySmall">本页静态模型要求能量密度 ε 小于径向拉应力 τ，因此 ε 为正时也可能满足条件。例如 ε = 0.5、τ = 1；此时仍违反径向零能量条件（ε − τ &lt; 0）。</Typography>
          </ExplainPanelButton></span>
        </div>
        <div shuku-edit-id="e-64b8bb75-2d99-47e3-bbed-105e7e4ab469" className="llmpe-cg-wormhole-result"><Typography shuku-edit-id="e-442708e9-b042-4470-b326-d9c28b938169" variant="bodySmall" tone="muted">喉部半径</Typography><Typography shuku-edit-id="e-af561a02-40ef-46f6-ad64-29b815309505" as="output" variant="h3" tone="accent">{model.valid ? model.radiusMetres.toFixed(1) + ' m' : '—'}</Typography></div>
        <Typography shuku-edit-id="e-09283853-f57f-4747-8b70-676eb1d5fd37" variant="bodySmall" tone={model.valid ? "success" : "warning"}>{model.valid ? "能量密度低于拉应力" : "能量密度须低于拉应力"}</Typography>
        <Typography shuku-edit-id="e-f445814d-b791-4cd5-a312-d3f8ca557bc7" variant="bodySmall" tone="muted">恒速 {TRAVEL_SPEED} m/s<br shuku-edit-id="e-2db31dd0-6c44-46e4-887b-03b868b2df90" />每秒 1 个示踪点 · 动画 {PLAYBACK_RATE} 倍速</Typography>
      </div>
    </div>
    <section shuku-edit-id="e-73b03d54-0a35-4ab0-b502-f54c0329586f" className="llmpe-cg-wormhole-times" aria-label="A到B的通行时间对比">
      <div shuku-edit-id="e-070c61db-31bd-46b7-a586-975767a96890" className="llmpe-cg-wormhole-time-card llmpe-cg-wormhole-time-card--original"><Typography shuku-edit-id="e-dc3f186f-75d0-4e90-815b-809bff5017d2" variant="bodySmall" tone="inherit">原有路径</Typography><Typography shuku-edit-id="e-68d239af-9f1e-4f36-8c7e-940db2ec7678" as="output" variant="h3" tone="inherit">{result.originalTime.toFixed(1)} 秒</Typography></div>
      <div shuku-edit-id="e-2933b429-4904-40ab-b525-bc2e9a977dc2" className="llmpe-cg-wormhole-time-card llmpe-cg-wormhole-time-card--shortcut"><Typography shuku-edit-id="e-568ebfb7-fd86-4902-ab95-0004680349a6" variant="bodySmall" tone="inherit">虫洞路径</Typography><Typography shuku-edit-id="e-412ad128-0420-4ff8-a3c6-7f2800832d12" as="output" variant="h3" tone="inherit">{result.wormholeTime === null ? '无通路' : result.wormholeTime.toFixed(1) + ' 秒'}</Typography></div>
      <div shuku-edit-id="e-0639b82a-849e-44d7-8b40-3db445824ec1" className="llmpe-cg-wormhole-time-card llmpe-cg-wormhole-time-card--saving"><div shuku-edit-id="e-b35330e1-6213-49c7-a885-311acd938bd5" className="llmpe-cg-wormhole-time-card-heading"><Typography shuku-edit-id="e-b8eaeb4a-7069-4c6e-acbb-19f27e85bdf9" variant="bodySmall" tone="inherit">{saved !== null && saved < 0 ? '增加时间' : '节省时间'}</Typography>{saved !== null && <Typography shuku-edit-id="e-5d32aa6b-779f-4568-8269-a219467b371f" as="span" variant="bodySmall" tone="muted">{Math.abs(saved / result.originalTime * 100).toFixed(1)}%</Typography>}</div><Typography shuku-edit-id="e-a5e50215-8678-42f6-87d3-65ddd843560b" as="output" variant="h3" tone="inherit">{saved === null ? '—' : Math.abs(saved).toFixed(1) + ' 秒'}</Typography></div>
    </section>
  </div>;
}
