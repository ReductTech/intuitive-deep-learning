import type { ReactNode } from 'react';
import type { LessonFlowRevealMode, LessonStepContext } from '../shared/react';
import { BiologicalNeuronPage } from './pages/BiologicalNeuronPage/BiologicalNeuronPage';
import { ExtraInputsPage } from './pages/ExtraInputsPage/ExtraInputsPage';
import { NematodeResponsePage } from './pages/NematodeResponsePage/NematodeResponsePage';
import { NeuronDecisionBridgePage } from './pages/NeuronDecisionBridgePage/NeuronDecisionBridgePage';
import { SignalDiscoveryPage } from './pages/SignalDiscoveryPage/SignalDiscoveryPage';
import { WeightedSumPage } from './pages/WeightedSumPage/WeightedSumPage';
import { WeightedContributionTheoryPage } from './pages/WeightedContributionTheoryPage/WeightedContributionTheoryPage';
import { BiasNaturalBoundaryPage, BiasThresholdTheoryPage } from './pages/BiasThresholdTheoryPage/BiasThresholdTheoryPage';
import { NeuronCompletionPage, NeuronLessonFooter } from './pages/NeuronLessonFooter/NeuronLessonFooter';
import { ShallowLinearPage } from './pages/ShallowLinearPage/ShallowLinearPage';
import { DeepLinearPage } from './pages/DeepLinearPage/DeepLinearPage';
import { ReluIntroPage } from './pages/ReluIntroPage/ReluIntroPage';
import { ReluExplanationPage } from './pages/ReluExplanationPage/ReluExplanationPage';
import { ReluNetworkPage } from './pages/ReluNetworkPage/ReluNetworkPage';
import { ReluApproximationLabPage } from './pages/ReluApproximationLabPage/ReluApproximationLabPage';
import { ActivationCatalogPage } from './pages/ActivationCatalogPage/ActivationCatalogPage';

export interface NeuronCourseItem {
  id: string;
  title: string;
  section: string;
  revealMode: LessonFlowRevealMode;
  component: (context: LessonStepContext) => ReactNode;
  advanceLabel?: string;
  /** Optional per-surface visibility; omitted means visible everywhere. */
  showInBlog?: boolean;
  showInPpt?: boolean;
}

export const lessonContextOptions = {
  moduleId: 'neuron-guide',
  stateKey: 'activity:neuron-guide-core-v3',
  events: {
    decisionAnalyzed: 'neuron_decision_analyzed',
    importanceAccepted: 'neuron_weight_suggestion_accepted',
    inputValueChanged: 'neuron_input_value_changed',
  },
} as const;

export const neuronCourse: NeuronCourseItem[] = [
  { id: 'nematode-response', title: '只有 302 个神经元，它为什么能完成这么多行为？', section: '神经系统', revealMode: 'scroll', component: () => <NematodeResponsePage /> },
  { id: 'biological-structure', title: '人工神经元，源自生物神经元', section: '生物学引入', revealMode: 'scroll', component: () => <BiologicalNeuronPage /> },
  { id: 'decision-bridge', title: '一个神经元，只做一次简单判断', section: '从简单响应到复杂决策', revealMode: 'scroll', component: () => <NeuronDecisionBridgePage /> },
  { id: 'signal-discovery', title: '让神经元帮你做一次判断', section: '输入信号', revealMode: 'cue', component: (c) => <SignalDiscoveryPage onComplete={c.complete} /> },
  { id: 'weighted-sum', title: '把一个现实因素，翻译成神经元能处理的输入', section: '输入信号', revealMode: 'cue', component: (c) => <WeightedSumPage onComplete={c.complete} /> },
  { id: 'extra-inputs', title: '从一个因素，到三个因素', section: '输入信号', revealMode: 'cue', component: (c) => <ExtraInputsPage onComplete={c.complete} /> },
  { id: 'weighted-contribution', title: '从加权求和到矩阵表示', section: '矩阵形式', revealMode: 'scroll', component: () => <WeightedContributionTheoryPage /> },
  { id: 'bias-natural-boundary', title: '0，为什么是天然的分类边界？', section: '最终判断', revealMode: 'scroll', component: () => <BiasNaturalBoundaryPage /> },
  { id: 'bias-threshold', title: '这道题的分界点，应该放在哪里？', section: '最终判断', revealMode: 'cue', component: (c) => <BiasThresholdTheoryPage onComplete={c.complete} /> },
  { id: 'linear-shallow', title: '多个线性神经元的叠加', section: '线性网络', revealMode: 'cue', component: (c) => <ShallowLinearPage onComplete={c.complete} /> },
  { id: 'linear-deep', title: '线性关系从直线扩展为平面', section: '线性网络', revealMode: 'cue', component: (c) => <DeepLinearPage onComplete={c.complete} /> },
  { id: 'relu-intro', title: '从线性计算到非线性响应', section: '激活函数', revealMode: 'cue', component: (c) => <ReluIntroPage onComplete={c.complete} /> },
  { id: 'relu-explanation', title: '认识线性整流单元', section: '激活函数', revealMode: 'scroll', advanceLabel: '继续：组合多个带有 ReLU 的神经元', component: () => <ReluExplanationPage /> },
  { id: 'relu-network', title: '组合多个带有 ReLU 的神经元，曲线继续弯折', section: '激活函数', revealMode: 'cue', component: (c) => <ReluNetworkPage onComplete={c.complete} /> },
  { id: 'relu-approximation', title: '足够多带有 ReLU 的神经元，就能逼近任意曲线', section: '激活函数', revealMode: 'cue', component: (c) => <ReluApproximationLabPage onComplete={c.complete} /> },
  { id: 'activation-catalog', title: '认识这些被广泛使用的激活函数', section: '激活函数', revealMode: 'scroll', component: () => <ActivationCatalogPage /> },
  { id: 'ending', title: '你已经搭出了一个人工神经元', section: '课程结尾', revealMode: 'scroll', component: () => <NeuronCompletionPage /> },
  { id: 'resources', title: '推荐资源', section: '课程结尾', revealMode: 'immediate', component: () => <NeuronLessonFooter /> },
];






