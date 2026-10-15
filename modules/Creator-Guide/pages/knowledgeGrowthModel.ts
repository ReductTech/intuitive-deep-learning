const scales = [72, 135, 240, 300];
const foundations = [58, 44, 34, 30];
export const fieldDirections = [
  [-1.06, -.05, .72, 2, -2.65],
  [-1.5, -.42, .62],
  [-1.06],
  [-1.06],
];
const reaches = [[1.75, 1.28, 1.52, 1.8, 1.38], [1.18, 1.12, 1.06], [1.018], [.8]];
const clamp = (t: number) => Math.max(0, Math.min(1, t));
const smooth = (t: number) => { const x = clamp(t); return x * x * (3 - 2 * x); };
const deltaAngle = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

export function frontierRadius(stage: number, angle: number) {
  return scales[stage] * (1 + .075 * Math.sin(3 * angle + .4) + .045 * Math.cos(5 * angle - .7) + .015 * Math.sin(9 * angle));
}

// Fixed irregularity gives each branch its own organic upper/lower contour.
// The exponent integrates a strictly positive rate, so BOTH sides always
// narrow with depth. The fractional-power cap rounds the end instead of a cone.
export function branchWidth(stage: number, branch: number, side: number, depth: number) {
  const t = clamp(depth);
  const seed = stage * 3.17 + branch * 2.39 + side * 1.73;
  const frequency = 6.5 + 1.5 * Math.sin(seed);
  const integral = t + (Math.sin(frequency * t + seed) - Math.sin(seed)) / frequency;
  const taper = [.15, .25, .65, .85][stage] + .12 * Math.sin(seed);
  return Math.pow(Math.max(0, 1 - t * t), .35) * Math.exp(-taper * t - .48 * integral);
}
const profiles = fieldDirections.map((directions, stage) => directions.map((_, branch) =>
  [0, 1].map(side => Float64Array.from({ length: 257 }, (_, i) => branchWidth(stage, branch, side, i / 256)))));
function widthAt(stage: number, branch: number, side: number, depth: number) {
  const index = clamp(depth) * 256, left = Math.min(255, Math.floor(index)), t = index - left;
  const values = profiles[stage][branch][side];
  return values[left] * (1 - t) + values[left + 1] * t;
}

export function branchRadius(stage: number, branch: number, angle: number, progress: number) {
  const base = foundations[stage] * smooth(progress / .28);
  if (base === 0) return 0;
  const direction = fieldDirections[stage][branch];
  const delta = deltaAngle(angle, direction);
  if (Math.abs(delta) >= Math.PI / 2) return base;
  const start = .28 + branch * .035;
  const extension = smooth((progress - start) / (1 - start));
  const target = frontierRadius(stage, direction) * reaches[stage][branch];
  const tip = base + (target - base) * extension;
  if (Math.abs(delta) < 1e-10) return tip;
  const cosine = Math.cos(delta), sine = Math.abs(Math.sin(delta));
  // Solve the ray's intersection with a monotone Cartesian width profile.
  // Increasing tip length expands this region, retaining prior knowledge.
  let low = 0, high = Math.hypot(tip, base);
  for (let i = 0; i < 24; i++) {
    const radius = (low + high) / 2;
    if (radius * sine <= base * widthAt(stage, branch, delta < 0 ? 0 : 1, radius * cosine / tip)) low = radius;
    else high = radius;
  }
  return Math.max(base, (low + high) / 2);
}

export function growingRadius(stage: number, angle: number, _foundation: number, progress: number) {
  return Math.max(...fieldDirections[stage].map((_, branch) => branchRadius(stage, branch, angle, progress)));
}
export function personalRadius(stage: number, angle: number) {
  return growingRadius(stage, angle, 1, 1);
}
