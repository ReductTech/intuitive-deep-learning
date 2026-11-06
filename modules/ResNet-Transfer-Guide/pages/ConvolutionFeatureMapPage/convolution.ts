export const INPUT_SIZE = 7;
export const KERNEL_SIZE = 3;
export const OUTPUT_SIZE = INPUT_SIZE - KERNEL_SIZE + 1;
export const INPUT = Array.from({ length: INPUT_SIZE * INPUT_SIZE }, (_, index) => index % INPUT_SIZE < 3 ? 9 : 0);
export const KERNEL = [1, 0, -1, 1, 0, -1, 1, 0, -1];

/** CNN convention: slide without flipping weights (cross-correlation), stride 1, no padding or bias. */
export function calculateResponse(position: number) {
  if (!Number.isInteger(position) || position < 0 || position >= OUTPUT_SIZE ** 2) {
    throw new RangeError('Output position must be between 0 and 24');
  }
  const row = Math.floor(position / OUTPUT_SIZE);
  const column = position % OUTPUT_SIZE;
  const values = KERNEL.map((_, index) => INPUT[(row + Math.floor(index / KERNEL_SIZE)) * INPUT_SIZE + column + index % KERNEL_SIZE]);
  const products = values.map((value, index) => value * KERNEL[index]);
  return { row, column, values, products, sum: products.reduce((sum, product) => sum + product, 0) };
}

export function nextUnwritten(outputs: (number | null)[], position: number) {
  for (let offset = 1; offset <= outputs.length; offset++) {
    const index = (position + offset) % outputs.length;
    if (outputs[index] === null) return index;
  }
  return -1;
}
