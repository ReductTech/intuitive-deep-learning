import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  Button,
  ContentBlock,
  Feedback,
  LessonStage,
  type QuestionCheckResult,
  type ShortAnswerReview,
} from '../../shared/react';
import { MatrixCanvas } from '../components/MatrixCanvas';
import { PersistedShortAnswerQuestion } from '../components/PersistedShortAnswerQuestion';
import {
  flushLenetTelemetrySoon,
  usePersistedActivity,
} from '../components/usePersistedActivity';
import {
  bestDetectionWindow,
  composeDetectionScene,
  DETECTION_CANVAS_SIZE,
  DETECTION_DIGITS,
  DETECTION_IMAGE_SIZE,
  DETECTION_RANKING_UPDATE_EVERY,
  DETECTION_SCAN_INTERVAL_MS,
  DETECTION_SCAN_STEP,
  DETECTION_TARGET_DIGIT,
  DETECTION_WINDOWS_PER_TICK,
  detectionScanWindows,
  isDetectionCoordinate,
  makeDetectionPositions,
  rankDetectionWindows,
  cropMatrix,
  type DetectionDigit,
  type DetectionWindowScore,
} from '../model/detectionMath';
import { classifierReady, inferImage, isMatrix } from '../model/fixedKernelMath';
import type { LenetClassifierSession, Matrix } from '../model/lenetTypes';
import { buildSequenceSample, reviewDetectionStrategy } from '../services/lenetServices';

interface DetectionScene {
  digits: DetectionDigit[];
  source: 'service' | 'fallback';
}

export interface DetectionActivityState {
  version: 1;
  classifierSignature: string | null;
  scene: DetectionScene | null;
  windows: DetectionWindowScore[];
  best: DetectionWindowScore | null;
  ideaSubmitted: boolean;
  completed: boolean;
}

export interface DetectionSearchBlockProps {
  classifierSession: LenetClassifierSession | null;
  onComplete: () => void;
  onResetDetection?: () => void;
}

function createInitialState(signature: string | null): DetectionActivityState {
  return {
    version: 1,
    classifierSignature: signature,
    scene: null,
    windows: [],
    best: null,
    ideaSubmitted: false,
    completed: false,
  };
}

function normalizeWindow(value: unknown): DetectionWindowScore | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<DetectionWindowScore>;
  const score = Number(candidate.score);
  if (!isDetectionCoordinate(candidate.left) || !isDetectionCoordinate(candidate.top)) return null;
  if (!Number.isFinite(score)) return null;
  return {
    left: Number(candidate.left),
    top: Number(candidate.top),
    score: Math.max(0, Math.min(1, score)),
  };
}

function normalizeScene(value: unknown): DetectionScene | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<DetectionScene>;
  if (!Array.isArray(candidate.digits) || candidate.digits.length !== DETECTION_DIGITS.length) return null;
  const digits: DetectionDigit[] = [];
  for (let index = 0; index < DETECTION_DIGITS.length; index += 1) {
    const raw = candidate.digits[index];
    if (!raw || typeof raw !== 'object') return null;
    const digit = raw as Partial<DetectionDigit>;
    if (Number(digit.digit) !== DETECTION_DIGITS[index]) return null;
    if (!isDetectionCoordinate(digit.left) || !isDetectionCoordinate(digit.top)) return null;
    if (!isMatrix(digit.image, DETECTION_IMAGE_SIZE, DETECTION_IMAGE_SIZE)) return null;
    digits.push({
      digit: Number(digit.digit),
      left: Number(digit.left),
      top: Number(digit.top),
      image: digit.image.map((row) => row.map((cell) => Math.max(0, Math.min(1, Number(cell) || 0)))),
    });
  }
  return {
    digits,
    source: candidate.source === 'fallback' ? 'fallback' : 'service',
  };
}

