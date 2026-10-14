import { useMemo, useRef, useState, type PointerEvent } from 'react';
import { Button, ContentBlock, PlotlyChart, type PlotlyTrace, type PlotlyLayout, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
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
  // Use the UI Kit's shared Plotly host and coordinate-chart visual conventions.
  const singleData = useMemo<PlotlyTrace[]>(()=>[
    {type:'scatter',mode:'lines',x:[0,1600],y:[b,w*1600+b],line:{color:blue,width:3.5},hoverinfo:'skip'},
    {type:'scatter',mode:'lines',x:[sample.mass,sample.mass],y:[sample.depth,w*sample.mass+b],line:{color:selectedBlue,width:2.5,dash:'dash'},hoverinfo:'skip'},
    {type:'scatter',mode:'markers',x:data.map(p=>p.mass),y:data.map(p=>p.depth),marker:{size:14,color:data.map((_,i)=>i===selected?selectedBlue:blue)},hovertemplate:'%{x:.0f} 千克 · %{y:.1f} 厘米<extra></extra>'},
    {type:'scatter',mode:'markers',x:[sample.mass],y:[sample.depth],marker:{size:30,color:'rgba(39,68,110,.15)'},hoverinfo:'skip'},
  ],[data,selected,sample,w,b]);
  const singleLayout=useMemo<PlotlyLayout>(()=>({
    paper_bgcolor:'#fbfdff',plot_bgcolor:'#fbfdff',margin:{l:0,r:0,t:0,b:0},showlegend:false,
    font:{family:'Inter, Segoe UI, sans-serif',color:selectedBlue,size:18},dragmode:false,
    xaxis:{domain:[.16,.94],range:[0,1600],fixedrange:true,title:{text:'累计石重（千克）',font:{size:21}},tickvals:[0,500,1000,1500],showgrid:true,gridcolor:'#e5edf7',zerolinecolor:'#68778f',linecolor:'#9fb0c8'},
    yaxis:{domain:[.3,.82],range:[model.ymin,model.ymax],fixedrange:true,title:{text:'下沉深度（厘米）',font:{size:21},standoff:8},showgrid:true,gridcolor:'#e5edf7',zerolinecolor:'#68778f',linecolor:'#9fb0c8'},
  }),[model.ymin,model.ymax]);
  const likelihoodData=useMemo<PlotlyTrace[]>(()=>{
    const xs=Array.from({length:601},(_,i)=>model.lo+(model.hi-model.lo)*i/600);
    return [
      ...data.map((p,i)=>({type:'scatter',mode:'lines',name:`第${i+1}条观测的贡献`,x:xs,y:xs.map(x=>Math.exp(-((p.depth-x/1000*p.mass-model.b)**2)/(2*sigma*sigma))),line:{color:i===selected?selectedBlue:'#a9cfff',width:i===selected?3:1.1,dash:i===selected?'dash':'solid'},opacity:i===selected?1:.35,hoverinfo:'skip'})),
      {type:'scatter',mode:'lines',name:'联合似然',x:xs,y:xs.map(x=>Math.exp(-model.sumX2*(x/1000-model.w)**2/(2*sigma*sigma))),line:{color:blue,width:4.5},fill:'tozeroy',fillcolor:'rgba(54,125,232,.08)',hoverinfo:'skip'},
      {type:'scatter',mode:'lines',x:[model.w*1000,model.w*1000],y:[0,1],line:{color:teal,width:1.2,dash:'dash'},hoverinfo:'skip'},
      {type:'scatter',mode:'lines',x:[scaledW,scaledW],y:[0,relative],line:{color:selectedBlue,width:1.3,dash:'dash'},hoverinfo:'skip'},
      {type:'scatter',mode:'markers',x:[scaledW],y:[relative],marker:{size:14,color:selectedBlue,line:{width:2,color:'#fff'}},hoverinfo:'skip'},
      {type:'scatter',mode:'markers+text',x:[model.w*1000],y:[1],text:['最大似然'],textposition:'top center',textfont:{size:22,color:teal},marker:{size:16,color:teal,line:{width:2,color:'#fff'}},hoverinfo:'skip'},
    ];
  },[data,model,selected,scaledW,relative]);
  const likelihoodLayout=useMemo<PlotlyLayout>(()=>({
    paper_bgcolor:'#fbfdff',plot_bgcolor:'#fbfdff',margin:{l:76,r:28,t:68,b:70},showlegend:false,dragmode:'pan',
    font:{family:'Inter, Segoe UI, sans-serif',color:selectedBlue,size:18},
    xaxis:{range:[model.lo,model.hi],title:{text:'斜率 1000w（截距 b 固定）',font:{size:20}},tickformat:'.1f',gridcolor:'#dfe6f1',zerolinecolor:'#68778f',linecolor:'#9fb0c8'},
    yaxis:{range:[0,1.16],title:{text:'相对似然',font:{size:20}},dtick:.2,gridcolor:'#dfe6f1',zerolinecolor:'#68778f',linecolor:'#9fb0c8'},
  }),[model.lo,model.hi]);
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    if(!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect=plot.current?.getBoundingClientRect();if(!rect)return;
    const y=model.ymax-((event.clientY-rect.top)/rect.height-.18)/.52*(model.ymax-model.ymin);
    changeW((y-b)/1600*1000);
  };
  if(!data.length) return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页的实验记录，比较单点贡献与整组似然。" />;
  return <ContentBlock headingLevel={1} title="概率视角下的最小二乘" subtitle="在独立同方差高斯噪声、方差固定的假设下，最小二乘等价于最大似然估计。" className="rl-likelihood-page">
    <div className="rl-likelihood-layout">
      <section className="rl-likelihood-single">
        <Step number={1} title="一个点，一份贡献" />
        <div className="rl-likelihood-line-plot" ref={plot}>
          <PlotlyChart data={singleData} layout={singleLayout} minHeight={0} className="rl-likelihood-chart" aria-label="一个观测点的残差示范：拖动端点调整候选直线" />
          {data.map((point,index)=><Button key={index} className="rl-likelihood-observation" aria-label={`选择第${index+1}条观测`} aria-pressed={index===selected} style={{left:`${16+point.mass/1600*78}%`,top:`${yPercent(point.depth)}%`}} onClick={()=>setSampleIndex(index)}> </Button>)}
          <div className="rl-likelihood-error-label" style={{left:`${16+sample.mass/1600*78+2}%`,top:`${yPercent((sample.depth+w*sample.mass+b)/2)}%`}}><Formula latex="e_i" /></div>
          <Button className="rl-likelihood-handle" aria-label="拖动调整斜率" style={{left:'94%',top:`${yPercent(w*1600+b)}%`}} onPointerDown={e=>e.currentTarget.setPointerCapture(e.pointerId)} onPointerMove={move} onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}} onKeyDown={e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();changeW(scaledW+(e.key==='ArrowUp'?1:-1)*model.width*.1);}}}> </Button>
        </div>
        <div className="rl-likelihood-single-caption"><Typography variant="bodySmall" tone="muted">点击一个点，高亮它的贡献曲线。</Typography></div>
      </section>
      <section className="rl-likelihood-all" data-relative-likelihood={relative} data-count={data.length} data-selected-index={selected}>
        <Step number={2} title="贡献连乘，寻找最大值" />
        <div className="rl-likelihood-curve-wrap"><PlotlyChart data={likelihoodData} layout={likelihoodLayout} minHeight={0} className="rl-likelihood-chart" aria-label="参数轴上的单点贡献曲线与全部观测的联合似然曲线" /><div className="rl-likelihood-curve-label"><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="L(w,b)=\prod_i p(e_i)" tooltip="全部观测独立时，密度贡献相乘形成联合似然。图中单点曲线与总似然各按自身峰值归一化，便于比较位置；不要按显示高度直接相乘。截距固定在最小二乘截距，仅改变斜率；因此下方曲线是参数空间的一维截面。" /></MathFormulaBlock></div></div>
      </section>
      <div className="rl-likelihood-footer"><Typography variant="h3" tone="accent" align="center">高斯噪声假设下，最小二乘就是最大似然估计。</Typography><Formula latex="\textstyle\text{独立同方差高斯噪声、方差固定：}\quad \max L(w,b)\ \Longleftrightarrow\ \min\sum_i(y_i-\hat y_i)^2" /></div>
    </div>
  </ContentBlock>;
}

