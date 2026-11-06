import { useEffect, useRef } from 'react';
import { ShukuCoCreationLoop } from '../../../Creator-Guide/pages/ShukuCoCreationLoop/ShukuCoCreationLoop';
import '../../components/InteractionShowcase.css';

export function ShukuInteractionShowcasePage(){
 const root=useRef<HTMLElement>(null);
 useEffect(()=>{
  const mark=()=>{root.current?.querySelector('.scl-dialog-body')?.setAttribute('data-ppt-viewport','术库共创演示弹层的内容滚动区')};
  const observer=new MutationObserver(mark);if(root.current)observer.observe(root.current,{childList:true,subtree:true});
  return()=>observer.disconnect();
 },[]);
 return <section ref={root} className="rf-page rf-interaction-showcase rf-shuku-showcase" data-embedded-lesson aria-label="术库：可操作的学习、反馈、共创与课程迭代"><ShukuCoCreationLoop/></section>;
}
