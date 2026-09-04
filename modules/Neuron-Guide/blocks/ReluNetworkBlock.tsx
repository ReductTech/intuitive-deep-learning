import { useMemo, useRef } from 'react';
import { Button, LessonStage, NoticeStrip, Typography } from '../../shared/react';
import { ReluNetworkPlot } from '../components/ActivationCharts';
import {
  NetworkCanvas,
  type NetworkConnection,
  type NetworkLayer,
} from '../components/NetworkCanvas';
import { usePersistedActivity } from '../components/usePersistedActivity';
import {
  formatNumber,
  formatSigned,
  MAX_RELU_NEURON_COUNT,
  MIN_RELU_NEURON_COUNT,
  RELU_OUTPUT_BIAS,
  type ShallowNeuron,
} from '../model/activationMath';
import '../linear-network.css';

const STATE_KEY = 'activity:neuron-guide-relu-network-v1';

interface ReluNetworkSnapshot {
  count: number;
  neurons: ShallowNeuron[];
  completed: boolean;
}

function createReluNeuron(index: number): ShallowNeuron {
  const w = 0.72 + Math.random() * 0.58;
  const spacing = 1.6 / MAX_RELU_NEURON_COUNT;
  const center = -0.8 + spacing * (index + 0.5);
  const kink = Math.max(-0.92, Math.min(0.92, center + (Math.random() - 0.5) * spacing * 0.72));
  const magnitude = 0.38 + Math.random() * 0.58;
  return {
    w,
    b: -w * kink,
    v: Math.random() > 0.42 ? magnitude : -magnitude,
  };
}

function createReluNeurons(): ShallowNeuron[] {
  return Array.from({ length: MAX_RELU_NEURON_COUNT }, (_, index) => createReluNeuron(index));
}

function createInitialSnapshot(): ReluNetworkSnapshot {
  return { count: MIN_RELU_NEURON_COUNT, neurons: createReluNeurons(), completed: false };
}

function normalizeSnapshot(value: unknown): ReluNetworkSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<ReluNetworkSnapshot>;
  const count = Number(candidate.count);
  if (!Number.isFinite(count) || !Array.isArray(candidate.neurons)) return null;
  const neurons = candidate.neurons.filter((neuron): neuron is ShallowNeuron => (
    Boolean(neuron)
    && typeof neuron === 'object'
    && Number.isFinite(Number(neuron.w))
    && Number.isFinite(Number(neuron.b))
    && Number.isFinite(Number(neuron.v))
  ));
  if (neurons.length !== MAX_RELU_NEURON_COUNT) return null;
  const normalizedCount = Math.max(
    MIN_RELU_NEURON_COUNT,
    Math.min(MAX_RELU_NEURON_COUNT, Math.trunc(count)),
  );
  return {
    count: normalizedCount,
    neurons: neurons.map(({ w, b, v }) => ({ w: Number(w), b: Number(b), v: Number(v) })),
    completed: Boolean(candidate.completed || normalizedCount >= MAX_RELU_NEURON_COUNT),
  };
}

function buildCanvas(count: number, allNeurons: readonly ShallowNeuron[]): { layers: NetworkLayer[]; connections: NetworkConnection[] } {
  const neurons = allNeurons.slice(0, count);
  const layers: NetworkLayer[] = [
    {
      title: '输入 (1)',
      nodes: [{
        label: 'x',
        tone: 'input',
      }],
    },
    {
      title: `ReLU 层 (${count})`,
      nodes: neurons.map((neuron, index) => ({
        label: `h1.${index + 1}`,
        tone: 'relu' as const,
        activation: 'relu',
        details: {
          title: `ReLU 层 1 · h1.${index + 1}`,
          body: '这个节点先完成线性变换，再用 ReLU 决定是否输出。',
          content: (
            <div className="ng-hidden-node-calculation">
              <div>
                <Typography as="span" variant="bodySmall" tone="muted">线性结果</Typography>
                <Typography as="code" variant="bodySmall" tone="accent" wrap="nowrap">z1.{index + 1} = {formatNumber(neuron.w)}x {formatSigned(neuron.b)}</Typography>
              </div>
              <div>
                <Typography as="span" variant="bodySmall" tone="muted">节点输出</Typography>
                <Typography as="code" variant="bodySmall" tone="success" wrap="nowrap">h1.{index + 1} = ReLU(z1.{index + 1})</Typography>
              </div>
              <div>
                <Typography as="span" variant="bodySmall" tone="muted">输出权重</Typography>
                <Typography as="code" variant="bodySmall" tone="warning" wrap="nowrap">v1.{index + 1} = {formatNumber(neuron.v)}</Typography>
              </div>
            </div>
          ),
        },
      })),
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
            <div className="ng-output-matrix">
              <div className="ng-output-matrix__formula" aria-label="y 等于输出权重行向量乘 ReLU 层输出列向量，再加输出偏置">
                <Typography as="code" variant="subtitle" tone="main" wrap="nowrap">y =</Typography>
                <div className="ng-output-matrix__row-vector">
                  {neurons.map((neuron, index) => <Typography as="code" variant="bodySmall" tone="warning" wrap="nowrap" title={`v1.${index + 1}`} key={index}>{formatNumber(neuron.v)}</Typography>)}
                </div>
                <div className="ng-output-matrix__column-vector">
                  {neurons.map((_, index) => <Typography as="code" variant="bodySmall" tone="accent" wrap="nowrap" key={index}>h1.{index + 1}</Typography>)}
                </div>
                <Typography as="code" variant="subtitle" tone="main" wrap="nowrap">+ {formatNumber(RELU_OUTPUT_BIAS)}</Typography>
              </div>
            </div>
          ),
        },
      }],
    },
  ];
  const connections: NetworkConnection[] = [];
  neurons.forEach((neuron, index) => {
    connections.push({ fromLayer: 0, fromIndex: 0, toLayer: 1, toIndex: index, weight: neuron.w });
    connections.push({ fromLayer: 1, fromIndex: index, toLayer: 2, toIndex: 0, weight: neuron.v });
  });
  return { layers, connections };
}

