export const WIDTH = 600, HEIGHT = 400;
export type Operation = 'brightness' | 'contrast' | 'gamma' | 'threshold';
export const defaults: Record<Operation, number> = { brightness: 40, contrast: 1.5, gamma: .65, threshold: 128 };
export const clip = (v: number) => Math.round(Math.max(0, Math.min(255, v)));
export function applyMask(source: Uint8ClampedArray, mask: Uint8Array, operation: Operation, amount: number): Uint8ClampedArray {
  const output = new Uint8ClampedArray(source);
  mask.forEach((selected, i) => {
    if (!selected) return;
    const offset = i * 4;
    if (operation === 'threshold') {
      const gray = .299 * source[offset] + .587 * source[offset + 1] + .114 * source[offset + 2];
      const value = gray >= amount ? 255 : 0;
      output.set([value, value, value], offset);
    } else for (let channel = 0; channel < 3; channel++) {
      const r = source[offset + channel];
      output[offset + channel] = clip(operation === 'brightness' ? r + amount : operation === 'contrast' ? (r - 127.5) * amount + 127.5 : 255 * (r / 255) ** amount);
    }
  });
  return output;
}
