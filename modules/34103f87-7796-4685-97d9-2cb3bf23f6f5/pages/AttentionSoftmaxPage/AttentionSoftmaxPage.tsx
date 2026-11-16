import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { LessonCheck, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { SemanticWeightTable } from '../../components/SemanticWeightTable';
import { computeSemanticSoftmax, SEMANTIC_ITEMS } from '../../model/semanticScoring';
import './AttentionSoftmaxPage.css';
const formula=(latex:string,label:string)=><MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex}/></MathFormulaBlock>;
export function AttentionSoftmaxPage({onComplete,isComplete}:ActivityProps){
  const [done,setDone]=useActivityState('C10-campus-check',false);
  const [selected,setSelected]=useActivityState('C10-campus-inspect',2,(v):v is number=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<4);
  const [active,setActive]=useState(false);
  const [mathReady,setMathReady]=useState(false);
  const root=useRef<HTMLElement>(null);
  const calculation=computeSemanticSoftmax('where');
  const item=SEMANTIC_ITEMS[selected];
  useEffect(()=>{
    let mounted=true;
    void customElements.whenDefined('math-field').then(()=>{if(mounted)setMathReady(true);});
    return()=>{mounted=false;};
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
  const canAct=()=>active&&!document.hidden&&!root.current?.closest('[aria-hidden="true"], [hidden]');
  return <ContentBlock shuku-edit-id="e-9a955623-ab2d-4695-8ebc-d75d241db426" ref={root} title="Softmax：把分数变成权重" headingLevel={1}
    subtitle="四项分数，怎样变成读取比例？"
    className="attn-softmax-page" bodyClassName="attn-softmax-body" data-activity="C10"
    data-activity-complete={done} data-softmax-selected={selected} data-capture-ready={mathReady} aria-busy={!mathReady}
    onKeyDown={event=>{if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))event.stopPropagation();}}>
    <div shuku-edit-id="e-36de93a0-393f-4c56-90d6-5c1e1a3b65f0" className="attn-softmax-main">
      <Typography shuku-edit-id="e-ba0637d0-a3ef-4a0a-8b4d-a48e2ceca9f0" variant="bodySmall" tone="accent">Q：在哪里录制？ · 手设分数</Typography>
      <SemanticWeightTable {...calculation} selectedIndex={selected} onSelect={value=>{if(canAct())setSelected(value);}} showValues hideTotals/>
      <div shuku-edit-id="e-a3055b2a-410e-4f61-adef-cd3657d3c0b5" className="attn-softmax-calculation" aria-label="归一化规则与所选记录的计算">
        <section shuku-edit-id="e-fce1d872-afb6-43de-80f2-f7eb96523d67"><Typography shuku-edit-id="e-ae0899af-ea0b-4b10-a6bc-92df35201471" variant="bodySmall" tone="muted">归一化规则</Typography>{formula('w_i=\\frac{e^{s_i}}{\\sum_{j=1}^{4}e^{s_j}}','注意力权重的归一化公式')}</section>
        <section shuku-edit-id="e-aade868a-79ab-44a9-a139-03823338503a"><Typography shuku-edit-id="e-3b34c799-3653-4e27-b02a-53ce45ce05fb" variant="bodySmall" tone="accent">{item.value} · 读取比例</Typography>
          {formula('\\frac{'+calculation.exps[selected].toFixed(3)+'}{'+calculation.denominator.toFixed(3)+'}\\approx '+(calculation.weights[selected]*100).toFixed(1)+'\\%',item.value+'的指数值除以共同分母得到读取比例')}
        </section>
      </div>

    </div>
    <footer shuku-edit-id="e-be8c3060-b2fb-4683-b93c-9488a0155a7d" className="attn-softmax-footer">
      <LessonCheck id="C10-campus" title="权重有什么共同特征？" answer="distribution"
        correct="非负、总和为1，全部记录仍参与。" done={done} onDone={()=>{if(canAct())setDone(true);}}
        options={[{value:'distribution',label:'非负，且总和为 1'},{value:'winner',label:'只保留最高的一项',wrongFeedback:'其余三项仍大于0，并没有被丢弃。'},{value:'scores',label:'等于原来的分数',wrongFeedback:'地点分数为2.4，读取比例约为0.703。'}]}/>
    </footer>
  </ContentBlock>;
}
