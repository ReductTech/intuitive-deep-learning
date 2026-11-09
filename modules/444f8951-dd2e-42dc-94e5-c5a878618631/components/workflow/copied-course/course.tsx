import type { ReactNode } from 'react';
import { CourseEndingPage, type LessonFlowRevealMode, type LessonStepContext } from "@shuku/course-style/react";
import { GomokuPlayPage } from './pages/GomokuPlayPage/GomokuPlayPage';
import { BoardAsNumbersPage } from './pages/BoardAsNumbersPage/BoardAsNumbersPage';
import { WindowScanPage } from './pages/WindowScanPage/WindowScanPage';
import { KernelDesignPage } from './pages/KernelDesignPage/KernelDesignPage';
import { KernelBasicsPage } from './pages/KernelBasicsPage/KernelBasicsPage';
import { CorrelationConvolutionPage } from './pages/CorrelationConvolutionPage/CorrelationConvolutionPage';
import { WeightedKernelPage } from './pages/WeightedKernelPage/WeightedKernelPage';
import { GradientPage } from './pages/GradientPage/GradientPage';
import { SecondDifferencePage } from './pages/SecondDifferencePage/SecondDifferencePage';
import { SobelConstructionPage } from './pages/SobelConstructionPage/SobelConstructionPage';
import { LaplacianConstructionPage } from './pages/LaplacianConstructionPage/LaplacianConstructionPage';
import { CommonKernelsPage } from './pages/CommonKernelsPage/CommonKernelsPage';
import { TranslationEquivariancePage } from './pages/TranslationEquivariancePage/TranslationEquivariancePage';
import { SparseConnectivityPage } from './pages/SparseConnectivityPage/SparseConnectivityPage';
import { WeightSharingPage } from './pages/WeightSharingPage/WeightSharingPage';
import { KernelSizePage } from './pages/KernelSizePage/KernelSizePage';
import { StridePage } from './pages/StridePage/StridePage';
import { PaddingPage } from './pages/PaddingPage/PaddingPage';
import { RgbConvolutionPage } from './pages/RgbConvolutionPage/RgbConvolutionPage';
import { MultiKernelPage } from './pages/MultiKernelPage/MultiKernelPage';
import { ReceptiveFieldPage } from './pages/ReceptiveFieldPage/ReceptiveFieldPage';
import { DilatedConvolutionPage } from './pages/DilatedConvolutionPage/DilatedConvolutionPage';
import { DeformableConvolutionPage } from './pages/DeformableConvolutionPage/DeformableConvolutionPage';

export interface ConvolutionCourseItem {
  id: string;
  title: string;
  section: string;
  revealMode: LessonFlowRevealMode;
  component: (context: LessonStepContext) => ReactNode;
  advanceLabel?: string;
  showInBlog?: boolean;
  showInPpt?: boolean;
}

function ConvolutionLessonEndingPage() {
  return <CourseEndingPage
    pageKey="creator-guide-copied-convolution-ending"
    title="卷积核：从局部响应到特征提取"
    summary="你从棋盘上的局部形状出发，理解卷积核如何扫描输入、产生响应，并通过权重共享提取特征。"
    topics={['局部响应', '卷积核', '特征图', '感受野']}
    resources={[
      { title: '从“卷积”到卷积神经网络', description: '梳理“卷积”一词从数学运算到卷积神经网络的含义变化。', embedUrl: 'https://player.bilibili.com/player.html?isOutside=true&aid=418492547&bvid=BV1VV411478E&cid=353587154&p=1' },
      { title: '那么，什么是卷积？', description: '用直观的方式理解卷积运算的基本思想。', embedUrl: 'https://player.bilibili.com/player.html?isOutside=true&aid=391585555&bvid=BV1Vd4y1e7pj&cid=931763043&p=1' },
      { title: '卷积神经网络动画', description: '通过动画观察卷积神经网络如何处理图像。', embedUrl: 'https://player.bilibili.com/player.html?isOutside=true&aid=486552336&bvid=BV16N411y7cV&cid=1140750257&p=1' },
    ]}
    resourceHeading="回顾与延伸"
  />;
}

