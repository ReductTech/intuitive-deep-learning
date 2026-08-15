import { useMemo, useRef } from 'react';
import { Button, LessonStage, NoticeStrip, Typography } from '../../shared/react';
import { DeepOutputPlot } from '../components/ActivationCharts';
import {
  NetworkCanvas,
  type NetworkConnection,
  type NetworkLayer,
} from '../components/NetworkCanvas';
import { usePersistedActivity } from '../components/usePersistedActivity';
import {
  buildDeepModel,
  deepEquivalent,
  formatNumber,
  formatSigned,
  MAX_DEEP_LAYER_COUNT,
  MIN_DEEP_LAYER_COUNT,
  type DeepNetworkModel,
} from '../model/activationMath';

const STATE_KEY = 'activity:activation-linear-deep';

interface DeepSnapshot {
  model: DeepNetworkModel;
  hasReachedFiveLayers: boolean;
}

function createInitialSnapshot(): DeepSnapshot {
  return {
    model: buildDeepModel(MIN_DEEP_LAYER_COUNT),
    hasReachedFiveLayers: false,
  };
}

function isValidDeepModel(value: unknown): value is DeepNetworkModel {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const model = value as Partial<DeepNetworkModel>;
  if (
    !Number.isInteger(model.layerCount)
    || !Array.isArray(model.sizes)
    || !Array.isArray(model.W)
    || !Array.isArray(model.B)
    || model.layerCount! < MIN_DEEP_LAYER_COUNT
    || model.layerCount! > MAX_DEEP_LAYER_COUNT
    || model.sizes.length !== model.layerCount! + 2
    || model.sizes[0] !== 2
    || model.sizes.at(-1) !== 1
    || model.sizes.slice(1, -1).some((size) => size !== 3)
    || model.W.length !== model.sizes.length - 1
    || model.B.length !== model.W.length
  ) {
    return false;
  }
  return model.W.every((matrix, layer) => (
    Array.isArray(matrix)
    && matrix.length === model.sizes![layer + 1]
    && matrix.every((row) => (
      Array.isArray(row)
      && row.length === model.sizes![layer]
      && row.every((entry) => typeof entry === 'number' && Number.isFinite(entry))
    ))
    && Array.isArray(model.B![layer])
    && model.B![layer].length === model.sizes![layer + 1]
    && model.B![layer].every(
      (entry) => typeof entry === 'number' && Number.isFinite(entry),
    )
  ));
}

function normalizeSnapshot(value: unknown): DeepSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<DeepSnapshot>;
  if (
    candidate.hasReachedFiveLayers !== undefined
    && typeof candidate.hasReachedFiveLayers !== 'boolean'
  ) {
    return null;
  }
  const model = candidate.model;
  if (!isValidDeepModel(model)) return null;
  return {
    model: {
      layerCount: model.layerCount,
      sizes: [...model.sizes],
      W: model.W.map((matrix) => matrix.map((row) => [...row])),
      B: model.B.map((row) => [...row]),
    },
    hasReachedFiveLayers: Boolean(
      candidate.hasReachedFiveLayers || model.layerCount >= MAX_DEEP_LAYER_COUNT,
    ),
  };
}

function nodeLabel(layer: number, index: number, sizes: number[]): string {
  if (layer === 0) return index === 0 ? 'x' : 'y';
  if (layer === sizes.length - 1) return 'z';
  return `h${layer}.${index + 1}`;
}

function buildCanvas(
  model: DeepNetworkModel,
): { layers: NetworkLayer[]; connections: NetworkConnection[] } {
  const layers: NetworkLayer[] = model.sizes.map((size, layer) => ({
    title: layer === 0
      ? `输入 (${size})`
      : layer === model.sizes.length - 1
        ? `输出 (${size})`
        : `线性层 ${layer} (${size})`,
    nodes: Array.from({ length: size }, (_, index) => ({
      label: nodeLabel(layer, index, model.sizes),
      tone: layer === 0
        ? 'input' as const
        : layer === model.sizes.length - 1
          ? 'output' as const
          : 'hidden' as const,
      activation: layer === 0 ? undefined : 'linear',
    })),
  }));
  const connections: NetworkConnection[] = [];
  model.W.forEach((matrix, layer) => {
    matrix.forEach((row, toIndex) => {
      row.forEach((weight, fromIndex) => {
        connections.push({
          fromLayer: layer,
          fromIndex,
          toLayer: layer + 1,
          toIndex,
          weight,
        });
      });
    });
  });
  return { layers, connections };
}

export interface DeepLinearBlockProps {
  onComplete: () => void;
}

