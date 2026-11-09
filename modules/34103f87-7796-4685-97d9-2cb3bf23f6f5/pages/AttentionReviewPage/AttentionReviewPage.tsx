import { ContentBlock, Typography } from "@shuku/course-style/react";
import { ChoiceButtons, LessonCheck, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { useRegressionPage as useAttentionPage } from '../../components/useRegressionPage';
import { CAMPUS_RECORD_TASKS } from '../../model/campusRecord';
import { ATTENTION_DATASET, attentionPrediction, REGRESSION_EXPLORATION_W } from '../../model/attentionRegression';
import { CourseMaterialImage } from '../../components/CourseMaterialImage';
import './AttentionReviewPage.css';
const trajectoryPreview = Array.from({length:51},(_,i)=>{const x=i/10;return (10+x*22)+','+(62-(attentionPrediction(x,ATTENTION_DATASET.train,REGRESSION_EXPLORATION_W)-2)*15);}).join(' ');
function MaterialPreview({kind}:{kind:'record'|'trajectory'|'bilingual'|'scene'}) {
 if(kind==='scene')return <div className="attn-review-material-preview"><CourseMaterialImage path="observation/passing-poster.png" alt="同一张体育馆传球场景示意"/></div>;
 if(kind==='bilingual')return <div className="attn-review-material-preview attn-review-bilingual-script">
  <Typography variant="bodySmall">The white team passes here.</Typography>
  <Typography variant="bodySmall" tone="accent">白衣队在这里传球。</Typography>
 </div>;
 return <svg className="attn-review-material-preview" viewBox="0 0 132 72" aria-hidden="true">
  {kind==='record'?<><rect x="8" y="5" width="115" height="62" rx="4" fill="var(--ui-bg-card)" stroke="var(--ui-border-strong)" strokeWidth="2"/><rect x="12" y="35" width="107" height="13" fill="var(--ui-accent-soft)"/><line x1="48" x2="48" y1="9" y2="63" stroke="var(--ui-border-strong)" strokeWidth="2"/>{[16,29,42,55].map(y=><g key={y}><circle cx="24" cy={y} r="3" fill="var(--ui-accent)"/><path d={'M58 '+y+' H108'} stroke="var(--ui-border-strong)" strokeWidth="3"/></g>)}</>
   :<><path d="M8 6 V65 H126" fill="none" stroke="var(--ui-border-strong)" strokeWidth="2"/>{ATTENTION_DATASET.train.filter((_,i)=>i%3===0).map((p,i)=><circle key={i} cx={10+p.x*22} cy={62-(p.y-2)*15} r="2.4" fill="var(--ui-accent-alt)"/>)}<polyline points={trajectoryPreview} fill="none" stroke="var(--ui-accent)" strokeWidth="3"/></>}
 </svg>;
}
const materials=[{kind:'record',label:'活动记录'},{kind:'trajectory',label:'位置轨迹'},{kind:'bilingual',label:'双语讲解'},{kind:'scene',label:'画面线索'}] as const;
interface State {stage:'roles'|'change';roles:boolean;change:boolean}
const valid=(v:unknown):v is State=>{if(!v||typeof v!=='object')return false;const s=v as State;return ['roles','change'].includes(s.stage)&&typeof s.roles==='boolean'&&typeof s.change==='boolean';};
const back=(id:string,label:string)=><a href={'/study?module=attention-mechanism&mode=ppt&page='+id} target="_blank" rel="noreferrer" data-review-target={id}>{label}</a>;
export function AttentionReviewPage(props:ActivityProps){
 const [state,setState]=useActivityState<State>('C33-campus-review',{stage:'roles',roles:false,change:false},valid);
 const done=state.roles&&state.change,{root,mathReady,canAct}=useAttentionPage(done,props);const changed=state.stage==='change',task=CAMPUS_RECORD_TASKS[changed?3:2];
 const finish=(key:'roles'|'change')=>{if(canAct())setState(s=>({...s,[key]:true}));};
 return <ContentBlock ref={root} headingLevel={1} title="回顾：把活动材料串成讲解" subtitle="把记录、轨迹、双语讲解和画面线索组织进短片。" className="attn-review-page" bodyClassName="attn-review-body" data-activity="C33" data-activity-complete={done} data-review-state={JSON.stringify(state)} data-review-task={task.id} data-capture-ready={mathReady} aria-busy={!mathReady}>
  <section className="attn-review-materials" aria-label="准备组织的四类素材">
   {materials.map(item => <figure className="attn-review-material" key={item.kind}>
    <MaterialPreview kind={item.kind}/>
    <Typography as="figcaption" variant="bodySmall" tone="accent" align="center">{item.label}</Typography>
   </figure>)}
  </section>
  <div className="attn-review-main"><div className="attn-review-scenario"><div><Typography variant="bodySmall" tone="muted">当前问题 Q</Typography><Typography variant="h3" tone="accent">{task.question}</Typography></div>
   <table className="attn-review-records" aria-label="固定的校园活动索引与内容"><thead><tr><th><Typography variant="bodySmall" tone="muted">匹配索引 K</Typography></th><th><Typography variant="bodySmall" tone="muted">读取内容 V</Typography></th></tr></thead><tbody>{CAMPUS_RECORD_TASKS.map(t=><tr key={t.id} data-review-record={t.id} className={t.id===task.id?'is-current':''} aria-current={t.id===task.id?'true':undefined}><td><Typography variant="bodySmall">{t.clue}</Typography></td><td><Typography variant="bodySmall">{t.content}</Typography></td></tr>)}</tbody></table>
   <Typography variant="bodySmall" tone="muted">手设权重：{task.clue} 0.7，其余 0.1。</Typography>
  </div><div className="attn-review-checks"><div className="attn-review-check-header">
    <ChoiceButtons label="回顾的两个问题" value={state.stage} onChange={v=>{if(canAct())setState(s=>({...s,stage:v as State['stage']}));}} options={[{value:'roles',label:'识别 Q/K/V'},{value:'change',label:'问题改变'}]}/>
    <Typography variant="bodySmall" tone={done?'success':'muted'}>{done?'已完成，可重新作答。':'已完成 '+(Number(state.roles)+Number(state.change))+' / 2 题。'}</Typography>
   </div>
   {changed?<LessonCheck id="C33-campus-change-v1" title="改问“录下了什么”，哪些量会变？" answer="query-weight" done={state.change} onDone={()=>finish('change')} correct="Q、权重和结果可变；固定 K、V 不变。" options={[
    {value:'query-weight',label:'查询、权重及读取结果可以改变'},
    {value:'all',label:'查询、全部索引与记录内容都必须改',wrongFeedback:<>改变问题不等于改写记录。{back('C26','回看 K/V 分工')}</>},
    {value:'fixed',label:'查询改变，读取权重必须保持不变',wrongFeedback:<>权重需要结合当前问题形成。{back('C03','回看不同问题的权重')}</>},
   ]}/>:<LessonCheck id="C33-campus-roles-v1" title="Q、K、V 分别对应什么？" answer="roles" done={state.roles} onDone={()=>finish('roles')} correct="Q 是问题，K 是索引，V 是内容。" options={[
    {value:'roles',label:'Q 问题 / K 索引 / V 内容'},
    {value:'reverse',label:'Q 内容 / K 问题 / V 索引',wrongFeedback:<>Q 表示当前要找什么。{back('C26','回看 Q/K/V 分工')}</>},
    {value:'answer',label:'Q 问题 / K 答案 / V 分数',wrongFeedback:<>K 用于匹配，V 提供汇聚内容。{back('C12','回看完整读取链')}</>},
   ]}/>}
  </div></div>
  <footer className="attn-review-footer"><Typography variant="body">材料就绪，小明继续制作讲解短片。</Typography><Typography variant="bodySmall" tone="muted">人类注意仅作类比，不证明人脑使用 Q/K/V。</Typography></footer>
 </ContentBlock>;
}
