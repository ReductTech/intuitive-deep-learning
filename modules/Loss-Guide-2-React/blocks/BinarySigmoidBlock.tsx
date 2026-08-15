import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Feedback,
  FormulaTerm,
  LessonStage,
  PlotlyChart,
  Question,
  TextInput,
  Button,
  type PlotlyChartProps,
  type PlotlyGraph,
  type PlotlyLayout,
  type PlotlyTrace,
} from '../../shared/react';
import { WeatherSignalAnimation } from '../components/WeatherSignalAnimation';
import { usePersistedActivity } from '../components/usePersistedActivity';
import { ChartTraceCheckbox } from '../components/ChartTraceCheckbox';
import { sampleSigmoidRange } from '../model/lossGuideMath';
import {
  lossGuideServiceErrorMessage,
  requestSigmoidTransformFeedback,
  type ShortAnswerFeedbackResult,
} from '../services/lossGuideServices';

export interface BinarySigmoidBlockProps {
  onComplete: () => void;
  lessonStepComplete?: boolean;
}

interface SigmoidVisualState {
  version: 1;
  running: boolean;
  traceVisible: [boolean, boolean, boolean];
  xRange: [number, number];
}

type ReviewStatus = 'idle' | 'submitting' | 'resolved' | 'error';

interface SigmoidReviewState {
  version: 1;
  answer: string;
  status: ReviewStatus;
  feedback: string;
  result: ShortAnswerFeedbackResult | null;
  revealed: boolean;
}

const INITIAL_SIGMOID_RANGE: [number, number] = [-8, 8];

function initialVisualState(): SigmoidVisualState {
  return {
    version: 1,
    running: true,
    traceVisible: [true, true, true],
    xRange: [...INITIAL_SIGMOID_RANGE],
  };
}

function initialReviewState(): SigmoidReviewState {
  return {
    version: 1,
    answer: '',
    status: 'idle',
    feedback: '',
    result: null,
    revealed: false,
  };
}

function isFiniteRange(value: unknown): value is [number, number] {
  return (
    Array.isArray(value)
    && value.length === 2
    && value.every((entry) => typeof entry === 'number' && Number.isFinite(entry))
    && value[0] !== value[1]
  );
}

function normalizeVisualState(stored: unknown): SigmoidVisualState | null {
  if (!stored || typeof stored !== 'object') return null;
  const value = stored as Partial<SigmoidVisualState>;
  const traceVisible = value.traceVisible;
  if (
    typeof value.running !== 'boolean'
    || !Array.isArray(traceVisible)
    || traceVisible.length !== 3
    || !traceVisible.every((entry) => typeof entry === 'boolean')
    || !isFiniteRange(value.xRange)
  ) {
    return null;
  }
  const range = value.xRange[0] < value.xRange[1]
    ? value.xRange
    : [value.xRange[1], value.xRange[0]] as [number, number];
  return {
    version: 1,
    running: value.running,
    traceVisible: [
      traceVisible[0],
      traceVisible[1],
      traceVisible[2],
    ],
    xRange: range,
  };
}

function normalizeShortAnswerResult(
  stored: unknown,
): ShortAnswerFeedbackResult | null {
  if (!stored || typeof stored !== 'object') return null;
  const value = stored as Partial<ShortAnswerFeedbackResult>;
  if (
    (value.level !== 'correct'
      && value.level !== 'close'
      && value.level !== 'incorrect')
    || (value.verdict !== '正确'
      && value.verdict !== '接近正确'
      && value.verdict !== '错误')
    || typeof value.is_correct !== 'boolean'
    || typeof value.explanation !== 'string'
    || !value.explanation.trim()
    || typeof value.task_id !== 'string'
    || !value.task_id.trim()
  ) {
    return null;
  }
  return {
    level: value.level,
    verdict: value.verdict,
    is_correct: value.is_correct,
    explanation: value.explanation,
    task_id: value.task_id,
  };
}

