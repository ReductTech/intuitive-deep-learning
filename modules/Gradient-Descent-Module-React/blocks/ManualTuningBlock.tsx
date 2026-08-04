import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import {
  Button,
  Feedback,
  MathFormulaBlock,
  MathFormulaStatic,
  RangeControl,
  Typography,
  emitTelemetry,
  getTelemetryState,
  type TelemetryStateEntry,
} from '../../shared/react';
import { GradientNetworkDiagram } from '../components/GradientNetworkDiagram';
import {
  INITIAL_OUTPUT_WEIGHTS,
  MANUAL_TARGET,
  forwardOutputWeights,
  type OutputWeights,
} from '../model/gradientMath';

export interface ManualTuningBlockProps {
  onComplete: () => void;
}

type WeightKey = keyof OutputWeights;
type InteractionKind = 'pointer' | 'keyboard';

interface ManualActivityState {
  version?: number;
  weights?: Partial<OutputWeights>;
  impactRevealed?: boolean;
  sliderHintDismissed?: boolean;
  v1?: number;
  v2?: number;
}

interface ActiveInteraction {
  control: WeightKey;
  kind: InteractionKind;
  changed: boolean;
}

interface ManualQuestionResult {
  ok: boolean;
  empty: boolean;
  answer: string[];
  tone: 'correct' | 'wrong';
  message: string;
}

interface PersistedManualQuestionState {
  selected_values?: unknown[];
  correct?: boolean | null;
  submitted?: boolean;
  result?: {
    ok?: boolean;
    empty?: boolean;
    answer?: unknown[];
    tone?: unknown;
    message?: unknown;
  } | null;
}

interface ManualChoiceOption {
  key: string;
  value: string;
  label: ReactNode;
}

interface PersistedInstantChoiceQuestionProps {
  persistenceKey: string;
  title: ReactNode;
  options: ManualChoiceOption[];
  answer: string;
  feedback: {
    correct: string;
    wrong: string;
  };
  disabled: boolean;
  onHydrated: () => void;
  onCheck: (result: ManualQuestionResult) => void;
}

const ACTIVITY_STATE_KEY = 'activity:gd-manual';
const CLOSE_LOSS_THRESHOLD = 0.5;
const WEIGHT_MIN = -1;
const WEIGHT_MAX = 3;
const WEIGHT_STEP = 0.1;
const TELEMETRY_RESTORE_TIMEOUT_MS = 3000;
const RANGE_KEYS = new Set([
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'End',
  'Home',
  'PageDown',
  'PageUp',
]);

function initialOutputWeights(): OutputWeights {
  return {
    v1: INITIAL_OUTPUT_WEIGHTS.v1,
    v2: INITIAL_OUTPUT_WEIGHTS.v2,
  };
}

function normalizeWeight(value: unknown, fallback: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const clamped = Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, numeric));
  return Math.round(clamped / WEIGHT_STEP) * WEIGHT_STEP;
}

function restoredWeights(state: ManualActivityState): OutputWeights {
  const source = state.weights ?? state;
  return {
    v1: normalizeWeight(source.v1, INITIAL_OUTPUT_WEIGHTS.v1),
    v2: normalizeWeight(source.v2, INITIAL_OUTPUT_WEIGHTS.v2),
  };
}

