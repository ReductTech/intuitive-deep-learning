export interface GaltonPoint {
  parent: number;
  child: number;
}

/**
 * Teaching sample inspired by Francis Galton's 1886 stature tables.
 * It preserves the historical relationship (mid-parent height → adult child
 * height) while remaining small enough to inspect on a slide.
 */
export const galtonTeachingPoints: GaltonPoint[] = [
  { parent: 154, child: 157 }, { parent: 158, child: 160 },
  { parent: 160, child: 163 }, { parent: 162, child: 164 },
  { parent: 165, child: 166 }, { parent: 166, child: 170 },
  { parent: 168, child: 167 }, { parent: 170, child: 172 },
  { parent: 172, child: 174 }, { parent: 174, child: 171 },
  { parent: 176, child: 178 }, { parent: 178, child: 176 },
  { parent: 181, child: 182 }, { parent: 184, child: 180 },
];

export const galtonSources = [
  'Francis Galton, “Regression towards Mediocrity in Hereditary Stature”, Journal of the Anthropological Institute, 1886.',
  '数据点为教学示意样本，按 Galton 的“父母平均身高—成年子女身高”关系重绘；不是原始表格的逐行抄录。',
];

export function predict(parent: number, slope: number, intercept: number) {
  return slope * parent + intercept;
}

export function residual(point: GaltonPoint, slope: number, intercept: number) {
  return point.child - predict(point.parent, slope, intercept);
}

export function mae(slope: number, intercept: number) {
  return galtonTeachingPoints.reduce((sum, point) => sum + Math.abs(residual(point, slope, intercept)), 0) / galtonTeachingPoints.length;
}

export function mse(slope: number, intercept: number) {
  return galtonTeachingPoints.reduce((sum, point) => {
    const error = residual(point, slope, intercept);
    return sum + error * error;
  }, 0) / galtonTeachingPoints.length;
}
