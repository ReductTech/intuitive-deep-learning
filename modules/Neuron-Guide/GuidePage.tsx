import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import './pages/GuidePage.css';
import { NeuronLessonProvider } from './model/NeuronLessonContext';
import { neuronCourse } from './course';

export const neuronGuideLessonSteps: LessonFlowStep[] = neuronCourse
  .filter((item) => item.showInBlog !== false)
  .map(({ id, revealMode, component }) => ({ id, revealMode, render: component }));

export function GuidePage() {
  return (
    <NeuronLessonProvider>
      <ModuleShell
        title="认识人工神经元"
        subtitle="从秀丽隐杆线虫的刺激反应出发，逐步建立输入、权重、加权和与偏置的数学模型。"
        shellClassName="ng-guide-shell"
      >
        <LessonFlow steps={neuronGuideLessonSteps} persistenceKey="neuron-guide-expanded-v6" />
      </ModuleShell>
    </NeuronLessonProvider>
  );
}