export interface ReluNetworkBlockProps {
  onComplete: () => void;
}

export function ReluNetworkBlock({ onComplete }: ReluNetworkBlockProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const { state, hydrated, commit } = usePersistedActivity<ReluNetworkSnapshot>({
    stateKey: STATE_KEY,
    createInitial: createInitialSnapshot,
    normalizeState: normalizeSnapshot,
    getElement: () => rootRef.current,
  });
  const count = state?.count ?? MIN_RELU_NEURON_COUNT;
  const canvas = useMemo(() => buildCanvas(count, state?.neurons ?? []), [count, state?.neurons]);

  const changeCount = (nextCount: number, operation: 'add' | 'remove') => {
    if (!state) return;
    const boundedCount = Math.max(MIN_RELU_NEURON_COUNT, Math.min(MAX_RELU_NEURON_COUNT, nextCount));
    const completed = state.completed || boundedCount >= MAX_RELU_NEURON_COUNT;
    const neurons = [...state.neurons];
    if (operation === 'add' && boundedCount > state.count) {
      neurons[boundedCount - 1] = createReluNeuron(boundedCount - 1);
    }
    const next = { ...state, count: boundedCount, neurons, completed };
    commit(`neuron_guide_relu_neuron_${operation}`, next, {
      neuron_count: boundedCount,
      operation,
    });
    if (!state.completed && completed) onComplete();
  };

  const randomize = () => {
    if (!state) return;
    commit('neuron_guide_relu_parameters_randomize', {
      ...state,
      neurons: createReluNeurons(),
    }, { neuron_count: state.count });
  };

  return (
    <LessonStage
      ref={rootRef}
      className="af-react-network-lab ng-relu-network"
      title="组合多个带有 ReLU 的神经元，曲线继续弯折"
      description="每个神经元都有自己的 w 和 b，因此会在不同的 x 位置由抑制切换为激活。添加一个神经元，就是向总输出加入一段从新位置开始的直线，曲线的斜率会在那里改变一次。"
      descriptionVariant="bodySmall"
      actions={(
        <div className="af-react-actions">
          <Button
            variant="primary"
            disabled={!hydrated || !state || count >= MAX_RELU_NEURON_COUNT}
            onClick={() => changeCount(count + 1, 'add')}
          >
            添加神经元
          </Button>
          <Button
            disabled={!hydrated || !state || count <= MIN_RELU_NEURON_COUNT}
            onClick={() => changeCount(count - 1, 'remove')}
          >
            删除神经元
          </Button>
          <Button disabled={!hydrated || !state} onClick={randomize}>随机参数</Button>
        </div>
      )}
      data-telemetry-manual
      aria-busy={!hydrated}
    >
      {!state ? (
        <NoticeStrip tone="blue"><Typography variant="bodySmall" tone="inherit">正在恢复神经元数量…</Typography></NoticeStrip>
      ) : (
        <div className="af-react-network-stage">
          <section className="af-react-network-panel">
            <header className="af-react-panel-head">
              <Typography as="h3" variant="subtitle" tone="main">从一个折点到多个折点</Typography>
              <Typography as="span" variant="bodySmall" tone="muted">虚线对应每个神经元的响应起点</Typography>
            </header>
            <div className="af-react-visual-box">
              <ReluNetworkPlot count={count} neurons={state.neurons} />
            </div>
          </section>

          <section className="af-react-network-panel">
            <header className="af-react-panel-head">
              <Typography as="h3" variant="subtitle" tone="main">把多个 ReLU 神经元组合起来</Typography>
              <Typography as="span" variant="bodySmall" tone="muted">悬浮节点，对照左侧同名折点</Typography>
            </header>
            <div className="af-react-visual-box af-react-visual-box--model">
              <NetworkCanvas
                layers={canvas.layers}
                connections={canvas.connections}
                ariaLabel="多个 ReLU 神经元组合形成分段线性输出"
                caption="每个神经元贡献一个折点；多个折点让输出形成更丰富的分段线性形状"
                height={430}
              />
            </div>
          </section>
        </div>
      )}
    </LessonStage>
  );
}
