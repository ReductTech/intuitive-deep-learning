import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { useRegressionPage as useAttentionPage } from '../../components/useRegressionPage';
import { TRANSLATION_TRAINING_SET } from '../../model/attentionTranslationExperiment';
import { formatTranslationSource } from '../../model/translationDisplay';
import './AttentionTeacherForcingPage.css';
const valid=(v:unknown):v is string[]=>Array.isArray(v)&&v.length<=2&&new Set(v).size===v.length&&v.every(x=>x==='training'||x==='inference');
export function AttentionTeacherForcingPage(props:ActivityProps){
 const [visited,setVisited]=useActivityState<string[]>('C21-campus-input-sources',[],valid);
 const done=visited.includes('training')&&visited.includes('inference');
 const {root,mathReady,canAct}=useAttentionPage(done,props);
 const lane=(training:boolean)=>{const id=training?'training':'inference';const seen=visited.includes(id);return <section className="attn-teacher-branch" data-teacher-lane={id}>
  <div className="attn-teacher-label"><Typography variant="h3" tone={training?'accent':'main'}>{training?'训练':'生成'}</Typography><Typography variant="bodySmall" tone="muted">{training?'教师强制':'自由生成'}</Typography></div>
  <div className="attn-teacher-prediction"><Typography variant="bodySmall" tone="muted">假设首词输出</Typography><div className="attn-teacher-speech"><Typography variant="h2" className="attn-teacher-wrong">黑衣队</Typography></div></div>
  {training?<figure className="attn-teacher-manuscript" aria-label="训练的前词取自标准译文，不取自误译"><Typography as="figcaption" variant="bodySmall" tone="accent">标准译文</Typography><Typography variant="h3" tone="accent">白衣队</Typography><div className="attn-teacher-paper-lines" aria-hidden="true"><i/><i/><i/></div></figure>
    :<figure className="attn-teacher-manuscript is-prediction" aria-label="生成的前词沿用上一步预测"><Typography as="figcaption" variant="bodySmall" tone="muted">上一步预测</Typography><Typography variant="h3" className="attn-teacher-wrong">黑衣队</Typography><div className="attn-teacher-paper-lines" aria-hidden="true"><i/><i/><i/></div></figure>}
  <Typography variant="h2" tone="accent" align="center">→</Typography>
  <div className="attn-teacher-step"><Typography variant="bodySmall" tone="muted">下一步前词</Typography>
   <Button className="attn-teacher-input" active={seen} aria-pressed={seen} aria-label={training?'查看训练前词来源':'查看生成前词来源'} onClick={()=>{if(canAct())setVisited(v=>[...new Set([...v,id])]);}}><Typography as="span" variant="h2" tone="inherit">{training?'白衣队':'黑衣队'}</Typography></Button>
   <Typography variant="bodySmall" tone={seen?'accent':'muted'} data-input-origin={seen?(training?'target':'prediction'):'pending'}>{seen?(training?'来自标准译文：白衣队':'来自上一步预测：黑衣队'):'点选查看来源'}</Typography>
  </div>
 </section>;};
 const train = TRANSLATION_TRAINING_SET[0];
 return <ContentBlock ref={root} headingLevel={1} title="训练与生成：前词从哪里来"
  subtitle="训练与生成，前词来源怎样不同？"
  className="attn-teacher-page" bodyClassName="attn-teacher-body" data-activity="C21" data-activity-complete={done} data-teacher-visited={JSON.stringify(visited)} data-capture-ready={mathReady} aria-busy={!mathReady}>
  <div className="attn-teacher-example"><div><Typography variant="bodySmall" tone="muted">同一份讲解稿</Typography><Typography variant="h3">{formatTranslationSource(train)}</Typography></div><div><Typography variant="bodySmall" tone="accent">假设首词误译：白衣队 → 黑衣队。</Typography></div></div>
  {lane(true)}{lane(false)}
  <footer className="attn-teacher-dataset">
   <section className="attn-teacher-data-lane">
    <Typography variant="h3" tone="accent">训练数据</Typography>
    <Typography variant="bodySmall" tone="muted">用来更新模型参数</Typography>
   </section>
   <section className="attn-teacher-data-lane">
    <Typography variant="h3" tone="accent">验证数据</Typography>
    <Typography variant="bodySmall" tone="muted">用来检查翻译结果</Typography>
   </section>
  </footer>
 </ContentBlock>;
}
