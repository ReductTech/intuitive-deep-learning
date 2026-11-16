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
  return <div shuku-edit-id="e-497a4238-92c1-4a23-bfc0-30baf4b3dc06" className="cg-wormhole-lab" data-tension={tension} data-energy-density={energyDensity} data-valid={model.valid}>
    <Typography shuku-edit-id="e-70bd94f6-dec9-4b54-a657-08114a55d4cf" as="h2" variant="h3" tone="accent">虫洞几何与通行时间</Typography>
    <div shuku-edit-id="e-2d5aee70-bf35-4ab9-8c44-90608f5d7fda" className="cg-wormhole-lab-main">
      <div shuku-edit-id="e-49beb1c6-e360-4419-b1c9-a5df145d35e2" className="cg-wormhole-visual"><WormholeScene throat={model.throat} ratio={model.ratio} valid={model.valid} paths={result.paths} routeMode="available" throatDetails={<>
        <Typography shuku-edit-id="e-1e4b4ffd-76dd-42fa-8661-834799d8cbe5" variant="bodySmall" tone="accent">曲面形状（本页模型）</Typography>
        <MathFormulaBlock appearance="plain" ariaLabel="形状函数b(r)等于R乘以r除以R的能量密度与径向拉应力比次方；曲面高度z对r的导数为正负根号下b除以r减b；R等于10米除以拉应力相对值的平方根">
          <MathFormulaStatic latex={String.raw`\begin{gathered}b(r)=R\left(\frac{r}{R}\right)^{\varepsilon/\tau},\quad R=\frac{10\,\mathrm{m}}{\sqrt{\tau}}\\[6pt]\frac{dz}{dr}=\pm\left[\frac{b(r)}{r-b(r)}\right]^{1/2}\end{gathered}`} />
        </MathFormulaBlock>
        <Typography shuku-edit-id="e-2b3ae1f9-00bd-4255-b0bc-ec278ddc1fd0" variant="bodySmall" tone="muted">τ：径向拉应力　ε：能量密度<br shuku-edit-id="e-a08a299d-469d-4727-8b3e-bd1d5a38750e" />均为相对值；z 为曲面高度。</Typography>
      </>} /></div>
      <div shuku-edit-id="e-e88e03cb-c629-4313-a182-dddf22b8dd44" className="cg-wormhole-controls">
        <RangeControl label="径向拉应力（相对值）" min={.6} max={2.4} step={.1} value={tension} digits={1} onChange={event => { setTension(Number(event.currentTarget.value)); }} hint />
        <div shuku-edit-id="e-2e4dad2e-ea50-4904-b42f-5ed4fd1556df" className="cg-wormhole-energy-control">
          <RangeControl label="能量密度（相对值）" min={-1.5} max={1.5} step={.1} value={energyDensity} digits={1} onChange={event => { setEnergyDensity(Number(event.currentTarget.value)); }} />
          <span shuku-edit-id="e-bfc6f669-f08f-4b91-9af1-f15355727bf1" className="cg-wormhole-energy-help"><ExplainPanelButton label="为什么能量密度有正负？为什么范围是负1.5到正1.5？">
            <Typography shuku-edit-id="e-8e632f5c-8ad4-4579-85c5-60519d0b3882" as="div" variant="bodySmall" tone="accent">为什么能量密度有正负？</Typography>
            <Typography shuku-edit-id="e-e3c223be-2c54-433b-a49c-43763bfb2de9" as="div" variant="bodySmall">这里表示喉部静止观察者测得的局部能量密度。正值表示正能量密度；负值表示模型假设的负能量密度，普通物质通常不具备这种性质。</Typography>
            <Typography shuku-edit-id="e-e9ad2505-46b4-49e4-8e42-505fed4dc22c" as="div" variant="bodySmall">“相对值”是除以一个固定的正能量密度基准，并非减去平均值，所以归一化不会改变正负号。</Typography>
            <Typography shuku-edit-id="e-57b117b1-dfe3-4cf2-acc1-ad5a83993714" as="div" variant="bodySmall">−1.5～1.5 是本演示选定的探索范围，不是物理上下限；±1.5 表示该基准的 ±1.5 倍。</Typography>
            <Typography shuku-edit-id="e-caa5ed49-acec-4af5-8da1-e508e72459c2" as="div" variant="bodySmall">本页静态模型要求能量密度 ε 小于径向拉应力 τ，因此 ε 为正时也可能满足条件。例如 ε = 0.5、τ = 1；此时仍违反径向零能量条件（ε − τ &lt; 0）。</Typography>
          </ExplainPanelButton></span>
        </div>
        <div shuku-edit-id="e-9875cb2a-5958-494f-a054-33d705f386d1" className="cg-wormhole-result"><Typography shuku-edit-id="e-5a55b0d4-bb05-44c8-a08b-eb27c41f47ec" variant="bodySmall" tone="muted">喉部半径</Typography><Typography shuku-edit-id="e-bf314d8e-048f-4650-8b08-8883d24952e6" as="output" variant="h3" tone="accent">{model.valid ? model.radiusMetres.toFixed(1) + ' m' : '—'}</Typography></div>
        <Typography shuku-edit-id="e-ab141427-7812-4d83-9382-2c4cd56312aa" variant="bodySmall" tone={model.valid ? "success" : "warning"}>{model.valid ? "能量密度低于拉应力" : "能量密度须低于拉应力"}</Typography>
        <Typography shuku-edit-id="e-16f31d59-edcf-40d6-baa3-85cb9630f0bc" variant="bodySmall" tone="muted">恒速 {TRAVEL_SPEED} m/s<br shuku-edit-id="e-598cbaec-04e0-4066-947c-28851dbf501f" />每秒 1 个示踪点 · 动画 {PLAYBACK_RATE} 倍速</Typography>
      </div>
    </div>
    <section shuku-edit-id="e-f8183337-fbd4-4dce-ad64-5b4eccdbaa6f" className="cg-wormhole-times" aria-label="A到B的通行时间对比">
      <div shuku-edit-id="e-351aff54-7a1c-48fe-8ab0-037b83a40e75" className="cg-wormhole-time-card cg-wormhole-time-card--original"><Typography shuku-edit-id="e-cc53826d-df84-4975-8cfd-888b8e056138" variant="bodySmall" tone="inherit">原有路径</Typography><Typography shuku-edit-id="e-ff343144-16d4-42df-8200-0dc6e905be7a" as="output" variant="h3" tone="inherit">{result.originalTime.toFixed(1)} 秒</Typography></div>
      <div shuku-edit-id="e-06daa151-c41d-40c9-9c6a-b905e94637a4" className="cg-wormhole-time-card cg-wormhole-time-card--shortcut"><Typography shuku-edit-id="e-9f8f5c62-3c93-48e5-90d0-f2fbe4db6503" variant="bodySmall" tone="inherit">虫洞路径</Typography><Typography shuku-edit-id="e-aa236127-9198-4f8b-8081-30e76945d258" as="output" variant="h3" tone="inherit">{result.wormholeTime === null ? '无通路' : result.wormholeTime.toFixed(1) + ' 秒'}</Typography></div>
      <div shuku-edit-id="e-58808d88-2d10-44e8-9de1-1b5f9ae0b5fa" className="cg-wormhole-time-card cg-wormhole-time-card--saving"><div shuku-edit-id="e-7fe10ca4-697a-4942-9768-4073ea4cd65f" className="cg-wormhole-time-card-heading"><Typography shuku-edit-id="e-4a109cdc-a673-49b0-a893-9b4d2f904734" variant="bodySmall" tone="inherit">{saved !== null && saved < 0 ? '增加时间' : '节省时间'}</Typography>{saved !== null && <Typography shuku-edit-id="e-ff321ec4-953f-4ae5-a63c-7a44f7c6b596" as="span" variant="bodySmall" tone="muted">{Math.abs(saved / result.originalTime * 100).toFixed(1)}%</Typography>}</div><Typography shuku-edit-id="e-9b9c5fcd-ea09-4435-a3af-ca496bdda906" as="output" variant="h3" tone="inherit">{saved === null ? '—' : Math.abs(saved).toFixed(1) + ' 秒'}</Typography></div>
    </section>
  </div>;
}
