import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import { GaltonOpeningBlock } from './blocks/GaltonOpeningBlock';
import { LinearFitBlock } from './blocks/LinearFitBlock';
import { LossFunctionBlock } from './blocks/LossFunctionBlock';
import { LinearRegressionCompletionBlock } from './blocks/LinearRegressionCompletionBlock';
import { LinearRegressionFooter } from './blocks/LinearRegressionFooter';
import { LinearRegressionProvider } from './model/LinearRegressionContext';
import './linear-regression-loss.css';

export const linearRegressionLossSteps: LessonFlowStep[] = [
  { id: 'linear-regression-galton-opening-v2', revealMode: 'cue', render: ({ complete }) => <GaltonOpeningBlock onComplete={complete} /> },
  { id: 'linear-regression-fit-v2', revealMode: 'scroll', render: ({ complete }) => <LinearFitBlock onComplete={complete} /> },
  { id: 'linear-regression-loss-v2', revealMode: 'cue', render: ({ complete }) => <LossFunctionBlock onComplete={complete} /> },
  // The recap has no exploratory control; use UI Kit 模式 2 to point toward the next section.
  { id: 'linear-regression-completion-v2', revealMode: 'cue', completesLesson: true, render: ({ complete }) => <LinearRegressionCompletionBlock onComplete={complete} /> },
  { id: 'linear-regression-resources-v2', revealMode: 'immediate', render: () => <LinearRegressionFooter /> },
];

export function LinearRegressionLossPage() { return <LinearRegressionProvider><ModuleShell title="线性回归与损失函数" subtitle="从高尔顿的父母与孩子身高数据出发，亲手拟合一条直线，再用损失衡量它有多可靠。" shellClassName="lr-guide-shell"><LessonFlow steps={linearRegressionLossSteps} cueText="下一页已准备好，向下滚动继续" persistenceKey="linear-regression-loss-v2" /></ModuleShell></LinearRegressionProvider>; }
