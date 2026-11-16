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
  return <div shuku-edit-id="e-854ba317-6802-4d6c-ad58-613a0c26fa2e" className="aipe-replay-cg-wormhole-lab" data-tension={tension} data-energy-density={energyDensity} data-valid={model.valid}>
    <Typography shuku-edit-id="e-5ef01554-df00-4443-a6f6-f058aa7b1ab0" as="h2" variant="h3" tone="accent">虫洞几何与通行时间</Typography>
    <div shuku-edit-id="e-2d07a446-02e2-4a3c-9b98-6c07c83e1cad" className="aipe-replay-cg-wormhole-lab-main">
      <div shuku-edit-id="e-0455dea5-477e-4ab4-9801-77b4cc320a7a" className="aipe-replay-cg-wormhole-visual"><WormholeScene throat={model.throat} ratio={model.ratio} valid={model.valid} paths={result.paths} routeMode="available" throatDetails={<>
        <Typography shuku-edit-id="e-fbd0fa07-f28d-47af-9a5e-2f4fe29e3d6d" variant="bodySmall" tone="accent">曲面形状（本页模型）</Typography>
        <MathFormulaBlock appearance="plain" ariaLabel="形状函数b(r)等于R乘以r除以R的能量密度与径向拉应力比次方；曲面高度z对r的导数为正负根号下b除以r减b；R等于10米除以拉应力相对值的平方根">
          <MathFormulaStatic latex={String.raw`\begin{gathered}b(r)=R\left(\frac{r}{R}\right)^{\varepsilon/\tau},\quad R=\frac{10\,\mathrm{m}}{\sqrt{\tau}}\\[6pt]\frac{dz}{dr}=\pm\left[\frac{b(r)}{r-b(r)}\right]^{1/2}\end{gathered}`} />
        </MathFormulaBlock>
        <Typography shuku-edit-id="e-22d3c1c9-3295-4e29-ae53-45834aadf5d5" variant="bodySmall" tone="muted">τ：径向拉应力　ε：能量密度<br shuku-edit-id="e-dd418c8a-d8a5-40f8-8b68-b7d557752da9" />均为相对值；z 为曲面高度。</Typography>
      </>} /></div>
      <div shuku-edit-id="e-be620560-da69-45a5-812a-54306bc4e95f" className="aipe-replay-cg-wormhole-controls">
        <RangeControl label="径向拉应力（相对值）" min={.6} max={2.4} step={.1} value={tension} digits={1} onChange={event => { setTension(Number(event.currentTarget.value)); }} hint />
        <div shuku-edit-id="e-ecf123ce-78d6-4923-843f-6b8d76436512" className="aipe-replay-cg-wormhole-energy-control">
          <RangeControl label="能量密度（相对值）" min={-1.5} max={1.5} step={.1} value={energyDensity} digits={1} onChange={event => { setEnergyDensity(Number(event.currentTarget.value)); }} />
          <span shuku-edit-id="e-9245d1ab-3366-49ea-8dcb-9a4b15241998" className="aipe-replay-cg-wormhole-energy-help"><ExplainPanelButton label="为什么能量密度有正负？为什么范围是负1.5到正1.5？">
            <Typography shuku-edit-id="e-860b86d3-d460-4c6b-be42-a617ea8a519b" as="div" variant="bodySmall" tone="accent">为什么能量密度有正负？</Typography>
            <Typography shuku-edit-id="e-fa8aae50-9ed9-4b35-a4a9-7f7facd46630" as="div" variant="bodySmall">这里表示喉部静止观察者测得的局部能量密度。正值表示正能量密度；负值表示模型假设的负能量密度，普通物质通常不具备这种性质。</Typography>
            <Typography shuku-edit-id="e-497d234f-3705-4b0e-9ab8-f612b4ff8120" as="div" variant="bodySmall">“相对值”是除以一个固定的正能量密度基准，并非减去平均值，所以归一化不会改变正负号。</Typography>
            <Typography shuku-edit-id="e-6b5e15b2-1fc1-4edf-a0dc-3a401ec75e07" as="div" variant="bodySmall">−1.5～1.5 是本演示选定的探索范围，不是物理上下限；±1.5 表示该基准的 ±1.5 倍。</Typography>
            <Typography shuku-edit-id="e-bc459afd-dbd2-4d57-a195-0599624d9ef8" as="div" variant="bodySmall">本页静态模型要求能量密度 ε 小于径向拉应力 τ，因此 ε 为正时也可能满足条件。例如 ε = 0.5、τ = 1；此时仍违反径向零能量条件（ε − τ &lt; 0）。</Typography>
          </ExplainPanelButton></span>
        </div>
        <div shuku-edit-id="e-33d68a7a-cae4-4346-b529-1755d3bcd6f8" className="aipe-replay-cg-wormhole-result"><Typography shuku-edit-id="e-632da1e4-bb46-4277-8fe7-c731a93d82b2" variant="bodySmall" tone="muted">喉部半径</Typography><Typography shuku-edit-id="e-84cfd6e0-3bc2-416e-bc0e-56016d907c1e" as="output" variant="h3" tone="accent">{model.valid ? model.radiusMetres.toFixed(1) + ' m' : '—'}</Typography></div>
        <Typography shuku-edit-id="e-34169f9c-a492-4c06-a6e0-7e5319d657f2" variant="bodySmall" tone={model.valid ? "success" : "warning"}>{model.valid ? "能量密度低于拉应力" : "能量密度须低于拉应力"}</Typography>
        <Typography shuku-edit-id="e-8a046fff-2f44-4820-a999-19a4e584811f" variant="bodySmall" tone="muted">恒速 {TRAVEL_SPEED} m/s<br shuku-edit-id="e-ca53ca30-6b33-4c3c-8c06-5b0aab9e2ed3" />每秒 1 个示踪点 · 动画 {PLAYBACK_RATE} 倍速</Typography>
      </div>
    </div>
    <section shuku-edit-id="e-65fbf7cd-9272-4bde-af5c-de3c7b85bbbb" className="aipe-replay-cg-wormhole-times" aria-label="A到B的通行时间对比">
      <div shuku-edit-id="e-d0f0a212-de57-4edf-9608-99c28f67b8b5" className="aipe-replay-cg-wormhole-time-card aipe-replay-cg-wormhole-time-card--original"><Typography shuku-edit-id="e-1a419c61-b37e-4516-9de9-6fb640079532" variant="bodySmall" tone="inherit">原有路径</Typography><Typography shuku-edit-id="e-c19bcee7-fbf9-4eb2-989d-018b3001ef8c" as="output" variant="h3" tone="inherit">{result.originalTime.toFixed(1)} 秒</Typography></div>
      <div shuku-edit-id="e-4fba9a64-4475-4809-8b51-a9a870a9fab5" className="aipe-replay-cg-wormhole-time-card aipe-replay-cg-wormhole-time-card--shortcut"><Typography shuku-edit-id="e-2580d8e3-222c-463f-88e1-bc858f835e01" variant="bodySmall" tone="inherit">虫洞路径</Typography><Typography shuku-edit-id="e-6a6783ed-2a80-4250-b102-b159727f1094" as="output" variant="h3" tone="inherit">{result.wormholeTime === null ? '无通路' : result.wormholeTime.toFixed(1) + ' 秒'}</Typography></div>
      <div shuku-edit-id="e-e6de0893-cb31-4c3d-9850-1f8fae3462a7" className="aipe-replay-cg-wormhole-time-card aipe-replay-cg-wormhole-time-card--saving"><div shuku-edit-id="e-9438c2b9-1db3-4dd7-9d2f-7f628ca2f556" className="aipe-replay-cg-wormhole-time-card-heading"><Typography shuku-edit-id="e-2525b42c-9166-4524-b672-31a54628fc18" variant="bodySmall" tone="inherit">{saved !== null && saved < 0 ? '增加时间' : '节省时间'}</Typography>{saved !== null && <Typography shuku-edit-id="e-05eec7b4-c54e-4b2f-8b08-7b69af602475" as="span" variant="bodySmall" tone="muted">{Math.abs(saved / result.originalTime * 100).toFixed(1)}%</Typography>}</div><Typography shuku-edit-id="e-28d0a140-be6c-446c-8ae6-bd16f257d502" as="output" variant="h3" tone="inherit">{saved === null ? '—' : Math.abs(saved).toFixed(1) + ' 秒'}</Typography></div>
    </section>
  </div>;
}
