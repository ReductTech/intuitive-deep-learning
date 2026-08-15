export type Function2DId = 'line2d' | 'parabola2d' | 'fold2d';
export type Surface3DId = 'plane3d' | 'bowl3d' | 'fold3d';

export const FUNCTION_2D_DEFINITIONS = {
  line2d: { formula: 'y = 0.72x - 0.18', fn: (x: number) => 0.72 * x - 0.18 },
  parabola2d: { formula: 'y = 0.75x² - 0.35', fn: (x: number) => 0.75 * x * x - 0.35 },
  fold2d: { formula: 'y = max(0, x)', fn: (x: number) => Math.max(0, x) },
} satisfies Record<Function2DId, { formula: string; fn: (x: number) => number }>;

export const SURFACE_3D_DEFINITIONS = {
  plane3d: { formula: 'z = 0.55x - 0.30y + 0.05', fn: (x: number, y: number) => 0.55 * x - 0.3 * y + 0.05 },
  bowl3d: { formula: 'z = 0.65(x² + y²) - 0.58', fn: (x: number, y: number) => 0.65 * (x * x + y * y) - 0.58 },
  fold3d: { formula: 'z = max(0, x + 0.55y) - 0.42', fn: (x: number, y: number) => Math.max(0, x + 0.55 * y) - 0.42 },
} satisfies Record<Surface3DId, { formula: string; fn: (x: number, y: number) => number }>;
