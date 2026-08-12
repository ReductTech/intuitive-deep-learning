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
  MathFormulaBlock,
  MathFormulaStatic,
  MathFormulaTerm,
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
import {
  ChainRuleSection,
  GradientClippingSection,
  GradientDefinitionSection,
  KnowledgePoint,
  LearningRateSection,
  MomentumSection,
  OptimizationLandscapeSection,
} from './rigor';

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
  const latestUpdate = activity.history[activity.history.length - 1] ?? null;
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
        <GradientDefinitionSection />

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
                  <div className="edu-formula-block gd-update-rule-card" aria-label={derivativesComplete ? '代入结果' : '更新规则'}>
                    <Typography as="span" variant="h3" tone="accent" className="gd-rule-label">
                      {derivativesComplete ? '代入结果' : '更新规则'}
                    </Typography>
                    <MathFormulaBlock className="gd-update-rule-formula" ariaLabel="下一步权重等于当前权重减学习率乘当前梯度">
                      <MathFormulaTerm latex="\boldsymbol v^{(t+1)}" tooltip="本轮更新后得到的新权重。" ariaLabel="下一步权重" />
                      <MathFormulaStatic latex="=" />
                      <MathFormulaTerm latex="\boldsymbol v^{(t)}" tooltip="本轮更新开始时使用的旧权重。" ariaLabel="当前权重" />
                      <MathFormulaStatic latex="-" />
                      <MathFormulaTerm latex="\eta_t" tooltip="ηₜ：本轮学习率，控制参数更新步长。" ariaLabel="当前学习率" tone="warm" />
                      <MathFormulaTerm latex="\nabla_{\boldsymbol v}L" tooltip="损失关于当前权重的梯度，给出局部上升最快方向。" ariaLabel="损失对当前权重的梯度" />
                    </MathFormulaBlock>
                    {derivativesComplete && (
                      <div className="gd-rule-result">
                        <div className="gd-confirm-equations">
                          <MathFormulaBlock className="gd-weight-equation" ariaLabel="代入数值后的 v1 更新">
                            <MathFormulaTerm latex="v_1^{(t+1)}" tooltip="更新后的第一个输出层权重。" ariaLabel="更新后的 v1" />
                            <MathFormulaStatic latex="=" />
                            <MathFormulaTerm latex={`${compact(activity.weights.v1)}-\\left(${compact(scaledDirection)}\\times3\\right)`} tooltip="旧权重减去缩放后的梯度分量。" ariaLabel="v1 的数值更新计算" />
                            <MathFormulaStatic latex="=" />
                            <MathFormulaTerm latex={compact(nextPreview.weights.v1)} tooltip="本次更新得到的新 v1。" ariaLabel="新的 v1" tone="warm" />
                          </MathFormulaBlock>
                          <MathFormulaBlock className="gd-weight-equation" ariaLabel="代入数值后的 v2 更新">
                            <MathFormulaTerm latex="v_2^{(t+1)}" tooltip="更新后的第二个输出层权重。" ariaLabel="更新后的 v2" />
                            <MathFormulaStatic latex="=" />
                            <MathFormulaTerm latex={`${compact(activity.weights.v2)}-\\left(${compact(scaledDirection)}\\times1\\right)`} tooltip="旧权重减去缩放后的梯度分量。" ariaLabel="v2 的数值更新计算" />
                            <MathFormulaStatic latex="=" />
                            <MathFormulaTerm latex={compact(nextPreview.weights.v2)} tooltip="本次更新得到的新 v2。" ariaLabel="新的 v2" tone="warm" />
                          </MathFormulaBlock>
                        </div>
                      </div>
                    )}
                    {derivativesComplete
                      && !activity.learningRateStarted
                      && !waitingForReflection
                      && !activity.completed && (
                      <div className="gd-update-rule-actions">
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
                      </div>
                    )}
                  </div>

                  {!derivativesComplete && (
                    <div className="gd-known-formulas">
                      <div className="gd-known-formula">
                        <Typography variant="bodySmall" tone="muted">输入</Typography>
                        <MathFormulaBlock ariaLabel="隐藏层输入 h1 等于三，h2 等于一">
                          <MathFormulaTerm latex="h_1" tooltip="h₁：进入第一个输出权重的隐藏层数值。" ariaLabel="隐藏层输出 h1" />
                          <MathFormulaStatic latex="=" />
                          <MathFormulaTerm latex="3" tooltip="当前 h₁ 的固定数值。" ariaLabel="h1 等于三" />
                          <MathFormulaStatic latex="," />
                          <MathFormulaTerm latex="h_2" tooltip="h₂：进入第二个输出权重的隐藏层数值。" ariaLabel="隐藏层输出 h2" />
                          <MathFormulaStatic latex="=" />
                          <MathFormulaTerm latex="1" tooltip="当前 h₂ 的固定数值。" ariaLabel="h2 等于一" />
                        </MathFormulaBlock>
                      </div>
                      <div className="gd-known-formula">
                        <Typography variant="bodySmall" tone="muted">输出</Typography>
                        <MathFormulaBlock ariaLabel="预测 y 等于两个权重与隐藏层输出乘积之和">
                          <MathFormulaTerm latex="y" tooltip="y：网络当前得到的预测值。" ariaLabel="预测值 y" />
                          <MathFormulaStatic latex="=" />
                          <MathFormulaTerm latex="v_1h_1" tooltip="第一个输出权重与对应隐藏层输出的乘积。" ariaLabel="v1 乘 h1" />
                          <MathFormulaStatic latex="+" />
                          <MathFormulaTerm latex="v_2h_2" tooltip="第二个输出权重与对应隐藏层输出的乘积。" ariaLabel="v2 乘 h2" />
                        </MathFormulaBlock>
                      </div>
                      <div className="gd-known-formula">
                        <Typography variant="bodySmall" tone="muted">损失</Typography>
                        <MathFormulaBlock ariaLabel="L1 损失等于预测与真实目标之差的绝对值">
                          <MathFormulaTerm latex="\ell_{\mathrm{L1}}" tooltip="当前样本的 L1 损失。" ariaLabel="L1 损失" />
                          <MathFormulaStatic latex="=" />
                          <MathFormulaTerm latex="|y-\mathrm{GT}|" tooltip="预测值与真实目标 GT 之差的绝对值。" ariaLabel="预测与真实目标的绝对误差" />
                        </MathFormulaBlock>
                      </div>
                    </div>
                  )}
                </div>

                {activity.derivativeSolved > 0 && !derivativesComplete && (
                  <KnowledgePoint
                    ariaLabel="局部导数知识点"
                    title={activity.derivativeSolved === 1 ? '知识点：L1 对预测的导数先决定误差方向' : '知识点：线性输出对权重的偏导就是对应输入'}
                  >
                    {activity.derivativeSolved === 1
                      ? '当前 y < GT，提高 y 会让 L1 Loss 等量减小，因此 ∂L/∂y = −1。负号表示若只改变预测值，应向增大的方向修正。'
                      : '由 y = v₁h₁ + v₂h₂，对 v₁ 求偏导时固定 v₂，得到 ∂y/∂v₁ = h₁ = 3。这个结果衡量 v₁ 在当前位置对输出的局部影响。'}
                  </KnowledgePoint>
                )}

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

                {derivativesComplete && (
                  <KnowledgePoint ariaLabel="链式法则准备知识点" title="知识点：三个局部导数需要沿计算路径组合">
                    最后一个答案给出 ∂y/∂v₂ = h₂ = 1。现在已有 ∂L/∂y、∂y/∂v₁、∂y/∂v₂；分别相乘后，才能得到 Loss 关于两个权重的完整梯度分量。
                  </KnowledgePoint>
                )}

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

            {latestUpdate && (
              <KnowledgePoint
                ariaLabel="参数更新知识点"
                title={activity.history.length === 1
                  ? '知识点：一次更新必须使用同一组旧参数'
                  : activity.learningRateStarted
                    ? '知识点：学习率改变步长，不改变当前梯度的定义'
                    : oscillating
                      ? '知识点：方向正确也可能因为步长过大而震荡'
                      : '知识点：迭代会重复同一套计算顺序'}
              >
                {activity.history.length === 1
                  ? `第一次更新把 Loss 从 ${format(latestUpdate.before.loss, 3)} 变为 ${format(latestUpdate.after.loss, 3)}。两个权重的梯度都由更新前的同一组参数计算，再同时生成新权重。`
                  : activity.learningRateStarted
                    ? `当前步长比例为 ${format(activeRatio, 2)}，这一步把 Loss 从 ${format(latestUpdate.before.loss, 3)} 变为 ${format(latestUpdate.after.loss, 3)}。缩放的是参数移动距离，局部导数和链式法则本身没有改变。`
                    : oscillating
                      ? `已经执行 ${activity.history.length} 次更新。固定步长让预测反复越过目标附近的低损失位置，说明负梯度只保证局部方向，不能保证任意步长都下降。`
                      : `第 ${activity.history.length} 次更新仍按“前向计算—求 Loss—求梯度—同时更新参数”的顺序执行；下一次迭代只能使用本次产生的新参数。`}
              </KnowledgePoint>
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
                  <KnowledgePoint ariaLabel="震荡处理知识点" title="知识点：处理震荡是在控制更新幅度">
                    减小学习率会缩短沿负梯度方向移动的距离，使参数不易反复越过低损失区域。它不会改变当前梯度的数学定义，只会改变梯度对本次参数更新的缩放程度。
                  </KnowledgePoint>
                )}
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
          {activity.learningRateStarted
            && activity.stepRatioSelected
            && !activity.completed && (
            <KnowledgePoint ariaLabel="学习率调节知识点" title="知识点：学习率是更新规则的超参数">
              你把当前步长比例设为 {format(activity.stepRatio, 2)}。它控制参数沿负梯度方向移动多远：数值较小通常更稳定但需要更多次更新，数值较大可能更快，也更容易越过低损失区域。
            </KnowledgePoint>
          )}

          {activity.completed && (
            <Callout
              className="gd-learning-reveal"
              tone="green"
              label="学习率"
              text="Loss 已经足够小。学习率决定每次更新走多大：太大会来回震荡，适当缩小才能稳定靠近最优点。"
            />
          )}
          {activity.completed && (
            <KnowledgePoint ariaLabel="停止条件知识点" title="知识点：达到停止阈值不等于证明全局最优">
              本演示在 Loss 足够小时停止，是一个工程停止条件。它说明当前参数已经满足本页要求，但不能单独证明参数序列已在数学意义上收敛，也不能证明找到了所有可能参数中的全局最优解。
            </KnowledgePoint>
          )}
        </div>

        {derivativesComplete && (
          <ChainRuleSection />
        )}

        {activity.learningRateStarted && (
          <>
            <LearningRateSection />
            <OptimizationLandscapeSection />
            <MomentumSection />
            <GradientClippingSection />
          </>
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
