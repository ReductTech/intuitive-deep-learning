import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import {
  ContentBlock,
  FormulaBlock,
  FormulaTerm,
  FunctionPlot,
  PlotlyChart,
  Typography,
  currentModuleId,
  emitTelemetry,
  type PlotlyChartProps,
  type PlotlyGraph,
  type PlotlyLayout,
  type FunctionGuide,
  type FunctionSeries,
  type TelemetryStateEntry,
} from '../../../shared/react';
import "./ActivationCatalogPage.css";

const activations = [
  {
    type: 'leakyRelu' as const,
    name: 'Leaky ReLU',
    formula: 'max(0.1x, x)',
    description: '负侧保留小斜率，避免梯度完全归零。',
  },
  {
    type: 'gelu' as const,
    name: 'GELU',
    formula: 'x · Φ(x)',
    description: '按输入大小平滑调节通过比例。',
  },
  {
    type: 'sigmoid' as const,
    name: 'Sigmoid',
    formula: '1 / (1 + e⁻ˣ)',
    description: '把输出压到 0～1，适合表示概率。',
  },
];

export function ActivationCatalogPage() {
  return (
    <ContentBlock
      headingLevel={1}
      className="ngtw-activation-catalog"
      title="认识这些被广泛使用的激活函数"
      subtitle="激活函数有不同形状，也会给网络带来不同的数值特性；它们共同完成同一件事：打破纯线性叠加。"
    >
      <div className="ngtw-activation-catalog__grid grid min-w-0 max-w-full grid-cols-[repeat(3,_minmax(0,_1fr))] gap-[12px]">
        {activations.map((activation) => (
            <article className={`ngtw-activation-catalog__card relative grid min-w-0 max-w-full grid-rows-[minmax(150px,_1fr)_auto_auto_auto] content-start gap-[5px] bg-[#fff] p-[10px] ngtw-activation-catalog__card--${activation.type}`} key={activation.type}>
            <ActivationFunctionPlot type={activation.type} />
            <Typography as="h3" variant="subtitle" tone="accent">{activation.name}</Typography>
            <FormulaBlock
              className="ngtw-activation-catalog__formula min-h-[92px] w-full p-[12px]"
              ariaLabel={`${activation.name} 的数学表达式`}
            >
              <ActivationFormula type={activation.type} />
            </FormulaBlock>
            <Typography variant="bodySmall" tone="muted">{activation.description}</Typography>
          </article>
        ))}
      </div>
      <section className="ngtw-activation-catalog__properties grid min-w-0 max-w-full grid-cols-[minmax(210px,_.72fr)_minmax(0,_1.6fr)] items-center gap-[22px] p-[18px_6px_4px]" aria-label="激活函数的数学性质">
        <div className="ngtw-activation-catalog__properties-head">
          <Typography as="h2" variant="subtitle" tone="accent">激活函数的数学性质</Typography>
          <Typography variant="bodySmall" tone="muted">三者都把线性输入变成可学习的非线性输出。</Typography>
        </div>
        <div className="ngtw-activation-catalog__properties-grid grid min-w-0 grid-cols-[repeat(3,_minmax(0,_1fr))] gap-[18px]">
          <div>
            <Typography as="strong" variant="body" tone="main">定义域</Typography>
            <Typography variant="bodySmall" tone="muted">通常对整个实数域有定义。</Typography>
          </div>
          <div>
            <Typography as="strong" variant="body" tone="main">连续性</Typography>
            <Typography variant="bodySmall" tone="muted">通常保持连续，输入变化时输出不会跳变。</Typography>
          </div>
          <div>
            <Typography as="strong" variant="body" tone="main">可导性</Typography>
            <Typography variant="bodySmall" tone="muted">大多处处可导，少数边界点需特殊处理。</Typography>
          </div>
        </div>
      </section>
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

export const SHALLOW_SERIES_COLORS = Object.freeze({
  hidden: ['#ef8f32', '#4f7ed8', '#8656d6'] as const,
  input: '#2f4b78',
  output: '#3f9566',
});

const FUNCTION_COLORS: Readonly<Record<Function2DId, string>> = Object.freeze({
  line2d: COLORS.green,
  parabola2d: COLORS.orange,
  fold2d: COLORS.red,
});

export interface Function2DChoicePlotProps {
  type: Function2DId;
}

export function Function2DChoicePlot({ type }: Function2DChoicePlotProps) {
  const definition = FUNCTION_2D_DEFINITIONS[type];

  return (
    <FunctionPlot
      className="ngtw-activation-plot min-w-0 overflow-hidden ngtw-activation-choice-plot h-[156px] min-h-[156px]"
      fn={definition.fn}
      stroke={FUNCTION_COLORS[type]}
      initialCenter={{ x: 0, y: 0 }}
      initialScale={{ x: 2.4 / 760, y: 2.4 / 420 }}
      minHeight={132}
      ariaLabel={`${definition.formula} 的二维函数图像`}
    />
  );
}

export interface ShallowOutputPlotProps {
  model: Readonly<ShallowModel>;
  activeSeriesId?: string | null;
}

export function ShallowOutputPlot({ model, activeSeriesId = null }: ShallowOutputPlotProps) {
  const equivalent = useMemo(() => shallowEquivalent(model), [model]);
  const series = useMemo<FunctionSeries[]>(() => [
    ...model.neurons.map((neuron, index) => {
      const id = `hidden-${index}`;
      return {
        id,
        label: `h${index + 1}`,
        hoverLabel: `h${index + 1} = ${formatNumber(neuron.w)}x ${formatSigned(neuron.b)}`,
        endLabel: `h${index + 1}`,
        endLabelPosition: index % 2 === 0 ? 'top left' : 'bottom left',
        endLabelFontSize: 23,
        stroke: SHALLOW_SERIES_COLORS.hidden[index] ?? SHALLOW_SERIES_COLORS.hidden[2],
        // 单个神经元的直线只是铺垫，保持淡而细，让绿色结果线先被看到。
        strokeWidth: 1.4,
        opacity: 0.36,
        fn: (x: number) => neuron.w * x + neuron.b,
      };
    }),
    {
      id: 'network-output',
      label: 'y',
      hoverLabel: `y = ${formatNumber(equivalent.slope)}x ${formatSigned(equivalent.intercept)}`,
      endLabel: 'y',
      endLabelPosition: 'bottom left',
      endLabelFontSize: 23,
      stroke: SHALLOW_SERIES_COLORS.output,
      strokeWidth: 4,
      fn: (x: number) => shallowPredict(model, x),
    },
  ], [equivalent.intercept, equivalent.slope, model]);

  return (
    <FunctionPlot
      className="ngtw-activation-plot min-w-0 overflow-hidden ngtw-activation-stage-plot h-full min-h-[430px]"
      series={series}
      initialCenter={{ x: 0, y: 0 }}
      initialScale={{ x: 2.4 / 760, y: 2.4 / 420 }}
      xLabel="x"
      yLabel="y"
      fontScale={1.3}
      axisTitleFontSize={23}
      tickFontSize={23}
      highlightSeriesId={activeSeriesId}
      minHeight={390}
      ariaLabel={`无激活函数浅层网络的多条直线与总输出，y 等于 ${formatNumber(equivalent.slope)} x ${formatSigned(equivalent.intercept)}`}
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
      label: `h${index + 1} 的响应起点`,
      stroke: 'rgba(196, 63, 82, 0.52)',
      dash: 'dash',
    }));
  }, [visibleNeurons]);

  return (
    <FunctionPlot
      className="ngtw-activation-plot min-w-0 overflow-hidden ngtw-activation-stage-plot h-full min-h-[430px]"
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
      className="ngtw-activation-plot min-w-0 overflow-hidden ngtw-activation-wide-plot w-full h-[520px] min-h-[430px]"
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

export type ActivationFunctionType = 'leakyRelu' | 'gelu' | 'sigmoid';

export interface ActivationFunctionPlotProps {
  type: ActivationFunctionType;
}

function ActivationFormula({ type }: { type: ActivationFunctionType }): ReactNode {
  if (type === 'leakyRelu') {
    return (
      <>
        <FormulaTerm tooltip="max 取两个输入中的较大值。" ariaLabel="max，取较大值">max</FormulaTerm>
        <span>(</span>
        <FormulaTerm tooltip="负值区域保留 0.1 倍斜率，使梯度仍可传递。" ariaLabel="0.1x，负侧的小斜率">0.1x</FormulaTerm>
        <span>, </span>
        <FormulaTerm tooltip="正值区域保持原始输入。" ariaLabel="x，正侧的原始输入">x</FormulaTerm>
        <span>)</span>
      </>
    );
  }
  if (type === 'gelu') {
    return (
      <>
        <FormulaTerm tooltip="x 是神经元接收到的线性输入。" ariaLabel="x，线性输入">x</FormulaTerm>
        <span> · </span>
        <FormulaTerm tooltip="Φ(x) 是标准正态分布的累积分布函数，用来平滑调节通过比例。" ariaLabel="Phi of x，标准正态分布累积分布函数">Φ(x)</FormulaTerm>
      </>
    );
  }
  return (
    <>
      <FormulaTerm tooltip="指数项让输出在两端逐渐趋于稳定。" ariaLabel="Sigmoid 的指数表达式">1 / (1 + e⁻ˣ)</FormulaTerm>
    </>
  );
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
  leakyRelu: {
    fn: (x) => x >= 0 ? x : 0.1 * x,
    color: COLORS.green,
    yRange: [-1.05, 3.1],
    label: 'Leaky ReLU',
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
});

export function ActivationFunctionPlot({ type }: ActivationFunctionPlotProps) {
  const definition = ACTIVATION_DEFINITIONS[type];
  const xRange: [number, number] = [-3, 3];
  const xSpan = xRange[1] - xRange[0];
  const ySpan = definition.yRange[1] - definition.yRange[0];

  return (
    <FunctionPlot
      className="ngtw-activation-plot min-w-0 overflow-hidden ngtw-activation-function-plot w-full h-auto min-h-[180px] bg-[#fbfdff]"
      fn={definition.fn}
      stroke={definition.color}
      fontScale={1.45}
      axisTitleFontSize={24}
      tickFontSize={21}
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

export interface Function2DDefinition {
  formula: string;
  fn: (x: number) => number;
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

export interface ApproximationKnot {
  x: number;
  y: number;
}

export interface ReluIntroResult {
  x: number;
  z: number;
  y: number;
}

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

const SUBSCRIPT_DIGITS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

/** 把编号转成 Unicode 下标，让 w₁、b₁ 这类符号在正文里保持同一行基线。 */
export function formatSubscript(value: number): string {
  return String(value)
    .split('')
    .map((digit) => SUBSCRIPT_DIGITS[Number(digit)] ?? digit)
    .join('');
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

