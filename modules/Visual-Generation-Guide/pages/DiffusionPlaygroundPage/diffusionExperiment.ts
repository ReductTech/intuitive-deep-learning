export const TOTAL_STEPS = 1000;
export const betas = Array.from({ length: TOTAL_STEPS }, (_, i) => .0001 + .0199 * i / 999);
export const alphaBars = [1];
for (let t = 1; t <= TOTAL_STEPS; t++) alphaBars[t] = alphaBars[t - 1] * (1 - betas[t - 1]);

class GaussianGenerator {
  private spare: number | null = null;
  constructor(private state: number) {}
  private uniform() {
    let value = this.state = (this.state + 0x6d2b79f5) >>> 0;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  }
  next() {
    if (this.spare !== null) { const value = this.spare; this.spare = null; return value; }
    let u = this.uniform();
    while (u === 0) u = this.uniform();
    const angle = 2 * Math.PI * this.uniform();
    const radius = Math.sqrt(-2 * Math.log(u));
    this.spare = radius * Math.sin(angle);
    return radius * Math.cos(angle);
  }
}
export function gaussianNoise(length: number, seed: number) {
  const generator = new GaussianGenerator(seed >>> 0);
  return Float32Array.from({ length }, () => generator.next());
}
function timestepSeed(seed: number, t: number) {
  let value = (0x9e3779b9 ^ seed) >>> 0;
  value = Math.imul(value ^ (t + 0x7f4a7c15), 0x85ebca6b) >>> 0;
  value ^= value >>> 13;
  value = Math.imul(value, 0xc2b2ae35) >>> 0;
  return (value ^ value >>> 16) >>> 0;
}
// Match the reference's Markov chain, keeping a checkpoint every 50 steps.
export class ForwardChain {
  private current: Float32Array;
  private currentT = 0;
  private checkpoints = new Map<number, Float32Array>();
  constructor(clean: Float32Array, private seed: number) {
    this.current = clean.slice();
    this.checkpoints.set(0, clean.slice());
  }
  at(t: number) {
    t = Math.max(0, Math.min(TOTAL_STEPS, Math.round(t)));
    if (t < this.currentT) {
      let checkpoint = Math.floor(t / 50) * 50;
      while (!this.checkpoints.has(checkpoint)) checkpoint -= 50;
      this.current.set(this.checkpoints.get(checkpoint)!);
      this.currentT = checkpoint;
    }
    while (this.currentT < t) {
      const nextT = this.currentT + 1;
      const signal = Math.sqrt(1 - betas[nextT - 1]);
      const noise = Math.sqrt(betas[nextT - 1]);
      const generator = new GaussianGenerator(timestepSeed(this.seed, nextT));
      for (let i = 0; i < this.current.length; i++) this.current[i] = signal * this.current[i] + noise * generator.next();
      this.currentT = nextT;
      if (nextT % 50 === 0 && !this.checkpoints.has(nextT)) this.checkpoints.set(nextT, this.current.slice());
    }
    return this.current;
  }
}
export function pixelStatistics(pixels: Float32Array) {
  let sum = 0;
  for (const value of pixels) sum += value;
  const mean = sum / pixels.length;
  let variance = 0;
  for (const value of pixels) variance += (value - mean) ** 2;
  return { mean, std: Math.sqrt(variance / pixels.length) };
}
export function histogram(pixels: Float32Array) {
  const bins = Array<number>(48).fill(0);
  for (const value of pixels) bins[Math.max(0, Math.min(47, Math.floor((value + 3) * 8)))]++;
  const maximum = Math.max(...bins, 1);
  return bins.map(value => value / maximum);
}
export function denoisingPrediction(clean: Float32Array, noise: Float32Array, perturbation: Float32Array, t: number, error: number) {
  const a = Math.sqrt(alphaBars[t]);
  const b = Math.sqrt(1 - alphaBars[t]);
  const input = new Float32Array(clean.length);
  const predicted = new Float32Array(clean.length);
  const recovered = new Float32Array(clean.length);
  const mean = new Float32Array(clean.length);
  const previous = new Float32Array(clean.length);
  const velocity = new Float32Array(clean.length);
  const normalization = 1 / Math.sqrt(1 + error * error);
  const coefficient = betas[t - 1] / b;
  const inverseAlpha = 1 / Math.sqrt(1 - betas[t - 1]);
  let squaredError = 0;
  for (let i = 0; i < clean.length; i++) {
    input[i] = a * clean[i] + b * noise[i];
    predicted[i] = (noise[i] + error * perturbation[i]) * normalization;
    recovered[i] = (input[i] - b * predicted[i]) / a;
    // DDPM reverse conditional mean, matching the reference's fourth tile.
    mean[i] = inverseAlpha * (input[i] - coefficient * predicted[i]);
    previous[i] = Math.sqrt(alphaBars[t - 1]) * recovered[i] + Math.sqrt(1 - alphaBars[t - 1]) * predicted[i];
    velocity[i] = a * noise[i] - b * clean[i];
    squaredError += (Math.max(-1, Math.min(1, recovered[i])) - clean[i]) ** 2;
  }
  const mse = squaredError / clean.length;
  return { input, predicted, recovered, mean, previous, velocity, gain: b / a, psnr: mse < 1e-10 ? 99 : 10 * Math.log10(4 / mse) };
}
