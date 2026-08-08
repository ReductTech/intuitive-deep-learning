import { useRef, type FormEvent } from 'react';
import {
  Button,
  Feedback,
  LessonStage,
  MathFormulaBlock,
  MathFormulaStatic,
  MathFormulaTerm,
  NoticeStrip,
  RangeControl,
} from '../../shared/react';
import { usePersistedActivity } from '../components/usePersistedActivity';
import {
  formatNumber,
  RELU_INTRO_MAX_X,
  RELU_INTRO_MIN_X,
  RELU_INTRO_STEP,
  RELU_INTRO_WEIGHT,
  reluIntroForward,
} from '../model/activationMath';

const STATE_KEY = 'activity:activation-relu-intro';

interface ReluIntroSnapshot {
  value: number;
  touched: boolean;
  exploredNegative: boolean;
  continued: boolean;
}

function createInitialSnapshot(): ReluIntroSnapshot {
  return {
    value: 0,
    touched: false,
    exploredNegative: false,
    continued: false,
  };
}

function normalizeSnapshot(value: unknown): ReluIntroSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<ReluIntroSnapshot>;
  const numericValue = Number(candidate.value);
  if (!Number.isFinite(numericValue)) return null;
  const booleanFields = [
    candidate.touched,
    candidate.exploredNegative,
    candidate.continued,
  ];
  if (booleanFields.some(
    (entry) => entry !== undefined && typeof entry !== 'boolean',
  )) {
    return null;
  }
  return {
    value: Math.max(
      RELU_INTRO_MIN_X,
      Math.min(RELU_INTRO_MAX_X, numericValue),
    ),
    touched: Boolean(candidate.touched),
    exploredNegative: Boolean(candidate.exploredNegative),
    continued: Boolean(candidate.continued),
  };
}

export interface ReluIntroBlockProps {
  onComplete: () => void;
}

