import records from '../RegressionClassificationPage/titanic-passengers.json';
export const samples = records.filter((p): p is typeof p & { Age: number } => p.Age !== null);
export type Inputs = { age: number; male: number; cabin: number; fare: number };
export const encode = (p: Inputs) => [1, p.age / 80, p.male, p.cabin, p.fare / 100];
export const passengerInputs = (i: number): Inputs => { const p = samples[i]; return { age:p.Age, male:Number(p.Sex === 'male'), cabin:p.Pclass, fare:p.Fare }; };
const data = samples.map((_, i) => encode(passengerInputs(i)));
export const sigmoid = (z: number) => z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));
export const score = (w: number[], x: number[]) => w.reduce((s, v, i) => s + v * x[i], 0);
export function evaluate(w: number[]) {
  let mae = 0, loss = 0;
  const gradient = [0,0,0,0,0];
  data.forEach((x, i) => {
    const z = score(w, x), p = sigmoid(z), y = samples[i].Survived;
    mae += Math.abs(p-y);
    // Stable Bernoulli negative log-likelihood; MAE is monitoring only.
    loss += Math.max(z,0) - y*z + Math.log1p(Math.exp(-Math.abs(z)));
    x.forEach((v,j) => { gradient[j] += (p-y)*v / data.length; });
  });
  return {mae:mae/data.length, loss:loss/data.length, gradient};
}
export type Training = { weights:number[]; previous:number[]; iteration:number; history:[number,number][]; complete:boolean };
export const initialTraining = (): Training => ({ weights:[0,0,0,0,0], previous:[0,0,0,0,0], iteration:0, history:[[0,.5]], complete:false });
export function advance(state:Training, steps=1): Training {
  if(state.complete) return state;
  let weights=state.weights, previous=state.previous, iteration=state.iteration;
  const history=[...state.history];
  let complete=false;
  for(let k=0;k<steps;k++) {
    const before=evaluate(weights);
    if(Math.max(...before.gradient.map(Math.abs))<.0001) { complete=true; break; }
    previous=weights;
    weights=weights.map((w,j)=>w-.4*before.gradient[j]);
    iteration++;
    history.push([iteration,evaluate(weights).mae]);
    if(iteration>=6000) { complete=true; break; }
  }
  return {weights,previous,iteration,history,complete};
}
