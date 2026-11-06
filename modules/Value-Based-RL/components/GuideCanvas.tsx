import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
export function GuideCanvas({children}:{children:ReactNode}) {
 const frameRef=useRef<HTMLDivElement>(null);const [scale,setScale]=useState(1);
 useLayoutEffect(()=>{const frame=frameRef.current;if(!frame)return;const update=()=>setScale(Math.min(1,frame.clientWidth/1600));update();const observer=new ResizeObserver(update);observer.observe(frame);return()=>observer.disconnect()},[]);
 return <div className="lesson-canvas-frame" ref={frameRef} style={{height:900*scale}}><div className="course-page-surface course-shell vbrl-guide-surface" style={{transform:`scale(${scale})`}}>{children}</div></div>;
}
