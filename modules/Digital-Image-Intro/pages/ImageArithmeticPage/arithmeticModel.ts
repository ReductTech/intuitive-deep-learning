export type Operation = 'add' | 'subtract' | 'multiply' | 'divide';
export const WIDTH = 480, HEIGHT = 360;
export const clip = (value: number) => Math.round(Math.max(0, Math.min(255, value)));
export function calculate(a: number, b: number, operation: Operation, blend: boolean, alpha: number): number {
  if (operation === 'subtract') return clip(a - b);
  if (operation === 'multiply') return clip(a * b / 255);
  if (operation === 'divide') return clip(a / Math.max(1 / 255, b / 255));
  return clip(blend ? alpha * a + (1 - alpha) * b : a + b);
}
export const regions = [
  { id: 'face', label: '猫脸', x: 353, y: 128, rx: 52, ry: 56 },
  { id: 'plant', label: '绿植', x: 56, y: 65, rx: 55, ry: 50 },
  { id: 'cup', label: '杯子', x: 47, y: 161, rx: 34, ry: 32 },
] as const;
export function makeRegionMask(enabled: readonly boolean[]): Uint8Array {
  return Uint8Array.from({ length: WIDTH * HEIGHT }, (_, i) => {
    const x = i % WIDTH, y = Math.floor(i / WIDTH);
    let weight = .1;
    regions.forEach((region, index) => {
      if (!enabled[index]) return;
      const distance = Math.hypot((x - region.x) / region.rx, (y - region.y) / region.ry);
      // Flat full-brightness interior with a smooth boundary into the dim background.
      const t = Math.max(0, Math.min(1, (1.25 - distance) / .35));
      weight = Math.max(weight, .1 + .9 * t * t * (3 - 2 * t));
    });
    return clip(255 * weight);
  });
}
