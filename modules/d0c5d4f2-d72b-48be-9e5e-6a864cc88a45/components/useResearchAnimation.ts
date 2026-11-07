import { useEffect, useRef, useState } from 'react';

/** Visible-time animation; navigation is optional in isolated capture mode. */
export function useResearchAnimation(duration:number,onComplete?:()=>void){
 const [elapsed,setElapsed]=useState(0),root=useRef<HTMLElement>(null),done=useRef(onComplete);
 done.current=onComplete;
 useEffect(()=>{
  let visible=true,time=0,last=performance.now(),completed=false;
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting});
  if(root.current)observer.observe(root.current);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced)setElapsed(duration);
  const timer=window.setInterval(()=>{
   const now=performance.now();
   if(visible&&!document.hidden)time=Math.min(duration,time+Math.max(0,now-last));
   last=now;
   if(!reduced)setElapsed(time);
   if(time>=duration&&!completed){completed=true;clearInterval(timer);done.current?.()}
  },80);
  return()=>{clearInterval(timer);observer.disconnect()};
 },[duration]);
 return {elapsed,root};
}
