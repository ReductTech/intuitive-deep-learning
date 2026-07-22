import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import './loss-guide-react.css';
import { LossCalculationBlock } from './blocks/LossCalculationBlock';
import { GradientBlock } from './blocks/GradientBlock';
import { NumberLineBlock } from './blocks/NumberLineBlock';
import { ResourcesBlock } from './blocks/ResourcesBlock';

const steps: LessonFlowStep[] = [
  { id: 'number-line', revealMode: 'scroll', render: ({ complete }) => <NumberLineBlock onComplete={complete} /> },
  { id: 'calculation', revealMode: 'cue', render: ({ complete }) => <LossCalculationBlock onComplete={complete} /> },
  { id: 'gradient', revealMode: 'scroll', completesLesson: true, render: ({ complete }) => <GradientBlock onComplete={complete} /> },
  { id: 'resources', revealMode: 'immediate', render: () => <ResourcesBlock /> },
];

/** First React migration sample: independent lesson blocks composed by LessonFlow. */
export function LossGuidePage() {
  return (
    <ModuleShell
      title="为什么需要损失函数"
      subtitle="从距离误差开始，观察损失函数怎样衡量预测和目标之间的差距。"
      shellClassName="lg-react-shell edu-shell--scaled"
    >
      <LessonFlow steps={steps} persistenceKey="loss-guide-react" />
    </ModuleShell>
  );
}
