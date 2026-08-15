import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Button,
  Feedback,
  FormulaBlock,
  FormulaTerm,
  LessonStage,
  PlotlyChart,
  Question,
  TextInput,
  type PlotlyChartProps,
  type PlotlyLayout,
  type PlotlyTrace,
} from '../../shared/react';
import { usePersistedActivity } from '../components/usePersistedActivity';
import { ChartTraceCheckbox } from '../components/ChartTraceCheckbox';
import { ExplainedFormulaText } from '../components/ExplainedFormulaText';
import {
  sampleProbabilityLoss,
  type ProbabilityLossDesign,
} from '../model/lossGuideMath';
import {
  lossGuideServiceErrorMessage,
  requestProbabilityLossDesign,
} from '../services/lossGuideServices';

export interface BinaryCrossEntropyBlockProps {
  onComplete: () => void;
  lessonStepComplete?: boolean;
}

type LossDesignStatus = 'idle' | 'submitting' | 'resolved' | 'error';

interface LossDesignState {
  version: 1;
  answer: string;
  status: LossDesignStatus;
  feedback: string;
  design: ProbabilityLossDesign | null;
  traceVisible: [boolean, boolean, boolean, boolean];
}

function initialLossDesignState(): LossDesignState {
  return {
    version: 1,
    answer: '',
    status: 'idle',
    feedback: '',
    design: null,
    traceVisible: [true, true, true, true],
  };
}

function normalizeDesign(stored: unknown): ProbabilityLossDesign | null {
  if (!stored || typeof stored !== 'object') return null;
  const value = stored as Partial<ProbabilityLossDesign>;
  if (
    (value.family !== 'negative_log'
      && value.family !== 'linear'
      && value.family !== 'quadratic'
      && value.family !== 'inverse'
      && value.family !== 'absolute')
    || typeof value.scale !== 'number'
    || !Number.isFinite(value.scale)
    || typeof value.power !== 'number'
    || !Number.isFinite(value.power)
    || typeof value.formula !== 'string'
    || !value.formula.trim()
    || typeof value.derivative !== 'string'
    || !value.derivative.trim()
    || typeof value.is_negative_log !== 'boolean'
    || typeof value.is_meaningful !== 'boolean'
    || typeof value.explanation !== 'string'
    || !value.explanation.trim()
  ) {
    return null;
  }
  return {
    family: value.family,
    scale: value.scale,
    power: value.power,
    formula: value.formula,
    derivative: value.derivative,
    is_negative_log: value.is_negative_log,
    is_meaningful: value.is_meaningful,
    explanation: value.explanation,
  };
}