export function normalizeDetectionActivity(stored: unknown): DetectionActivityState | null {
  if (!stored || typeof stored !== 'object') return null;
  const value = stored as Partial<DetectionActivityState>;
  const scene = normalizeScene(value.scene);
  const windows = Array.isArray(value.windows)
    ? value.windows.map(normalizeWindow).filter((entry): entry is DetectionWindowScore => entry !== null)
    : [];
  const coordinateCount = new Set(windows.map((entry) => `${entry.left}:${entry.top}`)).size;
  const complete = value.completed === true && windows.length === 400 && coordinateCount === 400;
  const completedWindows = complete ? windows : [];
  return {
    version: 1,
    classifierSignature: typeof value.classifierSignature === 'string' ? value.classifierSignature : null,
    scene,
    windows: completedWindows,
    best: complete ? bestDetectionWindow(completedWindows) : null,
    ideaSubmitted: value.ideaSubmitted === true || complete,
    completed: complete,
  };
}

async function loadDetectionDigitImages(signal?: AbortSignal): Promise<Matrix[]> {
  const sample = await buildSequenceSample({ digits: DETECTION_DIGITS.join(''), signal });
  return sample.boxes.map((box) => (
    cropMatrix(sample.image, box.x, box.y, DETECTION_IMAGE_SIZE, DETECTION_IMAGE_SIZE)
  ));
}

function rasterDigit(digit: number): Matrix {
  const canvas = document.createElement('canvas');
  canvas.width = DETECTION_IMAGE_SIZE;
  canvas.height = DETECTION_IMAGE_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return Array.from(
      { length: DETECTION_IMAGE_SIZE },
      () => Array.from({ length: DETECTION_IMAGE_SIZE }, () => 0),
    );
  }
  context.fillStyle = '#000';
  context.fillRect(0, 0, DETECTION_IMAGE_SIZE, DETECTION_IMAGE_SIZE);
  context.fillStyle = '#fff';
  context.font = '900 26px Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(String(digit), DETECTION_IMAGE_SIZE / 2, DETECTION_IMAGE_SIZE / 2 + 1);
  const pixels = context.getImageData(0, 0, DETECTION_IMAGE_SIZE, DETECTION_IMAGE_SIZE).data;
  return Array.from({ length: DETECTION_IMAGE_SIZE }, (_, row) => (
    Array.from({ length: DETECTION_IMAGE_SIZE }, (_, column) => (
      pixels[(row * DETECTION_IMAGE_SIZE + column) * 4] / 255
    ))
  ));
}

function formatPercent(value: number) {
  return Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : '-';
}

function overlayStyle(windowScore: DetectionWindowScore | null): CSSProperties | undefined {
  if (!windowScore) return undefined;
  return {
    left: `${windowScore.left / DETECTION_CANVAS_SIZE * 100}%`,
    top: `${windowScore.top / DETECTION_CANVAS_SIZE * 100}%`,
    width: `${DETECTION_IMAGE_SIZE / DETECTION_CANVAS_SIZE * 100}%`,
    height: `${DETECTION_IMAGE_SIZE / DETECTION_CANVAS_SIZE * 100}%`,
  };
}

