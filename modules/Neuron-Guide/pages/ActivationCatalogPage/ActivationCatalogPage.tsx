import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import {
  ContentBlock,
  FunctionPlot,
  PlotlyChart,
  Typography,
  currentModuleId,
  emitTelemetry,
  sampleSurface3D,
  type FunctionGuide,
  type FunctionSeries,
  type PlotlyChartProps,
  type PlotlyGraph,
  type PlotlyLayout,
  type PlotlyTrace,
  type TelemetryStateEntry,
} from '../../../shared/react';
import "./ActivationCatalogPage.css";

const activations = [
  {
    type: 'relu' as const,
    name: 'ReLU',
    formula: 'max(0, x)',
    description: '负值被抑制为 0，正值保持线性，输出向正方向没有上界。',
  },
  {
    type: 'leakyRelu' as const,
    name: 'Leaky ReLU',
    formula: 'max(0.1x, x)',
    description: '负值保留较小斜率，正值保持原斜率，两个方向都可以继续延伸。',
  },
  {
    type: 'silu' as const,
    name: 'SiLU / Swish',
    formula: 'x · sigmoid(x)',
    description: '平滑地抑制负值，正向输出没有上界。',
  },
  {
    type: 'gelu' as const,
    name: 'GELU',
    formula: 'x · Φ(x)',
    description: '按输入大小平滑调节通过比例，大模型中常见。',
  },
  {
    type: 'sigmoid' as const,
    name: 'Sigmoid',
    formula: '1 / (1 + e⁻ˣ)',
    description: '把数值压到 0～1，常用于二分类输出。',
  },
  {
    type: 'tanh' as const,
    name: 'Tanh',
    formula: 'tanh(x)',
    description: '把数值压到 −1～1，并以 0 为中心。',
  },
];

export function ActivationCatalogPage() {
  return (
    <ContentBlock
      headingLevel={1}
      className="ng-activation-catalog"
      title="认识这些被广泛使用的激活函数"
      subtitle="激活函数有不同形状，也会给网络带来不同的数值特性；它们共同完成同一件事：打破纯线性叠加。"
    >
      <div className="ng-activation-catalog__grid">
        {activations.map((activation) => (
          <article className="ng-activation-catalog__card" key={activation.type}>
            <ActivationFunctionPlot type={activation.type} />
            <Typography as="h3" variant="subtitle" tone="accent">{activation.name}</Typography>
            <Typography as="code" variant="body" tone="main" className="ng-activation-catalog__formula">{activation.formula}</Typography>
            <Typography variant="body" tone="muted">{activation.description}</Typography>
          </article>
        ))}
      </div>
    </ContentBlock>
  );
}

const COLORS = Object.freeze({
  blue: '#27446e',
  red: '#c43f52',
  orange: '#f07e47',
  green: '#228d5c',
  grid: '#dfe6f1',
  axis: '#68778f',
  tick: '#9fb0c8',
  background: '#fbfdff',
});

const FONT = {
  family: '"Segoe UI", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif',
  color: COLORS.blue,
  size: 12,
};

const CHART_STYLE = Object.freeze({ width: '100%' });

const FUNCTION_COLORS: Readonly<Record<Function2DId, string>> = Object.freeze({
  line2d: COLORS.green,
  parabola2d: COLORS.orange,
  fold2d: COLORS.red,
});

const SURFACE_COLORS: Readonly<
  Record<Surface3DId, Array<[number, string]>>
> = Object.freeze({
  plane3d: [[0, '#e8f7ef'], [1, COLORS.green]],
  bowl3d: [[0, '#fff4ee'], [1, COLORS.orange]],
  fold3d: [[0, '#fff0f2'], [1, COLORS.red]],
});

function axis(title: string, range: [number, number]) {
  return {
    title: {
      text: title,
      standoff: 8,
      font: { size: 12, color: COLORS.blue },
    },
    range,
    showgrid: true,
    gridcolor: COLORS.grid,
    gridwidth: 1,
    zeroline: true,
    zerolinecolor: COLORS.axis,
    zerolinewidth: 1.5,
    showline: false,
    ticks: 'outside',
    tickcolor: COLORS.tick,
    tickfont: { size: 10, color: COLORS.axis },
    fixedrange: false,
    automargin: true,
  };
}

function surfaceTrace(
  sampled: ReturnType<typeof sampleSurface3D>,
  colorscale: Array<[number, string]>,
  name?: string,
): PlotlyTrace {
  return {
    type: 'surface',
    name,
    x: sampled.x,
    y: sampled.y,
    z: sampled.z,
    showscale: false,
    opacity: 0.94,
    colorscale,
    hovertemplate: 'x = %{x:.3f}<br>y = %{y:.3f}<br>z = %{z:.3f}<extra></extra>',
    contours: {
      x: { show: true, color: 'rgba(255,255,255,0.55)', width: 1 },
      y: { show: true, color: 'rgba(255,255,255,0.55)', width: 1 },
      z: { show: false },
    },
  };
}

function layout3D(uirevision: string): PlotlyLayout {
  return {
    autosize: true,
    paper_bgcolor: COLORS.background,
    font: FONT,
    margin: { l: 0, r: 0, t: 0, b: 0 },
    showlegend: false,
    uirevision,
    scene: {
      bgcolor: COLORS.background,
      dragmode: 'orbit',
      aspectmode: 'cube',
      camera: { eye: { x: 1.35, y: 1.35, z: 0.95 } },
      xaxis: {
        ...axis('x', [-1.05, 1.05]),
        showbackground: true,
        backgroundcolor: COLORS.background,
      },
      yaxis: {
        ...axis('y', [-1.05, 1.05]),
        showbackground: true,
        backgroundcolor: COLORS.background,
      },
      zaxis: {
        ...axis('z', [-1.05, 1.05]),
        showbackground: true,
        backgroundcolor: COLORS.background,
      },
    },
  };
}

