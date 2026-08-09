import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  Button,
  Callout,
  ContentBlock,
  NoticeStrip,
} from '../../shared/react';
import { MatrixCanvas } from '../components/MatrixCanvas';
import {
  restorePersistedClassifier,
  serializeFixedKernelActivityState,
} from '../components/compactClassifierState';
import { usePersistedActivity } from '../components/usePersistedActivity';
import {
  DEFAULT_REJECT_LABEL,
  FIXED_KERNELS,
  classLabel,
  classifierReady,
  emptyImage,
  featureMapsForImage,
  flattenFeatureMaps,
  imageHasInk,
  inferImage,
  isFixedKernelId,
  kernelById,
  kernelSignature,
  normalizeImage,
  normalizeKernelIds,
  sessionMatchesSelection,
} from '../model/fixedKernelMath';
import type {
  FixedKernelActivityState,
  FixedKernelId,
  FixedKernelResult,
  FixedKernelSample,
  LenetClassifierSession,
  Matrix,
} from '../model/lenetTypes';
import { previewFixedKernel, trainFixedKernel } from '../services/lenetServices';

const ACTIVITY_STATE_KEY = 'activity:lenet5-fixed-kernel-classifier';
const PICKER_ROW_HEIGHT = 28;
const FEATURE_DRAG_STEP = 52;
const FEATURE_DRAG_THRESHOLD = 4;
const FEATURE_SWITCH_DURATION_MS = 220;

type FeatureSelectionSource = 'card' | 'picker' | 'wheel' | 'drag' | 'keyboard';

interface FeatureDeckDrag {
  surface: 'deck' | 'picker';
  pointerId: number;
  startY: number;
  startIndex: number;
  moved: boolean;
  pressedIndex: number | null;
}

export interface FixedKernelClassifierBlockProps {
  onComplete: () => void;
  onSessionChange: (session: LenetClassifierSession | null) => void;
  lessonStepComplete?: boolean;
  /** Allows the owning LessonFlow to invalidate later steps after a kernel change. */
  onResetLesson?: () => void;
  moduleId?: string;
  stateKey?: string;
}

function createInitialState(): FixedKernelActivityState {
  return {
    version: 1,
    selectedKernels: ['edge'],
    activeKernel: 'edge',
    previewSampleIndex: 9000,
    sampleIndex: 0,
    handwritingMode: false,
    customImage: emptyImage(),
    userHasWritten: false,
    classifierSession: null,
  };
}

function normalizeSession(value: unknown): LenetClassifierSession | null {
  if (!value || typeof value !== 'object') return null;
  const session = value as Partial<LenetClassifierSession>;
  const classifier = restorePersistedClassifier(session.classifier);
  if (!classifier) return null;
  const selectedKernels = normalizeKernelIds(session.selectedKernels);
  const signature = kernelSignature(selectedKernels);
  if (session.signature !== signature || kernelSignature(classifier.kernels) !== signature) return null;
  const trainAccuracy = Number(session.trainAccuracy);
  const valAccuracy = Number(session.valAccuracy);
  if (!Number.isFinite(trainAccuracy) || !Number.isFinite(valAccuracy)) return null;
  return {
    signature,
    selectedKernels,
    classifier,
    trainAccuracy,
    valAccuracy,
    trainedAt: Number.isFinite(Number(session.trainedAt)) ? Number(session.trainedAt) : 0,
  };
}

function normalizeState(stored: unknown): FixedKernelActivityState | null {
  if (!stored || typeof stored !== 'object') return null;
  const value = stored as Partial<FixedKernelActivityState>;
  const selectedKernels = normalizeKernelIds(value.selectedKernels);
  const activeKernel = isFixedKernelId(value.activeKernel) && selectedKernels.includes(value.activeKernel)
    ? value.activeKernel
    : selectedKernels[0];
  const customImage = normalizeImage(value.customImage);
  const classifierSession = normalizeSession(value.classifierSession);
  return {
    version: 1,
    selectedKernels,
    activeKernel,
    previewSampleIndex: Math.max(0, Math.round(Number(value.previewSampleIndex) || 9000)),
    sampleIndex: Math.max(0, Math.round(Number(value.sampleIndex) || 0)),
    handwritingMode: value.handwritingMode === true,
    customImage,
    userHasWritten: value.userHasWritten === true && imageHasInk(customImage),
    classifierSession: sessionMatchesSelection(classifierSession, selectedKernels) ? classifierSession : null,
  };
}

function formatPercent(value: number | null | undefined) {
  return Number.isFinite(Number(value)) ? `${(Number(value) * 100).toFixed(1)}%` : '-';
}

function sampleWithLocalInference(
  sample: FixedKernelSample,
  session: LenetClassifierSession | null,
) {
  if (!session || !sessionMatchesSelection(session, session.selectedKernels)) {
    return { ...sample, prediction: -1, probs: null };
  }
  const inference = inferImage(sample.image, session.classifier);
  if (!inference) return sample;
  return {
    ...sample,
    prediction: inference.prediction,
    probs: inference.probs,
  };
}

