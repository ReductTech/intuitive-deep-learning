import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Feedback,
  LessonStage,
} from '../../shared/react';
import autoDriveImage from '../auto_drive.jpg';
import { usePersistedActivity } from '../components/usePersistedActivity';

export const OUTPUT_PAIRING_STATE_KEY =
  'activity:loss-guide-2-output-head-pairing';
export const OUTPUT_PAIRING_VISIBILITY_EVENT =
  'loss-guide-2:resources-visibility';
const TRANSITION_DELAY_MS = 520;

type PairGroup = 'pedestrian' | 'traffic' | 'bbox';

interface PairingSnapshot {
  revision: number;
  pairStep: number;
  answers: Record<PairGroup, string[]>;
  results: Record<PairGroup, boolean | null>;
  completed: boolean;
  resourcesVisible: boolean;
}

interface PairOption {
  key: string;
  value: string;
  label: string;
}

interface PairQuestionDefinition {
  type: 'choice' | 'multiple';
  typeLabel: string;
  title: string;
  options: PairOption[];
  answer: string[];
  correct: string;
  wrong: string;
}

export interface OutputHeadPairingBlockProps {
  onComplete: () => void;
  lessonStepComplete?: boolean;
}

const PAIR_ORDER: PairGroup[] = ['pedestrian', 'traffic', 'bbox'];

const QUESTIONS: Record<PairGroup, PairQuestionDefinition> = {
  pedestrian: {
    type: 'multiple',
    typeLabel: '多选题',
    title: '只判断图片中有没有行人时，下面哪些输出层和损失函数搭配可以完成这个二分类任务？',
    options: [
      {
        key: 'A',
        value: 'one-sigmoid',
        label: '输出 1 个值，接 Sigmoid，使用 BCE',
      },
      {
        key: 'B',
        value: 'one-softmax',
        label: '输出 1 个值，接 Softmax，使用交叉熵',
      },
      {
        key: 'C',
        value: 'two-sigmoid',
        label: '输出 2 个值，分别接 Sigmoid，使用 BCE',
      },
      {
        key: 'D',
        value: 'two-softmax',
        label: '输出 2 个值，接 Softmax，使用交叉熵',
      },
    ],
    answer: ['one-sigmoid', 'two-sigmoid', 'two-softmax'],
    correct: '正确。A 最简洁；C 也能训练，但两个概率互不约束；D 用两个互斥类别表示“有”和“没有”。单个值做 Softmax 永远等于 1，所以 B 不行。',
    wrong: '再检查一下：A、C、D 都能完成二分类；只有“单个输出接 Softmax”无法区分有或没有。',
  },
  traffic: {
    type: 'choice',
    typeLabel: '单选题',
    title: '需要从红、黄、绿三个互斥类别中判断红绿灯状态时，哪种输出层和损失函数搭配最合适？',
    options: [
      {
        key: 'A',
        value: 'traffic-one-sigmoid',
        label: '输出 1 个值，接 Sigmoid，使用 BCE',
      },
      {
        key: 'B',
        value: 'traffic-three-sigmoid',
        label: '输出 3 个值，分别接 Sigmoid，使用 BCE',
      },
      {
        key: 'C',
        value: 'traffic-three-softmax',
        label: '输出 3 个值，接 Softmax，使用交叉熵',
      },
      {
        key: 'D',
        value: 'traffic-regression',
        label: '输出 4 个连续数值，使用回归损失',
      },
    ],
    answer: ['traffic-three-softmax'],
    correct: '正确。红、黄、绿互斥，3 个输出经过 Softmax 后共享 100% 概率，再用多分类交叉熵训练。',
    wrong: '再想想：三个状态只会出现一个，应让三个类别概率相加等于 100%。',
  },
  bbox: {
    type: 'choice',
    typeLabel: '单选题',
    title: '目标检测不仅要判断有没有行人，还要画出行人框。一个框既要确定放在哪里，也要确定覆盖多大范围。哪种设计最合适？',
    options: [
      {
        key: 'A',
        value: 'bbox-four',
        label: '输出中心 x、y 和宽高 w、h 四个连续数值，使用回归损失',
      },
      {
        key: 'B',
        value: 'bbox-four-class',
        label: '输出 x、y、w、h 四个值，接 Softmax，使用交叉熵',
      },
      {
        key: 'C',
        value: 'bbox-center-score',
        label: '输出中心 x、y 和“有行人”的置信度，分别使用回归损失和 BCE',
      },
      {
        key: 'D',
        value: 'bbox-score-class',
        label: '输出“有行人”的置信度和行人类别概率，使用 BCE 与交叉熵',
      },
    ],
    answer: ['bbox-four'],
    correct: '正确。x、y 表示边框中心的位置，w、h 表示边框的宽和高；这四个量都是连续数值，要用回归损失学习。',
    wrong: '再想想：边框必须同时给出位置和大小，而且坐标与尺寸是连续数值，不能当作互斥类别。',
  },
};