async function getTelemetryStateWithTimeout<T>(
  stateKey: string,
): Promise<TelemetryStateEntry<T> | null> {
  let timeoutId: number | null = null;
  try {
    return await Promise.race([
      getTelemetryState<T>(stateKey),
      new Promise<null>((resolve) => {
        timeoutId = window.setTimeout(
          () => resolve(null),
          TELEMETRY_RESTORE_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timeoutId !== null) window.clearTimeout(timeoutId);
  }
}

function PersistedInstantChoiceQuestion({
  persistenceKey,
  title,
  options,
  answer,
  feedback,
  disabled,
  onHydrated,
  onCheck,
}: PersistedInstantChoiceQuestionProps) {
  const stateKey = `question:${persistenceKey}`;
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<ManualQuestionResult | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);
  const onHydratedRef = useRef(onHydrated);
  const onCheckRef = useRef(onCheck);
  const restoreConfigRef = useRef({ options, answer, feedback });
  onHydratedRef.current = onHydrated;
  onCheckRef.current = onCheck;
  restoreConfigRef.current = { options, answer, feedback };

  useEffect(() => {
    let active = true;
    void getTelemetryStateWithTimeout<PersistedManualQuestionState>(
      stateKey,
    ).then((entry) => {
      if (!active) return;

      const state = entry?.state;
      const restoreConfig = restoreConfigRef.current;
      const selectedValue = Array.isArray(state?.selected_values)
        && typeof state.selected_values[0] === 'string'
        && restoreConfig.options.some(
          (option) => option.value === state.selected_values?.[0],
        )
        ? state.selected_values[0]
        : null;
      if (selectedValue) setSelected(selectedValue);

      const wasSubmitted = state?.submitted
        ?? (entry?.event_name === 'answer_select');
      if (selectedValue && wasSubmitted) {
        const storedResult = state?.result;
        const ok = typeof storedResult?.ok === 'boolean'
          ? storedResult.ok
          : typeof state?.correct === 'boolean'
            ? state.correct
            : selectedValue === restoreConfig.answer;
        const tone = storedResult?.tone === 'correct'
          || storedResult?.tone === 'wrong'
          ? storedResult.tone
          : ok ? 'correct' : 'wrong';
        const restored: ManualQuestionResult = {
          ok,
          empty: storedResult?.empty === true,
          answer: Array.isArray(storedResult?.answer)
            ? storedResult.answer.map(String)
            : [selectedValue],
          tone,
          message: typeof storedResult?.message === 'string'
            ? storedResult.message
            : ok
              ? restoreConfig.feedback.correct
              : restoreConfig.feedback.wrong,
        };
        setResult(restored);
        onCheckRef.current(restored);
      }

      setHydrated(true);
      onHydratedRef.current();
    });

    return () => {
      active = false;
    };
  }, [stateKey]);

  function choose(value: string) {
    if (!hydrated || disabled) return;
    const ok = value === answer;
    const checked: ManualQuestionResult = {
      ok,
      empty: false,
      answer: [value],
      tone: ok ? 'correct' : 'wrong',
      message: ok ? feedback.correct : feedback.wrong,
    };
    const persistedResult = {
      ok: checked.ok,
      empty: checked.empty,
      answer: checked.answer,
      tone: checked.tone,
      message: checked.message,
    };
    const answerFields = [{ value: '', length: 0, empty: true }];

    setSelected(value);
    setResult(checked);
    emitTelemetry('answer_select', rootRef.current, {
      state_key: stateKey,
      question_type: 'choice',
      selected_values: [value],
      answer_fields: answerFields,
      correct: checked.ok,
      submitted: true,
      result: persistedResult,
      state: {
        selected_values: [value],
        answer_fields: answerFields,
        correct: checked.ok,
        submitted: true,
        result: persistedResult,
      },
    });
    onCheckRef.current(checked);
  }

  return (
    <section
      ref={rootRef}
      className="dl-question dl-question--choice"
      data-question-type="choice"
      data-submit-mode="instant"
      data-state-key={stateKey}
      data-telemetry-manual
      aria-busy={!hydrated}
    >
      <header className="dl-question-head">
        <span className="dl-question-type">单选题</span>
        <div className="dl-question-title-row">
          <strong className="dl-question-stem">{title}</strong>
        </div>
      </header>
      <div className="dl-question-options" role="radiogroup">
        {options.map((option, index) => {
          const isSelected = selected === option.value;
          const markedCorrect = Boolean(
            result?.ok && option.value === answer,
          );
          const markedWrong = Boolean(
            result && !result.ok && isSelected,
          );
          return (
            <button
              className={[
                'dl-question-option',
                isSelected ? 'is-selected' : '',
                markedCorrect ? 'is-correct' : '',
                markedWrong ? 'is-wrong' : '',
              ].filter(Boolean).join(' ')}
              key={`${option.value}-${index}`}
              type="button"
              data-index={index}
              data-value={option.value}
              aria-pressed={isSelected}
              disabled={!hydrated || disabled}
              onClick={() => choose(option.value)}
            >
              <span className="dl-option-key">{option.key}</span>
              <span className="dl-option-body">{option.label}</span>
            </button>
          );
        })}
      </div>
      <Feedback
        status={result?.tone ?? 'info'}
        message={result?.message}
        className="dl-question-feedback"
        hidden={!result}
      />
    </section>
  );
}

export function ManualTuningBlock({ onComplete }: ManualTuningBlockProps) {
  const [weights, setWeights] = useState<OutputWeights>(initialOutputWeights);
  const [hydrated, setHydrated] = useState(false);
  const [directionQuestionReady, setDirectionQuestionReady] = useState(false);
  const [directionSolved, setDirectionSolved] = useState(false);
  const [impactRevealed, setImpactRevealed] = useState(false);
  const [impactQuestionReady, setImpactQuestionReady] = useState(false);
  const [impactSolved, setImpactSolved] = useState(false);
  const [sliderHintActive, setSliderHintActive] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const weightsRef = useRef<OutputWeights>(weights);
  const directionQuestionReadyRef = useRef(false);
  const directionSolvedRef = useRef(false);
  const impactRevealedRef = useRef(false);
  const impactSolvedRef = useRef(false);
  const sliderHintDismissedRef = useRef(false);
  const completedRef = useRef(false);
  const activeInteractionRef = useRef<ActiveInteraction | null>(null);

  const result = forwardOutputWeights(weights, MANUAL_TARGET);
  const isClose = result.loss < CLOSE_LOSS_THRESHOLD;

  function activitySnapshot(
    currentWeights = weightsRef.current,
  ): ManualActivityState {
    return {
      version: 2,
      weights: { ...currentWeights },
      impactRevealed: impactRevealedRef.current,
      sliderHintDismissed: sliderHintDismissedRef.current,
    };
  }

  function revealImpactWhenReady(currentWeights = weightsRef.current) {
    if (
      impactRevealedRef.current
      || !directionSolvedRef.current
      || forwardOutputWeights(currentWeights, MANUAL_TARGET).loss
        >= CLOSE_LOSS_THRESHOLD
    ) {
      return;
    }
    impactRevealedRef.current = true;
    setImpactRevealed(true);
  }

  function emitActivityState(
    eventName: 'control_commit' | 'activity_reset',
    control: WeightKey | 'weights',
  ) {
    const currentWeights = weightsRef.current;
    emitTelemetry(eventName, rootRef.current, {
      state_key: ACTIVITY_STATE_KEY,
      control_id: control,
      value: control === 'weights' ? undefined : currentWeights[control],
      state: activitySnapshot(currentWeights),
    });
  }

  function beginInteraction(
    control: WeightKey,
    kind: InteractionKind,
  ) {
    const current = activeInteractionRef.current;
    if (current?.control === control && current.kind === kind) return;
    activeInteractionRef.current = { control, kind, changed: false };
  }

  function finishInteraction(
    control: WeightKey,
    kind?: InteractionKind,
  ) {
    const current = activeInteractionRef.current;
    if (
      !current
      || current.control !== control
      || (kind !== undefined && current.kind !== kind)
    ) {
      return;
    }
    activeInteractionRef.current = null;
    if (current.changed) emitActivityState('control_commit', control);
  }

  function changeWeight(
    control: WeightKey,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    if (!hydrated) return;
    if (!sliderHintDismissedRef.current) {
      sliderHintDismissedRef.current = true;
      setSliderHintActive(false);
    }
    const nextValue = normalizeWeight(
      event.currentTarget.value,
      weightsRef.current[control],
    );
    if (nextValue === weightsRef.current[control]) return;

    const nextWeights: OutputWeights = {
      ...weightsRef.current,
      [control]: nextValue,
    };
    weightsRef.current = nextWeights;
    setWeights(nextWeights);
    revealImpactWhenReady(nextWeights);

    const interaction = activeInteractionRef.current;
    if (interaction?.control === control) {
      interaction.changed = true;
    } else {
      // Assistive technologies may change a range without pointer/key events.
      emitActivityState('control_commit', control);
    }
  }

  function handleDirection(result: ManualQuestionResult) {
    if (!result.ok || directionSolvedRef.current) return;
    const shouldFocusFirstWeight = directionQuestionReadyRef.current;
    directionSolvedRef.current = true;
    setDirectionSolved(true);
    if (!sliderHintDismissedRef.current) setSliderHintActive(true);
    revealImpactWhenReady();
    if (shouldFocusFirstWeight) {
      window.requestAnimationFrame(() => {
        rootRef.current
          ?.querySelector<HTMLInputElement>('#gd-manual-v1-range')
          ?.focus({ preventScroll: true });
      });
    }
  }

  function handleImpact(result: ManualQuestionResult) {
    if (!result.ok) return;
    if (!impactSolvedRef.current) {
      impactSolvedRef.current = true;
      setImpactSolved(true);
    }
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }

  function resetWeights() {
    if (!hydrated) return;
    activeInteractionRef.current = null;
    const nextWeights = initialOutputWeights();
    weightsRef.current = nextWeights;
    setWeights(nextWeights);
    // Deliberately keep solved questions and revealed content unchanged.
    emitActivityState('activity_reset', 'weights');
  }

  useEffect(() => {
    let active = true;
    void getTelemetryStateWithTimeout<ManualActivityState>(
      ACTIVITY_STATE_KEY,
    ).then((activityEntry) => {
      if (!active) return;
      if (activityEntry?.state) {
        const restored = restoredWeights(activityEntry.state);
        weightsRef.current = restored;
        setWeights(restored);
        if (activityEntry.state.impactRevealed === true) {
          impactRevealedRef.current = true;
          setImpactRevealed(true);
        }
        if (activityEntry.state.sliderHintDismissed === true) {
          sliderHintDismissedRef.current = true;
          setSliderHintActive(false);
        }
        // The module-local question adapter owns solved/feedback persistence.
        // Whichever restore finishes second re-evaluates the derived reveal
        // without duplicating an event.
        revealImpactWhenReady(restored);
      }
      setHydrated(true);
    });

    return () => {
      active = false;
    };
  }, []);

  function renderWeightControl(control: WeightKey, label: ReactNode) {
    const isV1 = control === 'v1';
    return (
      <RangeControl
        id={`gd-manual-${control}-range`}
        label={label}
        controlClassName={[
          'gd-inline-weight',
          sliderHintActive ? 'is-attention' : '',
        ].filter(Boolean).join(' ')}
        min={WEIGHT_MIN}
        max={WEIGHT_MAX}
        step={WEIGHT_STEP}
        digits={1}
        value={weights[control]}
        disabled={!hydrated || !directionSolved}
        onChange={(event) => changeWeight(control, event)}
        onPointerDown={() => beginInteraction(control, 'pointer')}
        onPointerUp={() => finishInteraction(control, 'pointer')}
        onPointerCancel={() => finishInteraction(control, 'pointer')}
        onLostPointerCapture={() => finishInteraction(control, 'pointer')}
        onKeyDown={(event) => {
          if (RANGE_KEYS.has(event.key)) {
            beginInteraction(control, 'keyboard');
          }
        }}
        onKeyUp={(event) => {
          if (RANGE_KEYS.has(event.key)) {
            finishInteraction(control, 'keyboard');
          }
        }}
        onBlur={() => finishInteraction(control)}
        aria-label={`输出层权重 ${isV1 ? 'v₁' : 'v₂'}`}
      />
    );
  }

  return (
    <div
      ref={rootRef}
      className="gd-react-manual-root"
      data-state-key={ACTIVITY_STATE_KEY}
      data-telemetry-manual
      aria-busy={
        !hydrated
        || !directionQuestionReady
        || (impactRevealed && !impactQuestionReady)
      }
    >
      <section
        className="edu-stage edu-content-block edu-stage--featured gd-stage gd-react-block gd-react-manual"
        aria-labelledby="gd-react-manual-title"
      >
        <header className="edu-content-head gd-panel-head">
          <div>
            <h2 className="edu-content-title" id="gd-react-manual-title">
              调整权重，让 L1 Loss 变成 0
            </h2>
            <p className="edu-content-subtitle">
              先判断权重应该往哪个方向变化，再亲手调整并观察预测结果。
            </p>
          </div>
          <Button disabled={!hydrated} onClick={resetWeights}>重置</Button>
        </header>

        <div className="edu-content-body">
          <div className="edu-task">
            <strong>当前任务</strong>
            <span>
              让预测值接近真实值 {MANUAL_TARGET}，并把 L1 Loss 降到 0。
            </span>
          </div>

          <section
            className="gd-react-rigor-note"
            aria-labelledby="gd-manual-objective-title"
          >
            <Typography
              as="h3"
              variant="h3"
              tone="accent"
              id="gd-manual-objective-title"
            >
              把“调权重”写成一个优化问题
            </Typography>
            <Typography variant="bodySmall">
              沿用本页记号：y 表示网络预测，GT = {MANUAL_TARGET} 表示真实目标，隐藏层输出 h₁ = 3、h₂ = 1 保持不变；当前需要学习的参数只有两个输出层权重 v₁、v₂。
            </Typography>
            <dl className="gd-react-definition-list">
              <div>
                <Typography as="dt" variant="label" tone="accent">模型参数</Typography>
                <Typography as="dd" variant="bodySmall">由训练过程调整、并决定模型输入输出关系的数值。本阶段只有 v₁、v₂ 是待学习参数；输入和隐藏层输出被固定，因此不属于本阶段的优化变量。</Typography>
              </div>
              <div>
                <Typography as="dt" variant="label" tone="accent">目标函数</Typography>
                <Typography as="dd" variant="bodySmall">把一组参数映射为一个标量代价的函数。这里的目标函数就是当前样本的 L1 Loss；比较两组权重优劣时，必须在同一输入和同一 GT 下比较其目标函数值。</Typography>
              </div>
              <div>
                <Typography as="dt" variant="label" tone="accent">优化</Typography>
                <Typography as="dd" variant="bodySmall">在允许的参数范围内寻找使目标函数尽可能小的参数。一次调节只是一次候选更新，连续执行“计算方向—更新参数—重新评价”才构成迭代优化过程。</Typography>
              </div>
            </dl>
            <MathFormulaBlock ariaLabel="参数向量 theta 由 v1 和 v2 组成，预测 y 等于 v1 h1 加 v2 h2，目标函数 L 等于预测与真实目标之差的绝对值">
              <MathFormulaStatic latex="\boldsymbol{\theta}=\begin{bmatrix}v_1\\v_2\end{bmatrix},\qquad y(\boldsymbol{\theta})=v_1h_1+v_2h_2,\qquad L(\boldsymbol{\theta})=\left|y(\boldsymbol{\theta})-\mathrm{GT}\right|" />
            </MathFormulaBlock>
            <Typography variant="bodySmall">
              因为这一层对权重是线性的，权重变化与预测变化之间存在下面的精确关系。它把后面的“哪个权重影响更大”从观察结论写成了可计算的关系。
            </Typography>
            <MathFormulaBlock ariaLabel="预测变化量 delta y 等于 h1 乘 delta v1 加 h2 乘 delta v2，在当前数值下等于三倍 delta v1 加 delta v2">
              <MathFormulaStatic latex="\Delta y=h_1\Delta v_1+h_2\Delta v_2=3\Delta v_1+\Delta v_2" />
            </MathFormulaBlock>
          </section>

          <div className="gd-opening-row">
            <div className="gd-scoreboard">
              <div
                className={[
                  'edu-value-tile',
                  isClose
                    ? 'edu-value-tile--success'
                    : 'edu-value-tile--orange',
                  'gd-score',
                  'gd-score--loss',
                  isClose ? 'is-low' : '',
                ].filter(Boolean).join(' ')}
              >
                <span className="edu-value-label">当前 L1 Loss</span>
                <strong className="edu-value-number">
                  {result.loss.toFixed(2)}
                </strong>
                <span className="gd-score-goal">目标：小于0.5</span>
              </div>
            </div>

            <fieldset
              className="gd-question-stack gd-direction-question gd-react-question-lock"
              disabled={!hydrated || !directionQuestionReady || directionSolved}
              aria-label="权重调整方向"
            >
              <PersistedInstantChoiceQuestion
                persistenceKey="gd-direction"
                title="现在输出值 y 比真实值 GT 小。为了让 y 变大、Loss 变小，权重大体上应该变大还是变小？"
                options={[
                  { key: 'A', value: 'up', label: '变大' },
                  { key: 'B', value: 'down', label: '变小' },
                ]}
                answer="up"
                feedback={{
                  correct: '对。把输出层权重整体往上调，y 会更接近 GT。',
                  wrong: '当前 y = -4，小于 GT = 10。再判断输出需要往哪个方向移动。',
                }}
                disabled={!hydrated || directionSolved}
                onHydrated={() => {
                  directionQuestionReadyRef.current = true;
                  setDirectionQuestionReady(true);
                }}
                onCheck={handleDirection}
              />
            </fieldset>
          </div>

          <GradientNetworkDiagram
            mode="output"
            weights={weights}
            target={MANUAL_TARGET}
            controls={{
              v1: renderWeightControl('v1', 'v₁'),
              v2: renderWeightControl('v2', 'v₂'),
            }}
          />

          {impactRevealed && (
            <fieldset
              className="gd-question-stack gd-impact-question gd-react-question-lock gd-react-impact-question"
              disabled={!hydrated || !impactQuestionReady || impactSolved}
              aria-label="输出权重影响比较"
            >
              <PersistedInstantChoiceQuestion
                persistenceKey="gd-impact"
                title="哪个权重调一点，对输出 y 的影响更大？"
                options={[
                  { key: 'A', value: 'v1', label: 'v₁' },
                  { key: 'B', value: 'v2', label: 'v₂' },
                ]}
                answer="v1"
                feedback={{
                  correct: '对。v₁ 前面乘的是 h₁ = 3；同样调整一点，v₁ 对 y 的影响更大。',
                  wrong: '观察隐藏层输出 h₁ = 3、h₂ = 1，比较两个权重前面乘的数。',
                }}
                disabled={!hydrated || impactSolved}
                onHydrated={() => setImpactQuestionReady(true)}
                onCheck={handleImpact}
              />
            </fieldset>
          )}
        </div>
      </section>
    </div>
  );
}
