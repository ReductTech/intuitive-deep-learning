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
  return <div shuku-edit-id="e-f748d033-b4d1-4144-a892-82269d3fb8d1" className="aipe-replay-cg-wormhole-lab" data-tension={tension} data-energy-density={energyDensity} data-valid={model.valid}>
    <Typography shuku-edit-id="e-dad3f26f-b2da-4d64-90b5-8556b82349f1" as="h2" variant="h3" tone="accent">虫洞几何与通行时间</Typography>
    <div shuku-edit-id="e-5fddc1d3-135e-4a5a-a550-b79a4388cfb3" className="aipe-replay-cg-wormhole-lab-main">
      <div shuku-edit-id="e-e400cec0-828a-453c-9f27-daeb40fc6d94" className="aipe-replay-cg-wormhole-visual"><WormholeScene throat={model.throat} ratio={model.ratio} valid={model.valid} paths={result.paths} routeMode="available" throatDetails={<>
        <Typography shuku-edit-id="e-a0ccb5bc-7c99-46d3-9dc5-86b73cf2e433" variant="bodySmall" tone="accent">曲面形状（本页模型）</Typography>
        <MathFormulaBlock appearance="plain" ariaLabel="形状函数b(r)等于R乘以r除以R的能量密度与径向拉应力比次方；曲面高度z对r的导数为正负根号下b除以r减b；R等于10米除以拉应力相对值的平方根">
          <MathFormulaStatic latex={String.raw`\begin{gathered}b(r)=R\left(\frac{r}{R}\right)^{\varepsilon/\tau},\quad R=\frac{10\,\mathrm{m}}{\sqrt{\tau}}\\[6pt]\frac{dz}{dr}=\pm\left[\frac{b(r)}{r-b(r)}\right]^{1/2}\end{gathered}`} />
        </MathFormulaBlock>
        <Typography shuku-edit-id="e-3585d312-a87a-4a91-9a41-623032b43c11" variant="bodySmall" tone="muted">τ：径向拉应力　ε：能量密度<br shuku-edit-id="e-3503ab43-81b0-4773-9a1e-8747e7fc5286" />均为相对值；z 为曲面高度。</Typography>
      </>} /></div>
      <div shuku-edit-id="e-870544de-aa3c-4ff5-9fa4-7fc0f1ac61ec" className="aipe-replay-cg-wormhole-controls">
        <RangeControl label="径向拉应力（相对值）" min={.6} max={2.4} step={.1} value={tension} digits={1} onChange={event => { setTension(Number(event.currentTarget.value)); }} hint />
        <div shuku-edit-id="e-36ccd283-1840-4a4f-aa03-21eb2a129d94" className="aipe-replay-cg-wormhole-energy-control">
          <RangeControl label="能量密度（相对值）" min={-1.5} max={1.5} step={.1} value={energyDensity} digits={1} onChange={event => { setEnergyDensity(Number(event.currentTarget.value)); }} />
          <span shuku-edit-id="e-32ccc026-56d8-4016-a780-a4d4d5ab3081" className="aipe-replay-cg-wormhole-energy-help"><ExplainPanelButton label="为什么能量密度有正负？为什么范围是负1.5到正1.5？">
            <Typography shuku-edit-id="e-1d713ef0-0789-4905-9944-14639e45f233" as="div" variant="bodySmall" tone="accent">为什么能量密度有正负？</Typography>
            <Typography shuku-edit-id="e-b03fb292-f7b6-4ac7-93eb-09d9b175ea4b" as="div" variant="bodySmall">这里表示喉部静止观察者测得的局部能量密度。正值表示正能量密度；负值表示模型假设的负能量密度，普通物质通常不具备这种性质。</Typography>
            <Typography shuku-edit-id="e-d3feb57e-2a28-45bf-8439-f6c4757c88d6" as="div" variant="bodySmall">“相对值”是除以一个固定的正能量密度基准，并非减去平均值，所以归一化不会改变正负号。</Typography>
            <Typography shuku-edit-id="e-c73fcc8d-04d4-468d-aaf1-5a91d7dffb4a" as="div" variant="bodySmall">−1.5～1.5 是本演示选定的探索范围，不是物理上下限；±1.5 表示该基准的 ±1.5 倍。</Typography>
            <Typography shuku-edit-id="e-1bffd1d9-447f-42db-a153-b63aad9ef854" as="div" variant="bodySmall">本页静态模型要求能量密度 ε 小于径向拉应力 τ，因此 ε 为正时也可能满足条件。例如 ε = 0.5、τ = 1；此时仍违反径向零能量条件（ε − τ &lt; 0）。</Typography>
          </ExplainPanelButton></span>
        </div>
        <div shuku-edit-id="e-f0b29418-b404-40b0-85f3-345ee5b5c96e" className="aipe-replay-cg-wormhole-result"><Typography shuku-edit-id="e-c561a6af-9ee3-45d1-ad48-d64e84709cd1" variant="bodySmall" tone="muted">喉部半径</Typography><Typography shuku-edit-id="e-535958b0-24a7-4056-ba1a-34f70901d0d4" as="output" variant="h3" tone="accent">{model.valid ? model.radiusMetres.toFixed(1) + ' m' : '—'}</Typography></div>
        <Typography shuku-edit-id="e-1d78b990-c698-49a6-85db-e81196bc2033" variant="bodySmall" tone={model.valid ? "success" : "warning"}>{model.valid ? "能量密度低于拉应力" : "能量密度须低于拉应力"}</Typography>
        <Typography shuku-edit-id="e-c39ee446-7548-4197-a971-cea9aadcf435" variant="bodySmall" tone="muted">恒速 {TRAVEL_SPEED} m/s<br shuku-edit-id="e-9ace5abe-419e-43fd-a5cd-da08c37c5be2" />每秒 1 个示踪点 · 动画 {PLAYBACK_RATE} 倍速</Typography>
      </div>
    </div>
    <section shuku-edit-id="e-918d2825-3ac9-479d-8354-82d1d7d1ba0d" className="aipe-replay-cg-wormhole-times" aria-label="A到B的通行时间对比">
      <div shuku-edit-id="e-04f3b9a4-dd1f-456c-92a2-82c8a92e606d" className="aipe-replay-cg-wormhole-time-card aipe-replay-cg-wormhole-time-card--original"><Typography shuku-edit-id="e-4217ba44-7142-4496-9177-88b2881ac7dc" variant="bodySmall" tone="inherit">原有路径</Typography><Typography shuku-edit-id="e-4bf833a1-7efb-43ab-8ee7-80afae9214be" as="output" variant="h3" tone="inherit">{result.originalTime.toFixed(1)} 秒</Typography></div>
      <div shuku-edit-id="e-72ee8566-a6b5-47d8-88ee-4aef889513bf" className="aipe-replay-cg-wormhole-time-card aipe-replay-cg-wormhole-time-card--shortcut"><Typography shuku-edit-id="e-11c4f03d-1e26-4d29-973b-6a1289a4627a" variant="bodySmall" tone="inherit">虫洞路径</Typography><Typography shuku-edit-id="e-e54ac170-3b08-46ce-82be-a38def916dd2" as="output" variant="h3" tone="inherit">{result.wormholeTime === null ? '无通路' : result.wormholeTime.toFixed(1) + ' 秒'}</Typography></div>
      <div shuku-edit-id="e-8f5c6cf8-30c7-403f-9ba1-4e8517ac1165" className="aipe-replay-cg-wormhole-time-card aipe-replay-cg-wormhole-time-card--saving"><div shuku-edit-id="e-a32a81cf-a3a1-44cf-8a71-0825b6cd98fd" className="aipe-replay-cg-wormhole-time-card-heading"><Typography shuku-edit-id="e-18dd2ade-0c36-497f-bedd-68bca42ce48d" variant="bodySmall" tone="inherit">{saved !== null && saved < 0 ? '增加时间' : '节省时间'}</Typography>{saved !== null && <Typography shuku-edit-id="e-2eba14af-c219-4e77-9287-a1a466249d0a" as="span" variant="bodySmall" tone="muted">{Math.abs(saved / result.originalTime * 100).toFixed(1)}%</Typography>}</div><Typography shuku-edit-id="e-9aa9c59d-0f1f-4d32-bbbb-ef2550217104" as="output" variant="h3" tone="inherit">{saved === null ? '—' : Math.abs(saved).toFixed(1) + ' 秒'}</Typography></div>
    </section>
  </div>;
}