export interface Function2DChoicePlotProps {
  type: Function2DId;
}

export function Function2DChoicePlot({ type }: Function2DChoicePlotProps) {
  const definition = FUNCTION_2D_DEFINITIONS[type];

  return (
    <FunctionPlot
      className="ng-activation-plot ng-activation-choice-plot"
      fn={definition.fn}
      stroke={FUNCTION_COLORS[type]}
      initialCenter={{ x: 0, y: 0 }}
      initialScale={{ x: 2.4 / 760, y: 2.4 / 420 }}
      minHeight={132}
      ariaLabel={`${definition.formula} 的二维函数图像`}
    />
  );
}

export interface Surface3DChoicePlotProps {
  type: Surface3DId;
}

export function Surface3DChoicePlot({ type }: Surface3DChoicePlotProps) {
  const definition = SURFACE_3D_DEFINITIONS[type];
  const data = useMemo<PlotlyTrace[]>(() => {
    const sampled = sampleSurface3D(definition.fn, {
      min: -1,
      max: 1,
      samples: 28,
      zMin: -1.05,
      zMax: 1.05,
    });
    return [surfaceTrace(sampled, SURFACE_COLORS[type], definition.formula)];
  }, [definition, type]);
  const layout = useMemo(
    () => layout3D(`activation-choice-${type}`),
    [type],
  );

  return (
    <PersistedPlotlyChart
      className="ng-activation-plot ng-activation-choice-plot ng-activation-choice-plot--3d"
      persistenceKey={`activation-choice-${type}`}
      data={data}
      layout={layout}
      minHeight={180}
      style={CHART_STYLE}
      role="img"
      aria-label={`${definition.formula} 的三维函数曲面，可拖动旋转`}
    />
  );
}

export interface ShallowOutputPlotProps {
  model: Readonly<ShallowModel>;
}

export function ShallowOutputPlot({ model }: ShallowOutputPlotProps) {
  const equivalent = useMemo(() => shallowEquivalent(model), [model]);
  const series = useMemo<FunctionSeries[]>(() => [
    ...model.neurons.map((neuron, index) => ({
      id: `hidden-${index}`,
      label: `h${index + 1}`,
      stroke: ['#ef9540', '#5b8fe1', '#8e63d8'][index] ?? '#8e63d8',
      strokeWidth: 2,
      fn: (x: number) => neuron.w * x + neuron.b,
    })),
    {
      id: 'network-output',
      label: 'y（总输出）',
      stroke: COLORS.green,
      strokeWidth: 4,
      fn: (x: number) => shallowPredict(model, x),
    },
  ], [model]);

  return (
    <FunctionPlot
      className="ng-activation-plot ng-activation-stage-plot"
      series={series}
      initialCenter={{ x: 0, y: 0 }}
      initialScale={{ x: 2.4 / 760, y: 2.4 / 420 }}
      showLegend
      xLabel="x"
      yLabel="y"
      fontScale={1.3}
      minHeight={390}
      ariaLabel={`无激活函数浅层网络的多条直线与总输出，y 等于 ${formatNumber(equivalent.slope)} x ${formatSigned(equivalent.intercept)}`}
    />
  );
}

export interface DeepOutputPlotProps {
  model: Readonly<DeepNetworkModel>;
}

export function DeepOutputPlot({ model }: DeepOutputPlotProps) {
  const equivalent = useMemo(() => deepEquivalent(model), [model]);
  const data = useMemo<PlotlyTrace[]>(() => {
    const sampled = sampleSurface3D(
      (x, y) => deepPredict(model, x, y),
      {
        min: -1,
        max: 1,
        samples: 28,
        zMin: -1.05,
        zMax: 1.05,
      },
    );
    const name = `z = ${formatNumber(equivalent.ax)}x ${formatSigned(equivalent.ay)}y ${formatSigned(equivalent.c)}`;
    return [surfaceTrace(sampled, [[0, '#e8f7ef'], [1, COLORS.green]], name)];
  }, [equivalent, model]);
  const layout = useMemo(
    () => layout3D('activation-'),
    [],
  );

  return (
    <PersistedPlotlyChart
      className="ng-activation-plot ng-activation-stage-plot"
      persistenceKey="ng-activation-linear-deep-output"
      data={data}
      layout={layout}
      minHeight={430}
      style={CHART_STYLE}
      role="img"
      aria-label={`多层线性网络的三维输出平面，z 等于 ${formatNumber(equivalent.ax)} x ${formatSigned(equivalent.ay)} y ${formatSigned(equivalent.c)}`}
    />
  );
}

export interface ReluNetworkPlotProps {
  count: number;
  neurons?: readonly ShallowNeuron[];
}

