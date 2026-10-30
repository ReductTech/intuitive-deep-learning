import { useSyncExternalStore } from 'react';
import { createStoneWeights, depthForMass } from './pages/CaoChongPage/experiment';
export type RecordedObservation = { mass:number; depth:number };
const key='regression-loss:recorded-orders';
const listeners=new Set<()=>void>();
let exampleData: RecordedObservation[] | undefined;
function getExampleData(): RecordedObservation[] {
  // Generate once so navigation and React renders share the same observations.
  if (!exampleData) {
    let mass = 0;
    exampleData = createStoneWeights().map(weight => {
      mass += weight;
      const depth = Math.round(Math.max(0, depthForMass(mass) + (Math.random() - .5) * 4) * 10) / 10;
      return { mass, depth };
    });
  }
  return exampleData;
}
function readSaved():RecordedObservation[] {
  try { const value=JSON.parse(localStorage.getItem(key)??'[]'); return Array.isArray(value)?value.filter(p=>Number.isFinite(p.mass)&&Number.isFinite(p.depth)):[]; } catch { return []; }
}
const savedData = readSaved();
export let calibration:RecordedObservation[]=savedData.length ? savedData : getExampleData();
export let slope=.016;
export let intercept=0;
export function saveRecordedData(points:RecordedObservation[]) {
  calibration=points.length ? points.map(p=>({...p})) : getExampleData();
  const n=calibration.length;
  if(n>1){const mx=calibration.reduce((s,p)=>s+p.mass,0)/n,my=calibration.reduce((s,p)=>s+p.depth,0)/n;
    const xx=calibration.reduce((s,p)=>s+(p.mass-mx)**2,0);
    if(xx){slope=calibration.reduce((s,p)=>s+(p.mass-mx)*(p.depth-my),0)/xx;intercept=my-slope*mx;}}
  // Keep simulated defaults out of the learner's saved experiment records.
  localStorage.setItem(key,JSON.stringify(points));listeners.forEach(fn=>fn());
}
export function useRecordedData(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},()=>calibration,()=>calibration);}
export const predictDepth=(mass:number)=>slope*mass+intercept;
export const estimateMass=(depth:number)=>(depth-intercept)/slope;
export const examplePrediction=(mass:number)=>.010*mass+2;

export type ManualFit = { w: number; dataKey: string };
const manualKey = 'regression-loss:manual-fit';
const manualListeners = new Set<() => void>();
const dataKeyFor = (points: RecordedObservation[]) => JSON.stringify(points.map(p => [p.mass, p.depth]));
let manualFit: ManualFit | null = (() => {
  try { const saved = JSON.parse(localStorage.getItem(manualKey) ?? 'null'); return saved && Number.isFinite(saved.w) && typeof saved.dataKey === 'string' ? saved : null; } catch { return null; }
})();
export function getManualFit(points: RecordedObservation[] = calibration) {
  return manualFit?.dataKey === dataKeyFor(points) ? manualFit : null;
}
export function saveManualFit(w: number, points: RecordedObservation[] = calibration) {
  if (!Number.isFinite(w) || !points.length) return;
  manualFit = { w, dataKey: dataKeyFor(points) };
  localStorage.setItem(manualKey, JSON.stringify(manualFit));
  manualListeners.forEach(listener => listener());
}
export function useManualFit() {
  const saved = useSyncExternalStore(listener => { manualListeners.add(listener); return () => { manualListeners.delete(listener); }; }, () => manualFit, () => manualFit);
  const points = useRecordedData();
  return saved?.dataKey === dataKeyFor(points) ? saved : null;
}
