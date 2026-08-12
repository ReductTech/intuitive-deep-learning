import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import './neuron-guide-react.css';
import { BiasThresholdTheoryBlock } from './blocks/BiasThresholdTheoryBlock';
import { BiologicalNeuronBlock } from './blocks/BiologicalNeuronBlock';
import { ExtraInputsBlock } from './blocks/ExtraInputsBlock';
import { NematodeResponseBlock } from './blocks/NematodeResponseBlock';
import { NeuronDecisionBridgeBlock } from './blocks/NeuronDecisionBridgeBlock';
import { SignalDiscoveryBlock } from './blocks/SignalDiscoveryBlock';
import { WeightedSumBlock } from './blocks/WeightedSumBlock';
import { WeightedContributionTheoryBlock } from './blocks/WeightedContributionTheoryBlock';
import { NeuronCompletionBlock, NeuronLessonFooter } from './blocks/NeuronLessonFooter';
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
  { id: 'neuron-bias-threshold-theory-v3', revealMode: 'scroll', render: ({ complete, isComplete }) => <LectureAdvanceCue complete={isComplete} onContinue={complete}><BiasThresholdTheoryBlock /></LectureAdvanceCue> },
  { id: 'neuron-completion-v1', revealMode: 'scroll', render: ({ complete, isComplete }) => <LectureAdvanceCue complete={isComplete} onContinue={complete}><NeuronCompletionBlock /></LectureAdvanceCue> },
  { id: 'neuron-lesson-footer-v1', revealMode: 'immediate', render: () => <NeuronLessonFooter /> },
];

export function ExpandedNeuronGuidePage() {
  return (
    <NeuronLessonProvider>
      <ModuleShell
        title="认识人工神经元"
        subtitle="从秀丽隐杆线虫的刺激反应出发，逐步建立输入、权重、加权和与偏置的数学模型。"
        shellClassName="ng-react-shell"
      >
        <LessonFlow steps={expandedNeuronGuideLessonSteps} persistenceKey="neuron-guide-expanded-v5" />
      </ModuleShell>
    </NeuronLessonProvider>
  );
}
