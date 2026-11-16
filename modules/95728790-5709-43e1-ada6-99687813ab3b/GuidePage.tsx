import { RegressionClassificationPage } from './pages/RegressionClassificationPage/RegressionClassificationPage';
import { ProbabilityMappingPage } from './pages/ProbabilityMappingPage/ProbabilityMappingPage';
import { ProbabilityLogOddsPage } from './pages/ProbabilityLogOddsPage/ProbabilityLogOddsPage';
import { SigmoidPage } from './pages/SigmoidPage/SigmoidPage';
import { TitanicTrainingPage } from './pages/TitanicTrainingPage/TitanicTrainingPage';
import { useLayoutEffect, useRef, useState } from 'react';
import { ModuleShell } from "@shuku/course-style/react";
import "@shuku/course-style/react/styles.css";
import "@shuku/course-style/react/presentation.css";
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
    <div shuku-edit-id="e-fe068194-9f29-4be0-9b5b-46ba4adec886" className="lesson-canvas-frame" ref={ref} style={{ height:900*scale, marginTop:0 }}><div shuku-edit-id="e-d140306f-9eb2-48d3-b351-2aa3ba9bf376" className="course-page-surface course-shell" style={{ transform:`scale(${scale})` }}><RegressionClassificationPage /></div></div>
    <div shuku-edit-id="e-ea3b4f2a-2661-4b99-b5c9-2aaa0e56b3a6" className="lesson-canvas-frame" style={{ height:900*scale, marginTop:24 }}><div shuku-edit-id="e-0bce8728-0621-40f4-a5f7-da124549039d" className="course-page-surface course-shell" style={{ transform:`scale(${scale})` }}><ProbabilityMappingPage /></div></div>
    <div shuku-edit-id="e-94691b0c-35a9-44a1-b70c-a2a9dd9bb8c0" className="lesson-canvas-frame" style={{ height:900*scale, marginTop:24 }}><div shuku-edit-id="e-df9939a0-d495-468c-b601-c97359008b39" className="course-page-surface course-shell" style={{ transform:`scale(${scale})` }}><ProbabilityLogOddsPage /></div></div>
    <div shuku-edit-id="e-5ab71bbe-c5ce-4a89-8402-81ea15691c2f" className="lesson-canvas-frame" style={{ height:900*scale, marginTop:24 }}><div shuku-edit-id="e-7d25e9a2-028d-4a97-a059-1175a3fd2f0c" className="course-page-surface course-shell" style={{ transform:`scale(${scale})` }}><SigmoidPage /></div></div>
    <div shuku-edit-id="e-9be1d224-a997-4be0-bd8c-1969fe27fa40" className="lesson-canvas-frame" style={{ height:900*scale, marginTop:24 }}><div shuku-edit-id="e-5a890703-d239-4404-80c5-355702b04136" className="course-page-surface course-shell" style={{ transform:`scale(${scale})` }}><TitanicTrainingPage /></div></div>
  </ModuleShell>;
}
