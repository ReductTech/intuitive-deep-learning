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
 const lane=(training:boolean)=>{const id=training?'training':'inference';const seen=visited.includes(id);return <section shuku-edit-id="e-f78a88d1-2373-4960-9519-d9634b396159" className="attn-teacher-branch" data-teacher-lane={id}>
  <div shuku-edit-id="e-bb40fa1b-deb4-47a4-aeb4-1593af4786ed" className="attn-teacher-label"><Typography shuku-edit-id="e-630fba0e-6a9b-454b-b531-877a5f4ad5db" variant="h3" tone={training?'accent':'main'}>{training?'训练':'生成'}</Typography><Typography shuku-edit-id="e-0c81b1e2-2e51-4beb-8805-52c65932e780" variant="bodySmall" tone="muted">{training?'教师强制':'自由生成'}</Typography></div>
  <div shuku-edit-id="e-f572d2a1-13a6-4ee5-a8ea-3369897bb711" className="attn-teacher-prediction"><Typography shuku-edit-id="e-0dea0a3a-a9bf-49b0-a516-a56a2a66bb38" variant="bodySmall" tone="muted">假设首词输出</Typography><div shuku-edit-id="e-a89cbbae-451f-4fc6-ae99-4c464ee4195c" className="attn-teacher-speech"><Typography shuku-edit-id="e-f76f15a3-412b-4820-a116-53051785461a" variant="h2" className="attn-teacher-wrong">黑衣队</Typography></div></div>
  {training?<figure shuku-edit-id="e-b797bd02-22a2-4876-bd86-20af0fd97a6f" className="attn-teacher-manuscript" aria-label="训练的前词取自标准译文，不取自误译"><Typography shuku-edit-id="e-635faa1b-a4da-4f30-8cc1-f1c5a76295b2" as="figcaption" variant="bodySmall" tone="accent">标准译文</Typography><Typography shuku-edit-id="e-896d93b3-8d48-4195-9379-976b8011e6e6" variant="h3" tone="accent">白衣队</Typography><div shuku-edit-id="e-2c20383a-1943-41b8-b7fa-2eab664e1ee9" className="attn-teacher-paper-lines" aria-hidden="true"><i shuku-edit-id="e-3e925548-6082-473b-89f2-c5042524623f"/><i shuku-edit-id="e-35a8421b-74a9-4cfb-a65c-4b605649a83a"/><i shuku-edit-id="e-10b09869-0991-4b82-a54f-e9497275136a"/></div></figure>
    :<figure shuku-edit-id="e-7e6c4eea-0ab0-4b39-a9ef-7b6828e60051" className="attn-teacher-manuscript is-prediction" aria-label="生成的前词沿用上一步预测"><Typography shuku-edit-id="e-5602e325-ce32-4f0d-9b96-7c1c0e6c402c" as="figcaption" variant="bodySmall" tone="muted">上一步预测</Typography><Typography shuku-edit-id="e-69cd9abc-27f2-4911-b45d-99eac47cf6d1" variant="h3" className="attn-teacher-wrong">黑衣队</Typography><div shuku-edit-id="e-63953cb1-4b43-46c2-bc56-5f343afac2da" className="attn-teacher-paper-lines" aria-hidden="true"><i shuku-edit-id="e-aa3b9921-9f6b-4544-8497-f196fce9efcd"/><i shuku-edit-id="e-73e408ca-eef8-4fe3-b187-50cf6d5ad128"/><i shuku-edit-id="e-768a6ca0-a333-4adc-b87f-b33a966f2821"/></div></figure>}
  <Typography shuku-edit-id="e-0afeaf96-5b04-448c-80ef-7f0d8a769fea" variant="h2" tone="accent" align="center">→</Typography>
  <div shuku-edit-id="e-0ff12f01-eb14-43eb-b5e5-63eed2b80cbd" className="attn-teacher-step"><Typography shuku-edit-id="e-40f8b04f-5d64-46cf-8540-2bc39146d2fb" variant="bodySmall" tone="muted">下一步前词</Typography>
   <Button className="attn-teacher-input" active={seen} aria-pressed={seen} aria-label={training?'查看训练前词来源':'查看生成前词来源'} onClick={()=>{if(canAct())setVisited(v=>[...new Set([...v,id])]);}}><Typography shuku-edit-id="e-04c6339c-c3a0-4d3d-8cca-f9a76afbab49" as="span" variant="h2" tone="inherit">{training?'白衣队':'黑衣队'}</Typography></Button>
   <Typography shuku-edit-id="e-dbeabd72-e887-41cf-a7bc-489654f043e0" variant="bodySmall" tone={seen?'accent':'muted'} data-input-origin={seen?(training?'target':'prediction'):'pending'}>{seen?(training?'来自标准译文：白衣队':'来自上一步预测：黑衣队'):'点选查看来源'}</Typography>
  </div>
 </section>;};
 const train = TRANSLATION_TRAINING_SET[0];
 return <ContentBlock shuku-edit-id="e-5f0559da-998d-4c8e-a94b-04efce1cdf6c" ref={root} headingLevel={1} title="训练与生成：前词从哪里来"
  subtitle="训练与生成，前词来源怎样不同？"
  className="attn-teacher-page" bodyClassName="attn-teacher-body" data-activity="C21" data-activity-complete={done} data-teacher-visited={JSON.stringify(visited)} data-capture-ready={mathReady} aria-busy={!mathReady}>
  <div shuku-edit-id="e-79ccadf7-ca76-48e1-add5-8e1fe7ce9521" className="attn-teacher-example"><div shuku-edit-id="e-c8707fa9-7a84-4c99-993c-2fffe0357b2e"><Typography shuku-edit-id="e-3c26f372-2ad2-424c-b523-662eecf7235b" variant="bodySmall" tone="muted">同一份讲解稿</Typography><Typography shuku-edit-id="e-187a290f-1655-451a-b15d-1ba492ac9d27" variant="h3">{formatTranslationSource(train)}</Typography></div><div shuku-edit-id="e-617663c3-0e43-4923-a4be-0d68e2138ab5"><Typography shuku-edit-id="e-d92e61f1-4d1f-43d9-96ec-0136ea931699" variant="bodySmall" tone="accent">假设首词误译：白衣队 → 黑衣队。</Typography></div></div>
  {lane(true)}{lane(false)}
  <footer shuku-edit-id="e-b662411a-101a-4ec6-bdb4-f326bcb9f91d" className="attn-teacher-dataset">
   <section shuku-edit-id="e-f1cd1e75-23f6-4c33-9fae-98cd88bc5b6d" className="attn-teacher-data-lane">
    <Typography shuku-edit-id="e-e80f6c79-e9a6-4641-93de-61ac353d9c93" variant="h3" tone="accent">训练数据</Typography>
    <Typography shuku-edit-id="e-22626e1d-d571-4eb6-bf14-c6a94b7b21f2" variant="bodySmall" tone="muted">用来更新模型参数</Typography>
   </section>
   <section shuku-edit-id="e-240d7526-7d4e-4d5f-b3d1-e5bb8c2d2c9f" className="attn-teacher-data-lane">
    <Typography shuku-edit-id="e-ff12434d-98c6-4d4a-9022-dc0bf7590f48" variant="h3" tone="accent">验证数据</Typography>
    <Typography shuku-edit-id="e-4e2dc0a1-3a27-4259-8d52-644451287940" variant="bodySmall" tone="muted">用来检查翻译结果</Typography>
   </section>
  </footer>
 </ContentBlock>;
}
