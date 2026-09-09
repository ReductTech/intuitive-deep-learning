import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import { CompareLossBlock, FitLabBlock, GaltonStoryBlock, LossFunctionBlock, PredictionModelBlock, ResidualBlock, ScatterObservationBlock, SummaryBlock } from './blocks';
import './galton-linear-regression.css';

export const galtonLinearRegressionLessonSteps: LessonFlowStep[] = [
  { id: 'galton-story', revealMode: 'cue', render: ({ complete }) => <GaltonStoryBlock onComplete={complete} /> },
  { id: 'scatter-observation', revealMode: 'scroll', render: ({ complete }) => <ScatterObservationBlock onComplete={complete} /> },
  { id: 'prediction-model', revealMode: 'scroll', render: ({ complete }) => <PredictionModelBlock onComplete={complete} /> },
  { id: 'residual', revealMode: 'scroll', render: ({ complete }) => <ResidualBlock onComplete={complete} /> },
  { id: 'loss-function', revealMode: 'scroll', render: ({ complete }) => <LossFunctionBlock onComplete={complete} /> },
  { id: 'compare-loss', revealMode: 'scroll', render: ({ complete }) => <CompareLossBlock onComplete={complete} /> },
  { id: 'fit-lab', revealMode: 'scroll', completesLesson: true, render: ({ complete }) => <FitLabBlock onComplete={complete} /> },
  { id: 'summary', revealMode: 'immediate', render: () => <SummaryBlock /> },
];

export function GaltonLinearRegressionPage() {
  return <ModuleShell title="从高尔顿的身高数据到损失函数" subtitle="用一条直线回答“孩子可能多高”，再追问：怎样判断这条线好不好？" badge="线性回归 · 入门" shellClassName="glr-shell">
    <LessonFlow steps={galtonLinearRegressionLessonSteps} persistenceKey="galton-linear-regression-v1" />
  </ModuleShell>;
}
