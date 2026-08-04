import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Button,
  Callout,
  ContentBlock,
  Feedback,
  FormulaBlock,
  FormulaTerm,
  MathFormulaBlock,
  MathFormulaStatic,
  NoticeStrip,
  PlotlyChart,
  RangeControl,
  Typography,
  emitTelemetry,
  getTelemetryState,
} from '../../shared/react';
import { GradientNetworkDiagram } from '../components/GradientNetworkDiagram';
import {
  INITIAL_OUTPUT_WEIGHTS,
  MANUAL_TARGET,
  forwardOutputWeights,
  stepOutputWeights,
  type OutputWeights,
} from '../model/gradientMath';
import { reviewOscillationAnswer } from '../services/oscillationFeedback';

const ACTIVITY_STATE_KEY = 'activity:gd-auto';
const COMPLETE_LOSS_THRESHOLD = 0.005;
const INITIAL_STEP_RATIO = 1;
const LEARNING_RATE_START = 0.1;
const DERIVATIVE_EXPECTED = [-1, 3, 1] as const;
const DERIVATIVE_TOLERANCE = 0.001;
const AUTO_CHART_CONFIG = { scrollZoom: false };

type DerivativeFeedback = 'correct' | 'wrong' | null;
type AutoHistoryEntry = ReturnType<typeof stepOutputWeights> & { step: number };

interface ReviewSnapshot {
  ok: boolean;
  tone: 'correct' | 'wrong' | 'hint';
  message?: string;
}

interface LegacyQuestionState {
  answer_fields?: Array<{ value?: unknown }>;
  submitted?: boolean;
  result?: {
    ok?: boolean;
    empty?: boolean;
    answer?: unknown[];
    tone?: unknown;
    message?: unknown;
  } | null;
}

interface AutoActivitySnapshot {
  version: 2;
  derivativeInputs: [string, string, string];
  derivativeFeedback: [
    DerivativeFeedback,
    DerivativeFeedback,
    DerivativeFeedback,
  ];
  derivativeSolved: number;
  weights: OutputWeights;
  history: AutoHistoryEntry[];
  stepRatio: number;
  stepRatioSelected: boolean;
  feedbackResolved: boolean;
  oscillationAnswer: string;
  oscillationReview: ReviewSnapshot | null;
  learningRateStarted: boolean;
  completed: boolean;
}

interface AutoUpdateBlockProps {
  onComplete: () => void;
}

interface NumericDerivativeProps {
  index: number;
  title: ReactNode;
  answerLabel: string;
  hint: ReactNode;
  value: string;
  feedback: DerivativeFeedback;
  disabled: boolean;
  onChange: (value: string) => void;
  onBlur: (relatedTarget: EventTarget | null) => void;
  onSubmit: () => void;
}

interface OscillationQuestionProps {
  answer: string;
  review: ReviewSnapshot | null;
  hydrated: boolean;
  locked: boolean;
  reviewing: boolean;
  streamFeedback: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  onSubmit: () => void;
}

