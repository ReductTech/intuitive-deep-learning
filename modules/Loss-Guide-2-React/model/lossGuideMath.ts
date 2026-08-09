export type WeatherKey = 'sunny' | 'cloudy' | 'rainy';

export interface WeatherItem {
  key: WeatherKey;
  label: string;
  icon: string;
  className: string;
}

export interface Forecast {
  provider: string;
  probabilities: readonly [number, number, number];
}

export type LossFamily =
  | 'negative_log'
  | 'linear'
  | 'quadratic'
  | 'inverse'
  | 'absolute';

export interface ProbabilityLossDesign {
  family: LossFamily;
  scale: number;
  power: number;
  formula: string;
  derivative: string;
  is_negative_log: boolean;
  is_meaningful: boolean;
  explanation: string;
}

export interface DesignedLossValue {
  loss: number;
  derivative: number;
}

export interface SigmoidSamples {
  x: number[];
  sigmoid: number[];
  derivative: number[];
}

export interface DesignedLossSamples {
  probability: number[];
  referenceLoss: number[];
  referenceDerivative: number[];
  designedLoss: number[];
  designedDerivative: number[];
}

export interface ProbabilityLossSamples {
  probabilities: number[];
  referenceLoss: number[];
  referenceDerivative: number[];
  userLoss: number[];
  userDerivative: number[];
  showUserCurve: boolean;
}

export interface WeatherSignalFrame {
  elapsed: number;
  raw: number;
  probability: number;
  humidity: number;
  pressure: number;
  signalStrength: number;
  scale: number;
}

export const WEATHER_ITEMS: readonly WeatherItem[] = Object.freeze([
  Object.freeze({
    key: 'sunny',
    label: '晴天',
    icon: '☀️',
    className: 'is-sunny',
  }),
  Object.freeze({
    key: 'cloudy',
    label: '阴天',
    icon: '☁️',
    className: 'is-cloudy',
  }),
  Object.freeze({
    key: 'rainy',
    label: '下雨',
    icon: '🌧️',
    className: 'is-rainy',
  }),
]);

export const FORECASTS: readonly Forecast[] = Object.freeze([
  Object.freeze({
    provider: '天气预报 A',
    probabilities: Object.freeze([0.7, 0.2, 0.1] as const),
  }),
  Object.freeze({
    provider: '天气预报 B',
    probabilities: Object.freeze([0.2, 0.3, 0.5] as const),
  }),
  Object.freeze({
    provider: '天气预报 C',
    probabilities: Object.freeze([0.05, 0.05, 0.9] as const),
  }),
]);

export const INDEPENDENT_LOGITS: readonly number[] = Object.freeze([
  1.8,
  1.1,
  0.7,
]);

export const WEATHER_ANIMATION_DURATION_MS = 15_000;

export function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-value));
}

export function softmax(values: readonly number[]): number[] {
  const maxValue = Math.max(...values);
  const exps = values.map((value) => Math.exp(value - maxValue));
  const sum = exps.reduce((total, value) => total + value, 0) || 1;
  return exps.map((value) => value / sum);
}

/**
 * Samples the Sigmoid curve and its derivative exactly as the legacy module:
 * at least 120 intervals and both range endpoints are included.
 */
export function sampleSigmoidRange(
  minimum: number,
  maximum: number,
  pointCount = 600,
): SigmoidSamples {
  const x: number[] = [];
  const functionValues: number[] = [];
  const derivativeValues: number[] = [];
  const count = Math.max(120, pointCount || 600);

  for (let index = 0; index <= count; index += 1) {
    const z = minimum + ((maximum - minimum) * index) / count;
    const value = Math.max(
      Number.MIN_VALUE,
      Math.min(1 - Number.EPSILON, sigmoid(z)),
    );
    x.push(z);
    functionValues.push(value);
    derivativeValues.push(value * (1 - value));
  }

  return {
    x,
    sigmoid: functionValues,
    derivative: derivativeValues,
  };
}

export function percent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export const formatPercent = percent;

