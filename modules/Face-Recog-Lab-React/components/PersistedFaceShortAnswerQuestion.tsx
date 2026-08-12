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
  currentModuleId,
  emitTelemetry,
  getTelemetryState,
  type QuestionCheckResult,
  type TelemetryStateEntry,
} from '../../shared/react';
import { reviewFaceVerificationAnswer } from '../services/faceVerificationFeedback';

export type FaceQuestionReviewStatus = 'pending' | 'complete' | 'failed';

export interface PersistedFaceQuestionResult {
  ok: boolean;
  empty?: boolean;
  answer: string[];
  tone?: 'correct' | 'wrong' | 'hint';
  message?: string;
}

export interface PersistedFaceShortAnswerState {
  selected_values?: string[];
  answer_fields?: Array<{ value?: unknown; length?: number; empty?: boolean }>;
  correct?: boolean | null;
  submission_id?: string;
  submitted?: boolean;
  result?: PersistedFaceQuestionResult | null;
  review_status?: FaceQuestionReviewStatus;
}

export interface FaceShortAnswerReview {
  ok: boolean;
  tone: 'correct' | 'wrong' | 'hint';
  message: string;
}

export type FaceQuestionResultSource = 'user' | 'restore';

export interface FaceQuestionCheckMeta {
  source: FaceQuestionResultSource;
}

export interface PersistedFaceShortAnswerQuestionProps {
  persistenceKey: string;
  title: ReactNode;
  rows?: number;
  submitText?: ReactNode;
  retryText?: ReactNode;
  className?: string;
  review?: (answers: string[]) => Promise<FaceShortAnswerReview>;
  onCheck?: (result: QuestionCheckResult, meta: FaceQuestionCheckMeta) => void;
}

interface FaceTelemetryFlushApi {
  flush?: () => Promise<boolean> | boolean;
}

type FaceQuestionEventName =
  | 'answer_change'
  | 'answer_submit'
  | 'question_review_retry'
  | 'question_reviewed'
  | 'question_review_failed';

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function waitForTelemetry(delayMs: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, delayMs));
}

async function loadFaceQuestionState(stateKey: string) {
  const telemetry = window.__DL_TELEMETRY__;
  if (!telemetry?.getModuleState) return { ok: false as const };
  try {
    const document = await Promise.race([
      telemetry.getModuleState(currentModuleId()),
      waitForTelemetry(2500).then(() => null),
    ]);
    if (!document || document.ok !== true) return { ok: false as const };
    return {
      ok: true as const,
      entry: (document.states?.[stateKey] as (
        TelemetryStateEntry<PersistedFaceShortAnswerState> | undefined
      )) ?? null,
    };
  } catch {
    return { ok: false as const };
  }
}