export function DetectionSearchBlock({
  classifierSession,
  onComplete,
  onResetDetection,
}: DetectionSearchBlockProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const sceneAbortRef = useRef<AbortController | null>(null);
  const sceneRequestRef = useRef(0);
  const reportedRef = useRef(false);
  const signature = classifierSession?.signature ?? null;
  const activityPersistenceKey = 'lenet5:detection-search:' + (signature ?? 'untrained');
  const questionPersistenceKey = 'lenet5-detection-strategy:' + (signature ?? 'untrained');
  const {
    state,
    stateRef,
    hydrated,
    setDraft,
    commit,
    persistObservation,
  } = usePersistedActivity<DetectionActivityState>({
    stateKey: activityPersistenceKey,
    createInitial: () => createInitialState(signature),
    normalizeState: normalizeDetectionActivity,
    getElement: () => rootRef.current,
  });
  const [sceneLoading, setSceneLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [visibleWindows, setVisibleWindows] = useState<DetectionWindowScore[]>([]);
  const [currentWindow, setCurrentWindow] = useState<DetectionWindowScore | null>(null);
  const [progress, setProgress] = useState(0);

  const sceneMatrix = useMemo(
    () => composeDetectionScene(state?.scene?.digits ?? []),
    [state?.scene],
  );
  const rankedWindows = useMemo(() => rankDetectionWindows(visibleWindows), [visibleWindows]);
  const modelReady = Boolean(
    classifierSession
    && classifierReady(classifierSession, classifierSession.selectedKernels),
  );
  const controlsUnlocked = Boolean(state?.ideaSubmitted || state?.completed);
  const totalWindows = 400;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const generateScene = useCallback(async (reason: 'initial' | 'reset') => {
    clearTimer();
    setScanning(false);
    setVisibleWindows([]);
    setCurrentWindow(null);
    setProgress(0);
    sceneAbortRef.current?.abort();
    const controller = new AbortController();
    sceneAbortRef.current = controller;
    const requestId = ++sceneRequestRef.current;
    setSceneLoading(true);
    const positions = makeDetectionPositions(DETECTION_DIGITS.length);
    if (positions.length !== DETECTION_DIGITS.length) {
      setSceneLoading(false);
      return;
    }

    let images: Matrix[];
    let source: DetectionScene['source'] = 'service';
    try {
      images = await loadDetectionDigitImages(controller.signal);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      source = 'fallback';
      images = DETECTION_DIGITS.map((digit) => rasterDigit(digit));
    }
    if (controller.signal.aborted || sceneRequestRef.current !== requestId) return;
    const scene: DetectionScene = {
      source,
      digits: DETECTION_DIGITS.map((digit, index) => ({
        digit,
        left: positions[index].left,
        top: positions[index].top,
        image: images[index],
      })),
    };
    const update = (current: DetectionActivityState): DetectionActivityState => ({
      ...current,
      classifierSignature: signature,
      scene,
      windows: [],
      best: null,
      completed: false,
    });
    if (reason === 'reset') {
      persistObservation('lenet_detection_scene_reset', update, {
        reason,
        source,
        digits: DETECTION_DIGITS.join(''),
      });
      reportedRef.current = false;
      onResetDetection?.();
    } else {
      persistObservation('lenet_detection_scene_ready', update, {
        reason,
        source,
        digits: DETECTION_DIGITS.join(''),
      });
    }
    setSceneLoading(false);
  }, [clearTimer, onResetDetection, persistObservation, signature]);

  useEffect(() => {
    if (!hydrated || state?.scene) return;
    void generateScene('initial');
  }, [generateScene, hydrated, state?.scene]);

  useEffect(() => {
    if (!hydrated || !state || !signature || state.classifierSignature === signature) return;
    clearTimer();
    setScanning(false);
    setVisibleWindows([]);
    setCurrentWindow(null);
    setProgress(0);
    setDraft((current) => ({
      ...current,
      classifierSignature: signature,
      windows: [],
      best: null,
      ideaSubmitted: false,
      completed: false,
    }));
  }, [clearTimer, hydrated, setDraft, signature, state]);

  const review = useCallback(async (answers: string[]): Promise<ShortAnswerReview> => {
    const feedback = await reviewDetectionStrategy({ answer: answers[0] ?? '' });
    if (feedback.ok) {
      persistObservation(
        'lenet_detection_strategy_reviewed',
        (current) => ({ ...current, ideaSubmitted: true }),
        { target_digit: DETECTION_TARGET_DIGIT },
      );
    }
    return feedback;
  }, [persistObservation]);

  const handleQuestionCheck = useCallback((checked: QuestionCheckResult) => {
    flushLenetTelemetrySoon();
    if (checked.empty || checked.ok !== true) return;
    // Restoring a persisted Question result should unlock the activity without
    // recording the restore as another user action.
    setDraft((current) => ({ ...current, ideaSubmitted: true }));
  }, [setDraft]);

  useEffect(() => {
    if (!state || scanning) return;
    if (state.completed) {
      setVisibleWindows(state.windows);
      setCurrentWindow(state.best);
      setProgress(state.windows.length);
    } else {
      setVisibleWindows([]);
      setCurrentWindow(null);
      setProgress(0);
    }
  }, [scanning, state]);

  useEffect(() => {
    if (!hydrated || !state?.completed || reportedRef.current) return;
    reportedRef.current = true;
    onComplete();
  }, [hydrated, onComplete, state?.completed]);

  useEffect(() => {
    if (!state?.completed) reportedRef.current = false;
  }, [state?.completed]);

  useEffect(() => () => {
    clearTimer();
    sceneRequestRef.current += 1;
    sceneAbortRef.current?.abort();
  }, [clearTimer]);

  function startScan() {
    const snapshot = stateRef.current;
    const session = classifierSession;
    if (scanning || !snapshot?.scene || !snapshot.ideaSubmitted || !session) return;
    if (!classifierReady(session, session.selectedKernels)) return;
    clearTimer();
    const windowsToScan = detectionScanWindows();
    const started = commit(
      'lenet_detection_scan_started',
      {
        ...snapshot,
        classifierSignature: session.signature,
        windows: [],
        best: null,
        completed: false,
      },
      {
        window_count: windowsToScan.length,
        step_px: DETECTION_SCAN_STEP,
        target_digit: DETECTION_TARGET_DIGIT,
      },
    );
    if (!started) return;
    const scores: DetectionWindowScore[] = [];
    let index = 0;
    setScanning(true);
    setVisibleWindows([]);
    setCurrentWindow(null);
    setProgress(0);

    const tick = () => {
      let last: DetectionWindowScore | null = null;
      for (
        let scanned = 0;
        scanned < DETECTION_WINDOWS_PER_TICK && index < windowsToScan.length;
        scanned += 1
      ) {
        const position = windowsToScan[index];
        const image = cropMatrix(
          sceneMatrix,
          position.left,
          position.top,
          DETECTION_IMAGE_SIZE,
          DETECTION_IMAGE_SIZE,
        );
        const prediction = inferImage(image, session.classifier);
        last = {
          ...position,
          score: Number(prediction?.probs[DETECTION_TARGET_DIGIT]) || 0,
        };
        scores.push(last);
        index += 1;
      }
      if (last) setCurrentWindow(last);
      setProgress(index);
      if (index % DETECTION_RANKING_UPDATE_EVERY === 0 || index >= windowsToScan.length) {
        setVisibleWindows([...scores]);
      }
      if (index < windowsToScan.length) return;

      clearTimer();
      const best = bestDetectionWindow(scores);
      setScanning(false);
      setVisibleWindows([...scores]);
      setCurrentWindow(best);
      const next = persistObservation(
        'lenet_detection_scan_completed',
        (current) => ({
          ...current,
          classifierSignature: session.signature,
          windows: scores,
          best,
          completed: true,
        }),
        {
          window_count: scores.length,
          target_digit: DETECTION_TARGET_DIGIT,
          best_left: best?.left,
          best_top: best?.top,
          best_score: best?.score,
        },
      );
      if (next && !reportedRef.current) {
        reportedRef.current = true;
        onComplete();
      }
    };

    tick();
    if (index < windowsToScan.length) {
      timerRef.current = window.setInterval(tick, DETECTION_SCAN_INTERVAL_MS);
    }
  }

  if (!hydrated || !state) {
    return (
      <LessonStage title="寻找老六">
        <ContentBlock>正在恢复目标检测状态…</ContentBlock>
      </LessonStage>
    );
  }

  const highlightedWindow = currentWindow ?? state.best;
  const status = scanning && currentWindow
    ? `正在遍历窗口 x=${currentWindow.left}, y=${currentWindow.top}，P(6)=${formatPercent(currentWindow.score)}。`
    : state.completed
      ? '全部窗口已按 P(6) 从高到低排序，橙色框标出最高概率坐标。'
      : controlsUnlocked
        ? '思路已提交，可以开始检测位置。'
        : '观察图像后，先提交思路，再开始检测位置。';
  const result = state.completed && state.best
    ? `x=${state.best.left}, y=${state.best.top}, P(6)=${formatPercent(state.best.score)}`
    : '-';

  return (
    <LessonStage
      ref={rootRef}
      className="lenet-detection-stage"
      title="寻找老六"
      description="先提交定位策略，再用 28×28 窗口遍历大图并按 P(6) 排序。"
    >
      <div className="edu-content-body lenet-detection-lab">
        <section className="edu-card lenet-detection-canvas-card" aria-label="256 目标检测画布">
          <div className="lenet-detection-head">
            <span className="edu-label">256×256 图像</span>
            <div className="edu-toolbar-actions lenet-detection-actions">
              {controlsUnlocked && (
                <Button disabled={sceneLoading} onClick={() => void generateScene('reset')}>
                  重新生成
                </Button>
              )}
            </div>
          </div>
          <div className="edu-canvas-frame lenet-detection-canvas-wrap">
            <MatrixCanvas
              matrix={sceneMatrix}
              className="lenet-detection-canvas"
              size={DETECTION_CANVAS_SIZE}
              background="#000"
              ariaLabel="包含数字 0、2、4、6、8 的 256×256 目标检测图像"
            />
            <div
              className={`lenet-detection-box ${highlightedWindow ? 'is-visible' : ''}`}
              style={overlayStyle(highlightedWindow)}
              aria-hidden="true"
            />
          </div>
        </section>

        <div className={state.ideaSubmitted ? 'lenet-question-host' : 'lenet-question-host lenet-question-guided'}>
          <PersistedShortAnswerQuestion
            key={questionPersistenceKey}
            className="lenet-detection-question"
            rows={3}
            title="如何利用刚刚的网络在这张图里找到 6？"
            submitText="提交想法"
            persistenceKey={questionPersistenceKey}
            review={review}
            onCheck={handleQuestionCheck}
          />
          {!modelReady && (
            <Feedback
              status="hint"
              message="需要先让第一幕当前卷积核组合的验证集准确率超过 0.9，才能进行滑窗识别。"
            />
          )}
        </div>

        {controlsUnlocked && (
          <section className="edu-card lenet-detection-result-card" aria-label="目标检测概率排序">
            <div className="lenet-detection-ranking-head">
              <span className="edu-label">P(6) 概率排序</span>
              <div className="lenet-detection-ranking-tools">
                <span className="edu-helper">
                  步长 {DETECTION_SCAN_STEP}，已扫 {progress} / {totalWindows} 个窗口
                </span>
                <Button
                  variant="primary"
                  hint={!state.completed}
                  disabled={!modelReady || sceneLoading || scanning}
                  loading={scanning}
                  onClick={startScan}
                >
                  开始检测位置
                </Button>
              </div>
            </div>
            <div className="edu-notice-strip edu-notice-strip--blue lenet-detection-readout lenet-detection-result">
              <span>{status}</span>
              <strong>{result}</strong>
            </div>
            <div className="lenet-detection-table-wrap">
              <table className="lenet-detection-table">
                <thead><tr><th scope="col">坐标</th><th scope="col">P(6)</th></tr></thead>
                <tbody>
                  {!rankedWindows.length && (
                    <tr className="is-empty">
                      <td colSpan={2}>点击“开始检测位置”后显示每个窗口的概率。</td>
                    </tr>
                  )}
                  {rankedWindows.map((windowScore, index) => {
                    const current = currentWindow?.left === windowScore.left
                      && currentWindow?.top === windowScore.top;
                    return (
                      <tr
                        className={`${index === 0 ? 'is-best' : ''} ${current ? 'is-current' : ''}`.trim()}
                        key={`${windowScore.left}:${windowScore.top}`}
                      >
                        <td>x={windowScore.left}, y={windowScore.top}</td>
                        <td>{formatPercent(windowScore.score)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </LessonStage>
  );
}
