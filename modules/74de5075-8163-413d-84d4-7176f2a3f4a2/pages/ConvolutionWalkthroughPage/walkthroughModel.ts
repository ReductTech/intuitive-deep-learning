export const INPUT_SIZE = 128;
export const OUTPUT_SIZE = INPUT_SIZE - 2;
export const OUTPUT_COUNT = OUTPUT_SIZE ** 2;
export const KERNELS = {
  vertical: [-1, 0, 1, -2, 0, 2, -1, 0, 1],
  horizontal: [-1, -2, -1, 0, 0, 0, 1, 2, 1],
} as const;
export type KernelDirection = keyof typeof KERNELS;
export const KERNEL = KERNELS.vertical;
export const SLOW_DURATIONS = [3200, 2200, 1100];
export const LOCAL_COUNT = SLOW_DURATIONS.length;
export const SLOW_MS = SLOW_DURATIONS.reduce((a, b) => a + b, 0);
export const ZOOM_MS = 3200;
export const FAST_MS = 6500;
export const HOLD_MS = 2500;
export const CYCLE_MS = SLOW_MS + ZOOM_MS + FAST_MS + HOLD_MS;
export const ease = (t: number) => { const p = Math.max(0, Math.min(1, t)); return p * p * (3 - 2 * p); };

export function patchAt(gray: readonly number[], index: number) {
  const x = index % OUTPUT_SIZE, y = Math.floor(index / OUTPUT_SIZE);
  return KERNEL.map((_, k) => gray[(y + Math.floor(k / 3)) * INPUT_SIZE + x + k % 3]);
}
export function correlate(gray: readonly number[], kernel: readonly number[] = KERNEL) {
  return Array.from({ length: OUTPUT_COUNT }, (_, index) => patchAt(gray, index).reduce((sum, value, k) => sum + value * kernel[k], 0));
}
export function frameAt(elapsed: number) {
  const cycle = Math.floor(elapsed / CYCLE_MS), time = elapsed % CYCLE_MS;
  let start = 0;
  for (let index = 0; index < SLOW_DURATIONS.length; index++) {
    const duration = SLOW_DURATIONS[index];
    if (time < start + duration) {
      const progress = (time - start) / duration;
      return { cycle, phase: 'slow' as const, index, term: Math.min(8, Math.floor(progress / .75 * 9)), pulse: time === 0 ? 'none' as const : progress < .32 ? 'input' as const : progress < .7 ? 'kernel' as const : 'output' as const, summed: progress >= .7, completed: index + (progress >= .7 ? 1 : 0), zoom: 0, move: index < LOCAL_COUNT - 1 ? ease((progress - .9) / .1) : 0 };
    }
    start += duration;
  }
  if (time < SLOW_MS + ZOOM_MS) return { cycle, phase: 'zoom' as const, pulse: 'none' as const, index: LOCAL_COUNT - 1, term: 8, summed: true, completed: LOCAL_COUNT, zoom: ease((time - SLOW_MS) / ZOOM_MS), move: 0 };
  const progress = Math.min(1, (time - SLOW_MS - ZOOM_MS) / FAST_MS);
  const completed = Math.min(OUTPUT_COUNT, LOCAL_COUNT + Math.floor(progress ** 2 * (OUTPUT_COUNT - LOCAL_COUNT)));
  return { cycle, phase: progress < 1 ? 'fast' as const : 'hold' as const, pulse: 'none' as const, index: Math.min(OUTPUT_COUNT - 1, completed), term: 8, summed: true, completed, zoom: 1, move: 0 };
}
