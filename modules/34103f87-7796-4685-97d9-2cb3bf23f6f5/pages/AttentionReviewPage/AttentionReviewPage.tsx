import { ContentBlock, Typography } from "@shuku/course-style/react";
import { ChoiceButtons, LessonCheck, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { useRegressionPage as useAttentionPage } from '../../components/useRegressionPage';
import { CAMPUS_RECORD_TASKS } from '../../model/campusRecord';
import { ATTENTION_DATASET, attentionPrediction, REGRESSION_EXPLORATION_W } from '../../model/attentionRegression';
import { CourseMaterialImage } from '../../components/CourseMaterialImage';
import './AttentionReviewPage.css';
const trajectoryPreview = Array.from({length:51},(_,i)=>{const x=i/10;return (10+x*22)+','+(62-(attentionPrediction(x,ATTENTION_DATASET.train,REGRESSION_EXPLORATION_W)-2)*15);}).join(' ');
function MaterialPreview({kind}:{kind:'record'|'trajectory'|'bilingual'|'scene'}) {
 if(kind==='scene')return <div shuku-edit-id="e-80d93cc8-fae8-41cb-b8f1-a9db6b5b6703" className="attn-review-material-preview"><CourseMaterialImage path="observation/passing-poster.webp" alt="同一张体育馆传球场景示意"/></div>;
 if(kind==='bilingual')return <div shuku-edit-id="e-062b3ee0-f279-49f1-b1b3-9f7c864f8fbf" className="attn-review-material-preview attn-review-bilingual-script">
  <Typography shuku-edit-id="e-13fcca87-d867-4d85-baf4-595c6024ba0a" variant="bodySmall">The white team passes here.</Typography>
  <Typography shuku-edit-id="e-81cea437-3565-4014-aa3e-113244ab6b36" variant="bodySmall" tone="accent">白衣队在这里传球。</Typography>
 </div>;
 return <svg shuku-edit-id="e-e4c49b48-d571-46b2-9346-c75b6b23f378" className="attn-review-material-preview" viewBox="0 0 132 72" aria-hidden="true">
  {kind==='record'?<><rect shuku-edit-id="e-1acf4736-67f7-48e2-8d46-71aeb7305c20" x="8" y="5" width="115" height="62" rx="4" fill="var(--ui-bg-card)" stroke="var(--ui-border-strong)" strokeWidth="2"/><rect shuku-edit-id="e-2a84aead-3a77-420b-9a00-ca5aa4ca22d9" x="12" y="35" width="107" height="13" fill="var(--ui-accent-soft)"/><line shuku-edit-id="e-da6a7b75-cf81-4e14-b5e3-c6553c00135d" x1="48" x2="48" y1="9" y2="63" stroke="var(--ui-border-strong)" strokeWidth="2"/>{[16,29,42,55].map(y=><g shuku-edit-id="e-c8abad3c-2243-4306-a98f-dc48288bd263" key={y}><circle shuku-edit-id="e-135bd92b-c5fe-46e0-ac22-6dc5484a7c18" cx="24" cy={y} r="3" fill="var(--ui-accent)"/><path shuku-edit-id="e-a4bab337-80a4-4ffc-9e8d-9e93abdfd009" d={'M58 '+y+' H108'} stroke="var(--ui-border-strong)" strokeWidth="3"/></g>)}</>
   :<><path shuku-edit-id="e-4790b3b0-9e94-4391-8151-4a0d841b5fab" d="M8 6 V65 H126" fill="none" stroke="var(--ui-border-strong)" strokeWidth="2"/>{ATTENTION_DATASET.train.filter((_,i)=>i%3===0).map((p,i)=><circle shuku-edit-id="e-4408c9d7-2fa1-4796-9636-0b9410279f59" key={i} cx={10+p.x*22} cy={62-(p.y-2)*15} r="2.4" fill="var(--ui-accent-alt)"/>)}<polyline shuku-edit-id="e-606c6229-92b9-4e53-93a8-89a84430df3a" points={trajectoryPreview} fill="none" stroke="var(--ui-accent)" strokeWidth="3"/></>}
 </svg>;
}
const materials=[{kind:'record',label:'活动记录'},{kind:'trajectory',label:'位置轨迹'},{kind:'bilingual',label:'双语讲解'},{kind:'scene',label:'画面线索'}] as const;
interface State {stage:'roles'|'change';roles:boolean;change:boolean}
const valid=(v:unknown):v is State=>{if(!v||typeof v!=='object')return false;const s=v as State;return ['roles','change'].includes(s.stage)&&typeof s.roles==='boolean'&&typeof s.change==='boolean';};
const back=(id:string,label:string)=><a shuku-edit-id="e-e011af5d-fbe6-4609-9871-9fa4bfd194bc" href={'/study?module=attention-mechanism&mode=ppt&page='+id} target="_blank" rel="noreferrer" data-review-target={id}>{label}</a>;
export function AttentionReviewPage(props:ActivityProps){
 const [state,setState]=useActivityState<State>('C33-campus-review',{stage:'roles',roles:false,change:false},valid);
 const done=state.roles&&state.change,{root,mathReady,canAct}=useAttentionPage(done,props);const changed=state.stage==='change',task=CAMPUS_RECORD_TASKS[changed?3:2];
 const finish=(key:'roles'|'change')=>{if(canAct())setState(s=>({...s,[key]:true}));};
 return <ContentBlock shuku-edit-id="e-bbf10893-2611-4037-90ae-745d77ec4daa" ref={root} headingLevel={1} title="回顾：把活动材料串成讲解" subtitle="把记录、轨迹、双语讲解和画面线索组织进短片。" className="attn-review-page" bodyClassName="attn-review-body" data-activity="C33" data-activity-complete={done} data-review-state={JSON.stringify(state)} data-review-task={task.id} data-capture-ready={mathReady} aria-busy={!mathReady}>
  <section shuku-edit-id="e-20ae36ff-9476-4162-94a7-cdf0f16f8557" className="attn-review-materials" aria-label="准备组织的四类素材">
   {materials.map(item => <figure shuku-edit-id="e-7910ab82-01dd-4331-bb67-8f40658d83e2" className="attn-review-material" key={item.kind}>
    <MaterialPreview kind={item.kind}/>
    <Typography shuku-edit-id="e-158cff97-2b31-4dc1-a87e-faa633246ea3" as="figcaption" variant="bodySmall" tone="accent" align="center">{item.label}</Typography>
   </figure>)}
  </section>
  <div shuku-edit-id="e-f815dc8f-ddae-4c0f-b84a-dcfd49749836" className="attn-review-main"><div shuku-edit-id="e-779d42ce-a438-4b38-8c52-9bf60b28871e" className="attn-review-scenario"><div shuku-edit-id="e-c48a8b47-e2ca-41fa-a885-9c8ab5a08038"><Typography shuku-edit-id="e-b01e8225-4aec-4906-992e-2892971495ae" variant="bodySmall" tone="muted">当前问题 Q</Typography><Typography shuku-edit-id="e-1a94a297-f7ae-4c22-a7d4-c71acb001a8e" variant="h3" tone="accent">{task.question}</Typography></div>
   <table shuku-edit-id="e-af08b4fd-5fed-4147-a9c0-de4d8fc31877" className="attn-review-records" aria-label="固定的校园活动索引与内容"><thead shuku-edit-id="e-8219e4d7-59c6-428c-8ceb-63c3ffc2a7e7"><tr shuku-edit-id="e-2ba7a157-159e-432f-b10c-7a45bf40156b"><th shuku-edit-id="e-66bff83e-bc73-433d-a5cf-026af631225e"><Typography shuku-edit-id="e-09aef94b-c026-4827-9636-da99a336ad16" variant="bodySmall" tone="muted">匹配索引 K</Typography></th><th shuku-edit-id="e-e771aa75-705b-4742-8dd5-0b879547135a"><Typography shuku-edit-id="e-52e75304-bb0d-4257-adc0-00cd1f23ab70" variant="bodySmall" tone="muted">读取内容 V</Typography></th></tr></thead><tbody shuku-edit-id="e-2abda170-308c-4995-a74a-52a1e6cc0f05">{CAMPUS_RECORD_TASKS.map(t=><tr shuku-edit-id="e-6c533081-e9c7-468b-b8a3-d0332a76d87d" key={t.id} data-review-record={t.id} className={t.id===task.id?'is-current':''} aria-current={t.id===task.id?'true':undefined}><td shuku-edit-id="e-1366b56c-899d-4c93-a73a-0958cf68364e"><Typography shuku-edit-id="e-827424b8-6b64-4cc9-9274-73cf52daad26" variant="bodySmall">{t.clue}</Typography></td><td shuku-edit-id="e-d58932c8-a477-4c72-9008-e3eee36ec135"><Typography shuku-edit-id="e-804c6e81-1fe5-410c-8be3-e6cb59b6442b" variant="bodySmall">{t.content}</Typography></td></tr>)}</tbody></table>
   <Typography shuku-edit-id="e-7c364afa-e6bd-473e-b242-3b6c72cd03c9" variant="bodySmall" tone="muted">手设权重：{task.clue} 0.7，其余 0.1。</Typography>
  </div><div shuku-edit-id="e-d42a4df9-b336-49b4-aabe-3fe895a30a41" className="attn-review-checks"><div shuku-edit-id="e-9ac23a63-3be3-4c61-962c-e74892b72fe6" className="attn-review-check-header">
    <ChoiceButtons label="回顾的两个问题" value={state.stage} onChange={v=>{if(canAct())setState(s=>({...s,stage:v as State['stage']}));}} options={[{value:'roles',label:'识别 Q/K/V'},{value:'change',label:'问题改变'}]}/>
    <Typography shuku-edit-id="e-e54583ed-e3d9-455f-b6ff-92b9934d2d9e" variant="bodySmall" tone={done?'success':'muted'}>{done?'已完成，可重新作答。':'已完成 '+(Number(state.roles)+Number(state.change))+' / 2 题。'}</Typography>
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
  <footer shuku-edit-id="e-fdafb199-dcaa-4de1-b9e5-482608575f56" className="attn-review-footer"><Typography shuku-edit-id="e-d2f8bbf6-2b28-4518-962f-ecde866a119c" variant="body">材料就绪，小明继续制作讲解短片。</Typography><Typography shuku-edit-id="e-75b96cdd-5f14-4d5b-9f4f-a3b6c5fbc59a" variant="bodySmall" tone="muted">人类注意仅作类比，不证明人脑使用 Q/K/V。</Typography></footer>
 </ContentBlock>;
}
