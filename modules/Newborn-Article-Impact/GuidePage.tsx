import { useLayoutEffect,useRef,useState,type ReactNode } from 'react';
import { ModuleShell } from '../shared/react';
import { course } from './course';import { NaipPpt } from './NaipPpt';
import '../shared/react/styles.css';import '../shared/react/ui-kit.css';import '../shared/react/presentation.css';
function Canvas({children}:{children:ReactNode}){const ref=useRef<HTMLDivElement>(null);const [scale,setScale]=useState(1);useLayoutEffect(()=>{const el=ref.current;if(!el)return;const update=()=>setScale(Math.min(1,el.clientWidth/1600));update();const ro=new ResizeObserver(update);ro.observe(el);return()=>ro.disconnect()},[]);return <div ref={ref} className="lesson-canvas-frame" style={{height:900*scale}}><div className="course-page-surface" style={{transform:`scale(${scale})`}}>{children}</div></div>}
export function GuidePage(){if(new URLSearchParams(location.search).get('view')==='ppt')return <NaipPpt/>;return <ModuleShell title="从文字到价值：新生文章影响力预测" shellClassName="course-blog-shell"><div className="naipc-guide">{course.map(({id,Component})=><Canvas key={id}><Component/></Canvas>)}</div></ModuleShell>}
