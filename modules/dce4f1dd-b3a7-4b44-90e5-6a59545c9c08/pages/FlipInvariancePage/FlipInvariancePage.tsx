import { useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { LessonPage } from '../../components/LessonPage';
import { PhotoStage } from '../../components/PhotoStage';
import { TurnSign } from '../../components/TurnSign';
export function FlipInvariancePage() {
  const [flip, setFlip] = useState(false);
  return <LessonPage id="84d0d4d2-c13f-460b-89ca-38732578449a" subtitle="观察同一次水平翻转，对水果类别和转弯方向产生的不同影响。" takeaway="水平翻转是左右镜像：苹果类别不变，标志的方向标签由“左转”变为“右转”。">
    <div shuku-edit-id="e-6d96e046-00f0-40e7-9776-1b835774b527" className="daa-two daa-equal"><div shuku-edit-id="e-19c7d7e3-d5ed-4325-9b56-df9afcd8a1b4" className="daa-center"><PhotoStage imageStyle={{ transform: flip ? 'scaleX(-1)' : 'none' }} /><Typography shuku-edit-id="e-fe5e1f19-c116-4fa4-bfdf-3db00bddb188" variant="body">水果分类：仍然是苹果</Typography></div>
      <div shuku-edit-id="e-d2be06aa-b55c-4838-b0af-c3886f678f08" className="daa-reading"><Typography shuku-edit-id="e-05f2e6ec-142d-458e-8378-9902cdb72e25" variant="h3">转弯标志：看箭头指向</Typography>
        <div shuku-edit-id="e-4e179a0a-76b0-4123-8c1f-fa64b84fd19a" className="daa-turn-pair"><div shuku-edit-id="e-2d26e253-a44c-4574-9954-2f0dd34559ad" className="daa-turn-example"><TurnSign /><Typography shuku-edit-id="e-0ec49f27-0eaa-4bb4-80ef-42592d191905" variant="bodySmall">原图：左转</Typography></div><Typography shuku-edit-id="e-5a5af8ba-0497-4b18-9a3c-59edacb003f1" variant="bodySmall" tone="muted">水平翻转 →</Typography><div shuku-edit-id="e-9c9da22d-fd99-4a74-8516-d0a2451254f8" className="daa-turn-example"><TurnSign direction={flip ? 'right' : 'left'} /><Typography shuku-edit-id="e-b3deb170-0b33-4403-8919-dac260abc697" variant="bodySmall" tone={flip ? 'success' : 'muted'}>{flip ? '翻转后：右转' : '当前：左转'}</Typography></div></div>
        <Button variant="primary" onClick={() => setFlip(!flip)}><Typography shuku-edit-id="e-bf2852f9-e738-4054-bc37-8a68cca581d3" as="span" variant="bodySmall" tone="inherit">{flip ? '还原图片与标志' : '水平翻转两张图片'}</Typography></Button>
        <Typography shuku-edit-id="e-abc9861c-c933-4d7e-bd2a-404803161c7b" variant="body" tone={flip ? 'accent' : 'muted'}>{flip ? '水果类别没变，转弯方向变了。' : '点击水平翻转，观察左右镜像后的标签。'}</Typography>
      </div></div>
  </LessonPage>;
}
