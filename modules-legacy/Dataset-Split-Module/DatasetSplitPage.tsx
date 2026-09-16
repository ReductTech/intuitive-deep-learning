import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import './dataset-split-module.css';
import { DatasetSplitProcessBlock } from './blocks/DatasetSplitProcessBlock';
import { DatasetLessonFooter } from './blocks/DatasetLessonFooter';

const steps: LessonFlowStep[] = [
  { id: 'dataset-process', render: ({ complete }) => <DatasetSplitProcessBlock onComplete={complete} /> },
  { id: 'ending', revealMode: 'immediate', completesLesson: true, render: () => <DatasetLessonFooter /> },
];

export function DatasetSplitPage() {
  return (
    <ModuleShell
      title="数据集划分"
      subtitle="训练集负责学习，验证集负责选择，测试集负责最终评价。"
      shellClassName="ds-shell edu-shell--scaled"
    >
      <LessonFlow steps={steps} persistenceKey="dataset-split-module-v7" />
    </ModuleShell>
  );
}
