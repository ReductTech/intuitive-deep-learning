import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import './neuron-guide-react.css';
import { ExtraInputsBlock } from './blocks/ExtraInputsBlock';
import { NeuronLessonFooter } from './blocks/NeuronLessonFooter';
import { SignalDiscoveryBlock } from './blocks/SignalDiscoveryBlock';
import { WeightedSumBlock } from './blocks/WeightedSumBlock';
import { NeuronLessonProvider } from './model/NeuronLessonContext';

export const neuronGuideLessonSteps: LessonFlowStep[] = [
  {
    id: 'neuron-decision-opening-v3',
    revealMode: 'cue',
    render: ({ complete }) => <SignalDiscoveryBlock onComplete={complete} />,
  },
  {
    id: 'neuron-single-signal-v3',
    revealMode: 'scroll',
    render: ({ complete }) => <WeightedSumBlock onComplete={complete} />,
  },
  {
    id: 'neuron-multi-signal-bias-v3',
    revealMode: 'cue',
    completesLesson: true,
    render: ({ complete }) => <ExtraInputsBlock onComplete={complete} />,
  },
  {
    id: 'neuron-ending-v3',
    revealMode: 'immediate',
    render: () => <NeuronLessonFooter />,
  },
];

export function NeuronGuidePage() {
  return (
    <NeuronLessonProvider>
      <ModuleShell
        title="认识神经元"
        subtitle="从一个真实决定出发，看多个输入如何经过权重与偏置，汇总成一个判断。"
        shellClassName="ng-react-shell"
      >
        <LessonFlow
          steps={neuronGuideLessonSteps}
          persistenceKey="neuron-guide-react-v3"
        />
      </ModuleShell>
    </NeuronLessonProvider>
  );
}
