import {
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  Callout,
  LessonStage,
  NoticeStrip,
  RangeControl,
  ValueTile,
} from '../../shared/react';
import { usePersistedActivity } from '../components/usePersistedActivity';
import { clamp, formatUnit, unitToByte } from '../model/imageMath';

interface RgbState {
  r: number;
  g: number;
  b: number;
  solved: boolean;
}

interface RgbColorLabBlockProps {
  onComplete?: () => void;
  lessonStepComplete?: boolean;
}

function isPureGreen(state: Pick<RgbState, 'r' | 'g' | 'b'>) {
  return state.r < 0.05 && state.g > 0.95 && state.b < 0.05;
}

function normalizeRgbState(value: unknown): RgbState | null {
  if (typeof value !== 'object' || value === null) return null;
  const source = value as Partial<RgbState>;
  const r = Number(source.r);
  const g = Number(source.g);
  const b = Number(source.b);
  if (![r, g, b].every(Number.isFinite)) return null;
  const normalized = {
    r: clamp(r, 0, 1),
    g: clamp(g, 0, 1),
    b: clamp(b, 0, 1),
    solved: source.solved === true,
  };
  normalized.solved = normalized.solved || isPureGreen(normalized);
  return normalized;
}

export function RgbColorLabBlock({
  onComplete,
  lessonStepComplete = false,
}: RgbColorLabBlockProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const lastCommittedRef = useRef('');
  const activity = usePersistedActivity<RgbState>({
    stateKey: 'activity:digital-image-rgb',
    createInitial: () => ({ r: 1, g: 0, b: 0, solved: false }),
    normalizeState: normalizeRgbState,
    getElement: () => rootRef.current,
  });

  const commitCurrent = useCallback(() => {
    const current = activity.stateRef.current;
    if (!current) return;
    const solved = current.solved || isPureGreen(current);
    const signature = [
      current.r.toFixed(2),
      current.g.toFixed(2),
      current.b.toFixed(2),
      solved ? '1' : '0',
    ].join(':');
    if (signature === lastCommittedRef.current) return;
    lastCommittedRef.current = signature;
    const next = { ...current, solved };
    activity.commit('digital_image_rgb_commit', next, {
      r: next.r,
      g: next.g,
      b: next.b,
      solved,
    });
    if (solved && !lessonStepComplete) onComplete?.();
  }, [activity, lessonStepComplete, onComplete]);

  useEffect(() => {
    if (activity.state?.solved && !lessonStepComplete) onComplete?.();
  }, [activity.state?.solved, lessonStepComplete, onComplete]);

  if (!activity.hydrated || !activity.state) {
    return (
      <LessonStage
        className="di-stage"
        title="每个像素都由红、绿、蓝三种强度表示"
        description="正在恢复 RGB 调色状态。"
        aria-busy="true"
      />
    );
  }

  const state = activity.state;
  const solvedNow = state.solved || isPureGreen(state);
  const red = unitToByte(state.r);
  const green = unitToByte(state.g);
  const blue = unitToByte(state.b);

  const updateChannel = (channel: 'r' | 'g' | 'b', value: string) => {
    activity.setDraft((current) => ({
      ...current,
      [channel]: clamp(Number(value), 0, 1),
    }));
  };
  const commitHandlers = {
    onPointerUp: commitCurrent,
    onKeyUp: commitCurrent,
    onBlur: commitCurrent,
  };

  return (
    <LessonStage
      ref={rootRef}
      className="di-stage"
      title="每个像素都由红、绿、蓝三种强度表示"
      description="三个数字写成 RGB：红色强度 R、绿色强度 G、蓝色强度 B。纯红色是 [1, 0, 0]。"
      data-state-key="activity:digital-image-rgb"
      data-telemetry-manual
    >
      <Callout
        tone="orange"
        label="你的任务"
        text="把像素调成纯绿色 RGB = [0, 1, 0]：R 调到 0，G 调到 1，B 调到 0。"
      />

      <div className="di-color-lab">
        <section className="edu-panel di-color-preview" aria-label="当前 RGB 颜色">
          <div
            className="di-swatch"
            aria-label="当前颜色预览"
            style={{ backgroundColor: `rgb(${red}, ${green}, ${blue})` }}
          />
          <div className="di-vector-grid">
            <ValueTile
              className="di-vector-tile"
              tone="blue"
              label="0–1 强度"
              value={`[${formatUnit(state.r)}, ${formatUnit(state.g)}, ${formatUnit(state.b)}]`}
            />
            <ValueTile
              className="di-vector-tile"
              tone="orange"
              label="8 bit 存储"
              value={`[${red}, ${green}, ${blue}]`}
            />
          </div>
          <p className="edu-helper">
            0–1 表示颜色强度；8 bit 把每个通道存为 0–255，所以
            1 对应 255，0 对应 0。
          </p>
          <NoticeStrip
            tone={solvedNow ? 'green' : 'orange'}
            lead={solvedNow ? '阶段完成：' : '尚未完成：'}
            aria-live="polite"
          >
            {solvedNow
              ? '这就是纯绿 [0, 1, 0]，也就是 [0, 255, 0]。'
              : '请让 RGB 变成 [0, 1, 0]。'}
          </NoticeStrip>
        </section>

        <section className="edu-panel di-slider-panel" aria-label="RGB 调节器">
          <RangeControl
            label="红色强度（R）"
            min={0}
            max={1}
            step={0.01}
            digits={2}
            value={state.r}
            className="di-range--red"
            onChange={(event) => updateChannel('r', event.currentTarget.value)}
            {...commitHandlers}
          />
          <RangeControl
            label="绿色强度（G）"
            min={0}
            max={1}
            step={0.01}
            digits={2}
            value={state.g}
            className="di-range--green"
            onChange={(event) => updateChannel('g', event.currentTarget.value)}
            {...commitHandlers}
          />
          <RangeControl
            label="蓝色强度（B）"
            min={0}
            max={1}
            step={0.01}
            digits={2}
            value={state.b}
            className="di-range--blue"
            onChange={(event) => updateChannel('b', event.currentTarget.value)}
            {...commitHandlers}
          />
        </section>
      </div>
    </LessonStage>
  );
}