function emptyAnswers(): Record<PairGroup, string[]> {
  return {
    pedestrian: [],
    traffic: [],
    bbox: [],
  };
}

function emptyResults(): Record<PairGroup, boolean | null> {
  return {
    pedestrian: null,
    traffic: null,
    bbox: null,
  };
}

function createInitialSnapshot(revision = 0): PairingSnapshot {
  return {
    revision,
    pairStep: 0,
    answers: emptyAnswers(),
    results: emptyResults(),
    completed: false,
    resourcesVisible: false,
  };
}

function normalizeStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  if (value.some((entry) => typeof entry !== 'string')) return null;
  return value.map(String);
}

function normalizeSnapshot(value: unknown): PairingSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<PairingSnapshot>;
  const revision = Number(candidate.revision ?? 0);
  const pairStep = Number(candidate.pairStep ?? 0);
  if (
    !Number.isInteger(revision)
    || revision < 0
    || !Number.isInteger(pairStep)
    || pairStep < 0
    || pairStep > PAIR_ORDER.length
  ) {
    return null;
  }
  if (
    !candidate.answers
    || !candidate.results
    || typeof candidate.answers !== 'object'
    || typeof candidate.results !== 'object'
  ) {
    return null;
  }
  const answers = emptyAnswers();
  const results = emptyResults();
  for (const group of PAIR_ORDER) {
    const answer = normalizeStringArray(candidate.answers[group]);
    const result = candidate.results[group];
    if (
      answer === null
      || (result !== null
        && result !== undefined
        && typeof result !== 'boolean')
    ) {
      return null;
    }
    answers[group] = answer;
    results[group] = result ?? null;
  }
  const completed = Boolean(candidate.completed);
  for (let index = 0; index < pairStep; index += 1) {
    const group = PAIR_ORDER[index];
    if (
      results[group] !== true
      || !sameAnswer(answers[group], QUESTIONS[group].answer)
    ) {
      return null;
    }
  }
  if (
    completed
    && PAIR_ORDER.some(
      (group) => (
        results[group] !== true
        || !sameAnswer(answers[group], QUESTIONS[group].answer)
      ),
    )
  ) {
    return null;
  }
  return {
    revision,
    pairStep: completed ? PAIR_ORDER.length : pairStep,
    answers,
    results,
    completed,
    resourcesVisible: completed || Boolean(candidate.resourcesVisible),
  };
}

function sameAnswer(actual: string[], expected: string[]) {
  return [...actual].sort().join('|') === [...expected].sort().join('|');
}

