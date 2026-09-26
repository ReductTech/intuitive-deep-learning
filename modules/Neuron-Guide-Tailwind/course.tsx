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
import { NematodeXorPage } from './pages/NematodeXorPage/NematodeXorPage';
import { NeuronCompletionPage, NeuronLessonFooter } from './pages/NeuronLessonFooter/NeuronLessonFooter';
import { ShallowLinearPage } from './pages/ShallowLinearPage/ShallowLinearPage';
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
  moduleId: 'neuron-guide-tailwind',
  stateKey: 'activity:neuron-guide-tailwind-core-v1',
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
  { id: 'bias-natural-boundary', title: '矩阵计算之后，如何形成分类判断？', section: '最终判断', revealMode: 'scroll', component: () => <BiasNaturalBoundaryPage /> },
  { id: 'bias-threshold', title: '偏置如何调整分类阈值？', section: '最终判断', revealMode: 'cue', component: (c) => <BiasThresholdTheoryPage onComplete={c.complete} /> },
  { id: 'linear-shallow', title: '线性神经元的组合仍然是线性的', section: '线性网络', revealMode: 'cue', component: (c) => <ShallowLinearPage onComplete={c.complete} /> },
  { id: 'nematode-xor', title: '线性分类的边界：秀丽隐杆线虫的双侧刺激', section: '从线性到非线性', revealMode: 'cue', component: (c) => <NematodeXorPage onComplete={c.complete} /> },
  { id: 'relu-intro', title: '从线性计算到非线性响应', section: '激活函数', revealMode: 'cue', component: (c) => <ReluIntroPage onComplete={c.complete} /> },
  { id: 'relu-explanation', title: '认识线性整流单元', section: '激活函数', revealMode: 'scroll', advanceLabel: '继续：组合多个带有 ReLU 的神经元', component: () => <ReluExplanationPage /> },
  { id: 'relu-network', title: '组合多个带有 ReLU 的神经元，曲线继续弯折', section: '激活函数', revealMode: 'cue', component: (c) => <ReluNetworkPage onComplete={c.complete} /> },
  { id: 'relu-approximation', title: '足够多带有 ReLU 的神经元，就能逼近任意曲线', section: '激活函数', revealMode: 'cue', component: (c) => <ReluApproximationLabPage onComplete={c.complete} /> },
  { id: 'activation-catalog', title: '认识这些被广泛使用的激活函数', section: '激活函数', revealMode: 'scroll', component: () => <ActivationCatalogPage /> },
  { id: 'ending', title: '你已经搭出了一个人工神经元', section: '课程结尾', revealMode: 'scroll', component: () => <NeuronCompletionPage /> },
  { id: 'resources', title: '推荐资源', section: '课程结尾', revealMode: 'immediate', component: () => <NeuronLessonFooter /> },
];







