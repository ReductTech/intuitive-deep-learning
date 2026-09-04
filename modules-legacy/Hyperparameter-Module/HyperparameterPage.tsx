import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import './hyperparameter-module.css';
import { HyperparameterOverviewBlock } from './blocks/HyperparameterOverviewBlock';
import { GridSearchSimulationBlock } from './blocks/GridSearchSimulationBlock';
import { RandomSearchSimulationBlock } from './blocks/RandomSearchSimulationBlock';
import { HyperparameterLessonFooter } from './blocks/HyperparameterLessonFooter';

const steps: LessonFlowStep[] = [
  { id: 'overview', render: ({ complete }) => <HyperparameterOverviewBlock onComplete={complete} /> },
  { id: 'grid-search', revealMode: 'cue', render: ({ complete }) => <GridSearchSimulationBlock onComplete={complete} /> },
  { id: 'random-search', revealMode: 'cue', render: ({ complete }) => <RandomSearchSimulationBlock onComplete={complete} /> },
  { id: 'ending', revealMode: 'cue', completesLesson: true, render: () => <HyperparameterLessonFooter /> },
];

export function HyperparameterPage() {
  return (
    <ModuleShell
      title="超参数与搜索策略"
      subtitle="了解模型训练前需要选择什么，并学习如何用有限实验找到更好的组合。"
      shellClassName="hp-shell edu-shell--scaled"
    >
      <LessonFlow steps={steps} persistenceKey="hyperparameter-module-v3" />
    </ModuleShell>
  );
}
