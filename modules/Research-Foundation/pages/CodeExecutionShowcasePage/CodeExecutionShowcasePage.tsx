import { useEffect, useRef } from 'react';
import { CodePracticePage } from '../../../AI-Practice-Education/pages/CodePracticePage/CodePracticePage';
import '../../components/InteractionShowcase.css';

export function CodeExecutionShowcasePage(){
 const root=useRef<HTMLElement>(null);
 useEffect(()=>{
  const mark=()=>{
   root.current?.querySelector('.cm-scroller')?.setAttribute('data-ppt-viewport','可滚动的 Python 源码编辑器');
   root.current?.querySelector('.code-lab-graph-area')?.setAttribute('data-ppt-viewport','查看算子详情时可滚动的网络结构图');
  };
  mark();const observer=new MutationObserver(mark);if(root.current)observer.observe(root.current,{childList:true,subtree:true});
  return()=>observer.disconnect();
 },[]);
 return <section ref={root} className="rf-page rf-interaction-showcase rf-code-showcase" aria-label="真实交互作品：Python 实际执行与网络结构联动"><CodePracticePage/></section>;
}
