import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import { StyleLossMixerBlock } from './blocks/StyleLossMixerBlock';
import { StyleRepresentationBlock } from './blocks/StyleRepresentationBlock';
import { CompetitionPipelineBlock } from './blocks/CompetitionPipelineBlock';
import { CompetitionStrategyBlock } from './blocks/CompetitionStrategyBlock';
import { VisionPracticeBridgeBlock } from './blocks/VisionPracticeBridgeBlock';
import { VisionStyleLessonFooter } from './blocks/VisionStyleLessonFooter';
import './vision-style-competitions.css';

const lessonSteps: LessonFlowStep[] = [
  { id: 'vision-style-loss-v1', render: ({ complete }) => <StyleLossMixerBlock onComplete={complete} /> },
  { id: 'vision-style-representation-v1', revealMode: 'cue', render: ({ complete }) => <StyleRepresentationBlock onComplete={complete} /> },
  { id: 'vision-competition-pipeline-v1', revealMode: 'cue', render: ({ complete }) => <CompetitionPipelineBlock onComplete={complete} /> },
  { id: 'vision-competition-strategy-v1', revealMode: 'cue', completesLesson: true, render: ({ complete }) => <CompetitionStrategyBlock onComplete={complete} /> },
  { id: 'vision-style-ending-v1', revealMode: 'scroll', render: () => <><VisionPracticeBridgeBlock /><VisionStyleLessonFooter /></> },
];

export function VisionStyleCompetitionsPage() {
  return (
    <ModuleShell
      className="vision-style-competitions-module"
      title="怎样迁移图像风格，并把视觉模型送上排行榜？"
      subtitle="从内容、风格与平滑损失出发，理解神经风格迁移，再走完竞赛的数据划分、模型选择、重训和提交。"
      badge="计算机视觉 · 第五课"
    >
      <LessonFlow steps={lessonSteps} persistenceKey="vision-style-competitions-v1" cueText="损失配方已经平衡，继续看看风格特征藏在哪里" />
    </ModuleShell>
  );
}
