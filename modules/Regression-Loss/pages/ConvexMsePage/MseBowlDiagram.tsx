import { useCallback } from 'react';
import { SurfaceDiagram } from '../LossLandscape/SurfaceDiagram';
/** Convexity illustration in normalized parameter coordinates; no numeric MSE scale. */
export function MseBowlDiagram({unique}:{unique:boolean}) {
  const height=useCallback((x:number,y:number)=>x*x+(unique?y*y:0),[unique]);
  return <SurfaceDiagram height={height} landmarks={[{x:0,y:0,value:0,kind:'global'}]} />;
}
