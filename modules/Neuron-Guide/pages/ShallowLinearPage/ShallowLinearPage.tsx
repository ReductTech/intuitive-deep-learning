import { useMemo, useRef, useState } from 'react';
import "./ShallowLinearPage.css";
import { Button, ContentBlock, NoticeStrip, Typography } from '../../../shared/react';
import {
  SHALLOW_SERIES_COLORS,
  ShallowOutputPlot,
  usePersistedActivity,
} from '../ActivationCatalogPage/ActivationCatalogPage';
import {
  NetworkCanvas,
  type NetworkConnection,
  type NetworkLayer,
  type NetworkNodeRef,
} from '../NetworkCanvas/NetworkCanvas';
import {
  formatNumber,
  formatSigned,
  formatSubscript,
  makeShallowModel,
  makeShallowNeuron,
  type ShallowModel,
} from '../ActivationCatalogPage/ActivationCatalogPage';

const STATE_KEY = 'activity:activation-linear-shallow';

interface ShallowSnapshot {
  model: ShallowModel;
  completed: boolean;
}

function createInitialSnapshot(): ShallowSnapshot {
  // Start with two parallel units so the composition is visible immediately.
  return { model: makeShallowModel(2), completed: false };
}

function isFiniteNeuron(value: unknown): value is ShallowModel['neurons'][number] {
  if (!value || typeof value !== 'object') return false;
  const neuron = value as Record<string, unknown>;
  return ['w', 'b', 'v'].every(
    (key) => typeof neuron[key] === 'number' && Number.isFinite(neuron[key]),
  );
}

function normalizeSnapshot(value: unknown): ShallowSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<ShallowSnapshot>;
  if (
    candidate.completed !== undefined
    && typeof candidate.completed !== 'boolean'
  ) {
    return null;
  }
  const model = candidate.model;
  if (
    !model
    || !Array.isArray(model.neurons)
    || model.neurons.length < 1
    || model.neurons.length > 3
    || !model.neurons.every(isFiniteNeuron)
    || !Number.isFinite(model.outputBias)
  ) {
    return null;
  }
  return {
    model: {
      neurons: model.neurons.map((neuron) => ({ ...neuron })),
      outputBias: model.outputBias,
    },
    completed: Boolean(candidate.completed || model.neurons.length >= 3),
  };
}

function buildCanvas(
  model: ShallowModel,
): { layers: NetworkLayer[]; connections: NetworkConnection[] } {
  const layers: NetworkLayer[] = [
    {
      title: '输入 (1)',
      nodes: [{
        label: 'x',
        tone: 'input',
        color: SHALLOW_SERIES_COLORS.input,
        details: {
          title: '输入 x',
          body: '同一个输入 x 送给每个神经元；每个神经元用自己的权重 wᵢ 和偏置 bᵢ 处理它。',
        },
      }],
    },
    {
      title: `线性层 (${model.neurons.length})`,
      nodes: model.neurons.map((neuron, index) => ({
        label: `h${index + 1}`,
        tone: 'hidden' as const,
        activation: 'linear',
        color: SHALLOW_SERIES_COLORS.hidden[index] ?? SHALLOW_SERIES_COLORS.hidden[2],
        details: {
          title: `h${index + 1} 的线性输出`,
          content: (
            <Typography as="code" variant="body" tone="inherit" wrap="nowrap">
              {`h${index + 1} = w${formatSubscript(index + 1)}x + b${formatSubscript(index + 1)}`}
              <br />
              {`\u00A0\u00A0\u00A0= ${formatNumber(neuron.w)}x ${formatSigned(neuron.b)}`}
            </Typography>
          ),
          body: `w${formatSubscript(index + 1)} 给输入 x 加权，b${formatSubscript(index + 1)} 是偏置。`,
        },
      })),
    },
    {
      title: '输出 (1)',
      nodes: [{
        label: 'y',
        tone: 'output',
        color: SHALLOW_SERIES_COLORS.output,
        details: {
          title: '输出 y',
          content: (
            <Typography as="code" variant="body" tone="inherit" wrap="nowrap">
              y = Σ vᵢhᵢ {formatSigned(model.outputBias)}
            </Typography>
          ),
          body: 'hᵢ 是第 i 个线性神经元的输出，vᵢ 是它连到 y 的权重：把每个 hᵢ 按自己的 vᵢ 加权后相加，就得到 y。',
        },
      }],
    },
  ];
  const connections: NetworkConnection[] = [];
  model.neurons.forEach((neuron, index) => {
    connections.push({
      fromLayer: 0,
      fromIndex: 0,
      toLayer: 1,
      toIndex: index,
      weight: neuron.w,
      color: SHALLOW_SERIES_COLORS.hidden[index] ?? SHALLOW_SERIES_COLORS.hidden[2],
    });
    connections.push({
      fromLayer: 1,
      fromIndex: index,
      toLayer: 2,
      toIndex: 0,
      weight: neuron.v,
      color: SHALLOW_SERIES_COLORS.hidden[index] ?? SHALLOW_SERIES_COLORS.hidden[2],
    });
  });
  return { layers, connections };
}

export interface ShallowLinearPageProps {
  onComplete: () => void;
}

