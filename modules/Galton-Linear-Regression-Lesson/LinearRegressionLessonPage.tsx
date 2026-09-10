import { LessonFlow, LessonFooter, ModuleShell, type LessonFlowStep } from '../shared/react';
import { LectureAdvanceCue } from './components/LectureAdvanceCue';
import { GaltonLossBlock, GaltonModelBlock, GaltonOpeningBlock, GaltonScatterBlock, GaltonSummaryBlock } from './blocks/GaltonRegressionBlocks';
import './linear-regression-lesson.css';

export const linearRegressionLessonSteps: LessonFlowStep[] = [
  { id: 'grl-opening', revealMode: 'scroll', render: ({ complete, isComplete }) => <LectureAdvanceCue complete={isComplete} onContinue={complete}><GaltonOpeningBlock /></LectureAdvanceCue> },
  { id: 'grl-scatter', revealMode: 'scroll', render: ({ complete, isComplete }) => <LectureAdvanceCue complete={isComplete} onContinue={complete}><GaltonScatterBlock /></LectureAdvanceCue> },
  { id: 'grl-model', revealMode: 'cue', render: ({ complete }) => <GaltonModelBlock interactive onComplete={complete} /> },
  { id: 'grl-loss', revealMode: 'cue', render: ({ complete }) => <GaltonLossBlock interactive onComplete={complete} /> },
  { id: 'grl-summary', revealMode: 'scroll', completesLesson: true, render: ({ complete, isComplete }) => <LectureAdvanceCue complete={isComplete} onContinue={complete}><GaltonSummaryBlock /></LectureAdvanceCue> },
  { id: 'grl-footer', revealMode: 'immediate', render: () => <LessonFooter title="你已经把一个历史问题翻译成了训练目标" description="继续学习时，可以把这里的 MSE 与梯度下降连接起来。" next={{ href: '/web-ppt/linear-regression-lesson', label: '打开 Web PPT' }} /> },
];

export function LinearRegressionLessonPage() {
  return <ModuleShell title="从高尔顿的身高问题到损失函数" subtitle="用真实历史问题，建立散点、直线、残差与损失之间的第一条认知链。" shellClassName="grl-shell"><LessonFlow steps={linearRegressionLessonSteps} persistenceKey="galton-linear-regression-lesson-v1" /></ModuleShell>;
}
