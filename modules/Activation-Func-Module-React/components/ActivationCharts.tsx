import { useMemo } from 'react';
import {
  formulaAnnotation,
  sampleFunction2D,
  sampleSurface3D,
  type PlotlyLayout,
  type PlotlyTrace,
} from '../../shared/react';
import {
  FUNCTION_2D_DEFINITIONS,
  MAX_RELU_NEURON_COUNT,
  MIN_RELU_NEURON_COUNT,
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
  reluNetworkPredict,
  shallowEquivalent,
  shallowPredict,
  sigmoid,
  silu,
  targetFunction,
  type DeepNetworkModel,
  type Function2DId,
  type ShallowModel,
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

function layout2D({
  xRange,
  yRange,
  margin = { l: 52, r: 20, t: 18, b: 46 },
  annotations,
  showLegend = false,
  legend,
  uirevision,
}: {
  xRange: [number, number];
  yRange: [number, number];
  margin?: Record<string, number>;
  annotations?: unknown[];
  showLegend?: boolean;
  legend?: Record<string, unknown>;
  uirevision: string;
}): PlotlyLayout {
  return {
    autosize: true,
    paper_bgcolor: COLORS.background,
    plot_bgcolor: COLORS.background,
    font: FONT,
    margin,
    showlegend: showLegend,
    hovermode: 'closest',
    dragmode: 'pan',
    xaxis: axis('x', xRange),
    yaxis: axis('y', yRange),
    annotations,
    legend,
    uirevision,
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
  const data = useMemo<PlotlyTrace[]>(() => {
    // The viewport is intentionally small for comparison, but these functions
    // are defined on the whole real line. Sample a much wider domain so
    // panning or zooming never exposes misleading finite endpoints.
    const sampled = sampleFunction2D(definition.fn, {
      xMin: -100,
      xMax: 100,
      samples: 4001,
    });
    return [{
      type: 'scatter',
      mode: 'lines',
      name: definition.formula,
      x: sampled.x,
      y: sampled.y,
      line: { color: FUNCTION_COLORS[type], width: 4, shape: 'linear' },
      hovertemplate: 'x = %{x:.3f}<br>y = %{y:.3f}<extra></extra>',
    }];
  }, [definition, type]);
  const layout = useMemo(
    () => {
      const sharedLayout = layout2D({
        xRange: [-1.2, 1.2],
        yRange: [-1.2, 1.2],
        margin: { l: 34, r: 10, t: 10, b: 34 },
        uirevision: 'activation-choice-2d-v3',
      });
      const xaxis = sharedLayout.xaxis && typeof sharedLayout.xaxis === 'object'
        ? sharedLayout.xaxis as Record<string, unknown>
        : {};
      const yaxis = sharedLayout.yaxis && typeof sharedLayout.yaxis === 'object'
        ? sharedLayout.yaxis as Record<string, unknown>
        : {};
      return {
        ...sharedLayout,
        dragmode: 'pan',
        xaxis: { ...xaxis, fixedrange: false },
        yaxis: { ...yaxis, fixedrange: false, scaleanchor: 'x', scaleratio: 1 },
      };
    },
    [type],
  );

  return (
    <PersistedPlotlyChart
      className="af-react-plot af-react-choice-plot"
      persistenceKey={`activation-choice-${type}-v3`}
      data={data}
      layout={layout}
      minHeight={132}
      style={CHART_STYLE}
      role="img"
      aria-label={`${definition.formula} 的二维函数图像`}
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
      className="af-react-plot af-react-choice-plot af-react-choice-plot--3d"
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
  const data = useMemo<PlotlyTrace[]>(() => {
    const sampled = sampleFunction2D(
      (x) => shallowPredict(model, x),
      // The network is y = ax + b, so its graph must not read as a bounded
      // segment. Keep a wide sampled domain behind the initial close view;
      // users can pan and zoom without immediately reaching an endpoint.
      { xMin: -100, xMax: 100, samples: 4001 },
    );
    return [{
      type: 'scatter',
      mode: 'lines',
      name: '网络输出',
      x: sampled.x,
      y: sampled.y,
      line: { color: COLORS.green, width: 4, shape: 'linear' },
      hovertemplate: 'x = %{x:.3f}<br>y = %{y:.3f}<extra></extra>',
    }];
  }, [model]);
  const layout = useMemo(
    () => layout2D({
      xRange: [-1.2, 1.2],
      yRange: [-1.2, 1.2],
      annotations: [
        formulaAnnotation(
          `y = ${formatNumber(equivalent.slope)}x ${formatSigned(equivalent.intercept)}`,
        ),
      ],
      uirevision: 'activation-linear-shallow-output-v2',
    }),
    [equivalent],
  );

  return (
    <PersistedPlotlyChart
      className="af-react-plot af-react-stage-plot"
      persistenceKey="activation-linear-shallow-output-v2"
      data={data}
      layout={layout}
      minHeight={430}
      style={CHART_STYLE}
      role="img"
      aria-label={`无激活函数浅层网络的输出直线，y 等于 ${formatNumber(equivalent.slope)} x ${formatSigned(equivalent.intercept)}`}
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
    () => layout3D('activation-linear-deep-output'),
    [],
  );

  return (
    <PersistedPlotlyChart
      className="af-react-plot af-react-stage-plot"
      persistenceKey="activation-linear-deep-output"
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
}

export function ReluNetworkPlot({ count }: ReluNetworkPlotProps) {
  const normalizedCount = Math.min(
    MAX_RELU_NEURON_COUNT,
    Math.max(MIN_RELU_NEURON_COUNT, Math.trunc(count)),
  );
  const data = useMemo<PlotlyTrace[]>(() => {
    const kinkTraces = activeReluNeurons(normalizedCount)
      .map((neuron) => reluKink(neuron))
      .filter((x) => x >= -1.18 && x <= 1.18)
      .map((x): PlotlyTrace => ({
        type: 'scatter',
        mode: 'lines',
        name: '折点',
        x: [x, x],
        y: [-1.1, 1.1],
        line: {
          color: 'rgba(196, 63, 82, 0.52)',
          width: 1.6,
          dash: 'dash',
        },
        hovertemplate: '折点 x = %{x:.3f}<extra></extra>',
      }));
    const sampled = sampleFunction2D(
      (x) => reluNetworkPredict(x, normalizedCount),
      { xMin: -1.2, xMax: 1.2, samples: 220 },
    );
    return [
      ...kinkTraces,
      {
        type: 'scatter',
        mode: 'lines',
        name: '网络输出',
        x: sampled.x,
        y: sampled.y,
        line: { color: COLORS.orange, width: 4, shape: 'linear' },
        hovertemplate: 'x = %{x:.3f}<br>y = %{y:.3f}<extra></extra>',
      },
    ];
  }, [normalizedCount]);
  const layout = useMemo(
    () => layout2D({
      xRange: [-1.2, 1.2],
      yRange: [-1.2, 1.2],
      annotations: [
        formulaAnnotation(
          `${normalizedCount} neurons with ReLU · piecewise linear`,
        ),
      ],
      uirevision: 'activation-relu-network-output',
    }),
    [normalizedCount],
  );

  return (
    <PersistedPlotlyChart
      className="af-react-plot af-react-stage-plot"
      persistenceKey="activation-relu-network-output"
      data={data}
      layout={layout}
      minHeight={430}
      style={CHART_STYLE}
      role="img"
      aria-label={`包含 ${normalizedCount} 个 ReLU 神经元的分段线性网络输出，红色虚线表示折点`}
    />
  );
}

export interface ApproximationPlotProps {
  count: number;
}

export function ApproximationPlot({ count }: ApproximationPlotProps) {
  const normalizedCount = normalizeApproximationCount(count);
  const data = useMemo<PlotlyTrace[]>(() => {
    const target = sampleFunction2D(targetFunction, {
      xMin: -1.2,
      xMax: 1.2,
      samples: 260,
    });
    const approximation = sampleFunction2D(
      (x) => approximateTarget(x, normalizedCount),
      { xMin: -1.2, xMax: 1.2, samples: 260 },
    );
    const interiorKnots = approximationKnots(normalizedCount).slice(1, -1);
    return [
      {
        type: 'scatter',
        mode: 'lines',
        name: '目标函数',
        x: target.x,
        y: target.y,
        line: {
          color: 'rgba(104,119,143,0.72)',
          width: 3,
          dash: 'dash',
        },
        hovertemplate: 'x = %{x:.3f}<br>y = %{y:.3f}<extra></extra>',
      },
      {
        type: 'scatter',
        mode: 'lines',
        name: '分段线性逼近',
        x: approximation.x,
        y: approximation.y,
        line: { color: COLORS.orange, width: 4, shape: 'linear' },
        hovertemplate: 'x = %{x:.3f}<br>y = %{y:.3f}<extra></extra>',
      },
      {
        type: 'scatter',
        mode: 'markers',
        name: '折点',
        x: interiorKnots.map((knot) => knot.x),
        y: interiorKnots.map((knot) => knot.y),
        marker: {
          color: COLORS.red,
          size: 8,
          line: { color: '#fff', width: 2 },
        },
        hovertemplate: '折点 x = %{x:.3f}<br>y = %{y:.3f}<extra></extra>',
      },
    ];
  }, [normalizedCount]);
  const layout = useMemo(
    () => layout2D({
      xRange: [-1.2, 1.2],
      yRange: [-1.2, 1.2],
      showLegend: true,
      annotations: [
        formulaAnnotation(`${normalizedCount} ReLU breakpoints`),
      ],
      legend: {
        orientation: 'h',
        x: 1,
        xanchor: 'right',
        y: 1.08,
        yanchor: 'bottom',
      },
      margin: { l: 52, r: 20, t: 54, b: 46 },
      uirevision: 'activation-relu-approximation',
    }),
    [normalizedCount],
  );

  return (
    <PersistedPlotlyChart
      className="af-react-plot af-react-wide-plot"
      persistenceKey="activation-relu-approximation"
      data={data}
      layout={layout}
      minHeight={430}
      style={CHART_STYLE}
      role="img"
      aria-label={`使用 ${normalizedCount} 个折点逼近目标函数；灰色虚线为目标，橙色实线为分段线性逼近`}
    />
  );
}

export type ActivationFunctionType = 'relu' | 'sigmoid' | 'silu';

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
  sigmoid: {
    fn: sigmoid,
    color: COLORS.green,
    yRange: [-0.08, 1.08],
    label: 'Sigmoid',
  },
  silu: {
    fn: silu,
    color: COLORS.orange,
    yRange: [-0.85, 3.1],
    label: 'SiLU',
  },
});

export function ActivationFunctionPlot({ type }: ActivationFunctionPlotProps) {
  const definition = ACTIVATION_DEFINITIONS[type];
  const data = useMemo<PlotlyTrace[]>(() => {
    const sampled = sampleFunction2D(definition.fn, {
      xMin: -3,
      xMax: 3,
      samples: 220,
    });
    return [{
      type: 'scatter',
      mode: 'lines',
      name: type,
      x: sampled.x,
      y: sampled.y,
      line: { color: definition.color, width: 4, shape: 'linear' },
      hovertemplate: 'x = %{x:.3f}<br>y = %{y:.3f}<extra></extra>',
    }];
  }, [definition, type]);
  const layout = useMemo(
    () => layout2D({
      xRange: [-3, 3],
      yRange: definition.yRange,
      margin: { l: 42, r: 12, t: 12, b: 38 },
      uirevision: `activation-function-${type}`,
    }),
    [definition.yRange, type],
  );

  return (
    <PersistedPlotlyChart
      className="af-react-plot af-react-activation-plot"
      persistenceKey={`activation-function-${type}`}
      data={data}
      layout={layout}
      minHeight={180}
      style={CHART_STYLE}
      role="img"
      aria-label={`${definition.label} 激活函数曲线`}
    />
  );
}
