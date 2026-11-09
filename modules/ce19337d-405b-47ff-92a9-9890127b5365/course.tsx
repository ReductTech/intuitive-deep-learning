import type { ReactNode } from 'react';
import type { LessonFlowRevealMode, LessonStepContext } from "@shuku/course-style/react";
import { PhotoStudioOpeningPage } from './pages/PhotoStudioOpeningPage/PhotoStudioOpeningPage';
import { GenerationNotRecognitionPage } from './pages/GenerationNotRecognitionPage/GenerationNotRecognitionPage';
import { DistributionViewPage } from './pages/DistributionViewPage/DistributionViewPage';
import { ConditionalSamplingPage } from './pages/ConditionalSamplingPage/ConditionalSamplingPage';
import { TrainingObjectivePage } from './pages/TrainingObjectivePage/TrainingObjectivePage';
import { TwoProcessesPage } from './pages/TwoProcessesPage/TwoProcessesPage';
import { ForwardDerivationPage, ForwardNoiseMergePage, ForwardDirectSamplingPage } from './pages/ForwardDerivationPage/ForwardDerivationPage';
import { ReverseTrainingPathPage } from './pages/ReverseTrainingPathPage/ReverseTrainingPathPage';
import { ReverseInferencePage } from './pages/ReverseInferencePage/ReverseInferencePage';
import { GanOverviewPage } from './pages/GanOverviewPage/GanOverviewPage';
import { GanGeneratorPage } from './pages/GanGeneratorPage/GanGeneratorPage';
import { GanDiscriminatorPage } from './pages/GanDiscriminatorPage/GanDiscriminatorPage';
import { GanTrainingPage } from './pages/GanTrainingPage/GanTrainingPage';
import { GanGeneratorTrainingPage } from './pages/GanTrainingPage/GanGeneratorTrainingPage';
import { GanAlternatingTrainingPage } from './pages/GanTrainingPage/GanAlternatingTrainingPage';
import { GanPlaygroundPage } from './pages/GanPlaygroundPage/GanPlaygroundPage';
import { DiffusionPlaygroundPage, ForwardDiffusionPlaygroundPage } from './pages/DiffusionPlaygroundPage/DiffusionPlaygroundPage';

import './sharedPage.css';

export interface VisualGenerationCourseItem {
  id: string;
  title: string;
  section: string;
  revealMode: LessonFlowRevealMode;
  component: (context: LessonStepContext) => ReactNode;
  advanceLabel?: string;
  showInBlog?: boolean;
  showInPpt?: boolean;
}

