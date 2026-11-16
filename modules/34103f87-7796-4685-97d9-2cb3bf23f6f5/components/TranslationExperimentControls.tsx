import { useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { ChoiceButtons } from './AttentionActivity';
import { useTranslationExperiment, type TranslationExperimentView } from '../model/TranslationExperimentContext';
import './TranslationExperimentControls.css';

const exampleOptions: { value: TranslationExperimentView; label: string }[] = [
  { value: 'B1', label: '训练讲解句 B1' },
  ...(['V1','V2','V3','V4','V5','V6'] as const).map(value=>({value,label:'留出讲解句 '+value})),
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
  return <div shuku-edit-id="e-a0158b68-42a7-4f23-a26e-2243b0c634aa" ref={root} className="attn-translation-example-picker" onKeyDown={containControlKeys}>
    <ChoiceButtons label="选择训练讲解句或留出验证句" value={view} options={exampleOptions} onChange={value => {
      const option = exampleOptions.find(item => item.value === value);
      if (option && canInteract()) selectExample(option.value);
    }}/>
  </div>;
}

/** Review only: no model rollback and no trainTo calls, including on mount. */
export function TranslationCheckpointTimeline() {
  const { state, reviewState, displayState, checkpoints, running, review, showCurrent } = useTranslationExperiment();
  const { root, canInteract } = useVisibleControls();
  return <div shuku-edit-id="e-83296b2d-6647-48cf-859d-767c5738b675" ref={root} className="attn-translation-checkpoint-timeline" onKeyDown={containControlKeys}>
    <Typography shuku-edit-id="e-063baf0e-d60b-46dd-87aa-25b64fd1a749" variant="bodySmall" tone="muted" wrap="nowrap" className="attn-translation-timeline-status">
      {reviewState ? '回看 ' + reviewState.epoch + ' 轮 · 最新 ' + state.epoch + ' 轮' : '当前 ' + state.epoch + ' 轮'}
    </Typography>
    <div shuku-edit-id="e-7e9f0e9f-8037-47a4-9c97-f48c54d78389" className="attn-translation-checkpoint-buttons" role="group" aria-label="回看已完成的训练检查点">
      {checkpoints.map(({ epoch, available }) => <Button key={epoch} active={displayState.epoch === epoch} aria-pressed={displayState.epoch === epoch} disabled={running || !available || epoch > state.epoch} onClick={() => {
        if (canInteract() && !running && available && epoch <= state.epoch) review(epoch);
      }}><Typography shuku-edit-id="e-3acaf99d-9648-422d-9435-b6c987487374" as="span" variant="bodySmall" tone="inherit">{epoch}轮</Typography></Button>)}
    </div>
    <div shuku-edit-id="e-bc4d0270-235e-4dbe-ac22-62e466a69707" className="attn-translation-return-slot">
      {reviewState && <Button disabled={running} onClick={() => { if (canInteract() && !running) showCurrent(); }}><Typography shuku-edit-id="e-17f2469d-b1cf-4ec1-a722-b34831a1dce7" as="span" variant="bodySmall" tone="inherit">返回当前</Typography></Button>}
    </div>
  </div>;
}
