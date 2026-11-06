import { useState } from 'react';
import { Button, RangeControl, Typography } from '../../../shared/react';
import { LessonPage } from '../../components/LessonPage';
import { RegionAugmentation } from '../../components/RegionAugmentation';
import { TargetWeights } from '../../components/TargetWeights';
export function CutoutPage() {
  const [pear,setPear]=useState(true);
  const [size,setSize]=useState(.35),[position,setPosition]=useState({x:.63,y:.35});
  const width=size*2/3,patch={...position,width,height:size};
  return <LessonPage id="16" subtitle="遮住一部分图像，训练模型减少对单一局部线索的依赖。" takeaway="标准分类 Cutout 保留原标签；遮挡过大可能破坏学习信息，应限制范围并验证效果。">
    <div className="daa-two"><div className="daa-center daa-cutout-example"><RegionAugmentation mode="cutout" file={pear?'06-asian-pear.png':'01-fuji-apple.png'} patch={patch} onMove={(x,y)=>setPosition({x,y})}/><Typography variant="bodySmall" tone="muted">拖动黑块，打断完整轮廓，再观察果皮细节</Typography><div className="daa-actions"><Button active={pear} onClick={()=>setPear(true)}><Typography as="span" variant="bodySmall" tone="inherit">圆形梨</Typography></Button><Button active={!pear} onClick={()=>setPear(false)}><Typography as="span" variant="bodySmall" tone="inherit">苹果</Typography></Button></div></div>
      <div className="daa-reading daa-mix-reading"><RangeControl label="遮挡边长（相对图像高度）" value={size} min={.05} max={.65} step={.05} digits={2} onChange={e=>{const s=+e.target.value;setSize(s);setPosition(p=>({x:Math.min(p.x,1-s*2/3),y:Math.min(p.y,1-s)}));}}/>
        <Typography variant="h3">只遮挡，不引入另一类别</Typography><TargetWeights apple={pear?0:1}/><Typography variant="bodySmall" tone={size>.5?'warning':'muted'}>{size>.5?'遮挡较大：检查剩余信息是否仍支持学习。':'圆形也可能是梨。遮挡鼓励利用多个局部线索，但不能保证模型一定关注果皮。'}</Typography>
      </div></div>
  </LessonPage>;
}
