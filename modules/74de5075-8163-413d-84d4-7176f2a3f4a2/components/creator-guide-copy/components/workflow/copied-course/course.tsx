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
    id: '5501287a-1aa3-4300-8846-2648d1f98f20',
    title: '从五子棋开始认识卷积核',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <GomokuPlayPage onComplete={context.complete} />,
  },
  {
    id: '7749ed8d-7036-4cd6-bc26-b0c7306be0cd',
    title: '棋盘局部区域的数值表示',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <BoardAsNumbersPage onComplete={context.complete} />,
  },
  {
    id: 'ab8a2526-a563-43e1-84c8-0e2a71436c6f',
    title: '棋形的局部匹配',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <WindowScanPage onComplete={context.complete} />,
  },
  {
    id: 'e6770157-498e-4f10-a488-0fb3d108feba',
    title: '根据棋形调整模板',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <KernelDesignPage onComplete={context.complete} />,
  },
  {
    id: '99bd426d-d515-4093-9997-2df4fa574a01',
    title: '卷积核：从输入到输出',
    section: '认识卷积核',
    revealMode: 'cue',
    component: (context) => <KernelBasicsPage onComplete={context.complete} />,
  },
  {
    id: '8fe47aba-69bf-49c5-b321-20dd80c6cb4e',
    title: '互相关与卷积',
    section: '认识卷积核',
    revealMode: 'cue',
    component: (context) => <CorrelationConvolutionPage onComplete={context.complete} />,
  },
  {
    id: '40973d52-5ca6-4883-879b-e5a522a9ae14',
    title: '权重决定局部响应',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <WeightedKernelPage />,
  },
  {
    id: 'c512b83b-c7b4-43f4-accb-6a98157d66a0',
    title: '一阶差分：从方向变化到梯度',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <GradientPage />,
  },
  {
    id: '45d5527a-0858-41e0-bb73-de7bc479c687',
    title: '二阶差分：变化如何继续变化',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <SecondDifferencePage />,
  },
  {
    id: '5c699a02-7c59-49e1-96d7-18119b5fbdde',
    title: '从一阶差分到 Sobel',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <SobelConstructionPage />,
  },
  {
    id: '72f17de9-34c4-4c0e-8c9e-664b98e2a6e7',
    title: '从二阶差分到 Laplacian',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <LaplacianConstructionPage />,
  },
  {
    id: '3a5ced59-afdd-45e9-a696-7decf59fe05b',
    title: '卷积核工作台',
    section: '认识卷积核',
    revealMode: 'cue',
    component: () => <CommonKernelsPage />,
  },
  {
    id: '45e43a43-18ff-470d-8ef2-7de973bc2fc4',
    title: '稀疏连接：为什么参数更少？',
    section: '卷积的性质',
    revealMode: 'scroll',
    component: () => <SparseConnectivityPage />,
  },
  {
    id: '73df8276-f11a-4bae-8ee4-5ebbbceff272',
    title: '权重共享：同一套权重反复使用',
    section: '卷积的性质',
    revealMode: 'scroll',
    component: () => <WeightSharingPage />,
  },
  {
    id: '668b791d-52d0-4869-9b5d-8c7bced9a35e',
    title: '平移等变性',
    section: '卷积的性质',
    revealMode: 'scroll',
    component: () => <TranslationEquivariancePage />,
  },
  {
    id: '509e96ef-7f95-426f-956d-c08ee2813cbd',
    title: '卷积核的堆叠与感受野',
    section: '卷积的性质',
    revealMode: 'cue',
    component: () => <ReceptiveFieldPage />,
  },
  {
    id: 'cfc44ffc-ad50-43ba-ac59-9e5fd681cbf6',
    title: 'Kernel size：卷积核有多大？',
    section: '输出尺寸',
    revealMode: 'cue',
    component: () => <KernelSizePage />,
  },
  {
    id: '1c5f2818-bb2c-4c97-b9cd-123d49e0e419',
    title: 'Stride：卷积核每次移动几格？',
    section: '输出尺寸',
    revealMode: 'cue',
    component: () => <StridePage />,
  },
  {
    id: '90a08447-c6fe-4051-ad25-56910de9ec5a',
    title: 'Padding：让边缘也参与计算',
    section: '输出尺寸',
    revealMode: 'cue',
    component: () => <PaddingPage />,
  },
  {
    id: '513c8478-46fe-413a-911d-85c71abc998a',
    title: 'RGB 多通道卷积',
    section: '多通道卷积',
    revealMode: 'scroll',
    component: () => <RgbConvolutionPage />,
  },
  {
    id: '49c018bd-4daf-43f6-a7be-5357a2eec014',
    title: '多核卷积：卷积核数量决定输出深度',
    section: '多通道卷积',
    revealMode: 'scroll',
    component: () => <MultiKernelPage />,
  },
  {
    id: 'e524ddc6-8cdd-4cfe-bd82-bdbfcaf854eb',
    title: '空洞卷积',
    section: '卷积扩展',
    revealMode: 'scroll',
    component: () => <DilatedConvolutionPage />,
  },
  {
    id: '0719e400-0540-437a-82c2-fc784099365a',
    title: '可变形卷积',
    section: '卷积扩展',
    revealMode: 'scroll',
    component: () => <DeformableConvolutionPage />,
  },
  {
    id: '972dce7f-53dd-4f65-8289-3a7ae0e2c41d',
    title: '本节完成：卷积核',
    section: '课程结尾',
    revealMode: 'immediate',
    component: () => <ConvolutionLessonEndingPage />,
  },
];
