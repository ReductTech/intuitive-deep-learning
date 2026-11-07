// Static, spherical, zero-redshift GR family:
// b(r) = r0 (r/r0)^q, q = epsilon0/tau0 < 1.
// Both controls use the same reference stress c^4/(8 pi G (10 m)^2).
export function matterModel(tension: number, energyDensity: number) {
  return { throat: 1 / Math.sqrt(tension), radiusMetres: 10 / Math.sqrt(tension), ratio: energyDensity / tension, valid: energyDensity < tension };
}

export const SPACE_HALF_HEIGHT = 1.6;
export const ENDPOINT_X = -5.5;
export const METRES_PER_UNIT = 10;
export const TRAVEL_SPEED = 1; // m/s, fixed local speed in the zero-redshift model.
export const PLAYBACK_RATE = 20;
export type SpatialPoint = [number, number, number];
export interface ModelPaths { original: SpatialPoint[]; wormhole: SpatialPoint[] | null; }

export function modelPaths(throat: number, ratio: number, valid: boolean): ModelPaths {
  const original: SpatialPoint[] = [[ENDPOINT_X, SPACE_HALF_HEIGHT, 0], ...Array.from({ length: 257 }, (_, i): SpatialPoint => {
    const phi = i / 256 * Math.PI;
    return [6 + SPACE_HALF_HEIGHT * Math.sin(phi), SPACE_HALF_HEIGHT * Math.cos(phi), 0];
  }), [ENDPOINT_X, -SPACE_HALF_HEIGHT, 0]];
  if (!valid) return { original, wormhole: null };
  const profile = matterProfile(throat, ratio, SPACE_HALF_HEIGHT, 'height');
  const wormhole: SpatialPoint[] = [[ENDPOINT_X, SPACE_HALF_HEIGHT, 0], ...Array.from({ length: 513 }, (_, i): SpatialPoint => {
    const p = profile(SPACE_HALF_HEIGHT * (1 - 2 * i / 512));
    return [-p.radius, p.height, 0];
  }), [ENDPOINT_X, -SPACE_HALF_HEIGHT, 0]];
  return { original, wormhole };
}

export function pathDistances(points: SpatialPoint[]) {
  const distances = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    distances.push(distances[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  }
  return distances;
}

export function travelComparison(tension: number, energyDensity: number) {
  const model = matterModel(tension, energyDensity);
  // Measure exactly the paths supplied to the renderer. Constant speed,
  // not a shared normalized animation duration, determines arrival time.
  const paths = modelPaths(model.throat, model.ratio, model.valid);
  const originalDistance = pathDistances(paths.original).at(-1)! * METRES_PER_UNIT;
  const wormholeDistance = paths.wormhole ? pathDistances(paths.wormhole).at(-1)! * METRES_PER_UNIT : null;
  return { paths, originalTime: originalDistance / TRAVEL_SPEED, wormholeTime: wormholeDistance === null ? null : wormholeDistance / TRAVEL_SPEED };
}

export function matterProfile(throat: number, ratio: number, extent = 4.5, coordinate: 'ell' | 'height' = 'ell') {
  const exponent = 1 - ratio;
  const table = [{ ell: 0, radius: throat, height: 0 }];
  // u = sqrt(r/r0 - 1) removes the integrable throat singularity.
  const derivative = (u: number) => {
    if (u === 0) { const limit = 2 * throat / Math.sqrt(exponent); return [limit, limit]; }
    const log = -exponent * Math.log1p(u * u);
    const ell = 2 * throat * u / Math.sqrt(-Math.expm1(log));
    return [ell, ell * Math.exp(log / 2)];
  };
  let u = 0, ell = 0, height = 0, previous = derivative(0);
  while ((coordinate === 'height' ? height : ell) < extent && table.length < 10000) {
    const step = Math.min(.006, extent / previous[coordinate === 'height' ? 1 : 0] / 120);
    u += step;
    const next = derivative(u);
    ell += (previous[0] + next[0]) * step / 2;
    height += (previous[1] + next[1]) * step / 2;
    table.push({ ell, radius: throat * (1 + u * u), height });
    previous = next;
  }
  return (position: number) => {
    const distance = Math.abs(position);
    let low = 0, high = table.length - 1;
    while (high - low > 1) { const mid = (low + high) >> 1; if (table[mid][coordinate] < distance) low = mid; else high = mid; }
    const a = table[low], b = table[high];
    const fraction = Math.max(0, Math.min(1, (distance - a[coordinate]) / Math.max(b[coordinate] - a[coordinate], 1e-12)));
    return { radius: a.radius + (b.radius - a.radius) * fraction, height: Math.sign(position) * (a.height + (b.height - a.height) * fraction), ell: a.ell + (b.ell - a.ell) * fraction };
  };
}
