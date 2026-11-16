import { useState } from 'react';
import { RangeControl, Typography } from "@shuku/course-style/react";
import { LessonPage } from '../../components/LessonPage';
import { FruitMixCanvas } from '../../components/FruitMixCanvas';
import { TargetWeights } from '../../components/TargetWeights';
import { photoUrl } from '../../data';
export function MixupPage() {
  const [weight,setWeight]=useState(.7);
  return <LessonPage id="8732c60e-044d-435d-b8a4-13e7b8a03504" subtitle="两张图片逐像素加权，两个类别向量也按同一权重混合。" takeaway="Mixup 同时混合图片与标签；两者使用相同的混合权重。">
    <div shuku-edit-id="e-0ccb507f-dcc7-42d7-a421-d9cade7be112" className="daa-two"><div shuku-edit-id="e-0d1c4a93-30c5-4ef0-b582-db854d40a987" className="daa-center"><FruitMixCanvas weight={weight}/><Typography shuku-edit-id="e-34285595-ec42-47ed-b61f-4804fb642d70" variant="bodySmall" tone="muted">整张苹果图与整张梨图叠加</Typography></div>
      <div shuku-edit-id="e-bf1fb467-09ff-4eee-9347-7b2457beb63b" className="daa-reading daa-mix-reading"><div shuku-edit-id="e-c431495e-4f7c-42a4-b10f-51a68b8d5b0e" className="daa-mix-sources">{[['01-fuji-apple.jpg','A：苹果'],['02-bartlett-pear.jpg','B：梨']].map(([file,label])=><div shuku-edit-id="e-6e43d30b-6378-44db-8ddc-24e7e8f642d7" key={file}><img shuku-edit-id="e-a21228bb-bb88-43ac-8ca5-316fcc90431f" src={photoUrl(file)} alt={label}/><Typography shuku-edit-id="e-6dcc8143-022e-46f7-9cae-9cfe2588a10d" variant="bodySmall">{label}</Typography></div>)}</div>
        <RangeControl label="苹果图及其标签的混合权重" value={weight} min={0} max={1} step={.05} digits={2} onChange={e=>setWeight(+e.target.value)}/><TargetWeights apple={weight}/>
        <Typography shuku-edit-id="e-2e321ab1-dc98-45c6-b11d-94b415e7b360" variant="bodySmall" tone="muted">混合样本与目标，减少对原样本的死记硬背。两端恢复纯梨、纯苹果；中间使用软标签。</Typography>
      </div></div>
  </LessonPage>;
}