function customSample(state: FixedKernelActivityState): FixedKernelSample {
  const normalizedMaps = featureMapsForImage(state.customImage, state.selectedKernels);
  const inference = state.classifierSession
    && sessionMatchesSelection(state.classifierSession, state.selectedKernels)
    ? inferImage(state.customImage, state.classifierSession.classifier)
    : null;
  return {
    index: -1,
    label: -1,
    prediction: inference?.prediction ?? -1,
    probs: inference?.probs ?? null,
    image: state.customImage,
    feature_maps: normalizedMaps,
    feature_map: normalizedMaps[state.selectedKernels[0]] ?? [],
    feature_max: 1,
  };
}

function wrappedDeckOffset(index: number, activeIndex: number, count: number) {
  let offset = index - activeIndex;
  if (count > 2 && offset > count / 2) offset -= count;
  if (count > 2 && offset < -count / 2) offset += count;
  return offset;
}

function FeatureDeck({
  ids,
  maps,
  activeId,
  onSelect,
  onKernelPreview,
  onKernelPreviewEnd,
}: {
  ids: FixedKernelId[];
  maps: Partial<Record<FixedKernelId, Matrix>>;
  activeId: FixedKernelId;
  onSelect: (id: FixedKernelId, source: FeatureSelectionSource) => void;
  onKernelPreview: (id: FixedKernelId, event: ReactMouseEvent<HTMLElement>) => void;
  onKernelPreviewEnd: () => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<FeatureDeckDrag | null>(null);
  const suppressClickRef = useRef(false);
  const suppressClickTimerRef = useRef<number | null>(null);
  const switchTimerRef = useRef<number | null>(null);
  const selectIndexRef = useRef<(index: number, source: FeatureSelectionSource) => void>(() => undefined);
  const [browsing, setBrowsing] = useState(false);
  const [draggingSurface, setDraggingSurface] = useState<'deck' | 'picker' | null>(null);
  const activeIndex = Math.max(0, ids.indexOf(activeId));
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  const activeKernel = ids[activeIndex] ?? ids[0] ?? 'edge';

  function animateSwitch() {
    const deck = deckRef.current;
    if (!deck) return;
    deck.classList.remove('is-switching');
    void deck.offsetWidth;
    deck.classList.add('is-switching');
    if (switchTimerRef.current !== null) window.clearTimeout(switchTimerRef.current);
    switchTimerRef.current = window.setTimeout(() => {
      deck.classList.remove('is-switching');
      switchTimerRef.current = null;
    }, FEATURE_SWITCH_DURATION_MS);
  }

  selectIndexRef.current = (index, source) => {
    if (!ids.length) return;
    const nextIndex = Math.max(0, Math.min(ids.length - 1, index));
    const nextId = ids[nextIndex];
    if (!nextId || nextIndex === activeIndexRef.current) return;
    activeIndexRef.current = nextIndex;
    animateSwitch();
    onSelect(nextId, source);
  };

  useEffect(() => {
    const picker = pickerRef.current;
    const viewer = viewerRef.current;

    function handleWheel(event: WheelEvent) {
      if (ids.length <= 1 || event.deltaY === 0) return;
      event.preventDefault();
      setBrowsing(true);
      selectIndexRef.current(activeIndexRef.current + (event.deltaY > 0 ? 1 : -1), 'wheel');
    }

    picker?.addEventListener('wheel', handleWheel, { passive: false });
    viewer?.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      picker?.removeEventListener('wheel', handleWheel);
      viewer?.removeEventListener('wheel', handleWheel);
    };
  }, [activeIndex, ids.length]);

  useEffect(() => () => {
    if (suppressClickTimerRef.current !== null) window.clearTimeout(suppressClickTimerRef.current);
    if (switchTimerRef.current !== null) window.clearTimeout(switchTimerRef.current);
  }, []);

  function beginDrag(
    surface: FeatureDeckDrag['surface'],
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (ids.length <= 1 || !event.isPrimary || event.button !== 0) return;
    const pressedItem = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-feature-index]')
      : null;
    const pressedIndex = Number(pressedItem?.dataset.featureIndex);
    dragRef.current = {
      surface,
      pointerId: event.pointerId,
      startY: event.clientY,
      startIndex: activeIndexRef.current,
      moved: false,
      pressedIndex: Number.isInteger(pressedIndex) ? pressedIndex : null,
    };
    suppressClickRef.current = false;
    setDraggingSurface(surface);
    setBrowsing(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function moveDrag(
    surface: FeatureDeckDrag['surface'],
    step: number,
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    const drag = dragRef.current;
    if (!drag || drag.surface !== surface || drag.pointerId !== event.pointerId) return;
    const delta = event.clientY - drag.startY;
    if (Math.abs(delta) > FEATURE_DRAG_THRESHOLD) {
      drag.moved = true;
      suppressClickRef.current = true;
    }
    selectIndexRef.current(drag.startIndex - Math.round(delta / step), 'drag');
    event.preventDefault();
  }

  function finishDrag(event: ReactPointerEvent<HTMLDivElement>, cancelled = false) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const moved = drag.moved;
    dragRef.current = null;
    setDraggingSurface(null);
    setBrowsing(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
    if (suppressClickTimerRef.current !== null) window.clearTimeout(suppressClickTimerRef.current);
    if (cancelled) {
      suppressClickRef.current = false;
      return;
    }
    if (!moved) {
      suppressClickRef.current = false;
      if (drag.pressedIndex !== null) {
        selectIndexRef.current(drag.pressedIndex, drag.surface === 'deck' ? 'card' : 'picker');
      }
      return;
    }
    suppressClickTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = false;
      suppressClickTimerRef.current = null;
    }, 0);
  }

  function handlePickerKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (ids.length <= 1) return;
    const currentIndex = activeIndexRef.current;
    let nextIndex = currentIndex;
    if (event.key === 'ArrowDown') nextIndex = currentIndex + 1;
    if (event.key === 'ArrowUp') nextIndex = currentIndex - 1;
    if (event.key === 'PageDown') nextIndex = currentIndex + 2;
    if (event.key === 'PageUp') nextIndex = currentIndex - 2;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = ids.length - 1;
    if (nextIndex === currentIndex) return;
    event.preventDefault();
    selectIndexRef.current(nextIndex, 'keyboard');
  }

  return (
    <div
      ref={rootRef}
      className={'lenet-pipe-node lenet-feature-block ' + (browsing ? 'is-browsing' : '')}
      onPointerEnter={() => setBrowsing(true)}
      onPointerLeave={() => { if (!dragRef.current) setBrowsing(false); }}
    >

      <div className="lenet-kernel-feature-composer">
        <div
          ref={pickerRef}
          className={'lenet-active-kernels ' + (draggingSurface === 'picker' ? 'is-dragging' : '')}
          role="slider"
          tabIndex={0}
          aria-label="选择要观察的固定卷积核特征图"
          aria-orientation="vertical"
          aria-valuemin={1}
          aria-valuemax={Math.max(1, ids.length)}
          aria-valuenow={activeIndex + 1}
          aria-valuetext={kernelById(activeKernel).name}
          onKeyDown={handlePickerKey}
          onPointerDown={(event) => beginDrag('picker', event)}
          onPointerMove={(event) => moveDrag('picker', PICKER_ROW_HEIGHT, event)}
          onPointerUp={(event) => finishDrag(event)}
          onPointerCancel={(event) => finishDrag(event, true)}
        >
          {ids.map((id, index) => {
            const offset = index - activeIndex;
            const distance = Math.abs(offset);
            const pickerStyle = {
              '--picker-y': String(offset * PICKER_ROW_HEIGHT) + 'px',
              '--picker-scale': String(Math.max(0.9, 1 - Math.min(distance, 3) * 0.035)),
              '--picker-opacity': String(distance === 0 ? 1 : distance === 1 ? 0.46 : distance === 2 ? 0.2 : 0),
            } as CSSProperties;
            return (
              <button
                type="button"
                data-feature-index={index}
                key={id}
                className={'lenet-active-kernel '
                  + (distance === 0 ? 'is-active ' : '')
                  + (distance === 1 ? 'is-near ' : '')
                  + (distance > 2 ? 'is-far' : '')}
                style={pickerStyle}
                aria-current={distance === 0 ? 'true' : undefined}
                aria-label={kernelById(id).name + '，第 ' + (index + 1) + ' 张，共 ' + ids.length + ' 张'}
                tabIndex={distance === 0 ? 0 : -1}
                onClick={() => {
                  if (!suppressClickRef.current) selectIndexRef.current(index, 'picker');
                }}
                onMouseEnter={(event) => onKernelPreview(id, event)}
                onMouseMove={(event) => onKernelPreview(id, event)}
                onMouseLeave={onKernelPreviewEnd}
              >
                {kernelById(id).name}
              </button>
            );
          })}
        </div>

        <div ref={viewerRef} className="edu-canvas-frame lenet-feature-viewer">
          <div
            ref={deckRef}
            className={'lenet-feature-deck ' + (draggingSurface === 'deck' ? 'is-dragging' : '')}
            aria-label="特征图相片滑动浏览"
              onPointerDown={(event) => beginDrag('deck', event)}
            onPointerMove={(event) => moveDrag('deck', FEATURE_DRAG_STEP, event)}
            onPointerUp={(event) => finishDrag(event)}
            onPointerCancel={(event) => finishDrag(event, true)}
          >
            {ids.map((id, index) => {
              const offset = wrappedDeckOffset(index, activeIndex, ids.length);
              const distance = Math.abs(offset);
              const hidden = distance > 1;
              return (
                <div
                  className={'lenet-feature-card '
                    + (distance === 0 ? 'is-active ' : '')
                    + (distance === 1 ? 'is-near ' : '')
                    + (hidden ? 'is-hidden' : '')}
                  data-feature-id={id}
                  data-feature-index={index}
                  key={id}
                  role="button"
                  tabIndex={hidden ? -1 : 0}
                  aria-hidden={hidden}
                  aria-current={distance === 0 ? 'true' : undefined}
                  aria-label={kernelById(id).name + '池化后特征图'}
                  style={{ '--offset': String(Math.max(-1, Math.min(1, offset))) } as CSSProperties}
                  onClick={() => {
                    if (!suppressClickRef.current) selectIndexRef.current(index, 'card');
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    if (!suppressClickRef.current) selectIndexRef.current(index, 'keyboard');
                  }}
                >
                  <MatrixCanvas
                    matrix={maps[id] ?? []}
                    heatmap
                    background="#f8fafd"

                    ariaLabel={kernelById(id).name + '池化后 8×8 特征图'}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="lenet-feature-scrub" aria-hidden="true">
        {ids.map((id) => (
          <span className={id === activeKernel ? 'is-active' : ''} key={id}>
            {kernelById(id).name}
          </span>
        ))}
      </div>
    </div>
  );
}
function ClassifierCanvas({
  probabilities,
  prediction,
  rejectLabel,
  training,
  hasClassifier,
}: {
  probabilities: number[];
  prediction: number;
  rejectLabel: number;
  training: boolean;
  hasClassifier: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pulse, setPulse] = useState<number[]>([]);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => setRevision((value) => value + 1));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!training) {
      if (!hasClassifier) setPulse([]);
      return;
    }
    const randomize = () => setPulse(Array.from({ length: 7 }, () => 0.18 + Math.random() * 0.82));
    randomize();
    const timer = window.setInterval(randomize, 180);
    return () => window.clearInterval(timer);
  }, [hasClassifier, training]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width || 260);
    const height = Math.max(1, rect.height || width || 260);
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const context = canvas.getContext('2d');
    if (!context) return;
    const drawingContext: CanvasRenderingContext2D = context;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#fbfdff';
    context.fillRect(0, 0, width, height);

    const outputCount = Math.max(1, probabilities.length);
    const inputCount = 5;
    const hiddenCount = 7;
    const xInput = width * 0.16;
    const xHidden = width * 0.52;
    const xOutput = width * 0.86;
    const top = height * 0.12;
    const bottom = height * 0.88;
    const yAt = (index: number, count: number) => (
      count <= 1 ? height / 2 : top + (bottom - top) * index / (count - 1)
    );

    for (let input = 0; input < inputCount; input += 1) {
      for (let hidden = 0; hidden < hiddenCount; hidden += 1) {
        context.strokeStyle = 'rgba(39,68,110,0.14)';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(xInput + 7, yAt(input, inputCount));
        context.lineTo(xHidden - 7, yAt(hidden, hiddenCount));
        context.stroke();
      }
    }

    for (let hidden = 0; hidden < hiddenCount; hidden += 1) {
      for (let output = 0; output < outputCount; output += 1) {
        const alpha = 0.07 + (Number(probabilities[output]) || 0) * 0.35;
        context.strokeStyle = 'rgba(31,138,104,' + alpha.toFixed(3) + ')';
        context.lineWidth = output === prediction ? 1.7 : 1;
        context.beginPath();
        context.moveTo(xHidden + 7, yAt(hidden, hiddenCount));
        context.lineTo(xOutput - 7, yAt(output, outputCount));
        context.stroke();
      }
    }

    function node(x: number, y: number, radius: number, fill: string, stroke?: string, label?: string) {
      drawingContext.beginPath();
      drawingContext.arc(x, y, radius, 0, Math.PI * 2);
      drawingContext.fillStyle = fill;
      drawingContext.fill();
      drawingContext.lineWidth = 1.2;
      drawingContext.strokeStyle = stroke ?? 'rgba(39,68,110,0.22)';
      drawingContext.stroke();
      if (label === undefined) return;
      drawingContext.fillStyle = '#1f2f49';
      drawingContext.font = '800 10px system-ui, sans-serif';
      drawingContext.textAlign = 'center';
      drawingContext.textBaseline = 'middle';
      drawingContext.fillText(label, x, y);
    }

    for (let input = 0; input < inputCount; input += 1) {
      node(xInput, yAt(input, inputCount), 6.5, 'rgba(39,68,110,0.18)');
    }
    for (let hidden = 0; hidden < hiddenCount; hidden += 1) {
      const value = pulse[hidden] ?? 0;
      const pulsing = training || pulse.length > hidden;
      node(
        xHidden,
        yAt(hidden, hiddenCount),
        7,
        pulsing
          ? 'rgba(240,126,71,' + (0.18 + value * 0.58).toFixed(3) + ')'
          : 'rgba(224,122,63,0.18)',
        pulsing
          ? 'rgba(240,126,71,' + (0.30 + value * 0.55).toFixed(3) + ')'
          : undefined,
      );
    }
    for (let output = 0; output < outputCount; output += 1) {
      const topPrediction = output === prediction;
      node(
        xOutput,
        yAt(output, outputCount),
        topPrediction ? 8.5 : 6.5,
        topPrediction ? 'rgba(224,122,63,0.86)' : 'rgba(39,68,110,0.12)',
        topPrediction ? 'rgba(224,122,63,0.95)' : 'rgba(39,68,110,0.18)',
        classLabel(output, rejectLabel),
      );
    }
  }, [prediction, probabilities, pulse, rejectLabel, revision, training]);

  return (
    <canvas
      ref={canvasRef}
      id="classifierCanvas"
      width={260}
      height={260}
      aria-label="分类头连接示意图；输出节点依次为数字 0 到 9 与拒识类"
    />
  );
}
export function FixedKernelClassifierBlock({
  onComplete,
  onSessionChange,
  lessonStepComplete = false,
  onResetLesson,
  moduleId,
  stateKey = ACTIVITY_STATE_KEY,
}: FixedKernelClassifierBlockProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const previewAbortRef = useRef<AbortController | null>(null);
  const trainAbortRef = useRef<AbortController | null>(null);
  const completionReportedRef = useRef(false);
  const [preview, setPreview] = useState<FixedKernelResult | null>(null);
  const [trainingResult, setTrainingResult] = useState<FixedKernelResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [training, setTraining] = useState(false);
  const [trainingRevealed, setTrainingRevealed] = useState(false);
  const [carouselSampleIndex, setCarouselSampleIndex] = useState(0);
  const [kernelPopover, setKernelPopover] = useState<{
    id: FixedKernelId;
    left: number;
    top: number;
  } | null>(null);
  const [, setMessage] = useState('先观察默认边缘核的 8×8 特征图，再添加更多固定核训练分类头。');
  const [error, setError] = useState('');
  const [statusHint, setStatusHint] = useState<'waiting' | 'refreshing' | 'empty' | null>(null);
  const [trainAccuracyStale, setTrainAccuracyStale] = useState(false);
  const [automaticTraining, setAutomaticTraining] = useState(false);
  const restoredStateKeyRef = useRef<string | null>(null);
  const {
    state,
    stateRef,
    hydrated,

    setDraft,
    commit,
    persistObservation,
  } = usePersistedActivity<FixedKernelActivityState>({
    stateKey,
    moduleId,
    createInitial: createInitialState,
    normalizeState,
    serializeState: serializeFixedKernelActivityState,
    getElement: () => rootRef.current,
  });

  const signature = state ? kernelSignature(state.selectedKernels) : '';
  const customImageFingerprint = state?.handwritingMode
    ? state.customImage.map((row) => row.map((value) => Math.round(value * 100)).join(',')).join(';')
    : '';

  useEffect(() => () => {
    previewAbortRef.current?.abort();
    trainAbortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!hydrated || !state) return;
    const controller = new AbortController();
    previewAbortRef.current?.abort();
    previewAbortRef.current = controller;
    setPreviewLoading(true);
    setError('');
    void previewFixedKernel({
      kernels: state.selectedKernels,
      sampleIndex: state.previewSampleIndex,
      image: state.handwritingMode ? state.customImage : undefined,
      signal: controller.signal,
    }).then((result) => {
      if (controller.signal.aborted) return;
      setPreview(result);
      setStatusHint(null);
      const returnedIndex = result.samples[0]?.index;
      if (!state.handwritingMode && Number.isFinite(returnedIndex) && returnedIndex !== state.previewSampleIndex) {
        setDraft((current) => ({ ...current, previewSampleIndex: returnedIndex }));
      }
    }).catch((reason) => {
      if (controller.signal.aborted) return;
      setError(reason instanceof Error ? reason.message : '特征预览暂时不可用。');
    }).finally(() => {
      if (!controller.signal.aborted) setPreviewLoading(false);
    });
    return () => controller.abort();
  }, [customImageFingerprint, hydrated, setDraft, signature, state?.handwritingMode]);

  const currentSession = state?.classifierSession
    && sessionMatchesSelection(state.classifierSession, state.selectedKernels)
    ? state.classifierSession
    : null;
  const ready = Boolean(state && classifierReady(currentSession, state.selectedKernels));
  const completed = Boolean(state && ready && state.userHasWritten && imageHasInk(state.customImage));

  useEffect(() => {
    if (!hydrated || !state || restoredStateKeyRef.current === stateKey) return;
    restoredStateKeyRef.current = stateKey;
    setTrainAccuracyStale(state.handwritingMode);
    setStatusHint(state.handwritingMode && !state.userHasWritten ? 'empty' : null);
  }, [hydrated, state, stateKey]);

  useEffect(() => {
    if (currentSession) setTrainingRevealed(true);
  }, [currentSession]);

  useEffect(() => {
    const pageRoot = rootRef.current?.closest('.lenet-root');
    if (!(pageRoot instanceof HTMLElement)) return undefined;
    pageRoot.classList.toggle('has-training-revealed', trainingRevealed || Boolean(currentSession));
    pageRoot.classList.toggle('has-validation-passed', ready);
    pageRoot.classList.toggle('has-handwriting-started', state?.handwritingMode === true);
    return () => {
      pageRoot.classList.remove('has-training-revealed', 'has-validation-passed', 'has-handwriting-started');
    };
  }, [currentSession, ready, state?.handwritingMode, trainingRevealed]);

  useEffect(() => {
    if (!hydrated) return;
    onSessionChange(currentSession);
  }, [currentSession, hydrated, onSessionChange]);

  useEffect(() => {
    if (!hydrated || !completed) {
      completionReportedRef.current = false;
      return;
    }
    if (lessonStepComplete || completionReportedRef.current) return;
    completionReportedRef.current = true;
    onComplete();
  }, [completed, hydrated, lessonStepComplete, onComplete]);

  const source = trainingResult ?? preview;

  useEffect(() => {
    setCarouselSampleIndex(0);
  }, [source]);

  useEffect(() => {
    const sampleCount = source?.samples.length ?? 0;
    if (!currentSession || training || state?.handwritingMode || sampleCount < 2) return undefined;
    const timer = window.setInterval(() => {
      setCarouselSampleIndex((index) => (index + 1) % sampleCount);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [currentSession, source, state?.handwritingMode, training]);
  const displaySample = useMemo(() => {
    if (!state) return null;
    if (state.handwritingMode) return customSample(state);
    const samples = source?.samples ?? [];
    if (!samples.length) return null;
    const sample = samples[carouselSampleIndex % samples.length] ?? samples[0];
    return sampleWithLocalInference(sample, currentSession);
  }, [carouselSampleIndex, currentSession, source, state]);
  const displayMaps = displaySample?.feature_maps ?? {};

  const flattened = state ? flattenFeatureMaps(displayMaps, state.selectedKernels) : [];
  const classCount = currentSession?.classifier.class_count ?? DEFAULT_REJECT_LABEL + 1;
  const rejectLabel = currentSession?.classifier.reject_label ?? DEFAULT_REJECT_LABEL;
  const probabilities = displaySample?.probs ?? Array.from({ length: classCount }, () => 0);
  const hintedStatus = statusHint === 'waiting'
    ? '等待重新训练'
    : statusHint === 'refreshing'
      ? '刷新特征图'
      : statusHint === 'empty'
        ? '空白输入'
        : null;
  const status = training
    ? automaticTraining ? '自动训练分类头' : '后端训练中'
    : error
      ? '服务不可用'
      : hintedStatus
        ?? (state?.handwritingMode && trainAccuracyStale
          ? '特征图已就绪'
          : currentSession
            ? ready ? '训练完成' : 'Val未达标'
            : previewLoading ? '加载特征图' : preview ? '特征图已就绪' : '等待开始');

  function invalidateForKernelSelection(
    nextKernels: FixedKernelId[],
    activeKernel: FixedKernelId,
    eventName = 'lenet_fixed_kernel_selection_changed',
    readout = '卷积核组合已改变。重新训练后，分类头才会匹配新的展平特征。',
  ) {
    const current = stateRef.current;
    if (!current) return;
    const invalidatesProgress = Boolean(current.classifierSession || current.userHasWritten);
    setTrainingResult(null);
    setError('');
    setStatusHint('waiting');
    setTrainAccuracyStale(true);
    setMessage(readout);
    commit(eventName, {
      ...current,
      selectedKernels: nextKernels,
      activeKernel,
      sampleIndex: 0,
      handwritingMode: false,
      customImage: emptyImage(),
      userHasWritten: false,
      classifierSession: null,
    }, {
      kernels: nextKernels,
      classifier_invalidated: invalidatesProgress,
    });
    if (invalidatesProgress) onResetLesson?.();
  }

  function toggleKernel(id: FixedKernelId) {
    if (training) return;
    const current = stateRef.current;
    if (!current) return;
    const selected = current.selectedKernels.includes(id);
    if (selected && current.selectedKernels.length === 1) {
      setMessage('扫描器至少需要保留一个固定卷积核。');
      return;
    }
    const nextKernels = selected
      ? current.selectedKernels.filter((kernelId) => kernelId !== id)
      : [...current.selectedKernels, id];
    invalidateForKernelSelection(nextKernels, selected ? nextKernels[0] : id);
  }

  function resetKernels() {
    if (training) return;
    invalidateForKernelSelection(
      ['edge'],
      'edge',
      'lenet_fixed_kernel_selection_reset',
      '已回到默认边缘卷积核。',
    );
  }

  function selectFeatureKernel(id: FixedKernelId, source: FeatureSelectionSource) {
    const current = stateRef.current;
    if (!current || current.activeKernel === id || !current.selectedKernels.includes(id)) return;
    commit('lenet_feature_kernel_selected', {
      ...current,
      activeKernel: id,
    }, { kernel: id, source });
  }

  function showKernelPopover(id: FixedKernelId, event: ReactMouseEvent<HTMLElement>) {
    setKernelPopover({
      id,
      left: Math.max(10, Math.min(window.innerWidth - 188, event.clientX + 14)),
      top: Math.max(10, Math.min(window.innerHeight - 188, event.clientY + 14)),
    });
  }

  async function trainClassifier(imageOverride?: Matrix, automatic = false) {
    const snapshot = stateRef.current;
    if (!snapshot || training) return;
    setTrainingRevealed(true);
    const requestedImage = imageOverride ?? (snapshot.handwritingMode ? snapshot.customImage : undefined);
    const requestedSignature = kernelSignature(snapshot.selectedKernels);
    const controller = new AbortController();
    trainAbortRef.current?.abort();
    trainAbortRef.current = controller;
    setTraining(true);
    setAutomaticTraining(automatic);
    setTrainAccuracyStale(true);
    setStatusHint(null);
    setError('');
    setMessage('正在读取预计算特征，并为当前卷积核组合训练分类头。');
    try {
      const result = await trainFixedKernel({
        kernels: snapshot.selectedKernels,
        trainRatio: 0.9,
        image: requestedImage,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      const latest = stateRef.current;
      if (!latest || kernelSignature(latest.selectedKernels) !== requestedSignature || !result.classifier) return;
      const nextSession: LenetClassifierSession = {
        signature: requestedSignature,
        selectedKernels: [...latest.selectedKernels],
        classifier: result.classifier,
        trainAccuracy: Number(result.train_accuracy),
        valAccuracy: Number(result.val_accuracy),
        trainedAt: Date.now(),
      };
      setTrainingResult(result);
      setPreview(result);
      setTrainAccuracyStale(false);
      setStatusHint(null);
      const persistTrainingResult = automatic ? persistObservation : commit;
      persistTrainingResult('lenet_fixed_classifier_trained', {
        ...latest,
        classifierSession: nextSession,
        sampleIndex: 0,
      }, {
        kernels: nextSession.selectedKernels,
        signature: nextSession.signature,
        train_accuracy: nextSession.trainAccuracy,
        val_accuracy: nextSession.valAccuracy,
        validation_passed: nextSession.valAccuracy > 0.9,
      });
      setMessage(nextSession.valAccuracy > 0.9
        ? '验证集准确率已严格超过 0.9。现在亲手写一个数字，观察 11 类输出。'
        : '验证集准确率还没有超过 0.9。添加不同方向的卷积核后再训练一次。');
    } catch (reason) {
      if (controller.signal.aborted) return;
      setError(reason instanceof Error ? reason.message : '训练服务暂时不可用。');
      setMessage('当前训练没有改变已保存的分类器，可以调整卷积核后重试。');
    } finally {
      if (!controller.signal.aborted) {
        setTraining(false);
        setAutomaticTraining(false);
      }
    }
  }

  function startHandwriting() {
    const current = stateRef.current;
    if (!current || !classifierReady(current.classifierSession, current.selectedKernels)) return;
    setTrainingResult(null);
    setStatusHint('empty');
    setTrainAccuracyStale(true);
    setMessage('在画布里写下任意一个数字。每完成一笔，特征图和 11 类概率都会重新计算。');
    commit('lenet_handwriting_started', {
      ...current,
      handwritingMode: true,
      customImage: emptyImage(),
      userHasWritten: false,
      sampleIndex: 0,
    }, { signature: current.classifierSession?.signature });
  }

  function clearHandwriting() {
    const current = stateRef.current;
    if (!current) return;
    setStatusHint('empty');
    setTrainAccuracyStale(true);
    commit('lenet_handwriting_cleared', {
      ...current,
      handwritingMode: true,
      customImage: emptyImage(),
      userHasWritten: false,
    }, { signature: current.classifierSession?.signature });
  }

  function commitHandwriting(image: Matrix) {
    const normalized = normalizeImage(image);
    const hasInk = imageHasInk(normalized);
    setStatusHint(hasInk ? 'refreshing' : 'empty');
    setTrainAccuracyStale(true);
    commit('lenet_handwriting_stroke_completed', (current) => ({
      ...current,
      handwritingMode: true,
      customImage: normalized,
      userHasWritten: current.userHasWritten || hasInk,
    }), {
      has_ink: hasInk,
      signature: stateRef.current?.classifierSession?.signature,
    });
    if (hasInk) {
      setMessage('手写输入已进入同一组卷积、池化、标准化和 softmax 流水线。');
      const latest = stateRef.current;
      if (latest && !classifierReady(latest.classifierSession, latest.selectedKernels)) {
        setMessage('需要先让当前卷积核组合的验证集准确率超过 0.9，达标后才能进入下一关。正在自动补训练。');
        void trainClassifier(normalized, true);
      }
    }
  }

  if (!hydrated || !state) {
    return (
      <ContentBlock title="固定权重卷积核能提取更细的人工特征">
        正在从学习记录恢复卷积核与分类器状态…
      </ContentBlock>
    );
  }

  return (
    <div ref={rootRef}>
      <ContentBlock
        className="edu-stage edu-stage--featured lenet-fixed-kernel-stage"
        title="固定权重卷积核能提取更细的人工特征"
        subtitle="选择固定卷积核、训练分类头，再亲手写一个数字验证特征是否有效。"
      >
        <div className="edu-toolbar lenet-top-train" aria-label="训练状态">
          <div className="edu-metrics lenet-top-metrics">
            <div className="edu-metric">
              <span>状态</span>
              <strong>{status}</strong>
            </div>
            <div className="edu-metric">
              <span>训练集准确率</span>
              <strong>{formatPercent(trainAccuracyStale ? null : currentSession?.trainAccuracy)}</strong>
            </div>
            <div
              className={currentSession ? ready ? 'edu-metric is-success' : 'edu-metric is-danger' : 'edu-metric'}
              id="valAccMetric"
            >
              <span>验证集准确率（&gt;0.9 解锁）</span>
              <strong>{formatPercent(currentSession?.valAccuracy)}</strong>
            </div>
          </div>
          <div className="edu-toolbar-actions">
            <Button
              variant={ready ? undefined : 'primary'}
              hint={!ready}
              loading={training}
              onClick={() => void trainClassifier()}
            >
              训练 MLP
            </Button>
          </div>
        </div>

        {error && <Callout tone="red" label="服务提示" text={error} />}

        <section className="edu-card lenet-lab-card" aria-label="固定卷积核分类流水线">
          <div className="lenet-panel-tools">
            <div>
              <p className="edu-body lenet-pretrain-kernel-note">
                使用常用边缘卷积核提取特征，并把特征拉平后送入 MLP 分类。
              </p>
              <div className="edu-task lenet-tool-note">
                <strong>当前任务</strong>
                <span>构造更多固定卷积核特征，使验证集准确率大于 0.9。</span>
              </div>
              <div className="lenet-kernel-palette" aria-label="可选固定卷积核">
                {FIXED_KERNELS.map((kernel) => {
                  const selected = state.selectedKernels.includes(kernel.id);

                  return (
                    <label
                      className="edu-check edu-check--option"
                      key={kernel.id}
                      onMouseEnter={(event) => showKernelPopover(kernel.id, event)}
                      onMouseMove={(event) => showKernelPopover(kernel.id, event)}
                      onMouseLeave={() => setKernelPopover(null)}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={training}
                        onChange={() => toggleKernel(kernel.id)}
                      />
                      <span>{kernel.name}</span>
                      
                    </label>
                  );
                })}
              </div>
            </div>
            {ready && (
              <div className="edu-toolbar-actions lenet-sample-actions" aria-label="输入图像操作">
                <Button
                  id="clearCanvasBtn"
                  variant={state.handwritingMode ? undefined : 'primary'}
                  disabled={training}
                  hint={!state.handwritingMode}
                  onClick={state.handwritingMode ? clearHandwriting : startHandwriting}
                >
                  {state.handwritingMode ? '清屏' : '尝试手写'}
                </Button>
              </div>
            )}
          </div>

          <div className="lenet-pipeline">
            <div className="lenet-pipe-node lenet-pipe-node--digit">
              <span className="edu-label">输入图像</span>
              <MatrixCanvas
                id="digitCanvas"
                matrix={displaySample?.image ?? state.customImage}
                margin="auto"
                editable
                disabled={training}
                ariaLabel="二值 MNIST 手写数字，可用鼠标手写"
                onChange={commitHandwriting}
              />
            </div>

            <div className="lenet-pipe-arrow" aria-hidden="true" />

            <FeatureDeck
              ids={state.selectedKernels}
              maps={displayMaps}
              activeId={state.activeKernel}
              onSelect={selectFeatureKernel}
              onKernelPreview={showKernelPopover}
              onKernelPreviewEnd={() => setKernelPopover(null)}
            />

            <div className="lenet-pipe-arrow" aria-hidden="true" />

            <div className="lenet-pipe-node lenet-flatten-node">
              <span className="edu-label">展平</span>
              <div
                className="lenet-vector-strip is-active"
                aria-label={`${flattened.length} 维展平特征向量`}
                style={{
                  '--vector-count': String(Math.max(1, state.selectedKernels.length)),
                  '--vector-cells': String(Math.max(1, flattened.length)),
                  '--vector-rows': '51',
                  '--vector-columns': String(Math.max(1, Math.ceil(flattened.length / 51))),
                } as CSSProperties}
              >
                {state.selectedKernels.flatMap((id) => {
                  const matrix = displayMaps[id] ?? [];
                  const max = Math.max(0.001, ...matrix.flat().map((value) => Number(value) || 0));
                  return matrix.flatMap((row, rowIndex) => row.map((value, colIndex) => {
                    const level = Math.max(0, Math.min(1, (Number(value) || 0) / max));
                    return (
                      <span
                        className={'lenet-vector-cell' + (id === state.activeKernel ? ' is-active' : '')}
                        key={`${id}-${rowIndex}-${colIndex}`}
                        title={`${kernelById(id).name}: ${value.toFixed(3)}`}
                        style={{ '--value': level.toFixed(3) } as CSSProperties}
                      />
                    );
                  }));
                })}
              </div>
            </div>

            <div className="lenet-pipe-arrow" aria-hidden="true" />

            <div className="lenet-pipe-node lenet-classifier-node">
              <span className="edu-label">分类器</span>
              <ClassifierCanvas
                probabilities={probabilities}
                prediction={displaySample?.prediction ?? -1}
                rejectLabel={rejectLabel}
                training={training}
                hasClassifier={Boolean(currentSession)}
              />
            </div>

            <div className="lenet-pipe-node lenet-output-node">
              <span className="edu-label">输出概率</span>
              <div className="lenet-bars" aria-label="0 到 9 与拒识类的预测概率">
                {Array.from({ length: classCount }, (_, index) => {
                  const probability = Number(probabilities[index]) || 0;
                  const top = displaySample?.prediction === index;
                  const label = displaySample?.label === index;
                  return (
                    <div
                      className={'lenet-prob-row' + (top ? ' is-top' : '') + (label ? ' is-label' : '')}
                      key={index}
                    >
                      <span>{classLabel(index, rejectLabel)}</span>
                      <div><i style={{ width: `${(probability * 100).toFixed(1)}%` }} /></div>
                      <strong>{(probability * 100).toFixed(0)}%</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <NoticeStrip tone="orange" className="lenet-reject-note" lead="“_” 表示拒识。" role="note">
            训练时额外构造不属于 0–9 的样本作为第 11 类，例如空白区域、只截到一部分的数字，以及混合两个数字的滑窗片段。当输入不像任何一个完整数字时，模型输出“_”，避免强行把它认成 0–9 中的某一类。
          </NoticeStrip>
        </section>
      </ContentBlock>
      {kernelPopover && (
        <div
          className="lenet-kernel-popover"
          style={{ left: kernelPopover.left, top: kernelPopover.top }}
          aria-hidden="true"
        >
          <strong>{kernelById(kernelPopover.id).name}</strong>
          <div className="lenet-kernel-grid">
            {kernelById(kernelPopover.id).values.flatMap((row, rowIndex) => row.map((value, colIndex) => (
              <div
                className={'lenet-kernel-cell '
                  + (value > 0 ? 'is-positive' : value < 0 ? 'is-negative' : 'is-zero')}
                key={`${rowIndex}-${colIndex}`}
              >
                {value}
              </div>
            )))}
          </div>
        </div>
      )}
    </div>
  );
}
