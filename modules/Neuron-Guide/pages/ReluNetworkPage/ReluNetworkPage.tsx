import { useMemo, useRef } from 'react';
import "./ReluNetworkPage.css";
import { Button, ContentBlock, NoticeStrip, Typography } from '../../../shared/react';
import { ReluNetworkPlot, usePersistedActivity } from '../ActivationCatalogPage/ActivationCatalogPage';
import {
  NetworkCanvas,
  type NetworkConnection,
  type NetworkLayer,
} from '../NetworkCanvas/NetworkCanvas';
import {
  formatNumber,
  formatSigned,
  formatSubscript,
  MAX_RELU_NEURON_COUNT,
  MIN_RELU_NEURON_COUNT,
  RELU_OUTPUT_BIAS,
  type ShallowNeuron,
} from '../ActivationCatalogPage/ActivationCatalogPage';

const STATE_KEY = 'activity:neuron-guide-relu-ng-network-v1';

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
        details: {
          title: '输入 x',
          body: '同一个输入 x 送给每个神经元；每个神经元用自己的权重 wᵢ 和偏置 bᵢ 处理它。',
        },
      }],
    },
    {
      title: `ReLU 层 (${count})`,
      nodes: neurons.map((neuron, index) => ({
        label: `h${index + 1}`,
        tone: 'relu' as const,
        activation: 'relu',
        details: {
          title: `h${index + 1} 的 ReLU 输出`,
          content: (
            <Typography as="code" variant="body" tone="inherit" wrap="nowrap">
              {`h${index + 1} = ReLU(w${formatSubscript(index + 1)}x + b${formatSubscript(index + 1)})`}
              <br />
              {`\u00A0\u00A0\u00A0= ReLU(${formatNumber(neuron.w)}x ${formatSigned(neuron.b)})`}
            </Typography>
          ),
          body: `w${formatSubscript(index + 1)} 给输入 x 加权，b${formatSubscript(index + 1)} 决定折点位置。`,
        },
      })),
    },
    {
      title: '输出 (1)',
      nodes: [{
        label: 'y',
        tone: 'output',
        details: {
          title: '最终输出 y',
          content: (
            <Typography as="code" variant="body" tone="inherit" wrap="nowrap">
              y = Σ vᵢhᵢ {formatSigned(RELU_OUTPUT_BIAS)}
            </Typography>
          ),
          body: 'hᵢ 是第 i 个 ReLU 神经元的输出，vᵢ 是它连到 y 的权重：把每个 hᵢ 按自己的 vᵢ 加权后相加，就得到 y。',
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

export interface ReluNetworkPageProps {
  onComplete: () => void;
}

export function ReluNetworkPage({ onComplete }: ReluNetworkPageProps) {
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
    <ContentBlock
      ref={rootRef}
      headingLevel={1}
      className="ng-activation-network-lab ng-relu-network"
      title="组合多个带有 ReLU 的神经元，曲线继续弯折"
      subtitle="每个神经元有自己的 w 和 b，会在不同的 x 位置由抑制切换为激活；再加一个神经元，曲线就多一个折点。"
      data-telemetry-manual
      aria-busy={!hydrated}
    >
      {!state ? (
        <NoticeStrip tone="blue"><Typography variant="body" tone="inherit">正在恢复神经元数量…</Typography></NoticeStrip>
      ) : (
        <>
          <div className="ng-relu-toolbar">
            <div className="ng-relu-toolbar__context">
              <Typography as="span" variant="body" tone="muted">当前结构：</Typography>
              <Typography as="strong" variant="body" tone="accent">{count} 个 ReLU 神经元</Typography>
              <Typography as="span" variant="body" tone="muted">汇合为</Typography>
              <Typography as="strong" variant="body" tone="success">1 个输出</Typography>
            </div>
            <div className="ng-activation-actions" aria-label="调整网络结构">
              <Button variant="primary" disabled={!hydrated || count >= MAX_RELU_NEURON_COUNT} onClick={() => changeCount(count + 1, 'add')}>
                添加神经元
              </Button>
              <Button disabled={!hydrated || count <= MIN_RELU_NEURON_COUNT} onClick={() => changeCount(count - 1, 'remove')}>
                删除神经元
              </Button>
              <Button disabled={!hydrated} onClick={randomize}>随机参数</Button>
            </div>
          </div>

          <div className="ng-activation-network-stage">
            <section className="ng-activation-network-panel ng-relu-panel ng-relu-panel--network" aria-label="网络结构">
              <header className="ng-activation-panel-head">
                <Typography as="h3" variant="subtitle" tone="main">把多个 ReLU 神经元组合起来</Typography>
                <Typography as="span" variant="bodySmall" tone="muted">hᵢ = ReLU(wᵢx + bᵢ)</Typography>
              </header>
              <div className="ng-activation-visual-box ng-activation-visual-box--model">
                <NetworkCanvas
                  layers={canvas.layers}
                  connections={canvas.connections}
                  ariaLabel="多个 ReLU 神经元组合形成分段线性输出"
                  caption="圆点表示计算，悬停节点看 wᵢ、bᵢ、vᵢ"
                  height={410}
                  fontScale={1.15}
                />
              </div>
            </section>

            <section className="ng-activation-network-panel ng-relu-panel ng-relu-panel--plot" aria-label="输出曲线">
              <header className="ng-activation-panel-head">
                <Typography as="h3" variant="subtitle" tone="main">从一个折点到多个折点</Typography>
                <Typography as="span" variant="bodySmall" tone="muted">虚线对应每个神经元的响应起点</Typography>
              </header>
              <div className="ng-activation-visual-box">
                <ReluNetworkPlot count={count} neurons={state.neurons} />
              </div>
            </section>
          </div>

          <div className="ng-relu-conclusion">
            <Typography as="strong" variant="subtitle" tone="success">结论</Typography>
            <Typography variant="body" tone="main">每个 ReLU 神经元贡献一个折点，折点越多，输出越接近任意曲线。</Typography>
          </div>
        </>
      )}
    </ContentBlock>
  );
}
