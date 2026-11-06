export type Pattern = 'vertical' | 'horizontal' | 'corner';
export type Kernel = 'vertical' | 'horizontal' | 'average';
export type Settings = { pattern: Pattern; kernel: Kernel; stride: 1 | 2; padding: 0 | 1; response: 'signed' | 'absolute' };
export const initialSettings: Settings = { pattern: 'vertical', kernel: 'vertical', stride: 1, padding: 0, response: 'signed' };
export const kernels: Record<Kernel, number[][]> = {
  vertical: [[-1,0,1],[-1,0,1],[-1,0,1]],
  horizontal: [[-1,-1,-1],[0,0,0],[1,1,1]],
  average: [[1/9,1/9,1/9],[1/9,1/9,1/9],[1/9,1/9,1/9]],
};
export function inputPattern(pattern: Pattern): number[][] {
  return Array.from({length:7},(_,r) => Array.from({length:7},(_,c) => pattern === 'vertical' ? Number(c >= 3) : pattern === 'horizontal' ? Number(r >= 3) : Number(r >= 3 && c >= 3)));
}
/** Fixed-filter cross-correlation, the operation commonly used by convolution layers. */
export function correlate(settings: Settings): number[][] {
  const input = inputPattern(settings.pattern), kernel = kernels[settings.kernel];
  const size = Math.floor((7 + 2 * settings.padding - 3) / settings.stride) + 1;
  return Array.from({length:size},(_,r) => Array.from({length:size},(_,c) => {
    let sum = 0;
    for(let kr=0;kr<3;kr++) for(let kc=0;kc<3;kc++) {
      const y=r*settings.stride+kr-settings.padding,x=c*settings.stride+kc-settings.padding;
      sum += (input[y]?.[x] ?? 0) * kernel[kr][kc];
    }
    return Math.abs(sum)<1e-10 ? 0 : sum;
  }));
}
export function formatResponse(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
