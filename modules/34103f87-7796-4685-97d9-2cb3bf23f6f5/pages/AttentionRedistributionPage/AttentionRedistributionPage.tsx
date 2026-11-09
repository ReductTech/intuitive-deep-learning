import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { ChoiceButtons, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { useAttentionLesson } from '../../model/AttentionLessonContext';
import { CAMPUS_RECORD_TASKS } from '../../model/campusRecord';
import { SEMANTIC_ITEMS, SEMANTIC_QUERIES, computeSemanticChain, type SemanticQueryId } from '../../model/semanticScoring';
import './AttentionRedistributionPage.css';
const formula=(latex:string,label:string)=><MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex}/></MathFormulaBlock>;
const row=(values:readonly number[],digits=1)=>'\\begin{bmatrix}'+values.map(v=>v.toFixed(digits)).join('&')+'\\end{bmatrix}';
const values=SEMANTIC_ITEMS.map((_,i)=>SEMANTIC_ITEMS.map((_,j)=>i===j?1:0));
const dimensions=CAMPUS_RECORD_TASKS.map(item=>item.clue);
export function AttentionRedistributionPage({onComplete,isComplete}:ActivityProps) {
 const [details,setDetails]=useState(false);
  const {qkv,dispatchQkv}=useAttentionLesson();
  const task=qkv.task;
  const [done,setDone]=useActivityState('C12-campus-full-explored',false);
  const [active,setActive]=useState(false);
  const [mathReady,setMathReady]=useState(false);
  const root=useRef<HTMLElement>(null);
  const data=computeSemanticChain(task);
  const activeDimension=data.query.findIndex(v=>v===1);
  const output=values[0].map((_,j)=>values.reduce((sum,v,i)=>sum+data.weights[i]*v[j],0));
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
  useEffect(()=>{if(active&&done&&!isComplete)onComplete();},[active,done,isComplete,onComplete]);
  const choose=(value:string)=>{
    if(!active||document.hidden||root.current?.closest('[aria-hidden="true"], [hidden]')||value===task)return;
    dispatchQkv({type:'select-task',task:value as SemanticQueryId});
    setDone(true);
  };
  return <ContentBlock ref={root} headingLevel={1} title="活动记录：注意力的完整计算"
    subtitle="四条记录，完成一次加权读取。"
    className="attn-full-page" bodyClassName="attn-full-body" data-activity="C12"
    data-activity-complete={done} data-full-task={task} data-full-result={JSON.stringify(output)}
    data-full-query={JSON.stringify(data.query)} data-capture-ready={mathReady} aria-busy={!mathReady}
    onKeyDown={event=>{if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))event.stopPropagation();}}>
    <div className="attn-full-query">
      <ChoiceButtons label="切换查询问题" options={Object.entries(SEMANTIC_QUERIES).map(([value,q])=>({value,label:q.label,ariaLabel:'切换到'+q.label}))} value={task} onChange={choose}/>
      <div className="attn-full-query-vector">{formula('\\boldsymbol q='+row(data.query,0),'当前问题向量，选择'+dimensions[activeDimension]+'线索')}</div>
    </div>
    <div className="attn-full-table" role="table" aria-label="Q与固定K和V的完整计算">
      <div className="attn-full-row attn-full-head" role="row">
        <Typography variant="bodySmall" tone="muted" role="columnheader">活动内容</Typography>
        <div role="columnheader"><Typography variant="bodySmall" tone="accent">K · 匹配索引</Typography>{details && <div className="attn-full-dimensions">{dimensions.map((label,i)=><Typography key={label} variant="bodySmall" tone={i===activeDimension?'accent':'muted'}>{label}</Typography>)}</div>}</div>
        <div role="columnheader"><Typography variant="bodySmall" tone="muted">缩放分数</Typography>{formula('s_i=\\frac{\\boldsymbol q^{\\mathsf T}\\boldsymbol k_i}{\\sqrt{4}}','点积分数除以根号4')}</div>
        <div role="columnheader"><Typography variant="bodySmall" tone="muted">读取比例</Typography>{formula('\\alpha_i=\\operatorname{softmax}(s)_i','缩放后通过softmax归一化')}</div>
        <Typography variant="bodySmall" tone="accent" role="columnheader">V · 内容向量</Typography>
      </div>
      {SEMANTIC_ITEMS.map((item,i)=><div className={'attn-full-row'+(i===data.bestIndex?' is-focused':'')} role="row" key={item.id}
        data-full-row={item.id} data-full-key={JSON.stringify(item.key)} data-full-value={JSON.stringify(values[i])}
        data-full-raw={data.rawScores[i]} data-full-score={data.scores[i]} data-full-weight={data.weights[i]}>
        <Typography role="cell" variant="body" className="attn-full-record">{item.value}</Typography>
        <div role="cell">{details ? formula(row(item.key),item.label+'索引向量') : <Typography variant="bodySmall">{item.label}</Typography>}</div>
        <div role="cell">{formula(data.rawScores[i].toFixed(1)+'\\div2='+data.scores[i].toFixed(2),item.label+'点积分数除以2')}</div>
        <div className="attn-full-weight" role="cell" aria-label={item.value+'读取比例'+(data.weights[i]*100).toFixed(1)+'%'}>
          <div className="attn-full-track" aria-hidden="true"><i style={{width:(data.weights[i]*100)+'%'}}/></div>
          <Typography variant="body" tone="accent">{(data.weights[i]*100).toFixed(1)}%</Typography>
        </div>
        <div role="cell">{formula(details ? row(values[i],0) : 'v_'+(i+1),item.value+'的手设内容基向量')}</div>
      </div>)}
    </div>
    <footer className="attn-full-footer">
      <div className="attn-full-output">
        <div><Typography variant="h3">加权结果</Typography><Typography variant="bodySmall" tone="muted">更关注「{SEMANTIC_QUERIES[task].answer}」，仍读取全部。</Typography></div>
        {formula('\\boldsymbol r=\\sum_{i=1}^{4}\\alpha_i\\boldsymbol v_i\\approx'+row(output,3),'结果等于四个内容向量按权重加权相加')}
      </div>
      <div className="attn-full-note"><Typography variant="bodySmall" tone="muted">手设向量；r 是混合结果，非预测词。</Typography><Button active={details} aria-expanded={details} data-action="toggle-vectors" onClick={()=>setDetails(v=>!v)}> {details ? '收起向量' : '展开向量'} </Button></div>
    </footer>
  </ContentBlock>;
}
