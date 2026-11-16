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
  return <div shuku-edit-id="e-a936da08-76ec-43ff-8120-a722aa5fc2dc" className="cg-wormhole-lab" data-tension={tension} data-energy-density={energyDensity} data-valid={model.valid}>
    <Typography shuku-edit-id="e-c22320f6-40e7-47cf-b36b-b303db997eb8" as="h2" variant="h3" tone="accent">虫洞几何与通行时间</Typography>
    <div shuku-edit-id="e-debce3fa-3547-4011-884c-7534862ca7d0" className="cg-wormhole-lab-main">
      <div shuku-edit-id="e-f877d479-c2f2-4085-9275-1bf62e946dea" className="cg-wormhole-visual"><WormholeScene throat={model.throat} ratio={model.ratio} valid={model.valid} paths={result.paths} routeMode="available" throatDetails={<>
        <Typography shuku-edit-id="e-10718be0-0632-4ef9-802c-eae53e474ab4" variant="bodySmall" tone="accent">曲面形状（本页模型）</Typography>
        <MathFormulaBlock appearance="plain" ariaLabel="形状函数b(r)等于R乘以r除以R的能量密度与径向拉应力比次方；曲面高度z对r的导数为正负根号下b除以r减b；R等于10米除以拉应力相对值的平方根">
          <MathFormulaStatic latex={String.raw`\begin{gathered}b(r)=R\left(\frac{r}{R}\right)^{\varepsilon/\tau},\quad R=\frac{10\,\mathrm{m}}{\sqrt{\tau}}\\[6pt]\frac{dz}{dr}=\pm\left[\frac{b(r)}{r-b(r)}\right]^{1/2}\end{gathered}`} />
        </MathFormulaBlock>
        <Typography shuku-edit-id="e-cfe3f31d-2317-431c-9c45-5420739969ae" variant="bodySmall" tone="muted">τ：径向拉应力　ε：能量密度<br shuku-edit-id="e-5df4e38c-6be4-4fd7-a5f6-bfaa9d4af462" />均为相对值；z 为曲面高度。</Typography>
      </>} /></div>
      <div shuku-edit-id="e-b75389b2-3412-49f8-a6c9-34c50cebeff8" className="cg-wormhole-controls">
        <RangeControl label="径向拉应力（相对值）" min={.6} max={2.4} step={.1} value={tension} digits={1} onChange={event => { setTension(Number(event.currentTarget.value)); }} hint />
        <div shuku-edit-id="e-c8479b91-e9bd-4ba5-991e-be7abbfe703c" className="cg-wormhole-energy-control">
          <RangeControl label="能量密度（相对值）" min={-1.5} max={1.5} step={.1} value={energyDensity} digits={1} onChange={event => { setEnergyDensity(Number(event.currentTarget.value)); }} />
          <span shuku-edit-id="e-05288f2d-a2fa-4a1f-a674-0c6fecde3de8" className="cg-wormhole-energy-help"><ExplainPanelButton label="为什么能量密度有正负？为什么范围是负1.5到正1.5？">
            <Typography shuku-edit-id="e-f97aafe7-be5a-42a6-8cb1-a945e2a87e12" as="div" variant="bodySmall" tone="accent">为什么能量密度有正负？</Typography>
            <Typography shuku-edit-id="e-004fb0c5-a9bd-4177-ac36-5fc054e43ae7" as="div" variant="bodySmall">这里表示喉部静止观察者测得的局部能量密度。正值表示正能量密度；负值表示模型假设的负能量密度，普通物质通常不具备这种性质。</Typography>
            <Typography shuku-edit-id="e-65af8e02-c030-46cf-84aa-609c9c677329" as="div" variant="bodySmall">“相对值”是除以一个固定的正能量密度基准，并非减去平均值，所以归一化不会改变正负号。</Typography>
            <Typography shuku-edit-id="e-21d261b8-d840-49db-813e-66df690087d7" as="div" variant="bodySmall">−1.5～1.5 是本演示选定的探索范围，不是物理上下限；±1.5 表示该基准的 ±1.5 倍。</Typography>
            <Typography shuku-edit-id="e-ef63cbd2-2663-4537-abc9-094825a0d0bd" as="div" variant="bodySmall">本页静态模型要求能量密度 ε 小于径向拉应力 τ，因此 ε 为正时也可能满足条件。例如 ε = 0.5、τ = 1；此时仍违反径向零能量条件（ε − τ &lt; 0）。</Typography>
          </ExplainPanelButton></span>
        </div>
        <div shuku-edit-id="e-5af243c6-bb15-4ba5-9e3b-9e7cdaae7740" className="cg-wormhole-result"><Typography shuku-edit-id="e-d8969054-2072-4d9c-8946-b235646c2d94" variant="bodySmall" tone="muted">喉部半径</Typography><Typography shuku-edit-id="e-5c5c1df7-c648-4579-a6f2-08fb793567fb" as="output" variant="h3" tone="accent">{model.valid ? model.radiusMetres.toFixed(1) + ' m' : '—'}</Typography></div>
        <Typography shuku-edit-id="e-c5f713f6-7ca8-4f80-9be6-5d24ef4709e0" variant="bodySmall" tone={model.valid ? "success" : "warning"}>{model.valid ? "能量密度低于拉应力" : "能量密度须低于拉应力"}</Typography>
        <Typography shuku-edit-id="e-e1fd375b-8f8d-4794-ab2e-30d8e6cd9569" variant="bodySmall" tone="muted">恒速 {TRAVEL_SPEED} m/s<br shuku-edit-id="e-c30fadd5-f830-406f-aae7-76a8bd96a7f9" />每秒 1 个示踪点 · 动画 {PLAYBACK_RATE} 倍速</Typography>
      </div>
    </div>
    <section shuku-edit-id="e-d4b65130-c60b-4fed-ac4d-bd76ffe4476a" className="cg-wormhole-times" aria-label="A到B的通行时间对比">
      <div shuku-edit-id="e-e5bfbecb-8f88-41c7-9112-bbf954fe496f" className="cg-wormhole-time-card cg-wormhole-time-card--original"><Typography shuku-edit-id="e-2964d56b-8117-4f94-95ea-2c1806de34b3" variant="bodySmall" tone="inherit">原有路径</Typography><Typography shuku-edit-id="e-3a72abcb-e897-4cbd-8d15-c9c28164d5dd" as="output" variant="h3" tone="inherit">{result.originalTime.toFixed(1)} 秒</Typography></div>
      <div shuku-edit-id="e-3233a6ce-85b0-4dd6-8af0-9b36ca39ceda" className="cg-wormhole-time-card cg-wormhole-time-card--shortcut"><Typography shuku-edit-id="e-0a8fdc9d-7b32-4db9-8ce6-d9b1b1ab5cf1" variant="bodySmall" tone="inherit">虫洞路径</Typography><Typography shuku-edit-id="e-16f7b416-608a-4f38-b20d-5eed2426520c" as="output" variant="h3" tone="inherit">{result.wormholeTime === null ? '无通路' : result.wormholeTime.toFixed(1) + ' 秒'}</Typography></div>
      <div shuku-edit-id="e-e90ef409-9333-4af9-b6da-7d2bbc7ccf45" className="cg-wormhole-time-card cg-wormhole-time-card--saving"><div shuku-edit-id="e-51bf572c-5408-41f5-9d73-6e8ccdb4e271" className="cg-wormhole-time-card-heading"><Typography shuku-edit-id="e-a259bf39-b999-4e6b-a654-b0777d0eb906" variant="bodySmall" tone="inherit">{saved !== null && saved < 0 ? '增加时间' : '节省时间'}</Typography>{saved !== null && <Typography shuku-edit-id="e-3926119e-4615-4ca4-9faa-248ec387d98a" as="span" variant="bodySmall" tone="muted">{Math.abs(saved / result.originalTime * 100).toFixed(1)}%</Typography>}</div><Typography shuku-edit-id="e-465b1790-7bb1-40fb-801d-9fd64fdaabb5" as="output" variant="h3" tone="inherit">{saved === null ? '—' : Math.abs(saved).toFixed(1) + ' 秒'}</Typography></div>
    </section>
  </div>;
}
