import { useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
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
  return <LessonPage id="6c77032b-0dc6-405e-a1e4-5a34c34e8b5f" subtitle="在现有训练样本上施加合理变换，生成仍能支持任务标签的训练视图。"
    takeaway="目标是在未见样本上也能识别正确（泛化）。">
    <div shuku-edit-id="e-0f025105-eccb-41d9-b64b-dfbae22b5b50" className="daa-purpose-layout">
      <div shuku-edit-id="e-d79778aa-e548-43a9-9bde-8d0893e6a168" className="daa-purpose-views">{views.map((view,index)=><div shuku-edit-id="e-7c64435b-0687-4721-a2bf-91dc8d41845e" key={index}>
        <div shuku-edit-id="e-9e9e202e-42b2-40a7-a320-65a04a94aed5" className="daa-purpose-image"><img shuku-edit-id="e-2ad302b2-c66f-4138-9805-16b6e7cc2213" src={photoUrl("01-fuji-apple.webp")} alt={view.label} style={view.style}/>{augmented&&index===2&&<div shuku-edit-id="e-e769ff0c-d40e-448c-a44e-b467342d6678" className="daa-purpose-cutout"/>}</div>
        <Typography shuku-edit-id="e-daa5a49a-e2db-4290-944e-fc6711bd78c5" variant="bodySmall" align="center">{view.label}</Typography>
        <Typography shuku-edit-id="e-2274ff7f-d621-4722-888c-12a227b679b6" variant="body" tone="success" align="center">标签：苹果</Typography>
      </div>)}</div>
      <div shuku-edit-id="e-8f7d3373-91b3-4871-a59d-5c4f463dd280" className="daa-purpose-explanation">
        <div shuku-edit-id="e-97fc7b9c-61f5-48f9-8972-4920e5255300" className="daa-stack">
          <Typography shuku-edit-id="e-76aa17d1-dbbf-4cbd-a7b5-e9460e07b963" variant="h3">希望学到：颜色、局部可见性变化，类别仍稳定</Typography>
          <Typography shuku-edit-id="e-1a304952-f88c-4bf6-97e1-2d5d46412e35" variant="body">颜色变化削弱“红色才是苹果”的捷径；遮挡鼓励利用多个局部线索。</Typography>
          
        </div>
        <Button variant="primary" onClick={()=>setAugmented(!augmented)}><Typography shuku-edit-id="e-ab21ca3d-feea-4080-b3fa-f76a80ec2293" as="span" variant="bodySmall" tone="inherit">{augmented?'对比简单复制':'把复制改为合理变化'}</Typography></Button>
      </div>
    </div>
  </LessonPage>;
}
