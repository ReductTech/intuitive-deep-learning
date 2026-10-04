/** Two consecutive examples: one 3×3 window, then the same kernel on a 4×4 image. */
export const UPDATE_KERNEL = [0, 0, 0, 0, 0.2, 0.4, 0, 0, 0] as const;
export const SINGLE_WINDOW_IMAGE = [[0, 0, 0], [0, 1, 1], [0, 0, 0]] as const;
export const SHARED_WINDOW_IMAGE = [[0, 0, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]] as const;
export const UPDATE_TARGET = 1;
export const UPDATE_RATE = 0.05;

export function updatePatch(image: readonly (readonly number[])[], position: number) {
  const columns = image[0].length - 2;
  return Array.from({ length: 9 }, (_, i) => image[Math.floor(position / columns) + Math.floor(i / 3)][position % columns + i % 3]);
}

export function traceKernelUpdate(image: readonly (readonly number[])[], kernel: readonly number[]) {
  const positions = (image.length - 2) * (image[0].length - 2);
  const patches = Array.from({ length: positions }, (_, i) => updatePatch(image, i));
  const outputs = patches.map(patch => patch.reduce((sum, pixel, i) => sum + pixel * kernel[i], 0));
  // A single output is already the prediction; multiple outputs are summed.
  const prediction = outputs.reduce((sum, value) => sum + value, 0);
  const delta = prediction - UPDATE_TARGET;
  const contributions = kernel.map((_, i) => patches.map(patch => delta * patch[i]));
  const gradients = contributions.map(terms => terms.reduce((sum, value) => sum + value, 0));
  return { patches, outputs, prediction, delta, loss: 0.5 * delta * delta, contributions, gradients };
}

function example(image: readonly (readonly number[])[]) {
  const before = traceKernelUpdate(image, UPDATE_KERNEL);
  const updated = UPDATE_KERNEL.map((value, i) => value - UPDATE_RATE * before.gradients[i]);
  return { image, before, updated, after: traceKernelUpdate(image, updated) };
}
export const SINGLE_WINDOW_UPDATE = example(SINGLE_WINDOW_IMAGE);
export const SHARED_WINDOW_UPDATE = example(SHARED_WINDOW_IMAGE);
