import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import { DetectionDatasetBlock } from './blocks/DetectionDatasetBlock';
import { SsdPredictionBlock } from './blocks/SsdPredictionBlock';
import { RcnnEvolutionBlock } from './blocks/RcnnEvolutionBlock';
import { DetectionModelChoiceBlock } from './blocks/DetectionModelChoiceBlock';
import { DetectionTrainingBridgeBlock } from './blocks/DetectionTrainingBridgeBlock';
import { DetectionModelsLessonFooter } from './blocks/DetectionModelsLessonFooter';
import './detection-models.css';

const lessonSteps: LessonFlowStep[] = [
  {
    id: 'detection-models-dataset-v1',
    render: ({ complete }) => <DetectionDatasetBlock onComplete={complete} />,
  },
  {
    id: 'detection-models-ssd-prediction-v1',
    revealMode: 'cue',
    render: ({ complete }) => <SsdPredictionBlock onComplete={complete} />,
  },
  {
    id: 'detection-models-rcnn-evolution-v1',
    revealMode: 'cue',
    render: ({ complete }) => <RcnnEvolutionBlock onComplete={complete} />,
  },
  {
    id: 'detection-models-choice-v1',
    revealMode: 'cue',
    completesLesson: true,
    render: ({ complete }) => <DetectionModelChoiceBlock onComplete={complete} />,
  },
  {
    id: 'detection-models-ending-v1',
    revealMode: 'scroll',
    render: () => (
      <>
        <DetectionTrainingBridgeBlock />
        <DetectionModelsLessonFooter />
      </>
    ),
  },
];

export function DetectionModelsPage() {
  return (
    <ModuleShell
      className="detection-models-module"
      title="数据已经标好了，检测模型怎样把目标找出来？"
      subtitle="从检测标签出发，理解 SSD 的单阶段多尺度预测与 R-CNN 系列的区域提议路线。"
      badge="计算机视觉 · 第三课"
    >
      <LessonFlow
        steps={lessonSteps}
        persistenceKey="detection-models-v1"
        cueText="标签准备好了，继续组装目标检测模型"
      />
    </ModuleShell>
  );
}
