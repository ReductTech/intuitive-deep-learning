import { RegressionClassificationPage } from './pages/RegressionClassificationPage/RegressionClassificationPage';
import { ProbabilityMappingPage } from './pages/ProbabilityMappingPage/ProbabilityMappingPage';
import { ProbabilityLogOddsPage } from './pages/ProbabilityLogOddsPage/ProbabilityLogOddsPage';
import { SigmoidPage } from './pages/SigmoidPage/SigmoidPage';
import { TitanicTrainingPage } from './pages/TitanicTrainingPage/TitanicTrainingPage';
import { useLayoutEffect, useRef, useState } from 'react';
import { ModuleShell } from '../shared/react';
import '../shared/react/styles.css';
import '../shared/react/presentation.css';
export function GuidePage() {
  const ref=useRef<HTMLDivElement>(null);
  const [scale,setScale]=useState(1);
  useLayoutEffect(()=>{
    const host=ref.current;if(!host)return;
    const update=()=>setScale(Math.min(1,host.clientWidth/1600));
    update();const observer=new ResizeObserver(update);observer.observe(host);
    return ()=>observer.disconnect();
  },[]);
  return <ModuleShell title="多层感知机" subtitle="从存活预测出发，建立分类概率与参数学习基础。" shellClassName="course-shell course-blog-shell">
    <div className="lesson-canvas-frame" ref={ref} style={{ height:900*scale, marginTop:0 }}><div className="course-page-surface course-shell" style={{ transform:`scale(${scale})` }}><RegressionClassificationPage /></div></div>
    <div className="lesson-canvas-frame" style={{ height:900*scale, marginTop:24 }}><div className="course-page-surface course-shell" style={{ transform:`scale(${scale})` }}><ProbabilityMappingPage /></div></div>
    <div className="lesson-canvas-frame" style={{ height:900*scale, marginTop:24 }}><div className="course-page-surface course-shell" style={{ transform:`scale(${scale})` }}><ProbabilityLogOddsPage /></div></div>
    <div className="lesson-canvas-frame" style={{ height:900*scale, marginTop:24 }}><div className="course-page-surface course-shell" style={{ transform:`scale(${scale})` }}><SigmoidPage /></div></div>
    <div className="lesson-canvas-frame" style={{ height:900*scale, marginTop:24 }}><div className="course-page-surface course-shell" style={{ transform:`scale(${scale})` }}><TitanicTrainingPage /></div></div>
  </ModuleShell>;
}
