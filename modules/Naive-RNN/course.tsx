import type { ReactNode } from 'react';
import type { LessonFlowRevealMode, LessonStepContext } from '../shared/react';
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
    id: 'rnn-memory',
    title: '问题一 · 记忆：同一个词，为什么会有不同的意思？',
    section: '朴素 RNN · 从问题出发',
    revealMode: 'cue',
    component: (context) => <RNNMemoryPage onComplete={context.complete} />,
  },
  {
    id: 'rnn-prediction',
    title: '问题二 · 预测：读到这里，下一个字符最可能是什么？',
    section: '朴素 RNN · 从问题出发',
    revealMode: 'cue',
    component: (context) => <RNNPredictionPage onComplete={context.complete} />,
  },
  {
    id: 'rnn-text-to-numbers',
    title: '文本预处理：机器怎样“读懂”一段文本？',
    section: '朴素 RNN · 从问题出发',
    revealMode: 'cue',
    component: (context) => <RNNTextToNumbersPage onComplete={context.complete} />,
  },
  {
    id: 'rnn-why-sequences',
    title: '记忆的研究对象：序列',
    section: '朴素 RNN · 从问题出发',
    revealMode: 'cue',
    component: (context) => <RNNSequencePage onComplete={context.complete} />,
  },
  {
    id: 'rnn-markov-formula',
    title: '马尔可夫链：它是什么，怎么算？',
    section: '朴素 RNN · 从问题出发',
    revealMode: 'cue',
    component: (context) => <RNNMarkovFormulaPage onComplete={context.complete} />,
  },
  {
    id: 'rnn-markov-limit',
    title: '马尔可夫链的局限：它只记得上一步',
    section: '朴素 RNN · 从问题出发',
    revealMode: 'cue',
    component: (context) => <RNNMarkovPage onComplete={context.complete} />,
  },
  {
    id: 'rnn-weather-rule',
    title: '新规则：还要看天气',
    section: '朴素 RNN · 从问题出发',
    revealMode: 'cue',
    component: (context) => <RNNWeatherRulePage onComplete={context.complete} />,
  },
  {
    id: 'rnn-memory-evolution',
    title: 'RNN 如何获得记忆？',
    section: '朴素 RNN · 循环计算',
    revealMode: 'cue',
    component: (context) => <RNNMemoryEvolutionPage onComplete={context.complete} />,
  },
  {
    id: 'rnn-unfolding',
    title: 'RNN 如何预测下一步？',
    section: '朴素 RNN · 预测',
    revealMode: 'cue',
    component: (context) => <RNNUnfoldingPage onComplete={context.complete} />,
  },
  {
    id: 'rnn-matrix-computation',
    title: '把实例带入具体计算',
    section: '朴素 RNN · 预测',
    revealMode: 'cue',
    component: (context) => <RNNMatrixComputationPage onComplete={context.complete} />,
  },
  {
    id: 'rnn-prediction-process',
    title: '同一套计算，怎样一步步预测？',
    section: '朴素 RNN · 预测',
    revealMode: 'cue',
    component: (context) => <RNNPredictionProcessPage onComplete={context.complete} />,
  },
  {
    id: 'rnn-gradient',
    title: '梯度下降',
    section: '朴素 RNN · 训练',
    revealMode: 'cue',
    component: (context) => <RNNGradientPage onComplete={context.complete} />,
  },
  {
    id: 'rnn-gradient-limits',
    title: '梯度爆炸与梯度消失',
    section: '朴素 RNN · 训练',
    revealMode: 'cue',
    component: (context) => <RNNGradientLimitsPage onComplete={context.complete} />,
  },
];
