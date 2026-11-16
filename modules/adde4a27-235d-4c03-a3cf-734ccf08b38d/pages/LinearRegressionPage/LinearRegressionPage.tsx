import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Button, ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, RangeControl, Typography } from "@shuku/course-style/react";
import { useRecordedData } from '../../regressionData';
import './LinearRegressionPage.css';

const sliderStyle = (value: number, min: number, max: number) => {
  const fill = (value - min) / (max - min) * 100;
  return { background: `linear-gradient(to right, #168c97 ${fill}%, #e5eaf0 ${fill}%)` };
};

const chartGrid = { left: 82, right: 36, top: 48, bottom: 77 };
const maxX = 1750;
const maxY = 48;
const minW = .008, maxW = .024, minB = 0, maxB = 6;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
type Endpoint = 'left' | 'right';

export function LinearRegressionPage() {
  const calibration = useRecordedData();
  const selected = Math.max(0, Math.min(4, calibration.length - 1));
  const [w, setW] = useState(.016);
  const [b, setB] = useState(0);
  const plotRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ endpoint: Endpoint; pointerY: number; depth: number; rightDepth: number } | null>(null);
  const [plotSize, setPlotSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const host = plotRef.current;
    if (!host) return;
    const update = () => setPlotSize({ width: host.clientWidth, height: host.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, [calibration.length > 0]);
  const adjustEndpoint = (endpoint: Endpoint, depth: number, rightDepth = w * maxX + b) => {
    if (endpoint === 'right') {
      setW(clamp((depth - b) / maxX, minW, maxW));
    } else {
      // Pivot around the opposite endpoint while keeping both controls in range.
      const nextB = clamp(depth, Math.max(minB, rightDepth - maxW * maxX), Math.min(maxB, rightDepth - minW * maxX));
      setB(nextB);
      setW((rightDepth - nextB) / maxX);
    }
  };
  const dragEndpoint = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const host = plotRef.current;
    if (!drag || !host || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = host.getBoundingClientRect();
    const plotHeight = host.clientHeight - chartGrid.top - chartGrid.bottom;
    if (rect.height <= 0 || plotHeight <= 0) return;
    const delta = (event.clientY - drag.pointerY) * host.clientHeight / rect.height;
    adjustEndpoint(drag.endpoint, drag.depth - delta / plotHeight * maxY, drag.rightDepth);
  };
  const releaseEndpoint = (event: PointerEvent<HTMLButtonElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const point = calibration[Math.min(selected,calibration.length-1)] ?? {mass:0,depth:0};
  const predicted = w * point.mass + b;
  const option = useMemo(() => ({
    animation: false,
    grid: chartGrid,
    xAxis: { type: 'value', min: 0, max: 1750, interval: 500, name: '累计石重 x（千克）', nameLocation: 'middle', nameGap: 43,
      nameTextStyle: { color: '#27446e', fontSize: 27 }, axisLabel: { color: '#526582', fontSize: 22 }, axisLine: { show: true }, splitLine: { show: false } },
    yAxis: { type: 'value', min: 0, max: 48, interval: 16, name: '下沉深度（厘米）', nameGap: 24,
      nameTextStyle: { color: '#27446e', fontSize: 27, align: 'left' }, axisLabel: { color: '#526582', fontSize: 22 }, axisLine: { show: true }, splitLine: { lineStyle: { color: '#dfe6ec' } } },
    series: [
      { type: 'line', symbol: 'none', data: [[0, b], [1750, w * 1750 + b]], lineStyle: { color: '#168c97', width: 4 }, silent: true },
      { type: 'scatter', symbolSize: 14, data: calibration.filter((_, i) => i !== selected).map(p => [p.mass, p.depth]), itemStyle: { color: '#8191a6' }, silent: true },
      { type: 'line', symbol: 'none', data: [[point.mass, 0], [point.mass, Math.max(point.depth, predicted)]], lineStyle: { color: '#75849b', width: 1, type: 'dashed' }, silent: true },
      { type: 'scatter', symbolSize: 16, data: [[point.mass, point.depth]], itemStyle: { color: '#c06d17', borderWidth: 2, borderColor: '#fff' }, silent: true, z: 6 },
      { type: 'scatter', symbolSize: 22, data: [[point.mass, predicted]], itemStyle: { color: 'rgba(255,255,255,0)', borderWidth: 3, borderColor: '#168c97' }, silent: true, z: 7 },
    ],
  }), [point, predicted, selected, w, b]);
  if(!calibration.length)return <ContentBlock shuku-edit-id="e-7f932cd7-4cad-4a7d-8e23-e67cd8ea67f7" title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock shuku-edit-id="e-1eb33f38-4222-42e4-9b73-84449c955f71" headingLevel={1} title="线性回归模型" subtitle="调整斜率与截距，观察预测直线如何变化。" className="rl-linear-page">
    <div shuku-edit-id="e-2114721c-4d66-4cf5-844f-ebee1069676b" className="rl-linear-content">
      <div shuku-edit-id="e-7c62c193-bea4-45fc-9e0f-4d120701db2a" className="rl-linear-layout">
        <section shuku-edit-id="e-1f75de1c-3d20-4ffc-9fda-2f497e61a1db" className="rl-linear-data" aria-label="观测数据与可调预测直线">
          <header shuku-edit-id="e-3ceb1a6c-57fd-49c8-a25d-92ec024f0f39" className="rl-linear-plot-head"><Typography shuku-edit-id="e-b4883695-39e9-4b70-b9cf-09cb1a9855cc" variant="h3" tone="accent">观测与预测</Typography><div shuku-edit-id="e-9fd326e2-acf0-48a0-b9af-768ad13bc3f1" className="rl-linear-legend"><span shuku-edit-id="e-7dc018ea-822b-4916-bd6d-bdf7e82c01ac"><i shuku-edit-id="e-f8f09a1b-e402-488b-86ad-9a565dc94191" />观测记录</span><span shuku-edit-id="e-c9f6595c-1306-4079-ba02-697e41030c13"><i shuku-edit-id="e-3ff28b09-e267-4252-b672-3ac8ed98178b" className="is-line" />预测直线</span></div></header>
          <div shuku-edit-id="e-064e0fec-02da-4bd8-98ee-29b1efe04513" className="rl-linear-plot-canvas" ref={plotRef}>
          <EChartsChart className="rl-linear-chart" option={option} minHeight={0} aria-label={`载重 ${point.mass} 千克，观测深度 ${point.depth.toFixed(1)} 厘米，预测深度 ${predicted.toFixed(1)} 厘米`} />
            {plotSize.width > 0 && plotSize.height > 0 && (['left', 'right'] as const).map(endpoint => {
              const depth = endpoint === 'left' ? b : w * maxX + b;
              const x = endpoint === 'left' ? chartGrid.left : plotSize.width - chartGrid.right;
              const y = chartGrid.top + (1 - depth / maxY) * (plotSize.height - chartGrid.top - chartGrid.bottom);
              return <Button key={endpoint} className="rl-linear-handle" role="slider" aria-label={endpoint === 'left' ? '拖动直线左端点' : '拖动直线右端点'} aria-orientation="vertical" aria-valuemin={endpoint === 'left' ? minB : minW * maxX + b} aria-valuemax={endpoint === 'left' ? maxB : maxW * maxX + b} aria-valuenow={depth} aria-valuetext={`下沉深度 ${depth.toFixed(1)}，斜率 ${w.toFixed(4)}，截距 ${b.toFixed(1)}`} title="上下拖动端点；也可用方向键调整" style={{ left: x, top: y }}
                onPointerDown={event => {
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  dragRef.current = { endpoint, pointerY: event.clientY, depth, rightDepth: w * maxX + b };
                }} onPointerMove={dragEndpoint} onPointerUp={releaseEndpoint} onPointerCancel={releaseEndpoint} onLostPointerCapture={() => { dragRef.current = null; }}
                onKeyDown={event => {
                  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                  event.preventDefault();
                  const min = endpoint === 'left' ? minB : minW * maxX + b;
                  const max = endpoint === 'left' ? maxB : maxW * maxX + b;
                  const next = event.key === 'Home' ? min : event.key === 'End' ? max : depth + (event.key === 'ArrowUp' || event.key === 'ArrowRight' ? .1 : -.1);
                  adjustEndpoint(endpoint, next);
                }}><Typography shuku-edit-id="e-c051e712-99a0-4094-9083-81865f010059" as="span" variant="bodySmall" tone="inherit" aria-hidden="true">↕</Typography></Button>;
            })}
          </div>
          <div shuku-edit-id="e-b904d07e-4a2c-4c25-a2f0-9ac387704812" className="rl-linear-sample" aria-live="polite"><Typography shuku-edit-id="e-0ddaa934-4e49-4eb4-809d-99fdfd1bae6b" variant="bodySmall" tone="muted">同一输入 · <strong shuku-edit-id="e-2bedc26d-d0a8-487b-b465-9a964ac09c31">{point.mass}</strong> 千克</Typography><Typography shuku-edit-id="e-80b2603e-85e3-4e8c-89e0-f3dea6b008ac" variant="bodySmall" className="rl-linear-observed"><i shuku-edit-id="e-e2644112-a09d-4127-b71b-c71e379e00ad" />观测 <strong shuku-edit-id="e-fbfbaf98-fffd-4ba9-9db8-abe6281078de">{point.depth.toFixed(1)}</strong> cm</Typography><Typography shuku-edit-id="e-527ae600-290a-4a24-b57a-4567558414d5" variant="bodySmall" className="rl-linear-predicted"><i shuku-edit-id="e-d8bbf24a-14de-4fe8-9a83-7980a02928e6" />预测 <strong shuku-edit-id="e-0c635e4d-22cf-4259-896f-d740f0390b8e">{predicted.toFixed(1)}</strong> cm</Typography></div>
        </section>
        <section shuku-edit-id="e-fed1ffea-cda2-4a59-b90e-22b726e41b79" className="rl-linear-controls" aria-label="预测公式与模型参数">
          <div shuku-edit-id="e-935f5752-fcbe-4314-9ae8-2d3d7b27bf46" className="rl-linear-model-section">
            <Typography shuku-edit-id="e-7f519bae-a5e2-4c1e-b644-7b1a9304ddb1" variant="h3" tone="accent">预测模型</Typography>
            <MathFormulaBlock appearance="plain" className="rl-linear-model" ariaLabel="预测值等于斜率乘输入加截距"><MathFormulaStatic latex={'\\hat{y}=\\textcolor{#168c97}{w}x+\\textcolor{#168c97}{b}'} /></MathFormulaBlock>
            <div shuku-edit-id="e-c0fd4670-50b6-4b9c-acb8-aed06eea2a86" className="rl-linear-variables"><Typography shuku-edit-id="e-548d4b41-eb77-4e1a-b595-a498b213b905" variant="bodySmall" tone="accent">x：累计石重</Typography><span shuku-edit-id="e-488723c4-74fe-4ec0-a144-5a5af2573230" aria-hidden="true">·</span><Typography shuku-edit-id="e-d72aed71-4270-4277-85f9-dce8f746befc" variant="bodySmall" tone="accent">ŷ：预测下沉深度</Typography></div>
            <Typography shuku-edit-id="e-8ed56ee2-1bb8-491e-ab08-0ddf81cb6a35" variant="bodySmall" tone="muted" className="rl-linear-parameter-note">w、b 是需要确定的模型参数</Typography>
          </div>
          <div shuku-edit-id="e-641abb12-f01b-4ada-944f-1051a14b6d72" className="rl-linear-parameter rl-linear-slope"><RangeControl label={<span shuku-edit-id="e-92160029-7e88-4ce9-bc33-acaae05bb359" className="rl-linear-parameter-label"><i shuku-edit-id="e-3393817b-f8bd-4027-a54e-ddd8f38e7568">w</i>斜率</span>} aria-label="斜率 w" style={sliderStyle(w, .008, .024)} min={.008} max={.024} step="any" digits={4} suffix=" 厘米/千克" value={w} onChange={event => setW(Number(event.target.value))} /><div shuku-edit-id="e-a277ba60-c87b-4cfd-aa17-5b27f5ab12eb" className="rl-linear-range-ends" aria-hidden="true"><span shuku-edit-id="e-df405a4d-c6be-458f-9849-0552ae92255f">0.008</span><span shuku-edit-id="e-7a7323be-22a5-40b7-affa-835671d0035e">0.024</span></div><Typography shuku-edit-id="e-d797c883-157a-4e82-828e-27be916a8da9" variant="bodySmall" tone="muted">w 增大，直线变陡。<span shuku-edit-id="e-31f5242f-12f8-478e-8364-ed72e59c23a3" className="rl-linear-direction" aria-hidden="true">↗</span></Typography></div>
          <div shuku-edit-id="e-e755be98-0002-4721-b675-ffb9f3bc01f5" className="rl-linear-parameter rl-linear-intercept"><RangeControl label={<span shuku-edit-id="e-33ce19a9-0417-4c19-b1fa-e9a6c70d6e97" className="rl-linear-parameter-label"><i shuku-edit-id="e-32b6571d-ea5b-49c9-a03a-ba3a8f8985cc">b</i>截距</span>} aria-label="截距 b" style={sliderStyle(b, 0, 6)} min={0} max={6} step="any" digits={1} suffix=" 厘米" value={b} onChange={event => setB(Number(event.target.value))} /><div shuku-edit-id="e-231e737c-56d9-4a69-9851-f54860cf3546" className="rl-linear-range-ends" aria-hidden="true"><span shuku-edit-id="e-0a728f77-fcee-4d76-929e-b108c17c8cf1">0</span><span shuku-edit-id="e-51a99c61-79cc-466d-80f6-1ba58499f9d8">6</span></div><Typography shuku-edit-id="e-9ebcfe3b-a6a1-4b3b-975b-731056835c0b" variant="bodySmall" tone="muted">b 增大，整条直线上移。<span shuku-edit-id="e-52e8348c-7dd4-4e0a-a1e0-efa94ae31d83" className="rl-linear-direction" aria-hidden="true">↑</span></Typography></div>
        </section>
      </div>
      <Typography shuku-edit-id="e-82627acd-9873-42d4-a3b2-849e71d7ec59" variant="bodySmall" tone="accent" className="rl-linear-takeaway">观测记录保持不变，调整的是模型对数据的预测。</Typography>
    </div>
  </ContentBlock>;
}
