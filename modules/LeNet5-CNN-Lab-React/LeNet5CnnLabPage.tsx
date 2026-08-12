import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import { DetectionSearchBlock } from './blocks/DetectionSearchBlock';
import { FixedKernelClassifierBlock } from './blocks/FixedKernelClassifierBlock';
import { ResourcesBlock } from './blocks/ResourcesBlock';
import { SequenceRecognitionBlock } from './blocks/SequenceRecognitionBlock';
import type { LenetClassifierSession } from './model/lenetTypes';
import './lenet5-cnn-lab-react.css';

interface LessonData {
  classifierSession: LenetClassifierSession | null;
  rememberClassifier: (session: LenetClassifierSession | null) => void;
  detectionCompleted: boolean;
  setDetectionCompleted: (completed: boolean) => void;
}

interface LessonStepProps {
  complete: () => void;
  isComplete: boolean;
  reset?: () => void;
}

const LessonDataContext = createContext<LessonData | null>(null);

function useLessonData() {
  const value = useContext(LessonDataContext);
  if (!value) throw new Error('LeNet lesson blocks must render inside LessonDataContext.');
  return value;
}

function FixedKernelLessonStep({ complete, isComplete, reset }: LessonStepProps) {
  const { rememberClassifier } = useLessonData();
  return (
    <FixedKernelClassifierBlock
      lessonStepComplete={isComplete}
      onComplete={complete}
      onResetLesson={reset}
      onSessionChange={rememberClassifier}
    />
  );
}

function SequenceLessonStep({ complete, isComplete }: LessonStepProps) {
  const { classifierSession } = useLessonData();
  return (
    <SequenceRecognitionBlock
      classifierSession={classifierSession}
      lessonStepComplete={isComplete}
      onComplete={complete}
    />
  );
}

function DetectionLessonStep({ complete }: LessonStepProps) {
  const { classifierSession, setDetectionCompleted } = useLessonData();
  const handleComplete = useCallback(() => {
    setDetectionCompleted(true);
    complete();
  }, [complete, setDetectionCompleted]);
  return (
    <DetectionSearchBlock
      classifierSession={classifierSession}
      onComplete={handleComplete}
      onResetDetection={() => setDetectionCompleted(false)}
    />
  );
}

function ResourcesLessonStep() {
  const { detectionCompleted } = useLessonData();
  return detectionCompleted ? <ResourcesBlock /> : null;
}

const LESSON_STEPS: LessonFlowStep[] = [
  {
    id: 'fixed-kernel',
    revealMode: 'immediate',
    render: ({ complete, isComplete, reset }) => (
      <FixedKernelLessonStep complete={complete} isComplete={isComplete} reset={reset} />
    ),
  },
  {
    id: 'sequence',
    revealMode: 'cue',
    render: ({ complete, isComplete }) => (
      <SequenceLessonStep complete={complete} isComplete={isComplete} />
    ),
  },
  {
    id: 'detection',
    revealMode: 'cue',
    completesLesson: true,
    render: ({ complete, isComplete }) => (
      <DetectionLessonStep complete={complete} isComplete={isComplete} />
    ),
  },
  {
    id: 'resources',
    revealMode: 'immediate',
    render: () => <ResourcesLessonStep />,
  },
];

export function LeNet5CnnLabPage() {
  const [classifierSession, setClassifierSession] = useState<LenetClassifierSession | null>(null);
  const [detectionCompleted, setDetectionCompleted] = useState(false);
  const rememberClassifier = useCallback((session: LenetClassifierSession | null) => {
    setClassifierSession(session);
  }, []);
  const lessonData = useMemo<LessonData>(() => ({
    classifierSession,
    rememberClassifier,
    detectionCompleted,
    setDetectionCompleted,
  }), [classifierSession, detectionCompleted, rememberClassifier]);

  return (
    <ModuleShell
      title="从人工卷积核到 LeNet-5"
      subtitle="接着“人工特征”：不再数粗糙大格子，先让固定边缘卷积核反复扫描图像。"
      className="lenet-root lenet-react-root"
      shellClassName="lenet-shell"
      headerClassName="lenet-header"
    >
      <LessonDataContext.Provider value={lessonData}>
        <LessonFlow
          className="lenet-lesson-flow"
          steps={LESSON_STEPS}
          persistenceKey="lenet5-cnn-lab-react"
          cueText="下方有新内容，继续观察固定卷积核分类器怎样识别序列和位置。"
        />
      </LessonDataContext.Provider>
    </ModuleShell>
  );
}
