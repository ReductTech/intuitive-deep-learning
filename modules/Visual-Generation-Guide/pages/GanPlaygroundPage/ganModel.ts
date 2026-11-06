export type Point = [number, number];
export type Distribution = 'blobs' | 'ring';

function randomSource(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(random: () => number) {
  return Math.sqrt(-2 * Math.log(Math.max(1e-9, random()))) * Math.cos(2 * Math.PI * random());
}

type Layer = { input: number; output: number; weights: Float64Array; gradient: Float64Array; first: Float64Array; second: Float64Array };
type Pass = { values: number[][]; logits: number[] };

// Dense MLPs: G uses tanh; D uses leaky ReLU hidden layers and a sigmoid output.
export class Network {
  readonly layers: Layer[];
  private adamStep = 0;

  constructor(sizes: number[], random: () => number, readonly discriminator: boolean) {
    this.layers = sizes.slice(1).map((output, index) => {
      const input = sizes[index];
      const count = (input + 1) * output;
      const weights = new Float64Array(count);
      const scale = Math.sqrt(6 / (input + output));
      for (let j = 0; j < output; j++) {
        for (let i = 0; i < input; i++) weights[j * (input + 1) + i] = (random() * 2 - 1) * scale;
      }
      return { input, output, weights, gradient: new Float64Array(count), first: new Float64Array(count), second: new Float64Array(count) };
    });
  }

  forward(input: number[]): Pass {
    const values = [input];
    let logits: number[] = [];
    for (const [index, layer] of this.layers.entries()) {
      const previous = values[index];
      logits = Array.from({ length: layer.output }, (_, j) => {
        const offset = j * (layer.input + 1);
        let value = layer.weights[offset + layer.input];
        for (let i = 0; i < layer.input; i++) value += layer.weights[offset + i] * previous[i];
        return value;
      });
      const sigmoid = this.discriminator && index === this.layers.length - 1;
      values.push(logits.map((value) => sigmoid ? 1 / (1 + Math.exp(-value)) : this.discriminator ? Math.max(value, .2 * value) : Math.tanh(value)));
    }
    return { values, logits };
  }

  // For D, finalDelta is dL/d(logit), using the stable BCE derivative sigmoid-target.
  // accumulate=false still computes input gradients, without changing D's gradients/weights.
  backward(pass: Pass, finalDelta: number[], accumulate = true): number[] {
    let delta = finalDelta;
    for (let k = this.layers.length - 1; k >= 0; k--) {
      const layer = this.layers[k];
      const previous = pass.values[k];
      const output = pass.values[k + 1];
      const inputGradient = Array(layer.input).fill(0) as number[];
      for (let j = 0; j < layer.output; j++) {
        const derivative = this.discriminator ? (output[j] >= 0 ? 1 : .2) : 1 - output[j] ** 2;
        const local = this.discriminator && k === this.layers.length - 1 ? delta[j] : delta[j] * derivative;
        const offset = j * (layer.input + 1);
        for (let i = 0; i < layer.input; i++) {
          inputGradient[i] += layer.weights[offset + i] * local;
          if (accumulate) layer.gradient[offset + i] += local * previous[i];
        }
        if (accumulate) layer.gradient[offset + layer.input] += local;
      }
      delta = inputGradient;
    }
    return delta;
  }

  zeroGrad() { for (const layer of this.layers) layer.gradient.fill(0); }

  update(rate: number) {
    this.adamStep++;
    const firstCorrection = 1 - .5 ** this.adamStep;
    const secondCorrection = 1 - .999 ** this.adamStep;
    for (const layer of this.layers) {
      for (let i = 0; i < layer.weights.length; i++) {
        const gradient = layer.gradient[i];
        layer.first[i] = .5 * layer.first[i] + .5 * gradient;
        layer.second[i] = .999 * layer.second[i] + .001 * gradient * gradient;
        layer.weights[i] -= rate * (layer.first[i] / firstCorrection) / (Math.sqrt(layer.second[i] / secondCorrection) + 1e-8);
      }
    }
  }
}

const softplus = (value: number) => Math.max(0, value) + Math.log1p(Math.exp(-Math.abs(value)));

export class GanModel {
  readonly generator: Network;
  readonly discriminator: Network;
  readonly real: Point[];
  readonly probes: Point[];
  private random: () => number;
  dSteps = 0;
  gSteps = 0;

  constructor(readonly distribution: Distribution = 'blobs', seed = 42) {
    this.random = randomSource(seed);
    this.generator = new Network([2, 24, 24, 2], this.random, false);
    this.discriminator = new Network([2, 24, 24, 1], this.random, true);
    this.real = Array.from({ length: 100 }, () => this.sampleReal());
    this.probes = Array.from({ length: 100 }, () => this.sampleNoise());
  }

  private sampleNoise(): Point { return [normal(this.random), normal(this.random)]; }

  private sampleReal(): Point {
    if (this.distribution === 'ring') {
      const angle = this.random() * Math.PI * 2;
      const radius = .62 + normal(this.random) * .045;
      return [Math.cos(angle) * radius, Math.sin(angle) * radius];
    }
    const side = this.random() < .5 ? -1 : 1;
    return [side * .48 + normal(this.random) * .10, side * .15 + normal(this.random) * .10];
  }

  generated(): Point[] { return this.probes.map((z) => this.generator.forward(z).values.at(-1)! as Point); }
  score(point: Point) { return this.discriminator.forward(point).values.at(-1)![0]; }

  trainD(steps = 1, batch = 48) {
    for (let step = 0; step < steps; step++) {
      this.discriminator.zeroGrad();
      for (let i = 0; i < batch; i++) {
        const real = this.discriminator.forward(this.sampleReal());
        const generated = this.generator.forward(this.sampleNoise()).values.at(-1)!;
        const fake = this.discriminator.forward(generated);
        this.discriminator.backward(real, [(real.values.at(-1)![0] - 1) / batch]);
        this.discriminator.backward(fake, [fake.values.at(-1)![0] / batch]);
      }
      this.discriminator.update(.001);
      this.dSteps++;
    }
  }

  trainG(steps = 1, batch = 48) {
    for (let step = 0; step < steps; step++) {
      this.generator.zeroGrad();
      for (let i = 0; i < batch; i++) {
        const generated = this.generator.forward(this.sampleNoise());
        const classified = this.discriminator.forward(generated.values.at(-1)!);
        // Non-saturating -log D(G(z)): propagate through frozen D, update G only.
        const gradient = this.discriminator.backward(classified, [(classified.values.at(-1)![0] - 1) / batch], false);
        this.generator.backward(generated, gradient);
      }
      this.generator.update(.001);
      this.gSteps++;
    }
  }

  metrics() {
    const fake = this.generated();
    const realScores = this.real.map((point) => this.discriminator.forward(point));
    const fakeScores = fake.map((point) => this.discriminator.forward(point));
    const dLoss = (realScores.reduce((sum, pass) => sum + softplus(-pass.logits[0]), 0) + fakeScores.reduce((sum, pass) => sum + softplus(pass.logits[0]), 0)) / fake.length;
    const gLoss = fakeScores.reduce((sum, pass) => sum + softplus(-pass.logits[0]), 0) / fake.length;
    return { dLoss, gLoss, realScore: realScores.reduce((sum, pass) => sum + pass.values.at(-1)![0], 0) / this.real.length, fakeScore: fakeScores.reduce((sum, pass) => sum + pass.values.at(-1)![0], 0) / fake.length };
  }
}