export function ReluNetworkPlot({ count, neurons }: ReluNetworkPlotProps) {
  const normalizedCount = Math.min(
    MAX_RELU_NEURON_COUNT,
    Math.max(MIN_RELU_NEURON_COUNT, Math.trunc(count)),
  );
  const visibleNeurons = useMemo(
    () => (neurons?.length ? neurons : activeReluNeurons(normalizedCount)).slice(0, normalizedCount),
    [neurons, normalizedCount],
  );
  const series = useMemo<FunctionSeries[]>(() => [{
    id: 'network-output',
    label: '网络输出',
    stroke: COLORS.orange,
    fn: (x) => visibleNeurons.reduce(
      (output, neuron) => output + neuron.v * relu(neuron.w * x + neuron.b),
      RELU_OUTPUT_BIAS,
    ),
  }], [visibleNeurons]);
  const verticalGuides = useMemo<FunctionGuide[]>(() => {
    return visibleNeurons.map((neuron, index) => ({
      id: `relu-kink-${index}`,
      x: reluKink(neuron),
      label: `h1.${index + 1} 的响应起点`,
      stroke: 'rgba(196, 63, 82, 0.52)',
      dash: 'dash',
    }));
  }, [visibleNeurons]);

  return (
    <FunctionPlot
      className="ng-activation-plot ng-activation-stage-plot"
      series={series}
      verticalGuides={verticalGuides}
      initialCenter={{ x: 0, y: 0 }}
      initialScale={{ x: 2.4 / 760, y: 2.4 / 420 }}
      minHeight={430}
      ariaLabel={`包含 ${normalizedCount} 个 ReLU 神经元的分段线性网络输出，红色虚线表示折点`}
    />
  );
}

export interface ApproximationPlotProps {
  count: number;
}

export function ApproximationPlot({ count }: ApproximationPlotProps) {
  const normalizedCount = normalizeApproximationCount(count);
  const series = useMemo<FunctionSeries[]>(() => [
    {
      id: 'target',
      label: '目标函数',
      fn: targetFunction,
      stroke: 'rgba(104,119,143,0.72)',
      strokeWidth: 3,
      dash: 'dash',
    },
    {
      id: 'approximation',
      label: '分段线性逼近',
      fn: (x) => approximateTarget(x, normalizedCount),
      stroke: COLORS.orange,
    },
  ], [normalizedCount]);
  const verticalGuides = useMemo<FunctionGuide[]>(() => {
    return approximationKnots(normalizedCount).slice(1, -1).map((knot, index) => ({
      id: `approximation-knot-${index}`,
      x: knot.x,
      label: '折点',
      stroke: 'rgba(196, 63, 82, 0.42)',
      dash: 'dot',
    }));
  }, [normalizedCount]);

  return (
    <FunctionPlot
      className="ng-activation-plot ng-activation-wide-plot"
      series={series}
      verticalGuides={verticalGuides}
      initialCenter={{ x: 0, y: 0 }}
      initialScale={{ x: 2.4 / 760, y: 2.4 / 420 }}
      showLegend
      minHeight={430}
      ariaLabel={`使用 ${normalizedCount} 个折点逼近目标函数；灰色虚线为目标，橙色实线为分段线性逼近`}
    />
  );
}

export type ActivationFunctionType = 'relu' | 'leakyRelu' | 'silu' | 'gelu' | 'sigmoid' | 'tanh';

export interface ActivationFunctionPlotProps {
  type: ActivationFunctionType;
}

const ACTIVATION_DEFINITIONS: Readonly<
  Record<
    ActivationFunctionType,
    {
      fn: (x: number) => number;
      color: string;
      yRange: [number, number];
      label: string;
    }
  >
> = Object.freeze({
  relu: {
    fn: relu,
    color: COLORS.red,
    yRange: [-0.85, 3.1],
    label: 'ReLU',
  },
  leakyRelu: {
    fn: (x) => x >= 0 ? x : 0.1 * x,
    color: COLORS.green,
    yRange: [-1.05, 3.1],
    label: 'Leaky ReLU',
  },
  silu: {
    fn: silu,
    color: COLORS.orange,
    yRange: [-0.85, 3.1],
    label: 'SiLU',
  },
  gelu: {
    fn: (x) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))),
    color: '#7057a3',
    yRange: [-0.85, 3.1],
    label: 'GELU',
  },
  sigmoid: {
    fn: (x) => 1 / (1 + Math.exp(-x)),
    color: COLORS.blue,
    yRange: [-0.1, 1.1],
    label: 'Sigmoid',
  },
  tanh: {
    fn: Math.tanh,
    color: '#a16925',
    yRange: [-1.1, 1.1],
    label: 'Tanh',
  },
});

export function ActivationFunctionPlot({ type }: ActivationFunctionPlotProps) {
  const definition = ACTIVATION_DEFINITIONS[type];
  const xRange: [number, number] = [-3, 3];
  const xSpan = xRange[1] - xRange[0];
  const ySpan = definition.yRange[1] - definition.yRange[0];

  return (
    <FunctionPlot
      className="ng-activation-plot ng-activation-function-plot"
      fn={definition.fn}
      stroke={definition.color}
      initialCenter={{
        x: (xRange[0] + xRange[1]) / 2,
        y: (definition.yRange[0] + definition.yRange[1]) / 2,
      }}
      initialScale={{ x: xSpan / 760, y: ySpan / 420 }}
      minHeight={150}
      ariaLabel={`${definition.label} 激活函数曲线`}
    />
  );
}

export type RandomSource = () => number;

export type Function2DId = 'line2d' | 'parabola2d' | 'fold2d';
export type Surface3DId = 'plane3d' | 'bowl3d' | 'fold3d';

export interface Function2DDefinition {
  formula: string;
  fn: (x: number) => number;
}

export interface Surface3DDefinition {
  formula: string;
  fn: (x: number, y: number) => number;
}

export interface ShallowNeuron {
  w: number;
  b: number;
  v: number;
}

export interface ShallowModel {
  neurons: ShallowNeuron[];
  outputBias: number;
}

export interface EquivalentLine {
  slope: number;
  intercept: number;
}

