import { useEffect, useRef } from 'react';
import { photoUrl } from '../data';
let pearPromise: Promise<HTMLImageElement> | undefined;
function pearImage(){return pearPromise??=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=photoUrl('02-bartlett-pear.png');});}
export function AugmentedFruitView({seed}:{seed:number}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{let active=true;void pearImage().then(img=>{if(!active||!ref.current)return;const c=ref.current.getContext('2d')!;let state=seed>>>0;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};c.resetTransform();c.clearRect(0,0,144,96);c.fillStyle='#d9d8d4';c.fillRect(0,0,144,96);c.save();c.translate(72,48);c.rotate((rand()-.5)*.3);const zoom=1+rand()*.2;c.scale((rand()<.5?-1:1)*zoom,zoom);c.filter=`brightness(${.75+rand()*.5}) contrast(${.9+rand()*.2}) hue-rotate(${(rand()-.5)*35}deg)`;c.drawImage(img,-72+(rand()-.5)*10,-48+(rand()-.5)*8,144,96);c.restore();});return()=>{active=false;};},[seed]);
 return <canvas ref={ref} width={144} height={96} aria-label={`真实计算的随机增广视图 ${seed}`} style={{width:'100%',height:'auto',borderRadius:'var(--ui-radius-sm)'}}/>;
}
