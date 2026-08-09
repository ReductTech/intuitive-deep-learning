import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Callout,
  ContentBlock,
  NoticeStrip,
  Select,
} from '../../shared/react';
import { MnistConvolutionCanvas } from '../components/MnistConvolutionCanvas';
import { usePersistedActivity } from '../components/usePersistedActivity';
import {
  DEFAULT_CUSTOM_KERNEL,
  MNIST_KERNELS,
  MNIST_SAMPLES,
  chooseRandomMnistSample,
  convolveMnist,
  currentMnistKernel,
  featureColor,
  flattenFeatureMap,
  imageDataToMnistPixels,
  mnistLabelFromPath,
  outputFeatureSize,
  resizeCustomKernel,
  updateCustomKernelCell,
  type MnistKernelKey,
} from '../model/mnistMath';
import {
  cloneMatrix,
  mainDiagonalKernel,
  type Matrix,
} from '../model/kernelMath';

const imageModules = import.meta.glob('../../../dataset/mnist/*/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const imageUrls = new Map<string, string>(
  Object.entries(imageModules).map(([path, url]) => {
    const normalized = path.replace(/\\/g, '/');
    const suffix = normalized.match(/dataset\/mnist\/\d\/[^/]+$/)?.[0] ?? normalized;
    return [suffix, url];
  }),
);

interface MnistState {
  samplePath: string;
  kernelKey: MnistKernelKey;
  userKernel: Matrix;
  customKernel: Matrix;
  kernelUnlocked: boolean;
  scanComplete: boolean;
  selectedIndex: number;
  runId: number;
}

function createInitial(userKernel: Matrix = mainDiagonalKernel()): MnistState {
  return {
    samplePath: chooseRandomMnistSample(),
    kernelKey: 'user',
    userKernel: cloneMatrix(userKernel),
    customKernel: cloneMatrix(DEFAULT_CUSTOM_KERNEL),
    kernelUnlocked: false,
    scanComplete: false,
    selectedIndex: 0,
    runId: 0,
  };
}

function isSquareMatrix(value: unknown, sizes: number[]) {
  return Array.isArray(value)
    && sizes.includes(value.length)
    && value.every((row) => Array.isArray(row) && row.length === value.length);
}

function normalizeState(stored: unknown): MnistState | null {
  if (!stored || typeof stored !== 'object') return null;
  const value = stored as Partial<MnistState>;
  const initial = createInitial();
  const samplePath = typeof value.samplePath === 'string' && (MNIST_SAMPLES as readonly string[]).includes(value.samplePath)
    ? value.samplePath
    : initial.samplePath;
  const kernelKey = ['user', 'vertical', 'horizontal', 'edge', 'custom'].includes(String(value.kernelKey))
    ? value.kernelKey as MnistKernelKey
    : 'user';
  return {
    ...initial,
    ...value,
    samplePath,
    kernelKey,
    userKernel: isSquareMatrix(value.userKernel, [5])
      ? cloneMatrix(value.userKernel as Matrix)
      : initial.userKernel,
    customKernel: isSquareMatrix(value.customKernel, [3, 5])
      ? cloneMatrix(value.customKernel as Matrix)
      : initial.customKernel,
    kernelUnlocked: value.kernelUnlocked === true,
    scanComplete: value.scanComplete === true,
    selectedIndex: Math.max(0, Number(value.selectedIndex) || 0),
    runId: Math.max(0, Number(value.runId) || 0),
  };
}

function loadPixels(samplePath: string) {
  const url = imageUrls.get(samplePath);
  if (!url) return Promise.reject(new Error(`无法找到图片：${samplePath}`));
  return new Promise<Matrix>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scratch = document.createElement('canvas');
      scratch.width = 28;
      scratch.height = 28;
      const context = scratch.getContext('2d', { willReadFrequently: true });
      if (!context) {
        reject(new Error('浏览器无法读取图像像素。'));
        return;
      }
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, 28, 28);
      context.drawImage(image, 0, 0, 28, 28);
      resolve(imageDataToMnistPixels(context.getImageData(0, 0, 28, 28).data));
    };
    image.onerror = () => reject(new Error(`图片加载失败：${samplePath}`));
    image.src = url;
  });
}

