import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import { GaltonOpeningBlock } from './blocks/GaltonOpeningBlock';
import { LinearFitBlock } from './blocks/LinearFitBlock';
import { LossFunctionBlock } from './blocks/LossFunctionBlock';
import { LinearRegressionCompletionBlock } from './blocks/LinearRegressionCompletionBlock';
import { LinearRegressionFooter } from './blocks/LinearRegressionFooter';
import { LinearRegressionProvider } from './model/LinearRegressionContext';
import './linear-regression-loss.css';

export const linearRegressionLossSteps: LessonFlowStep[] = [
  { id: 'linear-regression-galton-opening-v1', revealMode: 'cue', render: ({ complete }) => <GaltonOpeningBlock onComplete={complete} /> },
  { id: 'linear-regression-fit-v1', revealMode: 'scroll', render: ({ complete }) => <LinearFitBlock onComplete={complete} /> },
  { id: 'linear-regression-loss-v1', revealMode: 'cue', render: ({ complete }) => <LossFunctionBlock onComplete={complete} /> },
  { id: 'linear-regression-completion-v1', revealMode: 'scroll', completesLesson: true, render: ({ complete }) => <LinearRegressionCompletionBlock onComplete={complete} /> },
  { id: 'linear-regression-resources-v1', revealMode: 'immediate', render: () => <LinearRegressionFooter /> },
];

/** Single slide/content registry consumed by the PPT host as well as previews. */
export const linearRegressionLossSlideDefinitions = [
  { id: 'galton-opening', title: '高尔顿的问题：父母身高，能预测孩子吗？', render: GaltonOpeningBlock },
  { id: 'linear-fit', title: '把趋势写成一条直线', render: LinearFitBlock },
  { id: 'loss-function', title: '损失函数：把差距变成数字', render: LossFunctionBlock },
  { id: 'completion', title: '从数据到损失', render: LinearRegressionCompletionBlock },
  { id: 'resources', title: '继续探索', render: LinearRegressionFooter },
] as const;

export function LinearRegressionLossPage() {
  return <LinearRegressionProvider><ModuleShell title="线性回归与损失函数" subtitle="从高尔顿的父母与孩子身高数据出发，亲手拟合一条直线，再用损失衡量它有多可靠。" shellClassName="lr-guide-shell"><LessonFlow steps={linearRegressionLossSteps} persistenceKey="linear-regression-loss-v1" /></ModuleShell></LinearRegressionProvider>;
}