export function ReluIntroBlock({ onComplete }: ReluIntroBlockProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const dirtyRef = useRef(false);
  const {
    state,
    stateRef,
    hydrated,
    setDraft,
    commit,
  } =
    usePersistedActivity<ReluIntroSnapshot>({
      stateKey: STATE_KEY,
      createInitial: createInitialSnapshot,
      normalizeState: normalizeSnapshot,
      getElement: () => rootRef.current,
    });
  const result = reluIntroForward(state?.value ?? 0);

  const updateValue = (event: FormEvent<HTMLInputElement>) => {
    const value = Number(event.currentTarget.value);
    dirtyRef.current = true;
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        value,
        touched: true,
        exploredNegative: current.exploredNegative || value < 0,
      };
    });
  };

  const commitValue = () => {
    if (!hydrated || !dirtyRef.current || !stateRef.current) return;
    dirtyRef.current = false;
    commit('activation_relu_input_commit', stateRef.current, {
      value: stateRef.current.value,
      explored_negative: stateRef.current.exploredNegative,
    });
  };

  const continueLearning = () => {
    if (!state || !state.exploredNegative || state.continued) return;
    const next = { ...state, continued: true };
    commit('activation_relu_intro_continue', next, {
      explored_negative: true,
    });
    onComplete();
  };

  const observation = (() => {
    if (!state?.touched) {
      return {
        status: 'info' as const,
        label: '先调整输入',
        text: '拖动上方滑杆，观察输入、加权计算和 ReLU 输出怎样一起变化。',
      };
    }
    if (result.z < 0) {
      return {
        status: 'info' as const,
        label: '负数被抑制了',
        text: `输入 x = ${formatNumber(result.x)}，加权结果已经变成 ${formatNumber(result.z)}，但 ReLU 把它截成了 0。继续在负数区域拖动时，2x 会变化，输出 y 却始终停在 0。`,
      };
    }
    if (result.z === 0) {
      return {
        status: 'info' as const,
        label: '这里就是折点',
        text: '当加权结果恰好为 0，ReLU 的两段规则在这里相接：左边所有负数都被压成 0，右边的正数按原值通过。',
      };
    }
      return {
        status: 'info' as const,
      label: '正数正常通过',
      text: `输入 x = ${formatNumber(result.x)}，乘以固定权重 2 后得到 ${formatNumber(result.z)}；因为它是正数，ReLU 让它直接通过。请把输入拖到负数区域继续观察。`,
    };
  })();

  return (
    <LessonStage
      ref={rootRef}
      className="af-react-network-lab af-react-relu-intro"
      kicker="第三幕 · 非线性"
      title="ReLU 做了什么？先看一个神经元"
      description="在上一模块中，神经元会把输入乘以权重，再汇总成输出。现在沿用这个熟悉的结构，只在汇总结果后加一道 ReLU：正数照常通过，负数变成 0。"
      data-telemetry-manual
      aria-busy={!hydrated}
    >
      {!state ? (
        <NoticeStrip tone="blue">
          正在恢复输入位置与探索记录…
        </NoticeStrip>
      ) : (
        <div className="af-react-relu-card">
          <div className="af-react-relu-control">
            <RangeControl
              label="拖动输入 x，尤其观察负数区域"
              min={RELU_INTRO_MIN_X}
              max={RELU_INTRO_MAX_X}
              step={RELU_INTRO_STEP}
              value={state.value}
              digits={2}
              unset={!state.touched}
              disabled={!hydrated}
              onInput={updateValue}
              onPointerUp={commitValue}
              onPointerCancel={commitValue}
              onKeyUp={commitValue}
              onBlur={commitValue}
            />
            <div className="af-react-fixed-weight" aria-label="固定权重为 2">
              <span>固定权重</span>
              <strong>w = {RELU_INTRO_WEIGHT.toFixed(2)}</strong>
            </div>
          </div>

          <MathFormulaBlock
            className="af-react-relu-definition"
            ariaLabel="ReLU z 等于 0 和 z 中较大的一个"
          >
            <MathFormulaTerm latex="\operatorname{ReLU}" tooltip="ReLU：把负数截为 0，让非负数保持原值" />
            <MathFormulaStatic latex="(" />
            <MathFormulaTerm latex="z" tooltip="z：输入乘权重后的加权结果" />
            <MathFormulaStatic latex=")=" />
            <MathFormulaTerm latex="\max(0,z)" tooltip="z 大于等于 0 时输出 z；否则输出 0" />
          </MathFormulaBlock>

          <div className={`af-react-relu-flow${result.z < 0 ? ' is-suppressed' : ''}`}>
            <div className="af-react-signal-node af-react-signal-node--input">
              <span>输入 x</span>
              <strong>{state.touched ? formatNumber(result.x) : '--'}</strong>
            </div>
            <div className="af-react-flow-link">
              <span className="dl-network-weight af-react-weight-badge">
                权重 <b>{RELU_INTRO_WEIGHT.toFixed(2)}</b>
              </span>
            </div>
            <div className="af-react-neuron-node">
              <span>神经元</span>
              <div className="af-react-neuron-operation"><b>Σ</b><i>|</i><b>ReLU</b></div>
            </div>
            <div className="af-react-flow-link" aria-hidden="true" />
            <div className="af-react-signal-node af-react-signal-node--output">
              <span>输出 y</span>
              <strong>{state.touched ? formatNumber(result.y) : '--'}</strong>
            </div>
          </div>

          <div className="af-react-relu-formulas" aria-live="polite">
            <MathFormulaBlock ariaLabel="线性计算">
              <MathFormulaTerm
                latex={state.touched
                  ? `z=x\\cdot w=${formatNumber(result.x)}\\cdot 2=${formatNumber(result.z)}`
                  : 'z=x\\cdot w'}
                tooltip="先用输入乘以权重，得到激活前的线性结果 z"
              />
            </MathFormulaBlock>
            <MathFormulaBlock ariaLabel="ReLU 激活计算">
              <MathFormulaTerm
                latex={state.touched
                  ? `y=\\operatorname{ReLU}(z)=\\max(0,${formatNumber(result.z)})=${formatNumber(result.y)}`
                  : 'y=\\operatorname{ReLU}(z)'}
                tooltip="再把线性结果 z 送入 ReLU，得到输出 y"
              />
            </MathFormulaBlock>
          </div>

          <Feedback
            status={observation.status}
            label={observation.label}
            message={observation.text}
          />

          {state.exploredNegative && (
            <div className="af-react-relu-next">
              <p>
                你已经看到：负数区域里，输入继续变化，输出却一直停在 0。
                整个函数不再始终保持固定的 2 倍关系，因此出现了非线性的折点。
              </p>
              <Button
                variant="primary"
                disabled={state.continued}
                onClick={continueLearning}
              >
                继续：组合多个带有 ReLU 的神经元
              </Button>
            </div>
          )}
        </div>
      )}
    </LessonStage>
  );
}
