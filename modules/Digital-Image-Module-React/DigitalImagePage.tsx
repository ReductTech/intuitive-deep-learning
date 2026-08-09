import {
  LessonFlow,
  ModuleShell,
  type LessonFlowStep,
} from '../shared/react';
import './digital-image-module-react.css';
import { ImageMatrixLabBlock } from './blocks/ImageMatrixLabBlock';
import { ObservationBlock } from './blocks/ObservationBlock';
import { ResourcesBlock } from './blocks/ResourcesBlock';
import { RgbColorLabBlock } from './blocks/RgbColorLabBlock';

const steps: LessonFlowStep[] = [
  {
    id: 'observe-pixels',
    revealMode: 'scroll',
    render: ({ complete, isComplete }) => (
      <ObservationBlock
        onComplete={complete}
        lessonStepComplete={isComplete}
      />
    ),
  },
  {
    id: 'mix-rgb',
    revealMode: 'scroll',
    render: ({ complete, isComplete }) => (
      <RgbColorLabBlock
        onComplete={complete}
        lessonStepComplete={isComplete}
      />
    ),
  },
  {
    id: 'split-image',
    revealMode: 'scroll',
    completesLesson: true,
    render: ({ complete, isComplete }) => (
      <ImageMatrixLabBlock
        onComplete={complete}
        lessonStepComplete={isComplete}
      />
    ),
  },
  {
    id: 'resources',
    revealMode: 'immediate',
    render: () => <ResourcesBlock />,
  },
];

export function DigitalImagePage() {
  return (
    <ModuleShell
      title="数字图像如何变成 RGB 矩阵"
      subtitle="先观察一张图，再把图片拆成计算机能读的三个数字表。"
      className="di-root di-react-root"
      shellClassName="di-shell di-react-shell"
    >
      <LessonFlow
        steps={steps}
        persistenceKey="digital-image-module-react"
      />
    </ModuleShell>
  );
}

