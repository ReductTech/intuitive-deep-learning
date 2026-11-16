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
  return <ContentBlock shuku-edit-id="e-a5783013-64ea-4e26-89ff-32c54412eefa" ref={root} headingLevel={1} title="活动记录：注意力的完整计算"
    subtitle="四条记录，完成一次加权读取。"
    className="attn-full-page" bodyClassName="attn-full-body" data-activity="C12"
    data-activity-complete={done} data-full-task={task} data-full-result={JSON.stringify(output)}
    data-full-query={JSON.stringify(data.query)} data-capture-ready={mathReady} aria-busy={!mathReady}
    onKeyDown={event=>{if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))event.stopPropagation();}}>
    <div shuku-edit-id="e-8d22d00c-9867-4483-8e07-0395b55202c8" className="attn-full-query">
      <ChoiceButtons label="切换查询问题" options={Object.entries(SEMANTIC_QUERIES).map(([value,q])=>({value,label:q.label,ariaLabel:'切换到'+q.label}))} value={task} onChange={choose}/>
      <div shuku-edit-id="e-e87f9eef-f268-4654-8216-236f5df3f315" className="attn-full-query-vector">{formula('\\boldsymbol q='+row(data.query,0),'当前问题向量，选择'+dimensions[activeDimension]+'线索')}</div>
    </div>
    <div shuku-edit-id="e-9ecb2c54-42c4-453b-9461-89d05f571014" className="attn-full-table" role="table" aria-label="Q与固定K和V的完整计算">
      <div shuku-edit-id="e-b074049f-8d9a-4a2f-b755-75ee4f066f9d" className="attn-full-row attn-full-head" role="row">
        <Typography shuku-edit-id="e-c9472dd4-7cc0-45d6-a928-bfa582e93d22" variant="bodySmall" tone="muted" role="columnheader">活动内容</Typography>
        <div shuku-edit-id="e-f737f3a5-0565-4d1b-a3d7-d74a2e27ae89" role="columnheader"><Typography shuku-edit-id="e-f238f821-1efb-45cd-bf67-82f51b194051" variant="bodySmall" tone="accent">K · 匹配索引</Typography>{details && <div shuku-edit-id="e-20eb0b76-1e36-406a-b977-908a9999c727" className="attn-full-dimensions">{dimensions.map((label,i)=><Typography shuku-edit-id="e-490f1d07-0b38-4c02-bdb0-abf2063d58b3" key={label} variant="bodySmall" tone={i===activeDimension?'accent':'muted'}>{label}</Typography>)}</div>}</div>
        <div shuku-edit-id="e-a99d403f-c50b-4ee4-bdf1-d89ffaadc2dd" role="columnheader"><Typography shuku-edit-id="e-68bfa68e-1784-4e87-ad8d-f0a079490958" variant="bodySmall" tone="muted">缩放分数</Typography>{formula('s_i=\\frac{\\boldsymbol q^{\\mathsf T}\\boldsymbol k_i}{\\sqrt{4}}','点积分数除以根号4')}</div>
        <div shuku-edit-id="e-4a6c1109-3ec1-4d91-9664-88a43a65a937" role="columnheader"><Typography shuku-edit-id="e-6ac625c4-93c5-4e31-a7b6-e8188a2f58d0" variant="bodySmall" tone="muted">读取比例</Typography>{formula('\\alpha_i=\\operatorname{softmax}(s)_i','缩放后通过softmax归一化')}</div>
        <Typography shuku-edit-id="e-3781c96f-856d-4fcd-bf09-f06898bdbf4e" variant="bodySmall" tone="accent" role="columnheader">V · 内容向量</Typography>
      </div>
      {SEMANTIC_ITEMS.map((item,i)=><div shuku-edit-id="e-e00188da-12bb-4e9b-9ff3-f7c99fa29383" className={'attn-full-row'+(i===data.bestIndex?' is-focused':'')} role="row" key={item.id}
        data-full-row={item.id} data-full-key={JSON.stringify(item.key)} data-full-value={JSON.stringify(values[i])}
        data-full-raw={data.rawScores[i]} data-full-score={data.scores[i]} data-full-weight={data.weights[i]}>
        <Typography shuku-edit-id="e-0f249ed3-7ebc-4bb4-b6ee-23ccb8b22559" role="cell" variant="body" className="attn-full-record">{item.value}</Typography>
        <div shuku-edit-id="e-c6066968-f381-4dea-9b9c-df09b8332b66" role="cell">{details ? formula(row(item.key),item.label+'索引向量') : <Typography shuku-edit-id="e-c2e8752f-5d17-43d8-a43a-4fc11970883a" variant="bodySmall">{item.label}</Typography>}</div>
        <div shuku-edit-id="e-c0df6136-316d-497b-86f6-85433c4213d1" role="cell">{formula(data.rawScores[i].toFixed(1)+'\\div2='+data.scores[i].toFixed(2),item.label+'点积分数除以2')}</div>
        <div shuku-edit-id="e-a7c16d3a-3a98-4597-b89d-e02341e52c82" className="attn-full-weight" role="cell" aria-label={item.value+'读取比例'+(data.weights[i]*100).toFixed(1)+'%'}>
          <div shuku-edit-id="e-8717b92e-ff08-4efc-8abc-49b199ef76a6" className="attn-full-track" aria-hidden="true"><i shuku-edit-id="e-cd977074-18d7-4248-acfb-a9276ac6036f" style={{width:(data.weights[i]*100)+'%'}}/></div>
          <Typography shuku-edit-id="e-3fb8984b-0faf-4fb4-9334-92b5d2994385" variant="body" tone="accent">{(data.weights[i]*100).toFixed(1)}%</Typography>
        </div>
        <div shuku-edit-id="e-de368941-88aa-4168-9860-c3301b259ed7" role="cell">{formula(details ? row(values[i],0) : 'v_'+(i+1),item.value+'的手设内容基向量')}</div>
      </div>)}
    </div>
    <footer shuku-edit-id="e-d290388d-7e76-45bf-bf73-f0a521b200de" className="attn-full-footer">
      <div shuku-edit-id="e-ca1afa18-89ff-4b41-9295-2604dc98b366" className="attn-full-output">
        <div shuku-edit-id="e-ccead8eb-8364-4ebd-85d3-4a52210a03d1"><Typography shuku-edit-id="e-8fc3de15-6283-478b-b462-68c3ea2a4a7f" variant="h3">加权结果</Typography><Typography shuku-edit-id="e-0da8a7cf-329c-4138-867d-fdb603d1a318" variant="bodySmall" tone="muted">更关注「{SEMANTIC_QUERIES[task].answer}」，仍读取全部。</Typography></div>
        {formula('\\boldsymbol r=\\sum_{i=1}^{4}\\alpha_i\\boldsymbol v_i\\approx'+row(output,3),'结果等于四个内容向量按权重加权相加')}
      </div>
      <div shuku-edit-id="e-21c2b47b-9a17-4eac-8de4-87eec2fc39c4" className="attn-full-note"><Typography shuku-edit-id="e-0653b35c-23f9-4b7c-aa8b-34fc5d0dd6e3" variant="bodySmall" tone="muted">手设向量；r 是混合结果，非预测词。</Typography><Button active={details} aria-expanded={details} data-action="toggle-vectors" onClick={()=>setDetails(v=>!v)}> {details ? '收起向量' : '展开向量'} </Button></div>
    </footer>
  </ContentBlock>;
}
