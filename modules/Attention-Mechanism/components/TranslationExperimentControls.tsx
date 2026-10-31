import { useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import { Button, Typography } from '../../shared/react';
import { ChoiceButtons } from './AttentionActivity';
import { useTranslationExperiment, type TranslationExperimentView } from '../model/TranslationExperimentContext';
import './TranslationExperimentControls.css';

const exampleOptions: { value: TranslationExperimentView; label: string }[] = [
  { value: 'B1', label: '到家' }, { value: 'V1', label: '在学校' },
  { value: 'V2', label: '去商店' }, { value: 'V3', label: '去学校' },
];

function useVisibleControls() {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (root.current) root.current.inert = Boolean(root.current.closest('[aria-hidden="true"]'));
  });
  const canInteract = () => Boolean(root.current && !root.current.closest('[aria-hidden="true"]'));
  return { root, canInteract };
}
function containControlKeys(event: KeyboardEvent<HTMLDivElement>) {
  if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) event.stopPropagation();
}

/** Shared sample selection for C24/C25; changing sample is not a training action. */
export function TranslationExamplePicker() {
  const { view, selectExample } = useTranslationExperiment();
  const { root, canInteract } = useVisibleControls();
  return <div ref={root} className="attn-translation-example-picker" onKeyDown={containControlKeys}>
    <ChoiceButtons label="选择翻译句子：到家为训练句，其余为验证句" value={view} options={exampleOptions} onChange={value => {
      const option = exampleOptions.find(item => item.value === value);
      if (option && canInteract()) selectExample(option.value);
    }}/>
  </div>;
}

/** Review only: no model rollback and no trainTo calls, including on mount. */
export function TranslationCheckpointTimeline() {
  const { state, reviewState, displayState, checkpoints, running, review, showCurrent } = useTranslationExperiment();
  const { root, canInteract } = useVisibleControls();
  return <div ref={root} className="attn-translation-checkpoint-timeline" onKeyDown={containControlKeys}>
    <Typography variant="bodySmall" tone="muted" wrap="nowrap" className="attn-translation-timeline-status">
      {reviewState ? '回看 ' + reviewState.epoch + ' 轮 · 最新 ' + state.epoch + ' 轮' : '当前 ' + state.epoch + ' 轮'}
    </Typography>
    <div className="attn-translation-checkpoint-buttons" role="group" aria-label="回看已完成的训练检查点">
      {checkpoints.map(({ epoch, available }) => <Button key={epoch} active={displayState.epoch === epoch} aria-pressed={displayState.epoch === epoch} disabled={running || !available || epoch > state.epoch} onClick={() => {
        if (canInteract() && !running && available && epoch <= state.epoch) review(epoch);
      }}><Typography as="span" variant="bodySmall" tone="inherit">{epoch}轮</Typography></Button>)}
    </div>
    <div className="attn-translation-return-slot">
      {reviewState && <Button disabled={running} onClick={() => { if (canInteract() && !running) showCurrent(); }}><Typography as="span" variant="bodySmall" tone="inherit">返回当前</Typography></Button>}
    </div>
  </div>;
}
