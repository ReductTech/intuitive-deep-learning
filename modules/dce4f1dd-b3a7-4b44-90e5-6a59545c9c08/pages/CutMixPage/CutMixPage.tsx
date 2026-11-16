import { useState } from 'react';
import { RangeControl, Typography } from "@shuku/course-style/react";
import { LessonPage } from '../../components/LessonPage';
import { RegionAugmentation } from '../../components/RegionAugmentation';
import { TargetWeights } from '../../components/TargetWeights';
export function CutMixPage() {
  const [size,setSize]=useState(.5),[position,setPosition]=useState({x:.35,y:.25});
  const patch={...position,width:size,height:size};
  const visibleWidth=Math.max(0,Math.min(1,patch.x+patch.width)-Math.max(0,patch.x));
  const visibleHeight=Math.max(0,Math.min(1,patch.y+patch.height)-Math.max(0,patch.y));
  const area=visibleWidth*visibleHeight;
  return <LessonPage id="98f06226-8d88-47cf-9742-0dbd8e60f0c8" subtitle="直接拖动贴入的梨图区域，标签按图内实际替换面积变化。" takeaway="移动位置不改变完整贴入区域的权重；改变大小或拖出图像边缘时，按实际替换面积重新计算。">
    <div shuku-edit-id="e-4d9121b2-650f-4074-8df3-f2ddaace68e0" className="daa-two"><div shuku-edit-id="e-d494a149-9ec2-42ec-8566-427ff955e292" className="daa-center"><RegionAugmentation mode="cutmix" patch={patch} onMove={(x,y)=>setPosition({x,y})}/><Typography shuku-edit-id="e-f90f45a6-aa0d-4068-8b02-c9276c7bd282" variant="bodySmall" tone="muted">直接拖动梨图 · 梨图与贴入区域一起移动</Typography></div>
      <div shuku-edit-id="e-9138b74c-8e6a-4388-b86a-6bdb8092f279" className="daa-reading"><RangeControl label="贴入区域的大小" value={size} min={.05} max={1} step={.05} digits={2} onChange={e=>{const s=+e.target.value;setSize(s);setPosition(p=>({x:Math.max(.05-s,Math.min(p.x,.95)),y:Math.max(.05-s,Math.min(p.y,.95))}));}}/>
        <Typography shuku-edit-id="e-22290090-bf7f-4186-a35d-4b308201bf68" variant="body">梨图实际替换了整图的 {(area*100).toFixed(1)}%</Typography><TargetWeights apple={1-area}/>
        <Typography shuku-edit-id="e-0efc83f3-37ba-47ae-8ff7-1b668d3ba9e6" variant="bodySmall" tone="muted">从梨图裁出一块后直接移动粘贴。拖出边缘的部分不计入面积。</Typography>
      </div></div>
  </LessonPage>;
}
