import { useSyncExternalStore } from 'react';
export type RecordedObservation = { mass:number; depth:number };
const key='regression-loss:recorded-orders';
const listeners=new Set<()=>void>();
function readSaved():RecordedObservation[] {
  try { const value=JSON.parse(localStorage.getItem(key)??'[]'); return Array.isArray(value)?value.filter(p=>Number.isFinite(p.mass)&&Number.isFinite(p.depth)):[]; } catch { return []; }
}
export let calibration:RecordedObservation[]=readSaved();
export let slope=.016;
export let intercept=0;
export function saveRecordedData(points:RecordedObservation[]) {
  calibration=points.map(p=>({...p}));
  const n=calibration.length;
  if(n>1){const mx=calibration.reduce((s,p)=>s+p.mass,0)/n,my=calibration.reduce((s,p)=>s+p.depth,0)/n;
    const xx=calibration.reduce((s,p)=>s+(p.mass-mx)**2,0);
    if(xx){slope=calibration.reduce((s,p)=>s+(p.mass-mx)*(p.depth-my),0)/xx;intercept=my-slope*mx;}}
  localStorage.setItem(key,JSON.stringify(calibration));listeners.forEach(fn=>fn());
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
