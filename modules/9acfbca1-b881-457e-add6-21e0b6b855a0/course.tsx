import type { ReactNode } from 'react';
import { LessonFlowRevealMode, LessonStepContext } from "@shuku/course-style/react";
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
  moduleId: 'neuron-guide',
  stateKey: 'activity:neuron-guide-core-v1',
  events: {
    decisionAnalyzed: 'neuron_decision_analyzed',
    importanceAccepted: 'neuron_weight_suggestion_accepted',
    inputValueChanged: 'neuron_input_value_changed',
  },
} as const;

export const neuronCourse: NeuronCourseItem[] = [
  { id: 'fea52098-c5d3-4984-a0d9-f5fc33afc04c', title: '只有 302 个神经元，它为什么能完成这么多行为？', section: '神经系统', revealMode: 'scroll', component: () => <NematodeResponsePage /> },
  { id: '857354e3-f094-4f24-9a7f-60a26de0abd9', title: '人工神经元，源自生物神经元', section: '生物学引入', revealMode: 'scroll', component: () => <BiologicalNeuronPage /> },
  { id: 'c9cf20c1-c6b7-4557-ad62-95744bb2e4f1', title: '一个神经元，只做一次简单判断', section: '从简单响应到复杂决策', revealMode: 'scroll', component: () => <NeuronDecisionBridgePage /> },
  { id: '79ba5443-37f6-4078-bcdc-ec46a6c760be', title: '让神经元帮你做一次判断', section: '输入信号', revealMode: 'cue', component: (c) => <SignalDiscoveryPage onComplete={c.complete} /> },
  { id: 'c8d01bb6-58b6-49a8-af2c-a8f3869bcddb', title: '把一个现实因素，翻译成神经元能处理的输入', section: '输入信号', revealMode: 'cue', component: (c) => <WeightedSumPage onComplete={c.complete} /> },
  { id: '9f6c7e39-a468-49e5-bb6e-8e12ae579c0a', title: '从一个因素，到三个因素', section: '输入信号', revealMode: 'cue', component: (c) => <ExtraInputsPage onComplete={c.complete} /> },
  { id: '8356ddee-4759-4942-97c4-4c8f635cf478', title: '从加权求和到矩阵表示', section: '矩阵形式', revealMode: 'scroll', component: () => <WeightedContributionTheoryPage /> },
  { id: 'bd19901c-3eee-460a-b5c0-e018632da031', title: '矩阵计算之后，如何形成分类判断？', section: '最终判断', revealMode: 'scroll', component: () => <BiasNaturalBoundaryPage /> },
  { id: 'cf503bad-5f03-4900-b771-d7200f06cfa9', title: '偏置如何调整分类阈值？', section: '最终判断', revealMode: 'cue', component: (c) => <BiasThresholdTheoryPage onComplete={c.complete} /> },
  { id: 'effd7148-7faa-40cc-9b94-2b75724edec3', title: '线性神经元的组合仍然是线性的', section: '线性网络', revealMode: 'cue', component: (c) => <ShallowLinearPage onComplete={c.complete} /> },
  { id: '52a2580d-1e72-4070-bec2-1a88fc0ef63c', title: '线性分类的边界：秀丽隐杆线虫的双侧刺激', section: '从线性到非线性', revealMode: 'cue', component: (c) => <NematodeXorPage onComplete={c.complete} /> },
  { id: '51f235bd-337d-43ea-bb0b-bc4636a6ceee', title: '从线性计算到非线性响应', section: '激活函数', revealMode: 'cue', component: (c) => <ReluIntroPage onComplete={c.complete} /> },
  { id: 'e8439e2b-a75c-4052-a47d-1e7ecbf82964', title: '认识线性整流单元', section: '激活函数', revealMode: 'scroll', advanceLabel: '继续：组合多个带有 ReLU 的神经元', component: () => <ReluExplanationPage /> },
  { id: '32a39382-9916-41c7-9da1-056d60ef9b33', title: '组合多个带有 ReLU 的神经元，曲线继续弯折', section: '激活函数', revealMode: 'cue', component: (c) => <ReluNetworkPage onComplete={c.complete} /> },
  { id: '1cc8cb8c-9a3a-400e-86b9-ceea46656e5e', title: '足够多带有 ReLU 的神经元，就能逼近任意曲线', section: '激活函数', revealMode: 'cue', component: (c) => <ReluApproximationLabPage onComplete={c.complete} /> },
  { id: '39d430a6-7a61-49cb-ab59-be18601f14b2', title: '认识这些被广泛使用的激活函数', section: '激活函数', revealMode: 'scroll', component: () => <ActivationCatalogPage /> },
  { id: 'e378a0e9-3c01-43ed-8de9-3d51fe3d9355', title: '你已经搭出了一个人工神经元', section: '课程结尾', revealMode: 'scroll', component: () => <NeuronCompletionPage /> },
  { id: '0ae5732b-f7a1-4bb7-a09c-8fbf1ad80599', title: '推荐资源', section: '课程结尾', revealMode: 'immediate', component: () => <NeuronLessonFooter /> },
];







