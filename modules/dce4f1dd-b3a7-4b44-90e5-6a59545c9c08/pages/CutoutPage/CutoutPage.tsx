import { useState } from 'react';
import { Button, RangeControl, Typography } from "@shuku/course-style/react";
import { LessonPage } from '../../components/LessonPage';
import { RegionAugmentation } from '../../components/RegionAugmentation';
import { TargetWeights } from '../../components/TargetWeights';
export function CutoutPage() {
  const [pear,setPear]=useState(true);
  const [size,setSize]=useState(.35),[position,setPosition]=useState({x:.63,y:.35});
  const width=size*2/3,patch={...position,width,height:size};
  return <LessonPage id="c69de653-d424-47a5-b76d-8697e9f0b216" subtitle="遮住一部分图像，训练模型减少对单一局部线索的依赖。" takeaway="标准分类 Cutout 保留原标签；遮挡过大可能破坏学习信息，应限制范围并验证效果。">
    <div shuku-edit-id="e-eb7984ec-78d5-48a4-a5ba-40349a95f929" className="daa-two"><div shuku-edit-id="e-be4dc191-ebb7-4fc1-a5a4-b835da9f11e3" className="daa-center daa-cutout-example"><RegionAugmentation mode="cutout" file={pear?'06-asian-pear.jpg':'01-fuji-apple.jpg'} patch={patch} onMove={(x,y)=>setPosition({x,y})}/><Typography shuku-edit-id="e-1366188d-5089-43a5-88fb-80e2bbde4725" variant="bodySmall" tone="muted">拖动黑块，打断完整轮廓，再观察果皮细节</Typography><div shuku-edit-id="e-9a32a538-b505-4c62-91e8-5624c1efead4" className="daa-actions"><Button active={pear} onClick={()=>setPear(true)}><Typography shuku-edit-id="e-fcceaa33-e07a-4368-8c24-6dbacae5a982" as="span" variant="bodySmall" tone="inherit">圆形梨</Typography></Button><Button active={!pear} onClick={()=>setPear(false)}><Typography shuku-edit-id="e-ccb8807f-b2ff-4a18-8466-4ed9054b54e6" as="span" variant="bodySmall" tone="inherit">苹果</Typography></Button></div></div>
      <div shuku-edit-id="e-c1d52516-4a67-4a81-a104-3816fc81dc99" className="daa-reading daa-mix-reading"><RangeControl label="遮挡边长（相对图像高度）" value={size} min={.05} max={.65} step={.05} digits={2} onChange={e=>{const s=+e.target.value;setSize(s);setPosition(p=>({x:Math.min(p.x,1-s*2/3),y:Math.min(p.y,1-s)}));}}/>
        <Typography shuku-edit-id="e-e31468c7-9739-48be-a825-29fcf0148d20" variant="h3">只遮挡，不引入另一类别</Typography><TargetWeights apple={pear?0:1}/><Typography shuku-edit-id="e-9ba7572b-f2c7-474c-9f10-1d8812d98f47" variant="bodySmall" tone={size>.5?'warning':'muted'}>{size>.5?'遮挡较大：检查剩余信息是否仍支持学习。':'圆形也可能是梨。遮挡鼓励利用多个局部线索，但不能保证模型一定关注果皮。'}</Typography>
      </div></div>
  </LessonPage>;
}