export function formatAnimatedNumber(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude >= 1000) {
    return `${value >= 0 ? '+' : ''}${value.toExponential(2)}`;
  }
  if (magnitude >= 100) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(0)}`;
  }
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
}

export function formatSigmoidValue(value: number): string {
  if (value < 0.000001) return '<0.000001';
  if (value > 0.999999) return '>0.999999';
  return value.toFixed(6);
}

export function exponentialExcursion(
  sign: -1 | 1,
  progress: number,
): number {
  const arc = Math.sin(Math.PI * progress);
  const exponential = (Math.exp(arc * 8) - 1) / (Math.exp(8) - 1);
  return sign * (10 + exponential * (80_000 - 10));
}

/**
 * The original 15-second logit trajectory:
 * -10 → 10 → a very large positive value → 10 → -10 → a very large
 * negative value → -10.
 */
export function scheduledRawValue(elapsed: number): number {
  const time = (
    (elapsed % WEATHER_ANIMATION_DURATION_MS)
    + WEATHER_ANIMATION_DURATION_MS
  ) % WEATHER_ANIMATION_DURATION_MS;
  if (time < 5_000) return -10 + (time / 5_000) * 20;
  if (time < 7_500) {
    return exponentialExcursion(1, (time - 5_000) / 2_500);
  }
  if (time < 12_500) return 10 - ((time - 7_500) / 5_000) * 20;
  return exponentialExcursion(-1, (time - 12_500) / 2_500);
}

export function weatherSignalFrame(elapsed: number): WeatherSignalFrame {
  const normalizedElapsed = Math.max(0, elapsed);
  const raw = scheduledRawValue(normalizedElapsed);
  const offset = 2.8 * Math.sin((normalizedElapsed / 3_000) * Math.PI * 2);
  const inputOne = raw / 3.6 + offset;
  const inputTwo = -raw / 2.7 + offset * (1.8 / 1.35);
  const loopTime = normalizedElapsed % WEATHER_ANIMATION_DURATION_MS;
  let sizeProgress: number;

  if (loopTime < 6_250) {
    sizeProgress = (loopTime + 1_250) / 7_500;
  } else if (loopTime < 13_750) {
    sizeProgress = 1 - (loopTime - 6_250) / 7_500;
  } else {
    sizeProgress = (loopTime - 13_750) / 7_500;
  }

  return {
    elapsed: normalizedElapsed,
    raw,
    probability: sigmoid(raw),
    humidity: Math.round(clamp(66 + inputOne * 1.4, 18, 98)),
    pressure: Math.round(clamp(1013 - inputTwo * 0.7, 970, 1045)),
    signalStrength: clamp(Math.log10(Math.abs(raw) + 1) / 5, 0.12, 1),
    scale: 0.88 + sizeProgress * 0.28,
  };
}

export function evaluateDesignedLoss(
  design: Pick<ProbabilityLossDesign, 'family' | 'scale' | 'power'>,
  probability: number,
): DesignedLossValue {
  const scale = Number(design.scale) || 1;
  const power = Number(design.power) || 2;

  if (design.family === 'negative_log') {
    return {
      loss: -scale * Math.log(probability),
      derivative: -scale / probability,
    };
  }
  if (design.family === 'quadratic') {
    return {
      loss: scale * Math.pow(1 - probability, power),
      derivative:
        -scale * power * Math.pow(1 - probability, power - 1),
    };
  }
  if (design.family === 'inverse') {
    return {
      loss: scale * (Math.pow(probability, -power) - 1),
      derivative:
        -scale * power * Math.pow(probability, -power - 1),
    };
  }

  // On 0 < p < 1, the allowed absolute family a*abs(1-p) is identical
  // to the legacy linear fallback a*(1-p).
  return {
    loss: scale * (1 - probability),
    derivative: -scale,
  };
}

/** Reproduces the logarithmic + linear probability sampling of the old chart. */
export function sampleProbabilityRange(): number[] {
  const samples: number[] = [];
  for (let index = 0; index <= 320; index += 1) {
    samples.push(Math.pow(10, -6 + (6 * index) / 320));
  }
  for (let index = 1; index <= 500; index += 1) {
    samples.push(index / 500);
  }
  samples.sort((left, right) => left - right);
  return samples.filter(
    (value, index, values) =>
      index === 0 || Math.abs(value - values[index - 1]) > 1e-12,
  );
}

export function sampleDesignedLossRange(
  design: Pick<ProbabilityLossDesign, 'family' | 'scale' | 'power'>,
): DesignedLossSamples {
  const probability = sampleProbabilityRange();
  const referenceLoss: number[] = [];
  const referenceDerivative: number[] = [];
  const designedLoss: number[] = [];
  const designedDerivative: number[] = [];

  probability.forEach((value) => {
    const candidate = evaluateDesignedLoss(design, value);
    referenceLoss.push(-Math.log(value));
    referenceDerivative.push(-1 / value);
    designedLoss.push(candidate.loss);
    designedDerivative.push(candidate.derivative);
  });

  return {
    probability,
    referenceLoss,
    referenceDerivative,
    designedLoss,
    designedDerivative,
  };
}

/** Chart-ready compatibility shape used by the BCE teaching block. */
export function sampleProbabilityLoss(
  design: ProbabilityLossDesign,
): ProbabilityLossSamples {
  const sampled = sampleDesignedLossRange(design);
  return {
    probabilities: sampled.probability,
    referenceLoss: sampled.referenceLoss,
    referenceDerivative: sampled.referenceDerivative,
    userLoss: sampled.designedLoss,
    userDerivative: sampled.designedDerivative,
    showUserCurve: design.is_meaningful !== false
      && design.is_negative_log !== true,
  };
}

export function binaryCrossEntropyWithLogits(
  logit: number,
  target: number,
): number {
  return (
    Math.max(logit, 0)
    - logit * target
    + Math.log1p(Math.exp(-Math.abs(logit)))
  );
}

export function crossEntropyFromLogits(
  logits: readonly number[],
  targetIndex: number,
): number {
  const maximum = Math.max(...logits);
  const logSumExp =
    maximum
    + Math.log(
      logits.reduce(
        (total, value) => total + Math.exp(value - maximum),
        0,
      ),
    );
  return logSumExp - logits[targetIndex];
}
