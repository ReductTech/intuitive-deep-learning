import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { ChoiceButtons, LessonCheck, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { computeScaledDot, type ScaledDotDimension } from '../../model/semanticScoring';
import './AttentionScalingPage.css';
const formula=(latex:string,label:string)=><MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex}/></MathFormulaBlock>;
export function AttentionScalingPage({onComplete,isComplete}:ActivityProps){
  const [dimension,setDimension]=useActivityState<ScaledDotDimension>('C11-campus-dimension',4,(v):v is ScaledDotDimension=>v===4||v===16||v===64);
  const [seen64,setSeen64]=useActivityState('C11-campus-seen64',false);
  const [done,setDone]=useActivityState('C11-campus-check',false);
  const [active,setActive]=useState(false);
  const [mathReady,setMathReady]=useState(false);
  const [chartReady,setChartReady]=useState(false);
  const root=useRef<HTMLElement>(null);
  const data=useMemo(()=>computeScaledDot(dimension),[dimension]);
  const option=useMemo(()=>{
    const css=getComputedStyle(document.documentElement);
    return {animation:false,grid:{left:78,right:20,top:24,bottom:42},
      xAxis:{type:'category',data:Array.from({length:8},(_,i)=>'K'+'₁₂₃₄₅₆₇₈'[i]),axisLabel:{fontSize:23},axisTick:{show:false}},
      yAxis:{type:'value',min:0,max:1,interval:.5,axisLabel:{fontSize:23,formatter:(v:number)=>(v*100)+'%'},splitLine:{lineStyle:{color:css.getPropertyValue('--ui-border').trim()}}},
      series:[{name:'未缩放',type:'bar',barMaxWidth:42,itemStyle:{color:css.getPropertyValue('--ui-accent-alt').trim()},data:data.rawWeights},
        {name:'缩放后',type:'bar',barMaxWidth:42,itemStyle:{color:css.getPropertyValue('--ui-accent').trim()},data:data.scaledWeights}]};
  },[data]);
  useEffect(()=>{
    let mounted=true;void customElements.whenDefined('math-field').then(()=>{if(mounted)setMathReady(true);});return()=>{mounted=false;};
  },[]);
  useLayoutEffect(()=>{
    const element=root.current;if(!element)return;
    const sync=()=>{const hidden=Boolean(element.closest('[aria-hidden="true"], [hidden]'));element.inert=hidden;setActive(!hidden&&!document.hidden);};
    const observer=new MutationObserver(sync);
    for(let ancestor:HTMLElement|null=element;ancestor;ancestor=ancestor.parentElement)observer.observe(ancestor,{attributes:true,attributeFilter:['aria-hidden','hidden']});
    document.addEventListener('visibilitychange',sync);sync();
    return()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync);};
  },[]);
  const complete=seen64&&done;
  useEffect(()=>{if(active&&complete&&!isComplete)onComplete();},[active,complete,isComplete,onComplete]);
  const canAct=()=>active&&!document.hidden&&!root.current?.closest('[aria-hidden="true"], [hidden]');
  return <ContentBlock shuku-edit-id="e-ad68f687-2081-47c0-8746-47fd5d8f1337" ref={root} headingLevel={1} title="缩放点积：控制分数尺度"
    subtitle="维数增大，读取比例会怎样？"
    className="attn-scaling-page" bodyClassName="attn-scaling-body" data-activity="C11"
    data-activity-complete={complete} data-scale-dimension={dimension} data-scale-seen64={seen64}
    data-scale-raw={JSON.stringify(data.rawWeights)} data-scale-scaled={JSON.stringify(data.scaledWeights)}
    data-capture-ready={mathReady&&chartReady} aria-busy={!mathReady||!chartReady}
    onKeyDown={event=>{if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))event.stopPropagation();}}>
    <Typography shuku-edit-id="e-1b508910-d581-4173-9c96-83dcb363405e" variant="bodySmall" tone="accent">8 个合成候选的尺度实验。</Typography>
    <div shuku-edit-id="e-72bfb12b-d0b5-4757-adc7-c83ea949d97a" className="attn-scaling-toolbar">
      <div shuku-edit-id="e-c552142c-b063-43e7-abca-2aa2bf6c039d" className="attn-scaling-dimensions"><Typography shuku-edit-id="e-609a9766-e821-4f44-92df-9e1409c5953d" variant="bodySmall" tone="muted">维数</Typography>{formula('d_k','键的维数')}
        <ChoiceButtons label="选择维数" options={[4,16,64].map(v=>({value:String(v),label:String(v),ariaLabel:'选择'+v+'维'}))} value={String(dimension)} onChange={v=>{if(!canAct())return;setDimension(Number(v) as ScaledDotDimension);if(v==='64')setSeen64(true);}}/>
      </div>
      <div shuku-edit-id="e-69291810-c057-42e5-a2ae-6de3ea556bc5" className="attn-scaling-legend" role="group" aria-label="读取比例柱图图例"><div shuku-edit-id="e-ca74cb46-3880-4968-8ad5-2de2ee17053b" className="attn-scaling-legend-item is-raw"><span shuku-edit-id="e-cbf817ae-f805-4b61-92a1-83d4e97c0a12" className="attn-scaling-legend-swatch" aria-hidden="true"/><Typography shuku-edit-id="e-a1481535-cdf1-43cb-85ef-ab1099aeb20f" variant="bodySmall">未缩放</Typography></div><div shuku-edit-id="e-8ab6ed1d-baba-4d67-b0c1-ea42ee2aac3a" className="attn-scaling-legend-item is-scaled"><span shuku-edit-id="e-6cbd4451-5d2b-44ab-a955-8be5e0d3c8f2" className="attn-scaling-legend-swatch" aria-hidden="true"/><Typography shuku-edit-id="e-35527e7d-26eb-4c77-895d-536e3902a39f" variant="bodySmall">缩放后</Typography></div></div>
    </div>
    <EChartsChart className="attn-scaling-chart" option={option} minHeight={0} onReady={chart=>setChartReady(Boolean(chart))} aria-label={'八个合成候选缩放前后读取比例，缩放系数'+data.scale}/>
    <div shuku-edit-id="e-22158194-232b-4b62-8e5e-433d2b73e8c9" className="attn-scaling-rule">
      {formula('\\frac{s}{\\sqrt{d_k}}\\;\\longrightarrow\\;\\operatorname{softmax}','先缩放分数，再归一化')}
      {formula('s_1:'+data.rawScores[0].toFixed(3)+'\\div'+data.scale+'\\approx'+data.scaledScores[0].toFixed(2),'第一个合成候选的缩放分数')}
    </div>
    <Typography shuku-edit-id="e-56f082b9-0b3a-462f-9828-931bc455530e" variant="bodySmall" tone="muted" className="attn-scaling-disclosure">合成分数随维数平方根放大；非训练结果。</Typography>
    <footer shuku-edit-id="e-896939fc-05ef-4d3d-8570-366a7ae66a20" className="attn-scaling-footer">
      {seen64?<LessonCheck id="C11-campus" title="缩放后发生了什么？"
        options={[{value:'order',label:'排序不变，分布更平缓'},{value:'sort',label:'最高权重换了候选',wrongFeedback:'两组最高权重都对应K1；缩放不改变分数排序。'},{value:'uniform',label:'所有权重完全相等',wrongFeedback:'缩放后的柱子仍有高低差异。'}]}
        answer="order" correct="排序不变，缓解过度集中；并非完全平均。" done={done} onDone={()=>{if(canAct())setDone(true);}}/>
        :<Typography shuku-edit-id="e-bbaf02b3-822f-4215-990e-034b345e63d2" variant="body" tone="muted">切换 64 维，比较读取比例。</Typography>}
    </footer>
  </ContentBlock>;
}
