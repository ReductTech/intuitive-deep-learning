import { useMemo } from 'react';
import {
  Button,
  LessonStage,
  MathFormulaBlock,
  MathFormulaStatic,
  RangeControl,
  Typography,
} from '../../shared/react';
import type { WidgetRuntimeProps } from '../../shared/presentation-engine';
import { relu, sigmoid, silu } from '../model/activationMath';

interface NeuronReluState {
  slope: number;
  intercept: number;
}

const RELU_DEFAULT_STATE: NeuronReluState = { slope: 1, intercept: 0 };

function signed(value: number): string {
  return `${value < 0 ? '−' : '+'} ${Math.abs(value).toFixed(2)}`;
}

export function NeuronReluWidget({
  state,
  setState,
}: WidgetRuntimeProps<Record<string, unknown>, NeuronReluState>) {
  const parameters = state ?? RELU_DEFAULT_STATE;
  const points = useMemo(() => Array.from({ length: 121 }, (_, index) => {
    const x = -2 + index * (4 / 120);
    const y = Math.max(0, parameters.slope * x + parameters.intercept);
    return `${x.toFixed(3)},${Math.min(2.8, y).toFixed(3)}`;
  }).join(' '), [parameters.intercept, parameters.slope]);
  const formula = parameters.slope === 1 && parameters.intercept === 0
    ? 'y = ReLU(x)'
    : `y = ReLU(${parameters.slope.toFixed(2)}x ${signed(parameters.intercept)})`;

  const update = (key: keyof NeuronReluState, value: number) => setState({
    ...parameters,
    [key]: value,
  });

  return <LessonStage
    className="neuron-relu-widget"
    title="认识线性整流单元"
    description="ReLU 在零点做出选择：负值被抑制为 0，正值继续线性传递。"
    descriptionVariant="bodySmall"
  >
    <div className="neuron-relu-widget__layout">
      <section className="neuron-relu-widget__definition" aria-labelledby="neuron-relu-title">
        <Typography id="neuron-relu-title" as="h3" variant="h3" tone="accent">ReLU：修正线性单元</Typography>
        <Typography variant="body" tone="muted">
          ReLU 是 <Typography as="span" variant="body" tone="accent">Rectified Linear Unit</Typography> 的缩写。它先接收加权结果 z，再按零点判断是否输出。
        </Typography>
        <MathFormulaBlock className="neuron-relu-widget__formula" ariaLabel="ReLU 分段函数：z 小于等于零时输出零，z 大于零时输出 z">
          <MathFormulaStatic latex={'\\operatorname{ReLU}(z)=\\begin{cases}0,&z\\le 0\\\\z,&z>0\\end{cases}'} />
        </MathFormulaBlock>
        <div className="neuron-relu-widget__cases" aria-label="ReLU 分段规则">
          <div>
            <Typography as="span" variant="bodySmall" tone="muted">当 z ≤ 0</Typography>
            <Typography as="strong" variant="h3" tone="accent">输出 0</Typography>
            <Typography variant="bodySmall" tone="muted">信号被抑制</Typography>
          </div>
          <div>
            <Typography as="span" variant="bodySmall" tone="muted">当 z &gt; 0</Typography>
            <Typography as="strong" variant="h3" tone="success">输出 z</Typography>
            <Typography variant="bodySmall" tone="muted">信号被激活</Typography>
          </div>
        </div>
      </section>
      <figure className="neuron-relu-widget__figure" aria-labelledby="neuron-relu-figure-title">
        <div className="neuron-relu-widget__figure-head">
          <div>
            <Typography id="neuron-relu-figure-title" as="h3" variant="h3" tone="accent">观察 ReLU 的输出</Typography>
            <Typography variant="bodySmall" tone="muted">{formula}</Typography>
          </div>
          <Button variant="primary" onClick={() => setState({
            slope: Math.round((Math.random() * 1.8 - 0.9) * 10) / 10,
            intercept: Math.round((Math.random() * 1.6 - 0.8) * 10) / 10,
          })}>随机参数</Button>
        </div>
        <div className="neuron-relu-widget__plot">
          <svg viewBox="-2.4 -1.4 4.8 4.5" role="img" aria-label={`${formula} 的函数图像：小于响应起点的部分输出零，越过响应起点后沿直线变化`}>
            <title>{formula}</title>
            {[-2, -1, 0, 1, 2].map((x) => <line key={`x-${x}`} className="neuron-relu-grid" x1={x} y1={-1.1} x2={x} y2={2.9} />)}
            {[0, 1, 2].map((y) => <line key={`y-${y}`} className="neuron-relu-grid" x1={-2.2} y1={y} x2={2.2} y2={y} />)}
            <line className="neuron-relu-axis" x1={-2.2} y1={0} x2={2.2} y2={0} />
            <line className="neuron-relu-axis" x1={0} y1={-1.1} x2={0} y2={2.9} />
            <polyline className="neuron-relu-curve" points={points} />
            <text className="neuron-relu-axis-label" x={2.08} y={-0.12}>x</text>
            <text className="neuron-relu-axis-label" x={.08} y={-1.02}>y</text>
          </svg>
        </div>
        <div className="neuron-relu-widget__controls">
          <RangeControl
            label="斜率 a"
            min={-1}
            max={1}
            step={0.1}
            digits={1}
            value={parameters.slope}
            onChange={(event) => update('slope', Number(event.currentTarget.value))}
          />
          <RangeControl
            label="截距 b"
            min={-1}
            max={1}
            step={0.1}
            digits={1}
            value={parameters.intercept}
            onChange={(event) => update('intercept', Number(event.currentTarget.value))}
          />
        </div>
      </figure>
    </div>
  </LessonStage>;
}

