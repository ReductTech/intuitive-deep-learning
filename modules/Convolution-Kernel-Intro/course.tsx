import type { ReactNode } from 'react';
import type { LessonFlowRevealMode, LessonStepContext } from '../shared/react';
import { GomokuExplainPage } from './pages/GomokuExplainPage/GomokuExplainPage';
import { GomokuPlayPage } from './pages/GomokuPlayPage/GomokuPlayPage';
import { BoardAsNumbersPage } from './pages/BoardAsNumbersPage/BoardAsNumbersPage';
import { WindowScanPage } from './pages/WindowScanPage/WindowScanPage';
import { KernelDesignPage } from './pages/KernelDesignPage/KernelDesignPage';
import { SweepAndNamePage } from './pages/SweepAndNamePage/SweepAndNamePage';
import { LocalPatternPage } from './pages/LocalPatternPage/LocalPatternPage';

export interface ConvolutionCourseItem {
  id: string;
  title: string;
  section: string;
  revealMode: LessonFlowRevealMode;
  component: (context: LessonStepContext) => ReactNode;
  advanceLabel?: string;
  /** 可选的分形态可见性；省略表示两种形态都显示。 */
  showInBlog?: boolean;
  showInPpt?: boolean;
}

/** 课程页序与 outlines.json 的 pages 顺序一致。 */
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
    id: 'gomoku-explain',
    title: '计算机是怎么“看”出输赢的？',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <GomokuExplainPage onComplete={context.complete} />,
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
    title: '棋盘转了向，重新排一个算子',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <KernelDesignPage onComplete={context.complete} />,
  },
  {
    id: 'sweep-and-name',
    title: '把窗口滑遍全图：这就是卷积',
    section: '从一局五子棋开始',
    revealMode: 'cue',
    component: (context) => <SweepAndNamePage onComplete={context.complete} />,
  },
  {
    id: 'local-pattern',
    title: '同一块输入，不同卷积核会看到不同模式',
    section: '模板滑一遍',
    revealMode: 'cue',
    component: (context) => <LocalPatternPage onComplete={context.complete} />,
  },
];