export const convolutionCourse: ConvolutionCourseItem[] = [
  {
    id: '2f973013-a68b-41b8-a60a-d7a2ce638425',
    title: '从五子棋开始认识卷积核',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <GomokuPlayPage onComplete={context.complete} />,
  },
  {
    id: '8c1957ca-507e-46b7-90ea-19967ee71ef8',
    title: '棋盘局部区域的数值表示',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <BoardAsNumbersPage onComplete={context.complete} />,
  },
  {
    id: '8973b376-0795-4b82-9fc6-eb88c3daa262',
    title: '棋形的局部匹配',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <WindowScanPage onComplete={context.complete} />,
  },
  {
    id: 'eef2860e-bea5-4d68-ac93-f97f46d64084',
    title: '根据棋形调整模板',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <KernelDesignPage onComplete={context.complete} />,
  },
  {
    id: '3ec04139-a69d-40d5-bc21-65ae9515d45d',
    title: '卷积核：从输入到输出',
    section: '认识卷积核',
    revealMode: 'cue',
    component: (context) => <KernelBasicsPage onComplete={context.complete} />,
  },
  {
    id: '1702746b-6046-4089-921a-5d75d8610f1e',
    title: '互相关与卷积',
    section: '认识卷积核',
    revealMode: 'cue',
    component: (context) => <CorrelationConvolutionPage onComplete={context.complete} />,
  },
  {
    id: '8457458a-24c5-4741-9bfc-e96d180dc724',
    title: '权重决定局部响应',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <WeightedKernelPage />,
  },
  {
    id: '35a00948-7bb1-4756-b144-aa8bdcb0723d',
    title: '一阶差分：从方向变化到梯度',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <GradientPage />,
  },
  {
    id: '1279a8bb-aa0c-41a3-94fa-f2e0f16329c7',
    title: '二阶差分：变化如何继续变化',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <SecondDifferencePage />,
  },
  {
    id: '1c44ca0c-2dba-4aeb-bc74-2eef9b368a70',
    title: '从一阶差分到 Sobel',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <SobelConstructionPage />,
  },
  {
    id: '55ca9e6b-c8f9-4560-b7da-3811613e8d55',
    title: '从二阶差分到 Laplacian',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <LaplacianConstructionPage />,
  },
  {
    id: 'e40c9a4a-0fbe-47a8-8cae-88065413fbdc',
    title: '卷积核工作台',
    section: '认识卷积核',
    revealMode: 'cue',
    component: () => <CommonKernelsPage />,
  },
  {
    id: '1d2f6171-3d9c-465d-9d94-b54582dd301e',
    title: '稀疏连接：为什么参数更少？',
    section: '卷积的性质',
    revealMode: 'scroll',
    component: () => <SparseConnectivityPage />,
  },
  {
    id: '9ea499c4-af11-4bed-9be4-d810ffaff0d8',
    title: '权重共享：同一套权重反复使用',
    section: '卷积的性质',
    revealMode: 'scroll',
    component: () => <WeightSharingPage />,
  },
  {
    id: 'fda31e36-2374-4e50-90e3-5550e682fb00',
    title: '平移等变性',
    section: '卷积的性质',
    revealMode: 'scroll',
    component: () => <TranslationEquivariancePage />,
  },
  {
    id: '2fd95ac5-81c2-4371-8419-2e3cc02ab4c9',
    title: '卷积核的堆叠与感受野',
    section: '卷积的性质',
    revealMode: 'cue',
    component: () => <ReceptiveFieldPage />,
  },
  {
    id: '9d6f6004-cf43-43e3-92b3-c7d70333a233',
    title: 'Kernel size：卷积核有多大？',
    section: '输出尺寸',
    revealMode: 'cue',
    component: () => <KernelSizePage />,
  },
  {
    id: '8db0d4b6-b103-42ce-8c93-626c7e64f228',
    title: 'Stride：卷积核每次移动几格？',
    section: '输出尺寸',
    revealMode: 'cue',
    component: () => <StridePage />,
  },
  {
    id: '36e7d8be-77bc-4b5e-b736-a47871beef91',
    title: 'Padding：让边缘也参与计算',
    section: '输出尺寸',
    revealMode: 'cue',
    component: () => <PaddingPage />,
  },
  {
    id: '28421a30-64aa-4cbd-9cc6-d4eb364e9ea6',
    title: 'RGB 多通道卷积',
    section: '多通道卷积',
    revealMode: 'scroll',
    component: () => <RgbConvolutionPage />,
  },
  {
    id: '3f75ae2b-6d99-4cc5-846e-182011392bf2',
    title: '多核卷积：卷积核数量决定输出深度',
    section: '多通道卷积',
    revealMode: 'scroll',
    component: () => <MultiKernelPage />,
  },
  {
    id: '17a81a57-3778-4f35-83ae-77e29781cc9e',
    title: '空洞卷积',
    section: '卷积扩展',
    revealMode: 'scroll',
    component: () => <DilatedConvolutionPage />,
  },
  {
    id: '46147536-eb42-4a35-934d-e6d1887a552f',
    title: '可变形卷积',
    section: '卷积扩展',
    revealMode: 'scroll',
    component: () => <DeformableConvolutionPage />,
  },
  {
    id: '0dd7965e-efe4-4e83-b07b-f04c071005c6',
    title: '本节完成：卷积核',
    section: '课程结尾',
    revealMode: 'immediate',
    component: () => <ConvolutionLessonEndingPage />,
  },
];