const activations = [
  { type: 'relu', name: 'ReLU', formula: 'max(0, x)', description: '负值被抑制为 0，正值保持线性。', fn: relu },
  { type: 'leaky-relu', name: 'Leaky ReLU', formula: 'max(0.1x, x)', description: '负值保留较小斜率，正值保持原斜率。', fn: (x: number) => Math.max(0.1 * x, x) },
  { type: 'silu', name: 'SiLU / Swish', formula: 'x · sigmoid(x)', description: '平滑地抑制负值，正向输出没有上界。', fn: silu },
  { type: 'gelu', name: 'GELU', formula: 'x · Φ(x)', description: '按输入大小平滑调节通过比例，大模型中常见。', fn: (x: number) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))) },
  { type: 'sigmoid', name: 'Sigmoid', formula: '1 / (1 + e⁻ˣ)', description: '把数值压到 0～1，常用于二分类输出。', fn: sigmoid },
  { type: 'tanh', name: 'Tanh', formula: 'tanh(x)', description: '把数值压到 −1～1，并以 0 为中心。', fn: Math.tanh },
] as const;

export function NeuronActivationCatalogWidget() {
  return <LessonStage
    className="neuron-activation-widget"
    title="认识这些被广泛使用的激活函数"
    description="激活函数有不同形状，也会给网络带来不同的数值特性；它们共同完成同一件事：打破纯线性叠加。"
    descriptionVariant="bodySmall"
  >
    <div className="neuron-activation-widget__grid">
      {activations.map((activation) => {
        const points = Array.from({ length: 81 }, (_, index) => {
          const x = -2.5 + index * (5 / 80);
          const y = Math.max(-1.2, Math.min(1.2, activation.fn(x)));
          return `${x.toFixed(3)},${y.toFixed(3)}`;
        }).join(' ');
        return <article className="neuron-activation-widget__card" key={activation.type}>
          <svg viewBox="-2.8 -1.45 5.6 2.9" role="img" aria-label={`${activation.name} 函数图像`}>
            <title>{activation.name}</title>
            <line className="neuron-activation-axis" x1={-2.55} y1={0} x2={2.55} y2={0} />
            <line className="neuron-activation-axis" x1={0} y1={-1.25} x2={0} y2={1.25} />
            <polyline className="neuron-activation-curve" points={points} />
          </svg>
          <Typography as="h3" variant="subtitle" tone="accent">{activation.name}</Typography>
          <Typography as="code" variant="bodySmall" tone="main" className="neuron-activation-widget__formula">{activation.formula}</Typography>
          <Typography variant="bodySmall" tone="muted">{activation.description}</Typography>
        </article>;
      })}
    </div>
  </LessonStage>;
}
