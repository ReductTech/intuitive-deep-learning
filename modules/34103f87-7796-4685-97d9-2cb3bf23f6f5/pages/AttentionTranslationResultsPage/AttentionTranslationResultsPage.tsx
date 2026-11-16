import { useMemo } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import { ChoiceButtons, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { useRegressionPage as useAttentionPage } from '../../components/useRegressionPage';
import { TranslationCheckpointTimeline } from '../../components/TranslationExperimentControls';
import { useTranslationExperiment } from '../../model/TranslationExperimentContext';
import { inspectTranslationTeacherForcedStep, TRANSLATION_MAX_EPOCHS } from '../../model/attentionTranslationExperiment';
import { getTranslationDisplay, displayTranslationToken } from '../../model/translationDisplay';
import { CourseMaterialImage } from '../../components/CourseMaterialImage';
import './AttentionTranslationResultsPage.css';

export function AttentionTranslationResultsPage(props: ActivityProps) {
  const e = useTranslationExperiment();
  const [selectedHere,setSelectedHere]=useActivityState('C25-campus-trained-target',false);
  const complete=e.state.epoch >= TRANSLATION_MAX_EPOCHS && selectedHere;
  const {root,mathReady,canAct}=useAttentionPage(complete,props);
  const shown = getTranslationDisplay(e.displayState, 'V4');
  const step = useMemo(() => inspectTranslationTeacherForcedStep(e.displayState, shown.example, e.row), [e.displayState, shown.example, e.row]);
  const initial = useMemo(() => inspectTranslationTeacherForcedStep(e.initialState, shown.example, e.row), [e.initialState, shown.example, e.row]);
  const sourceTokens = shown.example.sourceTokens.slice(0, shown.example.sourceValidLength);
  const displayLabel = e.reviewState ? '回看' : '当前';
  const canInteract = canAct;
  const generatedText = shown.greedyText || (shown.greedyStatus === '直接EOS' ? '直接结束' : '无有效译文');

  return <ContentBlock shuku-edit-id="e-6066405e-de6c-44e9-9c28-da17f820de9e" ref={root} headingLevel={1} title="留出讲解句：再检查一次翻译"
    subtitle="同词表留出句，未参与训练。"
    className="attn-trans-result-page" bodyClassName="attn-trans-result-body" data-activity="C25" data-activity-complete={complete} data-capture-ready={mathReady} aria-busy={!mathReady}>
    <div shuku-edit-id="e-dcbfad2c-b521-4af3-81e0-bd28c798cae4" className="attn-trans-result-layout">
    <div shuku-edit-id="e-eb30b59d-e64a-433f-94f5-9fddae1bf8e0" className="attn-trans-result-main" data-translation-epoch={e.state.epoch}
      data-display-epoch={e.displayState.epoch} data-result-view="V4" data-result-row={e.row} data-greedy-exact={shown.greedyExact}>
      <div shuku-edit-id="e-f6de806f-0617-4c57-a766-0b2123311709" className="attn-trans-result-sentence">
        <div shuku-edit-id="e-04f20493-29c2-479c-b424-f8a7d779deb4"><Typography shuku-edit-id="e-132f077f-bb1d-4be3-a084-8c2fc4ffafd3" variant="bodySmall" tone="muted">讲解句 V4</Typography><Typography shuku-edit-id="e-f14ca92c-5dc4-4c1c-9c3e-4b4a58886358" variant="body">{shown.sourceText}</Typography></div>
        <div shuku-edit-id="e-b99bce3e-3c14-4263-a46a-d2950c4f4a1f"><Typography shuku-edit-id="e-4d37ea49-5ba2-4299-b2bd-123a0a8f065a" variant="bodySmall" tone="muted">目标译文</Typography><Typography shuku-edit-id="e-4c130f64-8548-4287-8442-469806277b7f" variant="h3" tone="accent">{shown.targetText}</Typography></div>
        <div shuku-edit-id="e-e7e47288-46ff-49d1-931d-9a597cf27f6f" className="attn-trans-result-free"><Typography shuku-edit-id="e-adfd938d-aac7-4141-9c94-c58b489522b0" variant="bodySmall" tone="muted">自由生成译文{shown.greedyTruncated ? ' · 长度上限' : ''}</Typography><Typography shuku-edit-id="e-99938e05-e5f7-4194-ac53-500addd4d4cd" variant="body" tone={shown.greedyExact ? 'success' : 'warning'}>{generatedText}</Typography></div>
      </div>
      <section shuku-edit-id="e-2a05cbf8-401c-487b-93bc-79abc9de3a46" className="attn-trans-result-comparison" aria-label={`目标词“${displayTranslationToken(step.target)}”的ATT，两排使用相同色深比例`}>
        {[{id:'initial',label:'未训练',epoch:0,weights:initial.paddedWeights},{id:'current',label:displayLabel,epoch:e.displayState.epoch,weights:step.paddedWeights}].map(entry=><div shuku-edit-id="e-e75cc20b-61c8-4d74-b594-20965c7cf2de" className="attn-trans-result-token-row" key={entry.id} data-att-stage={entry.id}>
          <div shuku-edit-id="e-98d8ea61-c30a-4eaa-85c4-3f33dd3e38a3" className="attn-trans-result-row-label"><Typography shuku-edit-id="e-729d1bc0-b2f2-43e3-ae0e-98a9bdb50b02" variant="h3" tone={entry.id==='initial'?'muted':'accent'}>{entry.label}</Typography><Typography shuku-edit-id="e-30d9618b-2c76-4462-b6b1-165aed6c2e76" variant="bodySmall" tone="muted">第 {entry.epoch} 轮</Typography></div>
          <div shuku-edit-id="e-d8c95bc7-ce24-4679-ac6d-511049504b8b" className="attn-trans-result-tokens" style={{gridTemplateColumns:`repeat(${sourceTokens.length},minmax(0,1fr))`}}>
            {sourceTokens.map((token,index)=>{const weight=entry.weights[index];const rounded=entry.weights.slice(0,sourceTokens.length).map(w=>Number(w.toFixed(2)));const max=Math.max(...rounded);const top=entry.id==='current'&&rounded.filter(w=>w===max).length===1&&rounded[index]===max;return <div shuku-edit-id="e-46e76de0-1ff5-45ae-a2ec-48949bec1bf5" key={index} className={'attn-trans-result-token'+(top?' is-top':'')}
              style={{backgroundColor:`color-mix(in srgb, var(--attn-activation) ${(0.06+weight*0.88)*100}%, var(--ui-bg-card))`,color:weight>=.46?'var(--ui-bg-card)':'var(--ui-text-main)'}}
              data-source-index={index} data-attention={weight} role="img" aria-label={entry.label+'，'+token+'，ATT '+(weight*100).toFixed(1)+'%'} title={(weight*100).toFixed(1)+'%'}>
              <Typography shuku-edit-id="e-85737f28-1a52-453e-b0a4-4a4168e21a6c" variant="h3" tone="inherit" align="center">{token}</Typography><Typography shuku-edit-id="e-eb773125-8170-4b04-928f-83fb98e92c69" variant="bodySmall" tone="inherit" align="center">{(weight*100).toFixed(1)}%</Typography>
            </div>;})}
          </div>
        </div>)}
      </section>
      <Typography shuku-edit-id="e-39441da2-2dd5-4b7d-8856-b2dd66228538" variant="bodySmall" tone="accent">{e.state.epoch < TRANSLATION_MAX_EPOCHS ? '先完成训练，再检查留出句。' : e.displayState.epoch!==TRANSLATION_MAX_EPOCHS ? '在第 150 轮点选目标词，完成检查。' : shown.greedyExact ? '本句译对；比例已舍入，不保证逐词对齐。' : '本句未译对；权重变化不保证译对。'}</Typography>
    </div>
    <figure shuku-edit-id="e-8bbce74e-09dd-4145-a944-415bd7fab133" className="attn-trans-result-scene">
      <Typography shuku-edit-id="e-c300aafe-3dad-4acd-925a-3719448948f8" as="figcaption" variant="h3" tone="accent">待配讲解片段</Typography>
      <div shuku-edit-id="e-c20ef55a-492f-4772-927d-c5186e25eee9" className="attn-trans-result-scene-image">
        <CourseMaterialImage path="observation/passing-poster.webp" alt="短片的体育馆传球场景示意，三名白衣队员、三名黑衣队员，两只橙色篮球。"/>
      </div>
    </figure>
    </div>
    <footer shuku-edit-id="e-483b3da7-58f7-4a9e-9a99-7891f4482ed4" className="attn-trans-result-footer">
      <div shuku-edit-id="e-738a6204-053e-40e0-9060-a60eb08f661d" className="attn-trans-result-controls">
        <Typography shuku-edit-id="e-0175f17c-8e6c-4018-a6f3-569fa454953a" variant="bodySmall" tone="muted">目标词</Typography>
        <ChoiceButtons label="按目标译文选择 ATT 时间步" value={String(e.row)}
          options={shown.example.targetTokens.map((token, row) => ({ value: String(row), label: displayTranslationToken(token) }))}
          onChange={value => { if (canInteract()) {e.selectRow(Number(value));if(e.displayState.epoch===TRANSLATION_MAX_EPOCHS)setSelectedHere(true);} }} />
      </div>
      <TranslationCheckpointTimeline />
    </footer>
    <Typography shuku-edit-id="e-17051f0a-3fea-4cbd-90c1-f46d13e10e18" variant="bodySmall" tone="muted">ATT 给定正确前词；译文自由生成。</Typography>
  </ContentBlock>;
}
