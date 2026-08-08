export interface Point2D {
  x: number;
  y: number;
}

export interface AdamRecord {
  gradient: number;
  firstMoment: number;
  secondMoment: number;
  correctedFirstMoment: number;
  correctedSecondMoment: number;
  update: number;
}

const STOCHASTIC_NOISE: Point2D[] = [
  { x: 1.15, y: -.3 },
  { x: -1.05, y: .24 },
  { x: .92, y: -.22 },
  { x: -.82, y: .18 },
  { x: .7, y: -.14 },
  { x: -.58, y: .1 },
  { x: .45, y: -.08 },
  { x: -.34, y: .05 },
];

function valleyGradient(point: Point2D): Point2D {
  return { x: .28 * point.x, y: 1.7 * point.y };
}

function noisyGradient(point: Point2D, index: number): Point2D {
  const gradient = valleyGradient(point);
  const noise = STOCHASTIC_NOISE[index % STOCHASTIC_NOISE.length];
  return { x: gradient.x + noise.x, y: gradient.y + noise.y };
}

export function simulateOneDimensionalSgd(learningRate: number, steps = 8, start = 4.5) {
  const parameters = [start];
  let parameter = start;
  for (let index = 0; index < steps; index += 1) {
    parameter -= learningRate * parameter;
    parameters.push(parameter);
  }
  return parameters;
}

export function simulateBatchAndSgd(steps = STOCHASTIC_NOISE.length) {
  const start = { x: -4.4, y: 3.1 };
  const batch = [start];
  const stochastic = [start];
  let batchPoint = start;
  let stochasticPoint = start;

  for (let index = 0; index < steps; index += 1) {
    const batchGradient = valleyGradient(batchPoint);
    batchPoint = {
      x: batchPoint.x - .72 * batchGradient.x,
      y: batchPoint.y - .72 * batchGradient.y,
    };
    const stochasticGradient = noisyGradient(stochasticPoint, index);
    stochasticPoint = {
      x: stochasticPoint.x - .72 * stochasticGradient.x,
      y: stochasticPoint.y - .72 * stochasticGradient.y,
    };
    batch.push(batchPoint);
    stochastic.push(stochasticPoint);
  }

  return { batch, stochastic };
}

export function simulateMomentum(beta: number, steps = STOCHASTIC_NOISE.length) {
  const start = { x: -4.4, y: 3.1 };
  const points = [start];
  const velocities: Point2D[] = [];
  let point = start;
  let velocity = { x: 0, y: 0 };

  for (let index = 0; index < steps; index += 1) {
    const gradient = noisyGradient(point, index);
    velocity = {
      x: beta * velocity.x + (1 - beta) * gradient.x,
      y: beta * velocity.y + (1 - beta) * gradient.y,
    };
    point = {
      x: point.x - 1.15 * velocity.x,
      y: point.y - 1.15 * velocity.y,
    };
    velocities.push(velocity);
    points.push(point);
  }

  return { points, velocities };
}

export function buildAdamRecords(
  gradients: number[],
  betaOne = .8,
  betaTwo = .9,
  learningRate = .3,
): AdamRecord[] {
  let firstMoment = 0;
  let secondMoment = 0;
  return gradients.map((gradient, index) => {
    const step = index + 1;
    firstMoment = betaOne * firstMoment + (1 - betaOne) * gradient;
    secondMoment = betaTwo * secondMoment + (1 - betaTwo) * gradient ** 2;
    const correctedFirstMoment = firstMoment / (1 - betaOne ** step);
    const correctedSecondMoment = secondMoment / (1 - betaTwo ** step);
    return {
      gradient,
      firstMoment,
      secondMoment,
      correctedFirstMoment,
      correctedSecondMoment,
      update: learningRate * correctedFirstMoment / (Math.sqrt(correctedSecondMoment) + 1e-8),
    };
  });
}
