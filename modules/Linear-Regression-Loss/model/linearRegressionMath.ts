export interface HeightPair {
  parent: number;
  child: number;
}

// A compact teaching sample inspired by Galton's 1886 parent/child height study (in inches).
export const galtonSample: HeightPair[] = [
  { parent: 64, child: 63 }, { parent: 65, child: 65 }, { parent: 66, child: 66 },
  { parent: 66, child: 68 }, { parent: 67, child: 66 }, { parent: 68, child: 69 },
  { parent: 69, child: 68 }, { parent: 69, child: 71 }, { parent: 70, child: 70 },
  { parent: 71, child: 72 }, { parent: 72, child: 71 }, { parent: 73, child: 74 },
  { parent: 74, child: 73 }, { parent: 75, child: 75 },
];

export function predict(parent: number, slope: number, intercept: number) { return slope * parent + intercept; }
export function residual(point: HeightPair, slope: number, intercept: number) { return point.child - predict(point.parent, slope, intercept); }
export function mse(points: HeightPair[], slope: number, intercept: number) { return points.reduce((sum, point) => sum + residual(point, slope, intercept) ** 2, 0) / points.length; }
export function mae(points: HeightPair[], slope: number, intercept: number) { return points.reduce((sum, point) => sum + Math.abs(residual(point, slope, intercept)), 0) / points.length; }
export function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }
