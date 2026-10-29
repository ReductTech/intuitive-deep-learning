export type FitPoint = { mass: number; depth: number };
export type LineFit = { w: number; b: number };

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

/** Scale the input before solving to avoid poorly scaled slope/intercept arithmetic. */
export function fitLossChoices(points: FitPoint[]): { mse: LineFit; mae: LineFit } {
  if (!points.length) return { mse: { w: 0, b: 0 }, mae: { w: 0, b: 0 } };
  const scale = Math.max(1, ...points.map(point => Math.abs(point.mass)));
  const samples = points.map(point => ({ x: point.mass / scale, y: point.depth }));
  const mx = samples.reduce((sum, point) => sum + point.x, 0) / samples.length;
  const my = samples.reduce((sum, point) => sum + point.y, 0) / samples.length;
  const xx = samples.reduce((sum, point) => sum + (point.x - mx) ** 2, 0);
  const slope = xx > 1e-12 ? samples.reduce((sum, point) => sum + (point.x - mx) * (point.y - my), 0) / xx : 0;
  const mse = { w: slope / scale, b: my - slope * mx };
  let bestSlope = 0;
  let bestIntercept = median(samples.map(point => point.y));
  let bestLoss = Infinity;
  let bestDistance = Infinity;
  const consider = (candidateSlope: number) => {
    const intercept = median(samples.map(point => point.y - candidateSlope * point.x));
    const loss = samples.reduce((sum, point) => sum + Math.abs(point.y - candidateSlope * point.x - intercept), 0);
    const distance = Math.abs(candidateSlope - slope);
    if (loss < bestLoss - 1e-8 || Math.abs(loss - bestLoss) <= 1e-8 && distance < bestDistance) {
      bestLoss = loss;
      bestDistance = distance;
      bestSlope = candidateSlope;
      bestIntercept = intercept;
    }
  };
  consider(slope);
  // A minimum of the convex piecewise-linear absolute-error objective occurs
  // at a vertex: a fitted line through two observations with distinct inputs.
  // For each such slope, the median gives an optimal intercept. Equal inputs
  // are handled by the constant/median candidate above.
  for (let i = 0; i < samples.length; i++) {
    for (let j = i + 1; j < samples.length; j++) {
      const dx = samples[j].x - samples[i].x;
      if (Math.abs(dx) > 1e-12) consider((samples[j].y - samples[i].y) / dx);
    }
  }
  return { mse, mae: { w: bestSlope / scale, b: bestIntercept } };
}
