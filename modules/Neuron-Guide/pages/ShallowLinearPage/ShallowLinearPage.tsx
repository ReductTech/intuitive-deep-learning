import { useMemo, useRef } from 'react';
import "./ShallowLinearPage.css";
import { Button, ContentBlock, FormulaBlock, NoticeStrip, Typography } from '../../../shared/react';
import { ShallowOutputPlot } from '../../components/ActivationCharts';
import {
  NetworkCanvas,
  type NetworkConnection,
  type NetworkLayer,
} from '../../components/NetworkCanvas';
import { usePersistedActivity } from '../../components/usePersistedActivity';
import {
  formatNumber,
  formatSigned,
  makeShallowModel,
  makeShallowNeuron,
  shallowEquivalent,
  type ShallowModel,
} from '../../model/activationMath';

const STATE_KEY = 'activity:activation-linear-shallow';

interface ShallowSnapshot {
  model: ShallowModel;
  completed: boolean;
}

function createInitialSnapshot(): ShallowSnapshot {
  return { model: makeShallowModel(1), completed: false };
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
      }],
    },
    {
      title: `线性层 (${model.neurons.length})`,
      nodes: model.neurons.map((neuron, index) => {
        return {
          label: `h1.${index + 1}`,
          tone: 'hidden' as const,
          activation: 'linear',
          details: {
            title: `线性层 1 · h1.${index + 1}`,
            body: '这个节点先对变量 x 做一次线性变换，再把结果传向输出节点。',
            content: (
              <div className="hidden-node-calculation">
                <div>
                  <Typography as="span" variant="body" tone="muted">节点输出</Typography>
                  <Typography as="code" variant="body" tone="accent" wrap="nowrap">h1.{index + 1} = {formatNumber(neuron.w)}x {formatSigned(neuron.b)}</Typography>
                </div>
                <div>
                  <Typography as="span" variant="body" tone="muted">输出权重</Typography>
                  <Typography as="code" variant="body" tone="warning" wrap="nowrap">v1.{index + 1} = {formatNumber(neuron.v)}</Typography>
                </div>
                <div>
                  <Typography as="span" variant="body" tone="muted">送入 y</Typography>
                  <Typography as="code" variant="body" tone="success" wrap="nowrap">v1.{index + 1}h1.{index + 1} = {formatNumber(neuron.v)}h1.{index + 1}</Typography>
                </div>
              </div>
            ),
          },
        };
      }),
    },
    {
      title: '输出 (1)',
      nodes: [{
        label: 'y',
        tone: 'output',
        details: {
          title: '输出节点 y',
          body: '把各隐藏节点作为变量统一加权，再加上输出偏置。',
          content: (
            <div className="output-matrix">
              <div className="output-matrix__formula" aria-label="y 等于输出权重行向量乘隐藏层列向量，再加偏置 c">
                <Typography as="code" variant="subtitle" tone="main" wrap="nowrap">y =</Typography>
                <div className="output-matrix__row-vector">
                  {model.neurons.map((neuron, index) => <Typography as="code" variant="body" tone="warning" wrap="nowrap" title={`v${index + 1}`} key={index}>{formatNumber(neuron.v)}</Typography>)}
                </div>
                <div className="output-matrix__column-vector">
                  {model.neurons.map((_, index) => <Typography as="code" variant="body" tone="accent" wrap="nowrap" key={index}>h1.{index + 1}</Typography>)}
                </div>
                <Typography as="code" variant="subtitle" tone="main" wrap="nowrap">+ {formatNumber(model.outputBias)}</Typography>
              </div>
            </div>
          ),
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
    });
    connections.push({
      fromLayer: 1,
      fromIndex: index,
      toLayer: 2,
      toIndex: 0,
      weight: neuron.v,
    });
  });
  return { layers, connections };
}

export interface ShallowLinearPageProps {
  onComplete: () => void;
}

export function ShallowLinearPage({ onComplete }: ShallowLinearPageProps) {
  const rootRef = useRef<HTMLElement | null>(null);
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
  const equivalent = useMemo(
    () => model ? shallowEquivalent(model) : null,
    [model],
  );
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
  return (
    <ContentBlock
      ref={rootRef}
      headingLevel={1}
      className="activation-network-lab ng-shallow-linear"
      title="多个线性神经元的叠加"
      subtitle="把多个线性神经元写进矩阵，观察增加神经元能否改变线性输出的形状。"
      data-telemetry-manual
      aria-busy={!hydrated}
    >
      <div className="activation-actions">
        <Button variant="primary" disabled={!hydrated || !model || count >= 3} onClick={addNeuron}>
          添加神经元
        </Button>
        <Button disabled={!hydrated || !model || count <= 1} onClick={removeNeuron}>
          删减神经元
        </Button>
        <Button disabled={!hydrated || !model} onClick={randomizeWeights}>
          随机权重
        </Button>
      </div>
      {!model || !equivalent ? (
        <NoticeStrip tone="blue">
          <Typography variant="body" tone="inherit">正在恢复已保存的随机参数…</Typography>
        </NoticeStrip>
      ) : (
        <div className="activation-network-stage">
          <section className="activation-network-panel">
            <header className="activation-panel-head">
              <Typography as="h3" variant="subtitle" tone="main">先看输出的形状</Typography>
              <Typography as="span" variant="body" tone="muted">增加神经元，直线会弯曲吗？</Typography>
            </header>
            <div className="activation-visual-box">
              <FormulaBlock
                className="activation-plot-formula"
                ariaLabel={`当前函数为 y 等于 ${formatNumber(equivalent.slope)} x ${formatSigned(equivalent.intercept)}`}
                formula={(
                  <span className="activation-plot-formula-content">
                    <Typography as="span" variant="body" tone="muted">
                      当前函数
                    </Typography>
                    <Typography as="span" variant="subtitle" tone="main">
                      y = {formatNumber(equivalent.slope)}x {formatSigned(equivalent.intercept)}
                    </Typography>
                  </span>
                )}
              />
              <ShallowOutputPlot model={model} />
            </div>
          </section>

          <section className="activation-network-panel">
            <header className="activation-panel-head">
              <Typography as="h3" variant="subtitle" tone="main">把一个神经元扩展成多个</Typography>
              <Typography as="span" variant="body" tone="muted">悬浮节点查看每一步加权</Typography>
            </header>
            <div className="activation-visual-box activation-visual-box--model">
              <NetworkCanvas
                layers={canvas.layers}
                connections={canvas.connections}
                ariaLabel="无激活函数网络结构"
                caption="每个节点都只做线性运算；多个线性结果再次加权，仍然只能合并成一条直线"
                height={430}
              />
            </div>
          </section>
        </div>
      )}
    </ContentBlock>
  );
}




