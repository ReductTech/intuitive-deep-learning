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
  return <div shuku-edit-id="e-1f200224-14de-408d-88c7-77368ed4667d" className="llmpe-cg-wormhole-lab" data-tension={tension} data-energy-density={energyDensity} data-valid={model.valid}>
    <Typography shuku-edit-id="e-4f2eb702-0349-4316-b1a5-a1dab8f68cab" as="h2" variant="h3" tone="accent">虫洞几何与通行时间</Typography>
    <div shuku-edit-id="e-86519ed7-75bc-4d82-a728-1049a935ae9a" className="llmpe-cg-wormhole-lab-main">
      <div shuku-edit-id="e-ee7653f0-6dba-4c63-bdbd-456f26d0e8da" className="llmpe-cg-wormhole-visual"><WormholeScene throat={model.throat} ratio={model.ratio} valid={model.valid} paths={result.paths} routeMode="available" throatDetails={<>
        <Typography shuku-edit-id="e-c56eb272-4120-418b-9c20-2c0393616d03" variant="bodySmall" tone="accent">曲面形状（本页模型）</Typography>
        <MathFormulaBlock appearance="plain" ariaLabel="形状函数b(r)等于R乘以r除以R的能量密度与径向拉应力比次方；曲面高度z对r的导数为正负根号下b除以r减b；R等于10米除以拉应力相对值的平方根">
          <MathFormulaStatic latex={String.raw`\begin{gathered}b(r)=R\left(\frac{r}{R}\right)^{\varepsilon/\tau},\quad R=\frac{10\,\mathrm{m}}{\sqrt{\tau}}\\[6pt]\frac{dz}{dr}=\pm\left[\frac{b(r)}{r-b(r)}\right]^{1/2}\end{gathered}`} />
        </MathFormulaBlock>
        <Typography shuku-edit-id="e-06842877-629c-489c-b0e9-d71aa628e88a" variant="bodySmall" tone="muted">τ：径向拉应力　ε：能量密度<br shuku-edit-id="e-3f0c7ff5-5c9a-4406-b1c5-ad206e855fef" />均为相对值；z 为曲面高度。</Typography>
      </>} /></div>
      <div shuku-edit-id="e-edcadd75-f891-4bda-8d9f-31e0de8ed74f" className="llmpe-cg-wormhole-controls">
        <RangeControl label="径向拉应力（相对值）" min={.6} max={2.4} step={.1} value={tension} digits={1} onChange={event => { setTension(Number(event.currentTarget.value)); }} hint />
        <div shuku-edit-id="e-257432c3-0c90-4d44-a451-592e2a8770db" className="llmpe-cg-wormhole-energy-control">
          <RangeControl label="能量密度（相对值）" min={-1.5} max={1.5} step={.1} value={energyDensity} digits={1} onChange={event => { setEnergyDensity(Number(event.currentTarget.value)); }} />
          <span shuku-edit-id="e-87bcb417-4de1-43d4-8ccb-d3768afa26ec" className="llmpe-cg-wormhole-energy-help"><ExplainPanelButton label="为什么能量密度有正负？为什么范围是负1.5到正1.5？">
            <Typography shuku-edit-id="e-688c79ed-d6b7-4ef0-bad6-f455f2b1e81a" as="div" variant="bodySmall" tone="accent">为什么能量密度有正负？</Typography>
            <Typography shuku-edit-id="e-3e89aed3-0e74-4fd6-a162-b1bcc8b245db" as="div" variant="bodySmall">这里表示喉部静止观察者测得的局部能量密度。正值表示正能量密度；负值表示模型假设的负能量密度，普通物质通常不具备这种性质。</Typography>
            <Typography shuku-edit-id="e-218f56e7-058c-4baf-a1b2-272894da701c" as="div" variant="bodySmall">“相对值”是除以一个固定的正能量密度基准，并非减去平均值，所以归一化不会改变正负号。</Typography>
            <Typography shuku-edit-id="e-726974e6-df7a-45e3-a920-38128b0d5a51" as="div" variant="bodySmall">−1.5～1.5 是本演示选定的探索范围，不是物理上下限；±1.5 表示该基准的 ±1.5 倍。</Typography>
            <Typography shuku-edit-id="e-d412d5a6-c189-424e-92cf-1c2f0d5f7f14" as="div" variant="bodySmall">本页静态模型要求能量密度 ε 小于径向拉应力 τ，因此 ε 为正时也可能满足条件。例如 ε = 0.5、τ = 1；此时仍违反径向零能量条件（ε − τ &lt; 0）。</Typography>
          </ExplainPanelButton></span>
        </div>
        <div shuku-edit-id="e-083695b2-e0d7-4b8c-b9c0-7e7bf798339f" className="llmpe-cg-wormhole-result"><Typography shuku-edit-id="e-f1f61855-cb65-45a1-868a-50eb3eb25f9a" variant="bodySmall" tone="muted">喉部半径</Typography><Typography shuku-edit-id="e-b54898ce-27f9-4d5e-b754-5556f0ecd39b" as="output" variant="h3" tone="accent">{model.valid ? model.radiusMetres.toFixed(1) + ' m' : '—'}</Typography></div>
        <Typography shuku-edit-id="e-f05d640e-4bb9-4050-98f8-55e070fd334b" variant="bodySmall" tone={model.valid ? "success" : "warning"}>{model.valid ? "能量密度低于拉应力" : "能量密度须低于拉应力"}</Typography>
        <Typography shuku-edit-id="e-0b30f740-cefa-405b-90f4-7784765ae92d" variant="bodySmall" tone="muted">恒速 {TRAVEL_SPEED} m/s<br shuku-edit-id="e-6580deb1-f0b8-43af-bee7-3c0f53813d2f" />每秒 1 个示踪点 · 动画 {PLAYBACK_RATE} 倍速</Typography>
      </div>
    </div>
    <section shuku-edit-id="e-cbad560c-a613-4fe2-9a54-74cdaa26ad65" className="llmpe-cg-wormhole-times" aria-label="A到B的通行时间对比">
      <div shuku-edit-id="e-3041a515-f4e2-4504-8507-0ffddabdf45e" className="llmpe-cg-wormhole-time-card llmpe-cg-wormhole-time-card--original"><Typography shuku-edit-id="e-9cbd132b-deb3-4d76-bf96-0925885cdd4d" variant="bodySmall" tone="inherit">原有路径</Typography><Typography shuku-edit-id="e-7ca8c000-889a-4ac6-a5ca-0f41a25e4418" as="output" variant="h3" tone="inherit">{result.originalTime.toFixed(1)} 秒</Typography></div>
      <div shuku-edit-id="e-7f7f0b99-bf0a-4243-be51-54d18553d17c" className="llmpe-cg-wormhole-time-card llmpe-cg-wormhole-time-card--shortcut"><Typography shuku-edit-id="e-c052beb7-d7a8-4f92-9273-2d25b25caba4" variant="bodySmall" tone="inherit">虫洞路径</Typography><Typography shuku-edit-id="e-9d37e7fa-bfca-43d3-bfb0-f024642219ff" as="output" variant="h3" tone="inherit">{result.wormholeTime === null ? '无通路' : result.wormholeTime.toFixed(1) + ' 秒'}</Typography></div>
      <div shuku-edit-id="e-30cc6694-b968-48b6-ad28-03a07816ea52" className="llmpe-cg-wormhole-time-card llmpe-cg-wormhole-time-card--saving"><div shuku-edit-id="e-04f3a14a-9df4-4eb4-be08-4797be2f7b51" className="llmpe-cg-wormhole-time-card-heading"><Typography shuku-edit-id="e-5bb34a34-652b-4d35-8878-ca5d4434441a" variant="bodySmall" tone="inherit">{saved !== null && saved < 0 ? '增加时间' : '节省时间'}</Typography>{saved !== null && <Typography shuku-edit-id="e-654acf68-1083-490d-872d-0d121750f542" as="span" variant="bodySmall" tone="muted">{Math.abs(saved / result.originalTime * 100).toFixed(1)}%</Typography>}</div><Typography shuku-edit-id="e-6a30c9ef-f368-47c5-826f-dfe03e5b22c6" as="output" variant="h3" tone="inherit">{saved === null ? '—' : Math.abs(saved).toFixed(1) + ' 秒'}</Typography></div>
    </section>
  </div>;
}
