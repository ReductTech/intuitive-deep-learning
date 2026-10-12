import { useMemo, useRef, useState, type PointerEvent } from 'react';
import { Button, ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import { useRecordedData } from '../../regressionData';
import './LeastSquaresGeometryPage.css';

const sigma = 2;
const blue = '#367de8', selectedBlue = '#27446e', teal = '#009eaa';
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
function Formula({ latex }: { latex: string }) { return <MathFormulaBlock appearance="plain"><MathFormulaStatic latex={latex} /></MathFormulaBlock>; }
function Step({ number, title }: { number: number; title: string }) { return <div className="rl-likelihood-heading"><span className="rl-likelihood-number"><Typography variant="h3" tone="accent">{number}</Typography></span><Typography variant="h3" tone="accent">{title}</Typography></div>; }
export function LeastSquaresGeometryPage() {
  const data = useRecordedData();
  const plot = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(.8);
  const [sampleIndex, setSampleIndex] = useState(4);
  const model = useMemo(() => {
    const n = data.length || 1;
    const mx = data.reduce((s,p)=>s+p.mass,0)/n, my = data.reduce((s,p)=>s+p.depth,0)/n;
    const xx = data.reduce((s,p)=>s+(p.mass-mx)**2,0);
    const w = xx ? data.reduce((s,p)=>s+(p.mass-mx)*(p.depth-my),0)/xx : .016;
    const b = my-w*mx;
    const sumX2 = data.reduce((s,p)=>s+p.mass**2,0);
    const width = sumX2 > 0 ? sigma/Math.sqrt(sumX2)*1000 : 1;
    const lo = w*1000-4*width, hi=w*1000+4*width;
    const ymin = Math.min(-4,b+lo/1000*1600,...data.map(p=>p.depth-2));
    const ymax = Math.max(40,b+hi/1000*1600,...data.map(p=>p.depth+2));
    const minimum = data.reduce((s,p)=>s+(p.depth-w*p.mass-b)**2,0);
    return { w, b, lo, hi, width, ymin, ymax, minimum, sumX2 };
  }, [data]);
  // A fixed-b slice through the full maximum makes the parameter axis unambiguous.
  const scaledW = clamp(model.w*1000+offset*model.width,model.lo,model.hi);
  const w = scaledW/1000, b=model.b;
  const selected = Math.min(sampleIndex,Math.max(0,data.length-1));
  const sample = data[selected] ?? {mass:0,depth:0};
  const relative = Math.exp(-.5*((scaledW-model.w*1000)/model.width)**2);
  const changeW = (value: number) => setOffset((clamp(value,model.lo,model.hi)-model.w*1000)/model.width);
  const yPercent = (y: number) => 18+(model.ymax-y)/(model.ymax-model.ymin)*52;
  const singleChart = useMemo(() => ({
    animation:false, grid:{left:'16%',right:'6%',top:'18%',bottom:'30%'},
    tooltip:{trigger:'item'},
    xAxis:{type:'value',min:0,max:1600,interval:500,name:'累计石重（千克）',nameLocation:'middle',nameGap:28,nameTextStyle:{fontSize:21,color:'#27446e'},axisLabel:{fontSize:18,showMaxLabel:false,hideOverlap:true},splitLine:{show:false}},
    yAxis:{type:'value',min:model.ymin,max:model.ymax,splitNumber:3,name:'下沉深度（厘米）',nameTextStyle:{fontSize:21,color:'#27446e',align:'left'},axisLabel:{fontSize:18},splitLine:{show:false}},
    series:[
      {type:'line',symbol:'none',data:[[0,b],[1600,w*1600+b]],lineStyle:{color:blue,width:3.5},silent:true},
      {type:'line',symbol:'none',connectNulls:false,data:[sample].flatMap(p=>[[p.mass,p.depth],[p.mass,w*p.mass+b],[null,null]]),lineStyle:{color:selectedBlue,width:2.5,type:'dashed'},silent:true},
      {type:'scatter',data:data.map((p,i)=>({value:[p.mass,p.depth],itemStyle:{color:i===selected?selectedBlue:blue}})),symbolSize:14,tooltip:{formatter:(item:{value:number[]})=>`${item.value[0]} 千克 · ${item.value[1].toFixed(1)} 厘米`}},
      {type:'scatter',data:[[sample.mass,sample.depth]],symbolSize:30,itemStyle:{color:'rgba(39,68,110,.15)'},silent:true},
    ],
  }),[data,selected,w,model]);
  const likelihoodChart = useMemo(() => {
    const xs=Array.from({length:401},(_,i)=>model.lo+(model.hi-model.lo)*i/400);
    const joint = (slope: number) => Math.exp(-model.sumX2*(slope/1000-model.w)**2/(2*sigma*sigma));
    return { animation:false, grid:{left:70,right:26,top:34,bottom:66},
      tooltip:{trigger:'item'},
      xAxis:{type:'value',min:model.lo,max:model.hi,splitNumber:4,name:'斜率 1000w（截距 b 固定）',nameLocation:'middle',nameGap:38,nameTextStyle:{fontSize:20,color:'#27446e'},axisLabel:{fontSize:18,formatter:(v:number)=>v.toFixed(1),showMinLabel:false,showMaxLabel:false,hideOverlap:true},splitLine:{show:false}},
      yAxis:{type:'value',min:0,max:1.16,name:'相对似然',nameTextStyle:{fontSize:20,color:'#27446e'},axisLabel:{fontSize:17},splitLine:{show:false}},
      series:[
        ...data.map((p,i)=>({name:`第${i+1}条观测的贡献`,type:'line',symbol:'none',data:xs.map(x=>[x,Math.exp(-((p.depth-x/1000*p.mass-model.b)**2)/(2*sigma*sigma))]),lineStyle:{color:i===selected?selectedBlue:'#a9cfff',width:i===selected?3:1.1,opacity:i===selected?1:.35,type:i===selected?'dashed':'solid'},z:i===selected?3:1,silent:true})),
        {name:'整组观测的总似然',type:'line',symbol:'none',data:xs.map(x=>[x,joint(x)]),lineStyle:{color:blue,width:4.5},z:4,areaStyle:{color:'rgba(54,125,232,.08)'},silent:true,
          markLine:{symbol:'none',silent:true,lineStyle:{color:teal,type:'dashed'},label:{show:false},data:[{xAxis:model.w*1000}]}},
        {name:'最大似然',type:'scatter',data:[[model.w*1000,1]],symbolSize:16,itemStyle:{color:teal,borderColor:'#fff',borderWidth:2},label:{show:true,position:'top',formatter:'最大似然',fontSize:22,color:teal},silent:true},
      ] };
  }, [data,model,selected]);
  // Keep the curves fixed while moving only the current candidate marker.
  const currentChart = useMemo(()=>({...likelihoodChart,series:[...likelihoodChart.series,
    {name:'当前参数',type:'line',symbol:'none',data:[[scaledW,0],[scaledW,relative]],lineStyle:{color:selectedBlue,width:1.3,type:'dashed'},silent:true},
    {name:'当前总似然',type:'scatter',data:[[scaledW,relative]],symbolSize:14,itemStyle:{color:selectedBlue,borderWidth:2,borderColor:'#fff'},silent:true},
  ]}),[likelihoodChart,scaledW,relative]);
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    if(!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect=plot.current?.getBoundingClientRect();if(!rect)return;
    const y=model.ymax-((event.clientY-rect.top)/rect.height-.18)/.52*(model.ymax-model.ymin);
    changeW((y-b)/1600*1000);
  };
  if(!data.length) return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页的实验记录，比较单点贡献与整组似然。" />;
  return <ContentBlock headingLevel={1} title="为什么最小二乘合理？" subtitle="每个观测点都有一个贡献，最优直线由整组观测的联合似然决定。" className="rl-likelihood-page">
    <div className="rl-likelihood-layout">
      <section className="rl-likelihood-single">
        <Step number={1} title="先看单个误差" />
        <div className="rl-likelihood-line-plot" ref={plot}>
          <EChartsChart option={singleChart} minHeight={0} className="rl-likelihood-chart" aria-label="一个观测点的残差示范：拖动端点调整候选直线" />
          {data.map((point,index)=><Button key={index} className="rl-likelihood-observation" aria-label={`选择第${index+1}条观测`} aria-pressed={index===selected} style={{left:`${16+point.mass/1600*78}%`,top:`${yPercent(point.depth)}%`}} onClick={()=>setSampleIndex(index)}> </Button>)}
          <div className="rl-likelihood-error-label" style={{left:`${16+sample.mass/1600*78+2}%`,top:`${yPercent((sample.depth+w*sample.mass+b)/2)}%`}}><Formula latex="e_i" /></div>
          <Button className="rl-likelihood-handle" aria-label="拖动调整斜率" style={{left:'94%',top:`${yPercent(w*1600+b)}%`}} onPointerDown={e=>e.currentTarget.setPointerCapture(e.pointerId)} onPointerMove={move} onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}} onKeyDown={e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();changeW(scaledW+(e.key==='ArrowUp'?1:-1)*model.width*.1);}}}> </Button>
        </div>
        <div className="rl-likelihood-single-caption"><Typography variant="bodySmall" tone="muted">点击观测点，查看它在右侧的贡献。</Typography></div>
      </section>
      <section className="rl-likelihood-all" data-relative-likelihood={relative} data-count={data.length} data-selected-index={selected}>
        <Step number={2} title="所有点的贡献相乘" />
        <div className="rl-likelihood-curve-wrap"><EChartsChart option={currentChart} minHeight={0} className="rl-likelihood-chart" aria-label="参数轴上的单点贡献曲线与全部观测的联合似然曲线" /><div className="rl-likelihood-curve-label"><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="L(w,b)=\prod_i p(e_i)" tooltip="全部观测独立时，密度贡献相乘形成联合似然。图中单点曲线与总似然各按自身峰值归一化，便于比较位置；不要按显示高度直接相乘。截距固定在最小二乘截距，仅改变斜率；因此下方曲线是参数空间的一维截面。" /></MathFormulaBlock></div></div>
      </section>
      <div className="rl-likelihood-footer"><Typography variant="h3" tone="accent" align="center">让所有点的贡献相乘，寻找使乘积最大的参数。</Typography><Formula latex="\textstyle\text{独立同方差高斯噪声、方差固定：}\quad \max L(w,b)\ \Longleftrightarrow\ \min\sum_i(y_i-\hat y_i)^2" /></div>
    </div>
  </ContentBlock>;
}

