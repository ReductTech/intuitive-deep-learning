export type Point = { x: number; y: number };
export type Preset = 'shadows' | 'contrast' | 'highlights' | 'invert' | 'identity';
export const clamp = (value: number, min = 0, max = 255) => Math.max(min, Math.min(max, value));
export function presetPoints(preset: Preset): Point[] {
  const xs = [0, 64, 128, 192, 255];
  const ys = preset === 'shadows' ? [0, 108, 164, 216, 255] : preset === 'contrast' ? [0, 36, 128, 220, 255] : preset === 'highlights' ? [0, 64, 128, 170, 215] : preset === 'invert' ? [255, 191, 127, 63, 0] : xs;
  return xs.map((x, i) => ({ x, y: ys[i] }));
}
// Shape-preserving cubic Hermite interpolation: smooth without overshooting adjacent values.
export function curveValue(points: Point[], input: number): number {
  const n = points.length, h = points.slice(1).map((p, i) => p.x - points[i].x);
  const d = h.map((width, i) => (points[i + 1].y - points[i].y) / width);
  const m = Array(n).fill(0);
  const endpoint = (h0: number, h1: number, d0: number, d1: number) => {
    const value = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1);
    if (Math.sign(value) !== Math.sign(d0)) return 0;
    return Math.sign(d0) !== Math.sign(d1) && Math.abs(value) > 3 * Math.abs(d0) ? 3 * d0 : value;
  };
  m[0] = endpoint(h[0], h[1], d[0], d[1]);
  m[n - 1] = endpoint(h[n - 2], h[n - 3], d[n - 2], d[n - 3]);
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) continue;
    const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1];
    m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  }
  let i = 0;
  while (i < n - 2 && input > points[i + 1].x) i++;
  const t = clamp((input - points[i].x) / h[i], 0, 1), t2 = t * t, t3 = t2 * t;
  return clamp((2 * t3 - 3 * t2 + 1) * points[i].y + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * points[i + 1].y + (t3 - t2) * h[i] * m[i + 1]);
}
export function histogram(values: Uint8Array): number[] {
  const counts = Array(256).fill(0); values.forEach(value => counts[value]++); return counts;
}
