import { useRecordedData, examplePrediction } from '../../regressionData';
import { useEffect, useState } from 'react';
import { AttentionHint, Switch, ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import '../MaePage/MaePage.css';
import { SquaredErrorPlot } from './SquaredErrorPlot';
const orange='#ed7047', blue='#427ee0', teal='#168c97';
const signed=(e:number)=>`${e>0?'+':''}${e.toFixed(1)}`;
function barOption(errors:number[],absolute:boolean) {
  return { animation:true, animationDurationUpdate:650, animationEasingUpdate:'cubicInOut', grid:{left:52,right:22,top:22,bottom:absolute?30:32},
    xAxis:{type:'category',data:errors.map((_,i)=>String(i+1)),axisLabel:{fontSize:19,color:'#526582'},axisLine:{onZero:false},axisTick:{show:false}},
    yAxis:{type:'value',min:absolute?0:-Math.max(8,Math.ceil(Math.max(...errors.map(Math.abs))/2)*2),max:absolute?Math.max(44,Math.ceil(Math.max(...errors.map(e=>e*e))/20)*20):Math.max(8,Math.ceil(Math.max(...errors.map(Math.abs))/2)*2),interval:absolute?20:2,axisLabel:{show:true,fontSize:20,color:'#526582',formatter:(v:number)=>absolute?String(v):[-6,0,6].includes(v)?String(v):''},splitLine:{show:false}},
    series:[{type:'bar',barMaxWidth:34,data:errors.map(e=>({value:absolute?e*e:e,itemStyle:{color:absolute||e>0?orange:blue},label:{position:absolute||e>0?'top':'bottom',formatter:absolute?(e*e).toFixed(1):signed(e),color:absolute||e>0?orange:blue}})),label:{show:true,fontSize:20,distance:4},markLine:absolute?undefined:{silent:true,symbol:'none',label:{show:false},lineStyle:{color:'#718098',type:'solid'},data:[{yAxis:0}]}}] };
}
export function MsePage(){
 const data = useRecordedData();
 const errors = data.map(p=>p.depth-examplePrediction(p.mass));
 const total = errors.reduce((sum,e)=>sum+e*e,0);
 const residualSum = errors.reduce((sum,e)=>sum+e,0);
 const n = errors.length;
 const [error,setError]=useState(-3);
 const [transformed,setTransformed]=useState(false);
 const [hintActive,setHintActive]=useState(true);
 useEffect(()=>{if(!hintActive)return;const timer=window.setInterval(()=>setTransformed(value=>!value),5000);return()=>window.clearInterval(timer);},[hintActive]);
 if(!n)return <ContentBlock title="请先完成称象记录" subtitle="本页使用第一页投石时实际记录的数据。" />;
 return <ContentBlock headingLevel={1} title="均方误差（MSE）" subtitle="先对每个残差平方，再求平均，使较大误差具有更高的损失。" className="rl-mae-page">
  <div className="rl-mae-layout">
   <div className="rl-mae-steps">{[['1','计算残差','e_i=y_i-\\hat y_i'],['2','平方','e_i^2=(y_i-\\hat y_i)^2'],['3','求平均','\\mathrm{MSE}=\\frac{1}{n}\\sum_{i=1}^{n}e_i^2']].map(([n,t,f])=><div className="rl-mae-step" key={n}><span className="rl-mae-step-number"><Typography variant="h3" tone="inherit">{n}</Typography></span><Typography variant="h3" tone="accent">{t}</Typography><MathFormulaBlock appearance="plain"><MathFormulaStatic latex={f}/></MathFormulaBlock></div>)}</div>
   <section className="rl-mae-function"><div className="rl-mae-panel-heading"><Typography variant="h3" tone="accent">平方损失函数</Typography><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="\ell(e)=e^2"/></MathFormulaBlock></div><Typography variant="bodySmall" tone="accent" className="rl-mae-explanation">残差越大，平方后的损失增长越快。</Typography><SquaredErrorPlot error={error} onChange={setError}/></section>
   <section className="rl-mae-samples rl-loss-single-chart"><div className="rl-loss-chart-header"><Typography variant="body" tone="accent">{transformed ? '平方误差（平方厘米）' : '原始残差（厘米）'}</Typography><AttentionHint className="rl-loss-mode-switch" onPointerEnter={()=>setHintActive(false)} onFocus={()=>setHintActive(false)} onClick={()=>setHintActive(false)}><Typography variant="bodySmall" tone="accent">原始</Typography><Switch label={<Typography variant="bodySmall" tone="accent">MSE</Typography>} aria-label="原始与MSE切换" checked={transformed} onChange={event=>{setHintActive(false);setTransformed(event.target.checked);}} /></AttentionHint></div><EChartsChart className="rl-mae-chart" option={barOption(errors,transformed)} minHeight={0} aria-label={transformed ? '本次实验样本转换后的误差' : '本次实验样本的正负残差'}/><div className="rl-mae-result"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex={transformed ? `\\mathrm{MSE}\\approx\\frac{${total.toFixed(1)}}{${n}}\\approx${(total/n).toFixed(1)}\\;\\mathrm{cm}^{2}` : `\\sum_{i=1}^{${n}}e_i=${residualSum.toFixed(1)}\\;\\mathrm{cm}`}/></MathFormulaBlock></div></section>
   <div className="rl-mae-takeaway"><Typography variant="body" tone="accent">MSE 的单位是观测值单位的平方，不能直接与 MAE 比较数值大小。</Typography></div>
  </div>
 </ContentBlock>;
}


