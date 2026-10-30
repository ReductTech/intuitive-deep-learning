import { useEffect, useRef } from 'react';
import { photoUrl } from '../data';

/** Pixel-wise convex interpolation for the teaching example, not a model output. */
export function FruitMixCanvas({weight}:{weight:number}) {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    let active=true;
    const load=(file:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=photoUrl(file);});
    void Promise.all([load('01-fuji-apple.png'),load('02-bartlett-pear.png')]).then(([a,b])=>{
      if(!active||!ref.current)return;
      const context=ref.current.getContext('2d',{willReadFrequently:true});if(!context)return;
      const scratch=document.createElement('canvas');scratch.width=600;scratch.height=400;
      const source=scratch.getContext('2d',{willReadFrequently:true})!;
      source.drawImage(a,0,0,600,400);const pa=source.getImageData(0,0,600,400);
      source.clearRect(0,0,600,400);source.drawImage(b,0,0,600,400);const pb=source.getImageData(0,0,600,400);
      for(let i=0;i<pa.data.length;i+=4){for(let c=0;c<3;c++)pa.data[i+c]=Math.round(weight*pa.data[i+c]+(1-weight)*pb.data[i+c]);pa.data[i+3]=255;}
      context.putImageData(pa,0,0);
    });
    return ()=>{active=false;};
  },[weight]);
  return <canvas ref={ref} width={600} height={400} aria-label="按权重逐像素混合的苹果和梨" style={{width:'min(100%,600px)',height:'auto',borderRadius:'var(--ui-radius-md)'}}/>;
}
