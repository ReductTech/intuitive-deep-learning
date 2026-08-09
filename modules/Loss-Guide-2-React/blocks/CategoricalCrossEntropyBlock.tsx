import { useEffect, useRef } from 'react';
import {
  Button,
  Feedback,
  LessonStage,
  TextInput,
  type FeedbackStatus,
} from '../../shared/react';
import { ProbabilityBars } from '../components/ProbabilityBars';
import { usePersistedActivity } from '../components/usePersistedActivity';
import {
  FORECASTS,
  formatPercent,
} from '../model/lossGuideMath';
import {
  lossGuideServiceErrorMessage,
  requestCrossEntropySignFeedback,
  type CrossEntropySignFeedback,
} from '../services/lossGuideServices';

const STATE_KEY = 'activity:loss-guide-2-categorical-cross-entropy';

type ReviewStatus = 'idle' | 'pending' | 'success' | 'error';

interface CategoricalSnapshot {
  selectedForecast: number | null;
  forecastSolved: boolean;
  answer: string;
  submitted: boolean;
  reviewStatus: ReviewStatus;
  reviewTone: FeedbackStatus;
  reviewMessage: string;
  reviewResult: CrossEntropySignFeedback | null;
  reviewError: string | null;
}

export interface CategoricalCrossEntropyBlockProps {
  onComplete: () => void;
  lessonStepComplete?: boolean;
}

function createInitialSnapshot(): CategoricalSnapshot {
  return {
    selectedForecast: null,
    forecastSolved: false,
    answer: '',
    submitted: false,
    reviewStatus: 'idle',
    reviewTone: 'info',
    reviewMessage: '',
    reviewResult: null,
    reviewError: null,
  };
}

function normalizeReviewResult(
  value: unknown,
): CrossEntropySignFeedback | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<CrossEntropySignFeedback>;
  if (
    !['正确', '接近正确', '错误'].includes(String(candidate.verdict))
    || !['correct', 'close', 'incorrect'].includes(String(candidate.level))
    || typeof candidate.is_correct !== 'boolean'
    || typeof candidate.explanation !== 'string'
    || typeof candidate.task_id !== 'string'
  ) {
    return null;
  }
  return {
    verdict: candidate.verdict as CrossEntropySignFeedback['verdict'],
    level: candidate.level as CrossEntropySignFeedback['level'],
    is_correct: candidate.is_correct,
    explanation: candidate.explanation,
    task_id: candidate.task_id,
  };
}

function normalizeSnapshot(value: unknown): CategoricalSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<CategoricalSnapshot>;
  const selectedForecast = candidate.selectedForecast === null
    ? null
    : Number(candidate.selectedForecast);
  if (
    selectedForecast !== null
    && (!Number.isInteger(selectedForecast)
      || selectedForecast < 0
      || selectedForecast >= FORECASTS.length)
  ) {
    return null;
  }
  if (
    candidate.forecastSolved !== undefined
    && typeof candidate.forecastSolved !== 'boolean'
  ) {
    return null;
  }
  if (candidate.answer !== undefined && typeof candidate.answer !== 'string') {
    return null;
  }
  if (
    candidate.submitted !== undefined
    && typeof candidate.submitted !== 'boolean'
  ) {
    return null;
  }
  if (candidate.forecastSolved === true && selectedForecast !== 2) {
    return null;
  }
  if (candidate.submitted === true && candidate.forecastSolved !== true) {
    return null;
  }
  const validReviewStatuses: ReviewStatus[] = [
    'idle',
    'pending',
    'success',
    'error',
  ];
  const reviewStatus = validReviewStatuses.includes(
    candidate.reviewStatus as ReviewStatus,
  )
    ? candidate.reviewStatus as ReviewStatus
    : 'idle';
  const validTones: FeedbackStatus[] = [
    'hint',
    'info',
    'correct',
    'wrong',
  ];
  const reviewTone = validTones.includes(
    candidate.reviewTone as FeedbackStatus,
  )
    ? candidate.reviewTone as FeedbackStatus
    : 'info';
  const reviewResult = candidate.reviewResult === null
    || candidate.reviewResult === undefined
    ? null
    : normalizeReviewResult(candidate.reviewResult);
  if (candidate.reviewResult && !reviewResult) return null;
  if (
    candidate.reviewError !== undefined
    && candidate.reviewError !== null
    && typeof candidate.reviewError !== 'string'
  ) {
    return null;
  }
  const interruptedMessage = '上次提交已经记录，但评阅结果没有返回。你的学习流程仍可继续。';

  return {
    selectedForecast,
    forecastSolved: Boolean(candidate.forecastSolved),
    answer: candidate.answer ?? '',
    submitted: Boolean(candidate.submitted),
    reviewStatus: reviewStatus === 'pending' ? 'error' : reviewStatus,
    reviewTone: reviewStatus === 'pending' ? 'wrong' : reviewTone,
    reviewMessage: reviewStatus === 'pending'
      ? interruptedMessage
      : typeof candidate.reviewMessage === 'string'
        ? candidate.reviewMessage
        : '',
    reviewResult,
    reviewError: reviewStatus === 'pending'
      ? interruptedMessage
      : candidate.reviewError ?? null,
  };
}

