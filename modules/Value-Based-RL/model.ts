export type Position = { row: number; col: number };
export const GRID = 7;
export const START: Position = { row: 5, col: 1 };
export const GOAL: Position = { row: 5, col: 5 };
export const BLOCKED = ['2:2', '3:2', '3:4', '4:4', '5:3'];
export const ACTIONS = ['向上', '向右', '向下', '向左'] as const;
export const DELTAS = [{ row: -1, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 0, col: -1 }];
export const keyOf = (p: Position) => `${p.row}:${p.col}`;
export const LOWER_ROUTE: Position[] = [START, { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 }, { row: 6, col: 5 }, GOAL];
export const UPPER_ROUTE: Position[] = [START, { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 }, { row: 3, col: 3 }, { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 2, col: 5 }, { row: 3, col: 5 }, { row: 4, col: 5 }, GOAL];
export const returnOf = (rewards: readonly number[], gamma: number) => rewards.reduce((sum, r, i) => sum + gamma ** i * r, 0);
export function transition(p: Position, action: number) {
  const candidate = { row: p.row + DELTAS[action].row, col: p.col + DELTAS[action].col };
  const hit = candidate.row < 0 || candidate.row >= GRID || candidate.col < 0 || candidate.col >= GRID || BLOCKED.includes(keyOf(candidate));
  const next = hit ? p : candidate;
  const done = keyOf(next) === keyOf(GOAL);
  return { next, reward: done ? 10 : hit ? -3 : -1, done, hit };
}
export const tdTarget = (reward: number, gamma: number, nextMax: number, done = false) => reward + (done ? 0 : gamma * nextMax);
export const updateQ = (old: number, target: number, alpha: number) => old + alpha * (target - old);
export const huber = (error: number) => Math.abs(error) <= 1 ? 0.5 * error ** 2 : Math.abs(error) - 0.5;
export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
}
export type QTable = Record<string, number[]>;
export const emptyQ = (): QTable => Object.fromEntries(Array.from({length:49},(_,i)=>[`${Math.floor(i/7)}:${i%7}`,[0,0,0,0]]));
export function chooseAction(q: readonly number[], epsilon: number, random: () => number) {
  if(random()<epsilon)return Math.floor(random()*4);
  const max=Math.max(...q);const tied=q.flatMap((v,i)=>Math.abs(v-max)<1e-8?[i]:[]);
  return tied[Math.floor(random()*tied.length)];
}
export function trainEpisodes(table: QTable, episodes: number, epsilon: number, seed = 7) {
  const q=Object.fromEntries(Object.entries(table).map(([k,v])=>[k,[...v]]));const random=seededRandom(seed);let lastRoute: Position[]=[];let successes=0;let total=0;let collisions=0;const visited=new Set<string>();
  for(let e=0;e<episodes;e++){let p=START;let route=[p];for(let t=0;t<80;t++){visited.add(keyOf(p));const a=chooseAction(q[keyOf(p)],epsilon,random);const out=transition(p,a);const target=tdTarget(out.reward,.9,Math.max(...q[keyOf(out.next)]),out.done);q[keyOf(p)][a]=updateQ(q[keyOf(p)][a],target,.5);total+=out.reward;collisions+=Number(out.hit);p=out.next;route.push(p);if(out.done){successes++;break;}}lastRoute=route;}
  return {q,lastRoute,successes,meanReturn:total/episodes,collisions,visited};
}
