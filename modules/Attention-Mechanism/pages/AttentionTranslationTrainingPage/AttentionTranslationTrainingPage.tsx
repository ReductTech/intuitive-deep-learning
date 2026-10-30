import { useRef, useState } from 'react';
import { Button, Typography } from '../../../shared/react';
import { AttentionActivity, ChoiceButtons, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { TranslationCheckpointTimeline } from '../../components/TranslationExperimentControls';
import { useTranslationExperiment } from '../../model/TranslationExperimentContext';
import { TRANSLATION_MAX_EPOCHS, TRANSLATION_TRAINING_SET } from '../../model/attentionTranslationExperiment';
import { getTranslationDisplay } from '../../model/translationDisplay';
import './AttentionTranslationTrainingPage.css';

const trainingIndex = TRANSLATION_TRAINING_SET.findIndex(example => example.label === 'I am at school .');

export function AttentionTranslationTrainingPage(props: ActivityProps) {
  const experiment = useTranslationExperiment();
  const { state, displayState, initialState, running, error } = experiment;
  const root = useRef<HTMLDivElement>(null);
  const [selectedTargetRow, setSelectedTargetRow] = useState(2);
  const [selectedHere,setSelectedHere]=useActivityState('C24-required-target',false);
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
    { key: 'initial', label: '未训练', weights: baselineWeights },
    { key: 'current', label: experiment.reviewState ? '回看' : '当前', weights: currentWeights },
  ];
  const canInteract = () => Boolean(root.current && !root.current.closest('[aria-hidden="true"], [inert]'));
  const start = (target: number) => { if (canInteract()) void experiment.trainTo(target); };

  return <AttentionActivity {...props} number={24} title="训练中，关注重点如何变化" eyebrow={`小明买水后到学校 · 训练句 · ${shown.sourceText}`}
    done={state.epoch >= TRANSLATION_MAX_EPOCHS && experiment.selectedCheckpoint && selectedHere} footerHeight={210} className="attn-trans-train-page"
    footer={<div className="attn-trans-train-footer">
      <div className="attn-row">
        <div className="attn-trans-train-actions">
          <Button variant="primary" disabled={running || state.epoch >= TRANSLATION_MAX_EPOCHS} onClick={() => start(TRANSLATION_MAX_EPOCHS)}><Typography as="span" variant="bodySmall" tone="inherit">{error ? '训练中断，重试' : running ? '训练中…' : state.epoch >= TRANSLATION_MAX_EPOCHS ? '训练完成' : state.epoch === 0 ? '开始训练' : '继续训练'}</Typography></Button>
          <Button disabled={running || state.epoch >= TRANSLATION_MAX_EPOCHS} onClick={() => start(Math.min(TRANSLATION_MAX_EPOCHS, state.epoch + 5))}><Typography as="span" variant="bodySmall" tone="inherit">+5 轮</Typography></Button>
          <Button disabled={running} onClick={() => { if (canInteract()) { experiment.reset(); setSelectedTargetRow(2); } }}><Typography as="span" variant="bodySmall" tone="inherit">重置</Typography></Button>
        </div>
      </div>
      <TranslationCheckpointTimeline/>
    </div>}>
    <div ref={root} className="attn-trans-train-main" data-translation-epoch={state.epoch} data-display-epoch={displayState.epoch} data-running={running} data-att-row={selected.row} data-att-mode="target">
      <Typography variant="bodySmall" tone="muted">小明到学校发消息：{shown.sourceText} → {shown.targetText}</Typography>
      <div className="attn-trans-train-targets">
        <Typography variant="bodySmall" tone="muted">目标词</Typography>
        <ChoiceButtons label="选择目标词，查看训练前后的 ATT" value={String(selected.row)}
          options={targetSteps.map(({ token, row }) => ({ value: String(row), label: token }))}
          onChange={value => { const row = Number(value); if (canInteract() && targetSteps.some(step => step.row === row)) {setSelectedTargetRow(row);setSelectedHere(true);} }}/>
        <Typography variant="bodySmall" tone="muted" align="end">ATT · 给定正确前词</Typography>
      </div>
      <section className="attn-trans-train-source-comparison" aria-label={`目标词“${selected.token}”的 ATT，未训练与第 ${displayState.epoch} 轮对比`}>
        {rows.map(entry => <div className="attn-trans-train-source-row" key={entry.key} data-att-stage={entry.key}>
          <Typography variant="h3" tone={entry.key === 'initial' ? 'muted' : 'accent'}>{entry.label}</Typography>
          <div className="attn-trans-train-source-tokens" style={{ gridTemplateColumns: `repeat(${source.length},minmax(0,1fr))` }}>
            {source.map((token, index) => {
              const weight = entry.weights[index];
              return <div key={index} className={`attn-trans-train-source-token${entry.key === 'current' && index === topIndex ? ' is-top' : ''}`}
                style={{ backgroundColor: `color-mix(in srgb, var(--attn-activation) ${(0.06 + weight * 0.88) * 100}%, var(--ui-bg-card))`, color: weight >= .46 ? 'var(--ui-bg-card)' : 'var(--ui-text-main)' }}
                data-source-word={token} data-attention={weight} role="img" aria-label={`${entry.label}，${token}，ATT ${(weight * 100).toFixed(1)}%`} title={`${(weight * 100).toFixed(1)}%`}>
                <Typography variant="h2" tone="inherit" align="center">{token}</Typography><Typography variant="bodySmall" tone="inherit" align="center">{(weight*100).toFixed(1)}%</Typography>
              </div>;
            })}
          </div>
        </div>)}
      </section>
      <div className="attn-trans-train-translation">
        <Typography variant="bodySmall" tone="muted">自由生成译文{experiment.reviewState ? ' · 回看' : ''}{shown.greedyTruncated ? ' · 长度上限' : ''}</Typography>
        <Typography variant="h3" tone={shown.greedyExact ? 'success' : 'warning'}>{shown.greedyText || (shown.greedyStatus === '直接EOS' ? '直接结束' : '未生成正文')}</Typography>
        <Typography variant="bodySmall" tone="muted">目标：{shown.targetText}</Typography>
      </div>
      <Typography variant="bodySmall" tone="accent">{!selectedHere ? '选择目标词查看读取比例；最深源词不等于译词答案。' : state.epoch < TRANSLATION_MAX_EPOCHS ? '完成训练，再切换训练轮次比较读取比例。' : !experiment.selectedCheckpoint ? '切换训练轮次，比较同一译词的读取比例。' : '训练改变读取比例；注意力不保证逐词对齐。'}</Typography>
    </div>
  </AttentionActivity>;
}

