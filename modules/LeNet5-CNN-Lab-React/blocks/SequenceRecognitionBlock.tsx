import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Button,
  Callout,
  ContentBlock,
  type TelemetryStateEntry,
  type QuestionCheckResult,
  type ShortAnswerReview,
} from '../../shared/react';
import { PersistedShortAnswerQuestion } from '../components/PersistedShortAnswerQuestion';
import diceIcon from '../random.svg';
import { SequenceCanvas } from '../components/SequenceCanvas';
import { SequenceFrameTrack } from '../components/SequenceFrameTrack';
import {
  flushLenetTelemetrySoon,
  usePersistedActivity,
} from '../components/usePersistedActivity';
import { classifierReady } from '../model/fixedKernelMath';
import type { LenetClassifierSession, Matrix } from '../model/lenetTypes';
import {
  SEQUENCE_SCAN_START_DELAY_MS,
  decodeSequenceFrames,
  isSequenceDigits,
  makeSequenceFrame,
  randomSequenceDigits,
  sequenceScanInterval,
  sequenceScanPositions,
  type SequenceFrame,
  type SequenceSample,
} from '../model/sequenceMath';
import {
  buildSequenceSample,
  reviewSequenceStrategy,
} from '../services/lenetServices';

type SequenceScanPhase = 'idle' | 'running' | 'completed';

interface SequenceActivityState {
  version: 1;
  classifierSignature: string;
  digits: string;
  sample: SequenceSample | null;
  ideaSubmitted: boolean;
  regenerated: boolean;
  scanPhase: SequenceScanPhase;
  frames: SequenceFrame[];
  decoded: string;
  completed: boolean;
}

function createInitial(classifierSignature: string): SequenceActivityState {
  return {
    version: 1,
    classifierSignature,
    digits: randomSequenceDigits(),
    sample: null,
    ideaSubmitted: false,
    regenerated: false,
    scanPhase: 'idle',
    frames: [],
    decoded: '',
    completed: false,
  };
}

function isMatrix(value: unknown, rows: number, cols: number): value is Matrix {
  return Array.isArray(value)
    && value.length === rows
    && value.every((row) => Array.isArray(row)
      && row.length === cols
      && row.every((cell) => Number.isFinite(Number(cell))));
}

function normalizeSample(value: unknown): SequenceSample | null {
  if (!value || typeof value !== 'object') return null;
  const sample = value as Partial<SequenceSample>;
  const width = Math.round(Number(sample.width));
  const height = Math.round(Number(sample.height));
  if (
    !isSequenceDigits(sample.digits)
    || !Number.isInteger(width)
    || width < 28
    || !Number.isInteger(height)
    || height < 28
    || !isMatrix(sample.image, height, width)
  ) return null;
  return {
    digits: sample.digits,
    image: sample.image.map((row) => row.map((cell) => Math.max(0, Math.min(1, Number(cell) || 0)))),
    width,
    height,
    boxes: Array.isArray(sample.boxes) ? sample.boxes.filter((box) => (
      Boolean(box)
      && typeof box.digit === 'string'
      && Number.isFinite(Number(box.x))
      && Number.isFinite(Number(box.y))
      && Number.isFinite(Number(box.width))
      && Number.isFinite(Number(box.height))
    )).map((box) => ({
      digit: box.digit,
      x: Number(box.x),
      y: Number(box.y),
      width: Number(box.width),
      height: Number(box.height),
    })) : [],
    spacing: Number(sample.spacing) || 0,
    margin: Number(sample.margin) || 0,
    seed: Number.isFinite(Number(sample.seed)) ? Number(sample.seed) : null,
    sampleSalts: Array.isArray(sample.sampleSalts)
      ? sample.sampleSalts.map(Number).filter(Number.isFinite)
      : [],
    durationMs: Math.max(0, Number(sample.durationMs) || 0),
  };
}