export function ShallowLinearPage({ onComplete }: ShallowLinearPageProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [activeNode, setActiveNode] = useState<NetworkNodeRef | null>(null);
  const {
    state,
    hydrated,
    commit,
  } = usePersistedActivity<ShallowSnapshot>({
    stateKey: STATE_KEY,
    createInitial: createInitialSnapshot,
    normalizeState: normalizeSnapshot,
    initEvent: 'activation_linear_state_initialized',
    initProperties: { experiment: 'shallow' },
    getElement: () => rootRef.current,
  });
  const model = state?.model;
  const canvas = useMemo(
    () => model ? buildCanvas(model) : { layers: [], connections: [] },
    [model],
  );

  const addNeuron = () => {
    if (!state || state.model.neurons.length >= 3) return;
    const neurons = [...state.model.neurons, makeShallowNeuron()];
    const next: ShallowSnapshot = {
      model: { ...state.model, neurons },
      completed: state.completed || neurons.length >= 3,
    };
    commit('activation_linear_neuron_add', next, {
      experiment: 'shallow',
      neuron_count: neurons.length,
    });
    if (!state.completed && next.completed) onComplete();
  };

  const removeNeuron = () => {
    if (!state || state.model.neurons.length <= 1) return;
    const neurons = state.model.neurons.slice(0, -1);
    commit('activation_linear_neuron_remove', {
      model: { ...state.model, neurons },
      completed: state.completed,
    }, {
      experiment: 'shallow',
      neuron_count: neurons.length,
    });
  };

  const randomizeWeights = () => {
    if (!state) return;
    const neuronCount = state.model.neurons.length;
    commit('activation_linear_weights_randomized', {
      model: makeShallowModel(neuronCount),
      completed: state.completed,
    }, {
      experiment: 'shallow',
      neuron_count: neuronCount,
    });
  };

  const count = model?.neurons.length ?? 0;
  const activeSeriesId = activeNode?.layer === 1
    ? `hidden-${activeNode.index}`
    : activeNode?.layer === 2
      ? 'network-output'
      : null;
  return (
    <ContentBlock
      ref={rootRef}
      headingLevel={1}
      className="ngtw-activation-network-lab ngtw-shallow-linear"
      title="线性神经元的组合仍然是线性的"
      subtitle="把多个线性神经元并行连接，观察它们的输出如何汇合成一个函数。"
      data-telemetry-manual
      aria-busy={!hydrated}
    >
      {!model ? (
        <NoticeStrip tone="blue">
          <Typography variant="body" tone="inherit">正在恢复已保存的随机参数…</Typography>
        </NoticeStrip>
      ) : (
        <>
          <div className="ngtw-shallow-toolbar flex min-w-0 items-center justify-between gap-[12px] min-h-[56px] p-[4px_8px_4px_12px]">
            <div className="ngtw-shallow-toolbar__context flex min-w-0 max-w-full items-center gap-[6px]">
              <Typography as="span" variant="body" tone="muted">当前结构：</Typography>
              <Typography as="strong" variant="body" tone="accent">{count} 个线性神经元</Typography>
              <Typography as="span" variant="body" tone="muted">汇合为</Typography>
              <Typography as="strong" variant="body" tone="success">1 个输出</Typography>
            </div>
            <div className="ngtw-activation-actions flex flex-wrap gap-[8px]" aria-label="调整网络结构">
              <Button variant="primary" disabled={!hydrated || !model || count >= 3} onClick={addNeuron}>
                添加
              </Button>
              <Button disabled={!hydrated || !model || count <= 1} onClick={removeNeuron}>
                移除
              </Button>
              <Button disabled={!hydrated || !model} onClick={randomizeWeights}>
                重置权重
              </Button>
            </div>
          </div>

          <div className="ngtw-activation-network-stage grid grid-cols-[minmax(0,_.95fr)_minmax(0,_1.05fr)] items-stretch gap-[14px]">
            <section className="ngtw-activation-network-panel relative flex min-w-0 min-h-[560px] flex-col bg-[#fff] p-[14px] ngtw-shallow-panel ngtw-shallow-panel--network" aria-label="网络结构">
              <div className="ngtw-activation-visual-box relative min-h-[430px] overflow-hidden ngtw-activation-visual-box--model">
                <NetworkCanvas
                  layers={canvas.layers}
                  connections={canvas.connections}
                  ariaLabel="无激活函数网络结构"
                  caption="圆点表示计算，悬停节点看 wᵢ、bᵢ、vᵢ"
                  height={410}
                  fontScale={1.15}
                  activeNode={activeNode}
                  onActiveNodeChange={setActiveNode}
                />
              </div>
            </section>

            <section className="ngtw-activation-network-panel relative flex min-w-0 min-h-[560px] flex-col bg-[#fff] p-[14px] ngtw-shallow-panel ngtw-shallow-panel--plot" aria-label="函数形状">
              <div className="ngtw-activation-visual-box relative min-h-[430px] overflow-hidden">
                <ShallowOutputPlot model={model} activeSeriesId={activeSeriesId} />
              </div>
            </section>
          </div>

          <div className="ngtw-shallow-conclusion flex min-w-0 items-center gap-[12px] p-[10px_14px]">
            <Typography as="strong" variant="subtitle" tone="success">结论</Typography>
            <Typography variant="body" tone="main">多个线性函数的加权和，仍然可以合并成一个线性函数。</Typography>
          </div>
        </>
      )}
    </ContentBlock>
  );
}

