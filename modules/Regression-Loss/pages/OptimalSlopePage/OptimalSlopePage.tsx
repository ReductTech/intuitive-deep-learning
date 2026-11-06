import { Rotate } from '@icon-park/react';
import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import { useRecordedData } from '../../regressionData';
import { InterceptLossPlot } from '../OptimalInterceptPage/InterceptLossPlot';
import '../OptimalInterceptPage/OptimalInterceptPage.css';
import './OptimalSlopePage.css';
const grid = { left:65, right:24, top:50, bottom:49 };
export function OptimalSlopePage() {
  const data = useRecordedData();
  const [offset, setOffset] = useState(2);
  const [hasInteracted, setHasInteracted] = useState(false);
  const model = useMemo(() => {
    const n = data.length;
    const mx = n ? data.reduce((s,p) => s+p.mass,0)/n : 0;
    const my = n ? data.reduce((s,p) => s+p.depth,0)/n : 0;
    const xx = data.reduce((s,p) => s+(p.mass-mx)**2,0);
    const xy = data.reduce((s,p) => s+(p.mass-mx)*(p.depth-my),0);
    const w = xx ? xy/xx : 0;
    const minimum = data.reduce((s,p) => s+((p.depth-my)-w*(p.mass-mx))**2,0);
    return { mx,my,xx,w,minimum };
  }, [data]);
  const scaledW = 1000*model.w + offset;
  const w = scaledW/1000;
  const b = model.my-w*model.mx;
  const plotRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerY: number; scaledW: number; unitsPerPixel: number; lever: number } | null>(null);
  const [plotSize, setPlotSize] = useState({ width: 0, height: 0 });
  const boundaryDepths = [model.w - .006, model.w + .006].flatMap(slope => [model.my - slope * model.mx, model.my + slope * (1600 - model.mx)]);
  const yMin = Math.floor(Math.min(0, ...boundaryDepths) / 10) * 10;
  const yMax = Math.ceil(Math.max(30, ...boundaryDepths) / 10) * 10;
  const changeSlope = (value: number) => {
    const next = Math.max(-6, Math.min(6, value - model.w * 1000));
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
  }, [data.length > 0 && model.xx > 0]);
  const moveLine = (event: PointerEvent<SVGLineElement>) => {
    const drag = dragRef.current;
    if (!drag || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const deltaDepth = -(event.clientY - drag.pointerY) * drag.unitsPerPixel;
    changeSlope(drag.scaledW + deltaDepth / drag.lever * 1000);
  };
  const releaseLine = (event: PointerEvent<SVGLineElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const lineY = (depth: number) => grid.top + (yMax - depth) / (yMax - yMin) * (plotSize.height - grid.top - grid.bottom);
  const option = useMemo(() => ({ animation:false, tooltip:{ trigger:'item' }, grid,
    xAxis:{ type:'value',min:0,max:1600,interval:500,name:'石重（千克）',nameLocation:'middle',nameGap:27,nameTextStyle:{ fontSize:19,color:'#27446e' },axisLabel:{ fontSize:17 },splitLine:{show:false} },
    yAxis:{ type:'value',min:yMin,max:yMax,name:'深度（厘米）',nameGap:18,nameTextStyle:{fontSize:18,color:'#27446e',align:'left'},axisLabel:{fontSize:17},splitLine:{lineStyle:{color:'#e5edf6'}} },
    series:[
      {type:'line',symbol:'none',data:data.flatMap(p => [[p.mass,p.depth],[p.mass,w*p.mass+b],[null,null]]),lineStyle:{color:'#ed9867',width:2},silent:true},
      {type:'line',symbol:'none',data:[[0,b],[1600,w*1600+b]],lineStyle:{color:'#009eaa',width:4},silent:true},
      {type:'scatter',data:data.map(p => [p.mass,p.depth]),symbolSize:12,itemStyle:{color:'#367de8'}},
      {type:'scatter',data:[[model.mx,model.my]],symbolSize:16,itemStyle:{color:'#009eaa',borderColor:'#fff',borderWidth:2},tooltip:{formatter:'平均中心（x̄,ȳ）<br>改变斜率时，直线始终通过这里'}}
    ]
  }), [data,model,w,b,yMin,yMax]);
  if (!data.length || !model.xx) return <ContentBlock title="请先完成称象记录" subtitle="需要不同累计石重下的实际观测。" />;
  return <ContentBlock headingLevel={1} title="再求最优斜率" subtitle="截距取最优值，调整直线倾斜程度，寻找平方误差最小的位置。" className="rl-intercept-page rl-slope-page"><div className="rl-intercept-layout">
    <section className="rl-intercept-derivation rl-slope-derivation">
      <div className="rl-intercept-step"><div className="rl-intercept-heading"><span className="rl-intercept-number"><Typography as="span" variant="body" tone="inherit">1</Typography></span><Typography variant="h3" tone="accent">代入最优截距</Typography></div><MathFormulaBlock appearance="plain" className="rl-slope-substitution"><MathFormulaTerm latex="b^*(w)=\bar y-w\bar x" tooltip="沿用上一页结果，每次改变w，b都自动取这个条件最优值，因此直线始终通过平均中心。" /></MathFormulaBlock><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="S(w)" tooltip="这里简写S(w,b*(w))，截距已消去，只剩斜率一个变量。" /><MathFormulaStatic latex="=" /><MathFormulaTerm latex="\sum_i[(y_i-\bar y)-w(x_i-\bar x)]^2" tooltip="代入截距并整理，得到中心化后的平方误差之和。" /></MathFormulaBlock></div>
      <div className="rl-intercept-step"><div className="rl-intercept-heading"><span className="rl-intercept-number"><Typography as="span" variant="body" tone="inherit">2</Typography></span><Typography variant="h3" tone="accent">对 w 求导</Typography></div><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="S'(w)=-2\sum_i(x_i-\bar x)" tooltip="链式法则：平方求导产生2，内层对w求导是−(xᵢ−x̄)。" /></MathFormulaBlock><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="\cdot[(y_i-\bar y)-w(x_i-\bar x)]" tooltip="这一行接在上行求和符号内部，每条中心化误差乘相应的中心化输入。" /></MathFormulaBlock></div>
      <div className="rl-intercept-step rl-intercept-result"><div className="rl-intercept-heading"><span className="rl-intercept-number"><Typography as="span" variant="body" tone="inherit">3</Typography></span><Typography variant="h3" tone="accent">令导数为零</Typography></div><MathFormulaBlock appearance="plain" className="rl-intercept-stationary"><MathFormulaTerm latex="S'(w)=0" tooltip="整理得到wΣ(xᵢ−x̄)²=Σ(xᵢ−x̄)(yᵢ−ȳ)，输入不全相同时分母为正。" /></MathFormulaBlock><MathFormulaBlock appearance="plain" className="rl-intercept-answer"><MathFormulaTerm latex="w^*" tooltip="使全部平方误差最小的斜率。" tooltipPlacement="top" /><MathFormulaStatic latex="=" /><MathFormulaTerm latex="\frac{\sum_i(x_i-\bar x)(y_i-\bar y)}{\sum_i(x_i-\bar x)^2}" tooltip="分子是中心化输入与观测的乘积之和；分母是输入偏差逐项平方之和。" tooltipPlacement="top" /></MathFormulaBlock></div>
    </section>
    <section className="rl-intercept-visual"><div className="rl-intercept-plot-intro"><Typography variant="h3" tone="accent">改变斜率 w，直线绕平均中心转动</Typography></div><div className="rl-intercept-prediction-canvas" ref={plotRef}><EChartsChart option={option} minHeight={0} className="rl-intercept-prediction-chart" aria-label="预测直线，直接拖动旋转，始终通过平均中心" />
      {plotSize.width > 0 && plotSize.height > grid.top + grid.bottom && <svg className="rl-intercept-line-overlay" viewBox={`0 0 ${plotSize.width} ${plotSize.height}`} aria-label="拖动预测直线旋转">
        <line className="rl-intercept-line-hit" x1={grid.left} y1={lineY(b)} x2={plotSize.width - grid.right} y2={lineY(w * 1600 + b)} role="slider" tabIndex={0} aria-label="拖动直线调整斜率 w" aria-valuemin={model.w - .006} aria-valuemax={model.w + .006} aria-valuenow={w} aria-valuetext={`当前斜率 ${w.toFixed(4)}，直线绕平均中心转动`}
          onPointerDown={event => {
            const host = plotRef.current;
            if (!host) return;
            const rect = host.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;
            const x = ((event.clientX - rect.left) * host.clientWidth / rect.width - grid.left) / (host.clientWidth - grid.left - grid.right) * 1600;
            const lever = x - model.mx;
            if (Math.abs(lever) < 60) return;
            event.preventDefault();
            event.currentTarget.focus();
            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = { pointerY: event.clientY, scaledW, lever, unitsPerPixel: (yMax - yMin) / (host.clientHeight - grid.top - grid.bottom) * host.clientHeight / rect.height };
          }} onPointerMove={moveLine} onPointerUp={releaseLine} onPointerCancel={releaseLine} onLostPointerCapture={() => { dragRef.current = null; }}
          onKeyDown={event => {
            if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            changeSlope(event.key === 'Home' ? model.w * 1000 - 6 : event.key === 'End' ? model.w * 1000 + 6 : scaledW + (event.key === 'ArrowUp' || event.key === 'ArrowRight' ? .1 : -.1));
          }}><title>拖动远离平均中心的线段，调整直线倾斜程度</title></line>
      </svg>}
      {!hasInteracted && plotSize.width > 0 && <div className="rl-line-drag-hint edu-attention-hint" role="status" style={{ left: grid.left + (plotSize.width - grid.left - grid.right) * .65, top: lineY(w * 1600 * .65 + b) - 18 }}><Rotate size={30} /><Typography variant="body" tone="inherit">拖动直线，旋转调整</Typography></div>}
    </div></section>
    <div className="rl-intercept-link"><Typography variant="h2" tone="accent">↔</Typography></div>
    <section className="rl-intercept-visual"><Typography variant="h3" tone="accent">每个斜率 w，对应一个平方误差总和</Typography><InterceptLossPlot slope n={model.xx/1000000} optimum={model.w*1000} minimum={model.minimum} b={scaledW} onChange={changeSlope} /></section>

  </div></ContentBlock>;
}