function normalizeFrame(value: unknown): SequenceFrame | null {
  if (!value || typeof value !== 'object') return null;
  const frame = value as Partial<SequenceFrame>;
  if (
    !Number.isInteger(Number(frame.left))
    || !Number.isFinite(Number(frame.ink))
    || typeof frame.digit !== 'string'
    || !Number.isFinite(Number(frame.confidence))
  ) return null;
  return {
    left: Math.max(0, Number(frame.left)),
    ink: Math.max(0, Number(frame.ink)),
    blank: frame.blank === true,
    digit: frame.digit,
    confidence: Math.max(0, Math.min(1, Number(frame.confidence))),
    reject: frame.reject === true,
    prediction: Number.isInteger(Number(frame.prediction)) ? Number(frame.prediction) : undefined,
    ctcSymbol: typeof frame.ctcSymbol === 'string' ? frame.ctcSymbol : '_',
    keep: frame.keep === true,
    ctcBlank: frame.ctcBlank === true,
    ctcRunLength: Number.isInteger(Number(frame.ctcRunLength))
      ? Number(frame.ctcRunLength)
      : undefined,
  };
}

function normalizeActivity(
  value: unknown,
  entry?: TelemetryStateEntry<unknown> | null,
): SequenceActivityState | null {
  if (!value || typeof value !== 'object') return null;
  const stored = value as Partial<SequenceActivityState>;
  if (stored.version !== 1 || !isSequenceDigits(stored.digits)) return null;
  const sample = stored.sample === null || stored.sample === undefined
    ? null
    : normalizeSample(stored.sample);
  if (stored.sample && !sample) return null;
  const frames = Array.isArray(stored.frames)
    ? stored.frames.map(normalizeFrame).filter((frame): frame is SequenceFrame => frame !== null)
    : [];
  const completed = stored.completed === true;
  const storedPhase = stored.scanPhase === 'idle'
    || stored.scanPhase === 'running'
    || stored.scanPhase === 'completed'
    ? stored.scanPhase
    : null;
  const scanPhase: SequenceScanPhase = completed
    ? 'completed'
    : storedPhase ?? (entry?.event_name === 'sequence_scan_started' && sample
      ? 'running'
      : 'idle');
  return {
    version: 1,
    classifierSignature: typeof stored.classifierSignature === 'string'
      ? stored.classifierSignature
      : '',
    digits: stored.digits,
    sample,
    ideaSubmitted: stored.ideaSubmitted === true,
    regenerated: stored.regenerated === true,
    scanPhase,
    frames,
    decoded: typeof stored.decoded === 'string' ? stored.decoded : '',
    completed,
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message.trim()
    ? error.message.trim()
    : '服务暂时不可用，请稍后重试。';
}


export function SequenceRecognitionBlock({
  classifierSession,
  onComplete,
  lessonStepComplete = false,
}: {
  classifierSession: LenetClassifierSession | null;
  onComplete: () => void;
  lessonStepComplete?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const startTimerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const scanActiveRef = useRef(false);
  const scanRunTokenRef = useRef(0);
  const initialAttemptRef = useRef('');
  const completionReportedRef = useRef(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleError, setSampleError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [liveFrames, setLiveFrames] = useState<SequenceFrame[]>([]);
  const [liveDecoded, setLiveDecoded] = useState('');
  const [currentLeft, setCurrentLeft] = useState<number | null>(null);
  const signature = classifierSession?.signature ?? '';
  const activityPersistenceKey = 'activity:lenet-sequence-recognition-v1:' + (signature || 'untrained');
  const questionPersistenceKey = 'lenet-sequence-strategy-v1:' + (signature || 'untrained');
  const ready = Boolean(
    classifierSession
    && classifierReady(classifierSession, classifierSession.selectedKernels),
  );

  const initialFactory = useCallback(() => createInitial(signature), [signature]);
  const {
    state,
    stateRef,
    hydrated,
    setDraft,
    commit,
    persistObservation,
  } = usePersistedActivity<SequenceActivityState>({
    stateKey: activityPersistenceKey,
    createInitial: initialFactory,
    normalizeState: normalizeActivity,
    getElement: () => rootRef.current,
  });

  const clearScanTimers = useCallback(() => {
    scanRunTokenRef.current += 1;
    scanActiveRef.current = false;
    if (startTimerRef.current !== null) window.clearTimeout(startTimerRef.current);
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    startTimerRef.current = null;
    intervalRef.current = null;
    setScanning(false);
    setCurrentLeft(null);
  }, []);

  useEffect(() => clearScanTimers, [clearScanTimers]);

  useEffect(() => {
    if (!hydrated || !state || state.classifierSignature === signature) return;
    clearScanTimers();
    initialAttemptRef.current = '';
    setSampleError('');
    setLiveFrames([]);
    setLiveDecoded('');
    setDraft(createInitial(signature));
  }, [clearScanTimers, hydrated, setDraft, signature, state]);

  useEffect(() => {
    if (!state || scanning) return;
    setLiveFrames(state.frames);
    setLiveDecoded(state.decoded);
  }, [scanning, state]);

  useEffect(() => {
    if (!hydrated || !state?.completed) {
      if (!state?.completed) completionReportedRef.current = false;
      return;
    }
    if (lessonStepComplete || completionReportedRef.current) return;
    completionReportedRef.current = true;
    onComplete();
  }, [hydrated, lessonStepComplete, onComplete, state?.completed]);

  const loadSample = useCallback(async (
    digits: string,
    mode: 'initial' | 'regenerate',
  ) => {
    if (!ready) return;
    if (mode === 'regenerate') {
      clearScanTimers();
      setLiveFrames([]);
      setLiveDecoded('');
      setDraft((current) => ({
        ...current,
        regenerated: false,
        scanPhase: 'idle',
        frames: [],
        decoded: '',
        completed: false,
      }));
    }
    setSampleLoading(true);
    setSampleError('');
    try {
      const sample = await buildSequenceSample({ digits });
      clearScanTimers();
      setLiveFrames([]);
      setLiveDecoded('');
      const update = (current: SequenceActivityState): SequenceActivityState => ({
        ...current,
        classifierSignature: signature,
        digits: sample.digits,
        sample,
        regenerated: mode === 'regenerate' && current.ideaSubmitted,
        scanPhase: 'idle',
        frames: [],
        decoded: '',
        completed: false,
      });
      if (mode === 'regenerate') {
        commit('sequence_regenerated', update, { digits: sample.digits });
      } else {
        persistObservation('sequence_sample_ready', update, {
          digits: sample.digits,
          source: 'service',
        });
      }
    } catch (error) {
      setSampleError(errorMessage(error));
    } finally {
      setSampleLoading(false);
    }
  }, [clearScanTimers, commit, persistObservation, ready, setDraft, signature]);

  useEffect(() => {
    if (
      !hydrated
      || !ready
      || !state
      || state.classifierSignature !== signature
      || state.sample
    ) return;
    const key = `${signature}:${state.digits}`;
    if (initialAttemptRef.current === key) return;
    initialAttemptRef.current = key;
    void loadSample(state.digits, 'initial');
  }, [hydrated, loadSample, ready, signature, state]);

  const scanInProgress = scanning || state?.scanPhase === 'running';
  const visibleFrames = scanning ? liveFrames : state?.frames ?? [];
  const visibleDecoded = scanning ? liveDecoded : state?.decoded ?? '';
  const activeQuestionPersistenceKey = `${questionPersistenceKey}:${state?.sample?.digits ?? state?.digits ?? 'pending'}`;
  const positions = useMemo(
    () => state?.sample ? sequenceScanPositions(state.sample) : [],
    [state?.sample],
  );
  const scanStatus = scanInProgress
    ? `扫描中 ${Math.min(visibleFrames.length, positions.length)} / ${positions.length}`
    : state?.completed
      ? `扫描完成，CTC 合并 ${state.decoded.length} 个符号`
      : state?.ideaSubmitted
        ? state.regenerated
          ? '已换新序列，点击开始序列识别'
          : '思路已提交，点击开始序列识别'
        : '等待想法提交';

  const review = useCallback(async (answers: string[]): Promise<ShortAnswerReview> => {
    const answer = String(answers[0] ?? '').trim();
    const current = stateRef.current;
    if (!answer || !current) throw new Error('请先写下你的识别思路。');
    const feedback = await reviewSequenceStrategy({ answer, digits: current.digits });
    persistObservation(
      'lenet_sequence_strategy_reviewed',
      (activity) => ({ ...activity, ideaSubmitted: true, regenerated: false }),
      { digits: current.digits },
    );
    return feedback;
  }, [persistObservation, stateRef]);

  const handleQuestionCheck = useCallback((result: QuestionCheckResult) => {
    flushLenetTelemetrySoon();
    if (result.empty || result.ok !== true) return;
    // Shared Question invokes onCheck again while restoring its SQLite result.
    // setDraft unlocks the UI without emitting a second user event.
    setDraft((activity) => ({ ...activity, ideaSubmitted: true }));
  }, [setDraft]);

  const runScan = useCallback((source: 'user' | 'restore') => {
    const current = stateRef.current;
    const session = classifierSession;
    if (!current?.sample || !current.ideaSubmitted || !session || !ready || scanActiveRef.current) return;
    clearScanTimers();
    scanActiveRef.current = true;
    const runToken = scanRunTokenRef.current;
    const lefts = sequenceScanPositions(current.sample);
    const workingFrames: SequenceFrame[] = [];
    setLiveFrames([]);
    setLiveDecoded('');
    setCurrentLeft(0);
    setScanning(true);
    completionReportedRef.current = false;
    if (source === 'user') {
      commit('sequence_scan_started', {
        ...current,
        regenerated: false,
        scanPhase: 'running',
        frames: [],
        decoded: '',
        completed: false,
      }, {
        digits: current.digits,
        window_count: lefts.length,
        step_px: 1,
      });
    }

    let index = 0;
    const finish = () => {
      if (!scanActiveRef.current || scanRunTokenRef.current !== runToken) return;
      scanActiveRef.current = false;
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      startTimerRef.current = null;
      const final = decodeSequenceFrames(workingFrames, {
        finalize: true,
        targetLength: current.digits.length,
      });
      setLiveFrames(final.frames);
      setLiveDecoded(final.decoded);
      setCurrentLeft(null);
      setScanning(false);
      completionReportedRef.current = true;
      persistObservation('sequence_scan_completed', (latest) => ({
        ...latest,
        scanPhase: 'completed',
        frames: final.frames,
        decoded: final.decoded,
        completed: true,
      }), {
        digits: current.digits,
        decoded: final.decoded,
        window_count: workingFrames.length,
      });
      if (!lessonStepComplete) onComplete();
    };
    const tick = () => {
      if (!scanActiveRef.current || scanRunTokenRef.current !== runToken) return;
      if (index >= lefts.length) {
        finish();
        return;
      }
      const left = lefts[index];
      workingFrames.push(makeSequenceFrame(session, current.sample as SequenceSample, left));
      index += 1;
      const preview = decodeSequenceFrames(workingFrames, { finalize: false });
      setLiveFrames(preview.frames);
      setLiveDecoded(preview.decoded);
      setCurrentLeft(left);
    };
    const interval = sequenceScanInterval(lefts.length);
    startTimerRef.current = window.setTimeout(() => {
      tick();
      if (index >= lefts.length) finish();
      else intervalRef.current = window.setInterval(tick, interval);
    }, SEQUENCE_SCAN_START_DELAY_MS);
  }, [
    classifierSession,
    clearScanTimers,
    commit,
    lessonStepComplete,
    onComplete,
    persistObservation,
    ready,
    stateRef,
  ]);

  const beginScan = useCallback(() => runScan('user'), [runScan]);

  useEffect(() => {
    if (
      !hydrated
      || !ready
      || !state?.sample
      || state.classifierSignature !== signature
      || state.scanPhase !== 'running'
      || scanActiveRef.current
    ) return;
    runScan('restore');
  }, [hydrated, ready, runScan, signature, state]);

  let prerequisite: ReactNode = null;
  if (!classifierSession) {
    prerequisite = '请先在第一幕训练固定卷积核分类器，再进行序列识别。';
  } else if (!ready) {
    prerequisite = '当前卷积核组合的验证集准确率需要严格超过 90%，才能复用到序列识别。';
  }

  return (
    <div ref={rootRef}>
      <ContentBlock
        className="edu-stage lenet-sequence-stage"
        title="用滑动窗口识别序列数字"
        subtitle="观察连续数字图像，思考如何复用刚刚训练好的单个数字识别器。"
        bodyClassName="lenet-sequence-lab"
      >
      {prerequisite && <Callout tone="orange" label="前置条件" text={prerequisite} />}
      {!hydrated && <Callout tone="blue" text="正在恢复序列识别状态…" />}
      {hydrated && ready && state && (
        <>
          <section className="edu-card lenet-sequence-image-card" aria-label="序列数字图像">
            <div className="lenet-sequence-image-head">
              <span className="edu-label">序列输入</span>
              <div className="lenet-sequence-randomizer">
                <span className="lenet-gt-label">GT</span>
                <strong>{state.digits}</strong>
                <button
                  className="lenet-dice-btn"
                  type="button"
                  disabled={sampleLoading}
                  aria-label="随机选择 5 位数字"
                  title="随机选择 5 位数字"
                  onClick={() => void loadSample(randomSequenceDigits(), 'regenerate')}
                >
                  <img src={diceIcon} width="22" height="22" alt="" />
                </button>
              </div>
            </div>
            {state.sample
              ? <SequenceCanvas sample={state.sample} currentLeft={currentLeft} />
              : <div className="lenet-sequence-canvas-wrap" aria-busy={sampleLoading}>正在生成序列图片…</div>}
          </section>

          {sampleError && (
            <Callout tone="red" label="序列服务不可用">
              {sampleError}{' '}
              <Button
                onClick={() => {
                  initialAttemptRef.current = '';
                  void loadSample(state.digits, 'initial');
                }}
              >
                重试
              </Button>
            </Callout>
          )}

          {state.sample && (
            <div className="lenet-question-host lenet-question-guided">
              <PersistedShortAnswerQuestion
                key={activeQuestionPersistenceKey}
                persistenceKey={activeQuestionPersistenceKey}
                title="如何利用刚刚训练得到的识别器识别这串数字？"
                rows={3}
                submitText="提交想法"
                review={review}
                onCheck={handleQuestionCheck}
              />
            </div>
          )}

          {state.sample && state.ideaSubmitted && (
            <section className="edu-card lenet-scan-card" aria-label="滑动窗口识别过程">
              <div className="lenet-scan-head">
                <span className="edu-label">滑窗帧</span>
                <div className="lenet-scan-controls">
                  <span className="edu-status lenet-sequence-live-status" aria-live="polite">
                    <span>{scanStatus}</span>
                    <strong className={`lenet-sequence-live-result${scanInProgress ? ' is-typing' : ''}`}>
                      {visibleDecoded || (state.completed ? '-' : '')}
                    </strong>
                  </span>
                  <Button
                    variant="primary"
                    hint={!state.completed}
                    loading={scanInProgress}
                    disabled={scanInProgress}
                    onClick={beginScan}
                  >
                    {scanInProgress ? '识别中' : state.completed ? '重新识别' : '开始序列识别'}
                  </Button>
                </div>
              </div>
              <div className="lenet-sequence-scan-body">
                <SequenceFrameTrack
                  frames={visibleFrames}
                  ideaSubmitted={state.ideaSubmitted}
                  scanning={scanInProgress}
                />
              </div>
            </section>
          )}
        </>
      )}
      </ContentBlock>
    </div>
  );
}