function normalizeLossDesignState(stored: unknown): LossDesignState | null {
  if (!stored || typeof stored !== 'object') return null;
  const value = stored as Partial<LossDesignState>;
  if (
    typeof value.answer !== 'string'
    || (value.status !== 'idle'
      && value.status !== 'submitting'
      && value.status !== 'resolved'
      && value.status !== 'error')
    || !Array.isArray(value.traceVisible)
    || value.traceVisible.length !== 4
    || !value.traceVisible.every((entry) => typeof entry === 'boolean')
  ) {
    return null;
  }
  const design = normalizeDesign(value.design);
  if (value.status === 'resolved' && design === null) return null;

  if (value.status === 'submitting') {
    return {
      version: 1,
      answer: value.answer,
      status: 'error',
      feedback: '上次曲线生成尚未完成，请重新提交。',
      design,
      traceVisible: [
        value.traceVisible[0],
        value.traceVisible[1],
        value.traceVisible[2],
        value.traceVisible[3],
      ],
    };
  }

  return {
    version: 1,
    answer: value.answer,
    status: value.status,
    feedback: typeof value.feedback === 'string' ? value.feedback : '',
    design,
    traceVisible: [
      value.traceVisible[0],
      value.traceVisible[1],
      value.traceVisible[2],
      value.traceVisible[3],
    ],
  };
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

export function BinaryCrossEntropyBlock({
  onComplete,
  lessonStepComplete = false,
}: BinaryCrossEntropyBlockProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);
  const combinedRevealRef = useRef<HTMLDivElement | null>(null);
  const bceQuestionInteractionRef = useRef(false);
  const completeReportedRef = useRef(lessonStepComplete);
  const [bceSolved, setBceSolved] = useState(lessonStepComplete);

  const activity = usePersistedActivity<LossDesignState>({
    stateKey: 'activity:loss-design',
    createInitial: initialLossDesignState,
    normalizeState: normalizeLossDesignState,
    getElement: () => rootRef.current,
  });

  useEffect(() => {
    if (!lessonStepComplete) return;
    completeReportedRef.current = true;
    setBceSolved(true);
  }, [lessonStepComplete]);

  useEffect(() => () => {
    requestRef.current?.abort();
  }, []);

  const reportComplete = useCallback(() => {
    if (completeReportedRef.current) return;
    completeReportedRef.current = true;
    onComplete();
  }, [onComplete]);

  const state = activity.state ?? initialLossDesignState();
  const design = state.design;
  const showUserFormula = design?.is_meaningful !== false;
  const sampled = useMemo(
    () => design ? sampleProbabilityLoss(design) : null,
    [design],
  );

  const chartData = useMemo<PlotlyTrace[]>(() => {
    if (!sampled) return [];
    const traces: PlotlyTrace[] = [
      {
        name: '负对数损失 −log(p)',
        type: 'scatter',
        mode: 'lines',
        x: sampled.probabilities,
        y: sampled.referenceLoss,
        line: { color: '#c43f52', width: 4 },
        visible: traceVisibility(state.traceVisible[0]),
        hovertemplate:
          'p = %{x:.6f}<br>−log(p) = %{y:.6f}<extra></extra>',
      },
      {
        name: '负对数损失的导数 −1/p',
        type: 'scatter',
        mode: 'lines',
        x: sampled.probabilities,
        y: sampled.referenceDerivative,
        line: { color: '#f07e47', width: 3, dash: 'dash' },
        visible: traceVisibility(state.traceVisible[1]),
        hovertemplate:
          'p = %{x:.6f}<br>−1/p = %{y:.6f}<extra></extra>',
      },
    ];
    if (sampled.showUserCurve) {
      traces.push(
        {
          name: '你的损失函数',
          type: 'scatter',
          mode: 'lines',
          x: sampled.probabilities,
          y: sampled.userLoss,
          line: { color: '#27446e', width: 3 },
          visible: traceVisibility(state.traceVisible[2]),
          hovertemplate: 'p = %{x:.6f}<br>L(p) = %{y:.6f}<extra></extra>',
        },
        {
          name: '你的损失函数的导数',
          type: 'scatter',
          mode: 'lines',
          x: sampled.probabilities,
          y: sampled.userDerivative,
          line: { color: '#228d5c', width: 2, dash: 'dash' },
          visible: traceVisibility(state.traceVisible[3]),
          hovertemplate: 'p = %{x:.6f}<br>L′(p) = %{y:.6f}<extra></extra>',
        },
      );
    }
    return traces;
  }, [sampled, state.traceVisible]);

  const chartLayout = useMemo<PlotlyLayout>(() => ({
    margin: { l: 72, r: 24, t: 32, b: 52 },
    showlegend: false,
    xaxis: {
      title: { text: '真实类别的预测概率' },
      range: [0, 1],
      autorange: false,
      zeroline: true,
    },
    yaxis: {
      title: { text: '数值（上方为损失，下方为导数）' },
      range: [-15, 15],
      autorange: false,
      zeroline: true,
    },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
  }), []);

  const commitDraft = useCallback(() => {
    const current = activity.stateRef.current;
    if (!current || current.status === 'resolved') return;
    activity.commit('probability_loss_draft_changed', current, {
      answer_length: Array.from(current.answer).length,
    });
  }, [activity.commit, activity.stateRef]);

  const submitDesign = useCallback(async () => {
    const current = activity.stateRef.current;
    if (!current || current.status === 'submitting') return;
    const answer = current.answer.trim();
    if (!answer) {
      activity.setDraft({
        ...current,
        status: 'error',
        feedback: '先写下一个想法或公式。',
      });
      return;
    }

    const submitting: LossDesignState = {
      ...current,
      answer,
      status: 'submitting',
      feedback: '正在把你的想法转换成可绘制的公式。',
    };
    if (!activity.commit('probability_loss_design_submitted', submitting, {
      answer_length: Array.from(answer).length,
    })) {
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const result = await requestProbabilityLossDesign(answer, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      // The legacy lesson displays the recommended BCE content even when the
      // service marks a vague answer as not meaningful.
      activity.commit(
        'probability_loss_design_received',
        {
          ...submitting,
          status: 'resolved',
          feedback: result.explanation,
          design: result,
          traceVisible: [true, true, true, true],
        },
        {
          loss_family: result.family,
          is_negative_log: result.is_negative_log,
          is_meaningful: result.is_meaningful,
        },
      );
      window.requestAnimationFrame(() => {
        scrollIntoView(resultRef.current, 'start');
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      activity.commit(
        'probability_loss_design_failed',
        {
          ...submitting,
          status: 'error',
          feedback: lossGuideServiceErrorMessage(error),
        },
      );
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
    }
  }, [activity.commit, activity.setDraft, activity.stateRef]);

  const toggleTrace = useCallback((index: number, checked: boolean) => {
    const current = activity.stateRef.current;
    if (!current) return;
    const traceVisible = [...current.traceVisible] as [
      boolean,
      boolean,
      boolean,
      boolean,
    ];
    traceVisible[index] = checked;
    activity.commit(
      'probability_loss_trace_toggled',
      { ...current, traceVisible },
      { trace_index: index, visible: checked },
    );
  }, [activity.commit, activity.stateRef]);

  const feedbackStatus = state.status === 'error'
    ? 'wrong' as const
    : design?.is_meaningful === false
      ? 'hint' as const
      : design
        ? 'correct' as const
        : 'info' as const;

  return (
    <LessonStage
      ref={rootRef}
      className="wp-stage lg2-binary-cross-entropy"
      title="预测概率有了，怎样衡量预测得好不好？"
      description="假设第二天确实下雨，真实标签为 1。请设计一个损失函数，让预测概率越接近 1，损失越小。"
      data-state-key="activity:loss-design"
      data-telemetry-manual
    >
      <section className="wp-loss-designer">
        <TextInput
          multiline
          rows={3}
          hint
          placeholder="例如：预测概率越接近 1，损失越小。"
          aria-label="你的损失函数想法或公式"
          value={state.answer}
          disabled={!activity.hydrated || state.status === 'submitting'}
          onChange={(event) => {
            const current = activity.stateRef.current;
            if (!current) return;
            activity.setDraft({
              ...current,
              answer: event.target.value,
              status: current.status === 'error' ? 'idle' : current.status,
              feedback: current.status === 'error' ? '' : current.feedback,
            });
          }}
          onBlur={(event) => {
            if (
              event.relatedTarget instanceof Element
              && event.relatedTarget.closest('.lg2-loss-design-submit')
            ) {
              return;
            }
            commitDraft();
          }}
        />
        <Button
          className="lg2-loss-design-submit"
          variant="primary"
          hint
          loading={state.status === 'submitting'}
          disabled={!activity.hydrated}
          onClick={() => void submitDesign()}
        >
          查看损失曲线
        </Button>
        <Feedback
          className="wp-feedback"
          status={feedbackStatus}
          message={state.feedback}
          hidden={!state.feedback}
        />
      </section>

      {design && sampled && (
        <section
          ref={resultRef}
          className="wp-loss-result"
          aria-label="损失函数设计结果"
        >
          <div className="wp-loss-formulas">
            {showUserFormula && (
              <article className="wp-loss-formula-card">
                <span className="edu-kicker">你的损失函数</span>
                <div className="edu-formula-block">
                  <div
                    className="edu-formula"
                    aria-label={`你的损失函数：${design.formula}`}
                  >
                    <ExplainedFormulaText text={design.formula} />
                  </div>
                  <div
                    className="edu-formula"
                    aria-label={`你的损失函数导数：${design.derivative}`}
                  >
                    <ExplainedFormulaText text={design.derivative} />
                  </div>
                </div>
              </article>
            )}
            <article className="wp-loss-formula-card">
              <span className="edu-kicker">负对数损失</span>
              <div className="edu-formula-block">
                <div
                  className="edu-formula"
                  aria-label="损失 L p 等于负 log p"
                >
                  <ExplainedFormulaText text="L(" />
                  <FormulaTerm tooltip="p：模型给真实类别分配的概率">
                    p
                  </FormulaTerm>
                  <ExplainedFormulaText text=") = −log(p)" />
                </div>
                <div
                  className="edu-formula"
                  aria-label="损失的导数等于负一除以 p"
                >
                  <ExplainedFormulaText text="L′(" />
                  <FormulaTerm tooltip="p 越接近 0，负梯度的绝对值越大">
                    p
                  </FormulaTerm>
                  <ExplainedFormulaText text=") = −1/p" />
                </div>
              </div>
            </article>
          </div>

          <section
            className="wp-loss-chart-panel"
            aria-label="负对数损失及其导数曲线"
          >
            <div
              className="edu-check-group wp-chart-toggles"
              aria-label="选择图中显示的损失与导数曲线"
            >
              <ChartTraceCheckbox
                label="负对数损失"
                checked={state.traceVisible[0]}
                onChange={(event) => toggleTrace(0, event.target.checked)}
              />
              <ChartTraceCheckbox
                label="负对数损失的导数"
                checked={state.traceVisible[1]}
                onChange={(event) => toggleTrace(1, event.target.checked)}
              />
              {sampled.showUserCurve && (
                <>
                  <ChartTraceCheckbox
                    label="你的损失函数"
                    checked={state.traceVisible[2]}
                    onChange={(event) => toggleTrace(2, event.target.checked)}
                  />
                  <ChartTraceCheckbox
                    label="你的损失函数的导数"
                    checked={state.traceVisible[3]}
                    onChange={(event) => toggleTrace(3, event.target.checked)}
                  />
                </>
              )}
            </div>
            <PlotlyWithFallback
              className="edu-chart wp-loss-chart"
              data={chartData}
              layout={chartLayout}
              minHeight={380}
              aria-label="损失函数及其导数共用同一纵轴的曲线图"
              fallback="损失与导数曲线暂时不可用。"
            />
          </section>

          <section className="wp-bce-grid" aria-label="二分类交叉熵规则">
            <div className="wp-bce-card">
              <span className="edu-kicker">把两种真实情况写成一个公式</span>
              <strong>
                当真实标签 y=1 时，只计算实际下雨对应的损失；当 y=0
                时，只计算实际不下雨对应的损失。把两种情况写在一起，就得到二分类交叉熵损失
                BCE。
              </strong>

              <div className="wp-bce-cases">
                <article className="wp-bce-case">
                  <strong>情况一：真实值为 0，也就是实际没下雨</strong>
                  <p>
                    正确类别是“不下雨”，它的概率是 <strong>1 − p</strong>。
                  </p>
                  <FormulaBlock ariaLabel="损失 L 等于负 log 一减 p">
                    <FormulaTerm tooltip="L：真实值为 0 时的损失">
                      L
                    </FormulaTerm>
                    <ExplainedFormulaText text=" = −log(1 − " />
                    <FormulaTerm tooltip="p：模型预测下雨的概率">
                      p
                    </FormulaTerm>
                    {')'}
                  </FormulaBlock>
                </article>

                <article className="wp-bce-case">
                  <strong>情况二：真实值为 1，也就是实际下雨</strong>
                  <p>正确类别是“下雨”，请填入它的预测概率。</p>
                  <fieldset
                    disabled={bceSolved}
                    style={{ border: 0, margin: 0, minWidth: 0, padding: 0 }}
                    aria-disabled={bceSolved || undefined}
                    onClickCapture={(event) => {
                      const target = event.target;
                      bceQuestionInteractionRef.current = (
                        target instanceof Element
                        && Boolean(target.closest('.dl-question-submit'))
                      );
                    }}
                  >
                    <Question
                      className="lg2-bce-fill-question"
                      persistenceKey="bce-rain-probability"
                      type="fill"
                      typeLabel="填空题"
                      title="L = −log(____)"
                      blanks={[{
                        label: '下雨的预测概率',
                        placeholder: '',
                      }]}
                      answer="p"
                      submitText="检查"
                      feedback={{
                        correct: '正确。p 就是模型预测“下雨”的概率。',
                        wrong: '再想想：p 就是模型预测“下雨”的概率。',
                      }}
                      onCheck={(result) => {
                        const fromUser = bceQuestionInteractionRef.current;
                        bceQuestionInteractionRef.current = false;
                        if (!result.ok) return;
                        setBceSolved(true);
                        if (fromUser) {
                          reportComplete();
                          window.requestAnimationFrame(() => {
                            scrollIntoView(combinedRevealRef.current, 'nearest');
                          });
                        }
                      }}
                    />
                  </fieldset>
                </article>
              </div>

              {(bceSolved || lessonStepComplete) && (
                <div
                  ref={combinedRevealRef}
                  className="wp-bce-combined-reveal"
                >
                  <strong className="wp-bce-step-title">先写成分段函数</strong>
                  <div className="edu-formula-block">
                    <div
                      className="edu-formula wp-piecewise-formula"
                      aria-label="损失是一个分段函数：真实值为 0 时等于负 log 一减 p，真实值为 1 时等于负 log p"
                    >
                      <span className="wp-piecewise-name">
                        <FormulaTerm tooltip="L：当前样本的二分类损失">
                          L
                        </FormulaTerm>
                        <ExplainedFormulaText text="(" />
                        <FormulaTerm tooltip="p：模型预测下雨的概率">
                          p
                        </FormulaTerm>
                        {', '}
                        <FormulaTerm tooltip="y：真实值；下雨为 1，没下雨为 0">
                          y
                        </FormulaTerm>
                        <ExplainedFormulaText text=") = " />
                      </span>
                      <FormulaTerm
                        className="wp-piecewise-brace"
                        tooltip="大括号：表示根据右侧条件，从两行公式中选择一行"
                      >
                        {'{'}
                      </FormulaTerm>
                      <span className="wp-piecewise-cases">
                        <span className="wp-piecewise-row">
                          <span className="wp-piecewise-expression">
                            <ExplainedFormulaText text="−log(1 − " />
                            <FormulaTerm tooltip="p：模型预测下雨的概率">
                              p
                            </FormulaTerm>
                            {')'}
                          </span>
                          <span className="wp-piecewise-condition">
                            {'真实值 '}
                            <FormulaTerm tooltip="y：真实值">y</FormulaTerm>
                            <ExplainedFormulaText text=" = 0 时" />
                          </span>
                        </span>
                        <span className="wp-piecewise-row">
                          <span className="wp-piecewise-expression">
                            <ExplainedFormulaText text="−log(" />
                            <FormulaTerm tooltip="p：模型预测下雨的概率">
                              p
                            </FormulaTerm>
                            {')'}
                          </span>
                          <span className="wp-piecewise-condition">
                            {'真实值 '}
                            <FormulaTerm tooltip="y：真实值">y</FormulaTerm>
                            <ExplainedFormulaText text=" = 1 时" />
                          </span>
                        </span>
                      </span>
                    </div>
                  </div>

                  <strong className="wp-bce-step-title">
                    用真实标签 y 选择对应的损失
                  </strong>
                  <FormulaBlock ariaLabel="二分类交叉熵损失等于负的 y 乘 log p，加一减 y 乘 log 一减 p">
                    <FormulaTerm tooltip="L：Binary Cross Entropy，二分类交叉熵损失">
                      L
                    </FormulaTerm>
                    <ExplainedFormulaText text=" = −[" />
                    <FormulaTerm tooltip="y：目标值，可取 0 到 1；用于确定正类项的权重">
                      y
                    </FormulaTerm>
                    <ExplainedFormulaText text=" log(" />
                    <FormulaTerm tooltip="p：模型预测下雨的概率">
                      p
                    </FormulaTerm>
                    <ExplainedFormulaText text=") + (1 − y) log(1 − p)]" />
                  </FormulaBlock>
                </div>
              )}
            </div>
          </section>
        </section>
      )}
    </LessonStage>
  );
}