export interface DeepNetworkModel {
  layerCount: number;
  sizes: number[];
  W: number[][][];
  B: number[][];
}

export interface EquivalentPlane {
  ax: number;
  ay: number;
  c: number;
}

export interface ApproximationKnot {
  x: number;
  y: number;
}

export interface ReluIntroResult {
  x: number;
  z: number;
  y: number;
}

export const MIN_DEEP_LAYER_COUNT = 1;
export const MAX_DEEP_LAYER_COUNT = 5;
export const MIN_RELU_NEURON_COUNT = 1;
export const MAX_RELU_NEURON_COUNT = 5;
export const MIN_APPROXIMATION_COUNT = 2;
export const MAX_APPROXIMATION_COUNT = 12;
export const APPROXIMATION_INCREMENT = 2;
export const APPROXIMATION_MIN_X = -1.15;
export const APPROXIMATION_MAX_X = 1.15;
export const RELU_INTRO_MIN_X = -3;
export const RELU_INTRO_MAX_X = 3;
export const RELU_INTRO_STEP = 0.01;
export const RELU_INTRO_WEIGHT = 2;

export const SHALLOW_PARAMETER_RANGES = Object.freeze({
  w: Object.freeze({ low: 0.35, high: 1.35 }),
  b: Object.freeze({ low: 0.08, high: 0.65 }),
  v: Object.freeze({ low: 0.45, high: 1.2 }),
  outputBias: Object.freeze({ low: 0.05, high: 0.3 }),
});

export const DEEP_PARAMETER_RANGES = Object.freeze({
  firstLayerWeight: Object.freeze({ low: 0.12, high: 0.8 }),
  laterLayerWeight: Object.freeze({ low: 0.12, high: 0.62 }),
  bias: Object.freeze({ low: 0.02, high: 0.22 }),
});

export function linear2d(x: number): number {
  return 0.72 * x - 0.18;
}

export function parabola2d(x: number): number {
  return 0.75 * x * x - 0.35;
}

export function fold2d(x: number): number {
  return Math.max(0, x);
}

export const FUNCTION_2D_DEFINITIONS: Readonly<
  Record<Function2DId, Function2DDefinition>
> = Object.freeze({
  line2d: Object.freeze({
    formula: 'y = 0.72x - 0.18',
    fn: linear2d,
  }),
  parabola2d: Object.freeze({
    formula: 'y = 0.75x² - 0.35',
    fn: parabola2d,
  }),
  fold2d: Object.freeze({
    formula: 'y = max(0, x)',
    fn: fold2d,
  }),
});

export function plane3d(x: number, y: number): number {
  return 0.55 * x - 0.3 * y + 0.05;
}

export function bowl3d(x: number, y: number): number {
  return 0.65 * (x * x + y * y) - 0.58;
}

export function fold3d(x: number, y: number): number {
  return Math.max(0, x + 0.55 * y) - 0.42;
}

export const SURFACE_3D_DEFINITIONS: Readonly<
  Record<Surface3DId, Surface3DDefinition>
> = Object.freeze({
  plane3d: Object.freeze({
    formula: 'z = 0.55x - 0.30y + 0.05',
    fn: plane3d,
  }),
  bowl3d: Object.freeze({
    formula: 'z = 0.65(x² + y²) - 0.58',
    fn: bowl3d,
  }),
  fold3d: Object.freeze({
    formula: 'z = max(0, x + 0.55y) - 0.42',
    fn: fold3d,
  }),
});

/**
 * Returns a random magnitude in [low, high), then independently assigns its
 * sign. Keeping the two random draws is important because it preserves the
 * original module's seeded/random-call order.
 */
export function signedRandom(
  low: number,
  high: number,
  random: RandomSource = Math.random,
): number {
  const value = low + random() * (high - low);
  return random() < 0.5 ? -value : value;
}

export function makeShallowNeuron(
  random: RandomSource = Math.random,
): ShallowNeuron {
  return {
    w: signedRandom(
      SHALLOW_PARAMETER_RANGES.w.low,
      SHALLOW_PARAMETER_RANGES.w.high,
      random,
    ),
    b: signedRandom(
      SHALLOW_PARAMETER_RANGES.b.low,
      SHALLOW_PARAMETER_RANGES.b.high,
      random,
    ),
    v: signedRandom(
      SHALLOW_PARAMETER_RANGES.v.low,
      SHALLOW_PARAMETER_RANGES.v.high,
      random,
    ),
  };
}

export function makeShallowModel(
  neuronCount = 1,
  random: RandomSource = Math.random,
): ShallowModel {
  const neurons = Array.from(
    { length: Math.max(0, Math.trunc(neuronCount)) },
    () => makeShallowNeuron(random),
  );

  return {
    neurons,
    outputBias: signedRandom(
      SHALLOW_PARAMETER_RANGES.outputBias.low,
      SHALLOW_PARAMETER_RANGES.outputBias.high,
      random,
    ),
  };
}

export function shallowEquivalent(
  model: Readonly<ShallowModel>,
): EquivalentLine {
  let slope = 0;
  let intercept = model.outputBias;

  model.neurons.forEach((neuron) => {
    slope += neuron.v * neuron.w;
    intercept += neuron.v * neuron.b;
  });

  return { slope, intercept };
}

export function shallowPredict(
  model: Readonly<ShallowModel>,
  x: number,
): number {
  const line = shallowEquivalent(model);
  return line.slope * x + line.intercept;
}

