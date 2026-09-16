import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import './adaptive-learning-rate.css';
import { WhyOptimizerBlock } from './blocks/WhyOptimizerBlock';
import { SgdBlock } from './blocks/SgdBlock';
import { MomentumBlock } from './blocks/MomentumBlock';
import { AdaGradBlock } from './blocks/AdaGradBlock';
import { AdamBlock } from './blocks/AdamBlock';
import { AdaptiveLearningRateLessonFooter } from './blocks/AdaptiveLearningRateLessonFooter';

const steps: LessonFlowStep[] = [
  { id: 'optimizer-fixed-step-problem', render: ({ complete }) => <WhyOptimizerBlock onComplete={complete} /> },
  { id: 'optimizer-sgd-sampling', revealMode: 'cue', render: ({ complete }) => <SgdBlock onComplete={complete} /> },
  { id: 'optimizer-momentum-memory', revealMode: 'cue', render: ({ complete }) => <MomentumBlock onComplete={complete} /> },
  { id: 'optimizer-adagrad-scaling', revealMode: 'cue', render: ({ complete }) => <AdaGradBlock onComplete={complete} /> },
  { id: 'optimizer-adam-combination', revealMode: 'cue', completesLesson: true, render: ({ complete }) => <AdamBlock onComplete={complete} /> },
  { id: 'optimizer-ending', revealMode: 'cue', render: () => <AdaptiveLearningRateLessonFooter /> },
];

export function AdaptiveLearningRatePage() {
  return (
    <ModuleShell
      title="优化器如何调整学习步伐"
      subtitle="从 SGD 的随机路线出发，逐步加入方向记忆和自适应步长，学会判断 Momentum、AdaGrad 与 Adam 各自解决什么问题。"
      shellClassName="alr-shell edu-shell--scaled"
    >
      <LessonFlow steps={steps} persistenceKey="adaptive-learning-rate-module-v2" />
    </ModuleShell>
  );
}
