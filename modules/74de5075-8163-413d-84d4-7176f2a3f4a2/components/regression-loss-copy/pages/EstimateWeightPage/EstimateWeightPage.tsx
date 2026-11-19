import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { Star } from '@icon-park/react';
import { ELEPHANT_KG, TARGET_DEPTH_CM } from '../CaoChongPage/experiment';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Button, ContentBlock, EChartsChart, Typography } from "@shuku/course-style/react";
import { getManualFit, saveManualFit, useRecordedData } from '../../regressionData';
import './EstimateWeightPage.css';

const clamp = (value: number) => Math.max(.008, Math.min(.04, value));

export function EstimateWeightPage({ showLoss = false }: { showLoss?: boolean } = {}) {
  const calibration = useRecordedData();
  const [slope, setSlope] = useState(() => showLoss ? getManualFit(calibration)?.w ?? 46 / 3000 : 46 / 3000);
  useEffect(() => { if (showLoss && calibration.length) saveManualFit(slope, calibration); }, [showLoss, slope, calibration]);
  const [submittedMass,setSubmittedMass] = useState<number|null>(null);
  const endpointX = Math.min(3000, 48 / slope);
  const endpointY = slope * endpointX;
  const plotRef = useRef<HTMLDivElement>(null);
  // Read the student's chosen line; do not calculate a best-fit line or grade it.
  const mass = TARGET_DEPTH_CM / slope;
  const errors = calibration.map(p=>p.depth-slope*p.mass);
  const mae = errors.length ? errors.reduce((sum,e)=>sum+Math.abs(e),0)/errors.length : 0;
  const mse = errors.length ? errors.reduce((sum,e)=>sum+e*e,0)/errors.length : 0;
  const inRange = mass <= 3000;
  const difference = submittedMass === null ? 0 : Number(Math.abs(submittedMass-ELEPHANT_KG).toFixed(1));
  const stars = difference<=100 ? 3 : difference<=300 ? 2 : 1;
  const adjust = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(1, (event.clientX - rect.left - rect.width * .10) / (rect.width * .84) * 3000);
    const y = Math.max(0, (1 - (event.clientY - rect.top - rect.height * .12) / (rect.height * .74)) * 48);
    const next = clamp(y / x); setSlope(next); if (showLoss) saveManualFit(next, calibration);
  };
  const option = useMemo(() => ({
    animation: false,
    grid: { left: '10%', right: '6%', top: '12%', bottom: '14%' },
    tooltip: { trigger: 'item', formatter: (item: { value: number[] }) => `${item.value[0]} 千克 · ${item.value[1].toFixed(1)} 厘米` },
    xAxis: { type: 'value', min: 0, max: 3000, interval: 1000, name: '累计石重（千克）', nameLocation: 'middle', nameGap: 44,
      nameTextStyle: { color: '#27446e', fontSize: 28 }, axisLabel: { color: '#526582', fontSize: 24 }, axisLine: { show: true, lineStyle: { color: '#526582' } }, splitLine: { show: false } },
    yAxis: { type: 'value', min: 0, max: 48, interval: 16, name: '下沉深度（厘米）', nameGap: 25,
      nameTextStyle: { color: '#27446e', fontSize: 28, align: 'left' }, axisLabel: { color: '#526582', fontSize: 24 }, axisLine: { show: true, lineStyle: { color: '#526582' } }, splitLine: { lineStyle: { color: 'rgba(82,101,130,.16)' } } },
    series: [
      ...(showLoss ? calibration.map(p => ({ type: 'line', symbol: 'none', data: [[p.mass, slope * p.mass], [p.mass, p.depth]], lineStyle: { color: '#dda15a', width: 2, opacity: .8 }, silent: true })) : []),
      { type: 'line', symbol: 'none', data: [[0, 0], [Math.min(1500, endpointX), slope * Math.min(1500, endpointX)]], lineStyle: { color: '#168c97', width: 4 }, silent: true },
      { type: 'line', symbol: 'none', data: endpointX > 1500 ? [[1500, slope * 1500], [endpointX, endpointY]] : [], lineStyle: { color: '#168c97', width: 4, type: 'dashed' }, silent: true },
      { type: 'scatter', symbolSize: 17, data: calibration.map(p => [p.mass, p.depth]), itemStyle: { color: '#27446e', borderColor: '#fff', borderWidth: 2 }, z: 5 },
      { type: 'line', symbol: 'none', data: [[0, TARGET_DEPTH_CM], [inRange ? mass : 3000, TARGET_DEPTH_CM]], lineStyle: { color: '#ca740f', width: 2, type: 'dashed' }, silent: true },
      { type: 'line', symbol: 'none', data: inRange ? [[mass, TARGET_DEPTH_CM], [mass, 0]] : [], lineStyle: { color: '#ca740f', width: 3, type: 'dashed' }, silent: true },
      { type: 'scatter', symbolSize: 19, data: inRange ? [[mass, TARGET_DEPTH_CM]] : [], itemStyle: { color: '#ca740f' }, silent: true, z: 7 },
    ],
  }), [slope, endpointX, endpointY, inRange, mass, calibration, showLoss, TARGET_DEPTH_CM]);
  if(!calibration.length)return <ContentBlock shuku-edit-id="e-8d703368-8017-4fa0-b328-b9f6b2c768c6" title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock shuku-edit-id="e-dd9783a5-1373-4ec2-9540-9d01e9e2e3cf" headingLevel={1} title={showLoss ? "调整直线，估计象重" : "石头不足，如何估计象重？"} subtitle={showLoss ? "让直线贴近观测，观察损失与象重估计的变化。" : "根据已有观测，选择一条直线进行估计。"} className={`spp-regression-estimate-page${showLoss ? ' spp-regression-estimate-challenge-page' : ''}`}
    style={{ '--spp-regression-est-background': `url("${moduleAssetUrl("regression-loss-copy/cao-chong/estimate-background.webp")}")` } as CSSProperties}>
    <div shuku-edit-id="e-8b7b3932-f2de-40dd-9412-7e71288bb8e1" className={`spp-regression-estimate-content${showLoss ? ' spp-regression-estimate-content--loss' : ''}`}>
    <div shuku-edit-id="e-09172ca0-a68e-450b-90eb-006461f56e94" className="spp-regression-estimate-layout">
      <section shuku-edit-id="e-02277c95-2dba-4f79-a837-eed322a11376" className="spp-regression-estimate-plot" aria-label="调整直线并根据大象水位估计重量">
        {showLoss && <div shuku-edit-id="e-976a01c0-9b8e-4feb-bdf8-c73ec6f47d8d" className="spp-regression-estimate-plot-heading"><Typography shuku-edit-id="e-342480dd-a687-455e-81ff-dbb18e9b2d7e" variant="h3" tone="accent">观测与预测</Typography><Typography shuku-edit-id="e-5f8a3cee-dd90-4625-8c30-999b846797d0" variant="bodySmall" className="spp-regression-estimate-drag-hint">拖动端点调整直线</Typography></div>}
        <div shuku-edit-id="e-19aa2382-890a-4a82-8571-97dca3fbaccc" className="spp-regression-estimate-plot-canvas" ref={plotRef}>
        <EChartsChart className="spp-regression-estimate-chart" option={option} minHeight={0} aria-label="石重与下沉深度的观测记录，实线表示已测范围，虚线表示趋势延伸" />
        <button shuku-edit-id="e-2a699dfb-ec26-480c-96e8-d391dac536bf" className="spp-regression-estimate-handle" role="slider" aria-label="直线端点" aria-valuemin={.008} aria-valuemax={.04} aria-valuenow={slope} aria-valuetext={`端点：${Math.round(endpointX)} 千克，${endpointY.toFixed(1)} 厘米；方向键调整直线`} title="沿上边缘或右边缘拖动，或使用方向键调整"
          style={{ left: `${10 + endpointX / 3000 * 84}%`, top: `${12 + (1 - endpointY / 48) * 74}%` }}
          onPointerDown={event => { if(event.isTrusted)event.currentTarget.setPointerCapture(event.pointerId); adjust(event); }}
          onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)||(!event.isTrusted&&event.buttons===1)) adjust(event); }}
          onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
          onKeyDown={event => {
            if (['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
              event.preventDefault();
              const next = event.key === 'Home' ? .008 : event.key === 'End' ? .04 : clamp(slope + (event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? .0002 : -.0002));
              setSlope(next); if (showLoss) saveManualFit(next, calibration);
            }
          }}><span shuku-edit-id="e-1b453b29-2a65-4d2f-8733-65fb1e4e3618" aria-hidden="true">↗</span></button>
        <Typography shuku-edit-id="e-a48337eb-1dee-490c-a223-c8f0be13fd9d" className="spp-regression-estimate-water-label" variant="bodySmall" tone="inherit" style={{top:`${12+(1-TARGET_DEPTH_CM/48)*74}%`}}>{TARGET_DEPTH_CM.toFixed(1)}</Typography>
        </div>
        {showLoss && <div shuku-edit-id="e-ea5e581d-ccb6-4bbf-aa5a-ade712c16a26" className="spp-regression-estimate-legend"><Typography shuku-edit-id="e-d80f6766-4dcd-4e87-8a4d-8da595531cb1" variant="bodySmall"><i shuku-edit-id="e-68942130-eaaa-4614-88de-6ff6a2e70047" className="spp-regression-estimate-legend-dot" />观测记录</Typography><Typography shuku-edit-id="e-e1cdaaca-0ae3-40b0-91dc-d26410570263" variant="bodySmall"><i shuku-edit-id="e-37fb0f82-d35f-45c8-b502-1ea8da219afd" className="spp-regression-estimate-legend-line" />预测直线</Typography><Typography shuku-edit-id="e-7463b859-59f7-41f6-9ff7-f4c0aa67aecf" variant="bodySmall"><i shuku-edit-id="e-c1a0ce81-e192-4d03-b4dd-9a3b5b0fba15" className="spp-regression-estimate-legend-error" />预测误差</Typography></div>}
      </section>
      <section shuku-edit-id="e-2931479b-fa03-4270-b921-c300c9ddf0fc" className="spp-regression-estimate-reasoning" aria-label="实时估重与可靠性问题">
        {showLoss && <div shuku-edit-id="e-66303c76-52e6-4d09-a4f8-1912590e9917" className="spp-regression-estimate-loss-card"><Typography shuku-edit-id="e-feee71b0-e600-4356-9ccb-3da9e788c7fd" variant="h3" tone="accent">当前拟合损失</Typography><div shuku-edit-id="e-4d14add4-50e2-4cec-a0f6-1c20dbfee6ae" className="spp-regression-estimate-loss-strip" aria-live="polite"><div shuku-edit-id="e-cb432eea-2665-40d5-b684-29041bb61934"><Typography shuku-edit-id="e-7691779c-988f-4fa3-9f96-0d9eaf2e214a" variant="body" className="spp-regression-estimate-metric-label" title="平均绝对误差">MAE</Typography><Typography shuku-edit-id="e-bbc34dc8-5527-413b-8319-6e272a6d118e" variant="h1" tone="accent">{mae.toFixed(1)}</Typography></div><div shuku-edit-id="e-fb7a0c29-e9b2-4796-97ea-bdc1025f0cd2"><Typography shuku-edit-id="e-bba30ddd-b388-46fe-97b9-845b12dd8be3" variant="body" className="spp-regression-estimate-metric-label" title="均方误差">MSE</Typography><Typography shuku-edit-id="e-0f4ef5fd-7134-4e30-9a59-5aa10190968d" variant="h1" tone="accent">{mse.toFixed(1)}</Typography></div></div><Typography shuku-edit-id="e-18fcfa20-c0c1-4ae0-8ad2-e08220f01b0e" variant="bodySmall" tone="muted" className="spp-regression-estimate-loss-caption">调整直线时实时更新</Typography></div>}
        <div shuku-edit-id="e-154ee251-2cac-49d2-b727-31bab8e5cbc4" className="spp-regression-estimate-instruction"><Typography shuku-edit-id="e-6bd937bc-49a7-4bf9-a327-03e29096f765" variant="h3" tone="accent">用直线估计象重</Typography><Typography shuku-edit-id="e-8b97ed34-87a9-4439-8c02-3aac6db1beca" variant="bodySmall" tone="muted">{showLoss ? "拖动端点，尝试降低 MAE 或 MSE，再观察象重估计。" : "拖动端点，使直线贴近散点的整体趋势。"}</Typography></div>
        <div shuku-edit-id="e-a5faaa22-63d7-4771-86ad-787db31df48d" className="spp-regression-estimate-estimation"><Typography shuku-edit-id="e-674f7e04-a933-4296-a0e8-dd4764074aa2" variant={showLoss ? "h3" : "body"} tone="accent">{showLoss ? "当前估计象重" : `下沉 ${TARGET_DEPTH_CM.toFixed(1)} 厘米，对应的估计重量`}</Typography>
          <div shuku-edit-id="e-d38c14c9-fb7f-41c1-a408-308d7218b2b8" className="spp-regression-estimate-value" aria-live="polite"><Typography shuku-edit-id="e-cc86aa80-5104-499b-a61f-c3844798d785" variant="h1" tone="accent">{showLoss ? <>{mass.toFixed(1)}<Typography shuku-edit-id="e-882ac983-d550-4478-991a-8d20b080381f" as="span" variant="h3"> 千克</Typography></> : `约 ${mass.toFixed(1)} 千克`}</Typography>{!showLoss && <Typography shuku-edit-id="e-53990d8d-72be-45d0-8d2a-6d8391d157ab" variant="bodySmall" tone="muted">随所选直线实时变化</Typography>}</div>
          {showLoss && <Typography shuku-edit-id="e-f241413b-27bb-47e2-acda-511e0bcb1434" variant="bodySmall" tone="muted">{inRange ? `由 ${TARGET_DEPTH_CM.toFixed(1)} 厘米水位反推` : '交点位于图示范围之外。'}</Typography>}
          {!showLoss && !inRange && <Typography shuku-edit-id="e-da59e89e-b7ab-4a61-8d43-3c29b294a716" variant="bodySmall" tone="muted">交点位于图示范围之外。</Typography>}
        </div>
        {showLoss ? <div shuku-edit-id="e-f68bda5d-d274-4f25-aa59-7d0decad1df8" className="spp-regression-estimate-question spp-regression-estimate-game">
          {submittedMass === null ? <><Typography shuku-edit-id="e-9592e4a0-5c9d-4879-8ec2-8282ec0c0a1d" variant="h3" tone="accent">这次估重有多准确？</Typography><Typography shuku-edit-id="e-c7a18613-90af-4ee7-8850-d7c5c86e129d" variant="bodySmall" tone="muted">调整直线后，提交当前估计，揭晓模拟中的真实象重。</Typography><Button variant="primary" onClick={()=>{ saveManualFit(slope, calibration); setSubmittedMass(mass); }}>揭晓真实象重</Button></> : <>
            <div shuku-edit-id="e-ccbf0c61-70f0-4efd-964b-67aa78f12a89" className="spp-regression-estimate-stars" aria-label={`${stars}星评价`}><span shuku-edit-id="e-b0857179-0158-474f-ba67-d4da9ba5efb1" className="spp-regression-estimate-star-icons">{[1,2,3].map(n=><Star key={n} theme={n<=stars?'filled':'outline'} size={30} fill={n<=stars?'#df9326':'#bac7d6'} />)}</span><Typography shuku-edit-id="e-7f09f63b-43d3-4699-aee9-c4f2d7865887" variant="h3" tone="accent">{stars===3?'估计准确':stars===2?'接近真实重量':'继续调整试试'}</Typography></div>
            <div shuku-edit-id="e-d2168640-e986-4cd9-a648-11f21cc5fcc7" className="spp-regression-estimate-game-values"><div shuku-edit-id="e-1b400716-65ad-4a8c-bb1a-b703da2ba5a0"><Typography shuku-edit-id="e-0a159825-1a63-486c-8dbe-a588cc1710a5" variant="bodySmall" tone="muted">真实象重</Typography><Typography shuku-edit-id="e-84c1baa1-e283-420f-bb9e-b965c7663fae" variant="h3" tone="accent">{ELEPHANT_KG.toFixed(1)}<Typography shuku-edit-id="e-22b902b2-f9f1-49e2-8aea-e740f04df696" as="span" variant="bodySmall"> 千克</Typography></Typography></div><div shuku-edit-id="e-3e5e0962-e319-48f5-923d-c4862b50e9a0"><Typography shuku-edit-id="e-fb92d75d-8029-4f26-b0ab-42398e3177da" variant="bodySmall" tone="muted">{submittedMass===ELEPHANT_KG ? "估重" : submittedMass>ELEPHANT_KG ? "高估" : "低估"}偏差</Typography><Typography shuku-edit-id="e-aad941b6-1d2e-4629-a8aa-37df7ab56ff2" variant="h3" className="spp-regression-estimate-bias">{difference.toFixed(1)}<Typography shuku-edit-id="e-5d06499b-24ba-4a32-9102-dc933d54e18f" as="span" variant="bodySmall"> 千克</Typography></Typography></div></div>
            <Button onClick={()=>setSubmittedMass(null)}>重新挑战</Button>
          </>}
          <Typography shuku-edit-id="e-ea455aaf-d99a-4895-a4a9-ad80fc1d6522" className="spp-regression-estimate-rating-rule" variant="bodySmall" tone="muted">偏差（千克）：≤100 三星 · ≤300 两星 · &gt;300 一星</Typography>
        </div> : <div shuku-edit-id="e-47cad742-0362-4932-8cc6-4eb718250250" className="spp-regression-estimate-question"><Typography shuku-edit-id="e-ea0fc95f-8200-40cf-a649-d076949f94ed" variant="h2" tone="accent">怎样判断估计是否可靠？</Typography><Typography shuku-edit-id="e-32b48289-dd0a-4914-b4e8-b8c869f76c4f" variant="body">大象的真实重量未知，无法直接核对。</Typography><Typography shuku-edit-id="e-d0875399-aa07-4f2c-838c-c8dc07043c78" variant="bodySmall" tone="accent">能否先检验这条直线对已有石重记录的预测？</Typography></div>}
      </section>
    </div>
    {showLoss && <Typography shuku-edit-id="e-989a322f-6964-4a08-abb1-be2dd8220c8c" variant="bodySmall" tone="accent" className="spp-regression-estimate-takeaway">损失衡量已有记录的拟合程度，象重则来自直线的外推。</Typography>}
    </div>
  </ContentBlock>;
}
