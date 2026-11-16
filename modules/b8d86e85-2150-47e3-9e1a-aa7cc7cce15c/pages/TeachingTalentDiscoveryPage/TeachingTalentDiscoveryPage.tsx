import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './TeachingTalentDiscoveryPage.css';

const stages = [
  { title: '教学中发现人才', detail: '从理解、实践与交流中识别潜力' },
  { title: '带领学生深入科研', detail: '围绕研究方向，持续指导与协作' },
  { title: '师生共同产出成果', detail: '推进研究，形成有影响力的成果' },
] as const;
const asset = (name: string) => moduleAssetUrl(`images/talent/${name}`);

export function TeachingTalentDiscoveryPage() {
  return <ContentBlock shuku-edit-id="e-34e87b6e-5d0d-441d-bc6a-719d0c3f7321" title="在教学中发现人才，在科研中共同成长"
    subtitle="教学发现 → 导师培养 → 科研产出" headingLevel={1}
    className="aipe-talent-page" bodyClassName="aipe-talent-body">
    <figure shuku-edit-id="e-b52a57cb-848f-46d4-a13c-0fb7ab7a940d" className="aipe-talent-process">
      <img shuku-edit-id="e-c6a56dc6-ab37-4efd-a49e-021ea30da246" className="aipe-talent-scenes" src={asset('research-growth-scenes.jpg')}
        alt="教师从课堂交流与实践中了解学生，带领学生深入科研，师生共同分析实验、推进研究成果。" draggable={false}/>
      <figcaption shuku-edit-id="e-3db338ba-0dd1-4b86-8bf7-0fd42036c4f6" className="aipe-talent-stage-labels">
        {stages.map(stage => <div shuku-edit-id="e-7f187db7-6dd8-4f79-b58b-f479b341e39e" key={stage.title}>
          <Typography shuku-edit-id="e-598c7cb3-4899-47fd-a698-500cfe28c017" as="h2" variant="h3" tone="accent">{stage.title}</Typography>
          <Typography shuku-edit-id="e-7db8e322-ef64-4d3c-8ffe-066b746baa99" as="p" variant="bodySmall" tone="muted">{stage.detail}</Typography>
        </div>)}
      </figcaption>
    </figure>
    <div shuku-edit-id="e-22f9f4de-e628-4d71-9695-37ddec68cf8e" className="aipe-talent-benefits">
      <div shuku-edit-id="e-41f57dac-6c97-4811-acb1-cfb8b3208fbe">
        <img shuku-edit-id="e-4c0f1441-937a-42f8-88de-649eb655aafe" src={asset('teacher-portrait.jpg')} alt="" aria-hidden="true" draggable={false}/>
        <Typography shuku-edit-id="e-084227b4-60da-4355-9d14-1e6d969836f4" as="p" variant="body" tone="accent"><strong shuku-edit-id="e-3f1ed08b-b3d5-4a6f-a686-1758d18e67de">教师：</strong>发现合适生源，充实研究团队</Typography>
      </div>
      <div shuku-edit-id="e-a689a98b-d491-4a94-b09a-78451675c128">
        <img shuku-edit-id="e-14507a95-e007-47ce-a8da-36c3c0f4dfe2" src={asset('students-portrait.jpg')} alt="" aria-hidden="true" draggable={false}/>
        <Typography shuku-edit-id="e-8efd2875-5351-43b7-86d7-6719aee0ea65" as="p" variant="body" tone="accent"><strong shuku-edit-id="e-4055dacc-e288-484f-85a5-0985a1aea354">学生：</strong>获得导师指导与科研机会</Typography>
      </div>
    </div>
  </ContentBlock>;
}

