import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Button, LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import '../shared/react/presentation.css';
import './policy.css';
import { course } from './course';

function Canvas({ children }: { children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const node = host.current; if (!node) return;
    const update = () => setScale(Math.min(1,node.clientWidth/1600));
    update(); const observer = new ResizeObserver(update); observer.observe(node);
    return () => observer.disconnect();
  },[]);
  return <div className="lesson-canvas-frame pg-guide-canvas" ref={host} style={{height:900*scale}}><div className="course-page-surface" style={{transform:`scale(${scale})`}}>{children}</div></div>;
}
const steps: LessonFlowStep[] = course.map(({id,component:Component},i)=>({id,revealMode:'scroll',completesLesson:i===course.length-1,render:context=><><Canvas><Component/></Canvas>{!context.isComplete&&<div className="pg-guide-actions"><Button variant="primary" onClick={context.complete}>{i===course.length-1?'完成本单元':'继续下一页'}</Button></div>}</>}));
export function GuidePage() {
 return <ModuleShell title="策略梯度入门" subtitle={`同一张地图，先探索隐藏障碍，再看策略网络如何从经历中更新。${course.length} 页课程，建议先了解 Q-learning。`} shellClassName="course-blog-shell pg-guide"><div className="pg-guide-actions"><Button href="/scenedeck/?deck=policy-gradient" variant="primary">以 PPT 方式学习</Button></div><LessonFlow steps={steps} persistenceKey="policy-gradient-reinforce-guide-v4"/></ModuleShell>;
}