function createSubmissionId() {
  if (typeof window.crypto?.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function flushQuestionTelemetrySoon() {
  window.setTimeout(() => {
    const telemetry = window.__DL_TELEMETRY__ as (
      typeof window.__DL_TELEMETRY__ & FaceTelemetryFlushApi
    );
    try {
      void Promise.resolve(telemetry?.flush?.()).catch(() => undefined);
    } catch {
      // The page remains usable when Telemetry is intentionally not running.
    }
  }, 0);
}

/**
 * Confirms the exact pending submission in SQLite before the LLM is called.
 * Merely queueing an event in the browser is not sufficient for this gate.
 */
async function confirmPendingSubmission(
  stateKey: string,
  answerValue: string,
  submissionId: string,
): Promise<boolean> {
  const telemetry = window.__DL_TELEMETRY__ as (
    typeof window.__DL_TELEMETRY__ & FaceTelemetryFlushApi
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
      // Retry until the deadline; the following readback is authoritative.
    }

    const readBudget = Math.min(500, deadline - Date.now());
    if (readBudget <= 0) break;
    const entry = await Promise.race([
      getTelemetryState<PersistedFaceShortAnswerState>(stateKey),
      waitForTelemetry(readBudget).then(() => null),
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

    const retryBudget = Math.min(50, deadline - Date.now());
    if (retryBudget > 0) await waitForTelemetry(retryBudget);
  }

  return false;
}

function restoredResult(
  stored: PersistedFaceQuestionResult,
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
 * Face-only short answer adapter.
 *
 * It deliberately stays outside shared because its durable-before-review
 * protocol and pending retry behavior are private to this module migration.
 */
export function PersistedFaceShortAnswerQuestion({
  persistenceKey,
  title,
  rows = 5,
  submitText = '提交回答',
  retryText = '重试评阅',
  className,
  review = reviewFaceVerificationAnswer,
  onCheck,
}: PersistedFaceShortAnswerQuestionProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const mountedRef = useRef(true);
  const reviewTokenRef = useRef(0);
  const reviewingRef = useRef(false);
  const persistenceAvailableRef = useRef<boolean | null>(null);
  const reviewRef = useRef(review);
  const onCheckRef = useRef(onCheck);
  const [value, setValue] = useState('');
  const [result, setResult] = useState<QuestionCheckResult | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [restoredFeedback, setRestoredFeedback] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<FaceQuestionReviewStatus | undefined>();
  const [submissionId, setSubmissionId] = useState<string | undefined>();
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
    eventName: FaceQuestionEventName,
    answerValue: string,
    submitted: boolean,
    checked: QuestionCheckResult | null,
    nextReviewStatus?: FaceQuestionReviewStatus,
    observation = false,
    nextSubmissionId?: string,
  ) => {
    if (persistenceAvailableRef.current !== true || !window.__DL_TELEMETRY__?.emit) {
      return false;
    }

    const answerFields = [{
      value: answerValue,
      length: Array.from(answerValue).length,
      empty: !answerValue.trim(),
    }];
    const persistedResult: PersistedFaceQuestionResult | null = checked ? {
      ok: checked.ok,
      empty: checked.empty,
      answer: checked.answer,
      tone: checked.tone,
      message: typeof checked.message === 'string'
        ? checked.message
        : typeof checked.message === 'number'
          ? String(checked.message)
          : undefined,
    } : null;
    const state: PersistedFaceShortAnswerState = {
      selected_values: [],
      answer_fields: answerFields,
      correct: checked?.ok ?? null,
      submission_id: nextSubmissionId,
      submitted,
      result: persistedResult,
      review_status: nextReviewStatus,
    };

    try {
      emitTelemetry(eventName, rootRef.current, {
        state_key: stateKey,
        question_type: 'short',
        selected_values: [],
        answer_fields: answerFields,
        correct: checked?.ok ?? null,
        submission_id: nextSubmissionId,
        submitted,
        result: persistedResult,
        review_status: nextReviewStatus,
        ...(observation ? { event_kind: 'observation', user_initiated: false } : {}),
        state,
      });
      flushQuestionTelemetrySoon();
      return true;
    } catch {
      persistenceAvailableRef.current = false;
      return false;
    }
  }, [stateKey]);

  const runPersistedReview = useCallback(async (
    answerValue: string,
    nextSubmissionId: string,
    pendingEvent: 'answer_submit' | 'question_review_retry',
  ) => {
    if (reviewingRef.current) return;
    reviewingRef.current = true;
    const token = ++reviewTokenRef.current;
    const answers = [answerValue];
    setSubmissionId(nextSubmissionId);
    setReviewStatus('pending');
    setRestoredFeedback(false);
    setIsReviewing(true);
    setResult({
      ok: false,
      empty: false,
      answer: answers,
      tone: 'hint',
      message: '正在分析你的回答，请稍候。',
    });
    const shouldConfirmPersistence = emitState(
      pendingEvent,
      answerValue,
      true,
      null,
      'pending',
      false,
      nextSubmissionId,
    );

    try {
      if (shouldConfirmPersistence) {
        const persisted = await confirmPendingSubmission(stateKey, answerValue, nextSubmissionId);
        if (!mountedRef.current || reviewTokenRef.current !== token) return;
        if (!persisted) {
          // The pending write could not be confirmed. Continue this attempt in
          // memory and stop emitting further state for the current page load.
          persistenceAvailableRef.current = false;
        }
      }

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
      setReviewStatus('complete');
      onCheckRef.current?.(checked, { source: 'user' });
      emitState(
        'question_reviewed',
        answerValue,
        true,
        checked,
        'complete',
        true,
        nextSubmissionId,
      );
    } catch (error) {
      if (!mountedRef.current || reviewTokenRef.current !== token) return;
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : '评阅服务暂时不可用，请稍后重试。';
      const checked: QuestionCheckResult = {
        ok: false,
        empty: false,
        answer: answers,
        tone: 'wrong',
        message,
      };
      setResult(checked);
      setReviewStatus('failed');
      onCheckRef.current?.(checked, { source: 'user' });
      emitState(
        'question_review_failed',
        answerValue,
        true,
        checked,
        'failed',
        true,
        nextSubmissionId,
      );
    } finally {
      if (mountedRef.current && reviewTokenRef.current === token) {
        reviewingRef.current = false;
        setIsReviewing(false);
      }
    }
  }, [emitState, stateKey]);

  useEffect(() => {
    let active = true;
    setHydrated(false);
    setValue('');
    setResult(null);
    setIsReviewing(false);
    setRestoredFeedback(false);
    setReviewStatus(undefined);
    setSubmissionId(undefined);
    persistenceAvailableRef.current = null;

    void loadFaceQuestionState(stateKey).then((loaded) => {
      if (!active || !mountedRef.current) return;
      if (!loaded.ok) {
        // Telemetry is optional during local UI and flow review. This session
        // starts from a clean in-memory answer and refresh starts over again.
        persistenceAvailableRef.current = false;
        setHydrated(true);
        return;
      }

      persistenceAvailableRef.current = true;
      const entry = loaded.entry;
      const restoredValue = String(entry?.state?.answer_fields?.[0]?.value ?? '');
      const restoredSubmissionId = entry?.state?.submission_id;
      const restoredStatus = entry?.state?.review_status;
      const wasSubmitted = entry?.state?.submitted
        ?? entry?.event_name === 'answer_submit';
      const stored = entry?.state?.result;

      setValue(restoredValue);
      setSubmissionId(restoredSubmissionId);
      setHydrated(true);

      if (wasSubmitted && stored && (restoredStatus === 'complete' || restoredStatus === 'failed')) {
        const checked = restoredResult(stored, [restoredValue]);
        setResult(checked);
        setReviewStatus(restoredStatus);
        setRestoredFeedback(true);
        onCheckRef.current?.(checked, { source: 'restore' });
        return;
      }

      // Backward compatibility for a completed pre-status record.
      if (wasSubmitted && stored && restoredStatus === undefined) {
        const checked = restoredResult(stored, [restoredValue]);
        setResult(checked);
        setReviewStatus('complete');
        setRestoredFeedback(true);
        onCheckRef.current?.(checked, { source: 'restore' });
        return;
      }

      if (wasSubmitted && restoredValue.trim()) {
        // A pending restore never becomes a synthetic user action and never
        // invokes the LLM automatically. The learner decides whether to retry.
        setReviewStatus('pending');
        setRestoredFeedback(true);
        setResult({
          ok: false,
          empty: false,
          answer: [restoredValue],
          tone: 'hint',
          message: '上次评阅尚未完成。确认 Telemetry 和分析服务可用后，可主动重试。',
        });
      }
    });

    return () => { active = false; };
  }, [stateKey]);

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
        message: '请先完成作答，再提交回答。',
      };
      setResult(checked);
      setReviewStatus('complete');
      setSubmissionId(undefined);
      onCheckRef.current?.(checked, { source: 'user' });
      emitState('answer_submit', answerValue, true, checked, 'complete');
      return;
    }

    const nextSubmissionId = createSubmissionId();
    void runPersistedReview(answerValue, nextSubmissionId, 'answer_submit');
  }, [emitState, hydrated, runPersistedReview, value]);

  const retry = useCallback(() => {
    if (!hydrated || reviewingRef.current || !value.trim()) return;
    const nextSubmissionId = createSubmissionId();
    void runPersistedReview(value, nextSubmissionId, 'question_review_retry');
  }, [hydrated, runPersistedReview, value]);

  const canRetry = !isReviewing
    && Boolean(value.trim())
    && (reviewStatus === 'pending' || reviewStatus === 'failed');

  return (
    <section
      className={classNames('dl-question', 'dl-question--short', className)}
      ref={rootRef}
      data-question-type="short"
      data-submit-mode="manual"
      data-state-key={stateKey}
      data-review-status={reviewStatus}
      data-telemetry-manual
      onBlurCapture={(event) => {
        const target = event.target;
        if (!(target instanceof Element) || !target.matches('[data-role="question-answer"]')) return;
        if (result || reviewingRef.current) return;
        if (event.relatedTarget instanceof Element
          && event.relatedTarget.closest('.dl-question-submit, .dl-question-retry')) return;
        emitState('answer_change', value, false, null);
      }}
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
              setReviewStatus(undefined);
              setSubmissionId(undefined);
              setRestoredFeedback(false);
            }}
          />
        </label>
      </div>

      <Feedback
        status={result?.tone ?? 'info'}
        message={result?.message}
        streaming={!restoredFeedback && !isReviewing && Boolean(result && !result.empty)}
        className="dl-question-feedback"
        hidden={!result}
      />

      {canRetry && (
        <div className="dl-question-actions">
          <Button className="dl-question-retry" onClick={retry}>
            {retryText}
          </Button>
        </div>
      )}
    </section>
  );
}
