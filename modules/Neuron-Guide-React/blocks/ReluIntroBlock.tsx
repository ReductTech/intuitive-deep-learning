import { useRef, type CSSProperties, type FormEvent } from 'react';
import {
  LessonStage,
  NoticeStrip,
  Typography,
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
import '../linear-network.css';

const STATE_KEY = 'activity:neuron-guide-relu-intro-v1';

interface ReluIntroSnapshot {
  value: number;
  touched: boolean;
  exploredNegative: boolean;
  completed: boolean;
}

function createInitialSnapshot(): ReluIntroSnapshot {
  return { value: 0, touched: false, exploredNegative: false, completed: false };
}

function normalizeSnapshot(value: unknown): ReluIntroSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<ReluIntroSnapshot>;
  const numericValue = Number(candidate.value);
  if (!Number.isFinite(numericValue)) return null;
  return {
    value: Math.max(RELU_INTRO_MIN_X, Math.min(RELU_INTRO_MAX_X, numericValue)),
    touched: Boolean(candidate.touched),
    exploredNegative: Boolean(candidate.exploredNegative),
    completed: Boolean(candidate.completed),
  };
}

export interface ReluIntroBlockProps {
  onComplete: () => void;
}

export function ReluIntroBlock({ onComplete }: ReluIntroBlockProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const dirtyRef = useRef(false);
  const { state, stateRef, hydrated, setDraft, commit } =
    usePersistedActivity<ReluIntroSnapshot>({
      stateKey: STATE_KEY,
      createInitial: createInitialSnapshot,
      normalizeState: normalizeSnapshot,
      getElement: () => rootRef.current,
    });
  const result = reluIntroForward(state?.value ?? 0);

  const updateValue = (event: FormEvent<HTMLInputElement>) => {
    const signalValue = Number(event.currentTarget.value);
    const value = signalValue / RELU_INTRO_WEIGHT;
    dirtyRef.current = true;
    setDraft((current) => current ? {
      ...current,
      value,
      touched: true,
      exploredNegative: current.exploredNegative || value < 0,
    } : current);
  };

  const commitValue = () => {
    const current = stateRef.current;
    if (!hydrated || !dirtyRef.current || !current) return;
    dirtyRef.current = false;
    const completed = current.completed || current.exploredNegative;
    commit('neuron_guide_relu_input_commit', { ...current, completed }, {
      value: current.value,
      explored_negative: current.exploredNegative,
    });
    if (!current.completed && completed) onComplete();
  };

  const isSuppressed = result.z <= 0;
  const normalizedSignal = state?.touched
    ? Math.max(0, Math.min(1, (result.z - RELU_INTRO_MIN_X * RELU_INTRO_WEIGHT)
      / ((RELU_INTRO_MAX_X - RELU_INTRO_MIN_X) * RELU_INTRO_WEIGHT)))
    : 0.5;
  const positiveLevel = state?.touched
    ? Math.max(0, Math.min(1, result.z / (RELU_INTRO_MAX_X * RELU_INTRO_WEIGHT)))
    : 0;
  const responseStyle = {
    '--ng-signal-position': `${normalizedSignal * 100}%`,
    '--ng-output-level': positiveLevel,
    '--ng-output-scale': 1 + positiveLevel * 0.14,
    '--ng-output-glow': `${8 + positiveLevel * 34}px`,
    '--ng-output-alpha': 0.08 + positiveLevel * 0.28,
  } as CSSProperties;

  return (
    <LessonStage
      ref={rootRef}
      className="af-react-network-lab af-react-relu-intro"
      title="从线性计算到非线性响应"
      description="早期模型用 0 或 1 表示是否响应；现代人工神经元通常传递连续数值。这里的“抑制与激活”描述响应状态：低于阈值时抑制，超过阈值后继续传递连续值。"
      descriptionVariant="bodySmall"
      data-telemetry-manual
      aria-busy={!hydrated}
    >
      {!state ? (
        <NoticeStrip tone="blue"><Typography variant="bodySmall" tone="inherit">正在恢复交互状态…</Typography></NoticeStrip>
      ) : (
        <div
          className={`ng-response-lab${!state.touched ? ' is-waiting' : isSuppressed ? ' is-suppressed' : ' is-active'}`}
          style={responseStyle}
        >
          <div className="ng-response-lab__scene">
            <div className="ng-response-lab__threshold-view">
              <div className="ng-response-lab__instruction">
                <div>
                  <Typography as="strong" variant="h3" tone="main">改变 z，观察输出如何变化</Typography>
                  <Typography as="p" variant="body" tone="muted">注意零点前后：哪一段保持不变，哪一段开始增长？</Typography>
                </div>
                <div className="ng-response-lab__current">
                  <Typography as="span" variant="bodySmall" tone="muted">加权结果</Typography>
                  <Typography as="strong" variant="h3" tone="warning">z = {state.touched ? formatNumber(result.z) : '—'}</Typography>
                </div>
              </div>
              <div className="ng-response-lab__neuron-demo">
                <div className="ng-response-lab__neuron-state">
                  <div className="ng-response-lab__charge-ring" aria-hidden="true">
                    {state.touched && isSuppressed ? <i className="ng-response-lab__suppressed-flash" /> : null}
                    <div className="ng-response-lab__neuron-core">
                      <Typography as="span" variant="bodySmall" tone="inherit">最终输出</Typography>
                      <Typography as="strong" variant="h3" tone="inherit">y = {state.touched ? formatNumber(result.y) : '—'}</Typography>
                    </div>
                  </div>
                  <Typography as="strong" variant="subtitle" tone={isSuppressed ? 'main' : 'success'}>
                    {!state.touched ? '等待观察' : isSuppressed ? '抑制' : '激活'}
                  </Typography>
                </div>

                <div className="ng-response-lab__single-control">
                  <div className="ng-response-lab__control-head">
                    <Typography as="strong" variant="subtitle" tone="main">调节加权结果 z</Typography>
                    <Typography as="strong" variant="subtitle" tone="warning">{state.touched ? formatNumber(result.z) : '—'}</Typography>
                  </div>
                  <div className="ng-response-lab__control-track">
                    <div className="ng-response-lab__control-threshold">
                      <Typography as="span" variant="bodySmall" tone="muted">响应起点 z = 0</Typography>
                    </div>
                    <input
                      className="ng-response-lab__direct-control"
                      type="range"
                      aria-label="调节加权结果 z"
                      min={RELU_INTRO_MIN_X * RELU_INTRO_WEIGHT}
                      max={RELU_INTRO_MAX_X * RELU_INTRO_WEIGHT}
                      step={RELU_INTRO_STEP * RELU_INTRO_WEIGHT}
                      value={result.z}
                      disabled={!hydrated}
                      onInput={updateValue}
                      onPointerUp={commitValue}
                      onPointerCancel={commitValue}
                      onKeyUp={commitValue}
                      onBlur={commitValue}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={`ng-response-lab__result${state.touched ? ' is-visible' : ''}`}>
              <Typography as="strong" variant="subtitle" tone={isSuppressed ? 'main' : 'success'}>
                {!state.touched ? '拖动滑块开始观察' : isSuppressed ? '输出保持不变' : '输出开始增长'}
              </Typography>
              <Typography as="p" variant="body" tone="main">
                {!state.touched
                  ? '观察最终输出 y 在零点前后有什么不同。'
                  : isSuppressed
                    ? `z = ${formatNumber(result.z)} 尚未越过 0，最终输出保持 y = 0。`
                    : `z = ${formatNumber(result.z)} 已越过 0，最终输出随 z 增大为 y = ${formatNumber(result.y)}。`}
              </Typography>
            </div>
          </div>

        </div>
      )}
    </LessonStage>
  );
}
