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

  return <ContentBlock ref={root} headingLevel={1} title="留出讲解句：再检查一次翻译"
    subtitle="同词表留出句，未参与训练。"
    className="attn-trans-result-page" bodyClassName="attn-trans-result-body" data-activity="C25" data-activity-complete={complete} data-capture-ready={mathReady} aria-busy={!mathReady}>
    <div className="attn-trans-result-layout">
    <div className="attn-trans-result-main" data-translation-epoch={e.state.epoch}
      data-display-epoch={e.displayState.epoch} data-result-view="V4" data-result-row={e.row} data-greedy-exact={shown.greedyExact}>
      <div className="attn-trans-result-sentence">
        <div><Typography variant="bodySmall" tone="muted">讲解句 V4</Typography><Typography variant="body">{shown.sourceText}</Typography></div>
        <div><Typography variant="bodySmall" tone="muted">目标译文</Typography><Typography variant="h3" tone="accent">{shown.targetText}</Typography></div>
        <div className="attn-trans-result-free"><Typography variant="bodySmall" tone="muted">自由生成译文{shown.greedyTruncated ? ' · 长度上限' : ''}</Typography><Typography variant="body" tone={shown.greedyExact ? 'success' : 'warning'}>{generatedText}</Typography></div>
      </div>
      <section className="attn-trans-result-comparison" aria-label={`目标词“${displayTranslationToken(step.target)}”的ATT，两排使用相同色深比例`}>
        {[{id:'initial',label:'未训练',epoch:0,weights:initial.paddedWeights},{id:'current',label:displayLabel,epoch:e.displayState.epoch,weights:step.paddedWeights}].map(entry=><div className="attn-trans-result-token-row" key={entry.id} data-att-stage={entry.id}>
          <div className="attn-trans-result-row-label"><Typography variant="h3" tone={entry.id==='initial'?'muted':'accent'}>{entry.label}</Typography><Typography variant="bodySmall" tone="muted">第 {entry.epoch} 轮</Typography></div>
          <div className="attn-trans-result-tokens" style={{gridTemplateColumns:`repeat(${sourceTokens.length},minmax(0,1fr))`}}>
            {sourceTokens.map((token,index)=>{const weight=entry.weights[index];const rounded=entry.weights.slice(0,sourceTokens.length).map(w=>Number(w.toFixed(2)));const max=Math.max(...rounded);const top=entry.id==='current'&&rounded.filter(w=>w===max).length===1&&rounded[index]===max;return <div key={index} className={'attn-trans-result-token'+(top?' is-top':'')}
              style={{backgroundColor:`color-mix(in srgb, var(--attn-activation) ${(0.06+weight*0.88)*100}%, var(--ui-bg-card))`,color:weight>=.46?'var(--ui-bg-card)':'var(--ui-text-main)'}}
              data-source-index={index} data-attention={weight} role="img" aria-label={entry.label+'，'+token+'，ATT '+(weight*100).toFixed(1)+'%'} title={(weight*100).toFixed(1)+'%'}>
              <Typography variant="h3" tone="inherit" align="center">{token}</Typography><Typography variant="bodySmall" tone="inherit" align="center">{(weight*100).toFixed(1)}%</Typography>
            </div>;})}
          </div>
        </div>)}
      </section>
      <Typography variant="bodySmall" tone="accent">{e.state.epoch < TRANSLATION_MAX_EPOCHS ? '先完成训练，再检查留出句。' : e.displayState.epoch!==TRANSLATION_MAX_EPOCHS ? '在第 150 轮点选目标词，完成检查。' : shown.greedyExact ? '本句译对；比例已舍入，不保证逐词对齐。' : '本句未译对；权重变化不保证译对。'}</Typography>
    </div>
    <figure className="attn-trans-result-scene">
      <Typography as="figcaption" variant="h3" tone="accent">待配讲解片段</Typography>
      <div className="attn-trans-result-scene-image">
        <CourseMaterialImage path="observation/passing-poster.png" alt="短片的体育馆传球场景示意，三名白衣队员、三名黑衣队员，两只橙色篮球。"/>
      </div>
    </figure>
    </div>
    <footer className="attn-trans-result-footer">
      <div className="attn-trans-result-controls">
        <Typography variant="bodySmall" tone="muted">目标词</Typography>
        <ChoiceButtons label="按目标译文选择 ATT 时间步" value={String(e.row)}
          options={shown.example.targetTokens.map((token, row) => ({ value: String(row), label: displayTranslationToken(token) }))}
          onChange={value => { if (canInteract()) {e.selectRow(Number(value));if(e.displayState.epoch===TRANSLATION_MAX_EPOCHS)setSelectedHere(true);} }} />
      </div>
      <TranslationCheckpointTimeline />
    </footer>
    <Typography variant="bodySmall" tone="muted">ATT 给定正确前词；译文自由生成。</Typography>
  </ContentBlock>;
}
