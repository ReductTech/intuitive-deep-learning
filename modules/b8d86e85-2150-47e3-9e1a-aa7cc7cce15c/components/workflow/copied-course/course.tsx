import type { ReactNode } from 'react';
import { CourseEndingPage, type LessonFlowRevealMode, type LessonStepContext } from '../../../../shared/react';
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
    pageKey="ai-practice-education-copied-convolution-ending"
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
    id: '31656ec4-19be-45e1-8465-465920796d1d',
    title: '从五子棋开始认识卷积核',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <GomokuPlayPage onComplete={context.complete} />,
  },
  {
    id: '16bb7ee8-f569-4e96-9fe9-cf482eeaf5a3',
    title: '棋盘局部区域的数值表示',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <BoardAsNumbersPage onComplete={context.complete} />,
  },
  {
    id: 'cc4b46b3-0e2e-4672-b255-4736dd0f66d5',
    title: '棋形的局部匹配',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <WindowScanPage onComplete={context.complete} />,
  },
  {
    id: 'c0126735-dc25-4465-838f-1f3c32d13934',
    title: '根据棋形调整模板',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <KernelDesignPage onComplete={context.complete} />,
  },
  {
    id: '662f59f0-1f99-44d6-9f9b-144b1c3a621b',
    title: '卷积核：从输入到输出',
    section: '认识卷积核',
    revealMode: 'cue',
    component: (context) => <KernelBasicsPage onComplete={context.complete} />,
  },
  {
    id: 'ad13052c-ddab-4b53-a68b-52495e0ae862',
    title: '互相关与卷积',
    section: '认识卷积核',
    revealMode: 'cue',
    component: (context) => <CorrelationConvolutionPage onComplete={context.complete} />,
  },
  {
    id: '82e1ec42-fc48-4bd8-a605-de7b9710283f',
    title: '权重决定局部响应',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <WeightedKernelPage />,
  },
  {
    id: '52c86175-fd4e-4730-89d0-d9ee04047db8',
    title: '一阶差分：从方向变化到梯度',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <GradientPage />,
  },
  {
    id: 'b98ca3a8-0ac2-4071-acbe-8dd204bf997e',
    title: '二阶差分：变化如何继续变化',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <SecondDifferencePage />,
  },
  {
    id: '2c465629-6094-46c7-bf5d-88d4687933be',
    title: '从一阶差分到 Sobel',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <SobelConstructionPage />,
  },
  {
    id: 'fe3a71e5-37c6-437c-8e04-06c96ae39395',
    title: '从二阶差分到 Laplacian',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <LaplacianConstructionPage />,
  },
  {
    id: '0747f3f7-bd95-4d0d-b522-b87a98a5adcd',
    title: '卷积核工作台',
    section: '认识卷积核',
    revealMode: 'cue',
    component: () => <CommonKernelsPage />,
  },
  {
    id: '729b5f8a-067a-4971-b8dd-aafb54948440',
    title: '稀疏连接：为什么参数更少？',
    section: '卷积的性质',
    revealMode: 'scroll',
    component: () => <SparseConnectivityPage />,
  },
  {
    id: 'c910ace7-463b-4d01-b801-3840e19042e5',
    title: '权重共享：同一套权重反复使用',
    section: '卷积的性质',
    revealMode: 'scroll',
    component: () => <WeightSharingPage />,
  },
  {
    id: 'e5b4b835-36e7-49ac-9f75-1c35cf2c6b98',
    title: '平移等变性',
    section: '卷积的性质',
    revealMode: 'scroll',
    component: () => <TranslationEquivariancePage />,
  },
  {
    id: '981524c8-05c1-424f-9958-26595da96f62',
    title: '卷积核的堆叠与感受野',
    section: '卷积的性质',
    revealMode: 'cue',
    component: () => <ReceptiveFieldPage />,
  },
  {
    id: '4012e010-65f8-466b-967e-e31a1097075d',
    title: 'Kernel size：卷积核有多大？',
    section: '输出尺寸',
    revealMode: 'cue',
    component: () => <KernelSizePage />,
  },
  {
    id: '6548d015-8f7e-4f6d-b8e5-7eebb4e70a13',
    title: 'Stride：卷积核每次移动几格？',
    section: '输出尺寸',
    revealMode: 'cue',
    component: () => <StridePage />,
  },
  {
    id: 'b72b5c51-162e-47d5-877a-d74bfe24b528',
    title: 'Padding：让边缘也参与计算',
    section: '输出尺寸',
    revealMode: 'cue',
    component: () => <PaddingPage />,
  },
  {
    id: 'efebaf8f-b284-47db-8c12-284a574d046e',
    title: 'RGB 多通道卷积',
    section: '多通道卷积',
    revealMode: 'scroll',
    component: () => <RgbConvolutionPage />,
  },
  {
    id: '4e8506b2-6f2a-4bea-b99f-9ee9eba6ad13',
    title: '多核卷积：卷积核数量决定输出深度',
    section: '多通道卷积',
    revealMode: 'scroll',
    component: () => <MultiKernelPage />,
  },
  {
    id: '4f76490e-10a4-450e-a3e8-1f4be835a064',
    title: '空洞卷积',
    section: '卷积扩展',
    revealMode: 'scroll',
    component: () => <DilatedConvolutionPage />,
  },
  {
    id: 'bcfe2812-de80-4204-a569-9265ff0c2712',
    title: '可变形卷积',
    section: '卷积扩展',
    revealMode: 'scroll',
    component: () => <DeformableConvolutionPage />,
  },
  {
    id: '478726be-db37-462a-b857-a5fd324d3e92',
    title: '本节完成：卷积核',
    section: '课程结尾',
    revealMode: 'immediate',
    component: () => <ConvolutionLessonEndingPage />,
  },
];
