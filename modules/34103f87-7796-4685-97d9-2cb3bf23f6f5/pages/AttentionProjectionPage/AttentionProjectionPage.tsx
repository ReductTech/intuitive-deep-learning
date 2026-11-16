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
    <div shuku-edit-id="e-974a7c58-ec6d-453c-bea6-3ac2e0efc30b" className={'attn-score-vector is-' + kind}>
      <Typography shuku-edit-id="e-6927f12b-0d35-463f-b70c-8282ceef4d28" variant="h3">{label}</Typography>
      <div shuku-edit-id="e-a63d4343-7c2d-4f71-a33b-c1353fc4abde" className="attn-score-cells" data-score-vector={label} data-vector-dimension={length} aria-label={label + '，' + length + '维示意'}>
        {Array.from({ length }, (_, index) => (
          <i shuku-edit-id="e-818e68bd-c7f1-458f-bf01-2b8c8e7939e1" key={index}>
            <Typography shuku-edit-id="e-b8ee6a22-4636-4946-a92a-33c246aa8258" as="span" variant="bodySmall" tone="inherit">
              {values ? values[index] : <MathFormulaStatic className="attn-inline-math" latex={`${kind}_{${index + 1}}`}/>}
            </Typography>
          </i>
        ))}
      </div>
    </div>
  );
}
function Arrow() { return <svg shuku-edit-id="e-ae4daeeb-01ca-4f39-9846-0a32adae7c77" className="attn-score-arrow" viewBox="0 0 40 28" aria-hidden="true"><path shuku-edit-id="e-fcf5937f-d665-497b-a563-4b9dbb50e092" d="M20 1V23M13 16L20 23L27 16" fill="none" stroke="currentColor" strokeWidth="2.5"/></svg>; }
function MergeArrow() { return <svg shuku-edit-id="e-838b1f0b-dfbd-4d0b-8c96-058b5bf6cd64" className="attn-score-merge" viewBox="0 0 600 58" preserveAspectRatio="none" aria-hidden="true"><path shuku-edit-id="e-90845fda-be0e-4686-a510-55dca7679198" d="M145 2V18H300V50M455 2V18H300M292 42L300 50L308 42" fill="none" stroke="currentColor" strokeWidth="2.5"/></svg>; }
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
  return <ContentBlock shuku-edit-id="e-b3b28aef-c63b-43e6-b252-a1d1ea30452c" ref={root} headingLevel={1} title="匹配评分：点积与加性"
    subtitle="比较 Q 与 K 的两种评分方式。"
    className="attn-score-page" bodyClassName="attn-score-body" data-activity="C05"
    data-activity-complete={steps.explored} data-score-dot={steps.dot} data-score-step={steps.add}
    data-score-additive={additiveScore} data-capture-ready={mathReady} aria-busy={!mathReady}
    onKeyDown={event=>{if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))event.stopPropagation();}}>
    <div shuku-edit-id="e-cdf3218e-d1f0-4c1d-ba15-114a661b8e0a" className="attn-score-comparison">
      <section shuku-edit-id="e-c058a005-dec2-4aa7-8072-d601e9768fc7" className="attn-score-path" aria-label="点积评分流程">
        <div shuku-edit-id="e-e22f821c-a4d5-4600-af8c-4a951d8f5240" className="attn-score-heading"><Typography shuku-edit-id="e-783a11f4-eac5-4bd6-8fee-640db48e66b9" variant="h2">点积评分</Typography><Typography shuku-edit-id="e-1a16f4bf-b3d6-4b91-ac10-9d9d172d00f8" variant="bodySmall" tone="muted">Q、K 同维</Typography></div>
        <div shuku-edit-id="e-b6adf143-8336-4321-b914-dea2d1713473" className="attn-score-inputs"><Vector label="Q" length={3} kind="q"/><Vector label="K" length={3} kind="k"/></div>
        <MergeArrow/>
        <Button active={steps.dot} aria-pressed={steps.dot} onClick={()=>change('dot')} aria-label="查看点积评分"><Typography shuku-edit-id="e-841594e3-7bbb-432c-89a0-ed04dba75022" as="span" variant="body" tone="inherit">对应相乘 → 求和</Typography></Button>
        <div shuku-edit-id="e-712a13e5-4940-4774-9b88-26f40e55e6d4" className={'attn-score-detail'+(steps.dot?' is-shown':'')} aria-hidden={!steps.dot}>
          {formula('q_1k_1+q_2k_2+q_3k_3','对应元素相乘，再相加')}<Arrow/>
        </div>
        <div shuku-edit-id="e-1e6f1760-fea5-4c1d-a71b-96ca6e18d486" className="attn-score-output">{formula('s=\\boldsymbol q^{\\mathsf T}\\boldsymbol k','点积分数s等于q转置乘k')}</div>
      </section>
      <section shuku-edit-id="e-aad2b42b-fd26-4bf6-8fee-b4954b15c88b" className="attn-score-path" aria-label="加性评分流程">
        <div shuku-edit-id="e-7f12b0b3-9af6-4a9a-b597-d3dbdf3ce981" className="attn-score-heading"><Typography shuku-edit-id="e-e65b440a-fa54-4890-8c16-a01267432bef" variant="h2">加性评分</Typography><Typography shuku-edit-id="e-9ff63409-27c5-47f0-9435-4402a897d206" variant="bodySmall" tone="muted">Q、K → 映射到同维</Typography></div>
        <div shuku-edit-id="e-2777d01d-5fe8-424f-b8bd-4863230e01d9" className="attn-score-inputs"><Vector label="Q" length={2} kind="q" values={[1,2]}/><Vector label="K" length={3} kind="k" values={[0,1,2]}/></div>
        <div shuku-edit-id="e-b3f57156-e73c-4a9d-961f-bd9586a17185" className={'attn-score-mappings'+(steps.add>=1?' is-shown':'')} aria-hidden={steps.add<1}>
          <div shuku-edit-id="e-67eae0bf-1c3a-4c1e-a769-fdb751298289"><Typography shuku-edit-id="e-1771ac3c-fbbb-4fa5-b15c-e0f96d2aaafe" variant="bodySmall" tone="accent">A ↓</Typography>{formula('Aq=[1,0]','A将Q映射为1,0')}</div>
          <div shuku-edit-id="e-4d82f4ec-857e-4103-805f-ce28e62aee17"><Typography shuku-edit-id="e-846c9a6c-f048-4e6f-b7ff-885651a81b81" variant="bodySmall" className="attn-score-key-color">B ↓</Typography>{formula('Bk=[0,1]','B将K映射为0,1')}</div>
        </div>
        <Button active={steps.add===3} disabled={steps.add===3} onClick={()=>change('add')} aria-label={nextLabels[steps.add]} data-score-next><Typography shuku-edit-id="e-0cddce0b-02ba-46b4-8a25-24e2246d7101" as="span" variant="body" tone="inherit">{nextLabels[steps.add]}</Typography></Button>
        <div shuku-edit-id="e-4fcf7833-3aba-4d4a-9d7e-7472e7bf3604" className={'attn-score-detail'+(steps.add>=2?' is-shown':'')} aria-hidden={steps.add<2}>
          {formula('Aq+Bk=[1,1]','映射后相加得到1,1')}
          {formula('\\tanh([1,1])\\approx[0.762,0.762]','双曲正切得到约0.762,0.762')}
        </div>
        <div shuku-edit-id="e-bdf936c9-1545-4283-a77e-90d6f114fa62" className="attn-score-output">
          {formula(steps.add===3?'s=[1,-0.5]\\cdot[0.762,0.762]\\approx0.381':'s=\\boldsymbol u^{\\mathsf T}\\tanh(Aq+Bk)','加性评分：u读出一个标量分数')}
        </div>
      </section>
    </div>
    <footer shuku-edit-id="e-42474182-f689-467a-ade4-0397257bb902" className="attn-score-footer">
      <div shuku-edit-id="e-23a655cc-8b88-410f-a8b4-130a0cbf7091" className="attn-score-footer-top"><Typography shuku-edit-id="e-33cfe42d-b160-45df-9556-9d0bc43ad83b" variant="body" tone="accent">两种方法，都输出匹配分数。</Typography><Button onClick={()=>change('reset')}><Typography shuku-edit-id="e-ae8f3b1a-40ea-4a0f-9cd0-bf9c92982494" as="span" variant="bodySmall" tone="inherit">重看</Typography></Button></div>
      <div shuku-edit-id="e-ea518e39-e549-4a1f-9803-233a6160c693" className="attn-score-footer-notes"><Typography shuku-edit-id="e-f551bf84-d734-440a-8e3f-6656ab9a5246" variant="bodySmall" tone="muted">独立示例；A、B、u 为手设参数。</Typography><Typography shuku-edit-id="e-bff48e2b-359e-4eb8-873c-aa250c0d3130" variant="bodySmall" tone="muted">下一步：分数 → 权重。</Typography></div>
    </footer>
  </ContentBlock>;
}
