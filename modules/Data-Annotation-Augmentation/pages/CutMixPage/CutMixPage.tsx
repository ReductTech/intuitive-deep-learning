import { useState } from 'react';
import { RangeControl, Typography } from '../../../shared/react';
import { LessonPage } from '../../components/LessonPage';
import { RegionAugmentation } from '../../components/RegionAugmentation';
import { TargetWeights } from '../../components/TargetWeights';
export function CutMixPage() {
  const [size,setSize]=useState(.5),[position,setPosition]=useState({x:.35,y:.25});
  const patch={...position,width:size,height:size};
  const visibleWidth=Math.max(0,Math.min(1,patch.x+patch.width)-Math.max(0,patch.x));
  const visibleHeight=Math.max(0,Math.min(1,patch.y+patch.height)-Math.max(0,patch.y));
  const area=visibleWidth*visibleHeight;
  return <LessonPage id="18" subtitle="直接拖动贴入的梨图区域，标签按图内实际替换面积变化。" takeaway="移动位置不改变完整贴入区域的权重；改变大小或拖出图像边缘时，按实际替换面积重新计算。">
    <div className="daa-two"><div className="daa-center"><RegionAugmentation mode="cutmix" patch={patch} onMove={(x,y)=>setPosition({x,y})}/><Typography variant="bodySmall" tone="muted">直接拖动梨图 · 梨图与贴入区域一起移动</Typography></div>
      <div className="daa-reading"><RangeControl label="贴入区域的大小" value={size} min={.05} max={1} step={.05} digits={2} onChange={e=>{const s=+e.target.value;setSize(s);setPosition(p=>({x:Math.max(.05-s,Math.min(p.x,.95)),y:Math.max(.05-s,Math.min(p.y,.95))}));}}/>
        <Typography variant="body">梨图实际替换了整图的 {(area*100).toFixed(1)}%</Typography><TargetWeights apple={1-area}/>
        <Typography variant="bodySmall" tone="muted">从梨图裁出一块后直接移动粘贴。拖出边缘的部分不计入面积。</Typography>
      </div></div>
  </LessonPage>;
}
