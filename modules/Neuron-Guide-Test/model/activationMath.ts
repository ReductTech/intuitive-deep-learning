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
