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
  return <ContentBlock ref={root} title="Softmax：把分数变成权重" headingLevel={1}
    subtitle="四项分数，怎样变成读取比例？"
    className="attn-softmax-page" bodyClassName="attn-softmax-body" data-activity="C10"
    data-activity-complete={done} data-softmax-selected={selected} data-capture-ready={mathReady} aria-busy={!mathReady}
    onKeyDown={event=>{if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))event.stopPropagation();}}>
    <div className="attn-softmax-main">
      <Typography variant="bodySmall" tone="accent">Q：在哪里录制？ · 手设分数</Typography>
      <SemanticWeightTable {...calculation} selectedIndex={selected} onSelect={value=>{if(canAct())setSelected(value);}} showValues hideTotals/>
      <div className="attn-softmax-calculation" aria-label="归一化规则与所选记录的计算">
        <section><Typography variant="bodySmall" tone="muted">归一化规则</Typography>{formula('w_i=\\frac{e^{s_i}}{\\sum_{j=1}^{4}e^{s_j}}','注意力权重的归一化公式')}</section>
        <section><Typography variant="bodySmall" tone="accent">{item.value} · 读取比例</Typography>
          {formula('\\frac{'+calculation.exps[selected].toFixed(3)+'}{'+calculation.denominator.toFixed(3)+'}\\approx '+(calculation.weights[selected]*100).toFixed(1)+'\\%',item.value+'的指数值除以共同分母得到读取比例')}
        </section>
      </div>

    </div>
    <footer className="attn-softmax-footer">
      <LessonCheck id="C10-campus" title="权重有什么共同特征？" answer="distribution"
        correct="非负、总和为1，全部记录仍参与。" done={done} onDone={()=>{if(canAct())setDone(true);}}
        options={[{value:'distribution',label:'非负，且总和为 1'},{value:'winner',label:'只保留最高的一项',wrongFeedback:'其余三项仍大于0，并没有被丢弃。'},{value:'scores',label:'等于原来的分数',wrongFeedback:'地点分数为2.4，读取比例约为0.703。'}]}/>
    </footer>
  </ContentBlock>;
}
