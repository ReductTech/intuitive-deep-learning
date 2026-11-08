import type recordData from '../../assets/precomputed/gan.json';
import {loadPrecomputed} from '../../precomputed';
const record=await loadPrecomputed<typeof recordData>('gan');
type CachedFrame={dSteps:number;gSteps:number;generator:number[][];discriminator:number[][]};
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

type Layer = { input: number; output: number; weights: Float64Array;  };
type Pass = { values: number[][]; logits: number[] };

// Dense MLPs: G uses tanh; D uses leaky ReLU hidden layers and a sigmoid output.
export class Network {
  readonly layers: Layer[];


  constructor(sizes: number[], random: () => number, readonly discriminator: boolean) {
    this.layers = sizes.slice(1).map((output, index) => {
      const input = sizes[index];
      const count = (input + 1) * output;
      const weights = new Float64Array(count);
      const scale = Math.sqrt(6 / (input + output));
      for (let j = 0; j < output; j++) {
        for (let i = 0; i < input; i++) weights[j * (input + 1) + i] = (random() * 2 - 1) * scale;
      }
      return { input, output, weights };
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
}

const softplus = (value: number) => Math.max(0, value) + Math.log1p(Math.exp(-Math.abs(value)));

export class GanModel {
  readonly generator: Network;
  readonly discriminator: Network;
  readonly real: Point[];
  readonly probes: Point[];
  private mode: 'd'|'g'|'alternating'|null=null;
  private cursor=0;
  private restore(frame: CachedFrame){this.generator.layers.forEach((layer,i)=>layer.weights.set(frame.generator[i]));this.discriminator.layers.forEach((layer,i)=>layer.weights.set(frame.discriminator[i]));this.dSteps=frame.dSteps;this.gSteps=frame.gSteps;}
  play(mode:'d'|'g'|'alternating',steps=1){if(this.mode!==mode){this.mode=mode;this.cursor=0;}const frames=record.distributions[this.distribution].modes[mode];this.cursor=Math.min(frames.length-1,this.cursor+steps);this.restore(frames[this.cursor]);return this.cursor===frames.length-1;}
  dSteps = 0;
  gSteps = 0;

  constructor(readonly distribution: Distribution = 'blobs', seed = 42) {this.generator=new Network([2,24,24,2],()=>.5,false);this.discriminator=new Network([2,24,24,1],()=>.5,true);const data=record.distributions[distribution];this.real=data.real as Point[];this.probes=data.probes as Point[];this.restore(data.frame);} 

  generated(): Point[] { return this.probes.map((z) => this.generator.forward(z).values.at(-1)! as Point); }
  score(point: Point) { return this.discriminator.forward(point).values.at(-1)![0]; }

  metrics() {
    const fake = this.generated();
    const realScores = this.real.map((point) => this.discriminator.forward(point));
    const fakeScores = fake.map((point) => this.discriminator.forward(point));
    const dLoss = (realScores.reduce((sum, pass) => sum + softplus(-pass.logits[0]), 0) + fakeScores.reduce((sum, pass) => sum + softplus(pass.logits[0]), 0)) / fake.length;
    const gLoss = fakeScores.reduce((sum, pass) => sum + softplus(-pass.logits[0]), 0) / fake.length;
    return { dLoss, gLoss, realScore: realScores.reduce((sum, pass) => sum + pass.values.at(-1)![0], 0) / this.real.length, fakeScore: fakeScores.reduce((sum, pass) => sum + pass.values.at(-1)![0], 0) / fake.length };
  }
}
