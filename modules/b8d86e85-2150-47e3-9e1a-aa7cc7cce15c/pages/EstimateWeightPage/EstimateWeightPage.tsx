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
  if(!calibration.length)return <ContentBlock shuku-edit-id="e-e020a57b-9d84-4bfb-bbcf-0f15b5e4687d" title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock shuku-edit-id="e-6653b4fd-2c12-4528-b289-26dc6f1383eb" headingLevel={1} title={showLoss ? "调整直线，估计象重" : "石头不足，如何估计象重？"} subtitle={showLoss ? "让直线贴近观测，观察损失与象重估计的变化。" : "根据已有观测，选择一条直线进行估计。"} className={`aipe-showcase-rl-estimate-page${showLoss ? ' aipe-showcase-rl-estimate-challenge-page' : ''}`}
    style={{ '--aipe-showcase-rl-est-background': `url("${moduleAssetUrl('cao-chong/estimate-background.jpg')}")` } as CSSProperties}>
    <div shuku-edit-id="e-7b1a7237-a803-4ded-9c36-09a358cf67aa" className={`aipe-showcase-rl-estimate-content${showLoss ? ' aipe-showcase-rl-estimate-content--loss' : ''}`}>
    <div shuku-edit-id="e-e1e2afde-a8da-4157-b4c5-f681a882a486" className="aipe-showcase-rl-estimate-layout">
      <section shuku-edit-id="e-2d3d8344-64fd-4a93-9106-f39411e2dede" className="aipe-showcase-rl-estimate-plot" aria-label="调整直线并根据大象水位估计重量">
        {showLoss && <div shuku-edit-id="e-53d90102-763c-44df-a098-58cd0493e1ac" className="aipe-showcase-rl-estimate-plot-heading"><Typography shuku-edit-id="e-6a862971-3a20-4a02-bc64-979aa5354b57" variant="h3" tone="accent">观测与预测</Typography><Typography shuku-edit-id="e-4c1f5b8d-6b7c-40a7-b362-20b8d130a04c" variant="bodySmall" className="aipe-showcase-rl-estimate-drag-hint">拖动端点调整直线</Typography></div>}
        <div shuku-edit-id="e-13fe7853-d47c-4034-b0ae-2225e6395e38" className="aipe-showcase-rl-estimate-plot-canvas" ref={plotRef}>
        <EChartsChart className="aipe-showcase-rl-estimate-chart" option={option} minHeight={0} aria-label="石重与下沉深度的观测记录，实线表示已测范围，虚线表示趋势延伸" />
        <button shuku-edit-id="e-062630bd-082c-43d7-8832-9b2fdecd1dc1" className="aipe-showcase-rl-estimate-handle" role="slider" aria-label="直线端点" aria-valuemin={.008} aria-valuemax={.04} aria-valuenow={slope} aria-valuetext={`端点：${Math.round(endpointX)} 千克，${endpointY.toFixed(1)} 厘米；方向键调整直线`} title="沿上边缘或右边缘拖动，或使用方向键调整"
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
          }}><span shuku-edit-id="e-761d2818-5638-4a08-8569-cf04eb57b0ed" aria-hidden="true">↗</span></button>
        <Typography shuku-edit-id="e-867c574c-741e-462d-962e-c73c37899eb1" className="aipe-showcase-rl-estimate-water-label" variant="bodySmall" tone="inherit" style={{top:`${12+(1-TARGET_DEPTH_CM/48)*74}%`}}>{TARGET_DEPTH_CM.toFixed(1)}</Typography>
        </div>
        {showLoss && <div shuku-edit-id="e-92e5f0b5-abcc-467a-bd61-b9125cea7f5a" className="aipe-showcase-rl-estimate-legend"><Typography shuku-edit-id="e-afea7e95-2523-43da-bfd9-6d8358dd8b92" variant="bodySmall"><i shuku-edit-id="e-461b21cd-3514-4b11-b284-8f76b6673d09" className="aipe-showcase-rl-estimate-legend-dot" />观测记录</Typography><Typography shuku-edit-id="e-0ced30f2-7fc8-4d83-8ac4-f49f01592590" variant="bodySmall"><i shuku-edit-id="e-646ce414-30b5-48d8-b098-c0d0a882f335" className="aipe-showcase-rl-estimate-legend-line" />预测直线</Typography><Typography shuku-edit-id="e-80663fa9-93c9-42d1-865f-292a46b6373f" variant="bodySmall"><i shuku-edit-id="e-d9e9d298-b81a-4a3d-857b-0a57eff4d911" className="aipe-showcase-rl-estimate-legend-error" />预测误差</Typography></div>}
      </section>
      <section shuku-edit-id="e-8d538f17-ab23-435d-9924-779daa1703de" className="aipe-showcase-rl-estimate-reasoning" aria-label="实时估重与可靠性问题">
        {showLoss && <div shuku-edit-id="e-d18ae690-8674-46fb-ba2c-63b461f1ccf2" className="aipe-showcase-rl-estimate-loss-card"><Typography shuku-edit-id="e-f3a25252-ec04-4c66-8297-58854d200cab" variant="h3" tone="accent">当前拟合损失</Typography><div shuku-edit-id="e-159331e7-f612-48ae-9b2a-dab1e425a44c" className="aipe-showcase-rl-estimate-loss-strip" aria-live="polite"><div shuku-edit-id="e-4d4b1215-53d3-48e4-bd54-8fcb523a3aa5"><Typography shuku-edit-id="e-9026eed0-4dca-42e9-a3ac-9b136905f9d7" variant="body" className="aipe-showcase-rl-estimate-metric-label" title="平均绝对误差">MAE</Typography><Typography shuku-edit-id="e-82c3c39c-6eaf-4c5c-a66b-e973ab7081d6" variant="h1" tone="accent">{mae.toFixed(1)}</Typography></div><div shuku-edit-id="e-af7e8393-f4ad-4623-bb3f-f44cbf058db6"><Typography shuku-edit-id="e-b32c8fd2-8458-446f-96aa-49c312e9efb1" variant="body" className="aipe-showcase-rl-estimate-metric-label" title="均方误差">MSE</Typography><Typography shuku-edit-id="e-b66cd4c8-43c4-45fc-88ae-2dafd88b2449" variant="h1" tone="accent">{mse.toFixed(1)}</Typography></div></div><Typography shuku-edit-id="e-c5bdbd1a-a068-4483-9a07-7f58cfc8338f" variant="bodySmall" tone="muted" className="aipe-showcase-rl-estimate-loss-caption">调整直线时实时更新</Typography></div>}
        <div shuku-edit-id="e-13e85acc-e2f4-4a75-afcf-170627aba129" className="aipe-showcase-rl-estimate-instruction"><Typography shuku-edit-id="e-562f5c22-4fce-4303-8e3c-33da15c916ac" variant="h3" tone="accent">用直线估计象重</Typography><Typography shuku-edit-id="e-8a9d094e-15ed-4b7b-9acb-69a35c2b8597" variant="bodySmall" tone="muted">{showLoss ? "拖动端点，尝试降低 MAE 或 MSE，再观察象重估计。" : "拖动端点，使直线贴近散点的整体趋势。"}</Typography></div>
        <div shuku-edit-id="e-393c7c03-770d-488f-8687-5804f7b5df26" className="aipe-showcase-rl-estimate-estimation"><Typography shuku-edit-id="e-9dbc88bd-296c-49a5-b587-7180c8aceb57" variant={showLoss ? "h3" : "body"} tone="accent">{showLoss ? "当前估计象重" : `下沉 ${TARGET_DEPTH_CM.toFixed(1)} 厘米，对应的估计重量`}</Typography>
          <div shuku-edit-id="e-9c2525de-a222-4e61-8fbe-ee23cac6e8e3" className="aipe-showcase-rl-estimate-value" aria-live="polite"><Typography shuku-edit-id="e-6d0c259c-2799-4d8c-9b74-7f07aee93086" variant="h1" tone="accent">{showLoss ? <>{mass.toFixed(1)}<Typography shuku-edit-id="e-a624bc4f-676d-4e58-9866-65873b350ba8" as="span" variant="h3"> 千克</Typography></> : `约 ${mass.toFixed(1)} 千克`}</Typography>{!showLoss && <Typography shuku-edit-id="e-37fd2b3e-dfea-4c3b-9a84-8434d8fa43a8" variant="bodySmall" tone="muted">随所选直线实时变化</Typography>}</div>
          {showLoss && <Typography shuku-edit-id="e-acf43c6b-3ad6-4c01-ba05-38463f0866cb" variant="bodySmall" tone="muted">{inRange ? `由 ${TARGET_DEPTH_CM.toFixed(1)} 厘米水位反推` : '交点位于图示范围之外。'}</Typography>}
          {!showLoss && !inRange && <Typography shuku-edit-id="e-fe05d106-57fc-4fb1-b346-45edbbac265f" variant="bodySmall" tone="muted">交点位于图示范围之外。</Typography>}
        </div>
        {showLoss ? <div shuku-edit-id="e-539fb97f-5429-4cba-92f5-89d0e9a0a687" className="aipe-showcase-rl-estimate-question aipe-showcase-rl-estimate-game">
          {submittedMass === null ? <><Typography shuku-edit-id="e-545b6c12-4286-4983-a6c3-a39c36add20a" variant="h3" tone="accent">这次估重有多准确？</Typography><Typography shuku-edit-id="e-1395d468-37e0-40cd-97b7-8f9d9b0ad2bf" variant="bodySmall" tone="muted">调整直线后，提交当前估计，揭晓模拟中的真实象重。</Typography><Button variant="primary" onClick={()=>{ saveManualFit(slope, calibration); setSubmittedMass(mass); }}>揭晓真实象重</Button></> : <>
            <div shuku-edit-id="e-96e3ed99-02e8-4456-9281-185fd05e8297" className="aipe-showcase-rl-estimate-stars" aria-label={`${stars}星评价`}><span shuku-edit-id="e-21edb42c-13c0-4546-839e-c97a635b90d5" className="aipe-showcase-rl-estimate-star-icons">{[1,2,3].map(n=><Star key={n} theme={n<=stars?'filled':'outline'} size={30} fill={n<=stars?'#df9326':'#bac7d6'} />)}</span><Typography shuku-edit-id="e-bb8f754f-f6d8-46d9-8419-34b74b0f1769" variant="h3" tone="accent">{stars===3?'估计准确':stars===2?'接近真实重量':'继续调整试试'}</Typography></div>
            <div shuku-edit-id="e-bd18ee83-50ef-42d0-b0f9-92fbb87afec1" className="aipe-showcase-rl-estimate-game-values"><div shuku-edit-id="e-0aef8171-ae79-4a4f-812c-3fb72a6cefea"><Typography shuku-edit-id="e-375224f9-bb57-4642-817d-1719776a37ee" variant="bodySmall" tone="muted">真实象重</Typography><Typography shuku-edit-id="e-d54b2ee7-3097-481a-a748-616e09385ac3" variant="h3" tone="accent">{ELEPHANT_KG.toFixed(1)}<Typography shuku-edit-id="e-5855d9f9-09c4-4452-950f-68c4264b5ddd" as="span" variant="bodySmall"> 千克</Typography></Typography></div><div shuku-edit-id="e-04c6c900-4379-4b89-a5bb-9a5e4206fabd"><Typography shuku-edit-id="e-3c4742b6-5f81-4c97-8abb-e507b585db76" variant="bodySmall" tone="muted">{submittedMass===ELEPHANT_KG ? "估重" : submittedMass>ELEPHANT_KG ? "高估" : "低估"}偏差</Typography><Typography shuku-edit-id="e-bf4bd075-6f1a-42b1-aab2-f93448729dd3" variant="h3" className="aipe-showcase-rl-estimate-bias">{difference.toFixed(1)}<Typography shuku-edit-id="e-08b6a4a3-3115-41dd-b8c9-9112e06b3417" as="span" variant="bodySmall"> 千克</Typography></Typography></div></div>
            <Button onClick={()=>setSubmittedMass(null)}>重新挑战</Button>
          </>}
          <Typography shuku-edit-id="e-abb83c50-b49e-49e9-b89c-80e1a40d2584" className="aipe-showcase-rl-estimate-rating-rule" variant="bodySmall" tone="muted">偏差（千克）：≤100 三星 · ≤300 两星 · &gt;300 一星</Typography>
        </div> : <div shuku-edit-id="e-4413f647-7b34-4685-a2f8-32dc42871eeb" className="aipe-showcase-rl-estimate-question"><Typography shuku-edit-id="e-c0351e0b-148e-418d-ae2d-8882b58a0967" variant="h2" tone="accent">怎样判断估计是否可靠？</Typography><Typography shuku-edit-id="e-00bbf214-9f74-4329-b6de-59d597d2b162" variant="body">大象的真实重量未知，无法直接核对。</Typography><Typography shuku-edit-id="e-44c848b5-a8a0-4b1a-b811-36be7088a483" variant="bodySmall" tone="accent">能否先检验这条直线对已有石重记录的预测？</Typography></div>}
      </section>
    </div>
    {showLoss && <Typography shuku-edit-id="e-ee3789be-1419-4f7a-8592-c42366e30b76" variant="bodySmall" tone="accent" className="aipe-showcase-rl-estimate-takeaway">损失衡量已有记录的拟合程度，象重则来自直线的外推。</Typography>}
    </div>
  </ContentBlock>;
}
