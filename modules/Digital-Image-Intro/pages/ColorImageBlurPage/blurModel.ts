// Each channel uses the same normalized separable Gaussian kernel.
// Replicate boundary pixels; retain floating precision until both passes finish.
export function blurChannel(input: Uint8Array, width: number, height: number, sigma: number): Uint8Array {
  if (sigma <= 0) return input.slice();
  const radius = Math.ceil(3 * sigma);
  const kernel = Array.from({ length: radius * 2 + 1 }, (_, i) => Math.exp(-((i - radius) ** 2) / (2 * sigma * sigma)));
  const sum = kernel.reduce((a, b) => a + b, 0);
  kernel.forEach((v, i) => { kernel[i] = v / sum; });
  const temp = new Float64Array(input.length), output = new Uint8Array(input.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    for (let k = -radius; k <= radius; k++) temp[y * width + x] += input[y * width + Math.max(0, Math.min(width - 1, x + k))] * kernel[k + radius];
  }
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let value = 0;
    for (let k = -radius; k <= radius; k++) value += temp[Math.max(0, Math.min(height - 1, y + k)) * width + x] * kernel[k + radius];
    output[y * width + x] = Math.round(value);
  }
  return output;
}
