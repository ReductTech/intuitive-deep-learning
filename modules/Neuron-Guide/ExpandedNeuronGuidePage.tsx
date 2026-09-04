import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import './neuron-guide.css';
import { BiologicalNeuronBlock } from './blocks/BiologicalNeuronBlock';
import { ExtraInputsBlock } from './blocks/ExtraInputsBlock';
import { NematodeResponseBlock } from './blocks/NematodeResponseBlock';
import { NeuronDecisionBridgeBlock } from './blocks/NeuronDecisionBridgeBlock';
import { SignalDiscoveryBlock } from './blocks/SignalDiscoveryBlock';
import { WeightedSumBlock } from './blocks/WeightedSumBlock';
import { WeightedContributionTheoryBlock } from './blocks/WeightedContributionTheoryBlock';
import { BiasThresholdTheoryBlock } from './blocks/BiasThresholdTheoryBlock';
import { NeuronCompletionBlock, NeuronLessonFooter } from './blocks/NeuronLessonFooter';
import { ShallowLinearBlock } from './blocks/ShallowLinearBlock';
import { DeepLinearBlock } from './blocks/DeepLinearBlock';
import { ReluIntroBlock } from './blocks/ReluIntroBlock';
import { ReluExplanationBlock } from './blocks/ReluExplanationBlock';
import { ReluNetworkBlock } from './blocks/ReluNetworkBlock';
import { ReluApproximationLabBlock } from './blocks/ReluApproximationLabBlock';
import { ActivationCatalogBlock } from './blocks/ActivationCatalogBlock';
import { NeuronLessonProvider } from './model/NeuronLessonContext';
import { LectureAdvanceCue } from './components/LectureAdvanceCue';

export const expandedNeuronGuideLessonSteps: LessonFlowStep[] = [
  { id: 'neuron-nematode-response-v3', render: ({ complete, isComplete }) => <LectureAdvanceCue complete={isComplete} onContinue={complete}><NematodeResponseBlock /></LectureAdvanceCue> },
  { id: 'neuron-biological-structure-v3', revealMode: 'scroll', render: ({ complete, isComplete }) => <LectureAdvanceCue complete={isComplete} onContinue={complete}><BiologicalNeuronBlock /></LectureAdvanceCue> },
  { id: 'neuron-decision-bridge-v1', revealMode: 'scroll', render: ({ complete, isComplete }) => <LectureAdvanceCue complete={isComplete} onContinue={complete}><NeuronDecisionBridgeBlock /></LectureAdvanceCue> },
  { id: 'neuron-decision-opening-expanded-v1', revealMode: 'cue', render: ({ complete }) => <SignalDiscoveryBlock onComplete={complete} /> },
  { id: 'neuron-single-signal-expanded-v1', revealMode: 'cue', render: ({ complete }) => <WeightedSumBlock onComplete={complete} /> },
  { id: 'neuron-extra-inputs-v1', revealMode: 'cue', render: ({ complete }) => <ExtraInputsBlock onComplete={complete} /> },
  { id: 'neuron-vector-story-v1', revealMode: 'cue', render: ({ complete, isComplete }) => <LectureAdvanceCue complete={isComplete} onContinue={complete}><WeightedContributionTheoryBlock /></LectureAdvanceCue> },
  { id: 'neuron-bias-threshold-v1', revealMode: 'cue', render: ({ complete }) => <BiasThresholdTheoryBlock onComplete={complete} /> },
  { id: 'neuron-linear-shallow-v1', revealMode: 'cue', render: ({ complete }) => <ShallowLinearBlock onComplete={complete} /> },
  { id: 'neuron-linear-deep-v1', revealMode: 'cue', render: ({ complete }) => <DeepLinearBlock onComplete={complete} /> },
  { id: 'neuron-relu-intro-v1', revealMode: 'cue', render: ({ complete }) => <ReluIntroBlock onComplete={complete} /> },
  { id: 'neuron-relu-explanation-v1', revealMode: 'scroll', render: ({ complete, isComplete }) => <LectureAdvanceCue complete={isComplete} onContinue={complete} label="继续：组合多个带有 ReLU 的神经元"><ReluExplanationBlock /></LectureAdvanceCue> },
  { id: 'neuron-relu-network-v1', revealMode: 'cue', render: ({ complete }) => <ReluNetworkBlock onComplete={complete} /> },
  { id: 'neuron-relu-approximation-v1', revealMode: 'cue', render: ({ complete }) => <ReluApproximationLabBlock onComplete={complete} /> },
  { id: 'neuron-activation-catalog-v1', revealMode: 'scroll', render: ({ complete, isComplete }) => <LectureAdvanceCue complete={isComplete} onContinue={complete}><ActivationCatalogBlock /></LectureAdvanceCue> },
  { id: 'neuron-completion-v1', revealMode: 'scroll', render: ({ complete, isComplete }) => <LectureAdvanceCue complete={isComplete} onContinue={complete}><NeuronCompletionBlock /></LectureAdvanceCue> },
  { id: 'neuron-lesson-footer-v1', revealMode: 'immediate', render: () => <NeuronLessonFooter /> },
];

export function ExpandedNeuronGuidePage() {
  return (
    <NeuronLessonProvider>
      <ModuleShell
        title="认识人工神经元"
        subtitle="从秀丽隐杆线虫的刺激反应出发，逐步建立输入、权重、加权和与偏置的数学模型。"
        shellClassName="ng-guide-shell"
      >
        <LessonFlow steps={expandedNeuronGuideLessonSteps} persistenceKey="neuron-guide-expanded-v6" />
      </ModuleShell>
    </NeuronLessonProvider>
  );
}
