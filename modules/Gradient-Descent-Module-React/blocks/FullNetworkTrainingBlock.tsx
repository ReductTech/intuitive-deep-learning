import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Callout,
  ContentBlock,
  MathFormulaBlock,
  MathFormulaStatic,
  PlotlyChart,
  TextInput,
  Typography,
} from '../../shared/react';
import { emitTelemetry, getTelemetryState } from '../../shared/react/telemetry';
import { GradientNetworkDiagram } from '../components/GradientNetworkDiagram';
import {
  CLOSE_LOSS_THRESHOLD,
  INITIAL_FULL_WEIGHTS,
  forwardFullNetwork,
  searchLearningSchedule,
  stepFullNetwork,
  type FullWeights,
} from '../model/gradientMath';

export interface FullNetworkTrainingBlockProps {
  onComplete: () => void;
}

interface FullNetworkSnapshot {
  target: number | null;
  targetInput: string;
  weights: FullWeights;
  rate: number;
  decay: number;
  lossHistory: number[];
  hasTrained: boolean;
  converged: boolean;
}

const stateKey = 'activity:gd-full-network';
const FULL_CHART_CONFIG = { scrollZoom: false };

function initialSnapshot(): FullNetworkSnapshot {
  return {
    target: null,
    targetInput: '',
    weights: { ...INITIAL_FULL_WEIGHTS },
    rate: 0.1,
    decay: 0.5,
    lossHistory: [],
    hasTrained: false,
    converged: false,
  };
}

