import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { Star } from '@icon-park/react';
import { ELEPHANT_KG, TARGET_DEPTH_CM } from '../CaoChongPage/experiment';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Button, ContentBlock, EChartsChart, Typography } from "@shuku/course-style/react";
import { getManualFit, saveManualFit, useRecordedData } from '../../showcaseRegressionData';
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
  if(!calibration.length)return <ContentBlock shuku-edit-id="e-08f805d5-dfde-4ebe-bc10-94266de88e86" title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock shuku-edit-id="e-73cb9985-41b9-4766-96f4-71d15b0199cb" headingLevel={1} title={showLoss ? "调整直线，估计象重" : "石头不足，如何估计象重？"} subtitle={showLoss ? "让直线贴近观测，观察损失与象重估计的变化。" : "根据已有观测，选择一条直线进行估计。"} className={`aipe-showcase-rl-estimate-page${showLoss ? ' aipe-showcase-rl-estimate-challenge-page' : ''}`}
    style={{ '--aipe-showcase-rl-est-background': `url("${moduleAssetUrl("cao-chong/estimate-background.webp")}")` } as CSSProperties}>
    <div shuku-edit-id="e-076ed263-d2cc-4765-9c01-5b330475dd0d" className={`aipe-showcase-rl-estimate-content${showLoss ? ' aipe-showcase-rl-estimate-content--loss' : ''}`}>
    <div shuku-edit-id="e-1c331037-efee-4c0f-9311-b95bd3054891" className="aipe-showcase-rl-estimate-layout">
      <section shuku-edit-id="e-c0bf9e3e-a76a-4c09-a307-38e20bc8ecec" className="aipe-showcase-rl-estimate-plot" aria-label="调整直线并根据大象水位估计重量">
        {showLoss && <div shuku-edit-id="e-48df662e-a797-427b-8aa2-9b27f766d3db" className="aipe-showcase-rl-estimate-plot-heading"><Typography shuku-edit-id="e-8844073f-271e-467e-a6a6-7ba51dd193e4" variant="h3" tone="accent">观测与预测</Typography><Typography shuku-edit-id="e-3a284eae-e5c6-4873-a831-cdeb45cbd331" variant="bodySmall" className="aipe-showcase-rl-estimate-drag-hint">拖动端点调整直线</Typography></div>}
        <div shuku-edit-id="e-fe502fe4-571b-49ed-9390-0f065661d019" className="aipe-showcase-rl-estimate-plot-canvas" ref={plotRef}>
        <EChartsChart className="aipe-showcase-rl-estimate-chart" option={option} minHeight={0} aria-label="石重与下沉深度的观测记录，实线表示已测范围，虚线表示趋势延伸" />
        <button shuku-edit-id="e-8750b22d-49b1-4818-9807-69e65741aa08" className="aipe-showcase-rl-estimate-handle" role="slider" aria-label="直线端点" aria-valuemin={.008} aria-valuemax={.04} aria-valuenow={slope} aria-valuetext={`端点：${Math.round(endpointX)} 千克，${endpointY.toFixed(1)} 厘米；方向键调整直线`} title="沿上边缘或右边缘拖动，或使用方向键调整"
          style={{ left: `${10 + endpointX / 3000 * 84}%`, top: `${12 + (1 - endpointY / 48) * 74}%` }}
          onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); adjust(event); }}
          onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) adjust(event); }}
          onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
          onKeyDown={event => {
            if (['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
              event.preventDefault();
              const next = event.key === 'Home' ? .008 : event.key === 'End' ? .04 : clamp(slope + (event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? .0002 : -.0002));
              setSlope(next); if (showLoss) saveManualFit(next, calibration);
            }
          }}><span shuku-edit-id="e-5b5e061d-c105-42ec-b033-d7e53c67725e" aria-hidden="true">↗</span></button>
        <Typography shuku-edit-id="e-db8c285b-63ae-4b3b-8d92-868d212bd37e" className="aipe-showcase-rl-estimate-water-label" variant="bodySmall" tone="inherit" style={{top:`${12+(1-TARGET_DEPTH_CM/48)*74}%`}}>{TARGET_DEPTH_CM.toFixed(1)}</Typography>
        </div>
        {showLoss && <div shuku-edit-id="e-d35b6137-72ee-4144-a061-28bf04e25bd8" className="aipe-showcase-rl-estimate-legend"><Typography shuku-edit-id="e-f5dc46d7-070a-4c0d-94b4-c96d95cac625" variant="bodySmall"><i shuku-edit-id="e-39ad5948-ca28-4512-b1de-5cda0ac33198" className="aipe-showcase-rl-estimate-legend-dot" />观测记录</Typography><Typography shuku-edit-id="e-2d9acb24-1cc0-48b3-b102-68384b2c54be" variant="bodySmall"><i shuku-edit-id="e-18378431-b3ad-4fcf-990e-6b0ec722894a" className="aipe-showcase-rl-estimate-legend-line" />预测直线</Typography><Typography shuku-edit-id="e-5bce8055-ed72-4b3e-8068-78d1a9b130ea" variant="bodySmall"><i shuku-edit-id="e-c5436450-ffdc-4a6b-b68a-272c3d5a65af" className="aipe-showcase-rl-estimate-legend-error" />预测误差</Typography></div>}
      </section>
      <section shuku-edit-id="e-1daa2ec4-3df9-425b-8d9e-9f81758c71e8" className="aipe-showcase-rl-estimate-reasoning" aria-label="实时估重与可靠性问题">
        {showLoss && <div shuku-edit-id="e-2c81e761-d2e5-4a37-b9e1-e78e4ca38175" className="aipe-showcase-rl-estimate-loss-card"><Typography shuku-edit-id="e-53ccc789-5357-4be9-9c86-033a9564c615" variant="h3" tone="accent">当前拟合损失</Typography><div shuku-edit-id="e-b8736c29-8407-4a03-9905-0a04687a3ab5" className="aipe-showcase-rl-estimate-loss-strip" aria-live="polite"><div shuku-edit-id="e-e97d681e-ea84-4518-bcb1-a4dd15611bb6"><Typography shuku-edit-id="e-06d3ea13-47a4-4ea7-91a5-37472c632915" variant="body" className="aipe-showcase-rl-estimate-metric-label" title="平均绝对误差">MAE</Typography><Typography shuku-edit-id="e-a8d9a69f-c72e-4cb4-a346-eb9c1865486c" variant="h1" tone="accent">{mae.toFixed(1)}</Typography></div><div shuku-edit-id="e-660db522-1fa6-45e1-9c5f-bfbb776a5025"><Typography shuku-edit-id="e-2e577290-c2e8-4bf4-b8bd-fe5eeec4c39f" variant="body" className="aipe-showcase-rl-estimate-metric-label" title="均方误差">MSE</Typography><Typography shuku-edit-id="e-fec88b40-a421-454b-842f-dcc5b27569f5" variant="h1" tone="accent">{mse.toFixed(1)}</Typography></div></div><Typography shuku-edit-id="e-79875f70-563c-4519-80b7-88e86d9b12f7" variant="bodySmall" tone="muted" className="aipe-showcase-rl-estimate-loss-caption">调整直线时实时更新</Typography></div>}
        <div shuku-edit-id="e-e3c1ebd5-830b-416e-a658-9cbc24f8664a" className="aipe-showcase-rl-estimate-instruction"><Typography shuku-edit-id="e-fbba1b2e-8fa8-417a-811c-53a10e16ad52" variant="h3" tone="accent">用直线估计象重</Typography><Typography shuku-edit-id="e-df8efc4b-442e-4f20-8e84-d13824a87e70" variant="bodySmall" tone="muted">{showLoss ? "拖动端点，尝试降低 MAE 或 MSE，再观察象重估计。" : "拖动端点，使直线贴近散点的整体趋势。"}</Typography></div>
        <div shuku-edit-id="e-f76cc3bc-e2f0-4eaf-b114-0e79e3ff362d" className="aipe-showcase-rl-estimate-estimation"><Typography shuku-edit-id="e-897099aa-a7b1-476d-8ee1-086a17254e07" variant={showLoss ? "h3" : "body"} tone="accent">{showLoss ? "当前估计象重" : `下沉 ${TARGET_DEPTH_CM.toFixed(1)} 厘米，对应的估计重量`}</Typography>
          <div shuku-edit-id="e-891474ac-b5f9-4dec-a4af-1259980d2d1e" className="aipe-showcase-rl-estimate-value" aria-live="polite"><Typography shuku-edit-id="e-79a9a57c-b6d0-439c-9b28-c98d638e4fef" variant="h1" tone="accent">{showLoss ? <>{mass.toFixed(1)}<Typography shuku-edit-id="e-2cbc6ed2-7a30-4393-8908-50eb82177cc9" as="span" variant="h3"> 千克</Typography></> : `约 ${mass.toFixed(1)} 千克`}</Typography>{!showLoss && <Typography shuku-edit-id="e-c6fff847-22d9-4025-8254-860ae9fada08" variant="bodySmall" tone="muted">随所选直线实时变化</Typography>}</div>
          {showLoss && <Typography shuku-edit-id="e-8cc28d00-152e-4f36-8f0c-c897e3db14a8" variant="bodySmall" tone="muted">{inRange ? `由 ${TARGET_DEPTH_CM.toFixed(1)} 厘米水位反推` : '交点位于图示范围之外。'}</Typography>}
          {!showLoss && !inRange && <Typography shuku-edit-id="e-0ff094e3-9ffc-4678-a6ba-f82a73d5dd75" variant="bodySmall" tone="muted">交点位于图示范围之外。</Typography>}
        </div>
        {showLoss ? <div shuku-edit-id="e-f0ebdad1-d615-4d59-8ba4-c99e95d89609" className="aipe-showcase-rl-estimate-question aipe-showcase-rl-estimate-game">
          {submittedMass === null ? <><Typography shuku-edit-id="e-37906c8f-b14d-4d81-876a-52f8e5ab41c7" variant="h3" tone="accent">这次估重有多准确？</Typography><Typography shuku-edit-id="e-3cc8b7a3-ced9-473e-9553-9e54f7ea9e07" variant="bodySmall" tone="muted">调整直线后，提交当前估计，揭晓模拟中的真实象重。</Typography><Button variant="primary" onClick={()=>{ saveManualFit(slope, calibration); setSubmittedMass(mass); }}>揭晓真实象重</Button></> : <>
            <div shuku-edit-id="e-efa7d9c6-048b-4e46-894f-cfe1ea4131dd" className="aipe-showcase-rl-estimate-stars" aria-label={`${stars}星评价`}><span shuku-edit-id="e-48485d43-6ffd-4bbc-915b-f246f67a0361" className="aipe-showcase-rl-estimate-star-icons">{[1,2,3].map(n=><Star key={n} theme={n<=stars?'filled':'outline'} size={30} fill={n<=stars?'#df9326':'#bac7d6'} />)}</span><Typography shuku-edit-id="e-9f0fc7b8-0eea-4901-9a22-d27fbd69f90d" variant="h3" tone="accent">{stars===3?'估计准确':stars===2?'接近真实重量':'继续调整试试'}</Typography></div>
            <div shuku-edit-id="e-5a7fe022-ca1f-4985-907a-7af571b909e5" className="aipe-showcase-rl-estimate-game-values"><div shuku-edit-id="e-87e15cb1-75e1-4934-bbc6-2e44c1defef9"><Typography shuku-edit-id="e-3299f16f-6296-4789-8337-d6f19a0a27da" variant="bodySmall" tone="muted">真实象重</Typography><Typography shuku-edit-id="e-914f1278-416b-48a6-b665-8460e4c5cc83" variant="h3" tone="accent">{ELEPHANT_KG.toFixed(1)}<Typography shuku-edit-id="e-3c6d5ac5-1226-4be8-8c45-7f912098e33c" as="span" variant="bodySmall"> 千克</Typography></Typography></div><div shuku-edit-id="e-924caeeb-1bc4-42a8-8ef1-b16e65ecbd79"><Typography shuku-edit-id="e-3a14e649-cd92-4482-89c5-46ffde379985" variant="bodySmall" tone="muted">{submittedMass===ELEPHANT_KG ? "估重" : submittedMass>ELEPHANT_KG ? "高估" : "低估"}偏差</Typography><Typography shuku-edit-id="e-4daf6fd9-928e-468e-98e5-0251442d8af9" variant="h3" className="aipe-showcase-rl-estimate-bias">{difference.toFixed(1)}<Typography shuku-edit-id="e-f6f4a2ae-122c-4c27-9edb-29edffe5612d" as="span" variant="bodySmall"> 千克</Typography></Typography></div></div>
            <Button onClick={()=>setSubmittedMass(null)}>重新挑战</Button>
          </>}
          <Typography shuku-edit-id="e-bb3a1991-c50e-4109-a77b-21ec0340e5b8" className="aipe-showcase-rl-estimate-rating-rule" variant="bodySmall" tone="muted">偏差（千克）：≤100 三星 · ≤300 两星 · &gt;300 一星</Typography>
        </div> : <div shuku-edit-id="e-f9f8020c-dc31-4f58-9416-544c31f2d43f" className="aipe-showcase-rl-estimate-question"><Typography shuku-edit-id="e-cf4b1d52-9b9c-4efc-8fc2-009cf2c7f709" variant="h2" tone="accent">怎样判断估计是否可靠？</Typography><Typography shuku-edit-id="e-ea8d046e-5603-409b-b945-db998247f3a7" variant="body">大象的真实重量未知，无法直接核对。</Typography><Typography shuku-edit-id="e-cab7bf56-12a2-477b-a014-3793c665104e" variant="bodySmall" tone="accent">能否先检验这条直线对已有石重记录的预测？</Typography></div>}
      </section>
    </div>
    {showLoss && <Typography shuku-edit-id="e-74918fc5-ca2f-4109-a84d-39bd0ea87e6b" variant="bodySmall" tone="accent" className="aipe-showcase-rl-estimate-takeaway">损失衡量已有记录的拟合程度，象重则来自直线的外推。</Typography>}
    </div>
  </ContentBlock>;
}
