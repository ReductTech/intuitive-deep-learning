/** Exact, small convolution example for explaining how all nine shared weights update. */
export const INPUT = [
  [1, 0, 2, 1],
  [0, 1, 1, 0],
  [2, 1, 0, 1],
  [1, 0, 1, 2],
] as const;

export const INITIAL_KERNEL = [
  0.20, -0.10, 0.05,
  0.30, 0.00, -0.20,
  -0.05, 0.10, 0.25,
] as const;

// One scalar prediction with L1 loss. Head weights stay fixed.
export const HEAD_5 = [0.1, 0.2, -0.3, 0.4] as const;
export const TARGET = 1;
export const LEARNING_RATE = 0.1;
export function traceConvolution(kernel: readonly number[]) {
  const output = Array.from({ length: 4 }, (_, position) => {
    const row = Math.floor(position / 2), col = position % 2;
    return kernel.reduce((sum, weight, index) => sum + weight * INPUT[row + Math.floor(index / 3)][col + index % 3], 0);
  });
  const prediction = output.reduce((sum, value, index) => sum + value * HEAD_5[index], 0);
  const error = prediction - TARGET;
  const predictionGradient = Math.sign(error);
  const outputGradient = HEAD_5.map(weight => predictionGradient * weight);
  const contributions = kernel.map((_, index) => outputGradient.map((delta, position) => {
    const pixel = INPUT[Math.floor(position / 2) + Math.floor(index / 3)][position % 2 + index % 3];
    return { delta, pixel, product: delta * pixel };
  }));
  const gradient = contributions.map(terms => terms.reduce((sum, term) => sum + term.product, 0));
  return { output, prediction, error, predictionGradient, loss: Math.abs(error), outputGradient, contributions, gradient };
}
export const BEFORE = traceConvolution(INITIAL_KERNEL);
export const UPDATED_KERNEL = INITIAL_KERNEL.map((weight, index) => weight - LEARNING_RATE * BEFORE.gradient[index]);
export const AFTER = traceConvolution(UPDATED_KERNEL);
