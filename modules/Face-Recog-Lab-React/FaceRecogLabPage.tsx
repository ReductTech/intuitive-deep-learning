import { useCallback, type ReactNode } from 'react';
import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import { CnnQuizBlock } from './blocks/CnnQuizBlock';
import { DisguiseGameBlock } from './blocks/DisguiseGameBlock';
import { FixedKernelFaceBlock } from './blocks/FixedKernelFaceBlock';
import { LearnableCnnBlock } from './blocks/LearnableCnnBlock';
import { ResourcesBlock } from './blocks/ResourcesBlock';
import { FaceLegacyRuntimeProvider } from './components/FaceLegacyRuntime';
import { usePersistedFaceActivity } from './components/usePersistedFaceActivity';
import type { FaceRuntimeSnapshot } from './model/faceState';
import './face-recog-lab-react.css';

interface FaceRuntimeBoundaryProps {
  children: ReactNode;
}

export function FaceRuntimeBoundary({ children }: FaceRuntimeBoundaryProps) {
  const {
    state,
    hydrated,
    setDraft,
    commit,
    persistObservation,
  } = usePersistedFaceActivity();

  const handleSnapshot = useCallback((snapshot: FaceRuntimeSnapshot) => {
    setDraft(snapshot);
  }, [setDraft]);

  const handleSemanticEvent = useCallback((
    eventName: string,
    snapshot: FaceRuntimeSnapshot,
    properties: Record<string, unknown> = {},
  ) => {
    const isObservation = properties.event_kind === 'observation'
      || properties.user_initiated === false;
    if (isObservation) {
      persistObservation(eventName, snapshot, properties);
      return;
    }
    commit(eventName, snapshot, properties);
  }, [commit, persistObservation]);

  if (!hydrated || !state) {
    return <div className="face-react-runtime-loading" role="status">正在恢复学习状态…</div>;
  }

  return (
    <FaceLegacyRuntimeProvider
      snapshot={state}
      onSnapshot={handleSnapshot}
      onSemanticEvent={handleSemanticEvent}
    >
      {children}
    </FaceLegacyRuntimeProvider>
  );
}

const LESSON_STEPS: LessonFlowStep[] = [
  {
    id: 'fixed-kernel',
    revealMode: 'immediate',
    render: ({ complete }) => <FixedKernelFaceBlock onComplete={complete} />,
  },
  {
    id: 'learnable-cnn',
    revealMode: 'cue',
    render: ({ complete }) => <LearnableCnnBlock onComplete={complete} />,
  },
  {
    id: 'cnn-quiz',
    revealMode: 'immediate',
    render: ({ complete }) => <CnnQuizBlock onComplete={complete} />,
  },
  {
    id: 'disguise-game',
    revealMode: 'cue',
    completesLesson: true,
    render: ({ complete }) => <DisguiseGameBlock onComplete={complete} />,
  },
  {
    id: 'resources',
    revealMode: 'immediate',
    render: () => <ResourcesBlock />,
  },
];

export function FaceRecogLabPage() {
  return (
    <ModuleShell
      title="人脸识别：固定卷积核到参数全训"
      subtitle="把上一关的固定扫描器换到 LFW 彩色人脸子集，先只训练最后的分类头。"
      className="face-root face-react-root"
      shellClassName="face-shell face-react-shell edu-shell--scaled"
      headerClassName="face-header"
    >
      <FaceRuntimeBoundary>
        <LessonFlow
          className="face-react-lesson-flow"
          steps={LESSON_STEPS}
          persistenceKey="face-recog-lab-react"
          cueText="下方有新内容，继续观察人脸特征怎样从固定扫描器走向可学习网络。"
        />
      </FaceRuntimeBoundary>
    </ModuleShell>
  );
}