function reviewPresentation(result: unknown): {
  tone: FeedbackStatus;
  message: string;
} {
  const data = result && typeof result === 'object'
    ? result as Record<string, unknown>
    : {};
  const messageCandidates = [
    data.explanation,
    data.feedback,
    data.message,
  ];
  const message = messageCandidates.find(
    (entry): entry is string => typeof entry === 'string' && entry.trim() !== '',
  ) ?? '评阅已完成。可以结合公式继续检查自己的解释。';
  const level = typeof data.level === 'string'
    ? data.level.toLowerCase()
    : '';
  const isCorrect = data.is_correct;
  const tone: FeedbackStatus = isCorrect === true || level === 'correct'
    ? 'correct'
    : isCorrect === false || level === 'incorrect'
      ? 'wrong'
      : 'hint';
  return { tone, message };
}

export function CategoricalCrossEntropyBlock({
  onComplete,
  lessonStepComplete = false,
}: CategoricalCrossEntropyBlockProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const completionReportedRef = useRef(false);
  const mountedRef = useRef(true);
  const reviewControllerRef = useRef<AbortController | null>(null);
  const {
    state,
    stateRef,
    hydrated,
    setDraft,
    commit,
  } = usePersistedActivity<CategoricalSnapshot>({
    stateKey: STATE_KEY,
    createInitial: createInitialSnapshot,
    normalizeState: normalizeSnapshot,
    getElement: () => rootRef.current,
  });

  const reportComplete = () => {
    if (lessonStepComplete || completionReportedRef.current) return;
    completionReportedRef.current = true;
    onComplete();
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      reviewControllerRef.current?.abort();
      reviewControllerRef.current = null;
    };
  }, []);

  const chooseForecast = (forecastIndex: number) => {
    if (!state || !hydrated || state.forecastSolved) return;
    const forecast = FORECASTS[forecastIndex];
    const correct = forecastIndex === 2;
    commit(
      'loss2_forecast_select',
      {
        ...state,
        selectedForecast: forecastIndex,
        forecastSolved: correct,
      },
      {
        forecast_index: forecastIndex,
        provider: forecast.provider,
        rain_probability: forecast.probabilities[2],
        correct,
      },
    );
  };

  const submitExplanation = () => {
    if (!state || !hydrated || state.submitted) return;
    const answer = state.answer.trim();
    if (!answer) {
      commit(
        'loss2_ce_negative_submit_empty',
        {
          ...state,
          reviewStatus: 'error',
          reviewTone: 'hint',
          reviewMessage: '先写下你的解释。',
        },
        { empty: true },
      );
      return;
    }

    const submitted = {
      ...state,
      answer,
      submitted: true,
      reviewStatus: 'pending' as const,
      reviewTone: 'info' as const,
      reviewMessage: '正在分析你的解释，请稍候。',
      reviewResult: null,
      reviewError: null,
    };
    commit('loss2_ce_negative_submit', submitted, {
      answer_length: Array.from(answer).length,
    });
    reportComplete();

    reviewControllerRef.current?.abort();
    const reviewController = new AbortController();
    reviewControllerRef.current = reviewController;
    void requestCrossEntropySignFeedback(answer, {
      signal: reviewController.signal,
    })
      .then((result) => {
        if (!mountedRef.current) return;
        reviewControllerRef.current = null;
        const presentation = reviewPresentation(result);
        commit(
          'loss2_ce_negative_review_result',
          (current) => ({
            ...current,
            reviewStatus: 'success',
            reviewTone: presentation.tone,
            reviewMessage: presentation.message,
            reviewResult: result,
            reviewError: null,
          }),
          {
            review_tone: presentation.tone,
          },
        );
      })
      .catch((error: unknown) => {
        if (!mountedRef.current) return;
        reviewControllerRef.current = null;
        const message = lossGuideServiceErrorMessage(error);
        commit(
          'loss2_ce_negative_review_error',
          (current) => ({
            ...current,
            reviewStatus: 'error',
            reviewTone: 'wrong',
            reviewMessage: message,
            reviewResult: null,
            reviewError: message,
          }),
        );
      });
  };

  return (
    <LessonStage
      ref={rootRef}
      className="lg2-block lg2-categorical-block"
      title="多分类预测错了，损失怎样计算？"
      data-telemetry-manual
      aria-busy={!hydrated}
    >
      {state && (
        <>
          <div className="lg2-forecast-grid" aria-label="三家天气预报">
            {FORECASTS.map((forecast, forecastIndex) => {
              const selected = state.selectedForecast === forecastIndex;
              const correct = state.forecastSolved && forecastIndex === 2;
              const wrong = selected && !state.forecastSolved;
              const rainProbability = forecast.probabilities[2];
              return (
                <button
                  className={[
                    'edu-choice-card',
                    'lg2-forecast-card',
                    selected ? 'is-selected' : '',
                    correct ? 'is-correct' : '',
                    wrong ? 'is-wrong' : '',
                  ].filter(Boolean).join(' ')}
                  type="button"
                  key={forecast.provider}
                  disabled={state.forecastSolved}
                  aria-pressed={selected}
                  onClick={() => chooseForecast(forecastIndex)}
                >
                  <span className="lg2-forecast-card-head">
                    <strong>{forecast.provider}</strong>
                    {state.forecastSolved && (
                      <span className="lg2-forecast-loss">
                        −log({rainProbability.toFixed(2)}) ={' '}
                        {(-Math.log(rainProbability)).toFixed(3)}
                      </span>
                    )}
                  </span>
                  <ProbabilityBars
                    probabilities={[...forecast.probabilities]}
                    showTotal={false}
                  />
                  <span>概率总和为 100%</span>
                </button>
              );
            })}
          </div>

          {state.selectedForecast !== null && (
            <Feedback
              status={state.forecastSolved ? 'correct' : 'wrong'}
              message={state.forecastSolved
                ? '正确。真实类别是“下雨”，给“下雨”最高概率的预测应得到最小的多分类交叉熵损失。'
                : `${FORECASTS[state.selectedForecast].provider}只给真实类别“下雨” ${formatPercent(FORECASTS[state.selectedForecast].probabilities[2], 0)}。再比较哪家预测给真实类别的概率最高。`}
            />
          )}

          {state.forecastSolved && (
            <section
              className="lg2-ce-reveal"
              aria-labelledby="lg2-ce-title"
            >
              <div className="wp-ce-formula lg2-ce-formula">
                <div className="wp-ce-formula-head">
                  <h3 id="lg2-ce-title">用多分类交叉熵计算预测损失</h3>
                  <Button
                    variant="explain"
                    explain="单标签任务使用 one-hot 标签：只有真实类别的标签是 1，其余都是 0。因此求和时只有真实类别对应的一项会保留下来。"
                  >
                    为什么能简化？
                  </Button>
                </div>
                <div className="edu-formula-block wp-ce-three-line">
                  <div
                    className="edu-formula"
                    data-no-formula-explanations
                    aria-label="多分类交叉熵通式"
                  >
                    <span>
                      L<sub>CE</sub> = −Σ y<sub>k</sub> log(p<sub>k</sub>)
                    </span>
                  </div>
                  <p>
                    如果任务是单标签分类任务（一个样本只属于一个类别），
                    那么交叉熵公式可以进一步简化为
                  </p>
                  <div
                    className="edu-formula"
                    data-no-formula-explanations
                    aria-label="单标签交叉熵等于负 log 真实类别概率"
                  >
                    <span>
                      L<sub>CE</sub> = −log(p<sub>下雨</sub>)
                    </span>
                  </div>
                </div>
              </div>
              <div className="wp-success-note">
                <strong>真实类别概率越高，CE 越小</strong>
              </div>

              <section className="dl-question dl-question--short lg2-ce-question">
                <header className="dl-question-head">
                  <span className="dl-question-type">简答题</span>
                  <div className="dl-question-title-row">
                    <strong className="dl-question-stem">
                      为什么交叉熵公式前要加负号？请结合概率在
                      0～1 之间时 log(p) 的正负，以及概率越接近 1
                      时损失应如何变化来解释。
                    </strong>
                    <Button
                      className="lg2-ce-submit"
                      variant="primary"
                      loading={state.reviewStatus === 'pending'}
                      disabled={state.submitted}
                      onClick={submitExplanation}
                    >
                      {state.submitted ? '已提交' : '提交解释'}
                    </Button>
                  </div>
                </header>
                <TextInput
                  multiline
                  rows={3}
                  label="写下负号的作用"
                  value={state.answer}
                  disabled={state.submitted}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      answer: event.currentTarget.value,
                      reviewStatus: 'idle',
                      reviewMessage: '',
                      reviewResult: null,
                      reviewError: null,
                    }));
                  }}
                  onBlur={(event) => {
                    const nextTarget = event.relatedTarget;
                    if (
                      nextTarget instanceof Element
                      && nextTarget.closest('.lg2-ce-submit')
                    ) {
                      return;
                    }
                    if (!stateRef.current || stateRef.current.submitted) return;
                    commit(
                      'loss2_ce_negative_answer_change',
                      stateRef.current,
                      {
                        answer_length: Array.from(
                          stateRef.current.answer,
                        ).length,
                      },
                    );
                  }}
                />
                {state.reviewMessage && (
                  <Feedback
                    status={state.reviewTone}
                    message={state.reviewMessage}
                    streaming={state.reviewStatus === 'success'}
                  />
                )}
              </section>
            </section>
          )}
        </>
      )}
    </LessonStage>
  );
}
