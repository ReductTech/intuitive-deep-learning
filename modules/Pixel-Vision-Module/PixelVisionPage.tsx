import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import { PixelTaskBlock } from './blocks/PixelTaskBlock';
import { SegmentationDataBlock } from './blocks/SegmentationDataBlock';
import { TransposedConvolutionBlock } from './blocks/TransposedConvolutionBlock';
import { FcnAssemblyBlock } from './blocks/FcnAssemblyBlock';
import { PixelVisionBridgeBlock } from './blocks/PixelVisionBridgeBlock';
import { PixelVisionLessonFooter } from './blocks/PixelVisionLessonFooter';
import './pixel-vision.css';

const lessonSteps: LessonFlowStep[] = [
  { id: 'pixel-vision-task-v1', render: ({ complete }) => <PixelTaskBlock onComplete={complete} /> },
  { id: 'pixel-vision-data-v1', revealMode: 'cue', render: ({ complete }) => <SegmentationDataBlock onComplete={complete} /> },
  { id: 'pixel-vision-transposed-v1', revealMode: 'cue', render: ({ complete }) => <TransposedConvolutionBlock onComplete={complete} /> },
  { id: 'pixel-vision-fcn-v1', revealMode: 'cue', completesLesson: true, render: ({ complete }) => <FcnAssemblyBlock onComplete={complete} /> },
  { id: 'pixel-vision-ending-v1', revealMode: 'scroll', render: () => <><PixelVisionBridgeBlock /><PixelVisionLessonFooter /></> },
];

export function PixelVisionPage() {
  return (
    <ModuleShell className="pixel-vision-module" title="怎样让模型看懂图像中的每一个像素？" subtitle="从语义分割标签出发，理解同步裁剪、转置卷积上采样与全卷积网络。" badge="计算机视觉 · 第四课">
      <LessonFlow steps={lessonSteps} persistenceKey="pixel-vision-v1" cueText="输出粒度已经厘清，继续准备像素级训练数据" />
    </ModuleShell>
  );
}
