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
  return <div shuku-edit-id="e-4621fded-b2d5-4b48-a2d3-7fb4683640c8" className="cg-wormhole-lab" data-tension={tension} data-energy-density={energyDensity} data-valid={model.valid}>
    <Typography shuku-edit-id="e-472db6b0-a01a-41be-be1b-dbe028d54bd4" as="h2" variant="h3" tone="accent">虫洞几何与通行时间</Typography>
    <div shuku-edit-id="e-e6a47042-3e45-4005-9ee8-9dc74ba8f019" className="cg-wormhole-lab-main">
      <div shuku-edit-id="e-302fdef9-bc82-4afe-ae3d-19a936594de6" className="cg-wormhole-visual"><WormholeScene throat={model.throat} ratio={model.ratio} valid={model.valid} paths={result.paths} routeMode="available" throatDetails={<>
        <Typography shuku-edit-id="e-e0f410da-6189-472c-bc6f-fd5b34a50a64" variant="bodySmall" tone="accent">曲面形状（本页模型）</Typography>
        <MathFormulaBlock appearance="plain" ariaLabel="形状函数b(r)等于R乘以r除以R的能量密度与径向拉应力比次方；曲面高度z对r的导数为正负根号下b除以r减b；R等于10米除以拉应力相对值的平方根">
          <MathFormulaStatic latex={String.raw`\begin{gathered}b(r)=R\left(\frac{r}{R}\right)^{\varepsilon/\tau},\quad R=\frac{10\,\mathrm{m}}{\sqrt{\tau}}\\[6pt]\frac{dz}{dr}=\pm\left[\frac{b(r)}{r-b(r)}\right]^{1/2}\end{gathered}`} />
        </MathFormulaBlock>
        <Typography shuku-edit-id="e-2e674fbe-1821-467a-8d19-98726a31979d" variant="bodySmall" tone="muted">τ：径向拉应力　ε：能量密度<br shuku-edit-id="e-1fdb30a0-f73a-4908-86be-ec3d9d36d55f" />均为相对值；z 为曲面高度。</Typography>
      </>} /></div>
      <div shuku-edit-id="e-79aa9656-be03-40ed-9532-1506a8b08ead" className="cg-wormhole-controls">
        <RangeControl label="径向拉应力（相对值）" min={.6} max={2.4} step={.1} value={tension} digits={1} onChange={event => { setTension(Number(event.currentTarget.value)); }} hint />
        <div shuku-edit-id="e-e2d20c08-aeb0-4327-b53f-05754b356e01" className="cg-wormhole-energy-control">
          <RangeControl label="能量密度（相对值）" min={-1.5} max={1.5} step={.1} value={energyDensity} digits={1} onChange={event => { setEnergyDensity(Number(event.currentTarget.value)); }} />
          <span shuku-edit-id="e-3591f5c8-c7d4-42a9-a31d-dfb6d5ee2a21" className="cg-wormhole-energy-help"><ExplainPanelButton label="为什么能量密度有正负？为什么范围是负1.5到正1.5？">
            <Typography shuku-edit-id="e-9deb70fc-7979-419d-91fe-5edf3714675b" as="div" variant="bodySmall" tone="accent">为什么能量密度有正负？</Typography>
            <Typography shuku-edit-id="e-e92a5080-9f38-4891-9b60-bfaf56908bf6" as="div" variant="bodySmall">这里表示喉部静止观察者测得的局部能量密度。正值表示正能量密度；负值表示模型假设的负能量密度，普通物质通常不具备这种性质。</Typography>
            <Typography shuku-edit-id="e-752285f2-514b-47d6-a725-587d681df5a2" as="div" variant="bodySmall">“相对值”是除以一个固定的正能量密度基准，并非减去平均值，所以归一化不会改变正负号。</Typography>
            <Typography shuku-edit-id="e-2930f08d-5787-494d-8986-7a6d7ca60812" as="div" variant="bodySmall">−1.5～1.5 是本演示选定的探索范围，不是物理上下限；±1.5 表示该基准的 ±1.5 倍。</Typography>
            <Typography shuku-edit-id="e-4e60f914-59be-41d8-820c-71747ef72b67" as="div" variant="bodySmall">本页静态模型要求能量密度 ε 小于径向拉应力 τ，因此 ε 为正时也可能满足条件。例如 ε = 0.5、τ = 1；此时仍违反径向零能量条件（ε − τ &lt; 0）。</Typography>
          </ExplainPanelButton></span>
        </div>
        <div shuku-edit-id="e-8da2a5dd-e145-4c77-8a06-a66093c5dde9" className="cg-wormhole-result"><Typography shuku-edit-id="e-86beaa4c-ea8e-42e9-9dbf-7db1e4688c6f" variant="bodySmall" tone="muted">喉部半径</Typography><Typography shuku-edit-id="e-94d8330a-0067-4fa1-ab46-e2bfc7e7c07f" as="output" variant="h3" tone="accent">{model.valid ? model.radiusMetres.toFixed(1) + ' m' : '—'}</Typography></div>
        <Typography shuku-edit-id="e-37e64b42-54fa-4339-85b0-64544a417aae" variant="bodySmall" tone={model.valid ? "success" : "warning"}>{model.valid ? "能量密度低于拉应力" : "能量密度须低于拉应力"}</Typography>
        <Typography shuku-edit-id="e-27e86c25-8673-4b3e-bc74-ca0351551bf8" variant="bodySmall" tone="muted">恒速 {TRAVEL_SPEED} m/s<br shuku-edit-id="e-c3ad4945-793a-4860-8c7f-f56059e9964e" />每秒 1 个示踪点 · 动画 {PLAYBACK_RATE} 倍速</Typography>
      </div>
    </div>
    <section shuku-edit-id="e-9b3b173a-1224-42b7-8dca-e2de7bf862bd" className="cg-wormhole-times" aria-label="A到B的通行时间对比">
      <div shuku-edit-id="e-81970cee-5c41-4813-8579-c413581ed5ae" className="cg-wormhole-time-card cg-wormhole-time-card--original"><Typography shuku-edit-id="e-133c9ee2-25a1-4a52-96ec-d81c1a72f7f0" variant="bodySmall" tone="inherit">原有路径</Typography><Typography shuku-edit-id="e-ac34e6a3-186e-4538-b4a5-f769ac8623a5" as="output" variant="h3" tone="inherit">{result.originalTime.toFixed(1)} 秒</Typography></div>
      <div shuku-edit-id="e-824a32e9-6633-4eeb-a260-3766c06cc63f" className="cg-wormhole-time-card cg-wormhole-time-card--shortcut"><Typography shuku-edit-id="e-c8bbe6da-3f9a-4edd-8761-799fe4031f37" variant="bodySmall" tone="inherit">虫洞路径</Typography><Typography shuku-edit-id="e-885de25b-a548-4e00-9f7c-9a20f11b6ae9" as="output" variant="h3" tone="inherit">{result.wormholeTime === null ? '无通路' : result.wormholeTime.toFixed(1) + ' 秒'}</Typography></div>
      <div shuku-edit-id="e-06d4ae09-e303-45c1-87bb-c8344e053a7e" className="cg-wormhole-time-card cg-wormhole-time-card--saving"><div shuku-edit-id="e-e223c370-8335-4b7c-a344-591644b6a6b3" className="cg-wormhole-time-card-heading"><Typography shuku-edit-id="e-a2e8921f-c564-4d2b-b01a-b1e2f50089af" variant="bodySmall" tone="inherit">{saved !== null && saved < 0 ? '增加时间' : '节省时间'}</Typography>{saved !== null && <Typography shuku-edit-id="e-05530a2a-3785-4c99-bc3b-dd9f9f0cad0a" as="span" variant="bodySmall" tone="muted">{Math.abs(saved / result.originalTime * 100).toFixed(1)}%</Typography>}</div><Typography shuku-edit-id="e-b6018d16-6f33-488d-bf31-fd0bec4b5b29" as="output" variant="h3" tone="inherit">{saved === null ? '—' : Math.abs(saved).toFixed(1) + ' 秒'}</Typography></div>
    </section>
  </div>;
}
