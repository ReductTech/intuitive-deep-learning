import { Button, MathFormulaStatic, Typography } from '../../../shared/react';
import { AttentionActivity, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { AttentionReadingFlow } from '../../components/AttentionReadingFlow';
import './AttentionProjectionPage.css';
const math = (latex: string) => <MathFormulaStatic className="attn-inline-math" latex={latex}/>;
function Vector({label, length, kind,values}: {label: string; length: number; kind: 'q'|'k';values?:number[]}) {
  return <div className={'attn-score-vector is-'+kind}><Typography variant="h3">{label}</Typography><div className="attn-score-cells" aria-label={label+'，'+length+'维示意'}>{Array.from({length},(_,i)=><i key={i}>{values&&<Typography as="span" variant="bodySmall" tone="inherit">{values[i]}</Typography>}</i>)}</div></div>;
}
function Arrow() { return <svg className="attn-score-arrow" viewBox="0 0 40 28" aria-hidden="true"><path d="M20 1V23M13 16L20 23L27 16" fill="none" stroke="currentColor" strokeWidth="2.5"/></svg>; }
function MergeArrow() { return <svg className="attn-score-merge" viewBox="0 0 600 58" preserveAspectRatio="none" aria-hidden="true"><path d="M145 2V18H300V50M455 2V18H300M292 42L300 50L308 42" fill="none" stroke="currentColor" strokeWidth="2.5"/></svg>; }
export function AttentionProjectionPage(props: ActivityProps) {
  const [dotShown,setDotShown]=useActivityState('C05-score-dot',false);
  const [addShown,setAddShown]=useActivityState('C05-score-add',false);
  const [finished,setFinished]=useActivityState('C05-space-complete',false);
  const reveal=(kind:'dot'|'add')=>{if(kind==='dot'){setDotShown(true);if(addShown)setFinished(true);}else{setAddShown(true);if(dotShown)setFinished(true);}};
  return <AttentionActivity {...props} number={5} title="匹配评分：点积与加性" learningFlow={<AttentionReadingFlow active="score"/>} eyebrow="同样输入 Q、K，都输出一个匹配分数" done={finished} footerHeight={112}
    footer={<div className="attn-score-footer"><div><Typography variant="h3" tone="accent">点积：表示已可比较，计算简洁、便于并行。</Typography><Typography variant="bodySmall" tone="muted">加性：A/B 映射到同维；tanh 非线性组合；u 读出一个分数。</Typography></div><Button onClick={()=>{setDotShown(false);setAddShown(false);}}><Typography as="span" variant="bodySmall" tone="inherit">重看</Typography></Button></div>}>
    <div className="attn-score-comparison">
      <section className="attn-score-path" aria-label="点积评分流程">
        <Typography variant="h2">点积评分</Typography>
        <Typography variant="bodySmall" tone="muted">Q、K 同维，表示可比较</Typography>
        <div className="attn-score-inputs"><Vector label="Q" length={3} kind="q"/><Vector label="K" length={3} kind="k"/></div>
        <MergeArrow/>
        <Button active={dotShown} aria-pressed={dotShown} onClick={()=>reveal('dot')} aria-label="查看点积评分"><Typography as="span" variant="h3" tone="inherit">对应相乘 → 求和</Typography></Button>
        <div className={'attn-score-detail'+(dotShown?' is-shown':'')}><Typography variant="bodySmall" tone="accent">{math(String.raw`q_1k_1+q_2k_2+q_3k_3`)}</Typography></div>
        <Arrow/>
        <div className="attn-score-output"><Typography variant="h3">匹配分数 s</Typography><Typography variant="h3" tone="accent">{math(String.raw`s=\boldsymbol q^{\mathsf T}\boldsymbol k`)}</Typography></div>
      </section>
      <section className="attn-score-path" aria-label="加性评分流程">
        <Typography variant="h2">加性评分</Typography>
        <Typography variant="bodySmall" tone="muted">Q 两维、K 三维 → 都映射到两维</Typography>
        <div className="attn-score-inputs"><Vector label="Q" length={2} kind="q" values={[1,2]}/><Vector label="K" length={3} kind="k" values={[0,1,2]}/></div>
        <div className="attn-score-mappings"><div><Arrow/><Typography variant="bodySmall">A：映射 Q</Typography><div className="attn-score-mapped is-q" aria-label="Q映射后的两维表示"><i/><i/></div></div><div><Arrow/><Typography variant="bodySmall">B：映射 K</Typography><div className="attn-score-mapped is-k" aria-label="K映射后的两维表示"><i/><i/></div></div></div>
        <Button active={addShown} aria-pressed={addShown} onClick={()=>reveal('add')} aria-label="查看加性评分"><Typography as="span" variant="h3" tone="inherit">映射后相加 → 非线性组合</Typography></Button>
        <div className={'attn-score-detail'+(addShown?' is-shown':'')}><div className="attn-score-example"><Typography variant="bodySmall" tone="accent">{math(String.raw`Aq=[1,0],\ Bk=[0,1]`)}</Typography><Typography variant="bodySmall" tone="muted">相加 [1,1] → tanh 得 [0.762,0.762]</Typography></div></div>
        <Arrow/>
        <div className="attn-score-output"><Typography variant="h3">匹配分数 s</Typography><Typography variant="h3" tone="accent">{math(addShown?String.raw`s=[1,-0.5]\cdot[0.762,0.762]\approx0.381`:String.raw`s=\boldsymbol u^{\mathsf T}\tanh(Aq+Bk)`)}</Typography></div>
      </section>
    </div>
  </AttentionActivity>;
}
