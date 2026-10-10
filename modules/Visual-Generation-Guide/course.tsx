import type { ReactNode } from 'react';
import type { LessonFlowRevealMode, LessonStepContext } from '../shared/react';
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
    id: 'photo-studio-opening',
    title: '没有相机的摄影师',
    section: '视觉生成的起点',
    revealMode: 'cue',
    component: (context) => <PhotoStudioOpeningPage onComplete={context.complete} />,
  },
  {
    id: 'generation-not-recognition',
    title: '视觉理解与视觉生成，学习方向正好相反',
    section: '视觉生成的起点',
    revealMode: 'scroll',
    advanceLabel: '继续：理解图像分布',
    component: () => <GenerationNotRecognitionPage />,
  },
  {
    id: 'distribution-view',
    title: '什么样的图像，更可能出现在真实世界中？',
    section: '视觉生成的起点',
    revealMode: 'cue',
    component: (context) => <DistributionViewPage onComplete={context.complete} />,
  },
  {
    id: 'conditional-sampling',
    title: '条件如何改变生成结果的概率分布？',
    section: '视觉生成的起点',
    revealMode: 'cue',
    component: (context) => <ConditionalSamplingPage onComplete={context.complete} />,
  },
  {
    id: 'training-objective',
    title: '生成模型到底在训练什么？',
    section: '生成模型的训练目标',
    revealMode: 'cue',
    component: (context) => <TrainingObjectivePage onComplete={context.complete} />,
  },
  {
    id: 'gan-overview',
    title: 'GAN：生成器造样本，判别器辨真假',
    section: 'GAN 的生成与判别',
    revealMode: 'cue',
    component: (context) => <GanOverviewPage onComplete={context.complete} />,
  },
  {
    id: 'gan-generator',
    title: 'GAN 生成器：从随机噪声到人脸',
    section: 'GAN 的生成与判别',
    revealMode: 'cue',
    component: (context) => <GanGeneratorPage onComplete={context.complete} />,
  },
  {
    id: 'gan-discriminator',
    title: 'GAN 判别器：图像真假判断流程',
    section: 'GAN 的生成与判别',
    revealMode: 'cue',
    component: (context) => <GanDiscriminatorPage onComplete={context.complete} />,
  },
  {
    id: 'gan-training',
    title: '训练判别器 D：真图判真，生成图判假',
    section: 'GAN 的生成与判别',
    revealMode: 'cue',
    component: (context) => <GanTrainingPage onComplete={context.complete} />,
  },
  {
    id: 'gan-generator-training',
    title: '训练生成器 G：让生成图获得高分',
    section: 'GAN 的生成与判别',
    revealMode: 'cue',
    component: (context) => <GanGeneratorTrainingPage onComplete={context.complete} />,
  },
  {
    id: 'gan-alternating-training',
    title: '交替训练：D 与 G 轮流更新',
    section: 'GAN 的生成与判别',
    revealMode: 'cue',
    component: (context) => <GanAlternatingTrainingPage onComplete={context.complete} />,
  },
  {
    id: 'gan-playground',
    title: '亲手训练一个 GAN',
    section: 'GAN 的生成与判别',
    revealMode: 'cue',
    component: (context) => <GanPlaygroundPage onComplete={context.complete} />,
  },
  {
    id: 'two-processes',
    title: 'Diffusion 的核心：先加噪，再学会逆转',
    section: 'Diffusion 的两条路径',
    revealMode: 'cue',
    component: (context) => <TwoProcessesPage onComplete={context.complete} />,
  },
  {
    id: 'closed-form-forward',
    title: '前向加噪：从一次加噪到连续两次',
    section: '前向加噪的数学直觉',
    revealMode: 'cue',
    component: (context) => <ForwardDerivationPage onComplete={context.complete} />,
  },
  {
    id: 'forward-noise-merge',
    title: '合并噪声：为什么两份可以变成一份？',
    section: '前向加噪的数学直觉',
    revealMode: 'cue',
    component: (context) => <ForwardNoiseMergePage onComplete={context.complete} />,
  },
  {
    id: 'forward-direct-sampling',
    title: '直接采样：从原图得到第 t 步',
    section: '前向加噪的数学直觉',
    revealMode: 'cue',
    component: (context) => <ForwardDirectSamplingPage onComplete={context.complete} />,
  },
  {
    id: 'forward-diffusion-playground',
    title: '前向加噪实验：公式里的变量怎样变化？',
    section: '前向加噪的数学直觉',
    revealMode: 'cue',
    component: (context) => <ForwardDiffusionPlaygroundPage onComplete={context.complete} />,
  },
  {
    id: 'reverse-training-path',
    title: '前向加噪，如何为反向去噪提供训练路径？',
    section: '反向去噪的训练路径',
    revealMode: 'cue',
    component: (context) => <ReverseTrainingPathPage onComplete={context.complete} />,
  },
  {
    id: 'reverse-inference',
    title: '图像生成：反向去噪怎样一步步发生？',
    section: '反向去噪的生成过程',
    revealMode: 'cue',
    component: (context) => <ReverseInferencePage onComplete={context.complete} />,
  },
  {
    id: 'diffusion-playground',
    title: '反向去噪实验：公式里的变量怎样变化？',
    section: 'Diffusion 交互实验',
    revealMode: 'cue',
    component: (context) => <DiffusionPlaygroundPage onComplete={context.complete} />,
  },
];