export function normalizeDeepLayerCount(layerCount: number): number {
  return Math.min(
    MAX_DEEP_LAYER_COUNT,
    Math.max(MIN_DEEP_LAYER_COUNT, Math.trunc(layerCount)),
  );
}

/**
 * Builds the original fully linear network: two inputs, three neurons in each
 * hidden layer and one output. Every rebuild re-randomizes the complete model.
 */
export function buildDeepModel(
  layerCount: number,
  random: RandomSource = Math.random,
): DeepNetworkModel {
  const normalizedLayerCount = normalizeDeepLayerCount(layerCount);
  const sizes = [
    2,
    ...Array.from({ length: normalizedLayerCount }, () => 3),
    1,
  ];
  const W: number[][][] = [];
  const B: number[][] = [];

  for (let layer = 0; layer < sizes.length - 1; layer += 1) {
    const rows: number[][] = [];
    const bias: number[] = [];
    const high =
      layer === 0
        ? DEEP_PARAMETER_RANGES.firstLayerWeight.high
        : DEEP_PARAMETER_RANGES.laterLayerWeight.high;

    for (let row = 0; row < sizes[layer + 1]; row += 1) {
      const weights: number[] = [];
      for (let column = 0; column < sizes[layer]; column += 1) {
        weights.push(
          signedRandom(
            DEEP_PARAMETER_RANGES.firstLayerWeight.low,
            high,
            random,
          ),
        );
      }
      rows.push(weights);
      bias.push(
        signedRandom(
          DEEP_PARAMETER_RANGES.bias.low,
          DEEP_PARAMETER_RANGES.bias.high,
          random,
        ),
      );
    }

    W.push(rows);
    B.push(bias);
  }

  return {
    layerCount: normalizedLayerCount,
    sizes,
    W,
    B,
  };
}

export function deepForward(
  model: Readonly<DeepNetworkModel>,
  input: readonly number[],
): number {
  let current = [...input];

  for (let layer = 0; layer < model.W.length; layer += 1) {
    const next: number[] = [];
    for (let row = 0; row < model.W[layer].length; row += 1) {
      let sum = model.B[layer][row];
      for (let column = 0; column < current.length; column += 1) {
        sum += model.W[layer][row][column] * current[column];
      }
      next.push(sum);
    }
    current = next;
  }

  return current[0];
}

export function deepEquivalent(
  model: Readonly<DeepNetworkModel>,
): EquivalentPlane {
  const c = deepForward(model, [0, 0]);
  const ax = deepForward(model, [1, 0]) - c;
  const ay = deepForward(model, [0, 1]) - c;

  return { ax, ay, c };
}

export function deepPredict(
  model: Readonly<DeepNetworkModel>,
  x: number,
  y: number,
): number {
  return deepForward(model, [x, y]);
}

export const RELU_NEURONS: readonly Readonly<ShallowNeuron>[] = Object.freeze([
  Object.freeze({ w: 1.05, b: 0.72, v: 0.46 }),
  Object.freeze({ w: 1, b: 0.28, v: -0.88 }),
  Object.freeze({ w: 1.12, b: -0.12, v: 0.78 }),
  Object.freeze({ w: 0.96, b: -0.48, v: -0.58 }),
  Object.freeze({ w: 1.08, b: -0.78, v: 0.42 }),
]);

export const RELU_OUTPUT_BIAS = -0.28;

export function relu(value: number): number {
  return Math.max(0, value);
}

export function sigmoid(value: number): number {
  if (value < -40) return 0;
  if (value > 40) return 1;
  return 1 / (1 + Math.exp(-value));
}

export function silu(value: number): number {
  return value * sigmoid(value);
}

export function reluIntroForward(x: number): ReluIntroResult {
  const z = RELU_INTRO_WEIGHT * x;
  return { x, z, y: relu(z) };
}

export function reluKink(
  neuron: Pick<ShallowNeuron, 'w' | 'b'>,
): number {
  return -neuron.b / neuron.w;
}

export function activeReluNeurons(
  count: number,
): readonly Readonly<ShallowNeuron>[] {
  return RELU_NEURONS.slice(0, count);
}

export function reluNetworkPredict(x: number, count: number): number {
  let y = RELU_OUTPUT_BIAS;
  activeReluNeurons(count).forEach((neuron) => {
    y += neuron.v * relu(neuron.w * x + neuron.b);
  });
  return y;
}

export function normalizeApproximationCount(count: number): number {
  const wholeCount = Math.trunc(count);
  return Math.min(
    MAX_APPROXIMATION_COUNT,
    Math.max(MIN_APPROXIMATION_COUNT, wholeCount),
  );
}

export function targetFunction(x: number): number {
  return (
    0.48 * Math.sin(3.15 * x) +
    0.2 * Math.cos(6.1 * x) -
    0.13 * x
  );
}

/**
 * This deliberately keeps the currently loaded startup page's implementation:
 * count denotes the visible interior breakpoints, so the interpolation also
 * includes the two endpoints. It is not the unused guide.js ReLU model.
 */
export function approximationKnots(count: number): ApproximationKnot[] {
  const knots: ApproximationKnot[] = [];

  for (let index = 0; index < count + 2; index += 1) {
    const x =
      APPROXIMATION_MIN_X +
      (index / (count + 1)) *
        (APPROXIMATION_MAX_X - APPROXIMATION_MIN_X);
    knots.push({ x, y: targetFunction(x) });
  }

  return knots;
}

