import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Button,
  Feedback,
  emitTelemetry,
  getTelemetryState,
  type QuestionCheckResult,
  type ShortAnswerReview,
} from '../../shared/react';
import { flushLenetTelemetrySoon } from './usePersistedActivity';

interface PersistedQuestionResult {
  ok: boolean;
  empty?: boolean;
  answer: string[];
  tone?: 'correct' | 'wrong' | 'hint';
  message?: string;
}

interface PersistedShortAnswerState {
  selected_values?: string[];
  answer_fields?: Array<{ value?: unknown }>;
  correct?: boolean | null;
  submission_id?: string;
  submitted?: boolean;
  result?: PersistedQuestionResult | null;
  review_status?: 'pending' | 'complete' | 'failed';
}

interface PersistedShortAnswerQuestionProps {
  persistenceKey: string;
  title: ReactNode;
  rows?: number;
  submitText?: ReactNode;
  className?: string;
  review: (answers: string[]) => Promise<ShortAnswerReview>;
  onCheck?: (result: QuestionCheckResult) => void;
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

interface LenetTelemetryFlushApi {
  flush?: () => Promise<boolean> | boolean;
}

function waitForTelemetry(delayMs: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, delayMs));
}

function createSubmissionId() {
  if (typeof window.crypto?.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function persistSubmitBeforeReview(
  stateKey: string,
  answerValue: string,
  submissionId: string,
): Promise<boolean> {
  const telemetry = window.__DL_TELEMETRY__ as (
    typeof window.__DL_TELEMETRY__ & LenetTelemetryFlushApi
  );
  if (!telemetry?.flush) return false;

  const deadline = Date.now() + 2500;
  while (Date.now() < deadline) {
    const flushBudget = Math.min(500, deadline - Date.now());
    if (flushBudget <= 0) break;
    try {
      await Promise.race([
        Promise.resolve(telemetry.flush()),
        waitForTelemetry(flushBudget),
      ]);
    } catch {
      // A later attempt or the pagehide beacon may still persist the batch.
    }

    const stateBudget = Math.min(500, deadline - Date.now());
    if (stateBudget <= 0) break;
    const entry = await Promise.race([
      getTelemetryState<PersistedShortAnswerState>(stateKey),
      waitForTelemetry(stateBudget).then(() => null),
    ]);
    const storedValue = String(entry?.state?.answer_fields?.[0]?.value ?? '');
    if (
      entry?.state?.submitted === true
      && entry.state.review_status === 'pending'
      && entry.state.submission_id === submissionId
      && storedValue === answerValue
    ) {
      return true;
    }

    const waitBudget = Math.min(50, deadline - Date.now());
    if (waitBudget > 0) await waitForTelemetry(waitBudget);
  }

  return false;
}

function persistableMessage(message: ReactNode) {
  return typeof message === 'string' || typeof message === 'number'
    ? String(message)
    : undefined;
}

function restoredResult(
  stored: PersistedQuestionResult,
  fallbackAnswer: string[],
): QuestionCheckResult {
  return {
    ok: stored.ok === true,
    empty: stored.empty,
    answer: Array.isArray(stored.answer) ? stored.answer.map(String) : fallbackAnswer,
    tone: stored.tone,
    message: stored.message,
  };
}

/**
 * LeNet's LLM-reviewed questions persist the user's submit before awaiting the
 * slow review service. This keeps the shared visual contract while avoiding a
 * module-specific async gap in which a refresh could discard the answer.
 */
export function PersistedShortAnswerQuestion({
  persistenceKey,
  title,
  rows = 5,
  submitText = '检查答案',
  className,
  review,
  onCheck,
}: PersistedShortAnswerQuestionProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const mountedRef = useRef(true);
  const reviewTokenRef = useRef(0);
  const reviewingRef = useRef(false);
  const reviewRef = useRef(review);
  const onCheckRef = useRef(onCheck);
  const [value, setValue] = useState('');
  const [result, setResult] = useState<QuestionCheckResult | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [restoredFeedback, setRestoredFeedback] = useState(false);
  const stateKey = `question:${persistenceKey}`;

  reviewRef.current = review;
  onCheckRef.current = onCheck;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      reviewingRef.current = false;
      reviewTokenRef.current += 1;
    };
  }, []);

  const emitState = useCallback((
    eventName: 'answer_change' | 'answer_submit' | 'question_reviewed' | 'question_review_failed',
    answerValue: string,
    submitted: boolean,
    checked: QuestionCheckResult | null,
    reviewStatus?: PersistedShortAnswerState['review_status'],
    observation = false,
    submissionId?: string,
  ) => {
    const answerFields = [{
      value: answerValue,
      length: Array.from(answerValue).length,
      empty: !answerValue.trim(),
    }];
    const persistedResult: PersistedQuestionResult | null = checked ? {
      ok: checked.ok,
      empty: checked.empty,
      answer: checked.answer,
      tone: checked.tone,
      message: persistableMessage(checked.message),
    } : null;
    const state: PersistedShortAnswerState = {
      selected_values: [],
      answer_fields: answerFields,
      correct: checked?.ok ?? null,
      submission_id: submissionId,
      submitted,
      result: persistedResult,
      review_status: reviewStatus,
    };

    emitTelemetry(eventName, rootRef.current, {
      state_key: stateKey,
      question_type: 'short',
      selected_values: [],
      answer_fields: answerFields,
      correct: checked?.ok ?? null,
      submission_id: submissionId,
      submitted,
      result: persistedResult,
      review_status: reviewStatus,
      ...(observation ? { event_kind: 'observation', user_initiated: false } : {}),
      state,
    });
    flushLenetTelemetrySoon();
  }, [stateKey]);

  const runReview = useCallback(async (answerValue: string, submissionId?: string) => {
    if (reviewingRef.current) return;
    reviewingRef.current = true;
    const token = ++reviewTokenRef.current;
    const answers = [answerValue];
    setRestoredFeedback(false);
    setIsReviewing(true);
    setResult({
      ok: false,
      empty: false,
      answer: answers,
      tone: 'hint',
      message: '正在分析你的回答，请稍候。',
    });

    try {
      const reviewed = await reviewRef.current(answers);
      if (!mountedRef.current || reviewTokenRef.current !== token) return;
      const checked: QuestionCheckResult = {
        ok: reviewed.ok,
        empty: false,
        answer: answers,
        tone: reviewed.tone,
        message: reviewed.message,
      };
      setResult(checked);
      onCheckRef.current?.(checked);
      emitState('question_reviewed', answerValue, true, checked, 'complete', true, submissionId);
    } catch {
      if (!mountedRef.current || reviewTokenRef.current !== token) return;
      const checked: QuestionCheckResult = {
        ok: false,
        empty: false,
        answer: answers,
        tone: 'wrong',
        message: '评阅服务暂时不可用，请稍后重试。',
      };
      setResult(checked);
      onCheckRef.current?.(checked);
      emitState('question_review_failed', answerValue, true, checked, 'failed', true, submissionId);
    } finally {
      if (mountedRef.current && reviewTokenRef.current === token) {
        reviewingRef.current = false;
        setIsReviewing(false);
      }
    }
  }, [emitState]);

  useEffect(() => {
    let active = true;
    setHydrated(false);
    setValue('');
    setResult(null);
    setIsReviewing(false);
    setRestoredFeedback(false);

    void getTelemetryState<PersistedShortAnswerState>(stateKey).then((entry) => {
      if (!active || !mountedRef.current) return;
      const restoredValue = String(entry?.state?.answer_fields?.[0]?.value ?? '');
      setValue(restoredValue);
      const wasSubmitted = entry?.state?.submitted
        ?? (entry?.event_name === 'answer_submit');
      const stored = entry?.state?.result;
      setHydrated(true);

      if (wasSubmitted && stored) {
        const checked = restoredResult(stored, [restoredValue]);
        setResult(checked);
        setRestoredFeedback(true);
        onCheckRef.current?.(checked);
        return;
      }

      if (wasSubmitted && restoredValue.trim()) {
        void runReview(restoredValue, entry?.state?.submission_id);
      }
    });

    return () => { active = false; };
  }, [runReview, stateKey]);

  const submit = useCallback(() => {
    if (!hydrated || reviewingRef.current) return;
    const answerValue = value;
    const answers = [answerValue];
    const empty = !answerValue.trim();
    setRestoredFeedback(false);

    if (empty) {
      const checked: QuestionCheckResult = {
        ok: false,
        empty: true,
        answer: answers,
        tone: 'hint',
        message: '请先完成作答，再检查答案。',
      };
      setResult(checked);
      onCheckRef.current?.(checked);
      emitState('answer_submit', answerValue, true, checked, 'complete');
      return;
    }

    const submissionId = createSubmissionId();
    // Lock synchronously, then persist the semantic action before LLM review.
    reviewingRef.current = true;
    setIsReviewing(true);
    emitState('answer_submit', answerValue, true, null, 'pending', false, submissionId);
    void (async () => {
      await persistSubmitBeforeReview(stateKey, answerValue, submissionId);
      if (!mountedRef.current) return;

      // runReview owns and releases the lock during the review request.
      reviewingRef.current = false;
      void runReview(answerValue, submissionId);
    })();
  }, [emitState, hydrated, runReview, stateKey, value]);

  return (
    <section
      className={classNames('dl-question', 'dl-question--short', className)}
      ref={rootRef}
      data-question-type="short"
      data-submit-mode="manual"
      data-state-key={stateKey}
      data-telemetry-manual
    >
      <header className="dl-question-head">
        <span className="dl-question-type">简答题</span>
        <div className="dl-question-title-row">
          <strong className="dl-question-stem">{title}</strong>
          <Button
            variant="primary"
            className="dl-question-submit"
            disabled={!hydrated || isReviewing}
            loading={isReviewing}
            aria-busy={isReviewing}
            onClick={submit}
          >
            {isReviewing ? '正在分析' : submitText}
          </Button>
        </div>
      </header>

      <div className="dl-question-fields">
        <label className="dl-question-field">
          <textarea
            rows={rows}
            value={value}
            data-role="question-answer"
            readOnly={!hydrated || isReviewing}
            aria-busy={isReviewing}
            onChange={(event) => {
              const nextValue = event.target.value;
              reviewTokenRef.current += 1;
              setValue(nextValue);
              setResult(null);
              setRestoredFeedback(false);
              emitState('answer_change', nextValue, false, null);
            }}
          />
        </label>
      </div>

      <Feedback
        status={result?.tone ?? 'info'}
        message={result?.message}
        streaming={!restoredFeedback && Boolean(result && !result.empty)}
        className="dl-question-feedback"
        hidden={!result}
      />
    </section>
  );
}
