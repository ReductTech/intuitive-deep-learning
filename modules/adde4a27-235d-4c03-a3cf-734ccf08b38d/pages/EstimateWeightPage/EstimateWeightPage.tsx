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
  if(!calibration.length)return <ContentBlock shuku-edit-id="e-4a8640ae-48b1-444c-ad4b-d78dbce02121" title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock shuku-edit-id="e-61f28982-5b52-47aa-be40-7ccab65b7e56" headingLevel={1} title={showLoss ? "调整直线，估计象重" : "石头不足，如何估计象重？"} subtitle={showLoss ? "让直线贴近观测，观察损失与象重估计的变化。" : "根据已有观测，选择一条直线进行估计。"} className={`rl-estimate-page${showLoss ? ' rl-estimate-challenge-page' : ''}`}
    style={{ '--rl-est-background': `url("${moduleAssetUrl('cao-chong/estimate-background.jpg')}")` } as CSSProperties}>
    <div shuku-edit-id="e-f3d95a5e-6129-43fd-9452-ef60706be78c" className={`rl-estimate-content${showLoss ? ' rl-estimate-content--loss' : ''}`}>
    <div shuku-edit-id="e-294b289b-8cbb-498a-b125-ccbea62e5e50" className="rl-estimate-layout">
      <section shuku-edit-id="e-5a47e9d6-e8c5-4fd0-adec-7d8e83f41c46" className="rl-estimate-plot" aria-label="调整直线并根据大象水位估计重量">
        {showLoss && <div shuku-edit-id="e-a89087ea-ef70-4b38-82c5-7b4d3678d75e" className="rl-estimate-plot-heading"><Typography shuku-edit-id="e-0a014811-64ae-4ae8-a975-9e7b3363afea" variant="h3" tone="accent">观测与预测</Typography><Typography shuku-edit-id="e-198090cd-0a37-44d1-b97c-4b0934d88f68" variant="bodySmall" className="rl-estimate-drag-hint">拖动端点调整直线</Typography></div>}
        <div shuku-edit-id="e-c5a5a7dc-6330-4e35-914e-01b05061c1df" className="rl-estimate-plot-canvas" ref={plotRef}>
        <EChartsChart className="rl-estimate-chart" option={option} minHeight={0} aria-label="石重与下沉深度的观测记录，实线表示已测范围，虚线表示趋势延伸" />
        <button shuku-edit-id="e-62fda6bd-a249-4513-a966-f9607b7be00b" className="rl-estimate-handle" role="slider" aria-label="直线端点" aria-valuemin={.008} aria-valuemax={.04} aria-valuenow={slope} aria-valuetext={`端点：${Math.round(endpointX)} 千克，${endpointY.toFixed(1)} 厘米；方向键调整直线`} title="沿上边缘或右边缘拖动，或使用方向键调整"
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
          }}><span shuku-edit-id="e-f1ea01d6-39bd-4822-a35a-ee9928f4f012" aria-hidden="true">↗</span></button>
        <Typography shuku-edit-id="e-a895cb71-c296-49ea-9c7c-570a8b135c24" className="rl-estimate-water-label" variant="bodySmall" tone="inherit" style={{top:`${12+(1-TARGET_DEPTH_CM/48)*74}%`}}>{TARGET_DEPTH_CM.toFixed(1)}</Typography>
        </div>
        {showLoss && <div shuku-edit-id="e-c586e6a2-6677-41d9-8206-d3fb3c1216a8" className="rl-estimate-legend"><Typography shuku-edit-id="e-2b8b2d43-2b41-49ac-80ff-144bb57cead4" variant="bodySmall"><i shuku-edit-id="e-198805d4-742c-4165-8483-b251a6e8aa84" className="rl-estimate-legend-dot" />观测记录</Typography><Typography shuku-edit-id="e-fe4f6133-02ec-4441-9e55-65399d211c7c" variant="bodySmall"><i shuku-edit-id="e-f9b50efe-7eb5-4c46-bd2f-13228b71d025" className="rl-estimate-legend-line" />预测直线</Typography><Typography shuku-edit-id="e-f07daaca-cb72-4839-905b-69518a5889b5" variant="bodySmall"><i shuku-edit-id="e-5f9e07a7-3640-4663-9f32-2ffea384fd89" className="rl-estimate-legend-error" />预测误差</Typography></div>}
      </section>
      <section shuku-edit-id="e-cfd7bd96-4d33-4644-8a5c-a453ef1ece44" className="rl-estimate-reasoning" aria-label="实时估重与可靠性问题">
        {showLoss && <div shuku-edit-id="e-0e7a9b13-8578-4151-9a54-2c464888914a" className="rl-estimate-loss-card"><Typography shuku-edit-id="e-817c5cc3-8379-4107-9878-90546d81d56b" variant="h3" tone="accent">当前拟合损失</Typography><div shuku-edit-id="e-ffe61813-4a24-41be-b2c7-8aee0d20e338" className="rl-estimate-loss-strip" aria-live="polite"><div shuku-edit-id="e-85843d65-2729-4ff3-a9f6-6ba3abf017bf"><Typography shuku-edit-id="e-5ac6646b-1edd-4161-b3ad-d27a5007d459" variant="body" className="rl-estimate-metric-label" title="平均绝对误差">MAE</Typography><Typography shuku-edit-id="e-bdd86025-345f-4ecd-b767-7cfe1e2ed17d" variant="h1" tone="accent">{mae.toFixed(1)}</Typography></div><div shuku-edit-id="e-6454fd84-d393-4405-b4b6-4da5c2875a3d"><Typography shuku-edit-id="e-bd3ada75-7613-4601-9601-3b0cde8f5d3c" variant="body" className="rl-estimate-metric-label" title="均方误差">MSE</Typography><Typography shuku-edit-id="e-372f092f-cd79-4b4f-a96d-ef883c45c649" variant="h1" tone="accent">{mse.toFixed(1)}</Typography></div></div><Typography shuku-edit-id="e-21ab7478-597a-4d16-85d7-a36427b2aa44" variant="bodySmall" tone="muted" className="rl-estimate-loss-caption">调整直线时实时更新</Typography></div>}
        <div shuku-edit-id="e-760f3d26-e27e-4baf-914f-1667ccab05d2" className="rl-estimate-instruction"><Typography shuku-edit-id="e-2cb315ff-d56e-44e6-8e27-0f57a5190dc2" variant="h3" tone="accent">用直线估计象重</Typography><Typography shuku-edit-id="e-eee3c35a-d8eb-44f5-bfd2-cf8f4105bd47" variant="bodySmall" tone="muted">{showLoss ? "拖动端点，尝试降低 MAE 或 MSE，再观察象重估计。" : "拖动端点，使直线贴近散点的整体趋势。"}</Typography></div>
        <div shuku-edit-id="e-7de66393-dfa2-4b1a-a147-1940603a04ce" className="rl-estimate-estimation"><Typography shuku-edit-id="e-05867b82-83e8-4a62-8703-1ee56c54a3c0" variant={showLoss ? "h3" : "body"} tone="accent">{showLoss ? "当前估计象重" : `下沉 ${TARGET_DEPTH_CM.toFixed(1)} 厘米，对应的估计重量`}</Typography>
          <div shuku-edit-id="e-fb87eda7-02dc-486c-9fb8-85714074140f" className="rl-estimate-value" aria-live="polite"><Typography shuku-edit-id="e-41b2fe57-2e5e-4512-96d6-29e703e39e20" variant="h1" tone="accent">{showLoss ? <>{mass.toFixed(1)}<Typography shuku-edit-id="e-9e1540c4-0a3f-431f-a98f-4d79eb43f14d" as="span" variant="h3"> 千克</Typography></> : `约 ${mass.toFixed(1)} 千克`}</Typography>{!showLoss && <Typography shuku-edit-id="e-4bba2ff9-af43-401a-abea-5ccc1e1e415b" variant="bodySmall" tone="muted">随所选直线实时变化</Typography>}</div>
          {showLoss && <Typography shuku-edit-id="e-e2554f1a-1f40-4df8-a59b-25ec6e99e090" variant="bodySmall" tone="muted">{inRange ? `由 ${TARGET_DEPTH_CM.toFixed(1)} 厘米水位反推` : '交点位于图示范围之外。'}</Typography>}
          {!showLoss && !inRange && <Typography shuku-edit-id="e-c5da3cb1-a861-489b-a27c-e0675f1a959a" variant="bodySmall" tone="muted">交点位于图示范围之外。</Typography>}
        </div>
        {showLoss ? <div shuku-edit-id="e-86d45262-c64f-4cdf-9c60-787eec6ade7a" className="rl-estimate-question rl-estimate-game">
          {submittedMass === null ? <><Typography shuku-edit-id="e-e66a5424-2998-4377-bfdb-4fa31d056917" variant="h3" tone="accent">这次估重有多准确？</Typography><Typography shuku-edit-id="e-40a2bca2-c580-4a0e-a986-1b877bdd1a48" variant="bodySmall" tone="muted">调整直线后，提交当前估计，揭晓模拟中的真实象重。</Typography><Button variant="primary" onClick={()=>{ saveManualFit(slope, calibration); setSubmittedMass(mass); }}>揭晓真实象重</Button></> : <>
            <div shuku-edit-id="e-f6b71021-98de-4cee-9040-0504e023e213" className="rl-estimate-stars" aria-label={`${stars}星评价`}><span shuku-edit-id="e-e3707de3-4576-458d-b306-e6ebade03d5f" className="rl-estimate-star-icons">{[1,2,3].map(n=><Star key={n} theme={n<=stars?'filled':'outline'} size={30} fill={n<=stars?'#df9326':'#bac7d6'} />)}</span><Typography shuku-edit-id="e-3e33a59c-d432-41d8-b808-ad46f2530078" variant="h3" tone="accent">{stars===3?'估计准确':stars===2?'接近真实重量':'继续调整试试'}</Typography></div>
            <div shuku-edit-id="e-2de5c68c-bfd0-4c50-8eb4-50edaac55150" className="rl-estimate-game-values"><div shuku-edit-id="e-32eb2a5b-1c4d-4fae-ae97-add810a7e3bf"><Typography shuku-edit-id="e-6923df51-678d-48f8-a6be-e22771a43e92" variant="bodySmall" tone="muted">真实象重</Typography><Typography shuku-edit-id="e-78935f31-41cd-4dc0-987b-d2ef95a8553b" variant="h3" tone="accent">{ELEPHANT_KG.toFixed(1)}<Typography shuku-edit-id="e-0b4b643d-aefd-463b-bcd0-47bb27e2cd42" as="span" variant="bodySmall"> 千克</Typography></Typography></div><div shuku-edit-id="e-dee9ad44-5864-4659-88b0-a916ab6e0f60"><Typography shuku-edit-id="e-2f7ed4a0-0933-4651-85c1-ad3da83b35af" variant="bodySmall" tone="muted">{submittedMass===ELEPHANT_KG ? "估重" : submittedMass>ELEPHANT_KG ? "高估" : "低估"}偏差</Typography><Typography shuku-edit-id="e-24c73de4-c0d1-455a-ae05-c06d4d17dc6e" variant="h3" className="rl-estimate-bias">{difference.toFixed(1)}<Typography shuku-edit-id="e-174f1800-9537-44b2-a2a4-5297a9507301" as="span" variant="bodySmall"> 千克</Typography></Typography></div></div>
            <Button onClick={()=>setSubmittedMass(null)}>重新挑战</Button>
          </>}
          <Typography shuku-edit-id="e-b4b1ac40-9e87-47d5-9ba9-659fd0aacd38" className="rl-estimate-rating-rule" variant="bodySmall" tone="muted">偏差（千克）：≤100 三星 · ≤300 两星 · &gt;300 一星</Typography>
        </div> : <div shuku-edit-id="e-853727a6-61da-443d-9081-736de3ad6220" className="rl-estimate-question"><Typography shuku-edit-id="e-8d71bd48-3858-4869-a568-50194c88088d" variant="h2" tone="accent">怎样判断估计是否可靠？</Typography><Typography shuku-edit-id="e-5fe64dbc-0be8-4af7-9e4b-13ef8da27390" variant="body">大象的真实重量未知，无法直接核对。</Typography><Typography shuku-edit-id="e-d017f395-fa13-4a9e-b513-b3c685e36f8e" variant="bodySmall" tone="accent">能否先检验这条直线对已有石重记录的预测？</Typography></div>}
      </section>
    </div>
    {showLoss && <Typography shuku-edit-id="e-2274091f-631c-4898-adf0-a0f1edd4a221" variant="bodySmall" tone="accent" className="rl-estimate-takeaway">损失衡量已有记录的拟合程度，象重则来自直线的外推。</Typography>}
    </div>
  </ContentBlock>;
}
