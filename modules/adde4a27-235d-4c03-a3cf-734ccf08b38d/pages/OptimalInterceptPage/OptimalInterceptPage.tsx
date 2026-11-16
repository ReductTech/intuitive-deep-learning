import { UpAndDown } from '@icon-park/react';
import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import { useRecordedData } from '../../regressionData';
import { InterceptLossPlot } from './InterceptLossPlot';
import './OptimalInterceptPage.css';
const fixedSlope = .014;
const predictionGrid = { left: 65, right: 24, top: 50, bottom: 49 };

export function OptimalInterceptPage() {
  const data = useRecordedData();
  const [offset, setOffset] = useState(1.3);
  const [hasInteracted, setHasInteracted] = useState(false);
  const model = useMemo(() => {
    const n = data.length;
    const meanX = n ? data.reduce((s, p) => s + p.mass, 0) / n : 0;
    const meanY = n ? data.reduce((s, p) => s + p.depth, 0) / n : 0;
    const optimalB = meanY - fixedSlope * meanX;
    const minimum = data.reduce((s, p) => s + (p.depth - fixedSlope * p.mass - optimalB) ** 2, 0);
    return { n, optimalB, minimum };
  }, [data]);
  const b = model.optimalB + offset;
  const plotRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerY: number; b: number; unitsPerPixel: number } | null>(null);
  const [plotSize, setPlotSize] = useState({ width: 0, height: 0 });
  const yMin = Math.min(0, Math.floor((model.optimalB - 6) / 5) * 5);
  const yMax = Math.max(30, Math.ceil((fixedSlope * 1600 + model.optimalB + 6) / 10) * 10);
  const changeIntercept = (value: number) => {
    const next = Math.max(-6, Math.min(6, value - model.optimalB));
    if (Math.abs(next - offset) > 1e-8) setHasInteracted(true);
    setOffset(next);
  };
  useLayoutEffect(() => {
    const host = plotRef.current;
    if (!host) return;
    const update = () => setPlotSize({ width: host.clientWidth, height: host.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, [data.length > 0]);
  const moveLine = (event: PointerEvent<SVGLineElement>) => {
    const drag = dragRef.current;
    if (!drag || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    changeIntercept(drag.b - (event.clientY - drag.pointerY) * drag.unitsPerPixel);
  };
  const releaseLine = (event: PointerEvent<SVGLineElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const lineY = (depth: number) => predictionGrid.top + (yMax - depth) / (yMax - yMin) * (plotSize.height - predictionGrid.top - predictionGrid.bottom);
  const predictionOption = useMemo(() => ({
    animation: false, tooltip: { trigger: 'item' },
    grid: predictionGrid,
    xAxis: { type: 'value', min: 0, max: 1600, interval: 500, name: '石重（千克）', nameLocation: 'middle', nameGap: 27, nameTextStyle: { fontSize: 19, color: '#27446e' }, axisLabel: { fontSize: 17 }, splitLine: { show: false } },
    yAxis: { type: 'value', min: yMin, max: yMax, name: '深度（厘米）', nameGap: 18, nameTextStyle: { fontSize: 18, color: '#27446e', align: 'left' }, axisLabel: { fontSize: 17 }, splitLine: { lineStyle: { color: '#e5edf6' } } },
    series: [
      { type: 'line', symbol: 'none', connectNulls: false, data: data.flatMap(p => [[p.mass, p.depth], [p.mass, fixedSlope * p.mass + b], [null, null]]), lineStyle: { color: '#ed9867', width: 2 }, silent: true },
      { type: 'line', symbol: 'none', data: [[0, b], [1600, fixedSlope * 1600 + b]], lineStyle: { color: '#009eaa', width: 4 }, silent: true },
      { type: 'scatter', data: data.map(p => [p.mass, p.depth]), symbolSize: 12, itemStyle: { color: '#367de8' } },
    ],
  }), [data, b, yMin, yMax]);
  if (!data.length) return <ContentBlock shuku-edit-id="e-4249c75c-11e0-48f6-bfb8-0e9fbdf2c545" title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
  return <ContentBlock shuku-edit-id="e-86093b6e-98ab-4ea4-a9bb-792cb8c7be87" headingLevel={1} title="先求最优截距" subtitle="固定斜率，调整直线上下位置，寻找平方误差最小的位置。" className="rl-intercept-page">
    <div shuku-edit-id="e-160ed39c-8cf0-4919-96c9-1b9a4838e882" className="rl-intercept-layout">
      <section shuku-edit-id="e-7acae2a6-ef1b-4b95-bd82-ab945be7ebad" className="rl-intercept-derivation" aria-label="最优截距的三步推导">
        <div shuku-edit-id="e-27f1a380-2083-45f6-8ac1-e5f8c4009bf4" className="rl-intercept-step"><div shuku-edit-id="e-10e5d02b-eafe-48ca-8f56-e503bcc5906d" className="rl-intercept-heading"><span shuku-edit-id="e-446423ff-4146-49ce-a811-2878ca7e0e81" className="rl-intercept-number"><Typography shuku-edit-id="e-cbe48b04-64f9-48c2-90f1-cca782b1b9f9" as="span" variant="body" tone="inherit">1</Typography></span><Typography shuku-edit-id="e-9dece046-34a5-41a9-a0f2-95ecb380ce01" variant="h3" tone="accent">建立目标</Typography></div><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="S(b;w)" tooltip="固定w后，把全部观测的平方误差之和看成关于截距b的函数。" /><MathFormulaStatic latex="=" /><MathFormulaTerm latex="\sum_{i=1}^{n}" tooltip="对第一页全部实际记录求和。" /><MathFormulaTerm latex="(y_i-wx_i-b)^2" tooltip="每条橙色竖线对应一个观测误差，平方后相加得到右图的高度。" /></MathFormulaBlock></div>
        <div shuku-edit-id="e-636ab862-4e22-4061-8fca-3cf991317dee" className="rl-intercept-step"><div shuku-edit-id="e-b491c6b5-6a3f-44f0-b4c0-58377d013b19" className="rl-intercept-heading"><span shuku-edit-id="e-e5b94803-ff2e-4ff1-906d-f3924f79170c" className="rl-intercept-number"><Typography shuku-edit-id="e-2b8e5b1b-3eff-444a-99ca-0c51a4f17a75" as="span" variant="body" tone="inherit">2</Typography></span><Typography shuku-edit-id="e-ef0cd2d4-49fe-4337-9acb-39f268a4fd32" variant="h3" tone="accent">对 b 求导</Typography></div><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="S'(b)" tooltip="右图在当前点的切线斜率，描述增大b时平方和的变化率。" /><MathFormulaStatic latex="=" /><MathFormulaTerm latex="-2" tone="warm" tooltip="链式法则：外层平方求导得到2，内层−b求导得到−1，因此出现−2。" /><MathFormulaTerm latex="\sum_{i=1}^{n}(y_i-wx_i-b)" tooltip="将每个平方误差的导数相加。" /></MathFormulaBlock></div>
        <div shuku-edit-id="e-2922b626-3c33-4a5c-acd2-5cbe2efcf249" className="rl-intercept-step rl-intercept-result"><div shuku-edit-id="e-49e7ea3d-f46b-4e5a-8279-22740466d5eb" className="rl-intercept-heading"><span shuku-edit-id="e-b2d10e26-4f10-4cd0-b9eb-9604a6b8ec5e" className="rl-intercept-number"><Typography shuku-edit-id="e-994c1961-2809-49e7-b462-11c91e733844" as="span" variant="body" tone="inherit">3</Typography></span><Typography shuku-edit-id="e-54ff83c0-3ef8-4b4a-9933-52fe633b50d3" variant="h3" tone="accent">令导数为零</Typography></div><MathFormulaBlock appearance="plain" className="rl-intercept-stationary"><MathFormulaTerm latex="S'(b)=0" tooltip="因此Σ(yᵢ−wxᵢ−b)=0，整理得到nb=Σyᵢ−wΣxᵢ，两边除以n即得到下方答案。" /><MathFormulaStatic latex="\Longrightarrow" /></MathFormulaBlock><MathFormulaBlock appearance="plain" className="rl-intercept-answer"><MathFormulaTerm latex="b^*(w)" tooltip="给定斜率w时使平方误差最小的截距，不是右侧抛物线的截距。" tooltipPlacement="top" /><MathFormulaStatic latex="=" /><MathFormulaTerm latex="\bar y" tooltip="全部观测深度的平均值。" tooltipPlacement="top" /><MathFormulaStatic latex="-" /><MathFormulaTerm latex="w" tooltip="本页固定的预测直线斜率。" tooltipPlacement="top" /><MathFormulaTerm latex="\bar x" tooltip="全部累计石重的平均值。" tooltipPlacement="top" /></MathFormulaBlock></div>
      </section>
      <section shuku-edit-id="e-506944b2-86bb-41eb-8ee5-ec036a39e825" className="rl-intercept-visual">
        <div shuku-edit-id="e-9d3715d9-194e-4a45-8580-327244f194ea" className="rl-intercept-plot-intro"><Typography shuku-edit-id="e-46c1b2d8-1306-4dba-af15-94e29b09f658" variant="h3" tone="accent">改变截距 b，直线上下移动</Typography><MathFormulaBlock appearance="plain" className="rl-intercept-b-label"><MathFormulaTerm latex={String.raw`w=${fixedSlope}`} tooltip="斜率固定为0.014。改变截距b只会使这条直线上下平移，橙色竖线是各条记录的误差。" /></MathFormulaBlock></div>
        <div shuku-edit-id="e-4267fe3c-fc34-4323-bf63-679547a759e0" className="rl-intercept-prediction-canvas" ref={plotRef}>
        <EChartsChart option={predictionOption} minHeight={0} className="rl-intercept-prediction-chart" aria-label="固定斜率的预测直线，橙色竖线表示误差" />
          {plotSize.width > 0 && plotSize.height > predictionGrid.top + predictionGrid.bottom && <svg shuku-edit-id="e-50a55f35-a4c3-4c9a-a590-7e429437cc76" className="rl-intercept-line-overlay" viewBox={`0 0 ${plotSize.width} ${plotSize.height}`} aria-label="拖动预测直线上下平移">
            <line shuku-edit-id="e-d43b0952-b725-4515-8da0-aa7ae256c883" className="rl-intercept-line-hit" x1={predictionGrid.left} y1={lineY(b)} x2={plotSize.width - predictionGrid.right} y2={lineY(fixedSlope * 1600 + b)} role="slider" tabIndex={0} aria-label="预测直线的截距 b，上下拖动调整" aria-orientation="vertical" aria-valuemin={model.optimalB - 6} aria-valuemax={model.optimalB + 6} aria-valuenow={b} aria-valuetext={`当前截距 ${b.toFixed(1)}，斜率固定为 ${fixedSlope}`}
              onPointerDown={event => {
                const host = plotRef.current;
                if (!host) return;
                const rect = host.getBoundingClientRect();
                if (rect.height <= 0) return;
                event.preventDefault();
                event.currentTarget.focus();
                event.currentTarget.setPointerCapture(event.pointerId);
                dragRef.current = { pointerY: event.clientY, b, unitsPerPixel: (yMax - yMin) / (host.clientHeight - predictionGrid.top - predictionGrid.bottom) * host.clientHeight / rect.height };
              }} onPointerMove={moveLine} onPointerUp={releaseLine} onPointerCancel={releaseLine} onLostPointerCapture={() => { dragRef.current = null; }}
              onKeyDown={event => {
                if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault();
                changeIntercept(event.key === 'Home' ? model.optimalB - 6 : event.key === 'End' ? model.optimalB + 6 : b + (event.key === 'ArrowUp' ? .1 : -.1));
              }}><title>上下拖动改变截距，斜率保持不变</title></line>
          </svg>}
          {!hasInteracted && plotSize.width > 0 && <div shuku-edit-id="e-3393e4e7-f480-464d-bfcc-ecf4a9521171" className="rl-line-drag-hint edu-attention-hint" role="status" style={{ left: predictionGrid.left + (plotSize.width - predictionGrid.left - predictionGrid.right) * .62, top: lineY(fixedSlope * 1600 * .62 + b) - 18 }}><UpAndDown size={30} /><Typography shuku-edit-id="e-0ac450c3-00a9-4097-a79e-ac19bb95b4f7" variant="body" tone="inherit">拖动直线，上下移动</Typography></div>}
        </div>
      </section>
      <div shuku-edit-id="e-19aca701-b243-4809-80af-c9b65db60fb8" className="rl-intercept-link"><Typography shuku-edit-id="e-891e4934-9d9f-41cf-a93b-8db3cc5b7fa8" variant="h2" tone="accent">↔</Typography></div>
      <section shuku-edit-id="e-955ba8e1-7a4f-4930-b91a-3dd414d79d47" className="rl-intercept-visual">
        <Typography shuku-edit-id="e-a17b675a-59ed-4bc5-8346-388d074ed574" variant="h3" tone="accent">每个截距 b，对应一个平方误差总和</Typography>
        <InterceptLossPlot n={model.n} optimum={model.optimalB} minimum={model.minimum} b={b} onChange={changeIntercept} />
      </section>

    </div>
  </ContentBlock>;
}