export const visualGenerationCourse: VisualGenerationCourseItem[] = [
  {
    id: '2807c354-b7a0-4e4c-b59f-4067ebbbd5bf',
    title: '没有相机的摄影师',
    section: '视觉生成的起点',
    revealMode: 'cue',
    component: (context) => <PhotoStudioOpeningPage onComplete={context.complete} />,
  },
  {
    id: 'f3ccfcf3-3153-4428-9877-dedc752ce5e3',
    title: '视觉理解与视觉生成，学习方向正好相反',
    section: '视觉生成的起点',
    revealMode: 'scroll',
    advanceLabel: '继续：理解图像分布',
    component: () => <GenerationNotRecognitionPage />,
  },
  {
    id: 'e6922032-cae8-40e1-ad69-0afee1e7d1d9',
    title: '什么样的图像，更可能出现在真实世界中？',
    section: '视觉生成的起点',
    revealMode: 'cue',
    component: (context) => <DistributionViewPage onComplete={context.complete} />,
  },
  {
    id: '5adea822-66b4-4ed2-aba6-a09debdcb59d',
    title: '条件如何改变生成结果的概率分布？',
    section: '视觉生成的起点',
    revealMode: 'cue',
    component: (context) => <ConditionalSamplingPage onComplete={context.complete} />,
  },
  {
    id: '7aa0ffb1-7365-499e-a97a-0dbde852e458',
    title: '生成模型到底在训练什么？',
    section: '生成模型的训练目标',
    revealMode: 'cue',
    component: (context) => <TrainingObjectivePage onComplete={context.complete} />,
  },
  {
    id: '044188e6-81e8-4b3c-a4bb-e0df3faf0a00',
    title: 'GAN：生成器造样本，判别器辨真假',
    section: 'GAN 的生成与判别',
    revealMode: 'cue',
    component: (context) => <GanOverviewPage onComplete={context.complete} />,
  },
  {
    id: '0a44732e-d02c-455d-8d84-94efbdb66a31',
    title: 'GAN 生成器：从随机噪声到人脸',
    section: 'GAN 的生成与判别',
    revealMode: 'cue',
    component: (context) => <GanGeneratorPage onComplete={context.complete} />,
  },
  {
    id: '871a82ce-3682-4e98-85cd-a5153d4acb4e',
    title: 'GAN 判别器：图像真假判断流程',
    section: 'GAN 的生成与判别',
    revealMode: 'cue',
    component: (context) => <GanDiscriminatorPage onComplete={context.complete} />,
  },
  {
    id: '9bfa4ec4-f772-48c8-ab10-9a0487bdab84',
    title: '训练判别器 D：真图判真，生成图判假',
    section: 'GAN 的生成与判别',
    revealMode: 'cue',
    component: (context) => <GanTrainingPage onComplete={context.complete} />,
  },
  {
    id: '08f4129b-f3c6-4a47-b7af-1d6837a455a0',
    title: '训练生成器 G：让生成图获得高分',
    section: 'GAN 的生成与判别',
    revealMode: 'cue',
    component: (context) => <GanGeneratorTrainingPage onComplete={context.complete} />,
  },
  {
    id: 'a9ac3035-6d11-4b5a-b277-6d9d1381ea34',
    title: '交替训练：D 与 G 轮流更新',
    section: 'GAN 的生成与判别',
    revealMode: 'cue',
    component: (context) => <GanAlternatingTrainingPage onComplete={context.complete} />,
  },
  {
    id: '9a9d6ed4-b740-4b83-99e6-98668826c99b',
    title: '亲手训练一个 GAN',
    section: 'GAN 的生成与判别',
    revealMode: 'cue',
    component: (context) => <GanPlaygroundPage onComplete={context.complete} />,
  },
  {
    id: '34d05d94-2cf5-41ca-bc92-429a9685e7e4',
    title: 'Diffusion 的核心：先加噪，再学会逆转',
    section: 'Diffusion 的两条路径',
    revealMode: 'cue',
    component: (context) => <TwoProcessesPage onComplete={context.complete} />,
  },
  {
    id: 'e1ca2323-d171-498c-97f0-b19238371739',
    title: '前向加噪：从一次加噪到连续两次',
    section: '前向加噪的数学直觉',
    revealMode: 'cue',
    component: (context) => <ForwardDerivationPage onComplete={context.complete} />,
  },
  {
    id: '5f832085-2368-4ab2-a266-ae4d54c87ef8',
    title: '合并噪声：为什么两份可以变成一份？',
    section: '前向加噪的数学直觉',
    revealMode: 'cue',
    component: (context) => <ForwardNoiseMergePage onComplete={context.complete} />,
  },
  {
    id: '504bd442-74d1-43bd-94d9-adab40f0dc75',
    title: '直接采样：从原图得到第 t 步',
    section: '前向加噪的数学直觉',
    revealMode: 'cue',
    component: (context) => <ForwardDirectSamplingPage onComplete={context.complete} />,
  },
  {
    id: '6a60cd81-9e03-45ff-94dc-199be9067eee',
    title: '前向加噪实验：公式里的变量怎样变化？',
    section: '前向加噪的数学直觉',
    revealMode: 'cue',
    component: (context) => <ForwardDiffusionPlaygroundPage onComplete={context.complete} />,
  },
  {
    id: '421d9728-af0a-41d5-a1bc-13a5a7a1da63',
    title: '前向加噪，如何为反向去噪提供训练路径？',
    section: '反向去噪的训练路径',
    revealMode: 'cue',
    component: (context) => <ReverseTrainingPathPage onComplete={context.complete} />,
  },
  {
    id: 'ba2f3e81-8945-4217-b7d4-aadba10b967b',
    title: '图像生成：反向去噪怎样一步步发生？',
    section: '反向去噪的生成过程',
    revealMode: 'cue',
    component: (context) => <ReverseInferencePage onComplete={context.complete} />,
  },
  {
    id: '9e7352e0-a156-455a-ad7e-d734eb243949',
    title: '反向去噪实验：公式里的变量怎样变化？',
    section: 'Diffusion 交互实验',
    revealMode: 'cue',
    component: (context) => <DiffusionPlaygroundPage onComplete={context.complete} />,
  },
];