export function approximateTarget(x: number, count: number): number {
  const knots = approximationKnots(count);

  for (let index = 0; index < knots.length - 1; index += 1) {
    if (x >= knots[index].x && x <= knots[index + 1].x) {
      const ratio =
        (x - knots[index].x) / (knots[index + 1].x - knots[index].x);
      return (
        knots[index].y +
        ratio * (knots[index + 1].y - knots[index].y)
      );
    }
  }

  return x < knots[0].x ? knots[0].y : knots[knots.length - 1].y;
}

/**
 * Matches the old UI's two-decimal presentation, including its near-zero
 * normalization so "-0.00" is never shown.
 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '--';
  return (Math.abs(value) < 0.005 ? 0 : value).toFixed(2);
}

export function formatSigned(value: number): string {
  return `${value >= 0 ? '+ ' : '- '}${formatNumber(Math.abs(value))}`;
}

export type PersistedActivityUpdater<T> = T | ((current: T) => T);

export interface PersistedActivityOptions<T> {
  stateKey: string;
  createInitial: () => T;
  moduleId?: string;
  initEvent?: string;
  initProperties?: Record<string, unknown> | ((state: T) => Record<string, unknown>);
  normalizeState?: (stored: unknown) => T | null;
  getElement?: () => Element | null;
}

export interface PersistedActivityResult<T> {
  state: T | null;
  stateRef: MutableRefObject<T | null>;
  hydrated: boolean;
  persistenceAvailable: boolean | null;
  setDraft: (next: PersistedActivityUpdater<T>) => T | null;
  commit: (
    eventName: string,
    next: PersistedActivityUpdater<T>,
    properties?: Record<string, unknown>,
  ) => T | null;
}

const initializationEvents = new Set<string>();

type ActivityStateLoad<T> =
  | { ok: true; entry: TelemetryStateEntry<T> | null }
  | { ok: false };

async function loadActivityState<T>(
  stateKey: string,
  moduleId: string,
): Promise<ActivityStateLoad<T>> {
  const telemetry = window.__DL_TELEMETRY__;
  if (!telemetry?.getModuleState) return { ok: false };

  try {
    const document = await telemetry.getModuleState(moduleId);
    if (!document || document.ok !== true) return { ok: false };
    return {
      ok: true,
      entry: (
        document.states?.[stateKey] as TelemetryStateEntry<T> | undefined
      ) ?? null,
    };
  } catch {
    return { ok: false };
  }
}

function resolveUpdate<T>(
  current: T | null,
  update: PersistedActivityUpdater<T>,
): T | null {
  if (current === null) return null;
  return typeof update === 'function'
    ? (update as (value: T) => T)(current)
    : update;
}

/**
 * Module-private SQLite-backed state adapter.
 *
 * Hydration never emits telemetry. A UI operation should call `commit` once with
 * its semantic event name; the emitted event always carries the complete state
 * snapshot under the stable `stateKey`. If the saved state cannot be read or
 * normalized, the activity uses a fresh in-memory state and `commit` remains
 * local until the page is refreshed.
 */
export function usePersistedActivity<T>({
  stateKey,
  createInitial,
  moduleId = currentModuleId(),
  initEvent,
  initProperties,
  normalizeState,
  getElement,
}: PersistedActivityOptions<T>): PersistedActivityResult<T> {
  const [state, setState] = useState<T | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [persistenceAvailable, setPersistenceAvailable] = useState<boolean | null>(null);
  const stateRef = useRef<T | null>(null);
  const generationRef = useRef(0);

  const createInitialRef = useRef(createInitial);
  const initPropertiesRef = useRef(initProperties);
  const normalizeStateRef = useRef(normalizeState);
  const getElementRef = useRef(getElement);
  createInitialRef.current = createInitial;
  initPropertiesRef.current = initProperties;
  normalizeStateRef.current = normalizeState;
  getElementRef.current = getElement;

  useEffect(() => {
    let active = true;
    const generation = ++generationRef.current;
    stateRef.current = null;
    setState(null);
    setHydrated(false);
    setPersistenceAvailable(null);

    void loadActivityState<unknown>(stateKey, moduleId).then((result) => {
      if (!active || generation !== generationRef.current) return;
      if (!result.ok) {
        const next = createInitialRef.current();
        stateRef.current = next;
        setState(next);
        setHydrated(true);
        setPersistenceAvailable(false);
        return;
      }

      let restored: T | null = null;
      let normalizationFailed = false;
      const { entry } = result;
      if (entry !== null) {
        try {
          restored = normalizeStateRef.current
            ? normalizeStateRef.current(entry.state)
            : (entry.state as T);
          normalizationFailed = restored === null;
        } catch {
          normalizationFailed = true;
        }
      }

      if (normalizationFailed) {
        const next = createInitialRef.current();
        stateRef.current = next;
        setState(next);
        setHydrated(true);
        setPersistenceAvailable(false);
        return;
      }

      const next = restored ?? createInitialRef.current();
      stateRef.current = next;
      setState(next);
      setHydrated(true);
      setPersistenceAvailable(true);

      if (entry !== null || !initEvent) return;
      const initializationKey = `${moduleId}:${stateKey}:${initEvent}`;
      if (initializationEvents.has(initializationKey)) return;
      initializationEvents.add(initializationKey);
      const additional = typeof initPropertiesRef.current === 'function'
        ? initPropertiesRef.current(next)
        : initPropertiesRef.current;
      emitTelemetry(initEvent, getElementRef.current?.() ?? null, {
        ...additional,
        state_key: stateKey,
        state: next,
      });
    });

    return () => {
      active = false;
    };
  }, [initEvent, moduleId, stateKey]);

  const setDraft = useCallback((
    update: PersistedActivityUpdater<T>,
  ): T | null => {
    if (!hydrated) return null;
    const next = resolveUpdate(stateRef.current, update);
    if (next === null) return null;
    stateRef.current = next;
    setState(next);
    return next;
  }, [hydrated]);

  const commit = useCallback((
    eventName: string,
    update: PersistedActivityUpdater<T>,
    properties: Record<string, unknown> = {},
  ): T | null => {
    if (!hydrated) return null;
    const next = resolveUpdate(stateRef.current, update);
    if (next === null) return null;
    stateRef.current = next;
    setState(next);
    if (persistenceAvailable === true) {
      emitTelemetry(eventName, getElementRef.current?.() ?? null, {
        ...properties,
        state_key: stateKey,
        state: next,
      });
    }
    return next;
  }, [hydrated, persistenceAvailable, stateKey]);

  return {
    state,
    stateRef,
    hydrated,
    persistenceAvailable,
    setDraft,
    commit,
  };
}