export function OutputHeadPairingBlock({
  onComplete,
  lessonStepComplete = false,
}: OutputHeadPairingBlockProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const completionReportedRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const [transitionFrom, setTransitionFrom] = useState<PairGroup | null>(null);
  const {
    state,
    hydrated,
    commit,
  } = usePersistedActivity<PairingSnapshot>({
    stateKey: OUTPUT_PAIRING_STATE_KEY,
    createInitial: createInitialSnapshot,
    normalizeState: normalizeSnapshot,
    getElement: () => rootRef.current,
  });

  const reportComplete = () => {
    if (lessonStepComplete || completionReportedRef.current) return;
    completionReportedRef.current = true;
    onComplete();
  };

  const clearTransitionTimer = () => {
    if (timerRef.current === null) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => () => {
    clearTransitionTimer();
  }, []);

  const scheduleAdvance = (group: PairGroup, completesActivity: boolean) => {
    clearTransitionTimer();
    setTransitionFrom(group);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setTransitionFrom(null);
      if (completesActivity) {
        window.dispatchEvent(new CustomEvent(
          OUTPUT_PAIRING_VISIBILITY_EVENT,
          { detail: { visible: true } },
        ));
        reportComplete();
      }
    }, TRANSITION_DELAY_MS);
  };

  const submitAnswer = (group: PairGroup, answer: string[]) => {
    if (!state || !hydrated || transitionFrom || state.completed) return;
    if (PAIR_ORDER[state.pairStep] !== group) return;
    const question = QUESTIONS[group];
    const ok = sameAnswer(answer, question.answer);
    const nextStep = ok ? state.pairStep + 1 : state.pairStep;
    const completed = ok && nextStep >= PAIR_ORDER.length;
    const next: PairingSnapshot = {
      ...state,
      pairStep: nextStep,
      answers: { ...state.answers, [group]: answer },
      results: { ...state.results, [group]: ok },
      completed,
      resourcesVisible: completed,
    };
    if (ok) scheduleAdvance(group, completed);
    commit('loss2_output_pairing_answer', next, {
      group,
      selected_values: answer,
      correct: ok,
      pair_step: nextStep,
      completed,
    });
  };

  const togglePedestrian = (value: string) => {
    if (
      !state
      || !hydrated
      || transitionFrom
      || state.completed
      || state.pairStep !== 0
    ) {
      return;
    }
    const current = state.answers.pedestrian;
    const answer = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value];
    commit(
      'loss2_output_pairing_selection_change',
      {
        ...state,
        answers: { ...state.answers, pedestrian: answer },
        results: { ...state.results, pedestrian: null },
      },
      {
        group: 'pedestrian',
        selected_values: answer,
      },
    );
  };

  const resetPairing = () => {
    if (!state || !hydrated) return;
    clearTransitionTimer();
    setTransitionFrom(null);
    commit(
      'loss2_output_pairing_reset',
      createInitialSnapshot(state.revision + 1),
      { revision: state.revision + 1 },
    );
    window.dispatchEvent(new CustomEvent(
      OUTPUT_PAIRING_VISIBILITY_EVENT,
      { detail: { visible: false } },
    ));
  };

  const activeGroup = transitionFrom
    ?? (
      state && !state.completed
        ? PAIR_ORDER[Math.min(state.pairStep, PAIR_ORDER.length - 1)]
        : null
    );
  const activeQuestion = activeGroup ? QUESTIONS[activeGroup] : null;

  return (
    <LessonStage
      ref={rootRef}
      className="lg2-block lg2-pairing-block"
      title="Sigmoid 和 Softmax 应该怎样选择？"
      data-telemetry-manual
      aria-busy={!hydrated}
    >
      {state && (
        <>
          {activeGroup && activeQuestion ? (
            <div className="lg2-driving-layout">
              <section
                className="lg2-driving-image"
                aria-label="雨夜道路场景"
              >
                <img
                  src={autoDriveImage}
                  alt="车辆摄像头拍摄的雨夜道路，画面包含前方汽车、行人、红绿灯和车道线"
                />
              </section>

              <section
                className={[
                  'dl-question',
                  `dl-question--${activeQuestion.type}`,
                  activeQuestion.type === 'multiple'
                    ? 'dl-question--multiple'
                    : '',
                  'lg2-pair-question',
                ].filter(Boolean).join(' ')}
                aria-label={activeQuestion.title}
              >
                <header className="dl-question-head">
                  <span className="dl-question-type">
                    {activeQuestion.typeLabel}
                  </span>
                  <div className="dl-question-title-row">
                    <strong className="dl-question-stem">
                      {activeQuestion.title}
                    </strong>
                    {activeQuestion.type === 'multiple' && (
                      <Button
                        variant="primary"
                        disabled={
                          state.answers[activeGroup].length === 0
                          || transitionFrom !== null
                        }
                        onClick={() => submitAnswer(
                          activeGroup,
                          state.answers[activeGroup],
                        )}
                      >
                        检查答案
                      </Button>
                    )}
                  </div>
                </header>

                <div
                  className="dl-question-options"
                  role={activeQuestion.type === 'multiple'
                    ? 'group'
                    : 'radiogroup'}
                >
                  {activeQuestion.options.map((option) => {
                    const selected = state.answers[activeGroup]
                      .includes(option.value);
                    const result = state.results[activeGroup];
                    const expected = activeQuestion.answer
                      .includes(option.value);
                    return (
                      <button
                        className={[
                          'dl-question-option',
                          selected ? 'is-selected' : '',
                          result === true && expected ? 'is-correct' : '',
                          result === false && selected && !expected
                            ? 'is-wrong'
                            : '',
                        ].filter(Boolean).join(' ')}
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        disabled={transitionFrom !== null}
                        onClick={() => {
                          if (activeQuestion.type === 'multiple') {
                            togglePedestrian(option.value);
                          } else {
                            submitAnswer(activeGroup, [option.value]);
                          }
                        }}
                      >
                        <span className="dl-option-key">{option.key}</span>
                        <span className="dl-option-body">{option.label}</span>
                      </button>
                    );
                  })}
                </div>

                {state.results[activeGroup] !== null && (
                  <Feedback
                    status={state.results[activeGroup]
                      ? 'correct'
                      : 'wrong'}
                    message={state.results[activeGroup]
                      ? activeQuestion.correct
                      : activeQuestion.wrong}
                  />
                )}
              </section>
            </div>
          ) : (
            <Feedback
              status="correct"
              label="输出层配对完成"
              message="你已经依次完成二分类、互斥多分类和边界框回归三种任务的输出设计。"
            />
          )}

          <div className="edu-actions lg2-pair-actions">
            <Button onClick={resetPairing}>重新作答</Button>
          </div>
        </>
      )}
    </LessonStage>
  );
}
