import { useState } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPage } from '../../components/LessonPage';
import { photoUrl } from '../../data';
import './AugmentationPurposePage.css';

export function AugmentationPurposePage() {
  const [augmented, setAugmented] = useState(false);
  const views = [
    { label: '原始训练图片', style: {} },
    { label: augmented ? '颜色变化的训练视图' : '相同副本', style: { filter: augmented ? 'hue-rotate(35deg) saturate(.8)' : 'none' } },
    { label: augmented ? '遮挡后的训练视图' : '相同副本', style: {} },
  ];
  return <LessonPage id="09" subtitle="在现有训练样本上施加合理变换，生成仍能支持任务标签的训练视图。"
    takeaway="目标是在未见样本上也能识别正确（泛化）。">
    <div className="daa-purpose-layout">
      <div className="daa-purpose-views">{views.map((view,index)=><div key={index}>
        <div className="daa-purpose-image"><img src={photoUrl('01-fuji-apple.png')} alt={view.label} style={view.style}/>{augmented&&index===2&&<div className="daa-purpose-cutout"/>}</div>
        <Typography variant="bodySmall" align="center">{view.label}</Typography>
        <Typography variant="body" tone="success" align="center">标签：苹果</Typography>
      </div>)}</div>
      <div className="daa-purpose-explanation">
        <div className="daa-stack">
          <Typography variant="h3">希望学到：颜色、局部可见性变化，类别仍稳定</Typography>
          <Typography variant="body">颜色变化削弱“红色才是苹果”的捷径；遮挡鼓励利用多个局部线索。</Typography>
          
        </div>
        <Button variant="primary" onClick={()=>setAugmented(!augmented)}><Typography as="span" variant="bodySmall" tone="inherit">{augmented?'对比简单复制':'把复制改为合理变化'}</Typography></Button>
      </div>
    </div>
  </LessonPage>;
}
