import { useMemo, useRef } from 'react';
import { Button, LessonStage, NoticeStrip } from '../../shared/react';
import { ReluNetworkPlot } from '../components/ActivationCharts';
import {
  NetworkCanvas,
  type NetworkConnection,
  type NetworkLayer,
} from '../components/NetworkCanvas';
import { usePersistedActivity } from '../components/usePersistedActivity';
import {
  activeReluNeurons,
  formatNumber,
  formatSigned,
  MAX_RELU_NEURON_COUNT,
  MIN_RELU_NEURON_COUNT,
  RELU_BASE_SLOPE,
  RELU_OUTPUT_BIAS,
  reluKink,
} from '../model/activationMath';

const STATE_KEY = 'activity:activation-relu-network';

interface ReluNetworkSnapshot {
  count: number;
  approximationUnlocked: boolean;
}

function createInitialSnapshot(): ReluNetworkSnapshot {
  return {
    count: MIN_RELU_NEURON_COUNT,
    approximationUnlocked: false,
  };
}

function normalizeSnapshot(value: unknown): ReluNetworkSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<ReluNetworkSnapshot>;
  const count = Number(candidate.count);
  if (!Number.isFinite(count)) return null;
  if (
    candidate.approximationUnlocked !== undefined
    && typeof candidate.approximationUnlocked !== 'boolean'
  ) {
    return null;
  }
  const normalizedCount = Math.max(
    MIN_RELU_NEURON_COUNT,
    Math.min(MAX_RELU_NEURON_COUNT, Math.trunc(count)),
  );
  return {
    count: normalizedCount,
    approximationUnlocked: Boolean(
      candidate.approximationUnlocked || normalizedCount >= MAX_RELU_NEURON_COUNT,
    ),
  };
}

function buildCanvas(
  count: number,
): { layers: NetworkLayer[]; connections: NetworkConnection[] } {
  const neurons = activeReluNeurons(count);
  const layers: NetworkLayer[] = [
    {
      title: '输入 (1)',
      nodes: [{
        label: 'x',
        tone: 'input',
        details: {
          title: '输入节点 x',
          body: '输入值沿着每条边送入隐藏层中的神经元。',
          code: 'a0 = x',
        },
      }],
    },
    {
      title: `隐藏层 (${count})`,
      nodes: neurons.map((neuron, index) => ({
        label: `H${index + 1}`,
        tone: 'relu' as const,
        activation: 'relu',
        details: {
          title: `隐藏层神经元 ${index + 1}`,
          body: '这个神经元先做线性计算，再经过 ReLU。折点出现在 wx + b = 0 的位置。',
          code: `h${index + 1} = ReLU(${formatNumber(neuron.w)}x ${formatSigned(neuron.b)})\n折点 x = ${formatNumber(reluKink(neuron))}\ny += ${formatNumber(neuron.v)}h${index + 1}`,
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
          body: '多个隐藏层神经元的输出相加后形成分段线性曲线，折点会叠加。',
          code: `y = ${formatNumber(RELU_BASE_SLOPE)}x + Σ(vh) ${formatSigned(RELU_OUTPUT_BIAS)}`,
        },
      }],
    },
  ];
  const connections: NetworkConnection[] = [];
  neurons.forEach((neuron, index) => {
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

export interface ReluNetworkBlockProps {
  onComplete: () => void;
}

export function ReluNetworkBlock({ onComplete }: ReluNetworkBlockProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const {
    state,
    hydrated,
    commit,
  } = usePersistedActivity<ReluNetworkSnapshot>({
    stateKey: STATE_KEY,
    createInitial: createInitialSnapshot,
    normalizeState: normalizeSnapshot,
    getElement: () => rootRef.current,
  });
  const count = state?.count ?? MIN_RELU_NEURON_COUNT;
  const canvas = useMemo(() => buildCanvas(count), [count]);

  const addNeuron = () => {
    if (!state || state.count >= MAX_RELU_NEURON_COUNT) return;
    const nextCount = Math.min(MAX_RELU_NEURON_COUNT, state.count + 1);
    const unlocked = state.approximationUnlocked
      || nextCount >= MAX_RELU_NEURON_COUNT;
    const next: ReluNetworkSnapshot = {
      count: nextCount,
      approximationUnlocked: unlocked,
    };
    commit('activation_relu_neuron_add', next, {
      neuron_count: nextCount,
      approximation_unlocked: unlocked,
    });
    if (!state.approximationUnlocked && unlocked) onComplete();
  };

  const reset = () => {
    if (!state || state.count === MIN_RELU_NEURON_COUNT) return;
    const next: ReluNetworkSnapshot = {
      count: MIN_RELU_NEURON_COUNT,
      approximationUnlocked: state.approximationUnlocked,
    };
    commit('activation_relu_network_reset', next, {
      neuron_count: MIN_RELU_NEURON_COUNT,
      approximation_unlocked: next.approximationUnlocked,
    });
  };

  return (
    <LessonStage
      ref={rootRef}
      className="af-react-network-lab"
      title="组合多个带有 ReLU 的神经元，曲线继续弯折"
      description="刚才 ReLU 把负数截成了 0，并制造出一个折点。现在隐藏层中的每个神经元都会先计算 wx + b，再经过 ReLU：神经元越多，折点越多。"
      actions={(
        <div className="af-react-actions">
          <Button
            variant="primary"
            disabled={!hydrated || !state || count >= MAX_RELU_NEURON_COUNT}
            onClick={addNeuron}
          >
            添加带有 ReLU 的神经元
          </Button>
          <Button
            disabled={!hydrated || !state || count <= MIN_RELU_NEURON_COUNT}
            onClick={reset}
          >
            重置
          </Button>
        </div>
      )}
      data-telemetry-manual
      aria-busy={!hydrated}
    >
      {!state ? (
        <NoticeStrip tone="blue">
          正在恢复神经元数量…
        </NoticeStrip>
      ) : (
        <div className="af-react-network-stage">
          <section className="af-react-network-panel">
            <header className="af-react-panel-head">
              <h3>网络输出曲线</h3>
              <span>每个红色虚线是一个折点</span>
            </header>
            <div className="af-react-visual-box">
              <ReluNetworkPlot count={count} />
            </div>
            <NoticeStrip className="af-react-readout">
              当前隐藏层有 {count} 个带有 ReLU 的神经元，最多 {MAX_RELU_NEURON_COUNT} 个。
              每个神经元贡献一个折点。
            </NoticeStrip>
          </section>

          <section className="af-react-network-panel">
            <header className="af-react-panel-head">
              <h3>隐藏层结构</h3>
              <span>悬浮节点查看参数</span>
            </header>
            <div className="af-react-visual-box af-react-visual-box--model">
              <NetworkCanvas
                layers={canvas.layers}
                connections={canvas.connections}
                ariaLabel="包含带有 ReLU 的神经元的隐藏层结构"
                caption="h = ReLU(wx + b)，y = Σvh + c"
                height={430}
              />
            </div>
            <NoticeStrip className="af-react-readout">
              {count < MAX_RELU_NEURON_COUNT
                ? '继续向隐藏层添加带有 ReLU 的神经元，左侧曲线会多一个折点，整体越来越弯。'
                : '隐藏层已经有 5 个带有 ReLU 的神经元了。曲线已经由多段线性片段拼起来，可以继续观察更多神经元会发生什么。'}
            </NoticeStrip>
          </section>
        </div>
      )}
    </LessonStage>
  );
}
