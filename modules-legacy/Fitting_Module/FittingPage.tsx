import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import './fitting-module.css';
import { DropoutBlock } from './blocks/DropoutBlock';
import { FittingDiagnosisBlock } from './blocks/FittingDiagnosisBlock';
import { FittingLessonFooter } from './blocks/FittingLessonFooter';
import { WeightRegularizationBlock } from './blocks/WeightRegularizationBlock';

const steps: LessonFlowStep[] = [
  { id: 'diagnosis', render: ({ complete }) => <FittingDiagnosisBlock onComplete={complete} /> },
  { id: 'weight-regularization', revealMode: 'cue', render: ({ complete }) => <WeightRegularizationBlock onComplete={complete} /> },
  { id: 'dropout', revealMode: 'cue', render: ({ complete }) => <DropoutBlock onComplete={complete} /> },
  { id: 'ending', revealMode: 'cue', completesLesson: true, render: () => <FittingLessonFooter /> },
];

export function FittingPage() {
  return <ModuleShell title="模型的拟合能力与泛化能力" subtitle="识别过拟合，并理解常见的缓解方法。" shellClassName="fit-shell edu-shell--scaled"><LessonFlow steps={steps} persistenceKey="fitting-module-v5" /></ModuleShell>;
}