export interface PersistedPlotViewState {
  version: 1;
  patch: Record<string, unknown>;
}

export interface PersistedPlotlyChartProps
  extends Omit<PlotlyChartProps, 'layout' | 'onGraphReady'> {
  persistenceKey: string;
  moduleId?: string;
  layout?: PlotlyLayout;
  debounceMs?: number;
  onGraphReady?: (graph: PlotlyGraph, host: HTMLDivElement) => void;
}

const axisViewPattern = /^(?:(?:scene\d*\.)?[xyz]axis\d*)\.(?:range(?:\[[01]\])?|autorange)$/;
const cameraViewPattern = /^scene\d*\.camera(?:\.[a-z0-9_.-]+)?$/i;

function initialPlotView(): PersistedPlotViewState {
  return { version: 1, patch: {} };
}

function cloneSerializable(value: unknown): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
  ) {
    return value;
  }
  if (Array.isArray(value)) return value.map(cloneSerializable);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined && typeof entry !== 'function')
        .map(([key, entry]) => [key, cloneSerializable(entry)]),
    );
  }
  return null;
}

function isPersistableViewKey(key: string) {
  return axisViewPattern.test(key) || cameraViewPattern.test(key);
}

function normalizePlotView(stored: unknown): PersistedPlotViewState | null {
  if (!stored || typeof stored !== 'object') return null;
  const patchValue = (stored as Partial<PersistedPlotViewState>).patch;
  if (!patchValue || typeof patchValue !== 'object' || Array.isArray(patchValue)) {
    return null;
  }
  const patch = Object.fromEntries(
    Object.entries(patchValue)
      .filter(([key]) => isPersistableViewKey(key))
      .map(([key, value]) => [key, cloneSerializable(value)]),
  );
  return { version: 1, patch };
}

function eventViewPatch(event: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(event)
      .filter(([key]) => isPersistableViewKey(key))
      .map(([key, value]) => [key, cloneSerializable(value)]),
  );
}

function axisPrefix(key: string) {
  const match = key.match(/^(.+)\.(?:range(?:\[[01]\])?|autorange)$/);
  return match?.[1] ?? null;
}

function mergeViewPatch(
  current: Record<string, unknown>,
  update: Record<string, unknown>,
) {
  const merged = { ...current };
  for (const [key, value] of Object.entries(update)) {
    const prefix = axisPrefix(key);
    if (prefix) {
      if (key.endsWith('.autorange')) {
        delete merged[`${prefix}.range`];
        delete merged[`${prefix}.range[0]`];
        delete merged[`${prefix}.range[1]`];
      } else {
        delete merged[`${prefix}.autorange`];
      }
    }
    if (cameraViewPattern.test(key) && key.split('.').length === 2) {
      for (const existing of Object.keys(merged)) {
        if (existing.startsWith(`${key}.`)) delete merged[existing];
      }
    }
    merged[key] = value;
  }
  return merged;
}

function pathParts(path: string): Array<string | number> {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)
    .map((part) => /^\d+$/.test(part) ? Number(part) : part);
}

type MutableViewContainer = Record<string, unknown> | unknown[];

function readContainer(
  container: MutableViewContainer,
  key: string | number,
): unknown {
  if (Array.isArray(container) && typeof key === 'number') {
    return container[key];
  }
  return (container as Record<string, unknown>)[String(key)];
}

function writeContainer(
  container: MutableViewContainer,
  key: string | number,
  value: unknown,
) {
  if (Array.isArray(container) && typeof key === 'number') {
    container[key] = value;
    return;
  }
  (container as Record<string, unknown>)[String(key)] = value;
}

function applyPath(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = pathParts(path);
  let cursor: MutableViewContainer = target;
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const final = index === parts.length - 1;
    if (final) {
      writeContainer(cursor, part, value);
      return;
    }
    const nextPart = parts[index + 1];
    const existing = readContainer(cursor, part);
    const next = Array.isArray(existing)
      ? [...existing]
      : existing && typeof existing === 'object'
        ? { ...(existing as Record<string, unknown>) }
        : typeof nextPart === 'number'
          ? []
          : {};
    writeContainer(cursor, part, next);
    cursor = next;
  }
}

function layoutWithView(
  layout: PlotlyLayout | undefined,
  patch: Record<string, unknown>,
): PlotlyLayout | undefined {
  if (Object.keys(patch).length === 0) return layout;
  const restored: PlotlyLayout = { ...(layout ?? {}) };
  for (const [path, value] of Object.entries(patch)) {
    applyPath(restored, path, value);
  }
  return restored;
}

/**
 * Shared Plotly chart with a module-private persisted viewport adapter.
 * Restore happens before `newPlot`; resize/autosize relayout events are filtered,
 * while user camera/range changes are debounced into one semantic event.
 */
