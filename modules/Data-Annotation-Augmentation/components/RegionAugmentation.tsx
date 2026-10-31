import { useId, useRef, type PointerEvent } from 'react';
import { PhotoStage } from './PhotoStage';
import { photoUrl } from '../data';

export type Patch = {x:number;y:number;width:number;height:number};
export function RegionAugmentation({patch,onMove,mode,file}:{patch:Patch;onMove:(x:number,y:number)=>void;mode:'cutout'|'cutmix';file?:string}) {
  const id=useId();
  const drag=useRef<{x:number;y:number;px:number;py:number}|null>(null);
  const point=(e:PointerEvent<SVGSVGElement>)=>{const r=e.currentTarget.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};};
  return <PhotoStage file={file}><svg className="daa-photo-overlay daa-box-editor" viewBox="0 0 600 400" style={{overflow:'hidden',borderRadius:'var(--ui-radius-md)'}} aria-label={mode==='cutout'?'可拖动的 Cutout 遮挡块':'可拖动的 CutMix 贴入区域'}
    onPointerDown={e=>{const p=point(e);if(p.x<patch.x||p.x>patch.x+patch.width||p.y<patch.y||p.y>patch.y+patch.height)return;drag.current={x:patch.x,y:patch.y,px:p.x,py:p.y};e.currentTarget.setPointerCapture(e.pointerId);e.preventDefault();}}
    onPointerMove={e=>{if(!drag.current)return;const p=point(e),d=drag.current;const minX=mode==='cutmix'?.05-patch.width:0,minY=mode==='cutmix'?.05-patch.height:0;
      const maxX=mode==='cutmix'?.95:1-patch.width,maxY=mode==='cutmix'?.95:1-patch.height;
      onMove(Math.max(minX,Math.min(maxX,d.x+p.x-d.px)),Math.max(minY,Math.min(maxY,d.y+p.y-d.py)));}}
    onPointerUp={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>
    <defs><clipPath id={id}><rect x={patch.x*600} y={patch.y*400} width={patch.width*600} height={patch.height*400}/></clipPath></defs>
    {mode==='cutmix'?<g clipPath={`url(#${id})`}><image data-pear-image href={photoUrl('02-bartlett-pear.png')} x={(patch.x-(1-patch.width)/2)*600} y={(patch.y-(1-patch.height)/2)*400} width="600" height="400" preserveAspectRatio="none"/></g>:<rect x={patch.x*600} y={patch.y*400} width={patch.width*600} height={patch.height*400} fill="black"/>}
    <rect data-patch-region x={patch.x*600} y={patch.y*400} width={patch.width*600} height={patch.height*400} fill="transparent" stroke="var(--ui-accent)" strokeWidth="3" style={{cursor:'move'}}/>
  </svg></PhotoStage>;
}
