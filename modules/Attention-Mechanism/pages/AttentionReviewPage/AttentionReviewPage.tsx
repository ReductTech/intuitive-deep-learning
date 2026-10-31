import { Typography } from '../../../shared/react';
import { AttentionActivity, ChoiceButtons, Formula, LessonCheck, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import './AttentionReviewPage.css';

export function AttentionReviewPage(props:ActivityProps){
 const [stage,setStage]=useActivityState('C33-review-stage','roles');
 const [roles,setRoles]=useActivityState('C33-review-roles',false);
 const [change,setChange]=useActivityState('C33-review-change',false);
 const spicy=stage==='change';
 return <AttentionActivity {...props} number={33} title="回顾：换个任务识别注意力" done={roles&&change} footerHeight={164}
  learningFlow={<Typography variant="bodySmall" tone="muted">小明找午餐：候选店铺与菜单固定，按当前口味读取信息。</Typography>}
  footer={<div className="attn-review-footer"><div className="attn-review-methods"><Typography variant="bodySmall">点积：与键比较相似度</Typography><Typography variant="bodySmall">距离：与键比较位置</Typography><Typography variant="bodySmall">可变形示例：查询直接预测权重</Typography></div><Formula label="共同的读取过程" latex={String.raw`Q\to \alpha,\qquad c=\sum_i\alpha_iV_i`}/></div>}>
  <div className="attn-review-main"><div className="attn-review-scenario">
   <Typography variant="h2" tone="accent">{spicy?'现在想吃辣的':'想找清淡的午餐'}</Typography>
   <div className="attn-review-records" role="table" aria-label="固定的店铺索引与菜单">
    <div role="row"><Typography variant="bodySmall" tone="muted">店铺</Typography><Typography variant="bodySmall" tone="muted">匹配索引</Typography><Typography variant="bodySmall" tone="muted">读取内容</Typography></div>
    {[['甲店','清淡','蔬菜汤'],['乙店','香辣','麻婆豆腐'],['丙店','甜口','南瓜粥']].map(row=><div role="row" key={row[0]}>{row.map((value,i)=><Typography key={i} variant="h3" tone={i===1?'accent':i===2?'success':'main'}>{value}</Typography>)}</div>)}
   </div>
   <Typography variant="bodySmall" tone="muted">权重表示读取份额，不是分类概率，也不保证推荐一定正确。</Typography>
  </div><div className="attn-review-checks">
   <ChoiceButtons label="回顾与迁移的两个问题" value={stage} onChange={setStage} options={[{value:'roles',label:'识别 Q/K/V'},{value:'change',label:'需求改变'}]}/>
   {spicy?<LessonCheck id="C33-change" title="只改变口味需求，哪些量会随之改变？" answer="query-weight" done={change} onDone={()=>setChange(true)} correct="查询改变，权重和汇聚结果可以改变；店铺索引与菜单保持不变。" options={[
    {value:'query-weight',label:'查询、权重及汇聚结果可以改变'},
    {value:'all',label:'查询、所有店铺索引与菜单都要改',wrongFeedback:<>改变需求不等于改写候选内容。<a href="/scenedeck/?deck=attention-mechanism&slide=C26">回看 K/V 分工</a></>},
    {value:'fixed',label:'查询改变，读取权重必须保持不变',wrongFeedback:<>权重需要结合当前需求形成。<a href="/scenedeck/?deck=attention-mechanism&slide=C03">回看不同问题的权重</a></>},
   ]}/>:<LessonCheck id="C33-roles" title="当前需求、匹配索引与读取内容，分别是什么？" answer="roles" done={roles} onDone={()=>setRoles(true)} correct="Q 是口味需求；K 是店铺口味索引；V 是菜单信息。再切换到“需求改变”。" options={[
    {value:'roles',label:'Q：口味需求；K：口味索引；V：菜单'},
    {value:'reverse',label:'Q：菜单；K：口味需求；V：店铺',wrongFeedback:<>Q 表示当前要找什么。<a href="/scenedeck/?deck=attention-mechanism&slide=C26">回看 Q/K/V 分工</a></>},
    {value:'answer',label:'Q：口味需求；K：标准答案；V：分数',wrongFeedback:<>键用于匹配，并非标准答案；值提供要汇聚的内容。<a href="/scenedeck/?deck=attention-mechanism&slide=C12">回看完整读取链</a></>},
   ]}/>} 
  </div></div>
 </AttentionActivity>;
}