function KernelPreview({ matrix, editable = false, onChange, onCommit }: {
  matrix: Matrix;
  editable?: boolean;
  onChange?: (row: number, col: number, value: number) => void;
  onCommit?: () => void;
}) {
  return (
    <div
      className={editable ? 'ck-custom-kernel-grid' : 'ck-conv-kernel ck-conv-kernel--popover'}
      style={{ gridTemplateColumns: `repeat(${matrix.length}, minmax(0, 1fr))` }}
    >
      {matrix.flatMap((row, rowIndex) => row.map((value, colIndex) => (
        editable ? (
          <input
            key={`${rowIndex}:${colIndex}`}
            type="number"
            step="1"
            min="-9"
            max="9"
            value={value}
            aria-label={`第 ${rowIndex + 1} 行第 ${colIndex + 1} 列`}
            onChange={(event) => onChange?.(rowIndex, colIndex, Number(event.target.value) || 0)}
            onBlur={onCommit}
          />
        ) : (
          <span className={value > 0 ? 'is-positive' : value < 0 ? 'is-negative' : ''} key={`${rowIndex}:${colIndex}`}>{value}</span>
        )
      )))}
    </div>
  );
}

export function MnistConvolutionBlock({
  userKernel,
  onComplete,
  lessonStepComplete = false,
}: {
  userKernel?: Matrix | null;
  onComplete: () => void;
  lessonStepComplete?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const firstKernelRef = useRef(cloneMatrix(userKernel ?? mainDiagonalKernel()));
  const [pixels, setPixels] = useState<Matrix>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [scanStep, setScanStep] = useState(0);
  const [popoverKey, setPopoverKey] = useState<MnistKernelKey | null>(null);
  const { state, stateRef, hydrated, setDraft, commit } = usePersistedActivity<MnistState>({
    stateKey: 'activity:convolution-kernel-mnist',
    createInitial: () => createInitial(firstKernelRef.current),
    normalizeState,
    getElement: () => rootRef.current,
  });

  useEffect(() => {
    if (!hydrated || !userKernel || !stateRef.current) return;
    if (matrixFingerprint(userKernel) === matrixFingerprint(stateRef.current.userKernel)) return;
    setDraft((current) => ({
      ...current,
      userKernel: cloneMatrix(userKernel),
      scanComplete: false,
      selectedIndex: 0,
      runId: current.runId + 1,
    }));
  }, [hydrated, setDraft, stateRef, userKernel]);

  useEffect(() => {
    if (!state) return;
    let active = true;
    setLoading(true);
    setLoadError('');
    void loadPixels(state.samplePath).then((next) => {
      if (!active) return;
      setPixels(next);
      setLoading(false);
    }).catch((error) => {
      if (!active) return;
      setLoadError(error instanceof Error ? error.message : '图片加载失败。');
      setLoading(false);
    });
    return () => { active = false; };
  }, [state?.samplePath]);

  const kernel = useMemo(
    () => state ? currentMnistKernel(state.kernelKey, state.userKernel, state.customKernel) : mainDiagonalKernel(),
    [state],
  );
  const featureMap = useMemo(
    () => pixels.length ? convolveMnist(pixels, kernel) : [],
    [kernel, pixels],
  );
  const featureValues = useMemo(() => flattenFeatureMap(featureMap), [featureMap]);
  const featureSize = outputFeatureSize(kernel);

  useEffect(() => {
    if (!hydrated || !state?.scanComplete || lessonStepComplete) return;
    onComplete();
  }, [hydrated, lessonStepComplete, onComplete, state?.scanComplete]);

  useEffect(() => {
    if (!state || loading || loadError || !pixels.length) return;
    if (state.scanComplete) {
      setScanStep(featureValues.length);
      return;
    }
    setScanStep(0);
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setScanStep(index);
      if (index < featureValues.length) return;
      window.clearInterval(timer);
      const latest = stateRef.current;
      if (!latest || latest.scanComplete) return;
      commit('mnist_scan_completed', {
        ...latest,
        kernelUnlocked: true,
        scanComplete: true,
        selectedIndex: Math.max(0, featureValues.length - 1),
      }, {
        sample: latest.samplePath,
        kernel: latest.kernelKey,
        output_size: featureSize,
      });
    }, 16);
    return () => window.clearInterval(timer);
  }, [
    commit,
    featureSize,
    featureValues.length,
    loadError,
    loading,
    pixels.length,
    state?.runId,
    state?.scanComplete,
    stateRef,
  ]);

  if (!hydrated || !state) {
    return <ContentBlock title="让卷积核扫过一张手写数字">正在恢复卷积实验状态…</ContentBlock>;
  }

  const maxVisibleIndex = Math.max(0, Math.min(featureValues.length - 1, scanStep - 1));
  const selectedIndex = state.scanComplete
    ? Math.min(state.selectedIndex, Math.max(0, featureValues.length - 1))
    : maxVisibleIndex;
  const selectedRow = featureSize ? Math.floor(selectedIndex / featureSize) : 0;
  const selectedCol = featureSize ? selectedIndex % featureSize : 0;
  const selectedValue = featureValues[selectedIndex] ?? 0;
  const kernelLabels: Record<MnistKernelKey, string> = {
    user: '你设计的 5 × 5 核',
    vertical: '竖线卷积核',
    horizontal: '横线卷积核',
    edge: '边缘卷积核',
    custom: '自定义核',
  };

  function restart(update: (current: MnistState) => MnistState, eventName: string, properties: Record<string, unknown>) {
    commit(eventName, (current) => ({
      ...update(current),
      scanComplete: false,
      selectedIndex: 0,
      runId: current.runId + 1,
    }), properties);
  }

  function selectKernel(key: MnistKernelKey) {
    if (!stateRef.current?.kernelUnlocked) return;
    restart((current) => ({ ...current, kernelKey: key }), 'mnist_kernel_changed', { kernel: key });
  }

  function matrixFingerprint(matrix: Matrix) {
    return matrix.map((row) => row.join(',')).join(';');
  }

  return (
    <div ref={rootRef}>
      <ContentBlock
        className="edu-stage ck-mnist-stage"
        title="让卷积核扫过一张手写数字"
        subtitle="这次输入不再是棋盘，而是一张 MNIST 数字图像。滑动窗口会自动移动，每到一个位置就计算一个值，并把它写进右边的特征图。"
      >
        {loadError && <Callout tone="red" label="图片加载失败" text={loadError} />}
        <div className="ck-mnist-layout">
          <section className="edu-card ck-matrix-card ck-mnist-card">
            <div className="ck-card-head">
              <h3 className="edu-panel-title">输入图像</h3>
              <div className="edu-toolbar-actions ck-mnist-actions">
                <Button
                  disabled={loading}
                  onClick={() => restart(
                    (current) => ({ ...current, samplePath: chooseRandomMnistSample(current.samplePath) }),
                    'mnist_sample_changed',
                    { previous: state.samplePath },
                  )}
                >
                  随机换一张
                </Button>
                <Button
                  disabled={loading}
                  onClick={() => restart((current) => current, 'mnist_scan_replayed', { kernel: state.kernelKey })}
                >
                  重放扫描
                </Button>
              </div>
            </div>
            <div className="edu-metrics ck-digit-meta">
              <div className="edu-metric"><span>标签</span><strong>{mnistLabelFromPath(state.samplePath)}</strong></div>
              <div className="edu-metric"><span>窗口</span><strong>{String(selectedCol + 1).padStart(2, '0')},{String(selectedRow + 1).padStart(2, '0')}</strong></div>
            </div>
            <div className="edu-canvas-frame ck-digit-canvas-wrap">
              {loading
                ? <div className="ck-digit-loading">正在加载数字…</div>
                : <MnistConvolutionCanvas pixels={pixels} row={selectedRow} col={selectedCol} kernelSize={kernel.length} />}
            </div>
          </section>
          <section className="edu-card ck-matrix-card ck-mnist-card">
            <div className="ck-card-head">
              <h3 className="edu-panel-title">卷积核与特征图</h3>
              {state.kernelUnlocked && (
                <div className="ck-segmented ck-kernel-tabs" role="group" aria-label="选择卷积核">
                  {(['user', 'vertical', 'horizontal', 'edge', 'custom'] as MnistKernelKey[]).map((key) => (
                    <button
                      className={state.kernelKey === key ? 'is-active' : ''}
                      type="button"
                      key={key}
                      onClick={() => { selectKernel(key); setPopoverKey(key); }}
                      onMouseEnter={() => setPopoverKey(key)}
                      onFocus={() => setPopoverKey(key)}
                    >
                      {key === 'user' ? '你的核' : key === 'vertical' ? '竖线' : key === 'horizontal' ? '横线' : key === 'edge' ? '边缘' : '自定义'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <NoticeStrip tone="blue" className="ck-mnist-hint">
              正在使用：{kernelLabels[state.kernelKey]}。滑动窗口会逐像素生成右侧特征图。
            </NoticeStrip>
            <div className="ck-conv-layout">
              <span className="ck-mini-title">输出特征图</span>
              <div
                className={`ck-feature-map ${state.scanComplete ? 'is-interactive' : ''}`}
                style={{ gridTemplateColumns: `repeat(${featureSize}, minmax(0, 1fr))` }}
                aria-label="卷积输出特征图"
              >
                {featureValues.map((value, index) => (
                  <button
                    type="button"
                    className={`ck-feature-pixel ${index === selectedIndex ? 'is-current' : ''}`}
                    key={index}
                    disabled={!state.scanComplete}
                    style={{ background: index < scanStep ? featureColor(value, featureValues) : undefined }}
                    title={index < scanStep ? `响应强度 ${Math.abs(value).toFixed(3)}` : undefined}
                    aria-label={`第 ${index % featureSize + 1} 列，第 ${Math.floor(index / featureSize) + 1} 行，响应强度 ${Math.abs(value).toFixed(2)}`}
                    onClick={() => commit('mnist_feature_cell_selected', (current) => ({ ...current, selectedIndex: index }), { index, value })}
                  />
                ))}
              </div>
            </div>
            <NoticeStrip tone="blue" className="ck-conv-status">
              <span>当前响应强度</span>
              <strong>{Math.abs(selectedValue).toFixed(2)}</strong>
              <span id="convStatusText">{state.scanComplete ? '扫描完成，点击特征图方格查看对应响应' : '滑动窗口正在扫描'}</span>
            </NoticeStrip>
            {popoverKey && (
              <div
                className="ck-mnist-popover ck-react-kernel-popover"
                onMouseLeave={() => setPopoverKey(null)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setPopoverKey(null);
                }}
              >
                <h4>{kernelLabels[popoverKey]}</h4>
                {popoverKey === 'custom' ? (
                  <>
                    <Select
                      label="核大小"
                      value={String(state.customKernel.length)}
                      options={[
                        { value: '3', label: '3 × 3' },
                        { value: '5', label: '5 × 5' },
                      ]}
                      onChange={(value) => restart(
                        (current) => ({ ...current, customKernel: resizeCustomKernel(current.customKernel, Number(value) === 5 ? 5 : 3) }),
                        'mnist_custom_kernel_resized',
                        { size: Number(value) },
                      )}
                    />
                    <KernelPreview
                      editable
                      matrix={state.customKernel}
                      onChange={(row, col, value) => {
                        setDraft((current) => ({
                          ...current,
                          customKernel: updateCustomKernelCell(current.customKernel, row, col, value),
                          scanComplete: false,
                          selectedIndex: 0,
                          runId: current.runId + 1,
                        }));
                      }}
                      onCommit={() => commit(
                        'mnist_custom_kernel_edited',
                        (current) => current,
                        { size: state.customKernel.length },
                      )}
                    />
                  </>
                ) : (
                  <KernelPreview matrix={currentMnistKernel(popoverKey, state.userKernel, state.customKernel)} />
                )}
              </div>
            )}
          </section>
        </div>
      </ContentBlock>
    </div>
  );
}
