import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  LessonFlow,
  ModuleShell,
  type LessonFlowStep,
} from '../shared/react';
import { BinaryCrossEntropyBlock } from './blocks/BinaryCrossEntropyBlock';
import { BinarySigmoidBlock } from './blocks/BinarySigmoidBlock';
import { CategoricalCrossEntropyBlock } from './blocks/CategoricalCrossEntropyBlock';
import { MulticlassSoftmaxBlock } from './blocks/MulticlassSoftmaxBlock';
import { OutputHeadPairingBlock } from './blocks/OutputHeadPairingBlock';
import { ResourcesBlock } from './blocks/ResourcesBlock';
import './loss-guide-2-react.css';

type TeachingStageId =
  | 'binary-sigmoid'
  | 'binary-cross-entropy'
  | 'multiclass-softmax'
  | 'categorical-cross-entropy'
  | 'output-head-pairing';

const teachingStages: Array<{ id: TeachingStageId; label: string }> = [
  { id: 'binary-sigmoid', label: '一个类别的概率' },
  { id: 'binary-cross-entropy', label: '二分类损失' },
  { id: 'multiclass-softmax', label: '多个互斥类别' },
  { id: 'categorical-cross-entropy', label: '多分类损失' },
  { id: 'output-head-pairing', label: '选择输出层' },
];

type ProgressReporter = (id: TeachingStageId, complete: boolean) => void;

const ProgressContext = createContext<ProgressReporter>(() => undefined);

function StageProgressReporter({
  id,
  complete,
  children,
}: {
  id: TeachingStageId;
  complete: boolean;
  children: ReactNode;
}) {
  const reportProgress = useContext(ProgressContext);

  useEffect(() => {
    reportProgress(id, complete);
  }, [complete, id, reportProgress]);

  return children;
}

function ProgressNav({
  completed,
}: {
  completed: Record<TeachingStageId, boolean>;
}) {
  const currentIndex = teachingStages.findIndex(({ id }) => !completed[id]);

  return (
    <nav
      className="edu-progress wp-progress lg2-progress"
      aria-label="本节学习进度"
    >
      {teachingStages.map((stage, index) => {
        const done = completed[stage.id];
        const current = currentIndex === index;
        return (
          <span
            className={[
              'edu-progress-item',
              'lg2-progress-item',
              done ? 'is-done' : '',
              current ? 'is-current' : '',
            ].filter(Boolean).join(' ')}
            key={stage.id}
            aria-current={current ? 'step' : undefined}
            aria-disabled={!done && !current ? 'true' : undefined}
          >
            <i aria-hidden="true">{done ? '✓' : index + 1}</i>
            <span>{stage.label}</span>
          </span>
        );
      })}
    </nav>
  );
}

function withProgress(
  id: TeachingStageId,
  isComplete: boolean,
  content: ReactNode,
) {
  return (
    <StageProgressReporter id={id} complete={isComplete}>
      {content}
    </StageProgressReporter>
  );
}

function OutputPairingStep({
  complete,
  isComplete,
}: {
  complete: () => void;
  isComplete: boolean;
}) {
  return withProgress(
    'output-head-pairing',
    isComplete,
    <OutputHeadPairingBlock
      lessonStepComplete={isComplete}
      onComplete={complete}
    />,
  );
}

export const lossGuide2LessonSteps: LessonFlowStep[] = [
  {
    id: 'binary-sigmoid',
    render: ({ complete, isComplete }) => withProgress(
      'binary-sigmoid',
      isComplete,
      <BinarySigmoidBlock
        lessonStepComplete={isComplete}
        onComplete={complete}
      />,
    ),
  },
  {
    id: 'binary-cross-entropy',
    revealMode: 'cue',
    render: ({ complete, isComplete }) => withProgress(
      'binary-cross-entropy',
      isComplete,
      <BinaryCrossEntropyBlock
        lessonStepComplete={isComplete}
        onComplete={complete}
      />,
    ),
  },
  {
    id: 'multiclass-softmax',
    revealMode: 'cue',
    render: ({ complete, isComplete }) => withProgress(
      'multiclass-softmax',
      isComplete,
      <MulticlassSoftmaxBlock
        lessonStepComplete={isComplete}
        onComplete={complete}
      />,
    ),
  },
  {
    id: 'categorical-cross-entropy',
    revealMode: 'cue',
    render: ({ complete, isComplete }) => withProgress(
      'categorical-cross-entropy',
      isComplete,
      <CategoricalCrossEntropyBlock
        lessonStepComplete={isComplete}
        onComplete={complete}
      />,
    ),
  },
  {
    id: 'output-head-pairing',
    revealMode: 'cue',
    completesLesson: true,
    render: ({ complete, isComplete }) => (
      <OutputPairingStep complete={complete} isComplete={isComplete} />
    ),
  },
  {
    id: 'resources',
    revealMode: 'immediate',
    render: () => <ResourcesBlock />,
  },
];

function scrollToNewestLossGuide2Step() {
  const steps = document.querySelectorAll<HTMLElement>(
    '.lg2-react-shell .edu-lesson-flow-step.is-revealed',
  );
  const target = steps.item(steps.length - 1);
  target?.scrollIntoView({
    behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth',
    block: 'start',
  });
}

export function LossGuide2Page() {
  const [completed, setCompleted] = useState<Record<TeachingStageId, boolean>>({
    'binary-sigmoid': false,
    'binary-cross-entropy': false,
    'multiclass-softmax': false,
    'categorical-cross-entropy': false,
    'output-head-pairing': false,
  });

  const reportProgress = useCallback<ProgressReporter>((id, complete) => {
    setCompleted((current) => (
      current[id] === complete ? current : { ...current, [id]: complete }
    ));
  }, []);

  const progress = useMemo(
    () => <ProgressNav completed={completed} />,
    [completed],
  );
  return (
    <ProgressContext.Provider value={reportProgress}>
      <ModuleShell
        title="神经网络最后一层到底应该怎么输出？"
        subtitle="同样是预测天气，“会不会下雨”和“晴、阴、雨是哪一种”需要不同的输出方式和损失函数。"
        badge="M23 · Output & Loss"
        progress={progress}
        shellClassName="wp-shell lg2-react-shell edu-shell--scaled"
        className="wp-root lg2-react-root"
      >
        <LessonFlow
          steps={lossGuide2LessonSteps}
          persistenceKey="loss-guide-2-react"
          cueText={(
            <button
              className="lg2-cue-button"
              type="button"
              aria-label="下方有新内容，滚动或点击查看"
              onClick={scrollToNewestLossGuide2Step}
            >
              <strong>下方有新内容</strong>
              <small>滚动或点击查看</small>
            </button>
          )}
        />
      </ModuleShell>
    </ProgressContext.Provider>
  );
}
