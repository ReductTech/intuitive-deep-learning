import { forest, segmentDistance } from './forest';
export { forest, segmentDistance } from './forest';
export type Point = { x: number; z: number };
export type Phase = 'briefing' | 'playing' | 'rescuing' | 'won' | 'lost';
export type PickupId = 'scanner' | 'compass' | 'medicine' | 'core-a' | 'core-b' | 'core-c';
export const WORLD_WIDTH = 180;
export const WORLD_DEPTH = 140;
export const EXIT: Point = { x: 30, z: -20.4 };
export const START: Point = { x: -18, z: 13 };
export const MAX_JUMP = 13;
export const PICKUPS: { id: PickupId; point: Point; label: string; color: string }[] = [
  { id: 'scanner', point: { x: -11, z: 10.5 }, label: '应急箱', color: '#ffbd65' },
  { id: 'compass', point: { x: 21, z: -7.5 }, label: '探针箱', color: '#8de4e1' },
  { id: 'medicine', point: { x: -10.5, z: -3 }, label: '医疗箱', color: '#b8ef9d' },
  { id: 'core-a', point: { x: -6, z: 3 }, label: '封存核心', color: '#dba3ff' },
  { id: 'core-b', point: { x: -17, z: -11 }, label: '稀有核心', color: '#ffc764' },
  { id: 'core-c', point: { x: 27, z: 10 }, label: '封存核心', color: '#dba3ff' },
];
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);
const riverSamples = [[-36, 1], [-27, 3], [-20.5, 5], [-12, 11], [-6.8, 11], [0, 8], [9, 11], [19.9, 13.7], [28, 10], [36, 25]];
export const BRIDGES = [{ x: 5, z: -20.5 }, { x: 11, z: -6.8 }, { x: 13.7, z: 19.9 }];
export function riverX(z: number) {
  for (let i = 1; i < riverSamples.length; i++) {
    const [a,x]=riverSamples[i-1],[b,y]=riverSamples[i];
    if(z<=b){const t=Math.max(0,(z-a)/(b-a)),[pz,px]=riverSamples[Math.max(0,i-2)],[nz,nx]=riverSamples[Math.min(riverSamples.length-1,i+1)];const m0=(y-px)/(b-pz),m1=(nx-x)/(nz-a),t2=t*t,t3=t2*t;return (2*t3-3*t2+1)*x+(t3-2*t2+t)*m0*(b-a)+(-2*t3+3*t2)*y+(t3-t2)*m1*(b-a);}
  }
  return 25;
}
export function landHeight(x: number, z: number) {
  const hills = .34 + .25 * Math.sin(x * .12 + z * .06) + .18 * Math.cos(z * .21 - x * .08)
    + 1.5 * Math.exp(-((x + 4) ** 2 / 140 + (z + 24) ** 2 / 65))
    + 1.9 * Math.exp(-((x - 35) ** 2 / 100 + (z - 24) ** 2 / 110))
    + 1.4 * Math.exp(-((x + 10) ** 2 / 80 + (z - 25) ** 2 / 85));
  const bank = Math.abs(x - riverX(z));
  return bank < 3.15 ? -.65 : hills * Math.min(1, (bank - 3.15) / 1.4);
}
export function terrainHeight(x: number, z: number) {
  return BRIDGES.some(b => Math.abs(z - b.z) < 1.2 && Math.abs(x - b.x) < 6.8) ? .55 : landHeight(x, z);
}

