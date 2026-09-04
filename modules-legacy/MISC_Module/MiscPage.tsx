import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import './misc-module.css';
import { BatchStepEpochBlock } from './blocks/BatchStepEpochBlock';
import { MiscLessonFooter } from './blocks/MiscLessonFooter';

const steps: LessonFlowStep[] = [
  { id: 'batch-step-epoch', render: ({ complete }) => <BatchStepEpochBlock onComplete={complete} /> },
  { id: 'ending', revealMode: 'cue', completesLesson: true, render: () => <MiscLessonFooter /> },
];

export function MiscPage() {
  return <ModuleShell title="训练中的计数单位" subtitle="理解 Batch、Step 与 Epoch。" shellClassName="misc-shell edu-shell--scaled"><LessonFlow steps={steps} persistenceKey="misc-module-v1" /></ModuleShell>;
}
