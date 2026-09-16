import type { ReactNode } from 'react';
import type { LessonFlowRevealMode, LessonStepContext } from '../shared/react';
import { DemoPage } from './pages/DemoPage/DemoPage';
import { GomokuGamePage } from './pages/GomokuGamePage/GomokuGamePage';
import { GomokuExplainPage } from './pages/GomokuExplainPage/GomokuExplainPage';
import { BinaryBoardPage } from './pages/BinaryBoardPage/BinaryBoardPage';
import { WindowScanPage } from './pages/WindowScanPage/WindowScanPage';
import { KernelDesignPage } from './pages/KernelDesignPage/KernelDesignPage';
import { MnistInputPage } from './pages/MnistInputPage/MnistInputPage';
import { MnistScanPage } from './pages/MnistScanPage/MnistScanPage';
import { MnistReadoutPage } from './pages/MnistReadoutPage/MnistReadoutPage';
import { ResourcesPage } from './pages/ResourcesPage/ResourcesPage';

export interface KernelCourseItem {
  id: string;
  title: string;
  section: string;
  revealMode: LessonFlowRevealMode;
  component: (context: LessonStepContext) => ReactNode;
  /** Optional per-surface visibility; omitted means visible everywhere. */
  showInBlog?: boolean;
  showInPpt?: boolean;
}

export const kernelCourse: KernelCourseItem[] = [
  {
    id: 'demo-scan',
    title: '卷积核，其实像在棋盘上找棋形',
    section: '开场演示',
    revealMode: 'scroll',
    component: (context) => <DemoPage onComplete={context.complete} />,
  },
  {
    id: 'gomoku-play',
    title: '你执黑先手，AI 执白后手',
    section: '从一局五子棋开始',
    revealMode: 'scroll',
    component: (context) => <GomokuGamePage onComplete={context.complete} />,
  },
  {
    id: 'gomoku-explain',
    title: '计算机刚才是怎么判断胜负的？',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <GomokuExplainPage onComplete={context.complete} />,
  },
  {
    id: 'binary-board',
    title: '把刚刚这盘棋拆成两个 0 / 1 图',
    section: '把棋盘变成数字',
    revealMode: 'cue',
    component: (context) => <BinaryBoardPage onComplete={context.complete} />,
  },
  {
    id: 'window-scan',
    title: '拖动窗口，找出响应最强的地方',
    section: '把棋盘变成数字',
    revealMode: 'cue',
    component: (context) => <WindowScanPage onComplete={context.complete} />,
  },
  {
    id: 'kernel-design',
    title: '换个方向，还能检测到吗？',
    section: '设计你自己的算子',
    revealMode: 'cue',
    component: (context) => <KernelDesignPage onComplete={context.complete} />,
  },
  {
    id: 'mnist-input',
    title: '换一张手写数字，看看卷积的输入',
    section: '换一张手写数字',
    revealMode: 'cue',
    component: (context) => <MnistInputPage onComplete={context.complete} />,
  },
  {
    id: 'mnist-scan',
    title: '让卷积核扫过这张手写数字',
    section: '换一张手写数字',
    revealMode: 'cue',
    component: (context) => <MnistScanPage onComplete={context.complete} />,
  },
  {
    id: 'mnist-readout',
    title: '换一个卷积核，它就会去找别的特征',
    section: '换一张手写数字',
    revealMode: 'cue',
    component: (context) => <MnistReadoutPage onComplete={context.complete} />,
  },
  {
    id: 'resources',
    title: '你已经走完了一次完整的卷积',
    section: '课程结尾',
    revealMode: 'scroll',
    component: (context) => <ResourcesPage onComplete={context.complete} />,
  },
];
