import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import { GomokuGameBlock } from './blocks/GomokuGameBlock';
import { KernelOperatorBlock } from './blocks/KernelOperatorBlock';
import { MnistConvolutionBlock } from './blocks/MnistConvolutionBlock';
import { ResourcesBlock } from './blocks/ResourcesBlock';
import type { GomokuSessionSnapshot } from './model/sessionTypes';
import type { Matrix } from './model/kernelMath';
import './convolution-kernel-intro-react.css';

interface LessonData {
  game: GomokuSessionSnapshot | null;
  userKernel: Matrix | null;
  rememberGame: (snapshot: GomokuSessionSnapshot) => void;
  rememberKernel: (kernel: Matrix) => void;
}

interface LessonStepProps {
  complete: () => void;
  isComplete: boolean;
}

const LessonDataContext = createContext<LessonData | null>(null);

function useLessonData() {
  const value = useContext(LessonDataContext);
  if (!value) throw new Error('Convolution lesson blocks must render inside LessonDataContext.');
  return value;
}

function GomokuLessonStep({ complete, isComplete }: LessonStepProps) {
  const { rememberGame } = useLessonData();
  return (
    <GomokuGameBlock
      onComplete={complete}
      lessonStepComplete={isComplete}
      onSessionChange={rememberGame}
    />
  );
}

function OperatorLessonStep({ complete, isComplete }: LessonStepProps) {
  const { game, rememberKernel } = useLessonData();
  return (
    <KernelOperatorBlock
      game={game}
      onComplete={complete}
      lessonStepComplete={isComplete}
      onKernelReady={rememberKernel}
    />
  );
}

function MnistLessonStep({ complete, isComplete }: LessonStepProps) {
  const { userKernel } = useLessonData();
  return (
    <MnistConvolutionBlock
      userKernel={userKernel}
      onComplete={complete}
      lessonStepComplete={isComplete}
    />
  );
}

const LESSON_STEPS: LessonFlowStep[] = [
  {
    id: 'gomoku',
    revealMode: 'scroll',
    render: ({ complete, isComplete }) => <GomokuLessonStep complete={complete} isComplete={isComplete} />,
  },
  {
    id: 'operator',
    revealMode: 'scroll',
    render: ({ complete, isComplete }) => <OperatorLessonStep complete={complete} isComplete={isComplete} />,
  },
  {
    id: 'mnist',
    revealMode: 'cue',
    completesLesson: true,
    render: ({ complete, isComplete }) => <MnistLessonStep complete={complete} isComplete={isComplete} />,
  },
  {
    id: 'resources',
    revealMode: 'immediate',
    render: () => <ResourcesBlock />,
  },
];

export function ConvolutionKernelIntroPage() {
  const [game, setGame] = useState<GomokuSessionSnapshot | null>(null);
  const [userKernel, setUserKernel] = useState<Matrix | null>(null);
  const rememberGame = useCallback((snapshot: GomokuSessionSnapshot) => setGame(snapshot), []);
  const rememberKernel = useCallback((kernel: Matrix) => setUserKernel(kernel), []);
  const lessonData = useMemo<LessonData>(() => ({
    game,
    userKernel,
    rememberGame,
    rememberKernel,
  }), [game, rememberGame, rememberKernel, userKernel]);

  return (
    <ModuleShell
      title="卷积核入门"
      subtitle="先从一局五子棋开始：计算机怎样从棋盘里判断“谁赢了”？"
      className="ck-root ck-react-root"
      shellClassName="ck-react-shell"
    >
      <LessonDataContext.Provider value={lessonData}>
        <LessonFlow
          steps={LESSON_STEPS}
          persistenceKey="convolution-kernel-intro-react"
          cueText="下方有新内容，继续观察局部模式怎样变成卷积响应。"
        />
      </LessonDataContext.Provider>
    </ModuleShell>
  );
}