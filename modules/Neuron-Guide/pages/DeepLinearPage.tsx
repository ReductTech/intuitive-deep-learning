import { useMemo, useRef } from 'react';
import { Button, FormulaBlock, LessonStage, NoticeStrip, Typography } from '../../shared/react';
import { DeepOutputPlot } from '../components/ActivationCharts';
import {
  NetworkCanvas,
  type NetworkConnection,
  type NetworkLayer,
} from '../components/NetworkCanvas';
import { usePersistedActivity } from '../components/usePersistedActivity';
import './SlidePage.css';
import {
  buildDeepModel,
  deepEquivalent,
  formatNumber,
  formatSigned,
  MAX_DEEP_LAYER_COUNT,
  MIN_DEEP_LAYER_COUNT,
  type DeepNetworkModel,
} from '../model/activationMath';

const STATE_KEY = 'activity:activation-linear-dimensional-v1';

interface DeepSnapshot {
  model: DeepNetworkModel;
  completed: boolean;
}

function createInitialSnapshot(): DeepSnapshot {
  return {
    model: buildDeepModel(MIN_DEEP_LAYER_COUNT),
    completed: false,
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
    candidate.completed !== undefined
    && typeof candidate.completed !== 'boolean'
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
    completed: Boolean(candidate.completed),
  };
}

function hiddenLabel(layer: number, index: number): string {
  return `h${layer}.${index + 1}`;
}

function nodeLabel(layer: number, index: number, sizes: number[]): string {
  if (layer === 0) return index === 0 ? 'x' : 'y';
  if (layer === sizes.length - 1) return 'z';
  return hiddenLabel(layer, index);
}

