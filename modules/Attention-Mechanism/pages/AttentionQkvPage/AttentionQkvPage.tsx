import { MathFormulaStatic, Typography } from '../../../shared/react';
import { AttentionActivity, ChoiceButtons, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { useAttentionLesson } from '../../model/AttentionLessonContext';
import { QKV_TASKS } from '../../model/qkvRole';
import './AttentionQkvPage.css';
export function AttentionQkvPage(props: ActivityProps) {
  const {qkv,dispatchQkv}=useAttentionLesson();
  const [operated,setOperated]=useActivityState('C03-weight-explored',false);
  const current=QKV_TASKS.find(t=>t.id===qkv.task)??QKV_TASKS[2];
  return <AttentionActivity {...props} number={3} title="用权重表示关注程度" eyebrow="同一组内容 · 不同的读取权重" done={operated} footerHeight={154}
    footer={<div className="attn-weight-model-footer"><div><Typography variant="h3" tone="accent">问题变，V 不变，权重变。</Typography><Typography variant="bodySmall" tone="muted">权重结合问题 Q 与整组内容 V 得到。</Typography></div><Typography variant="h2" tone="accent"><MathFormulaStatic className="attn-inline-math" latex={String.raw`\boldsymbol{w}=f(\boldsymbol{q},V)`}/></Typography></div>}>
    <div className="attn-weight-model-main">
      <ChoiceButtons label="选择问题 Q" value={qkv.task} options={QKV_TASKS.map(t=>({value:t.id,label:t.question}))} onChange={v=>{dispatchQkv({type:'select-task',task:v as typeof qkv.task});setOperated(true);}}/>
      <div className="attn-weight-model-values" role="group" aria-label="所有内容保持不变，示意权重随问题改变">
        {QKV_TASKS.map((t,i)=><section key={t.id} className={t.id===current.id?'is-emphasized':''}>
          <Typography variant="bodySmall" tone="muted"><MathFormulaStatic className="attn-inline-math" latex={'v_'+(i+1)}/></Typography>
          <Typography variant="h2">{t.content}</Typography>
          <div className="attn-weight-model-track"><div style={{width:t.id===current.id?'70%':'10%'}}/></div>
          <Typography variant="bodySmall" tone={t.id===current.id?'accent':'muted'}><MathFormulaStatic className="attn-inline-math" latex={'w_'+(i+1)}/>{t.id===current.id?' · 读得更多':''}</Typography>
        </section>)}
      </div>
      <div className="attn-weight-model-result"><Typography variant="h2" tone="accent"><MathFormulaStatic className="attn-inline-math" latex={String.raw`\boldsymbol{r}=\sum_i w_i\boldsymbol{v}_i`}/></Typography><Typography variant="body">结果更突出「{current.content}」的信息。</Typography></div>
    </div>
  </AttentionActivity>;
}
