import { useRef, type CSSProperties, type FormEvent } from 'react';
import "./ReluIntroPage.css";
import {
  ContentBlock,
  NoticeStrip,
  Typography,
} from '../../../shared/react';
import {
  formatNumber,
  RELU_INTRO_MAX_X,
  RELU_INTRO_MIN_X,
  RELU_INTRO_STEP,
  RELU_INTRO_WEIGHT,
  reluIntroForward,
  usePersistedActivity,
} from '../ActivationCatalogPage/ActivationCatalogPage';

const STATE_KEY = 'activity:neuron-guide-tailwind-relu-intro-v1';

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

export interface ReluIntroPageProps {
  onComplete: () => void;
}

export function ReluIntroPage({ onComplete }: ReluIntroPageProps) {
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
    '--ngtw-signal-position': `${normalizedSignal * 100}%`,
    '--ngtw-output-level': positiveLevel,
    '--ngtw-output-scale': 1 + positiveLevel * 0.14,
    '--ngtw-output-glow': `${8 + positiveLevel * 34}px`,
    '--ngtw-output-alpha': 0.08 + positiveLevel * 0.28,
  } as CSSProperties;

  return (
    <ContentBlock
      ref={rootRef}
      headingLevel={1}
      className="ngtw-activation-network-lab ngtw-activation-relu-intro"
      title="从线性计算到非线性响应"
      subtitle="加权结果 z 越过 0 之前，输出一直是 0；越过之后才开始增长。这条规则就是激活函数。"
      data-telemetry-manual
      aria-busy={!hydrated}
    >
      {!state ? (
        <NoticeStrip tone="blue"><Typography variant="body" tone="inherit">正在恢复交互状态…</Typography></NoticeStrip>
      ) : (
        <div
          className={`ngtw-response-lab grid min-w-0 max-w-full gap-[16px]${!state.touched ? ' is-waiting' : isSuppressed ? ' is-suppressed' : ' is-active'}`}
          style={responseStyle}
        >
          <div className="ngtw-response-lab__scene relative grid grid-cols-[minmax(0,_1fr)] content-center gap-[42px] min-w-0 min-h-[410px] overflow-hidden bg-[#f7f9fc] p-[38px_54px]">
            <div className="ngtw-response-lab__threshold-view gap-[18px]">
              <div className="ngtw-response-lab__instruction flex min-w-0 items-end justify-between gap-[18px]">
                <div>
                  <Typography as="strong" variant="h3" tone="main">改变 z，观察输出如何变化</Typography>
                  <Typography as="p" variant="body" tone="muted">注意零点前后：哪一段保持不变，哪一段开始增长？</Typography>
                </div>
                <div className="ngtw-response-lab__current justify-items-end pr-[14px]">
                  <Typography as="span" variant="body" tone="muted">加权结果</Typography>
                  <Typography as="strong" variant="h3" tone="warning">z = {state.touched ? formatNumber(result.z) : '—'}</Typography>
                </div>
              </div>
              <div className="ngtw-response-lab__neuron-demo grid grid-cols-[minmax(0,_.62fr)_minmax(0,_1.38fr)] min-w-0 items-center gap-[64px] bg-[#fff] p-[34px_54px]">
                <div className="ngtw-response-lab__neuron-state grid place-items-center gap-[18px] text-center">
                  <div className="ngtw-response-lab__charge-ring relative grid w-[210px] max-w-full place-items-center rounded-[50%] bg-[#e6ebf2] p-[13px]" aria-hidden="true">
                    {state.touched && isSuppressed ? <i className="ngtw-response-lab__suppressed-flash absolute inset-[-2px] rounded-[50%]" /> : null}
                    <div className="ngtw-response-lab__neuron-core relative grid w-full h-full place-items-center gap-[5px] rounded-[50%] bg-[var(--ui-text-light)]">
                      <Typography as="span" variant="body" tone="inherit">最终输出</Typography>
                      <Typography as="strong" variant="h3" tone="inherit">y = {state.touched ? formatNumber(result.y) : '—'}</Typography>
                    </div>
                  </div>
                  <Typography as="strong" variant="subtitle" tone={isSuppressed ? 'main' : 'success'}>
                    {!state.touched ? '等待观察' : isSuppressed ? '抑制' : '激活'}
                  </Typography>
                </div>

                <div className="ngtw-response-lab__single-control relative grid min-w-0 gap-[22px] bg-[#f7f9fc] p-[28px_30px_34px]">
                  <div className="ngtw-response-lab__control-head flex min-w-0 items-center justify-between gap-[18px]">
                    <Typography as="strong" variant="subtitle" tone="main">调节加权结果 z</Typography>
                    <Typography as="strong" variant="subtitle" tone="warning">{state.touched ? formatNumber(result.z) : '—'}</Typography>
                  </div>
                  <div className="ngtw-response-lab__control-track relative h-[18px] rounded-[999px]">
                    <div className="ngtw-response-lab__control-threshold absolute top-[-18px] left-[50%] grid place-items-center">
                      <Typography as="span" variant="body" tone="muted">响应起点 z = 0</Typography>
                    </div>
                    <input
                      className="ngtw-response-lab__direct-control absolute inset-[-14px_0] w-full m-0"
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

            <div className={`ngtw-response-lab__result grid grid-cols-[auto_minmax(0,_1fr)] min-w-0 items-center gap-[18px] bg-[#fff] p-[16px_20px]${state.touched ? ' is-visible' : ''}`}>
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
    </ContentBlock>
  );
}





