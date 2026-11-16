import { useId, useRef, type PointerEvent } from 'react';
import { PhotoStage } from './PhotoStage';
import { photoUrl } from '../data';

export type Patch = {x:number;y:number;width:number;height:number};
export function RegionAugmentation({patch,onMove,mode,file}:{patch:Patch;onMove:(x:number,y:number)=>void;mode:'cutout'|'cutmix';file?:string}) {
  const id=useId();
  const drag=useRef<{x:number;y:number;px:number;py:number}|null>(null);
  const point=(e:PointerEvent<SVGSVGElement>)=>{const r=e.currentTarget.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};};
  return <PhotoStage file={file}><svg shuku-edit-id="e-2bbe20ea-941d-4a99-a3cf-e18a318b7aa2" className="daa-photo-overlay daa-box-editor" viewBox="0 0 600 400" style={{overflow:'hidden',borderRadius:'var(--ui-radius-md)'}} aria-label={mode==='cutout'?'可拖动的 Cutout 遮挡块':'可拖动的 CutMix 贴入区域'}
    onPointerDown={e=>{const p=point(e);if(p.x<patch.x||p.x>patch.x+patch.width||p.y<patch.y||p.y>patch.y+patch.height)return;drag.current={x:patch.x,y:patch.y,px:p.x,py:p.y};e.currentTarget.setPointerCapture(e.pointerId);e.preventDefault();}}
    onPointerMove={e=>{if(!drag.current)return;const p=point(e),d=drag.current;const minX=mode==='cutmix'?.05-patch.width:0,minY=mode==='cutmix'?.05-patch.height:0;
      const maxX=mode==='cutmix'?.95:1-patch.width,maxY=mode==='cutmix'?.95:1-patch.height;
      onMove(Math.max(minX,Math.min(maxX,d.x+p.x-d.px)),Math.max(minY,Math.min(maxY,d.y+p.y-d.py)));}}
    onPointerUp={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>
    <defs shuku-edit-id="e-df2d73c1-4fd6-445b-a6b4-a78262767fae"><clipPath shuku-edit-id="e-1a7a3929-1b0f-428a-bee2-f50b8fcb0360" id={id}><rect shuku-edit-id="e-f24ca95e-9d29-48aa-ac19-66102a1a8530" x={patch.x*600} y={patch.y*400} width={patch.width*600} height={patch.height*400}/></clipPath></defs>
    {mode==='cutmix'?<g shuku-edit-id="e-044e51d6-2c71-4c84-af22-fb97de56a5e8" clipPath={`url(#${id})`}><image shuku-edit-id="e-ec51234c-9ca4-4d26-a528-f02397be62a3" data-pear-image href={photoUrl('02-bartlett-pear.jpg')} x={(patch.x-(1-patch.width)/2)*600} y={(patch.y-(1-patch.height)/2)*400} width="600" height="400" preserveAspectRatio="none"/></g>:<rect shuku-edit-id="e-d53edbb8-e749-4957-8a5f-89ab6a50c2d8" x={patch.x*600} y={patch.y*400} width={patch.width*600} height={patch.height*400} fill="black"/>}
    <rect shuku-edit-id="e-76af9f66-522f-4c1d-87c8-6110bb1fccf4" data-patch-region x={patch.x*600} y={patch.y*400} width={patch.width*600} height={patch.height*400} fill="transparent" stroke="var(--ui-accent)" strokeWidth="3" style={{cursor:'move'}}/>
  </svg></PhotoStage>;
}
