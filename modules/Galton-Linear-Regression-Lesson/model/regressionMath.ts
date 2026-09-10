import type { HeightObservation } from '../data/galtonStory';

export interface LineParameters {
  slope: number;
  intercept: number;
}

export function predict(x: number, line: LineParameters) {
  return line.slope * x + line.intercept;
}

export function residual(point: HeightObservation, line: LineParameters) {
  return point.child - predict(point.parent, line);
}

export function mae(points: HeightObservation[], line: LineParameters) {
  return points.reduce((sum, point) => sum + Math.abs(residual(point, line)), 0) / points.length;
}

export function mse(points: HeightObservation[], line: LineParameters) {
  return points.reduce((sum, point) => {
    const error = residual(point, line);
    return sum + error ** 2;
  }, 0) / points.length;
}

export const referenceLine: LineParameters = { slope: 0.82, intercept: 31 };
export const startingLine: LineParameters = { slope: 0.5, intercept: 80 };