function normalizeReviewState(stored: unknown): SigmoidReviewState | null {
  if (!stored || typeof stored !== 'object') return null;
  const value = stored as Partial<SigmoidReviewState>;
  if (
    typeof value.answer !== 'string'
    || (value.status !== 'idle'
      && value.status !== 'submitting'
      && value.status !== 'resolved'
      && value.status !== 'error')
  ) {
    return null;
  }
  const result = normalizeShortAnswerResult(value.result);
  if (value.status === 'resolved' && result === null) return null;

  // An in-flight request cannot survive a refresh. Keep the answer, but make
  // the restored state explicitly retryable without emitting a restore event.
  if (value.status === 'submitting') {
    return {
      version: 1,
      answer: value.answer,
      status: 'error',
      feedback: '上次分析尚未完成，请重新提交。',
      result: null,
      revealed: false,
    };
  }

  return {
    version: 1,
    answer: value.answer,
    status: value.status,
    feedback: typeof value.feedback === 'string' ? value.feedback : '',
    result,
    revealed: value.status === 'resolved',
  };
}

function reviewTone(result: ShortAnswerFeedbackResult | null) {
  if (!result) return 'info' as const;
  if (result.level === 'correct') return 'correct' as const;
  if (result.level === 'close') return 'hint' as const;
  return 'wrong' as const;
}

function traceVisibility(visible: boolean): true | 'legendonly' {
  return visible ? true : 'legendonly';
}

function scrollIntoView(element: HTMLElement | null, block: ScrollLogicalPosition) {
  if (!element) return;
  window.requestAnimationFrame(() => {
    element.scrollIntoView({
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
      block,
    });
  });
}

function PlotlyWithFallback({
  fallback,
  className,
  minHeight = 260,
  style,
  ...props
}: PlotlyChartProps & { fallback: string }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || failed) return undefined;
    const detectFailure = () => {
      if (root.querySelector('[data-chart-error="true"]')) setFailed(true);
    };
    detectFailure();
    const observer = new MutationObserver(detectFailure);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-chart-error'],
      subtree: true,
    });
    return () => observer.disconnect();
  }, [failed]);

  return (
    <div ref={rootRef} className="lg2-plot-frame">
      {failed ? (
        <div
          className={[className, 'is-unavailable'].filter(Boolean).join(' ')}
          style={{ minHeight, ...style }}
          role="img"
          aria-label={props['aria-label']}
        >
          <p>{fallback}</p>
        </div>
      ) : (
        <PlotlyChart
          {...props}
          className={className}
          minHeight={minHeight}
          style={style}
        />
      )}
    </div>
  );
}

export function BinarySigmoidBlock({
  onComplete,
  lessonStepComplete = false,
}: BinarySigmoidBlockProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const explanationRef = useRef<HTMLElement | null>(null);
  const secondQuestionRef = useRef<HTMLFieldSetElement | null>(null);
  const firstQuestionInteractionRef = useRef(false);
  const secondQuestionInteractionRef = useRef(false);
  const completeReportedRef = useRef(lessonStepComplete);
  const [firstCheckSolved, setFirstCheckSolved] = useState(
    lessonStepComplete,
  );
  const [secondCheckSolved, setSecondCheckSolved] = useState(
    lessonStepComplete,
  );

  const visual = usePersistedActivity<SigmoidVisualState>({
    stateKey: 'activity:sigmoid-visuals',
    createInitial: initialVisualState,
    normalizeState: normalizeVisualState,
    getElement: () => rootRef.current,
  });
  const review = usePersistedActivity<SigmoidReviewState>({
    stateKey: 'activity:sigmoid-transform-review',
    createInitial: initialReviewState,
    normalizeState: normalizeReviewState,
    getElement: () => rootRef.current,
  });

  useEffect(() => {
    if (!lessonStepComplete) return;
    completeReportedRef.current = true;
    setFirstCheckSolved(true);
    setSecondCheckSolved(true);
  }, [lessonStepComplete]);

  useEffect(() => () => {
    requestRef.current?.abort();
  }, []);

  const reportComplete = useCallback(() => {
    if (completeReportedRef.current) return;
    completeReportedRef.current = true;
    onComplete();
  }, [onComplete]);

  const visualState = visual.state ?? initialVisualState();
  const reviewState = review.state ?? initialReviewState();
  const sigmoidRevealed = lessonStepComplete || reviewState.revealed;

  const sampled = useMemo(
    () => sampleSigmoidRange(
      visualState.xRange[0],
      visualState.xRange[1],
      600,
    ),
    [visualState.xRange],
  );

  const chartData = useMemo<PlotlyTrace[]>(() => [
    {
      name: 'Sigmoid σ(z)',
      type: 'scatter',
      mode: 'lines',
      x: sampled.x,
      y: sampled.sigmoid,
      line: { color: '#228d5c', width: 4 },
      visible: traceVisibility(visualState.traceVisible[0]),
      hovertemplate:
        'z = %{x:.1f}<br>σ(z) = %{y:.16f}<br>'
        + '定义域：z ∈ ℝ；函数值始终小于 1<extra></extra>',
    },
    {
      name: '导数 σ′(z)',
      type: 'scatter',
      mode: 'lines',
      x: sampled.x,
      y: sampled.derivative,
      line: { color: '#f07e47', width: 3, dash: 'dash' },
      visible: traceVisibility(visualState.traceVisible[1]),
      hovertemplate: 'z = %{x:.1f}<br>σ′(z) = %{y:.4f}<extra></extra>',
    },
    {
      name: '上限 y = 1（渐近线）',
      type: 'scatter',
      mode: 'lines',
      x: visualState.xRange,
      y: [1, 1],
      line: { color: '#68778f', width: 2, dash: 'dot' },
      visible: traceVisibility(visualState.traceVisible[2]),
      hovertemplate:
        'y = 1 是上限，Sigmoid 只能无限接近<extra></extra>',
    },
  ], [sampled, visualState.traceVisible, visualState.xRange]);

  const chartLayout = useMemo<PlotlyLayout>(() => ({
    margin: { l: 56, r: 24, t: 42, b: 48 },
    showlegend: false,
    xaxis: {
      title: { text: '模型原始分数（logit）' },
      range: visualState.xRange,
      autorange: false,
      zeroline: true,
    },
    yaxis: {
      title: { text: '函数值' },
      range: [-0.08, 1.08],
      autorange: false,
      zeroline: true,
    },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
  }), [visualState.xRange]);

  const handleGraphReady = useCallback((
    graph: PlotlyGraph,
    _host: HTMLDivElement,
  ) => {
    graph.on?.('plotly_relayout', (event) => {
      let nextRange: [number, number] | null = null;
      if (event['xaxis.autorange'] === true) {
        nextRange = [...INITIAL_SIGMOID_RANGE];
      } else {
        const left = Number(event['xaxis.range[0]']);
        const right = Number(event['xaxis.range[1]']);
        if (Number.isFinite(left) && Number.isFinite(right) && left !== right) {
          nextRange = left < right ? [left, right] : [right, left];
        }
      }
      if (!nextRange) return;
      const current = visual.stateRef.current;
      if (
        !current
        || (
          Math.abs(current.xRange[0] - nextRange[0]) < 1e-9
          && Math.abs(current.xRange[1] - nextRange[1]) < 1e-9
        )
      ) {
        return;
      }
      visual.commit(
        'sigmoid_plot_range_changed',
        { ...current, xRange: nextRange },
        { x_range: nextRange },
      );
    });
  }, [visual.commit, visual.stateRef]);

  const toggleAnimation = useCallback(() => {
    const current = visual.stateRef.current;
    if (!current) return;
    visual.commit(
      'sigmoid_animation_toggled',
      { ...current, running: !current.running },
      { running: !current.running },
    );
  }, [visual.commit, visual.stateRef]);

  const toggleTrace = useCallback((index: number, checked: boolean) => {
    const current = visual.stateRef.current;
    if (!current) return;
    const traceVisible = [...current.traceVisible] as [
      boolean,
      boolean,
      boolean,
    ];
    traceVisible[index] = checked;
    visual.commit(
      'sigmoid_plot_trace_toggled',
      { ...current, traceVisible },
      { trace_index: index, visible: checked },
    );
  }, [visual.commit, visual.stateRef]);

  const commitDraft = useCallback(() => {
    const current = review.stateRef.current;
    if (!current || current.status === 'resolved') return;
    review.commit('sigmoid_transform_draft_changed', current, {
      answer_length: Array.from(current.answer).length,
    });
  }, [review.commit, review.stateRef]);

  const submitGuess = useCallback(async () => {
    const current = review.stateRef.current;
    if (!current || current.status === 'submitting' || current.status === 'resolved') {
      return;
    }
    const answer = current.answer.trim();
    if (!answer) {
      review.setDraft({
        ...current,
        status: 'error',
        feedback: '先写下一个转换思路，不要求知道函数名字。',
      });
      return;
    }

    const submitting: SigmoidReviewState = {
      ...current,
      answer,
      status: 'submitting',
      feedback: '正在分析你的猜想，请稍候。',
      result: null,
      revealed: false,
    };
    if (!review.commit('sigmoid_transform_submitted', submitting, {
      answer_length: Array.from(answer).length,
    })) {
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const result = await requestSigmoidTransformFeedback(answer, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      // The legacy lesson reveals Sigmoid after any structurally successful
      // review, even when the model labels the answer close or incorrect.
      review.commit(
        'sigmoid_transform_reviewed',
        {
          ...submitting,
          status: 'resolved',
          feedback: result.explanation,
          result,
          revealed: true,
        },
        {
          review_level: result.level,
          review_correct: result.is_correct,
        },
      );
      window.requestAnimationFrame(() => {
        scrollIntoView(explanationRef.current, 'start');
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      review.commit(
        'sigmoid_transform_review_failed',
        {
          ...submitting,
          status: 'error',
          feedback: lossGuideServiceErrorMessage(error),
          result: null,
          revealed: false,
        },
      );
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
    }
  }, [review.commit, review.setDraft, review.stateRef]);

  return (
    <LessonStage
      ref={rootRef}
      className="wp-stage lg2-binary-sigmoid"
      title="怎样把原始分数变成下雨概率？"
      description="神经网络先根据湿度、云量、气压等信息计算一个原始分数，再把它转换成“明天下雨”的概率。"
      data-state-key="activity:sigmoid-transform-review"
      data-telemetry-manual
    >
      <WeatherSignalAnimation
        running={visualState.running}
        onToggle={toggleAnimation}
        revealed={sigmoidRevealed}
      />

      <section className="wp-guess-section" aria-label="Sigmoid 猜想题">
        <div className="dl-question dl-question--short lg2-service-question">
          <header className="dl-question-head">
            <span className="dl-question-type">简答题</span>
            <div className="dl-question-title-row">
              <strong className="dl-question-stem">
                模型输出的原始分数可以是任意实数。怎样把它转换成一个
                0～1 之间的概率？请写下你的想法。
              </strong>
              <Button
                className="lg2-sigmoid-submit"
                variant="primary"
                loading={reviewState.status === 'submitting'}
                disabled={
                  !review.hydrated
                  || reviewState.status === 'resolved'
                }
                onClick={() => void submitGuess()}
              >
                {reviewState.status === 'resolved' ? '已提交' : '提交'}
              </Button>
            </div>
          </header>
          <TextInput
            multiline
            rows={4}
            aria-label="你的概率转换思路"
            value={reviewState.answer}
            disabled={
              !review.hydrated
              || reviewState.status === 'submitting'
              || reviewState.status === 'resolved'
            }
            onChange={(event) => {
              const current = review.stateRef.current;
              if (!current) return;
              review.setDraft({
                ...current,
                answer: event.target.value,
                status: current.status === 'error' ? 'idle' : current.status,
                feedback: current.status === 'error' ? '' : current.feedback,
              });
            }}
            onBlur={(event) => {
              if (
                event.relatedTarget instanceof Element
                && event.relatedTarget.closest('.lg2-sigmoid-submit')
              ) {
                return;
              }
              commitDraft();
            }}
          />
          <Feedback
            className="dl-question-feedback"
            status={
              reviewState.status === 'error'
                ? 'wrong'
                : reviewTone(reviewState.result)
            }
            message={reviewState.feedback}
            hidden={!reviewState.feedback}
          />
        </div>
      </section>

      {sigmoidRevealed && (
        <section
          ref={explanationRef}
          className="wp-sigmoid-explanation"
          aria-labelledby="sigmoidExplanationTitle"
        >
          <div className="wp-formula-reveal">
            <h3 id="sigmoidExplanationTitle">
              Sigmoid 如何把原始分数变成概率？
            </h3>
            <div className="edu-formula-block wp-sigmoid-formula-card">
              <div
                className="edu-formula edu-formula--fraction"
                aria-label="Sigmoid 函数：sigma z 等于一除以一加 e 的负 z 次方"
              >
                <span className="edu-formula-prefix">
                  <FormulaTerm tooltip="σ：Sigmoid 函数，把任意实数映射到 0～1">
                    σ
                  </FormulaTerm>
                  (
                  <FormulaTerm tooltip="z：模型尚未限制范围的原始分数，可以取任意实数">
                    z
                  </FormulaTerm>
                  {') '}
                  <FormulaTerm tooltip="=：等号，表示左右两边数值相同">
                    =
                  </FormulaTerm>
                </span>
                <span className="edu-fraction">
                  <span className="edu-fraction-numerator">1</span>
                  <span className="edu-fraction-denominator">
                    1{' '}
                    <FormulaTerm tooltip="+：加号，把左右两项相加">
                      +
                    </FormulaTerm>
                    {' '}
                    <FormulaTerm tooltip="e：自然常数，约等于 2.71828">
                      e
                    </FormulaTerm>
                    <sup>
                      <FormulaTerm tooltip="−：负号或减号；这里表示指数取 z 的相反数">
                        −
                      </FormulaTerm>
                      <FormulaTerm tooltip="z：模型尚未限制范围的原始分数，可以从 −∞ 到 +∞">
                        z
                      </FormulaTerm>
                    </sup>
                  </span>
                </span>
              </div>
              <div className="edu-formula" aria-label="z 属于全体实数">
                <FormulaTerm tooltip="z：Sigmoid 的输入，可以是任意实数">
                  z
                </FormulaTerm>
                {' '}
                <FormulaTerm tooltip="∈：属于，表示左侧元素属于右侧集合">
                  ∈
                </FormulaTerm>
                {' '}
                <FormulaTerm tooltip="ℝ：全体实数组成的集合，从负无穷到正无穷">
                  ℝ
                </FormulaTerm>
              </div>
            </div>
            <p>
              Sigmoid 会把任意实数映射到 0～1 之间，因此它的输出可以用来表示“明天下雨”的概率。
            </p>
          </div>

          <div className="wp-sigmoid-observation-grid">
            <section
              className="wp-sigmoid-plot-panel"
              aria-labelledby="sigmoidPlotTitle"
            >
              <div className="wp-echart-head">
                <strong id="sigmoidPlotTitle">观察 Sigmoid 的变化</strong>
              </div>
              <div
                className="edu-check-group wp-chart-toggles"
                aria-label="选择 Sigmoid 图中显示的曲线"
              >
                <ChartTraceCheckbox
                  label="Sigmoid 函数"
                  checked={visualState.traceVisible[0]}
                  onChange={(event) => toggleTrace(0, event.target.checked)}
                />
                <ChartTraceCheckbox
                  label="Sigmoid 导数"
                  checked={visualState.traceVisible[1]}
                  onChange={(event) => toggleTrace(1, event.target.checked)}
                />
                <ChartTraceCheckbox
                  label="函数值上限"
                  checked={visualState.traceVisible[2]}
                  onChange={(event) => toggleTrace(2, event.target.checked)}
                />
              </div>
              <PlotlyWithFallback
                className="edu-chart wp-sigmoid-chart"
                data={chartData}
                layout={chartLayout}
                minHeight={360}
                aria-label="Sigmoid 函数及其导数曲线"
                onGraphReady={handleGraphReady}
                fallback="曲线组件暂时不可用。Sigmoid 的范围是 0～1，导数最大值为 0.25。"
              />
              <div className="wp-derivative-note">
                <p>
                  Sigmoid 可以接收任意实数。原始分数越大，输出越接近 1；原始分数越小，输出越接近
                  0。对于有限的原始分数，输出只会无限接近 0 或
                  1，不会真正到达两个端点。
                </p>
              </div>
            </section>

            <section
              className="wp-sigmoid-checks"
              aria-label="Sigmoid 图像观察题"
            >
              <div className="wp-sigmoid-question-stack">
                <fieldset
                  className="wp-sigmoid-quiz-card"
                  disabled={firstCheckSolved}
                  style={{ border: 0, margin: 0, minWidth: 0, padding: 0 }}
                  aria-disabled={firstCheckSolved || undefined}
                  onClickCapture={(event) => {
                    const target = event.target;
                    firstQuestionInteractionRef.current = (
                      target instanceof Element
                      && Boolean(target.closest('.dl-question-option'))
                    );
                  }}
                >
                  <Question
                    persistenceKey="sigmoid-derivative-peak"
                    type="choice"
                    typeLabel="单选题"
                    title="Sigmoid 在哪里变化最快？"
                    options={[
                      { key: 'A', value: 'middle', label: 'z = 0 附近' },
                      { key: 'B', value: 'ends', label: '曲线两端' },
                      { key: 'C', value: 'same', label: '处处一样快' },
                    ]}
                    answer="middle"
                    feedback={{
                      correct: '看导数曲线：峰值就在 z=0。',
                      wrong: '再看橙色导数曲线的最高点。',
                    }}
                    onCheck={(result) => {
                      const fromUser = firstQuestionInteractionRef.current;
                      firstQuestionInteractionRef.current = false;
                      if (!result.ok) return;
                      setFirstCheckSolved(true);
                      if (fromUser) {
                        window.requestAnimationFrame(() => {
                          scrollIntoView(secondQuestionRef.current, 'nearest');
                        });
                      }
                    }}
                  />
                </fieldset>

                {(firstCheckSolved || lessonStepComplete) && (
                  <fieldset
                    ref={secondQuestionRef}
                    className="wp-sigmoid-quiz-card wp-sigmoid-quiz-card--second"
                    disabled={secondCheckSolved}
                    style={{ border: 0, margin: 0, minWidth: 0, padding: 0 }}
                    aria-disabled={secondCheckSolved || undefined}
                    onClickCapture={(event) => {
                      const target = event.target;
                      secondQuestionInteractionRef.current = (
                        target instanceof Element
                        && Boolean(target.closest('.dl-question-option'))
                      );
                    }}
                  >
                    <Question
                      persistenceKey="sigmoid-finite-endpoints"
                      type="judgement"
                      typeLabel="单选题"
                      title="当原始分数足够大或足够小时，Sigmoid 的输出会真正等于 1 或 0。"
                      options={[
                        { key: '对', value: 'true', label: '正确' },
                        { key: '错', value: 'false', label: '错误' },
                      ]}
                      answer="false"
                      feedback={{
                        correct:
                          '不会。只要原始分数仍是有限值，Sigmoid 的输出就只会接近 0 或 1，不会真正取到端点。',
                        wrong:
                          '再观察曲线：Sigmoid 会不断接近 0 或 1，但有限的原始分数不会让它真正到达端点。',
                      }}
                      onCheck={(result) => {
                        const fromUser = secondQuestionInteractionRef.current;
                        secondQuestionInteractionRef.current = false;
                        if (!result.ok) return;
                        setSecondCheckSolved(true);
                        if (fromUser) reportComplete();
                      }}
                    />
                  </fieldset>
                )}
              </div>
            </section>
          </div>
        </section>
      )}
    </LessonStage>
  );
}
