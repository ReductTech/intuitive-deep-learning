import { useMemo, useRef } from 'react';
import { Typography } from '../../../shared/react';
import { AttentionActivity, ChoiceButtons, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { TranslationCheckpointTimeline } from '../../components/TranslationExperimentControls';
import { useTranslationExperiment } from '../../model/TranslationExperimentContext';
import { inspectTranslationTeacherForcedStep, TRANSLATION_MAX_EPOCHS } from '../../model/attentionTranslationExperiment';
import { getTranslationDisplay, displayTranslationToken } from '../../model/translationDisplay';
import './AttentionTranslationResultsPage.css';

export function AttentionTranslationResultsPage(props: ActivityProps) {
  const e = useTranslationExperiment();
  const [selectedHere,setSelectedHere]=useActivityState('C25-required-target',false);
  const root = useRef<HTMLDivElement>(null);
  const shown = getTranslationDisplay(e.displayState, 'V4');
  const step = useMemo(() => inspectTranslationTeacherForcedStep(e.displayState, shown.example, e.row), [e.displayState, shown.example, e.row]);
  const initial = useMemo(() => inspectTranslationTeacherForcedStep(e.initialState, shown.example, e.row), [e.initialState, shown.example, e.row]);
  const sourceTokens = shown.example.sourceTokens.slice(0, shown.example.sourceValidLength);
  const displayLabel = e.reviewState ? '回看' : '当前';
  const canInteract = () => Boolean(root.current && !root.current.closest('[aria-hidden="true"], [inert]'));
  const generatedText = shown.greedyText || (shown.greedyStatus === '直接EOS' ? '直接结束' : '无有效译文');

  return <AttentionActivity {...props} number={25} title="验证句：训练前后的注意力" eyebrow={`未参与训练 · 验证句 · ${shown.sourceText}`} learningFlow={<Typography variant="bodySmall" tone="muted">ATT：给定正确前词 · 读取比例不保证逐词对齐</Typography>}
    done={e.state.epoch >= TRANSLATION_MAX_EPOCHS && selectedHere} footerHeight={210} className="attn-trans-result-page"
    footer={<div className="attn-trans-result-footer">
      <div className="attn-trans-result-controls">
        <Typography variant="bodySmall" tone="muted">目标词</Typography>
        <ChoiceButtons label="按目标译文选择 ATT 时间步" value={String(e.row)}
          options={shown.example.targetTokens.map((token, row) => ({ value: String(row), label: displayTranslationToken(token) }))}
          onChange={value => { if (canInteract()) {e.selectRow(Number(value));setSelectedHere(true);} }} />
      </div>
      <TranslationCheckpointTimeline />
    </div>}>
    <div ref={root} className="attn-trans-result-main" data-translation-epoch={e.state.epoch}
      data-display-epoch={e.displayState.epoch} data-result-view="V4" data-result-row={e.row} data-greedy-exact={shown.greedyExact}>
      <div className="attn-trans-result-sentence">
        <div><Typography variant="bodySmall" tone="muted">小明在家 · 验证句，未参与训练</Typography><Typography variant="body">{shown.sourceText}</Typography></div>
        <div><Typography variant="bodySmall" tone="muted">目标</Typography><Typography variant="h3" tone="accent">{shown.targetText}</Typography></div>
        <div><Typography variant="bodySmall" tone="muted">自由生成译文{shown.greedyTruncated ? ' · 长度上限' : ''}</Typography><Typography variant="h3" tone={shown.greedyExact ? 'success' : 'warning'}>{generatedText}</Typography></div>
      </div>
      <section className="attn-trans-result-comparison" aria-label={`目标词“${displayTranslationToken(step.target)}”的ATT，两排使用相同色深比例`}>
        {[{id:'initial',label:'未训练',weights:initial.paddedWeights},{id:'current',label:displayLabel,weights:step.paddedWeights}].map(entry=><div className="attn-trans-result-token-row" key={entry.id} data-att-stage={entry.id}>
          <Typography variant="h3" tone={entry.id==='initial'?'muted':'accent'}>{entry.label}</Typography>
          <div className="attn-trans-result-tokens" style={{gridTemplateColumns:`repeat(${sourceTokens.length},minmax(0,1fr))`}}>
            {sourceTokens.map((token,index)=>{const weight=entry.weights[index];const rounded=entry.weights.slice(0,sourceTokens.length).map(w=>Number(w.toFixed(2)));const max=Math.max(...rounded);const top=entry.id==='current'&&rounded.filter(w=>w===max).length===1&&rounded[index]===max;return <div key={index} className={'attn-trans-result-token'+(top?' is-top':'')}
              style={{backgroundColor:`color-mix(in srgb, var(--attn-activation) ${(0.06+weight*0.88)*100}%, var(--ui-bg-card))`,color:weight>=.46?'var(--ui-bg-card)':'var(--ui-text-main)'}}
              data-source-index={index} data-attention={weight} role="img" aria-label={entry.label+'，'+token+'，ATT '+(weight*100).toFixed(1)+'%'} title={(weight*100).toFixed(1)+'%'}>
              <Typography variant="h2" tone="inherit" align="center">{token}</Typography><Typography variant="bodySmall" tone="inherit" align="center">{(weight*100).toFixed(1)}%</Typography>
            </div>;})}
          </div>
        </div>)}
      </section>
      <Typography variant="bodySmall" tone="accent">{e.displayState.epoch === 0 ? '换一条未训练的消息：检查学到的翻译与读取方式。' : shown.greedyExact ? '这条新消息译对了；查看不同译词的读取比例。' : '这条新消息还未译对；读取比例的变化不保证译文正确。'}</Typography>
    </div>
  </AttentionActivity>;
}