function buildCanvas(
  model: DeepNetworkModel,
): { layers: NetworkLayer[]; connections: NetworkConnection[] } {
  const outputLayer = model.sizes.length - 1;
  const outputWeights = model.W[model.W.length - 1]?.[0] ?? [];
  const outputBias = model.B[model.B.length - 1]?.[0] ?? 0;
  const layers: NetworkLayer[] = model.sizes.map((size, layer) => ({
    title: layer === 0
      ? `输入 (${size})`
      : layer === model.sizes.length - 1
        ? `输出 (${size})`
        : `线性层 ${layer} (${size})`,
    nodes: Array.from({ length: size }, (_, index) => {
      const isOutput = layer === outputLayer;
      const isHidden = layer > 0 && !isOutput;
      const incomingWeights = isHidden ? model.W[layer - 1]?.[index] ?? [] : [];
      const incomingBias = isHidden ? model.B[layer - 1]?.[index] ?? 0 : 0;
      const sourceLabels = layer === 1
        ? ['x', 'y']
        : Array.from(
          { length: model.sizes[layer - 1] ?? 0 },
          (_, sourceIndex) => hiddenLabel(layer - 1, sourceIndex),
        );
      return {
        label: nodeLabel(layer, index, model.sizes),
        tone: layer === 0
          ? 'input' as const
          : isOutput
            ? 'output' as const
            : 'hidden' as const,
        activation: layer === 0 ? undefined : 'linear',
        details: layer === 0 ? undefined : isOutput ? {
          title: '输出节点 z',
          body: '最后一层把隐藏节点的输出加权汇总，再加上偏置。',
          content: (
            <div className="ng-output-matrix">
              <div className="ng-output-matrix__formula" aria-label="z 等于输出权重行向量乘最后一层隐藏节点列向量，再加偏置">
                <Typography as="code" variant="subtitle" tone="main" wrap="nowrap">z =</Typography>
                <div className="ng-output-matrix__row-vector">
                  {outputWeights.map((weight, weightIndex) => (
                    <Typography as="code" variant="bodySmall" tone="warning" wrap="nowrap" key={weightIndex}>
                      {formatNumber(weight)}
                    </Typography>
                  ))}
                </div>
                <Typography as="code" variant="subtitle" tone="muted" wrap="nowrap">×</Typography>
                <div className="ng-output-matrix__column-vector">
                  {outputWeights.map((_, hiddenIndex) => (
                    <Typography as="code" variant="bodySmall" tone="accent" wrap="nowrap" key={hiddenIndex}>
                      {hiddenLabel(outputLayer - 1, hiddenIndex)}
                    </Typography>
                  ))}
                </div>
                <Typography as="code" variant="subtitle" tone="main" wrap="nowrap">
                  {formatSigned(outputBias)}
                </Typography>
              </div>
            </div>
          ),
        } : isHidden ? {
          title: `第 ${layer} 层 · ${hiddenLabel(layer, index)}`,
          body: '用这一行权重读取上一层的全部输出，再加上该节点的偏置。',
          content: (
            <div className="ng-output-matrix">
              <div
                className="ng-output-matrix__formula"
                aria-label={`${hiddenLabel(layer, index)} 等于权重行向量乘上一层输出列向量，再加偏置`}
              >
                <Typography as="code" variant="subtitle" tone="main" wrap="nowrap">
                  {hiddenLabel(layer, index)} =
                </Typography>
                <div className="ng-output-matrix__row-vector">
                  {incomingWeights.map((weight, weightIndex) => (
                    <Typography as="code" variant="bodySmall" tone="warning" wrap="nowrap" key={weightIndex}>
                      {formatNumber(weight)}
                    </Typography>
                  ))}
                </div>
                <Typography as="code" variant="subtitle" tone="muted" wrap="nowrap">×</Typography>
                <div className="ng-output-matrix__column-vector">
                  {sourceLabels.map((sourceLabel) => (
                    <Typography as="code" variant="bodySmall" tone="accent" wrap="nowrap" key={sourceLabel}>
                      {sourceLabel}
                    </Typography>
                  ))}
                </div>
                <Typography as="code" variant="subtitle" tone="main" wrap="nowrap">
                  {formatSigned(incomingBias)}
                </Typography>
              </div>
            </div>
          ),
        } : undefined,
      };
    }),
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

export interface DeepLinearPageProps {
  onComplete: () => void;
}

export function DeepLinearPage({ onComplete }: DeepLinearPageProps) {
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
    operation: 'add' | 'remove' | 'reroll',
  ) => {
    if (!state) return;
    const nextModel = buildDeepModel(layerCount);
    const completed = state.completed || nextModel.layerCount >= MAX_DEEP_LAYER_COUNT;
    const next: DeepSnapshot = {
      model: nextModel,
      completed,
    };
    commit(eventName, next, {
      experiment: 'dimensional',
      input_dimension: 2,
      layer_count: nextModel.layerCount,
      operation,
    });
    if (!state.completed && completed) onComplete();
  };

  const layerCount = model?.layerCount ?? MIN_DEEP_LAYER_COUNT;

  return (
    <LessonStage
      ref={rootRef}
      className="af-react-network-lab"
      title="线性关系从直线扩展为平面"
      description="当输入由一个变量扩展为两个变量，y = ax + b 对应地写成 z = ax + by + c，图像也从直线扩展为平面。继续增加线性层，只会得到新的平面，无法形成弯曲的曲面。"
      descriptionVariant="bodySmall"
      actions={(
        <div className="af-react-actions">
          <Button
            variant="primary"
            disabled={!hydrated || !model || layerCount >= MAX_DEEP_LAYER_COUNT}
            onClick={() => replaceModel(
              'activation_linear_dimension_layer_add',
              layerCount + 1,
              'add',
            )}
          >
            添加一层
          </Button>
          <Button
            disabled={!hydrated || !model || layerCount <= MIN_DEEP_LAYER_COUNT}
            onClick={() => replaceModel(
              'activation_linear_dimension_layer_remove',
              layerCount - 1,
              'remove',
            )}
          >
            删除一层
          </Button>
          <Button
            disabled={!hydrated || !model}
            onClick={() => replaceModel(
              'activation_linear_dimension_reroll',
              layerCount,
              'reroll',
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
          <Typography variant="bodySmall" tone="inherit">正在恢复已保存的网络层数与参数…</Typography>
        </NoticeStrip>
      ) : (
        <div className="af-react-network-stage">
          <section className="af-react-network-panel">
            <header className="af-react-panel-head">
              <Typography as="h3" variant="subtitle" tone="main">从直线扩展到平面</Typography>
              <Typography as="span" variant="bodySmall" tone="muted">增加层数，平面会弯曲吗？</Typography>
            </header>
            <div className="af-react-visual-box">
              <FormulaBlock
                className="af-react-plot-formula"
                ariaLabel={`当前平面为 z 等于 ${formatNumber(plane.ax)} x ${formatSigned(plane.ay)} y ${formatSigned(plane.c)}`}
                formula={(
                  <span className="af-react-plot-formula-content">
                    <Typography as="span" variant="bodySmall" tone="muted">
                      当前平面
                    </Typography>
                    <Typography as="span" variant="subtitle" tone="main">
                      z = {formatNumber(plane.ax)}x {formatSigned(plane.ay)}y {formatSigned(plane.c)}
                    </Typography>
                  </span>
                )}
              />
              <DeepOutputPlot model={model} />
            </div>
          </section>

          <section className="af-react-network-panel">
            <header className="af-react-panel-head">
              <Typography as="h3" variant="subtitle" tone="main">再把线性网络加深</Typography>
              <Typography as="span" variant="bodySmall" tone="muted">悬浮节点查看这一层的矩阵运算</Typography>
            </header>
            <div className="af-react-visual-box af-react-visual-box--model">
              <NetworkCanvas
                layers={canvas.layers}
                connections={canvas.connections}
                ariaLabel="多层线性网络结构"
                caption="每一层都只是 W a + b；连续进行线性变换，最终仍等价于一次线性变换"
                height={430}
              />
            </div>
          </section>
        </div>
      )}
      <NoticeStrip className="ng-deep-linear-conclusion" tone="green">
        <Typography as="strong" variant="bodySmall" tone="inherit">为什么必须在层与层之间加入非线性？</Typography>
        <Typography as="span" variant="bodySmall" tone="inherit">没有激活函数，再多线性层也能合并成一次线性运算；层间加入 ReLU 后，每一层才能重新折叠输入空间，让深度真正增加表达能力。</Typography>
      </NoticeStrip>
    </LessonStage>
  );
}



