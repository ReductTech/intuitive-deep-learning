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
    id: 'd4af3cf5-56ae-4416-a37f-bff6135f3701',
    title: '从五子棋开始认识卷积核',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <GomokuPlayPage onComplete={context.complete} />,
  },
  {
    id: '613473b0-4ca0-40e8-a7cb-9c22a1c334d9',
    title: '棋盘局部区域的数值表示',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <BoardAsNumbersPage onComplete={context.complete} />,
  },
  {
    id: '821bd225-32a3-43fb-95bb-01592ae8c50a',
    title: '棋形的局部匹配',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <WindowScanPage onComplete={context.complete} />,
  },
  {
    id: '301b37a7-6437-456c-9303-60ee58a997c9',
    title: '根据棋形调整模板',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <KernelDesignPage onComplete={context.complete} />,
  },
  {
    id: 'e2588c85-d33c-4c75-847a-7ffd2ebe8a15',
    title: '卷积核：从输入到输出',
    section: '认识卷积核',
    revealMode: 'cue',
    component: (context) => <KernelBasicsPage onComplete={context.complete} />,
  },
  {
    id: '2848ae86-2883-4ec5-9aa1-d5eeba19462f',
    title: '互相关与卷积',
    section: '认识卷积核',
    revealMode: 'cue',
    component: (context) => <CorrelationConvolutionPage onComplete={context.complete} />,
  },
  {
    id: '712b6f9a-f3ab-452c-bab6-d17b6aaa4d59',
    title: '权重决定局部响应',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <WeightedKernelPage />,
  },
  {
    id: 'd0a19997-6801-47ea-a944-df86ec282248',
    title: '一阶差分：从方向变化到梯度',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <GradientPage />,
  },
  {
    id: '92bde1d3-8bda-4ad5-924e-27921f70b148',
    title: '二阶差分：变化如何继续变化',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <SecondDifferencePage />,
  },
  {
    id: 'c7e22a75-de0c-43ec-ae64-37b1b4539b69',
    title: '从一阶差分到 Sobel',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <SobelConstructionPage />,
  },
  {
    id: 'a9e5067a-7abb-4388-a194-b681656d43d6',
    title: '从二阶差分到 Laplacian',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <LaplacianConstructionPage />,
  },
  {
    id: '2e2ff2d5-7239-4ae3-93af-f87b847c22fa',
    title: '卷积核工作台',
    section: '认识卷积核',
    revealMode: 'cue',
    component: () => <CommonKernelsPage />,
  },
  {
    id: '7ba1bc7f-0f25-472b-91f5-c4f8f2a6712d',
    title: '稀疏连接：为什么参数更少？',
    section: '卷积的性质',
    revealMode: 'scroll',
    component: () => <SparseConnectivityPage />,
  },
  {
    id: '49fe1fe1-29b7-4c3d-9baf-3198090d15bc',
    title: '权重共享：同一套权重反复使用',
    section: '卷积的性质',
    revealMode: 'scroll',
    component: () => <WeightSharingPage />,
  },
  {
    id: '2321f6e2-04c8-499e-8b54-f9a837f9b281',
    title: '平移等变性',
    section: '卷积的性质',
    revealMode: 'scroll',
    component: () => <TranslationEquivariancePage />,
  },
  {
    id: 'dc2d232d-8d7d-41ef-bafc-bc4c408e1d38',
    title: '卷积核的堆叠与感受野',
    section: '卷积的性质',
    revealMode: 'cue',
    component: () => <ReceptiveFieldPage />,
  },
  {
    id: '3a561016-ec2f-43c9-a2bc-bc682a1608be',
    title: 'Kernel size：卷积核有多大？',
    section: '输出尺寸',
    revealMode: 'cue',
    component: () => <KernelSizePage />,
  },
  {
    id: '3f531ba0-d55d-4987-b4af-6eadcacec4c9',
    title: 'Stride：卷积核每次移动几格？',
    section: '输出尺寸',
    revealMode: 'cue',
    component: () => <StridePage />,
  },
  {
    id: '580280f9-6609-4c4a-a7f7-e1d9ff2eb7b4',
    title: 'Padding：让边缘也参与计算',
    section: '输出尺寸',
    revealMode: 'cue',
    component: () => <PaddingPage />,
  },
  {
    id: '038ffb1b-021b-4038-a486-09bc9c03c1d0',
    title: 'RGB 多通道卷积',
    section: '多通道卷积',
    revealMode: 'scroll',
    component: () => <RgbConvolutionPage />,
  },
  {
    id: 'a815febb-6e0f-4180-a2dc-aaf409e85e45',
    title: '多核卷积：卷积核数量决定输出深度',
    section: '多通道卷积',
    revealMode: 'scroll',
    component: () => <MultiKernelPage />,
  },
  {
    id: '91770002-4829-404c-a1ca-47f8703d7ac7',
    title: '空洞卷积',
    section: '卷积扩展',
    revealMode: 'scroll',
    component: () => <DilatedConvolutionPage />,
  },
  {
    id: '150b9aa8-f4e4-41bb-841f-22166cf85e40',
    title: '可变形卷积',
    section: '卷积扩展',
    revealMode: 'scroll',
    component: () => <DeformableConvolutionPage />,
  },
  {
    id: 'aed17285-224f-455d-b5f1-c6edcdad2c30',
    title: '本节完成：卷积核',
    section: '课程结尾',
    revealMode: 'immediate',
    component: () => <ConvolutionLessonEndingPage />,
  },
];