function initialActivity(): AutoActivitySnapshot {
  return {
    version: 2,
    derivativeInputs: ['', '', ''],
    derivativeFeedback: [null, null, null],
    derivativeSolved: 0,
    weights: { ...INITIAL_OUTPUT_WEIGHTS },
    history: [],
    stepRatio: INITIAL_STEP_RATIO,
    stepRatioSelected: false,
    feedbackResolved: false,
    oscillationAnswer: '',
    oscillationReview: null,
    learningRateStarted: false,
    completed: false,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? value as Record<string, unknown>
    : null;
}

function finiteNumber(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function restoreWeights(
  value: unknown,
  fallback: Readonly<OutputWeights>,
): OutputWeights {
  const record = asRecord(value);
  return {
    v1: finiteNumber(record?.v1, fallback.v1),
    v2: finiteNumber(record?.v2, fallback.v2),
  };
}

function restoreForward(
  value: unknown,
  fallback: ReturnType<typeof forwardOutputWeights>,
): ReturnType<typeof forwardOutputWeights> {
  const record = asRecord(value);
  return {
    output: finiteNumber(record?.output, fallback.output),
    error: finiteNumber(record?.error, fallback.error),
    loss: Math.max(0, finiteNumber(record?.loss, fallback.loss)),
  };
}

function restoreHistory(value: unknown): AutoHistoryEntry[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((candidate, index) => {
    const record = asRecord(candidate);
    if (!record) return [];

    const beforeWeights = restoreWeights(record.weights, INITIAL_OUTPUT_WEIGHTS);
    const computedBefore = forwardOutputWeights(beforeWeights);
    const before = restoreForward(record.before, computedBefore);
    const after = restoreForward(record.after, computedBefore);
    const weights = restoreWeights(record.weights, {
      v1: INITIAL_OUTPUT_WEIGHTS.v1,
      v2: INITIAL_OUTPUT_WEIGHTS.v2,
    });

    return [{
      step: Math.max(1, Math.trunc(finiteNumber(record.step, index + 1))),
      weights,
      before,
      after,
      gradients: restoreWeights(record.gradients, { v1: 0, v2: 0 }),
      deltas: restoreWeights(record.deltas, { v1: 0, v2: 0 }),
      stepRatio: Math.min(1, Math.max(0, finiteNumber(record.stepRatio, 1))),
      didUpdate: record.didUpdate !== false,
    }];
  });
}

function restoreActivity(value: unknown): AutoActivitySnapshot {
  const fallback = initialActivity();
  const record = asRecord(value);
  if (!record) return fallback;

  const rawInputs = Array.isArray(record.derivativeInputs)
    ? record.derivativeInputs
    : [];
  const derivativeInputs: [string, string, string] = [0, 1, 2].map((index) => {
    const valueAtIndex = rawInputs[index];
    return typeof valueAtIndex === 'string' || typeof valueAtIndex === 'number'
      ? String(valueAtIndex)
      : '';
  }) as [string, string, string];
  const derivativeSolved = Math.min(
    3,
    Math.max(0, Math.trunc(finiteNumber(record.derivativeSolved, 0))),
  );
  const rawFeedback = Array.isArray(record.derivativeFeedback)
    ? record.derivativeFeedback
    : [];
  const derivativeFeedback = [0, 1, 2].map((index) => {
    if (index < derivativeSolved) return 'correct';
    return rawFeedback[index] === 'correct' || rawFeedback[index] === 'wrong'
      ? rawFeedback[index]
      : null;
  }) as AutoActivitySnapshot['derivativeFeedback'];
  const history = restoreHistory(record.history);
  const historyWeights = history.at(-1)?.weights ?? INITIAL_OUTPUT_WEIGHTS;
  const weights = restoreWeights(record.weights, historyWeights);
  const rawReview = asRecord(record.oscillationReview);
  const reviewTone = rawReview?.tone;
  const oscillationReview: ReviewSnapshot | null = rawReview
    && (reviewTone === 'correct' || reviewTone === 'wrong' || reviewTone === 'hint')
    ? {
        ok: rawReview.ok === true,
        tone: reviewTone as ReviewSnapshot['tone'],
        message: typeof rawReview.message === 'string'
          ? rawReview.message
          : undefined,
      }
    : null;
  const restoredRatio = finiteNumber(record.stepRatio, INITIAL_STEP_RATIO);
  const stepRatio = Math.round(
    Math.min(1, Math.max(0, restoredRatio)) / 0.05,
  ) * 0.05;
  const completed = forwardOutputWeights(weights).loss
    < COMPLETE_LOSS_THRESHOLD;

  return {
    version: 2,
    derivativeInputs,
    derivativeFeedback,
    derivativeSolved,
    weights,
    history,
    stepRatio,
    stepRatioSelected: record.stepRatioSelected === true
      || record.completed === true
      || (record.learningRateStarted === true && history.length > 5),
    feedbackResolved: record.feedbackResolved === true,
    oscillationAnswer: typeof record.oscillationAnswer === 'string'
      ? record.oscillationAnswer
      : '',
    oscillationReview,
    learningRateStarted: record.learningRateStarted === true,
    completed,
  };
}

function restoreLegacyOscillation(
  activity: AutoActivitySnapshot,
  value: unknown,
  eventName?: string,
): AutoActivitySnapshot {
  if (activity.oscillationReview || activity.feedbackResolved) {
    return activity;
  }

  const state = asRecord(value) as LegacyQuestionState | null;
  if (!state) return activity;
  const result = state.result && typeof state.result === 'object'
    ? state.result
    : null;
  const resultAnswer = Array.isArray(result?.answer)
    ? result.answer[0]
    : undefined;
  const fieldAnswer = Array.isArray(state.answer_fields)
    ? state.answer_fields[0]?.value
    : undefined;
  const answer = typeof resultAnswer === 'string'
    ? resultAnswer
    : typeof fieldAnswer === 'string'
      ? fieldAnswer
      : '';
  if (!answer.trim()) return activity;

  const submitted = state.submitted === true || eventName === 'answer_submit';
  const tone = result?.tone;
  const review = submitted
    && result
    && result.empty !== true
    && (tone === 'correct' || tone === 'wrong' || tone === 'hint')
    ? {
        ok: result.ok === true,
        tone,
        message: typeof result.message === 'string'
          ? result.message
          : undefined,
      } satisfies ReviewSnapshot
    : null;

  if (!review && activity.oscillationAnswer.trim()) {
    return activity;
  }

  return {
    ...activity,
    oscillationAnswer: answer,
    oscillationReview: review,
    feedbackResolved: review !== null,
  };
}

function format(value: number, digits = 2): string {
  return Number.isFinite(value) ? value.toFixed(digits) : '—';
}

function compact(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function NumericDerivativeQuestion({
  index,
  title,
  answerLabel,
  hint,
  value,
  feedback,
  disabled,
  onChange,
  onBlur,
  onSubmit,
}: NumericDerivativeProps) {
  const submitPointerRef = useRef(false);

  return (
    <section
      className="dl-question dl-question--fill gd-derivative-question"
      data-state-key={`${ACTIVITY_STATE_KEY}:derivative-${index + 1}`}
    >
      <header className="dl-question-head">
        <span className="dl-question-type">填空题</span>
        <div className="dl-question-title-row">
          <strong className="dl-question-stem">
            {title}{' '}
            <input
              className="dl-inline-blank"
              id={`gd-derivative-input-${index}`}
              type="text"
              aria-label={answerLabel}
              placeholder="填写答案"
              value={value}
              disabled={disabled}
              inputMode="decimal"
              autoComplete="off"
              data-role="question-answer"
              onChange={(event) => onChange(event.currentTarget.value)}
              onBlur={(event) => {
                const movesToSubmit = event.relatedTarget instanceof Element
                  && Boolean(event.relatedTarget.closest('[data-gd-derivative-submit]'));
                if (submitPointerRef.current || movesToSubmit) {
                  submitPointerRef.current = false;
                  window.setTimeout(() => onBlur(null), 0);
                  return;
                }
                onBlur(event.relatedTarget);
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' || disabled) return;
                event.preventDefault();
                onSubmit();
              }}
            />
          </strong>
          <Button
            className="dl-question-submit"
            variant="primary"
            disabled={disabled}
            data-gd-derivative-submit={index}
            onPointerDown={() => {
              submitPointerRef.current = true;
            }}
            onPointerCancel={() => {
              submitPointerRef.current = false;
            }}
            onClick={() => {
              submitPointerRef.current = false;
              onSubmit();
            }}
          >
            检查答案
          </Button>
        </div>
      </header>
      <p className="gd-derivative-hint"><strong>提示</strong><span>{hint}</span></p>
      {feedback !== null && (
        <Feedback
          status={feedback === 'correct' ? 'correct' : 'wrong'}
          message={feedback === 'correct'
            ? '正确。继续完成下一步。'
            : '再想一下，并结合上面的已知公式判断。'}
        />
      )}
    </section>
  );
}

function OscillationQuestion({
  answer,
  review,
  hydrated,
  locked,
  reviewing,
  streamFeedback,
  onChange,
  onBlur,
  onSubmit,
}: OscillationQuestionProps) {
  const submitPointerRef = useRef(false);
  const disabled = !hydrated || locked || reviewing;

  return (
    <section
      className="dl-question dl-question--short gd-private-oscillation-question"
      data-question-type="short"
      data-submit-mode="manual"
      data-state-key={ACTIVITY_STATE_KEY}
      data-telemetry-manual
      aria-busy={!hydrated || reviewing}
    >
      <header className="dl-question-head">
        <span className="dl-question-type">简答题</span>
        <div className="dl-question-title-row">
          <strong className="dl-question-stem">
            预测值在真实值两侧持续震荡，如何优化更新以提升稳定性？
          </strong>
          {!locked && (
            <Button
              className="dl-question-submit"
              variant="primary"
              loading={reviewing}
              disabled={disabled}
              data-gd-oscillation-submit
              onPointerDown={() => {
                submitPointerRef.current = true;
              }}
              onPointerCancel={() => {
                submitPointerRef.current = false;
              }}
              onClick={() => {
                submitPointerRef.current = false;
                onSubmit();
              }}
            >
              提交回答
            </Button>
          )}
        </div>
      </header>
      <div className="dl-question-fields">
        <label className="dl-question-field">
          <span className="dl-question-field-label">震荡现象的优化方法</span>
          <textarea
            rows={4}
            value={answer}
            aria-label="解释如何减少震荡"
            data-role="question-answer"
            disabled={disabled}
            onChange={(event) => onChange(event.currentTarget.value)}
            onBlur={(event) => {
              const movesToSubmit = event.relatedTarget instanceof Element
                && Boolean(event.relatedTarget.closest('[data-gd-oscillation-submit]'));
              if (submitPointerRef.current || movesToSubmit) return;
              onBlur();
            }}
          />
        </label>
      </div>
      {review && (
        <Feedback
          status={review.tone}
          message={review.message}
          streaming={streamFeedback}
          className="dl-question-feedback"
        />
      )}
    </section>
  );
}

export function AutoUpdateBlock({ onComplete }: AutoUpdateBlockProps) {
  const [activity, setActivity] = useState<AutoActivitySnapshot>(
    initialActivity,
  );
  const [hydrated, setHydrated] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isReviewingOscillation, setIsReviewingOscillation] = useState(false);
  const [streamOscillationFeedback, setStreamOscillationFeedback] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef(activity);
  const persistedDerivativeInputsRef = useRef(activity.derivativeInputs);
  const persistedOscillationAnswerRef = useRef(activity.oscillationAnswer);
  const committedRatioRef = useRef(activity.stepRatio);
  const completionReportedRef = useRef(false);
  const animationTimerRef = useRef<number | null>(null);
  const oscillationReviewInFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  function replaceActivity(next: AutoActivitySnapshot) {
    activityRef.current = next;
    setActivity(next);
  }

  function persist(
    eventName: string,
    next: AutoActivitySnapshot,
    properties: Record<string, unknown> = {},
  ) {
    persistedDerivativeInputsRef.current = next.derivativeInputs;
    persistedOscillationAnswerRef.current = next.oscillationAnswer;
    emitTelemetry(eventName, rootRef.current, {
      state_key: ACTIVITY_STATE_KEY,
      state: next,
      ...properties,
    });
  }

  useEffect(() => {
    let active = true;
    mountedRef.current = true;
    void Promise.all([
      getTelemetryState<AutoActivitySnapshot>(ACTIVITY_STATE_KEY),
      getTelemetryState<LegacyQuestionState>('question:gd-oscillation'),
    ]).then(([activityEntry, legacyQuestionEntry]) => {
      if (!active) return;
      const restoredBase = restoreActivity(activityEntry?.state);
      const restored = restoreLegacyOscillation(
        restoredBase,
        legacyQuestionEntry?.state,
        legacyQuestionEntry?.event_name,
      );
      activityRef.current = restored;
      persistedDerivativeInputsRef.current = restored.derivativeInputs;
      persistedOscillationAnswerRef.current = restored.oscillationAnswer;
      committedRatioRef.current = restored.stepRatio;
      completionReportedRef.current = false;
      setStreamOscillationFeedback(false);
      setActivity(restored);
      setHydrated(true);
    });

    return () => {
      active = false;
      mountedRef.current = false;
      if (animationTimerRef.current !== null) {
        window.clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !activity.completed || completionReportedRef.current) return;
    completionReportedRef.current = true;
    onCompleteRef.current();
  }, [activity.completed, hydrated]);

  const metrics = forwardOutputWeights(activity.weights);
  const activeRatio = activity.learningRateStarted
    ? activity.stepRatio
    : INITIAL_STEP_RATIO;
  const nextPreview = stepOutputWeights(activity.weights, activeRatio);
  const derivativesComplete = activity.derivativeSolved >= 3;
  const oscillating = activity.history.length >= 3
    && !activity.learningRateStarted;
  const waitingForReflection = activity.history.length >= 5
    && !activity.learningRateStarted;
  const canUpdate = hydrated
    && derivativesComplete
    && !waitingForReflection
    && !isUpdating
    && activeRatio > 0
    && !activity.completed;

  const losses = useMemo(
    () => [
      forwardOutputWeights(INITIAL_OUTPUT_WEIGHTS).loss,
      ...activity.history.map((entry) => entry.after.loss),
    ],
    [activity.history],
  );
  const chartData = useMemo(() => [{
    x: losses.map((_, index) => index),
    y: losses,
    type: 'scatter',
    mode: 'lines+markers',
    name: 'L1 loss',
    line: { color: '#f07e47', width: 3 },
    marker: {
      size: 9,
      color: '#f07e47',
      line: { color: '#ffffff', width: 2 },
    },
    hovertemplate: '更新 %{x}<br>L1 loss %{y:.3f}<extra></extra>',
  }], [losses]);
  const chartLayout = useMemo(() => ({
    margin: { l: 58, r: 24, t: 20, b: 50 },
    xaxis: {
      title: '更新次数',
      range: [0, Math.max(5, losses.length)],
      fixedrange: true,
    },
    yaxis: {
      title: 'L1 loss',
      range: [0, Math.max(1, ...losses) * 1.12],
      fixedrange: true,
    },
    showlegend: false,
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
  }), [losses]);

  function setDerivativeInput(index: number, value: string) {
    const current = activityRef.current;
    const derivativeInputs = [
      ...current.derivativeInputs,
    ] as AutoActivitySnapshot['derivativeInputs'];
    derivativeInputs[index] = value;
    replaceActivity({ ...current, derivativeInputs });
  }

  function persistDerivativeDraft(
    index: number,
    relatedTarget: EventTarget | null,
  ) {
    if (
      relatedTarget instanceof Element
      && relatedTarget.closest('[data-gd-derivative-submit]')
    ) {
      return;
    }
    const current = activityRef.current;
    if (
      current.derivativeInputs[index]
      === persistedDerivativeInputsRef.current[index]
    ) {
      return;
    }
    persist('gradient_derivative_change', current, {
      derivative_index: index,
      submitted: false,
    });
  }

  function submitDerivative(index: number) {
    const current = activityRef.current;
    if (!hydrated || index !== current.derivativeSolved || index >= 3) return;

    const numeric = Number(current.derivativeInputs[index]);
    const correct = Number.isFinite(numeric)
      && Math.abs(numeric - DERIVATIVE_EXPECTED[index])
        < DERIVATIVE_TOLERANCE;
    const derivativeFeedback = [
      ...current.derivativeFeedback,
    ] as AutoActivitySnapshot['derivativeFeedback'];
    derivativeFeedback[index] = correct ? 'correct' : 'wrong';
    const next: AutoActivitySnapshot = {
      ...current,
      derivativeFeedback,
      derivativeSolved: correct
        ? Math.min(3, current.derivativeSolved + 1)
        : current.derivativeSolved,
    };
    replaceActivity(next);
    persist('gradient_derivative_submit', next, {
      derivative_index: index,
      correct,
    });
    if (correct && index < 2) {
      window.requestAnimationFrame(() => {
        document.getElementById(`gd-derivative-input-${index + 1}`)?.focus({
          preventScroll: true,
        });
      });
    }
  }

  function updateOnce() {
    const current = activityRef.current;
    const blocked = current.history.length >= 5
      && !current.learningRateStarted;
    if (
      !hydrated
      || isUpdating
      || animationTimerRef.current !== null
      || current.derivativeSolved < 3
      || blocked
      || current.completed
    ) {
      return;
    }

    const ratio = current.learningRateStarted
      ? current.stepRatio
      : INITIAL_STEP_RATIO;
    const result = stepOutputWeights(current.weights, ratio);
    const entry: AutoHistoryEntry = {
      ...result,
      step: current.history.length + 1,
    };
    const completed = result.after.loss < COMPLETE_LOSS_THRESHOLD;
    const next: AutoActivitySnapshot = {
      ...current,
      weights: result.weights,
      history: [...current.history, entry],
      completed,
    };

    const animationDelay = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ? 0
      : 550;
    setIsUpdating(true);
    animationTimerRef.current = window.setTimeout(() => {
      replaceActivity(next);
      persist('gradient_auto_update', next, {
        step: entry.step,
        step_ratio: ratio,
        before_loss: result.before.loss,
        after_loss: result.after.loss,
        completed,
      });
      setIsUpdating(false);
      animationTimerRef.current = null;

      if (completed && !completionReportedRef.current) {
        completionReportedRef.current = true;
        onCompleteRef.current();
      }
    }, animationDelay);
  }

  function changeOscillationAnswer(value: string) {
    const current = activityRef.current;
    if (
      !hydrated
      || current.feedbackResolved
      || oscillationReviewInFlightRef.current
    ) {
      return;
    }
    setStreamOscillationFeedback(false);
    replaceActivity({
      ...current,
      oscillationAnswer: value,
      oscillationReview: null,
    });
  }

  function persistOscillationDraft() {
    const current = activityRef.current;
    if (
      !hydrated
      || current.feedbackResolved
      || oscillationReviewInFlightRef.current
      || current.oscillationAnswer === persistedOscillationAnswerRef.current
    ) {
      return;
    }
    persist('gradient_oscillation_change', current, {
      submitted: false,
      answer_length: Array.from(current.oscillationAnswer).length,
    });
  }

  async function submitOscillation() {
    const current = activityRef.current;
    if (
      !hydrated
      || current.feedbackResolved
      || oscillationReviewInFlightRef.current
    ) {
      return;
    }

    const answer = current.oscillationAnswer.trim();
    if (!answer) {
      const next: AutoActivitySnapshot = {
        ...current,
        oscillationAnswer: '',
        oscillationReview: {
          ok: false,
          tone: 'hint',
          message: '请先写下你的判断，再提交回答。',
        },
        feedbackResolved: false,
      };
      setStreamOscillationFeedback(false);
      replaceActivity(next);
      persist('gradient_oscillation_submit', next, {
        submitted: true,
        empty: true,
        reviewed: false,
      });
      return;
    }

    oscillationReviewInFlightRef.current = true;
    setIsReviewingOscillation(true);
    setStreamOscillationFeedback(true);
    replaceActivity({
      ...current,
      oscillationAnswer: answer,
      oscillationReview: {
        ok: false,
        tone: 'hint',
        message: '正在分析你的回答，请稍候。',
      },
    });

    let review: ReviewSnapshot;
    let reviewFailed = false;
    try {
      const response = await reviewOscillationAnswer(answer);
      review = {
        ok: response.ok,
        tone: response.tone,
        message: typeof response.message === 'string'
          ? response.message
          : '评阅已完成，但服务没有返回可展示的解释。',
      };
    } catch (error) {
      reviewFailed = true;
      review = {
        ok: false,
        tone: 'wrong',
        message: error instanceof Error && error.message.trim()
          ? error.message
          : '评阅服务暂时不可用，请稍后重试。',
      };
    }

    if (!mountedRef.current) {
      oscillationReviewInFlightRef.current = false;
      return;
    }

    const latest = activityRef.current;
    const next: AutoActivitySnapshot = {
      ...latest,
      oscillationAnswer: answer,
      oscillationReview: review,
      feedbackResolved: true,
    };
    replaceActivity(next);
    persist('gradient_oscillation_submit', next, {
      submitted: true,
      empty: false,
      reviewed: true,
      correct: review.ok,
      feedback_tone: review.tone,
      review_failed: reviewFailed,
      answer_length: Array.from(answer).length,
    });
    oscillationReviewInFlightRef.current = false;
    setIsReviewingOscillation(false);
  }

  function startLearningRatePractice() {
    const current = activityRef.current;
    if (
      !hydrated
      || !current.feedbackResolved
      || current.learningRateStarted
    ) {
      return;
    }

    const next: AutoActivitySnapshot = {
      ...current,
      learningRateStarted: true,
      stepRatio: LEARNING_RATE_START,
      stepRatioSelected: false,
    };
    committedRatioRef.current = LEARNING_RATE_START;
    replaceActivity(next);
    persist('gradient_learning_rate_start', next, {
      step_ratio: LEARNING_RATE_START,
    });
  }

  function changeStepRatio(value: string) {
    const numeric = Math.min(1, Math.max(0, Number(value)));
    if (!Number.isFinite(numeric)) return;
    const current = activityRef.current;
    replaceActivity({
      ...current,
      stepRatio: numeric,
      stepRatioSelected: true,
    });
  }

  function commitStepRatio() {
    const current = activityRef.current;
    if (
      !hydrated
      || !current.learningRateStarted
      || current.stepRatio === committedRatioRef.current
    ) {
      return;
    }
    committedRatioRef.current = current.stepRatio;
    persist('gradient_learning_rate_commit', current, {
      step_ratio: current.stepRatio,
    });
  }

  const errorDirection = metrics.error < 0 ? -1 : metrics.error > 0 ? 1 : 0;
  const scaledDirection = errorDirection * activeRatio;

  return (
    <div
      ref={rootRef}
      className="gd-react-block gd-auto-update-block"
      data-telemetry-manual
      aria-busy={!hydrated}
    >
      <ContentBlock
        title="网络会自己调整参数，让预测更接近真实值"
        subtitle="依次算出误差方向和两个偏导，再观察更新步长如何影响稳定性。"
      >
        <section
          className="gd-react-rigor-note"
          aria-labelledby="gd-gradient-definition-title"
        >
          <Typography
            as="h3"
            variant="h3"
            tone="accent"
            id="gd-gradient-definition-title"
          >
            梯度是目标函数关于全部参数的局部变化率
          </Typography>
          <Typography variant="bodySmall">
            自动更新之前，先区分计算过程中出现的四个概念。它们共同回答“当前参数稍微改变时，Loss 会怎样改变”，但各自承担的角色不同。
          </Typography>
          <dl className="gd-react-definition-list">
            <div>
              <Typography as="dt" variant="label" tone="accent">局部导数</Typography>
              <Typography as="dd" variant="bodySmall">一个量对另一个量在当前位置的瞬时变化率。它只描述当前位置附近的一阶关系，不直接说明离当前位置很远时函数如何变化。</Typography>
            </div>
            <div>
              <Typography as="dt" variant="label" tone="accent">参数梯度</Typography>
              <Typography as="dd" variant="bodySmall">Loss 关于所有待学习参数的偏导数组成的向量。每个分量对应一个参数，既给出该参数的局部影响方向，也给出一阶变化强度。</Typography>
            </div>
            <div>
              <Typography as="dt" variant="label" tone="accent">链式法则</Typography>
              <Typography as="dd" variant="bodySmall">复合函数的求导规则。权重先影响预测、预测再影响 Loss，因此要把计算路径上相邻的局部导数相乘，才能得到 Loss 对权重的偏导。</Typography>
            </div>
            <div>
              <Typography as="dt" variant="label" tone="accent">负梯度方向</Typography>
              <Typography as="dd" variant="bodySmall">在欧氏长度衡量下，目标函数在当前位置的一阶最速下降方向。它提供局部方向，但是否真的下降还取决于学习率是否足够合适。</Typography>
            </div>
          </dl>
        </section>

        <div
          className={[
            'edu-panel',
            'gd-auto-demo',
            derivativesComplete ? 'is-solved' : '',
            activity.learningRateStarted && !activity.completed ? 'is-practicing' : '',
          ].filter(Boolean).join(' ')}
        >
          <div className="gd-auto-demo-body">
            <div
              className={[
                'gd-learning-grid',
                waitingForReflection ? 'has-question' : '',
              ].filter(Boolean).join(' ')}
            >
              <div
                className={[
                  'gd-guided-update',
                  derivativesComplete ? 'is-solved' : '',
                ].filter(Boolean).join(' ')}
              >
                <div className="gd-math-problem">
                  <FormulaBlock
                    className="gd-update-rule-card"
                    ariaLabel={derivativesComplete ? '代入结果' : '更新规则'}
                    formula={(
                      <>
                        <span className="edu-kicker gd-rule-label">
                          {derivativesComplete ? '代入结果' : '更新规则'}
                        </span>
                        <span className="gd-rule-formula">
                          <FormulaTerm tooltip="本轮更新后的参数">新权重</FormulaTerm>
                          <i>=</i>
                          <FormulaTerm tooltip="本轮更新前的参数">旧权重</FormulaTerm>
                          <i>−</i>
                          <FormulaTerm tooltip="Loss 对当前权重的变化率">偏导</FormulaTerm>
                        </span>
                        {derivativesComplete && (
                          <span className="gd-rule-result">
                            <span className="gd-confirm-equations">
                              <span className="gd-weight-equation">
                                <strong>v₁(new)</strong>
                                <span>=</span>
                                <code>
                                  {compact(activity.weights.v1)} − (
                                  {compact(scaledDirection)} × 3) =
                                  {' '}
                                  <b>{compact(nextPreview.weights.v1)}</b>
                                </code>
                              </span>
                              <span className="gd-weight-equation">
                                <strong>v₂(new)</strong>
                                <span>=</span>
                                <code>
                                  {compact(activity.weights.v2)} − (
                                  {compact(scaledDirection)} × 1) =
                                  {' '}
                                  <b>{compact(nextPreview.weights.v2)}</b>
                                </code>
                              </span>
                            </span>
                          </span>
                        )}
                        {derivativesComplete
                          && !activity.learningRateStarted
                          && !waitingForReflection
                          && !activity.completed && (
                          <span className="gd-update-rule-actions">
                            <Button
                              key="initial-auto-update"
                              variant="primary"
                              hint={activity.history.length === 0}
                              loading={isUpdating}
                              disabled={!canUpdate}
                              onClick={updateOnce}
                            >
                              执行一次参数更新
                            </Button>
                          </span>
                        )}
                      </>
                    )}
                  />

                  {!derivativesComplete && (
                    <div className="gd-known-formulas">
                      <p className="edu-body">
                        <span className="edu-helper">输入</span>
                        <code className="edu-code">h₁ = 3，h₂ = 1</code>
                      </p>
                      <p className="edu-body">
                        <span className="edu-helper">输出</span>
                        <code className="edu-code">y = v₁×h₁ + v₂×h₂</code>
                      </p>
                      <p className="edu-body">
                        <span className="edu-helper">损失</span>
                        <code className="edu-code">L1_loss = |y - GT|</code>
                      </p>
                    </div>
                  )}
                </div>

                {activity.derivativeSolved < 3 && (() => {
                  const questions = [
                    {
                      title: '当前预测值 y < 真实值 GT，L1 Loss 对 y 的偏导是',
                      answerLabel: 'L1 Loss 对 y 的偏导',
                      hint: '固定 GT。当前 y < GT；y 每增加 1，Loss 会怎样变化？',
                    },
                    {
                      title: 'y 对 v₁ 的偏导是',
                      answerLabel: 'y 对 v₁ 的偏导',
                      hint: '由 y = v₁×h₁ + v₂×h₂，只看 v₁ 前面的系数 h₁。',
                    },
                    {
                      title: 'y 对 v₂ 的偏导是',
                      answerLabel: 'y 对 v₂ 的偏导',
                      hint: '由 y = v₁×h₁ + v₂×h₂，只看 v₂ 前面的系数 h₂。',
                    },
                  ];
                  const index = activity.derivativeSolved;
                  const question = questions[index];
                  return (
                    <NumericDerivativeQuestion
                      key={index}
                      index={index}
                      title={question.title}
                      answerLabel={question.answerLabel}
                      hint={question.hint}
                      value={activity.derivativeInputs[index]}
                      feedback={activity.derivativeFeedback[index]}
                      disabled={!hydrated}
                      onChange={(value) => setDerivativeInput(index, value)}
                      onBlur={(relatedTarget) => {
                        persistDerivativeDraft(index, relatedTarget);
                      }}
                      onSubmit={() => submitDerivative(index)}
                    />
                  );
                })()}

                {oscillating && (
                  <NoticeStrip className="gd-oscillation-cue" tone="orange" lead="注意：">
                    预测值已经开始在真实值两侧来回跳动，说明更新步子可能太大，网络正在震荡。
                  </NoticeStrip>
                )}
              </div>
            </div>

            {derivativesComplete && (
              <section className="edu-panel gd-loss-history">
                <header className="gd-loss-history-head">
                  <div>
                    <h3 className="edu-panel-title">L1 loss 训练曲线</h3>
                    <p className="edu-helper">每更新一次新增一个点。</p>
                  </div>
                  {activity.learningRateStarted && (
                    <div className="edu-toolbar gd-auto-controls">
                      <RangeControl
                        key={activity.stepRatioSelected ? 'ratio-selected' : 'ratio-unset'}
                        label={activity.completed ? '学习率' : '步长比例'}
                        min={0}
                        max={1}
                        step={0.05}
                        digits={2}
                        unset={!activity.stepRatioSelected && !activity.completed}
                        value={activity.stepRatio}
                        disabled={isUpdating || activity.completed}
                        onChange={(event) => changeStepRatio(event.currentTarget.value)}
                        onPointerUp={commitStepRatio}
                        onPointerCancel={commitStepRatio}
                        onKeyUp={commitStepRatio}
                        onBlur={commitStepRatio}
                      />
                      <div className="edu-toolbar-actions gd-auto-toolbar-actions">
                        <Button
                          key="learning-rate-update"
                          variant="primary"
                          hint={!activity.completed}
                          loading={isUpdating}
                          disabled={!canUpdate}
                          onClick={updateOnce}
                        >
                          {activity.completed ? 'Loss 已到 0' : '执行一次参数更新'}
                        </Button>
                      </div>
                    </div>
                  )}
                </header>
                <PlotlyChart
                  data={chartData}
                  layout={chartLayout}
                  config={AUTO_CHART_CONFIG}
                  minHeight={180}
                  role="img"
                  aria-label="只显示 L1 loss 的训练指标曲线"
                />
              </section>
            )}

            {waitingForReflection && (
              <section className="gd-oscillation-question">
                <OscillationQuestion
                  answer={activity.oscillationAnswer}
                  review={activity.oscillationReview}
                  hydrated={hydrated}
                  locked={activity.feedbackResolved}
                  reviewing={isReviewingOscillation}
                  streamFeedback={streamOscillationFeedback}
                  onChange={changeOscillationAnswer}
                  onBlur={persistOscillationDraft}
                  onSubmit={() => {
                    void submitOscillation();
                  }}
                />
                {activity.feedbackResolved && (
                  <Button
                    variant="primary"
                    hint
                    onClick={startLearningRatePractice}
                  >
                    去试试吧
                  </Button>
                )}
              </section>
            )}
          </div>

          {activity.learningRateStarted
            && activity.stepRatio === 0
            && !activity.completed && (
            <NoticeStrip tone="orange" lead="当前不会更新：">
              学习率为 0 时参数变化量也是 0。请把学习率调到大于 0，再执行下一步。
            </NoticeStrip>
          )}

          {activity.completed && (
            <Callout
              className="gd-learning-reveal"
              tone="green"
              label="学习率"
              text="Loss 已经足够小。学习率决定每次更新走多大：太大会来回震荡，适当缩小才能稳定靠近最优点。"
            />
          )}
        </div>

        {derivativesComplete && (
          <section
            className="gd-react-rigor-note"
            aria-labelledby="gd-chain-rule-title"
          >
            <Typography
              as="h3"
              variant="h3"
              tone="accent"
              id="gd-chain-rule-title"
            >
              链式法则把局部变化率连成参数梯度
            </Typography>
            <Typography variant="bodySmall">
              上面的三个偏导不是彼此独立的答案。对任一输出层权重 vⱼ，Loss 对权重的偏导等于“Loss 对预测的变化率”与“预测对该权重的变化率”之积。
            </Typography>
            <MathFormulaBlock ariaLabel="L 对 v j 的偏导等于 L 对 y 的偏导乘 y 对 v j 的偏导，并且 y 对 v j 的偏导等于 h j">
              <MathFormulaStatic latex="\frac{\partial L}{\partial v_j}=\frac{\partial L}{\partial y}\frac{\partial y}{\partial v_j},\qquad \frac{\partial y}{\partial v_j}=h_j,\qquad j\in\{1,2\}" />
            </MathFormulaBlock>
            <Typography variant="bodySmall">
              当前 y &lt; GT，所以 ∂L/∂y = −1；与 h₁ = 3、h₂ = 1 相乘后，两个权重的梯度分别为 −3 和 −1。更新规则减去负梯度，因此两个权重都会增大。
            </Typography>
            <MathFormulaBlock ariaLabel="当前关于 v1 和 v2 的梯度向量等于负三和负一，下一步参数等于当前参数减学习率乘梯度">
              <MathFormulaStatic latex="\nabla_{\boldsymbol v}L=\begin{bmatrix}-1\times3\\-1\times1\end{bmatrix}=\begin{bmatrix}-3\\-1\end{bmatrix},\qquad \boldsymbol v^{(t+1)}=\boldsymbol v^{(t)}-\eta_t\nabla_{\boldsymbol v}L\!\left(\boldsymbol v^{(t)}\right)" />
            </MathFormulaBlock>
            <Typography variant="caption" tone="muted">
              严格地说，L1 Loss 在 y = GT 处不可导；此时可使用区间 [−1, 1] 内的次梯度。本演示在 Loss 足够小时停止更新，避免在折点附近反复跳动。
            </Typography>
          </section>
        )}

        {activity.learningRateStarted && (
          <section
            className="gd-react-rigor-note"
            aria-labelledby="gd-learning-rate-title"
          >
            <Typography
              as="h3"
              variant="h3"
              tone="accent"
              id="gd-learning-rate-title"
            >
              负梯度给方向，学习率决定这一步是否可靠
            </Typography>
            <Typography variant="bodySmall">
              对可微目标 J，在当前位置附近做一阶近似，并令参数变化量 Δθ = −η∇J，可得到目标值下降的局部解释。
            </Typography>
            <dl className="gd-react-definition-list">
              <div>
                <Typography as="dt" variant="label" tone="accent">学习率 η</Typography>
                <Typography as="dd" variant="bodySmall">梯度前的正数缩放系数，控制一次参数更新的长度。它是训练算法的超参数，不是由当前网络前向计算直接得到的模型参数。</Typography>
              </div>
              <div>
                <Typography as="dt" variant="label" tone="accent">一次迭代</Typography>
                <Typography as="dd" variant="bodySmall">使用当前参数完成前向计算、求损失、求梯度并更新参数的一轮过程。更新后的参数属于下一次迭代，不能反过来参与本轮其他梯度的计算。</Typography>
              </div>
              <div>
                <Typography as="dt" variant="label" tone="accent">收敛</Typography>
                <Typography as="dd" variant="bodySmall">随着迭代继续，参数序列或目标函数值逐渐接近稳定极限。实际训练常用梯度范数、目标变化量或迭代次数作为停止判据；停止不等同于数学上已经收敛，收敛也不保证到达全局最优解。</Typography>
              </div>
              <div>
                <Typography as="dt" variant="label" tone="accent">震荡与发散</Typography>
                <Typography as="dd" variant="bodySmall">震荡指更新反复越过低值区域；发散指目标值或参数总体远离可接受范围。过大的学习率是常见原因，但损失曲面的尺度和曲率同样会影响稳定性。</Typography>
              </div>
            </dl>
            <MathFormulaBlock ariaLabel="J 在 theta 加 delta theta 处近似等于 J theta 加梯度与 delta theta 的内积，代入负学习率乘梯度后近似等于 J theta 减学习率乘梯度范数平方">
              <MathFormulaStatic latex="J(\boldsymbol\theta+\Delta\boldsymbol\theta)\approx J(\boldsymbol\theta)+\nabla J(\boldsymbol\theta)^{\!\top}\Delta\boldsymbol\theta,\qquad J(\boldsymbol\theta-\eta\nabla J)\approx J(\boldsymbol\theta)-\eta\lVert\nabla J\rVert_2^2" />
            </MathFormulaBlock>
            <ul className="gd-react-rigor-list">
              <Typography as="li" variant="bodySmall">
                η = 0 时参数不更新；η 很小时通常较稳定，但需要更多迭代。
              </Typography>
              <Typography as="li" variant="bodySmall">
                η 过大时，一阶近似不再可靠，更新可能越过低点并产生震荡，甚至让 Loss 发散。
              </Typography>
              <Typography as="li" variant="bodySmall">
                负梯度是当前位置的一阶最速下降方向，不等于“任意步长都使 Loss 下降”。
              </Typography>
            </ul>
          </section>
        )}

        <div className="gd-auto-network-card">
          <GradientNetworkDiagram
            mode="output"
            weights={activity.weights}
            target={MANUAL_TARGET}
            updating={isUpdating}
            className="gd-network-canvas--auto"
          />
        </div>
      </ContentBlock>
    </div>
  );
}
