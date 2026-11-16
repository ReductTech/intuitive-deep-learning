import { useState } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { ChoiceButtons, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { useRegressionPage as useAttentionPage } from '../../components/useRegressionPage';
import { TranslationCheckpointTimeline } from '../../components/TranslationExperimentControls';
import { useTranslationExperiment } from '../../model/TranslationExperimentContext';
import { TRANSLATION_MAX_EPOCHS, TRANSLATION_PARAMETER_COUNT } from '../../model/attentionTranslationExperiment';
import { getTranslationDisplay } from '../../model/translationDisplay';
import './AttentionTranslationTrainingPage.css';

const trainingIndex = 0; // Campus B1; the matching vocabulary and model share this ordered corpus.

export function AttentionTranslationTrainingPage(props: ActivityProps) {
  const experiment = useTranslationExperiment();
  const { state, displayState, initialState, running, error } = experiment;
  const [selectedTargetRow, setSelectedTargetRow] = useState(2);
  const [selectedHere,setSelectedHere]=useActivityState('C24-campus-target-inspected',false);
  const complete = state.epoch >= TRANSLATION_MAX_EPOCHS && experiment.selectedCheckpoint && selectedHere;
  const {root,mathReady,canAct}=useAttentionPage(complete,props);
  const shown = getTranslationDisplay(displayState, 'B1', trainingIndex);
  const source = shown.example.sourceTokens.slice(0, shown.example.sourceValidLength);
  const targetSteps = shown.example.targetTokens.map((token, row) => ({ token, row }))
    .filter(({ token }) => !['<pad>', '<bos>', '<eos>', '。'].includes(token));
  const selected = targetSteps.find(({ row }) => row === selectedTargetRow) ?? targetSteps[0];
  // Both rows use the same target step and target prefix, as in the original lesson.
  const initialMatrix = (shown.isTraining ? initialState.attentionMatrices : initialState.validationAttentionMatrices)[shown.index];
  const currentWeights = shown.attentionMatrix[selected.row].slice(0, source.length);
  const baselineWeights = initialMatrix[selected.row].slice(0, source.length);
  const rounded = currentWeights.map(weight => Number(weight.toFixed(2)));
  const maximum = Math.max(...rounded);
  const topIndex = rounded.filter(weight => weight === maximum).length === 1 ? rounded.indexOf(maximum) : -1;
  const rows = [
    { key: 'initial', label: '未训练', epoch:0, weights: baselineWeights },
    { key: 'current', label: experiment.reviewState ? '回看' : '当前', epoch:displayState.epoch, weights: currentWeights },
  ];
  const canInteract = canAct;
  const start = (target: number) => { if (canInteract()) void experiment.trainTo(target); };

  return <ContentBlock shuku-edit-id="e-e10cf951-5b62-468e-b916-9d60cc5a4843" ref={root} headingLevel={1} title="训练讲解稿：读取比例怎样变化"
    subtitle="同一目标词，比较训练前后读取。"
    className="attn-trans-train-page" bodyClassName="attn-trans-train-body" data-activity="C24" data-parameter-count={TRANSLATION_PARAMETER_COUNT} data-activity-complete={complete} data-capture-ready={mathReady} aria-busy={!mathReady}>
    <div shuku-edit-id="e-ac5112ec-d85f-4fae-919e-2fc157e68260" className="attn-trans-train-main" data-translation-epoch={state.epoch} data-display-epoch={displayState.epoch} data-running={running} data-att-row={selected.row} data-att-mode="target">
      <Typography shuku-edit-id="e-5c9b3cd6-049e-48f6-bda6-c0017874e380" variant="bodySmall" tone="muted">训练讲解句 B1</Typography>
      <div shuku-edit-id="e-5de19eba-afcf-4bdd-8eda-e03fb78cfc19" className="attn-trans-train-targets">
        <Typography shuku-edit-id="e-d291eb0b-1dc0-428a-895b-73af00d6e71f" variant="bodySmall" tone="muted">目标词</Typography>
        <ChoiceButtons label="选择目标词，查看训练前后的 ATT" value={String(selected.row)}
          options={targetSteps.map(({ token, row }) => ({ value: String(row), label: token }))}
          onChange={value => { const row = Number(value); if (canInteract() && targetSteps.some(step => step.row === row)) {setSelectedTargetRow(row);setSelectedHere(true);} }}/>
        <Typography shuku-edit-id="e-cc13e60c-4457-4053-a613-c3205278c977" variant="bodySmall" tone="muted" align="end">ATT · 给定正确前词</Typography>
      </div>
      <section shuku-edit-id="e-5bebcf9b-3e02-4a18-aa8f-f1158d203168" className="attn-trans-train-source-comparison" aria-label={`目标词“${selected.token}”的 ATT，未训练与第 ${displayState.epoch} 轮对比`}>
        {rows.map(entry => <div shuku-edit-id="e-825b1b83-4f0a-44c7-b2ee-8def86b45fe4" className="attn-trans-train-source-row" key={entry.key} data-att-stage={entry.key}>
          <div shuku-edit-id="e-87cd2ed3-a1e7-4ac4-9f5d-1f194b037da8" className="attn-trans-train-row-label"><Typography shuku-edit-id="e-390beb77-cf76-49df-9240-baea7bb556a9" variant="h3" tone={entry.key === 'initial' ? 'muted' : 'accent'}>{entry.label}</Typography><Typography shuku-edit-id="e-642f5604-d6fc-43f6-b679-86f0d45fccfe" variant="bodySmall" tone="muted">第 {entry.epoch} 轮</Typography></div>
          <div shuku-edit-id="e-17c9f9ae-516a-474a-80c4-a18dc3e88a71" className="attn-trans-train-source-tokens" style={{ gridTemplateColumns: `repeat(${source.length},minmax(0,1fr))` }}>
            {source.map((token, index) => {
              const weight = entry.weights[index];
              return <div shuku-edit-id="e-aca565f8-a82b-4441-844d-43b8428b3bbe" key={index} className={`attn-trans-train-source-token${entry.key === 'current' && index === topIndex ? ' is-top' : ''}`}
                style={{ backgroundColor: `color-mix(in srgb, var(--attn-activation) ${(0.06 + weight * 0.88) * 100}%, var(--ui-bg-card))`, color: weight >= .46 ? 'var(--ui-bg-card)' : 'var(--ui-text-main)' }}
                data-source-word={token} data-attention={weight} role="img" aria-label={`${entry.label}，${token}，ATT ${(weight * 100).toFixed(1)}%`} title={`${(weight * 100).toFixed(1)}%`}>
                <Typography shuku-edit-id="e-f192b8d7-9840-44a1-8afc-f955215acb9f" variant="h3" tone="inherit" align="center">{token}</Typography><Typography shuku-edit-id="e-00ba7f0e-1088-4df4-8e8b-0efcafa969be" variant="bodySmall" tone="inherit" align="center">{(weight*100).toFixed(1)}%</Typography>
              </div>;
            })}
          </div>
        </div>)}
      </section>
      <Typography shuku-edit-id="e-cc7e42be-d7c6-4c86-a3b4-b341de3ecf72" variant="bodySmall" tone="accent">{!selectedHere ? '点选目标词；深色不等于译词答案。' : state.epoch < TRANSLATION_MAX_EPOCHS ? '训练后，切换轮次比较。' : !experiment.selectedCheckpoint ? '切换轮次，比较同一译词。' : '读取比例会变，不保证逐词对齐。'}</Typography>
      <div shuku-edit-id="e-1c2932fc-186a-430c-9177-113b625822c3" className="attn-trans-train-translation">
        <div shuku-edit-id="e-8064a71f-15b8-4379-9efb-c43d024bff78" className="attn-trans-train-translation-result">
          <Typography shuku-edit-id="e-711f0fd5-fcbb-420c-9f36-4cf3be2c4bb0" variant="bodySmall" tone="muted">自由生成译文{shown.greedyTruncated ? ' · 已达长度上限' : ''}</Typography>
          <Typography shuku-edit-id="e-c23c15ea-404e-4a94-bc0e-f075e7460f0e" variant="body" tone={shown.greedyExact ? 'success' : 'warning'}>{shown.greedyText || (shown.greedyStatus === '直接EOS' ? '直接结束' : '未生成正文')}</Typography>
        </div>
        <div shuku-edit-id="e-dfd3836c-837f-4d08-84bb-55a80d915c16" className="attn-trans-train-translation-target">
          <Typography shuku-edit-id="e-0b74b309-ed3c-4be3-810a-b662317c4df8" variant="bodySmall" tone="muted">目标译文</Typography>
          <Typography shuku-edit-id="e-995a99d1-5f95-4078-a6c5-2624384ca43c" variant="body">{shown.targetText}</Typography>
        </div>
      </div>
    </div>
    <footer shuku-edit-id="e-98c7e62e-a5b1-41a6-8984-8eb2c43990a5" className="attn-trans-train-footer">
      <Typography shuku-edit-id="e-044f5840-8b14-4be2-8fb9-8c4b16c1fe96" variant="bodySmall" tone="accent" data-training-loss={state.loss} data-display-loss={displayState.loss}>训练 {state.epoch}/{TRANSLATION_MAX_EPOCHS} 轮 · {experiment.reviewState ? <>第 {displayState.epoch} 轮交叉熵</> : "交叉熵"} {displayState.loss.toFixed(4)}</Typography>
      <div shuku-edit-id="e-f2abfaaa-154c-4a67-86df-d59103519816" className="attn-row">
        <div shuku-edit-id="e-292b7ac5-3106-4669-a217-f78c4d7ffb3b" className="attn-trans-train-actions">
          <Button variant="primary" disabled={running || state.epoch >= TRANSLATION_MAX_EPOCHS} onClick={() => start(TRANSLATION_MAX_EPOCHS)}><Typography shuku-edit-id="e-f98aa49e-11d0-402e-9432-bc7007ab8f91" as="span" variant="bodySmall" tone="inherit">{error ? '训练中断，重试' : running ? '回放中…' : state.epoch >= TRANSLATION_MAX_EPOCHS ? '训练完成' : state.epoch === 0 ? '播放缓存' : '继续回放'}</Typography></Button>
          {running&&<Button onClick={()=>{if(canInteract())experiment.pause();}}><Typography shuku-edit-id="e-d9e5e54e-a791-46dd-b9ec-c5f2d98ac117" as="span" variant="bodySmall" tone="inherit">暂停</Typography></Button>}
          <Button disabled={running || state.epoch >= TRANSLATION_MAX_EPOCHS} onClick={() => start(Math.min(TRANSLATION_MAX_EPOCHS, state.epoch + 5))}><Typography shuku-edit-id="e-3073849e-e7bb-4bf6-832d-648f3a95541a" as="span" variant="bodySmall" tone="inherit">+5 轮</Typography></Button>
          <Button disabled={running} onClick={() => { if (canInteract()) { experiment.reset(); setSelectedTargetRow(2); setSelectedHere(false); } }}><Typography shuku-edit-id="e-35b06188-075e-46ff-a45d-bec7ff334e08" as="span" variant="bodySmall" tone="inherit">重置</Typography></Button>
        </div>
      </div>
      <TranslationCheckpointTimeline/>
    </footer>
  </ContentBlock>;
}