export function PersistedPlotlyChart({
  persistenceKey,
  moduleId = currentModuleId(),
  layout,
  debounceMs = 180,
  onGraphReady,
  className,
  style,
  minHeight = 260,
  ...chartProps
}: PersistedPlotlyChartProps) {
  const stateKey = persistenceKey.startsWith('view:')
    ? persistenceKey
    : `view:${persistenceKey}`;
  const hostRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const readyFramesRef = useRef<number[]>([]);
  const acceptRelayoutRef = useRef(false);
  const userInteractionUntilRef = useRef(0);
  const interactionCleanupRef = useRef<(() => void) | null>(null);
  const latestViewRef = useRef<PersistedPlotViewState | null>(null);
  const activeStateKeyRef = useRef(stateKey);
  const externalReadyRef = useRef(onGraphReady);
  externalReadyRef.current = onGraphReady;

  if (activeStateKeyRef.current !== stateKey) {
    activeStateKeyRef.current = stateKey;
    latestViewRef.current = null;
  }

  const activity = usePersistedActivity<PersistedPlotViewState>({
    stateKey,
    moduleId,
    createInitial: initialPlotView,
    normalizeState: normalizePlotView,
    getElement: () => hostRef.current,
  });

  if (activity.hydrated && latestViewRef.current === null && activity.state) {
    latestViewRef.current = activity.state;
  }

  const restoredLayout = useMemo(
    () => layoutWithView(layout, latestViewRef.current?.patch ?? {}),
    // Hydration changes from false to true exactly once for this state key. The
    // live patch is held in a ref so committing a view does not rebuild Plotly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activity.hydrated, layout, stateKey],
  );

  const handleGraphReady = useCallback((
    graph: PlotlyGraph,
    host: HTMLDivElement,
  ) => {
    hostRef.current = host;
    acceptRelayoutRef.current = false;
    userInteractionUntilRef.current = 0;
    interactionCleanupRef.current?.();
    let pointerActive = false;
    const markUserInteraction = () => {
      userInteractionUntilRef.current = window.performance.now() + 1200;
    };
    const handlePointerDown = () => {
      pointerActive = true;
      markUserInteraction();
    };
    const handlePointerMove = () => {
      if (pointerActive) markUserInteraction();
    };
    const handlePointerEnd = () => {
      pointerActive = false;
      markUserInteraction();
    };
    host.addEventListener('pointerdown', handlePointerDown);
    host.addEventListener('pointermove', handlePointerMove);
    host.addEventListener('pointerup', handlePointerEnd);
    host.addEventListener('pointercancel', handlePointerEnd);
    host.addEventListener('wheel', markUserInteraction, { passive: true });
    host.addEventListener('dblclick', markUserInteraction);
    interactionCleanupRef.current = () => {
      host.removeEventListener('pointerdown', handlePointerDown);
      host.removeEventListener('pointermove', handlePointerMove);
      host.removeEventListener('pointerup', handlePointerEnd);
      host.removeEventListener('pointercancel', handlePointerEnd);
      host.removeEventListener('wheel', markUserInteraction);
      host.removeEventListener('dblclick', markUserInteraction);
    };
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    readyFramesRef.current.forEach((frame) => window.cancelAnimationFrame(frame));
    readyFramesRef.current = [];

    graph.on?.('plotly_relayout', (event) => {
      if (!acceptRelayoutRef.current) return;
      if (window.performance.now() > userInteractionUntilRef.current) return;
      const update = eventViewPatch(event);
      if (Object.keys(update).length === 0) return;
      const current = latestViewRef.current ?? initialPlotView();
      const next: PersistedPlotViewState = {
        version: 1,
        patch: mergeViewPatch(current.patch, update),
      };
      latestViewRef.current = next;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        activity.commit('activation_plot_view_commit', next, {
          plot_id: persistenceKey,
          changed_view_keys: Object.keys(update),
        });
        timerRef.current = null;
      }, Math.max(0, debounceMs));
    });

    const first = window.requestAnimationFrame(() => {
      const second = window.requestAnimationFrame(() => {
        acceptRelayoutRef.current = true;
        readyFramesRef.current = [];
      });
      readyFramesRef.current.push(second);
    });
    readyFramesRef.current.push(first);
    externalReadyRef.current?.(graph, host);
  }, [activity.commit, debounceMs, persistenceKey]);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    readyFramesRef.current.forEach((frame) => window.cancelAnimationFrame(frame));
    interactionCleanupRef.current?.();
    interactionCleanupRef.current = null;
    timerRef.current = null;
    readyFramesRef.current = [];
    acceptRelayoutRef.current = false;
    userInteractionUntilRef.current = 0;
    hostRef.current = null;
  }, []);

  if (!activity.hydrated) {
    return (
      <div
        ref={hostRef}
        className={['shared-plotly', className].filter(Boolean).join(' ')}
        style={{ minHeight, ...style }}
        data-state-key={stateKey}
        data-telemetry-manual
        aria-busy="true"
        aria-label={chartProps['aria-label']}
      />
    );
  }

  // The chart is teaching content, so a temporary viewport-state outage must
  // not hide it. In fallback mode the adapter keeps view changes in memory
  // without emitting Telemetry events.
  return (
    <PlotlyChart
      {...chartProps}
      className={className}
      style={style}
      minHeight={minHeight}
      layout={restoredLayout}
      onGraphReady={handleGraphReady}
      data-state-key={stateKey}
      data-telemetry-manual
    />
  );
}
