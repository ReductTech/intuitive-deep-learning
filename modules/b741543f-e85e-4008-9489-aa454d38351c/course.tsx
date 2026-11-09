import type { ReactNode } from 'react';
import type { LessonFlowRevealMode, LessonStepContext } from "@shuku/course-style/react";
import { RNNMemoryPage } from './pages/RNN/RNNMemoryPage';
import { RNNMarkovPage } from './pages/RNN/RNNMarkovPage';
import { RNNMarkovFormulaPage } from './pages/RNN/RNNMarkovFormulaPage';
import { RNNMemoryEvolutionPage } from './pages/RNN/RNNMemoryEvolutionPage';
import { RNNPredictionPage } from './pages/RNN/RNNPredictionPage';
import { RNNPredictionProcessPage } from './pages/RNN/RNNPredictionProcessPage';
import { RNNGradientPage } from './pages/RNN/RNNGradientPage';
import { RNNGradientLimitsPage } from './pages/RNN/RNNGradientLimitsPage';
import { RNNSequencePage } from './pages/RNN/RNNSequencePage';
import { RNNTextToNumbersPage } from './pages/RNN/RNNTextToNumbersPage';
import { RNNUnfoldingPage } from './pages/RNN/RNNUnfoldingPage';
import { RNNMatrixComputationPage } from './pages/RNN/RNNMatrixComputationPage';
import { RNNWeatherRulePage } from './pages/RNN/RNNWeatherRulePage';

export interface NaiveRnnCourseItem {
  id: string;
  title: string;
  section: string;
  revealMode: LessonFlowRevealMode;
  component: (context: LessonStepContext) => ReactNode;
}

export const naiveRnnCourse: NaiveRnnCourseItem[] = [
  {
    id: '748895e3-eeb1-4c03-b24c-9e6ae6c32bfd',
    title: '问题一 · 记忆：同一个词，为什么会有不同的意思？',
    section: '朴素 RNN · 从问题出发',
    revealMode: 'cue',
    component: (context) => <RNNMemoryPage onComplete={context.complete} />,
  },
  {
    id: '1a53a896-2bdd-47ef-a63f-ed9ba5e863be',
    title: '问题二 · 预测：读到这里，下一个字符最可能是什么？',
    section: '朴素 RNN · 从问题出发',
    revealMode: 'cue',
    component: (context) => <RNNPredictionPage onComplete={context.complete} />,
  },
  {
    id: '24078797-bc07-4d57-b9b1-8c86bc4476ae',
    title: '文本预处理：机器怎样“读懂”一段文本？',
    section: '朴素 RNN · 从问题出发',
    revealMode: 'cue',
    component: (context) => <RNNTextToNumbersPage onComplete={context.complete} />,
  },
  {
    id: 'e68f33a7-a92b-40dc-b423-652bd665ac3a',
    title: '记忆的研究对象：序列',
    section: '朴素 RNN · 从问题出发',
    revealMode: 'cue',
    component: (context) => <RNNSequencePage onComplete={context.complete} />,
  },
  {
    id: '503120f5-e1de-4f14-800d-c54427aa2b81',
    title: '马尔可夫链：它是什么，怎么算？',
    section: '朴素 RNN · 从问题出发',
    revealMode: 'cue',
    component: (context) => <RNNMarkovFormulaPage onComplete={context.complete} />,
  },
  {
    id: '1afa7f9e-1f56-44de-8a85-947f24556c90',
    title: '马尔可夫链的局限：它只记得上一步',
    section: '朴素 RNN · 从问题出发',
    revealMode: 'cue',
    component: (context) => <RNNMarkovPage onComplete={context.complete} />,
  },
  {
    id: '33103210-01a5-460c-94e2-54627c7cb729',
    title: '新规则：还要看天气',
    section: '朴素 RNN · 从问题出发',
    revealMode: 'cue',
    component: (context) => <RNNWeatherRulePage onComplete={context.complete} />,
  },
  {
    id: '6ece92f6-a1a3-476b-ad37-463aa7989fd1',
    title: 'RNN 如何获得记忆？',
    section: '朴素 RNN · 循环计算',
    revealMode: 'cue',
    component: (context) => <RNNMemoryEvolutionPage onComplete={context.complete} />,
  },
  {
    id: 'c57f1d58-73b4-4a89-824b-1b73e186ce72',
    title: 'RNN 如何预测下一步？',
    section: '朴素 RNN · 预测',
    revealMode: 'cue',
    component: (context) => <RNNUnfoldingPage onComplete={context.complete} />,
  },
  {
    id: '9add22d9-598b-44be-8518-393635edaee7',
    title: '把实例带入具体计算',
    section: '朴素 RNN · 预测',
    revealMode: 'cue',
    component: (context) => <RNNMatrixComputationPage onComplete={context.complete} />,
  },
  {
    id: '850143f2-cd57-45ec-ac39-08e25d7b8b89',
    title: '同一套计算，怎样一步步预测？',
    section: '朴素 RNN · 预测',
    revealMode: 'cue',
    component: (context) => <RNNPredictionProcessPage onComplete={context.complete} />,
  },
  {
    id: '44e3e0b2-a230-4b5a-a55a-b978af597ae7',
    title: '梯度下降',
    section: '朴素 RNN · 训练',
    revealMode: 'cue',
    component: (context) => <RNNGradientPage onComplete={context.complete} />,
  },
  {
    id: 'f2e5e2c9-8f77-4d1c-8b17-850a5af1c756',
    title: '梯度爆炸与梯度消失',
    section: '朴素 RNN · 训练',
    revealMode: 'cue',
    component: (context) => <RNNGradientLimitsPage onComplete={context.complete} />,
  },
];
