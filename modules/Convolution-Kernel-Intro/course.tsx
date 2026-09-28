import type { ReactNode } from 'react';
import { CourseEndingPage, type LessonFlowRevealMode, type LessonStepContext } from '../shared/react';
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
    pageKey="convolution-kernel-intro-ending"
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
    id: 'gomoku-play',
    title: '从五子棋开始认识卷积核',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <GomokuPlayPage onComplete={context.complete} />,
  },
  {
    id: 'board-as-numbers',
    title: '棋盘局部区域的数值表示',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <BoardAsNumbersPage onComplete={context.complete} />,
  },
  {
    id: 'window-scan',
    title: '棋形的局部匹配',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <WindowScanPage onComplete={context.complete} />,
  },
  {
    id: 'kernel-design',
    title: '根据棋形调整模板',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <KernelDesignPage onComplete={context.complete} />,
  },
  {
    id: 'kernel-basics',
    title: '卷积核：从输入到输出',
    section: '认识卷积核',
    revealMode: 'cue',
    component: (context) => <KernelBasicsPage onComplete={context.complete} />,
  },
  {
    id: 'correlation-convolution',
    title: '互相关与卷积',
    section: '认识卷积核',
    revealMode: 'cue',
    component: (context) => <CorrelationConvolutionPage onComplete={context.complete} />,
  },
  {
    id: 'weighted-kernel',
    title: '权重决定局部响应',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <WeightedKernelPage />,
  },
  {
    id: 'gradient',
    title: '一阶差分：从方向变化到梯度',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <GradientPage />,
  },
  {
    id: 'second-difference',
    title: '二阶差分：变化如何继续变化',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <SecondDifferencePage />,
  },
  {
    id: 'sobel-construction',
    title: '从一阶差分到 Sobel',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <SobelConstructionPage />,
  },
  {
    id: 'laplacian-construction',
    title: '从二阶差分到 Laplacian',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <LaplacianConstructionPage />,
  },
  {
    id: 'common-kernels',
    title: '卷积核工作台',
    section: '认识卷积核',
    revealMode: 'cue',
    component: () => <CommonKernelsPage />,
  },
  {
    id: 'sparse-connectivity',
    title: '稀疏连接：为什么参数更少？',
    section: '卷积的性质',
    revealMode: 'scroll',
    component: () => <SparseConnectivityPage />,
  },
  {
    id: 'weight-sharing',
    title: '权重共享：同一套权重反复使用',
    section: '卷积的性质',
    revealMode: 'scroll',
    component: () => <WeightSharingPage />,
  },
  {
    id: 'translation-equivariance',
    title: '平移等变性',
    section: '卷积的性质',
    revealMode: 'scroll',
    component: () => <TranslationEquivariancePage />,
  },
  {
    id: 'receptive-field',
    title: '卷积核的堆叠与感受野',
    section: '卷积的性质',
    revealMode: 'cue',
    component: () => <ReceptiveFieldPage />,
  },
  {
    id: 'kernel-size',
    title: 'Kernel size：卷积核有多大？',
    section: '输出尺寸',
    revealMode: 'cue',
    component: () => <KernelSizePage />,
  },
  {
    id: 'stride',
    title: 'Stride：卷积核每次移动几格？',
    section: '输出尺寸',
    revealMode: 'cue',
    component: () => <StridePage />,
  },
  {
    id: 'padding',
    title: 'Padding：让边缘也参与计算',
    section: '输出尺寸',
    revealMode: 'cue',
    component: () => <PaddingPage />,
  },
  {
    id: 'rgb-convolution',
    title: 'RGB 多通道卷积',
    section: '多通道卷积',
    revealMode: 'scroll',
    component: () => <RgbConvolutionPage />,
  },
  {
    id: 'multi-kernel',
    title: '多核卷积：卷积核数量决定输出深度',
    section: '多通道卷积',
    revealMode: 'scroll',
    component: () => <MultiKernelPage />,
  },
  {
    id: 'dilated-convolution',
    title: '空洞卷积',
    section: '卷积扩展',
    revealMode: 'scroll',
    component: () => <DilatedConvolutionPage />,
  },
  {
    id: 'deformable-convolution',
    title: '可变形卷积',
    section: '卷积扩展',
    revealMode: 'scroll',
    component: () => <DeformableConvolutionPage />,
  },
  {
    id: 'course-ending',
    title: '本节完成：卷积核',
    section: '课程结尾',
    revealMode: 'immediate',
    component: () => <ConvolutionLessonEndingPage />,
  },
];
