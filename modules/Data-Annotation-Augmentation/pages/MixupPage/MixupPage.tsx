import { useState } from 'react';
import { RangeControl, Typography } from '../../../shared/react';
import { LessonPage } from '../../components/LessonPage';
import { FruitMixCanvas } from '../../components/FruitMixCanvas';
import { TargetWeights } from '../../components/TargetWeights';
import { photoUrl } from '../../data';
export function MixupPage() {
  const [weight,setWeight]=useState(.7);
  return <LessonPage id="17" subtitle="两张图片逐像素加权，两个类别向量也按同一权重混合。" takeaway="Mixup 同时混合图片与标签；两者使用相同的混合权重。">
    <div className="daa-two"><div className="daa-center"><FruitMixCanvas weight={weight}/><Typography variant="bodySmall" tone="muted">整张苹果图与整张梨图叠加</Typography></div>
      <div className="daa-reading daa-mix-reading"><div className="daa-mix-sources">{[['01-fuji-apple.png','A：苹果'],['02-bartlett-pear.png','B：梨']].map(([file,label])=><div key={file}><img src={photoUrl(file)} alt={label}/><Typography variant="bodySmall">{label}</Typography></div>)}</div>
        <RangeControl label="苹果图及其标签的混合权重" value={weight} min={0} max={1} step={.05} digits={2} onChange={e=>setWeight(+e.target.value)}/><TargetWeights apple={weight}/>
        <Typography variant="bodySmall" tone="muted">混合样本与目标，减少对原样本的死记硬背。两端恢复纯梨、纯苹果；中间使用软标签。</Typography>
      </div></div>
  </LessonPage>;
}
