import { useMemo, useState } from 'react';
import { Button, ExplainPanelButton, ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { useRecordedData } from '../../regressionData';
import './PredictionErrorPage.css';

const toY = (depth: number) => 12 + (1 - depth / 40) * 74;

export function PredictionErrorPage() {
  const calibration = useRecordedData();
  const [selectedIndex, setSelectedIndex] = useState(4);
  const selected = Math.max(0, Math.min(selectedIndex, calibration.length - 1));
  const sample = calibration[selected] ?? {mass:0,depth:0};
  const plotX = 10 + sample.mass / 1750 * 84;
  const [overestimate, setOverestimate] = useState(false);
  const w = overestimate ? .020 : .010;
  const b = 2;
  const predicted = w * sample.mass + b;
  const residual = sample.depth - predicted;
  const signed = `${residual > 0 ? '+' : ''}${residual.toFixed(1)}`;
  const option = useMemo(() => ({
    animation: false,
    grid: { left: '10%', right: '6%', top: '12%', bottom: '14%' },
    xAxis: { type: 'value', min: 0, max: 1750, interval: 500, name: '累计石重（千克）', nameLocation: 'middle', nameGap: 43,
      nameTextStyle: { color: '#27446e', fontSize: 27 }, axisLabel: { color: '#526582', fontSize: 23 }, axisLine: { show: true }, splitLine: { show: false } },
    yAxis: { type: 'value', min: 0, max: 40, interval: 10, name: '下沉深度（厘米）', nameGap: 24,
      nameTextStyle: { color: '#27446e', fontSize: 27, align: 'left' }, axisLabel: { color: '#526582', fontSize: 23 }, axisLine: { show: true }, splitLine: { lineStyle: { color: '#dfe6ec' } } },
    series: [
      { type: 'line', symbol: 'none', data: [[0, b], [1750, w * 1750 + b]], lineStyle: { color: '#168c97', width: 4 }, silent: true },
      { type: 'scatter', symbolSize: 15, data: calibration.filter((_, index) => index !== selected).map(p => [p.mass, p.depth]), itemStyle: { color: '#7aace5' }, silent: true },
      { type: 'line', symbol: 'none', data: [[sample.mass, sample.depth], [sample.mass, predicted]], lineStyle: { color: '#df7a20', width: 2, type: 'dashed' }, silent: true },
      { type: 'scatter', symbolSize: 20, data: [[sample.mass, sample.depth]], itemStyle: { color: '#df7a20', borderWidth: 2, borderColor: '#fff' }, label: { show: true, position: residual < 0 ? 'bottom' : 'top', offset: [-40, residual < 0 ? 13 : -13], formatter: `观测 y = ${sample.depth.toFixed(1)}`, color: '#b35d0b', fontSize: 25 }, silent: true, z: 7 },
      { type: 'scatter', symbolSize: 20, data: [[sample.mass, predicted]], itemStyle: { color: '#168c97', borderWidth: 2, borderColor: '#fff' }, label: { show: true, position: residual < 0 ? 'top' : 'bottom', offset: [-20, residual < 0 ? -13 : 13], formatter: `预测 ŷ = ${predicted.toFixed(1)}`, color: '#168c97', fontSize: 25 }, silent: true, z: 7 },
    ],
  }), [w, b, predicted, residual, calibration, sample, selected]);
  if(!calibration.length)return <ContentBlock shuku-edit-id="e-394e905b-d6cc-4146-8474-b641d39a7490" title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock shuku-edit-id="e-3222b480-21c5-439b-b854-2110b3be0112" headingLevel={1} title="预测误差" subtitle="在同一载重下，比较预测结果与观测记录的差距。" className="rl-error-page">
    <div shuku-edit-id="e-0eee6d3d-6bf9-40be-8d83-0ff19226b055" className="rl-error-layout">
      <section shuku-edit-id="e-0c5f0cef-6e3c-4f49-9265-4edd3c512690" className="rl-error-plot" aria-label="同一载重下的观测值、预测值和误差">
        <EChartsChart className="rl-error-chart" option={option} minHeight={0} aria-label={`载重${sample.mass}千克，观测${sample.depth.toFixed(1)}厘米，预测${predicted.toFixed(1)}厘米，误差${signed}厘米`} />
        <Typography shuku-edit-id="e-05e0ac78-89f0-410b-9675-ab2a012e2a70" className="rl-error-select-hint" variant="bodySmall" tone="muted">点击观测点切换记录</Typography>
        <div shuku-edit-id="e-1f920232-31a8-41c4-adaa-f0a04c111786" className="rl-error-point-targets" role="group" aria-label="选择观测记录">{calibration.map((point, index) => <button shuku-edit-id="e-748b84de-fd49-486c-b033-1af6b29301ce" key={`${index}-${point.mass}`} type="button" className="rl-error-point-target" aria-label={`选择第${index + 1}条记录：载重${point.mass}千克，观测${point.depth.toFixed(1)}厘米`} aria-pressed={selected === index} style={{ left: `${10 + point.mass / 1750 * 84}%`, top: `${toY(point.depth)}%` }} onClick={() => setSelectedIndex(index)} />)}</div>
        <svg shuku-edit-id="e-1c5d57ce-d402-43ee-bfcf-7b14a5b05d74" className="rl-error-arrow" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
          <defs shuku-edit-id="e-c32fafaa-a018-4aa8-b14f-82c7cda2f592"><marker shuku-edit-id="e-0eba41d3-10c1-4388-8f76-3078e38b7254" id="rl-error-arrow-tip" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path shuku-edit-id="e-4f961940-cc66-4c93-986d-3020aaa3e1dd" d="M0 0L8 4L0 8Z" fill="#27446e" /></marker></defs>
          <path shuku-edit-id="e-98374593-fe5c-418b-9bde-135f768ee44f" d={`M${(plotX + 2) * 10} ${Math.min(toY(sample.depth), toY(predicted)) * 10 + 8}V${Math.max(toY(sample.depth), toY(predicted)) * 10 - 8}`} stroke="#27446e" strokeWidth="3" fill="none" markerStart="url(#rl-error-arrow-tip)" markerEnd="url(#rl-error-arrow-tip)" />
        </svg>
        <div shuku-edit-id="e-ac3e7ef9-9283-4cf3-a82a-1a763e05b614" className="rl-error-gap" style={{ left: `${Math.min(plotX + 4, 78)}%`, top: `${(toY(sample.depth) + toY(predicted)) / 2}%` }}><Typography shuku-edit-id="e-7b03cb8e-3ca0-410b-aac0-6789952642f7" variant="bodySmall" tone="accent">误差</Typography><Typography shuku-edit-id="e-15b0f011-1d3b-482f-9c8f-cc28793b5e3f" variant="h3" tone="accent">e = {signed}</Typography></div>
        <Typography shuku-edit-id="e-9a45e16d-abaf-4ccb-96c4-11f720c821ce" className="rl-error-input" variant="bodySmall" tone="accent">当前载重：{sample.mass} 千克</Typography>
      </section>
      <section shuku-edit-id="e-c60b65d1-2feb-40e8-ab4b-1241142fcb7e" className="rl-error-notes" aria-label="误差计算与解释">
        <div shuku-edit-id="e-8eec8748-d93c-4697-ba5b-59c357c60e6d" className="rl-error-card rl-error-definition"><Typography shuku-edit-id="e-cca9366b-2c06-4813-87d8-0fc59dcfed08" variant="h3" tone="accent">误差的计算</Typography><MathFormulaBlock appearance="plain" ariaLabel="误差等于观测值减预测值"><MathFormulaStatic latex="e=y-\hat{y}" /></MathFormulaBlock></div>
        <div shuku-edit-id="e-e6327dc4-ec71-40b2-9d9c-1479ee26352d" className="rl-error-card rl-error-sample"><Typography shuku-edit-id="e-bc96e5a9-d5d1-455d-9856-5139f19f913d" variant="h3" tone="accent">当前记录</Typography>
          <div shuku-edit-id="e-4e41d2b6-884e-4cf2-8a02-b6cd5711f5dc" className="rl-error-values"><div shuku-edit-id="e-7fd78a5c-336a-429f-8aaf-e92618f71afa"><Typography shuku-edit-id="e-82ef62eb-e759-41f2-95e8-1e6f94139d63" variant="bodySmall" tone="accent">观测值 y</Typography><Typography shuku-edit-id="e-53bb1ff0-df94-4c7c-83f1-c5312ba2e1a4" variant="h3" tone="inherit" className="rl-error-observed">{sample.depth.toFixed(1)} 厘米</Typography></div><div shuku-edit-id="e-686d58c8-0f73-4e07-9704-2073afd5befa"><Typography shuku-edit-id="e-26410e0d-fa2d-4cf6-84ff-67b69e6f5fad" variant="bodySmall" tone="accent">预测值 ŷ</Typography><Typography shuku-edit-id="e-2f25d08d-df98-4d2d-9455-1f29de1ebe1c" variant="h3" tone="inherit" className="rl-error-predicted">{predicted.toFixed(1)} 厘米</Typography></div></div>
          <div shuku-edit-id="e-cebe0c2c-d2f6-4e0a-9338-0bd732a0e422" className="rl-error-result"><Typography shuku-edit-id="e-bfc979f8-67f7-45a7-b1bc-926813659c9d" variant="h2" tone="accent">e = {signed} 厘米</Typography></div>
        </div>
        <div shuku-edit-id="e-8035ea58-1b39-42e8-a799-ebd49e055ddc" className="rl-error-card rl-error-direction"><div shuku-edit-id="e-ac18dd1d-9cd4-4545-85f5-0ecf15d0f183"><Typography shuku-edit-id="e-5d1680d4-3f6b-42f8-8d6b-80cf9b583c0b" variant="h3" tone="accent">{residual > 0 ? '误差为正：预测偏小' : residual < 0 ? '误差为负：预测偏大' : '误差为零：预测与观测一致'}</Typography><Typography shuku-edit-id="e-6a57c07c-6f44-4e19-b8b8-0b86ff9e31bc" variant="bodySmall" tone="muted">{residual > 0 ? '观测值大于预测值。' : residual < 0 ? '观测值小于预测值。' : '观测值等于预测值。'}</Typography><Button onClick={() => setOverestimate(value => !value)}>{overestimate ? '观察低估示例' : '观察高估示例'}</Button></div>
          <div shuku-edit-id="e-45cc4028-59f6-4b18-b82a-f8c19e8950a1" className="rl-error-mini" aria-hidden="true"><svg shuku-edit-id="e-74afac52-a978-42fd-91bf-fde87beab8fe" viewBox="0 0 130 110"><path shuku-edit-id="e-bae9f9d1-6381-4489-8bd9-0163ca2389aa" d="M10 94L120 65" stroke="#168c97" strokeWidth="4" fill="none"/><path shuku-edit-id="e-3b5beaac-0693-4a4b-89ed-108126472d7b" d={residual < 0 ? 'M53 82V98' : residual > 0 ? 'M53 20V82' : 'M53 82V82'} stroke="#df7a20" strokeWidth="2" strokeDasharray="5 4"/><circle shuku-edit-id="e-5a22a934-4247-4fc0-94e1-91b23cf57d2d" cx="53" cy="82" r="9" fill="#168c97" stroke="white" strokeWidth="2"/><circle shuku-edit-id="e-0f297ebc-7b74-4fd3-b7c4-23b664364bde" cx="53" cy={residual < 0 ? 98 : residual > 0 ? 20 : 82} r="9" fill="#df7a20" stroke="white" strokeWidth="2"/></svg><MathFormulaStatic latex={residual < 0 ? 'e<0' : residual > 0 ? 'e>0' : 'e=0'} /></div>
        </div>
      </section>
      <div shuku-edit-id="e-abb8a533-05f2-4e53-bea1-9ad16254221e" className="rl-error-takeaway"><svg shuku-edit-id="e-13b7e05d-996f-45c6-8a82-c64f79ec4815" className="rl-error-bulb" viewBox="0 0 40 40" aria-hidden="true"><circle shuku-edit-id="e-664e0be2-5412-4233-adf2-face6f52225b" cx="20" cy="20" r="19" fill="#c7dcfa"/><path shuku-edit-id="e-fb2a93f8-3b19-43f0-8285-6ff80e849760" d="M14 24C6 13 17 6 23 11C29 14 29 19 25 24L24 29H16L14 24ZM17 32H23M17 28V20L14 17M23 28V20L26 17" fill="none" stroke="#27446e" strokeWidth="2" strokeLinecap="round"/></svg><Typography shuku-edit-id="e-e79308de-bc7a-4a25-9497-2536b894fbb6" variant="body" tone="accent">误差有方向、有大小，单位与观测值相同。</Typography><div shuku-edit-id="e-ce1454e0-2fd4-4f64-99e5-8b5bf5b30aa2" className="rl-error-term-note"><Typography shuku-edit-id="e-b16d76f0-214d-450c-bfe0-6c1c02dd27f3" variant="bodySmall" tone="muted">这里的“误差”严格指残差。</Typography><ExplainPanelButton label="了解误差与残差的区别"><Typography shuku-edit-id="e-5d727920-114f-43fb-9011-0de2d18c8d8a" variant="h3" tone="accent">为什么称为残差？</Typography><Typography shuku-edit-id="e-d3ece013-ae37-465e-9e27-80413f85ff54" variant="bodySmall">观测值减去模型预测值，统计学中称为残差。本页先用“误差”帮助理解预测偏差，实际计算的是残差；它不同于观测值与未知真实回归关系之间的统计误差。</Typography></ExplainPanelButton></div></div>
    </div>
  </ContentBlock>;
}
