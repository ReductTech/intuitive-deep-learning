/** Analytic grayscale teaching scene: continuous coordinates, no photograph loading. */
export function grayAt(x: number, y: number): number {
  let value = .88 - .18 * y + .035 * Math.sin(x * 5);
  const sun = Math.hypot((x - .77) * 1.3, y - .23);
  if (sun < .095) value = .99 - sun * .45;
  const ridge = .47 - .13 * Math.exp(-(((x - .33) / .15) ** 2)) - .19 * Math.exp(-(((x - .61) / .14) ** 2));
  if (y > ridge) value = .32 + .16 * x + .1 * y;
  const hill = .69 + .08 * Math.sin(x * 7);
  if (y > hill) value = .13 + .19 * x + .06 * y;
  // A small house and narrow window divisions provide spatial detail.
  if (x > .12 && x < .25 && y > .6 && y < .78) value = .79 - .22 * y;
  if (x > .09 && x < .28 && y > .52 + Math.abs(x - .185) * .85 && y < .61) value = .19;
  if (x > .145 && x < .22 && y > .635 && y < .7) {
    value = .24;
    if (Math.abs(x - .1825) < .004 || Math.abs(y - .6675) < .004) value = .82;
  }
  if (x > .17 && x < .2 && y > .72 && y < .78) value = .26;
  if (y > .8 && y < .84 && x > .38 && x < .9) value = .47 + .05 * Math.sin(x * 120);
  return Math.max(0, Math.min(1, value));
}

export const sampleSizes = [64, 32, 16, 8] as const;
export const grayLevels = [256, 16, 4, 2] as const;
export function samplePoint(x: number, y: number, columns: number) {
  const rows = columns * 3 / 4;
  const column = Math.min(columns - 1, Math.max(0, Math.floor(x * columns)));
  const row = Math.min(rows - 1, Math.max(0, Math.floor(y * rows)));
  return { column, row, x: (column + .5) / columns, y: (row + .5) / rows, rows };
}
export function quantize(value: number, levels: number): number {
  return Math.round(value * (levels - 1)) / (levels - 1);
}
