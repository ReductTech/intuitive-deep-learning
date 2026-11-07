import { moduleJson } from '../../shared/react/moduleJson';
const id = '80396753-7fc8-4f55-9188-bddbdb828169';
type Feature = { channel: number; image: string };
type Features = Record<string, Feature[]>;
export const hierarchyManifest = moduleJson<{
  stages: Record<string, { shapeCHW: number[] }>;
  samples: { id: string; dataset: string; label: string; input: string; features: Features }[];
}>(id, 'feature-hierarchy/mobilenet-v3-small/manifest.json');
export const hierarchyChannels = moduleJson<{ samples: Record<string, Features> }>(id, 'feature-hierarchy/mobilenet-v3-small/lesson-channels.json');
export const flattenResponses = moduleJson<{ samples: { inputSize: number; mapSize: number; input: string; values: number[][] }[] }>(id, 'flatten-interface/responses.json');

let display: { RANGES: number[][]; CHANNELS: number[] } | undefined;
export function flattenDisplay() {
  if (display) return display;
  const data = flattenResponses.read();
  const RANGES = Array.from({length:16},(_,c)=>{const v=data.samples.flatMap(s=>s.values[c]).sort((a,b)=>a-b),baseline=v[Math.floor(v.length/2)];return [baseline,Math.max(...v.map(n=>Math.abs(n-baseline)))];});
  const CHANNELS = Array.from({length:16},(_,c)=>({c,score:data.samples.reduce((sum,s)=>{const v=s.values[c],mean=v.reduce((a,b)=>a+b,0)/v.length;return sum+v.reduce((a,b)=>a+(b-mean)**2,0)/v.length;},0)})).sort((a,b)=>b.score-a.score).slice(0,5).map(item=>item.c);
  return display = { RANGES, CHANNELS };
}
