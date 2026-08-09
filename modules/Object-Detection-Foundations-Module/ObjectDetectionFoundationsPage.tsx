import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import { BoundingBoxRepresentationBlock } from './blocks/BoundingBoxRepresentationBlock';
import { IouMatchingBlock } from './blocks/IouMatchingBlock';
import { NonMaximumSuppressionBlock } from './blocks/NonMaximumSuppressionBlock';
import { MultiScaleDetectionBlock } from './blocks/MultiScaleDetectionBlock';
import { DetectionPipelineBridgeBlock } from './blocks/DetectionPipelineBridgeBlock';
import { ObjectDetectionFoundationsLessonFooter } from './blocks/ObjectDetectionFoundationsLessonFooter';
import './object-detection-foundations.css';

const lessonSteps: LessonFlowStep[] = [
  {
    id: 'detection-bounding-box-representation-v1',
    render: ({ complete }) => <BoundingBoxRepresentationBlock onComplete={complete} />,
  },
  {
    id: 'detection-iou-matching-v1',
    revealMode: 'cue',
    render: ({ complete }) => <IouMatchingBlock onComplete={complete} />,
  },
  {
    id: 'detection-nms-v1',
    revealMode: 'cue',
    render: ({ complete }) => <NonMaximumSuppressionBlock onComplete={complete} />,
  },
  {
    id: 'detection-multiscale-v1',
    revealMode: 'cue',
    completesLesson: true,
    render: ({ complete }) => <MultiScaleDetectionBlock onComplete={complete} />,
  },
  {
    id: 'detection-foundations-ending-v1',
    revealMode: 'scroll',
    render: () => (
      <>
        <DetectionPipelineBridgeBlock />
        <ObjectDetectionFoundationsLessonFooter />
      </>
    ),
  },
];

export function ObjectDetectionFoundationsPage() {
  return (
    <ModuleShell
      className="object-detection-foundations-module"
      title="一张图里有很多目标，模型怎样找到它们？"
      subtitle="从边界框表示、IoU 匹配，到 NMS 去重和多尺度检测。"
      badge="计算机视觉 · 第二课"
    >
      <LessonFlow
        steps={lessonSteps}
        persistenceKey="object-detection-foundations-v1"
        cueText="这一关已经通过，继续处理下一批候选框"
      />
    </ModuleShell>
  );
}
