export type SearchDimension = 1 | 2 | 3;
export type SearchCandidate = { values: number[]; loss: number };
export const VALUES_PER_PARAMETER = 5;
export const SEARCH_STEP_MS = 10;

/** A fixed teaching objective, independent of traversal order and display projection. */
export function createSearchSpace(dimension: SearchDimension): SearchCandidate[] {
  return Array.from({ length: VALUES_PER_PARAMETER ** dimension }, (_, index) => {
    const values = Array.from({ length: dimension }, (_, axis) => Math.floor(index / VALUES_PER_PARAMETER ** axis) % VALUES_PER_PARAMETER + 1);
    const loss = values.reduce((sum, value) => sum + ((value - 3) / 2) ** 2, 0) / dimension;
    return { values, loss };
  });
}

/** Continuous cool-to-warm heat scale for the fixed normalized loss [0, 1]. */
export function lossColor(loss: number): string {
  const stops = [[55, 118, 232], [117, 185, 230], [242, 229, 196], [239, 172, 130], [215, 95, 98]];
  const scaled = Math.max(0, Math.min(1, loss)) * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  const t = scaled - index;
  return `rgb(${stops[index].map((value, channel) => Math.round(value + (stops[index + 1][channel] - value) * t)).join(', ')})`;
}