function finite(value: unknown, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function rateText(value: number) {
  return value >= 0.01 ? value.toFixed(2) : value.toPrecision(2);
}

function restoreWeights(value: unknown): FullWeights {
  const record = typeof value === 'object' && value !== null
    ? value as Partial<Record<keyof FullWeights, unknown>>
    : {};
  return {
    w11: finite(record.w11, INITIAL_FULL_WEIGHTS.w11),
    w21: finite(record.w21, INITIAL_FULL_WEIGHTS.w21),
    w12: finite(record.w12, INITIAL_FULL_WEIGHTS.w12),
    w22: finite(record.w22, INITIAL_FULL_WEIGHTS.w22),
    v1: finite(record.v1, INITIAL_FULL_WEIGHTS.v1),
    v2: finite(record.v2, INITIAL_FULL_WEIGHTS.v2),
  };
}

function restoreSnapshot(value: unknown): FullNetworkSnapshot {
  if (typeof value !== 'object' || value === null) return initialSnapshot();
  const record = value as Partial<FullNetworkSnapshot>;
  const restoredTarget = record.target === null ? null : Number(record.target);
  const target = restoredTarget === null || Number.isFinite(restoredTarget) ? restoredTarget : null;
  const weights = restoreWeights(record.weights);
  const forward = forwardFullNetwork(weights, target);
  const lossHistory = Array.isArray(record.lossHistory)
    ? record.lossHistory.map(Number).filter(Number.isFinite)
    : [];
  const converged = target !== null
    && (record.converged === true || (forward.loss ?? Number.POSITIVE_INFINITY) < CLOSE_LOSS_THRESHOLD);
  return {
    target,
    targetInput: typeof record.targetInput === 'string'
      ? record.targetInput
      : target === null ? '' : String(target),
    weights,
    rate: Math.max(0, finite(record.rate, 0.1)),
    decay: Math.max(0, finite(record.decay, 0.5)),
    lossHistory: lossHistory.length || forward.loss === null ? lossHistory : [forward.loss],
    hasTrained: record.hasTrained === true,
    converged,
  };
}

export function FullNetworkTrainingBlock({ onComplete }: FullNetworkTrainingBlockProps) {
  const [snapshot, setSnapshot] = useState<FullNetworkSnapshot>(initialSnapshot);
  const [targetDraft, setTargetDraft] = useState('');
  const [targetError, setTargetError] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [training, setTraining] = useState(false);
  const [targetCommitted, setTargetCommitted] = useState(true);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const targetDirtyRef = useRef(false);
  const completionSentRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const snapshotRef = useRef(snapshot);

  useEffect(() => {
    let active = true;
    void getTelemetryState<FullNetworkSnapshot>(stateKey).then((entry) => {
      if (!active) return;
      const restored = restoreSnapshot(entry?.state);
      snapshotRef.current = restored;
      setSnapshot(restored);
      setTargetDraft(restored.targetInput);
      setTargetError(
        restored.target === null && restored.targetInput.trim()
          ? '请输入一个有效数字。'
          : '',
      );
      targetDirtyRef.current = false;
      setTargetCommitted(true);
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const readyToComplete = snapshot.target !== null && (snapshot.hasTrained || snapshot.converged);
  useEffect(() => {
    if (
      !hydrated
      || !targetCommitted
      || !readyToComplete
      || completionSentRef.current
    ) {
      return;
    }
    completionSentRef.current = true;
    onComplete();
  }, [hydrated, onComplete, readyToComplete, targetCommitted]);

  const forward = forwardFullNetwork(snapshot.weights, snapshot.target);
  const chartData = useMemo(() => [{
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Loss',
    x: snapshot.lossHistory.map((_, index) => index),
    y: snapshot.lossHistory,
    line: { color: '#f07e47', width: 3 },
    marker: { color: '#f07e47', size: 7, line: { color: '#ffffff', width: 2 } },
    hovertemplate: '训练 %{x}<br>Loss %{y:.4f}<extra></extra>',
  }], [snapshot.lossHistory]);
  const chartLayout = useMemo(() => ({
    margin: { l: 42, r: 12, t: 10, b: 36 },
    xaxis: {
      title: '训练次数',
      range: [0, Math.max(4, snapshot.lossHistory.length)],
      gridcolor: '#dfe6f1',
      zerolinecolor: '#9fb0c8',
    },
    yaxis: {
      title: 'Loss',
      range: [
        0,
        Math.max(1, Math.max(...snapshot.lossHistory, 1) * 1.08),
      ],
      gridcolor: '#dfe6f1',
      zerolinecolor: '#9fb0c8',
    },
    paper_bgcolor: 'transparent',
    plot_bgcolor: '#fbfdff',
    showlegend: false,
  }), [snapshot.lossHistory]);

  const emitSnapshot = (
    eventName: string,
    next: FullNetworkSnapshot,
    properties: Record<string, unknown> = {},
  ) => {
    snapshotRef.current = next;
    setSnapshot(next);
    emitTelemetry(eventName, rootRef.current, {
      state_key: stateKey,
      state: next,
      ...properties,
    });
  };

  const applyTargetDraft = (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      const next = initialSnapshot();
      setTargetError('');
      completionSentRef.current = false;
      snapshotRef.current = next;
      setSnapshot(next);
      return next;
    }

    const target = Number(trimmed);
    if (!Number.isFinite(target)) {
      const next = {
        ...initialSnapshot(),
        targetInput: rawValue,
      };
      setTargetError('请输入一个有效数字。');
      completionSentRef.current = false;
      snapshotRef.current = next;
      setSnapshot(next);
      return next;
    }

    const schedule = searchLearningSchedule(target);
    const weights = { ...INITIAL_FULL_WEIGHTS };
    const nextForward = forwardFullNetwork(weights, target);
    const converged = (nextForward.loss ?? Number.POSITIVE_INFINITY) < CLOSE_LOSS_THRESHOLD;
    const next: FullNetworkSnapshot = {
      target,
      targetInput: rawValue,
      weights,
      rate: schedule.rate,
      decay: schedule.decay,
      lossHistory: nextForward.loss === null ? [] : [nextForward.loss],
      hasTrained: false,
      converged,
    };
    setTargetError('');
    completionSentRef.current = false;
    snapshotRef.current = next;
    setSnapshot(next);
    return next;
  };

  const commitTarget = () => {
    if (!hydrated || !targetDirtyRef.current || training) return;
    targetDirtyRef.current = false;
    setTargetCommitted(true);
    const next = snapshotRef.current;
    const initialForward = forwardFullNetwork(next.weights, next.target);
    emitSnapshot('full_target_commit', next, {
      target: next.target,
      target_valid: next.target !== null,
      selected_rate: next.target === null ? undefined : next.rate,
      selected_decay: next.target === null ? undefined : next.decay,
      initial_loss: initialForward.loss,
      converged: next.converged,
    });
  };

  const trainOnce = () => {
    if (snapshot.target === null || snapshot.converged || training) return;
    setTraining(true);
    const delay = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 520;
    timerRef.current = window.setTimeout(() => {
      const update = stepFullNetwork(
        snapshot.weights,
        snapshot.target as number,
        snapshot.rate,
        snapshot.decay,
      );
      const afterLoss = update.after.loss ?? 0;
      const next: FullNetworkSnapshot = {
        ...snapshot,
        weights: update.weights,
        rate: update.nextRate,
        lossHistory: [...snapshot.lossHistory, afterLoss],
        hasTrained: snapshot.hasTrained || update.didUpdate,
        converged: afterLoss < CLOSE_LOSS_THRESHOLD,
      };
      emitSnapshot('full_train_step', next, {
        training_step: next.lossHistory.length - 1,
        before_loss: update.before.loss,
        after_loss: update.after.loss,
        rate: update.rate,
        next_rate: update.nextRate,
        converged: next.converged,
      });
      setTraining(false);
      timerRef.current = null;
    }, delay);
  };

  return (
    <div ref={rootRef} data-telemetry-manual aria-busy={!hydrated}>
      <ContentBlock
        className="gd-react-block gd-react-full-block"
        title="现在，让整个网络一起学习"
        subtitle="很多情况下，网络里的所有参数都可以用同样的方法更新。"
      >
      <section
        className="gd-react-rigor-note"
        aria-labelledby="gd-network-objective-title"
      >
        <Typography
          as="h3"
          variant="h3"
          tone="accent"
          id="gd-network-objective-title"
        >
          从一个样本推广到真实训练目标
        </Typography>
        <Typography variant="bodySmall">
          本页用一个输入与一个 GT 展示完整更新。真实训练通常先把 m 个训练样本的损失取平均，得到经验风险 J(θ)；其中 θ 统一表示网络中全部可学习参数。
        </Typography>
        <dl className="gd-react-definition-list">
          <div>
            <Typography as="dt" variant="label" tone="accent">训练样本</Typography>
            <Typography as="dd" variant="bodySmall">一对用于学习的输入 xᵢ 与目标 yᵢ。单样本梯度只反映模型在这一对数据上的修正方向，可能与整个训练集的平均方向存在差异。</Typography>
          </div>
          <div>
            <Typography as="dt" variant="label" tone="accent">批量梯度下降</Typography>
            <Typography as="dd" variant="bodySmall">每次更新都使用整个训练集计算经验风险的准确梯度。方向确定，但当训练集很大时，一次更新的计算和存储代价较高。</Typography>
          </div>
          <div>
            <Typography as="dt" variant="label" tone="accent">随机梯度下降</Typography>
            <Typography as="dd" variant="bodySmall">每次随机抽取一个训练样本，用该样本的梯度估计训练集梯度并更新参数。单次计算成本低，但梯度估计的波动通常较大。</Typography>
          </div>
          <div>
            <Typography as="dt" variant="label" tone="accent">小批量梯度下降</Typography>
            <Typography as="dd" variant="bodySmall">每次使用随机抽取的一小批样本的平均梯度更新参数，是深度学习中最常见的训练方式。批量大小在梯度估计噪声、计算吞吐和显存占用之间形成权衡。</Typography>
          </div>
          <div>
            <Typography as="dt" variant="label" tone="accent">迭代与轮次</Typography>
            <Typography as="dd" variant="bodySmall">一次小批量更新称为一次迭代；训练数据被完整遍历一次通常称为一个 epoch。二者不能混用，一个 epoch 往往包含多次参数更新。</Typography>
          </div>
        </dl>
        <MathFormulaBlock ariaLabel="经验风险 J theta 等于 m 个样本损失的平均值，最优参数 theta star 是使 J 最小的参数">
          <MathFormulaStatic latex="J(\boldsymbol\theta)=\frac{1}{m}\sum_{i=1}^{m}\ell\!\left(y_i,f_{\boldsymbol\theta}(x_i)\right),\qquad \boldsymbol\theta^{*}=\underset{\boldsymbol\theta}{\operatorname{arg\,min}}\;J(\boldsymbol\theta)" />
        </MathFormulaBlock>
        <Typography variant="bodySmall">
          深度学习常从训练集中抽取小批量 Bₜ，用批内平均梯度近似整个训练集的梯度，再同时更新所有参数。本页相当于批量大小为 1 的教学示例。
        </Typography>
        <MathFormulaBlock ariaLabel="第 t 步的小批量梯度 g t 等于批内样本梯度的平均值，下一步参数等于当前参数减学习率乘 g t">
          <MathFormulaStatic latex="\boldsymbol g_t=\frac{1}{|\mathcal B_t|}\sum_{i\in\mathcal B_t}\nabla_{\boldsymbol\theta}\ell_i\!\left(\boldsymbol\theta^{(t)}\right),\qquad \boldsymbol\theta^{(t+1)}=\boldsymbol\theta^{(t)}-\eta_t\boldsymbol g_t" />
        </MathFormulaBlock>
      </section>

      <div className="gd-react-final-grid">
        <div className="gd-react-control-card gd-target-entry">
          <span className="edu-kicker">设置真实值 GT</span>
          <TextInput
            label="输入你喜欢的数字"
            type="number"
            step="any"
            value={targetDraft}
            disabled={!hydrated || training}
            placeholder="例如 31"
            hint
            aria-invalid={Boolean(targetError)}
            onChange={(event) => {
              const value = event.currentTarget.value;
              targetDirtyRef.current = true;
              setTargetCommitted(false);
              setTargetDraft(value);
              applyTargetDraft(value);
            }}
            onBlur={commitTarget}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
          />
          <small>{targetError || '输入后会自动选择稳定的训练参数。'}</small>
        </div>

        <section
          className="gd-react-control-card gd-react-full-loss-panel"
          aria-labelledby="gd-react-full-loss-title"
        >
          <h3 className="edu-panel-title" id="gd-react-full-loss-title">Loss</h3>
          <PlotlyChart
            data={chartData}
            layout={chartLayout}
            config={FULL_CHART_CONFIG}
            minHeight={142}
            aria-label="训练过程中 Loss 下降的训练指标曲线"
          />
        </section>

        <div className="gd-react-control-card gd-react-train-card">
          <span className="edu-kicker">训练操作</span>
          <div className="gd-react-rate-readout" aria-live="polite">
            <span>当前学习率</span>
            <strong>{rateText(snapshot.rate)}</strong>
            <small>每轮 × {snapshot.decay.toFixed(2)}</small>
          </div>
          <Button
            variant="primary"
            loading={training}
            disabled={!hydrated || snapshot.target === null || snapshot.converged}
            hint={snapshot.target !== null && !snapshot.converged}
            onClick={trainOnce}
          >
            {snapshot.converged ? '训练完成' : '训练一次'}
          </Button>
          <small>前馈 → Loss → 反向传播 → 全部参数更新</small>
        </div>
      </div>

      <GradientNetworkDiagram
        mode="full"
        weights={snapshot.weights}
        target={snapshot.target}
        updating={training}
      />

      <section
        className="gd-react-rigor-note"
        aria-labelledby="gd-backprop-title"
      >
        <Typography
          as="h3"
          variant="h3"
          tone="accent"
          id="gd-backprop-title"
        >
          反向传播负责求梯度，梯度下降负责更新参数
        </Typography>
        <Typography variant="bodySmall">
          反向传播沿计算图反向应用链式法则，计算每个参数对 Loss 的影响。例如，w₁₁ 通过隐藏量 h₁ 再影响输出 y，因此其梯度由路径上的局部导数相乘得到。
        </Typography>
        <dl className="gd-react-definition-list">
          <div>
            <Typography as="dt" variant="label" tone="accent">前向传播</Typography>
            <Typography as="dd" variant="bodySmall">按照网络连接方向，由输入和当前参数逐层计算隐藏表示、预测以及损失。它回答当前参数下模型输出什么。</Typography>
          </div>
          <div>
            <Typography as="dt" variant="label" tone="accent">反向传播</Typography>
            <Typography as="dd" variant="bodySmall">在已经完成的前向计算图上，反向复用链式法则，高效求出损失关于各参数的梯度。它是一种求导算法，本身不规定参数应该更新多大。</Typography>
          </div>
          <div>
            <Typography as="dt" variant="label" tone="accent">优化器</Typography>
            <Typography as="dd" variant="bodySmall">接收梯度和自身状态，并产生新参数的更新规则。最基本的梯度下降只使用当前梯度与学习率；更复杂的优化器还可能利用历史梯度。</Typography>
          </div>
          <div>
            <Typography as="dt" variant="label" tone="accent">端到端训练</Typography>
            <Typography as="dd" variant="bodySmall">从最终训练目标出发，让梯度通过整个可微网络传到各层，并联合更新所有可学习参数，而不是分别为每层手工指定目标。</Typography>
          </div>
        </dl>
        <MathFormulaBlock ariaLabel="L 对 w11 的偏导等于 L 对 y 的偏导乘 y 对 h1 的偏导乘 h1 对 w11 的偏导">
          <MathFormulaStatic latex="\frac{\partial L}{\partial w_{11}}=\frac{\partial L}{\partial y}\frac{\partial y}{\partial h_1}\frac{\partial h_1}{\partial w_{11}}" />
        </MathFormulaBlock>
        <Typography variant="bodySmall">
          一轮更新应先在同一组旧参数上计算全部梯度，再同时生成新参数；不能更新一个权重后立刻用它计算另一个权重的本轮梯度，否则实现的就不再是上式所描述的同一步更新。
        </Typography>
        <ul className="gd-react-rigor-list">
          <Typography as="li" variant="bodySmall">
            梯度接近 0 只说明到达驻点；对非凸神经网络，它不保证是全局最小点，也可能对应鞍点或平坦区域。
          </Typography>
          <Typography as="li" variant="bodySmall">
            训练 Loss 足够低表示优化目标被较好地降低，但模型能否在新样本上表现良好仍需验证集或测试集评估。
          </Typography>
        </ul>
      </section>

      {targetCommitted && readyToComplete && (
        <Callout
          tone="green"
          label={snapshot.hasTrained ? '这就是一次完整训练' : '初始预测已经达标'}
          text={snapshot.hasTrained
            ? '前馈得到预测，Loss 衡量误差，反向传播把影响传回每个参数，梯度下降再按学习率更新它们。网络中的所有可学习参数都能这样更新。'
            : '当前初始预测已经足够接近目标，不需要伪造一次参数更新。可以更换目标值，继续观察完整训练过程。'}
        />
      )}
      </ContentBlock>
    </div>
  );
}
