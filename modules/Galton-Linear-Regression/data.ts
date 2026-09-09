export interface HeightPair {
  parent: number;
  child: number;
}

/**
 * 课堂示意数据：按 Galton 研究中“父母身高与子代身高”关系重绘的 16 对数据。
 * 它用于看见趋势，不冒充 Galton 的全量原始样本。
 */
export const heightPairs: HeightPair[] = [
  { parent: 160, child: 163 },
  { parent: 162, child: 165 },
  { parent: 164, child: 166 },
  { parent: 166, child: 168 },
  { parent: 168, child: 170 },
  { parent: 170, child: 169 },
  { parent: 172, child: 173 },
  { parent: 174, child: 175 },
  { parent: 176, child: 174 },
  { parent: 178, child: 179 },
  { parent: 180, child: 181 },
  { parent: 182, child: 180 },
  { parent: 184, child: 184 },
  { parent: 186, child: 185 },
  { parent: 188, child: 188 },
  { parent: 190, child: 189 },
];

export const plotBounds = { min: 158, max: 192 };

export function predict(parent: number, slope: number, intercept: number): number {
  return slope * parent + intercept;
}

export function meanAbsoluteError(slope: number, intercept: number): number {
  return heightPairs.reduce((sum, pair) => sum + Math.abs(pair.child - predict(pair.parent, slope, intercept)), 0) / heightPairs.length;
}

export function meanSquaredError(slope: number, intercept: number): number {
  return heightPairs.reduce((sum, pair) => {
    const error = pair.child - predict(pair.parent, slope, intercept);
    return sum + error * error;
  }, 0) / heightPairs.length;
}
