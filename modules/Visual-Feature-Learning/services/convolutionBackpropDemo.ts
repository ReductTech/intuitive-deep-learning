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

// A fixed two-class linear head: logit(3) = 0, logit(5) = bias + sum(a_i * Y_i).
// Target label is 3. The head stays fixed on this page so only kernel updates are shown.
const HEAD_5 = [0.3, 0.4, -1.2, 0.5] as const;
const HEAD_5_BIAS = 1;
export const LEARNING_RATE = 0.1;

export function traceConvolution(kernel: readonly number[]) {
  const output = Array.from({ length: 4 }, (_, position) => {
    const row = Math.floor(position / 2);
    const col = position % 2;
    return kernel.reduce((sum, weight, index) =>
      sum + weight * INPUT[row + Math.floor(index / 3)][col + index % 3], 0);
  });
  const logit5 = HEAD_5_BIAS + output.reduce((sum, value, index) => sum + value * HEAD_5[index], 0);
  const probability5 = 1 / (1 + Math.exp(-logit5));
  const outputGradient = HEAD_5.map(weight => probability5 * weight);
  const contributions = kernel.map((_, weightIndex) => outputGradient.map((delta, position) => {
    const row = Math.floor(position / 2);
    const col = position % 2;
    return {
      delta,
      pixel: INPUT[row + Math.floor(weightIndex / 3)][col + weightIndex % 3],
      product: delta * INPUT[row + Math.floor(weightIndex / 3)][col + weightIndex % 3],
    };
  }));
  const gradient = contributions.map(terms => terms.reduce((sum, term) => sum + term.product, 0));
  return { output, probability5, loss: -Math.log(1 - probability5), outputGradient, contributions, gradient };
}

export const BEFORE = traceConvolution(INITIAL_KERNEL);
export const UPDATED_KERNEL = INITIAL_KERNEL.map((weight, index) => weight - LEARNING_RATE * BEFORE.gradient[index]);
export const AFTER = traceConvolution(UPDATED_KERNEL);