export function DeepLinearBlock({ onComplete }: DeepLinearBlockProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const {
    state,
    hydrated,
    commit,
  } = usePersistedActivity<DeepSnapshot>({
    stateKey: STATE_KEY,
    createInitial: createInitialSnapshot,
    normalizeState: normalizeSnapshot,
    initEvent: 'activation_linear_state_initialized',
    initProperties: { experiment: 'deep' },
    getElement: () => rootRef.current,
  });

  const model = state?.model;
  const plane = useMemo(() => model ? deepEquivalent(model) : null, [model]);
  const canvas = useMemo(
    () => model ? buildCanvas(model) : { layers: [], connections: [] },
    [model],
  );

  const replaceModel = (
    eventName: string,
    layerCount: number,
    properties: Record<string, unknown>,
  ) => {
    if (!state) return;
    const nextModel = buildDeepModel(layerCount);
    const reachedNow = nextModel.layerCount >= MAX_DEEP_LAYER_COUNT;
    const next: DeepSnapshot = {
      model: nextModel,
      hasReachedFiveLayers: state.hasReachedFiveLayers || reachedNow,
    };
    commit(eventName, next, {
      experiment: 'deep',
      layer_count: nextModel.layerCount,
      ...properties,
    });
    if (!state.hasReachedFiveLayers && reachedNow) {
      // Persist the experiment result and Lesson Flow progress in the same
      // user turn. Delaying the flow write creates a refresh window in which
      // the fifth-layer button is locked but the next lesson is still hidden.
      onComplete();
    }
  };

  const layerCount = model?.layerCount ?? MIN_DEEP_LAYER_COUNT;
  return (
    <LessonStage
      ref={rootRef}
      className="af-react-network-lab"
      title="层数变多了，输出仍然是一张平面"
      description="现在把输入扩展成二维坐标 x,y，输出变成 z。即使堆叠多层线性神经元，没有激活函数时，最后仍然只能得到一个平面。"
      actions={(
        <div className="af-react-actions">
          <Button
            variant="primary"
            disabled={!hydrated || !model || layerCount >= MAX_DEEP_LAYER_COUNT}
            onClick={() => replaceModel(
              'activation_linear_deep_layer_add',
              layerCount + 1,
              { operation: 'add' },
            )}
          >
            添加一层
          </Button>
          <Button
            disabled={!hydrated || !model || layerCount <= MIN_DEEP_LAYER_COUNT}
            onClick={() => replaceModel(
              'activation_linear_deep_layer_remove',
              layerCount - 1,
              { operation: 'remove' },
            )}
          >
            删除一层
          </Button>
          <Button
            disabled={!hydrated || !model}
            onClick={() => replaceModel(
              'activation_linear_deep_reroll',
              layerCount,
              { operation: 'reroll' },
            )}
          >
            随机参数
          </Button>
        </div>
      )}
      data-telemetry-manual
      aria-busy={!hydrated}
    >
      {!model || !plane ? (
        <NoticeStrip tone="blue">
          正在恢复已保存的网络层数与参数…
        </NoticeStrip>
      ) : (
        <div className="af-react-network-stage">
          <section className="af-react-network-panel">
            <header className="af-react-panel-head">
              <Typography as="h3" variant="subtitle" tone="main">三维输出平面</Typography>
              <Typography as="span" variant="bodySmall" tone="muted">二维输入 x,y，一维输出 z</Typography>
            </header>
            <div className="af-react-visual-box">
              <DeepOutputPlot model={model} />
            </div>
            <NoticeStrip className="af-react-readout">
              <Typography variant="bodySmall" tone="inherit">当前等价平面：z = {formatNumber(plane.ax)}x {formatSigned(plane.ay)}y {formatSigned(plane.c)}。隐藏层数：{layerCount} / {MAX_DEEP_LAYER_COUNT}。</Typography>
            </NoticeStrip>
          </section>

          <section className="af-react-network-panel">
            <header className="af-react-panel-head">
              <Typography as="h3" variant="subtitle" tone="main">多层线性结构</Typography>
              <Typography as="span" variant="bodySmall" tone="muted">没有激活函数</Typography>
            </header>
            <div className="af-react-visual-box af-react-visual-box--model">
              <NetworkCanvas
                layers={canvas.layers}
                connections={canvas.connections}
                ariaLabel="多层线性网络结构"
                caption="每层都是线性运算：a = W a + b，没有 tanh / ReLU"
                height={430}
                showInspector={false}
              />
            </div>
            <NoticeStrip className="af-react-readout">
              <Typography variant="bodySmall" tone="inherit">{layerCount < MAX_DEEP_LAYER_COUNT
                ? '每层固定 3 个神经元。继续添加层数，左侧仍然只能画出一张平面。'
                : '已经加到 5 层了。没有激活函数时，这个 MLP 依然只是一个线性变换。'}</Typography>
            </NoticeStrip>
          </section>
        </div>
      )}
    </LessonStage>
  );
}