/** A smooth, fixed simulated field. Rendering, meter, scanner and probe use this same function. */
export function radiation(p: Point): number {
  const q = .42 + .00085 * (p.x - EXIT.x) ** 2 + .0018 * (p.z - EXIT.z) ** 2;
  const plant = 3.2 * Math.exp(-((p.x + 30) ** 2 / 170 + (p.z + 1) ** 2 / 120));
  const ruin = 2.4 * Math.exp(-((p.x - 35) ** 2 / 80 + (p.z - 7) ** 2 / 120));
  return q + plant + ruin;
}
export function descentDirection(p: Point): Point {
  const d = .01;
  const x = -(radiation({ x: p.x + d, z: p.z }) - radiation({ x: p.x - d, z: p.z })) / (2 * d);
  const z = -(radiation({ x: p.x, z: p.z + d }) - radiation({ x: p.x, z: p.z - d })) / (2 * d);
  const length = Math.hypot(x, z);
  return length < 1e-6 ? { x: 0, z: 0 } : { x: x / length, z: z / length };
}
export function landingProblem(p: Point): string | null {
  if (p.x < -86 || p.x > 86 || p.z < -66 || p.z > 66) return '目标超出行动区域';
  if (Math.abs(p.x - riverX(p.z)) < 3.1 && !BRIDGES.some(b => Math.abs(p.z - b.z) < 1.2 && Math.abs(p.x - b.x) < 7)) return '水面无法落脚，寻找桥梁或河岸';
  if (p.x > -45 && p.x < -23 && p.z > -5 && p.z < 7) return '厂区建筑阻挡了落点';
  if (p.x > 31 && p.x < 45 && p.z > 2 && p.z < 13) return '废墟阻挡了落点';
  return null;
}
export function aimFromPull(origin: Point, pointer: Point): Point {
  const dx = origin.x - pointer.x, dz = origin.z - pointer.z;
  const length = Math.hypot(dx, dz);
  const ratio = length > MAX_JUMP ? MAX_JUMP / length : 1;
  return { x: origin.x + dx * ratio, z: origin.z + dz * ratio };
}
export interface Move { from: Point; to: Point; before: number; after: number; damage: number; broken:string[]; hits:string[]; collision:boolean }
export interface Sentry { id:string; position:Point; home:Point; health:number; alert:boolean; cooldown:number; windup:number }
export interface Bolt { id:number; position:Point; velocity:Point; life:number }
export interface GameState { phase: Phase; position: Point; health: number; moves: Move[]; collected: PickupId[]; scan: boolean; message: string; run: number; discoveredExit: boolean; energy:number; elapsed:number; value:number; cores:number; kills:number; brokenTrees:string[]; sentries:Sentry[]; bolts:Bolt[]; search:{id:PickupId;progress:number}|null; scanUntil:number; pulseAt:number; damageAt:number; blinkUntil:number; extraction:number }
export function newGame(run = 0): GameState {
  const spawns=[[-4,4],[-15,-9],[1,-5],[20,-7],[28,11],[29,-18]];
  return { phase:'briefing',position:{...START},health:100,moves:[],collected:[],scan:false,message:'搜寻封存核心。用闪现撞击守卫，带着战利品撤离。',run,discoveredExit:false,energy:100,elapsed:0,value:0,cores:0,kills:0,brokenTrees:[],sentries:spawns.map(([x,z],i)=>({id:`sentry-${i}`,position:{x,z},home:{x,z},health:90,alert:false,cooldown:1.7+i*.1,windup:0})),bolts:[],search:null,scanUntil:0,pulseAt:-10,damageAt:-10,blinkUntil:0,extraction:0 };
}
export const canRescue = (state: GameState) => state.phase === 'playing' && state.cores>0 && distance(state.position, EXIT) < 2.8 && radiation(state.position) < 1.4;
export const nearbyLoot=(s:GameState)=>PICKUPS.find(p=>!s.collected.includes(p.id)&&distance(p.point,s.position)<2.4);
export function startSearch(s:GameState):GameState{const p=nearbyLoot(s);return s.phase==='playing'&&p&&!s.search?{...s,search:{id:p.id,progress:0},message:'正在解锁容器…闪现或受击会中断搜寻。'}:s;}
export function toggleScan(s:GameState):GameState{if(s.phase!=='playing'||!s.collected.includes('scanner'))return s;if(s.scan)return {...s,scan:false};return s.energy>=12?{...s,energy:s.energy-12,scan:true,scanUntil:s.elapsed+4,message:'扫描脉冲持续 4 秒。'}:{...s,message:'以太不足，扫描需要 12 点。'};}
function defeated(s:GameState,enemies:Sentry[]){const fresh=enemies.filter(e=>e.health<=0&&s.sentries.find(a=>a.id===e.id)!.health>0).length;return {sentries:enemies,kills:s.kills+fresh,value:s.value+fresh*40,energy:Math.min(100,s.energy+fresh*14)};}
export function shockwave(s:GameState):GameState{
 if((s.phase!=='playing'&&s.phase!=='rescuing')||s.elapsed-s.pulseAt<3.2)return s;if(s.energy<28)return {...s,message:'以太不足，震荡需要 28 点。'};
 const enemies=s.sentries.map(e=>{const d=distance(e.position,s.position);if(e.health<=0||d>4.6)return e;const n=Math.max(.1,d);return {...e,health:e.health-95,alert:true,position:{x:e.position.x+(e.position.x-s.position.x)/n*2,z:e.position.z+(e.position.z-s.position.z)/n*2}};});
 const broken=forest(riverX).filter(t=>!s.brokenTrees.includes(t.id)&&distance(t,s.position)<3.8).map(t=>t.id);return {...s,...defeated(s,enemies),brokenTrees:[...s.brokenTrees,...broken],energy:Math.min(100,defeated(s,enemies).energy-28),pulseAt:s.elapsed,bolts:s.bolts.filter(b=>distance(b.position,s.position)>5),message:'以太震荡！附近弹幕被清除。'};
}
export function movePlayer(state: GameState, to: Point): GameState {
  if((state.phase!=='playing'&&state.phase!=='rescuing')||state.elapsed<state.blinkUntil)return state;
  const length=distance(state.position,to);if(length<.35)return state;
  const power=Math.min(1,length/MAX_JUMP),cost=16+power*15;if(state.energy<cost)return {...state,message:'以太不足。打碎守卫可回收能量。'};
  const angle=Math.atan2(to.z-state.position.z,to.x-state.position.x)+(power>.82?Math.sin(state.elapsed*4.7)*.11*(power-.82)/.18:0),range=1.3+10.8*power**.78+(power>.82?Math.sin(state.elapsed*4)*.65:0);
  let end={x:state.position.x+Math.cos(angle)*range,z:state.position.z+Math.sin(angle)*range},collision=false;
  // Water can be crossed in phase-space; solid architecture arrests a blink at its near face.
  let safe=state.position;
  for(let i=1;i<=40;i++){const p={x:state.position.x+(end.x-state.position.x)*i/40,z:state.position.z+(end.z-state.position.z)*i/40};const problem=landingProblem(p);if(problem&&!problem.startsWith('水面')){end=safe;collision=true;break;}if(!problem)safe=p;}
  if(landingProblem(end)){end=safe;collision=true;}
  const broken=forest(riverX).filter(t=>!state.brokenTrees.includes(t.id)&&(segmentDistance(t,state.position,end)<.72||distance(t,end)<1.5+power)).map(t=>t.id);
  const enemies=state.sentries.map(e=>e.health>0&&(segmentDistance(e.position,state.position,end)<1.5||distance(e.position,end)<2.2)?{...e,health:e.health-105,alert:true}:e);
  const hits=enemies.filter(e=>e.health<state.sentries.find(a=>a.id===e.id)!.health).map(e=>e.id),after=radiation(end),damage=after*.3+(collision?7:0),health=Math.max(0,state.health-damage);
  const rewards=defeated(state,enemies);
  const result:GameState={...state,...rewards,position:end,health,energy:Math.min(100,rewards.energy-cost+Math.min(8,broken.length*2)),moves:[...state.moves,{from:state.position,to:end,before:radiation(state.position),after,damage,broken,hits,collision}],brokenTrees:[...state.brokenTrees,...broken],search:null,blinkUntil:state.elapsed+.48,damageAt:collision?state.elapsed:state.damageAt,phase:health<=0?'lost':state.phase,discoveredExit:state.discoveredExit||distance(end,EXIT)<17,message:hits.length?`击碎 ${hits.length} 名守卫！回收以太与战利品。`:broken.length?`撞碎 ${broken.length} 棵树！林间通道已打开。`:collision?'裂隙撞上障碍，防护受损。':'裂隙闭合。寻找封存核心，也可以继续搜寻更值钱的战利品。'};
  if(canRescue(result))result.message='撤离信号已接通。按 R 发射信标，守住停机坪。';return result;
}
export function advanceGame(s:GameState,dt:number):GameState{
 if(s.phase!=='playing'&&s.phase!=='rescuing')return s;dt=Math.min(.2,dt);const elapsed=s.elapsed+dt;let health=s.health-radiation(s.position)*.16*dt,damage=0,value=s.value,cores=s.cores,collected=s.collected,search=s.search,message=s.message;
 let serial=Math.floor(elapsed*1000);const shots:Bolt[]=[];
 const sentries=s.sentries.map(e=>{if(e.health<=0)return e;const d=distance(e.position,s.position),alert=e.alert||d<10||(s.phase==='rescuing'&&d<25);let position={...e.position},cooldown=e.cooldown-dt,windup=e.windup;
  if(alert){if(d>2.4){const step=Math.min(d-2.4,dt*(s.phase==='rescuing'?2.1:1.7));position={x:position.x+(s.position.x-position.x)/d*step,z:position.z+(s.position.z-position.z)/d*step};}
   if(cooldown<=0&&d<13&&windup===0)windup=.7;
   else if(windup>0){windup=Math.max(0,windup-dt);if(windup===0){const n=Math.max(.1,d);shots.push({id:serial++,position:{...position},velocity:{x:(s.position.x-position.x)/n*6,z:(s.position.z-position.z)/n*6},life:3});cooldown=2.3;}}
  }return {...e,position,alert,cooldown,windup};});
 const bolts=[...s.bolts,...shots].map(b=>({...b,position:{x:b.position.x+b.velocity.x*dt,z:b.position.z+b.velocity.z*dt},life:b.life-dt})).filter(b=>{if(distance(b.position,s.position)<.8&&elapsed>s.blinkUntil){damage+=9;return false;}return b.life>0;});
 if(damage){health-=damage;search=null;message='遭到守卫攻击！闪现穿过它，或用震荡清除弹幕。';}
 if(search){const pickup=PICKUPS.find(p=>p.id===search!.id)!;if(distance(pickup.point,s.position)>2.4)search=null;else {search={...search,progress:search.progress+dt/1.35};if(search.progress>=1){const id=search.id;collected=[...collected,id];if(id==='medicine'){health=Math.min(100,health+34);message='医疗箱已搜完，恢复 34 点防护。';}else if(id.startsWith('core')){cores++;value+=id==='core-b'?500:250;message='核心已装入背包。现在撤离可以保住收益，也可以继续深入。';}else message=id==='scanner'?'扫描器到手。E：消耗以太扫描 4 秒。':'方向探针到手。留意辐射下降的方向。';search=null;}}}
 let phase:Phase=s.phase,extraction=s.extraction;
 if(s.phase==='rescuing'){if(distance(s.position,EXIT)>3.5){phase='playing';extraction=0;message='离开停机坪，撤离已中断。';}else extraction+=dt;}
 if(health<=0||elapsed>=180){health=Math.max(0,health);phase='lost';message=elapsed>=180?'辐射风暴吞没了禁区，背包战利品遗失。':'防护耗尽，背包战利品遗失。';}
 if(extraction>=8&&phase==='rescuing')phase='won';
 return {...s,elapsed,health,energy:Math.min(100,s.energy+dt*9),sentries,bolts,collected,cores,value,search,message,phase,extraction,scan:s.scan&&elapsed<s.scanUntil,damageAt:damage?elapsed:s.damageAt};
}
export function requestRescue(s:GameState):GameState{return canRescue(s)?{...s,phase:'rescuing',extraction:0,search:null,sentries:[...s.sentries.filter(e=>!e.id.startsWith('wave-')),...[[-8,5],[9,3],[3,-9]].map(([x,z],i)=>({id:`wave-${i}`,position:{x:EXIT.x+x,z:EXIT.z+z},home:{x:EXIT.x+x,z:EXIT.z+z},health:90,alert:true,cooldown:.9,windup:0}))],message:'信标已发射。守住停机坪 8 秒！右键震荡清除弹幕。'}:s;}
export const RECORD_KEY = 'gradient-descent:evacuation-record:v1';
export function saveRun(state: GameState) {
  try { localStorage.setItem(RECORD_KEY, JSON.stringify({ position: state.position, moves: state.moves, collected: state.collected, health: state.health, value:state.value,cores:state.cores,kills:state.kills,completed: state.phase === 'won' })); } catch { /* Gameplay works without browser storage. */ }
}

