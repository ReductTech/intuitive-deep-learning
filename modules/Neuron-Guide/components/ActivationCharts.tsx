import { useMemo } from 'react';
import './ActivationCharts.css';
import {
  FunctionPlot,
  sampleSurface3D,
  type FunctionGuide,
  type FunctionSeries,
  type PlotlyLayout,
  type PlotlyTrace,
} from '../../shared/react';
import {
  FUNCTION_2D_DEFINITIONS,
  MAX_RELU_NEURON_COUNT,
  MIN_RELU_NEURON_COUNT,
  RELU_OUTPUT_BIAS,
  SURFACE_3D_DEFINITIONS,
  activeReluNeurons,
  approximateTarget,
  approximationKnots,
  deepEquivalent,
  deepPredict,
  formatNumber,
  formatSigned,
  normalizeApproximationCount,
  relu,
  reluKink,
  shallowEquivalent,
  shallowPredict,
  silu,
  targetFunction,
  type DeepNetworkModel,
  type Function2DId,
  type ShallowModel,
  type ShallowNeuron,
  type Surface3DId,
} from '../model/activationMath';
import { PersistedPlotlyChart } from './PersistedPlotlyChart';

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
  const fn = useMemo(() => (x: number) => shallowPredict(model, x), [model]);

  return (
    <FunctionPlot
      className="ng-activation-plot ng-activation-stage-plot"
      fn={fn}
      stroke={COLORS.green}
      initialCenter={{ x: 0, y: 0 }}
      initialScale={{ x: 2.4 / 760, y: 2.4 / 420 }}
      minHeight={430}
      ariaLabel={`无激活函数浅层网络的输出直线，y 等于 ${formatNumber(equivalent.slope)} x ${formatSigned(equivalent.intercept)}`}
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
