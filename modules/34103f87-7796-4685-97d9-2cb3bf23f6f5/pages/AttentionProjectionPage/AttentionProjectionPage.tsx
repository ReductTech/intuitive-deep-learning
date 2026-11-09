import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import './AttentionProjectionPage.css';

const formula = (latex: string, label: string) => <MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex}/></MathFormulaBlock>;
function Vector({ label, length, kind, values }: {
  label: string;
  length: number;
  kind: 'q' | 'k';
  values?: number[];
}) {
  return (
    <div className={'attn-score-vector is-' + kind}>
      <Typography variant="h3">{label}</Typography>
      <div className="attn-score-cells" data-score-vector={label} data-vector-dimension={length} aria-label={label + '，' + length + '维示意'}>
        {Array.from({ length }, (_, index) => (
          <i key={index}>
            <Typography as="span" variant="bodySmall" tone="inherit">
              {values ? values[index] : <MathFormulaStatic className="attn-inline-math" latex={`${kind}_{${index + 1}}`}/>}
            </Typography>
          </i>
        ))}
      </div>
    </div>
  );
}
function Arrow() { return <svg className="attn-score-arrow" viewBox="0 0 40 28" aria-hidden="true"><path d="M20 1V23M13 16L20 23L27 16" fill="none" stroke="currentColor" strokeWidth="2.5"/></svg>; }
function MergeArrow() { return <svg className="attn-score-merge" viewBox="0 0 600 58" preserveAspectRatio="none" aria-hidden="true"><path d="M145 2V18H300V50M455 2V18H300M292 42L300 50L308 42" fill="none" stroke="currentColor" strokeWidth="2.5"/></svg>; }
const activation = Math.tanh(1);
const additiveScore = activation - 0.5 * activation;
type ScoreSteps = { dot: boolean; add: number; explored: boolean };
const validSteps = (value: unknown): value is ScoreSteps => {
  if (!value || typeof value !== 'object') return false;
  const item=value as Partial<ScoreSteps>;
  return typeof item.dot==='boolean' && Number.isInteger(item.add) && Number(item.add)>=0 && Number(item.add)<=3 && typeof item.explored==='boolean';
};
export function AttentionProjectionPage({onComplete,isComplete}: ActivityProps) {
  const [steps,setSteps]=useActivityState<ScoreSteps>('C05-campus-score-steps',{dot:false,add:0,explored:false},validSteps);
  const [active,setActive]=useState(false);
  const [mathReady,setMathReady]=useState(false);
  const root=useRef<HTMLElement>(null);
  useEffect(()=>{
    let mounted=true;
    void customElements.whenDefined('math-field').then(()=>{if(mounted)setMathReady(true);});
    return()=>{mounted=false;};
  },[]);
  useLayoutEffect(()=>{
    const element=root.current;
    if(!element)return;
    const sync=()=>{
      const hidden=Boolean(element.closest('[aria-hidden="true"], [hidden]'));
      element.inert=hidden;setActive(!hidden&&!document.hidden);
    };
    const observer=new MutationObserver(sync);
    for(let ancestor:HTMLElement|null=element;ancestor;ancestor=ancestor.parentElement)observer.observe(ancestor,{attributes:true,attributeFilter:['aria-hidden','hidden']});
    document.addEventListener('visibilitychange',sync);sync();
    return()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync);};
  },[]);
  useEffect(()=>{if(active&&steps.explored&&!isComplete)onComplete();},[active,steps.explored,isComplete,onComplete]);
  const change=(kind:'dot'|'add'|'reset')=>{
    if(!active||document.hidden||root.current?.closest('[aria-hidden="true"], [hidden]'))return;
    setSteps(previous=>{
      const dot=kind==='reset'?false:kind==='dot'?true:previous.dot;
      const add=kind==='reset'?0:kind==='add'?Math.min(3,previous.add+1):previous.add;
      return {dot,add,explored:previous.explored||(dot&&add===3)};
    });
  };
  const nextLabels=['查看 A、B 映射','查看 tanh 组合','查看 u 读出','已展开全部步骤'];
  return <ContentBlock ref={root} headingLevel={1} title="匹配评分：点积与加性"
    subtitle="比较 Q 与 K 的两种评分方式。"
    className="attn-score-page" bodyClassName="attn-score-body" data-activity="C05"
    data-activity-complete={steps.explored} data-score-dot={steps.dot} data-score-step={steps.add}
    data-score-additive={additiveScore} data-capture-ready={mathReady} aria-busy={!mathReady}
    onKeyDown={event=>{if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))event.stopPropagation();}}>
    <div className="attn-score-comparison">
      <section className="attn-score-path" aria-label="点积评分流程">
        <div className="attn-score-heading"><Typography variant="h2">点积评分</Typography><Typography variant="bodySmall" tone="muted">Q、K 同维</Typography></div>
        <div className="attn-score-inputs"><Vector label="Q" length={3} kind="q"/><Vector label="K" length={3} kind="k"/></div>
        <MergeArrow/>
        <Button active={steps.dot} aria-pressed={steps.dot} onClick={()=>change('dot')} aria-label="查看点积评分"><Typography as="span" variant="body" tone="inherit">对应相乘 → 求和</Typography></Button>
        <div className={'attn-score-detail'+(steps.dot?' is-shown':'')} aria-hidden={!steps.dot}>
          {formula('q_1k_1+q_2k_2+q_3k_3','对应元素相乘，再相加')}<Arrow/>
        </div>
        <div className="attn-score-output">{formula('s=\\boldsymbol q^{\\mathsf T}\\boldsymbol k','点积分数s等于q转置乘k')}</div>
      </section>
      <section className="attn-score-path" aria-label="加性评分流程">
        <div className="attn-score-heading"><Typography variant="h2">加性评分</Typography><Typography variant="bodySmall" tone="muted">Q、K → 映射到同维</Typography></div>
        <div className="attn-score-inputs"><Vector label="Q" length={2} kind="q" values={[1,2]}/><Vector label="K" length={3} kind="k" values={[0,1,2]}/></div>
        <div className={'attn-score-mappings'+(steps.add>=1?' is-shown':'')} aria-hidden={steps.add<1}>
          <div><Typography variant="bodySmall" tone="accent">A ↓</Typography>{formula('Aq=[1,0]','A将Q映射为1,0')}</div>
          <div><Typography variant="bodySmall" className="attn-score-key-color">B ↓</Typography>{formula('Bk=[0,1]','B将K映射为0,1')}</div>
        </div>
        <Button active={steps.add===3} disabled={steps.add===3} onClick={()=>change('add')} aria-label={nextLabels[steps.add]} data-score-next><Typography as="span" variant="body" tone="inherit">{nextLabels[steps.add]}</Typography></Button>
        <div className={'attn-score-detail'+(steps.add>=2?' is-shown':'')} aria-hidden={steps.add<2}>
          {formula('Aq+Bk=[1,1]','映射后相加得到1,1')}
          {formula('\\tanh([1,1])\\approx[0.762,0.762]','双曲正切得到约0.762,0.762')}
        </div>
        <div className="attn-score-output">
          {formula(steps.add===3?'s=[1,-0.5]\\cdot[0.762,0.762]\\approx0.381':'s=\\boldsymbol u^{\\mathsf T}\\tanh(Aq+Bk)','加性评分：u读出一个标量分数')}
        </div>
      </section>
    </div>
    <footer className="attn-score-footer">
      <div className="attn-score-footer-top"><Typography variant="body" tone="accent">两种方法，都输出匹配分数。</Typography><Button onClick={()=>change('reset')}><Typography as="span" variant="bodySmall" tone="inherit">重看</Typography></Button></div>
      <div className="attn-score-footer-notes"><Typography variant="bodySmall" tone="muted">独立示例；A、B、u 为手设参数。</Typography><Typography variant="bodySmall" tone="muted">下一步：分数 → 权重。</Typography></div>
    </footer>
  </ContentBlock>;
}
