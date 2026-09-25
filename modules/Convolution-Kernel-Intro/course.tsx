import type { ReactNode } from 'react';
import type { LessonFlowRevealMode, LessonStepContext } from '../shared/react';
import { GomokuPlayPage } from './pages/GomokuPlayPage/GomokuPlayPage';
import { BoardAsNumbersPage } from './pages/BoardAsNumbersPage/BoardAsNumbersPage';
import { WindowScanPage } from './pages/WindowScanPage/WindowScanPage';
import { KernelDesignPage } from './pages/KernelDesignPage/KernelDesignPage';
import { KernelBasicsPage } from './pages/KernelBasicsPage/KernelBasicsPage';
import { CorrelationConvolutionPage } from './pages/CorrelationConvolutionPage/CorrelationConvolutionPage';
import { WeightedKernelPage } from './pages/WeightedKernelPage/WeightedKernelPage';
import { GradientPage } from './pages/GradientPage/GradientPage';
import { SecondDifferencePage } from './pages/SecondDifferencePage/SecondDifferencePage';
import { DifferenceKernelPage } from './pages/DifferenceKernelPage/DifferenceKernelPage';
import { CommonKernelsPage } from './pages/CommonKernelsPage/CommonKernelsPage';
import { TranslationEquivariancePage } from './pages/TranslationEquivariancePage/TranslationEquivariancePage';
import { ConvolutionPropertiesPage } from './pages/ConvolutionPropertiesPage/ConvolutionPropertiesPage';
import { SparseConnectivityPage } from './pages/SparseConnectivityPage/SparseConnectivityPage';
import { WeightSharingPage } from './pages/WeightSharingPage/WeightSharingPage';
import { KernelSizePage } from './pages/KernelSizePage/KernelSizePage';
import { StridePage } from './pages/StridePage/StridePage';
import { PaddingPage } from './pages/PaddingPage/PaddingPage';
import { OutputSizeChallengePage } from './pages/OutputSizeChallengePage/OutputSizeChallengePage';
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

export const convolutionCourse: ConvolutionCourseItem[] = [
  {
    id: 'gomoku-play',
    title: '下完你的第一局',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <GomokuPlayPage onComplete={context.complete} />,
  },
  {
    id: 'board-as-numbers',
    title: '把棋形变成数字',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <BoardAsNumbersPage onComplete={context.complete} />,
  },
  {
    id: 'window-scan',
    title: '拖着窗口，找出激活值最大的地方',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <WindowScanPage onComplete={context.complete} />,
  },
  {
    id: 'kernel-design',
    title: '棋盘转了向，重新排一个卷积核',
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
    title: '卷积核里的权重，决定如何匹配',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <WeightedKernelPage />,
  },
  {
    id: 'gradient',
    title: '一阶差分与梯度',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <GradientPage />,
  },
  {
    id: 'second-difference',
    title: '二阶变化',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <SecondDifferencePage />,
  },
  {
    id: 'difference-kernel',
    title: '从差分到卷积核',
    section: '认识卷积核',
    revealMode: 'scroll',
    component: () => <DifferenceKernelPage />,
  },
  {
    id: 'common-kernels',
    title: '常见人工卷积核',
    section: '认识卷积核',
    revealMode: 'cue',
    component: () => <CommonKernelsPage />,
  },
  {
    id: 'sparse-connectivity',
    title: '稀疏连接：卷积为什么更省参数？',
    section: '卷积的性质',
    revealMode: 'scroll',
    component: () => <SparseConnectivityPage />,
  },
  {
    id: 'weight-sharing',
    title: '权重共享：同一个卷积核反复使用',
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
    id: 'convolution-properties',
    title: '卷积的三大性质',
    section: '卷积的性质',
    revealMode: 'scroll',
    component: () => <ConvolutionPropertiesPage />,
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
    id: 'output-size-challenge',
    title: '输出尺寸侦探：找到一组参数',
    section: '输出尺寸',
    revealMode: 'cue',
    component: () => <OutputSizeChallengePage />,
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
    title: '多核卷积：一个卷积核，产生一个输出通道',
    section: '多通道卷积',
    revealMode: 'scroll',
    component: () => <MultiKernelPage />,
  },
  {
    id: 'dilated-convolution',
    title: '空洞卷积：扩大感受野，不增加参数',
    section: '卷积扩展',
    revealMode: 'scroll',
    component: () => <DilatedConvolutionPage />,
  },
  {
    id: 'deformable-convolution',
    title: '可变形卷积：让采样位置适应局部结构',
    section: '卷积扩展',
    revealMode: 'scroll',
    component: () => <DeformableConvolutionPage />,
  },
];
