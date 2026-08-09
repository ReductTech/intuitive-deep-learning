import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import { LabelPreservationBlock } from './blocks/LabelPreservationBlock';
import { AugmentationStrengthBlock } from './blocks/AugmentationStrengthBlock';
import { FineTuningMechanismBlock } from './blocks/FineTuningMechanismBlock';
import { TrainingStrategyBlock } from './blocks/TrainingStrategyBlock';
import { ImplementationBridgeBlock } from './blocks/ImplementationBridgeBlock';
import { ImageGeneralizationLessonFooter } from './blocks/ImageGeneralizationLessonFooter';
import './image-augmentation-finetuning.css';

const lessonSteps: LessonFlowStep[] = [
  {
    id: 'vision-label-preservation-v1',
    render: ({ complete }) => <LabelPreservationBlock onComplete={complete} />,
  },
  {
    id: 'vision-augmentation-strength-v1',
    revealMode: 'cue',
    render: ({ complete }) => <AugmentationStrengthBlock onComplete={complete} />,
  },
  {
    id: 'vision-finetuning-mechanism-v1',
    revealMode: 'cue',
    render: ({ complete }) => <FineTuningMechanismBlock onComplete={complete} />,
  },
  {
    id: 'vision-training-strategy-v1',
    revealMode: 'cue',
    completesLesson: true,
    render: ({ complete }) => <TrainingStrategyBlock onComplete={complete} />,
  },
  {
    id: 'vision-generalization-ending-v1',
    revealMode: 'scroll',
    render: () => (
      <>
        <ImplementationBridgeBlock />
        <ImageGeneralizationLessonFooter />
      </>
    ),
  },
];

export function ImageAugmentationFinetuningPage() {
  return (
    <ModuleShell
      className="vision-generalization-module"
      title="小数据也能训练好图像分类"
      subtitle="从标签保持的图像增广，到复用预训练模型的微调策略。"
      badge="计算机视觉 · 第一课"
    >
      <LessonFlow
        steps={lessonSteps}
        persistenceKey="image-augmentation-finetuning-v1"
        cueText="第一个判断完成，继续研究增广强度"
      />
    </ModuleShell>
  );
}
