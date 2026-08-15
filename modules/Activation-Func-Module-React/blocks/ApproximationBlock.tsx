import { useRef } from 'react';
import { Button, LessonStage, NoticeStrip } from '../../shared/react';
import { ApproximationPlot } from '../components/ActivationCharts';
import { usePersistedActivity } from '../components/usePersistedActivity';
import {
  APPROXIMATION_INCREMENT,
  MAX_APPROXIMATION_COUNT,
  MIN_APPROXIMATION_COUNT,
  normalizeApproximationCount,
} from '../model/activationMath';

const STATE_KEY = 'activity:activation-relu-approximation';

interface ApproximationSnapshot {
  count: number;
  activationPanelRevealed: boolean;
  completed: boolean;
}

function createInitialSnapshot(): ApproximationSnapshot {
  return {
    count: MIN_APPROXIMATION_COUNT,
    activationPanelRevealed: false,
    completed: false,
  };
}

function normalizeSnapshot(value: unknown): ApproximationSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<ApproximationSnapshot>;
  const rawCount = Number(candidate.count);
  if (!Number.isFinite(rawCount)) return null;
  const booleanFields = [
    candidate.activationPanelRevealed,
    candidate.completed,
  ];
  if (booleanFields.some(
    (entry) => entry !== undefined && typeof entry !== 'boolean',
  )) {
    return null;
  }
  const count = normalizeApproximationCount(rawCount);
  const completed = Boolean(
    candidate.completed || count >= MAX_APPROXIMATION_COUNT,
  );
  return {
    count,
    completed,
    activationPanelRevealed: Boolean(
      candidate.activationPanelRevealed || completed,
    ),
  };
}

export interface ApproximationBlockProps {
  onComplete: () => void;
}

export function ApproximationBlock({ onComplete }: ApproximationBlockProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const {
    state,
    hydrated,
    commit,
  } = usePersistedActivity<ApproximationSnapshot>({
    stateKey: STATE_KEY,
    createInitial: createInitialSnapshot,
    normalizeState: normalizeSnapshot,
    getElement: () => rootRef.current,
  });
  const count = state?.count ?? MIN_APPROXIMATION_COUNT;

  const add = () => {
    if (!state || state.count >= MAX_APPROXIMATION_COUNT) return;
    const nextCount = Math.min(
      MAX_APPROXIMATION_COUNT,
      state.count + APPROXIMATION_INCREMENT,
    );
    const completed = state.completed || nextCount >= MAX_APPROXIMATION_COUNT;
    const next: ApproximationSnapshot = {
      count: nextCount,
      completed,
      activationPanelRevealed: state.activationPanelRevealed || completed,
    };
    commit('activation_relu_approximation_add', next, {
      breakpoint_count: nextCount,
      completed,
    });
    if (!state.completed && completed) onComplete();
  };

  const reset = () => {
    if (!state || state.count === MIN_APPROXIMATION_COUNT) return;
    const next: ApproximationSnapshot = {
      ...state,
      count: MIN_APPROXIMATION_COUNT,
    };
    commit('activation_relu_approximation_reset', next, {
      breakpoint_count: MIN_APPROXIMATION_COUNT,
      completed: next.completed,
    });
  };

  return (
    <LessonStage
      ref={rootRef}
      className="af-react-approximation"
      title="足够多带有 ReLU 的神经元，就能逼近任意曲线"
      description="灰色虚线是一个目标函数（绝非直线）。橙色实线是隐藏层神经元经过 ReLU 后形成的网络输出。增加神经元数量，观察折点如何叠加，让橙色曲线逐渐靠近目标。"
      actions={(
        <div className="af-react-actions">
          <Button
            variant="primary"
            disabled={!hydrated || !state || count >= MAX_APPROXIMATION_COUNT}
            onClick={add}
          >
            增加神经元数量
          </Button>
          <Button
            disabled={!hydrated || !state || count <= MIN_APPROXIMATION_COUNT}
            onClick={reset}
          >
            重置
          </Button>
        </div>
      )}
      variant="flat"
      data-telemetry-manual
      aria-busy={!hydrated}
    >
      {!state ? (
        <NoticeStrip tone="blue">
          正在恢复逼近实验…
        </NoticeStrip>
      ) : (
        <>
          <div className="af-react-wide-panel">
            <ApproximationPlot count={count} />
          </div>
          <NoticeStrip className="af-react-readout">
            {count < MAX_APPROXIMATION_COUNT
              ? `当前使用 ${count} 个折点。继续增加，橙色曲线会更贴近灰色目标。`
              : '已经使用 12 个折点。橙色曲线已经明显贴近目标函数，可以进入最后一幕。'}
          </NoticeStrip>
        </>
      )}
    </LessonStage>
  );
}
