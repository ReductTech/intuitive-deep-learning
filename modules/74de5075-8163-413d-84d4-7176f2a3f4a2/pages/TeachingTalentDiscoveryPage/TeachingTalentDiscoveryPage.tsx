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
  return <ContentBlock shuku-edit-id="e-318c7a3a-9adb-4468-9303-65b9e2bcb66c" title="在教学中发现人才，在科研中共同成长"
    subtitle="教学发现 → 导师培养 → 科研产出" headingLevel={1}
    className="aipe-talent-page" bodyClassName="aipe-talent-body">
    <figure shuku-edit-id="e-6d00adde-2f61-4530-850c-73231097ad3f" className="aipe-talent-process">
      <img shuku-edit-id="e-b28b4d41-f380-4639-9d29-313ce3a331f6" className="aipe-talent-scenes" src={asset('research-growth-scenes.jpg')}
        alt="教师从课堂交流与实践中了解学生，带领学生深入科研，师生共同分析实验、推进研究成果。" draggable={false}/>
      <figcaption shuku-edit-id="e-d2a4a240-82b1-4676-a987-290daa49c2f8" className="aipe-talent-stage-labels">
        {stages.map(stage => <div shuku-edit-id="e-67630c6b-2b60-4c09-bc8f-7b6acab99b1b" key={stage.title}>
          <Typography shuku-edit-id="e-b0e59d3f-27be-425c-a237-0d2c3dfbf02f" as="h2" variant="h3" tone="accent">{stage.title}</Typography>
          <Typography shuku-edit-id="e-61576bd7-5008-4f85-8caf-bd88ceaefcb7" as="p" variant="bodySmall" tone="muted">{stage.detail}</Typography>
        </div>)}
      </figcaption>
    </figure>
    <div shuku-edit-id="e-149f1681-d940-4122-9536-76307feed15a" className="aipe-talent-benefits">
      <div shuku-edit-id="e-39c65bce-59bd-4238-8a61-61f036197f81">
        <img shuku-edit-id="e-e186cc9e-84f9-4845-9e45-3a407b694d41" src={asset('teacher-portrait.jpg')} alt="" aria-hidden="true" draggable={false}/>
        <Typography shuku-edit-id="e-8b45c3e3-d0e5-4687-aebb-f58d50948d00" as="p" variant="body" tone="accent"><strong shuku-edit-id="e-bbe60706-df58-4882-86df-51b4eaf0be8e">教师：</strong>发现合适生源，充实研究团队</Typography>
      </div>
      <div shuku-edit-id="e-e8c7c432-f0c6-4044-ac81-8902d884c870">
        <img shuku-edit-id="e-040ae023-aaff-4121-9e73-b04fdb273936" src={asset('students-portrait.jpg')} alt="" aria-hidden="true" draggable={false}/>
        <Typography shuku-edit-id="e-34b1c42a-f59e-43c9-b721-b67e2fde0479" as="p" variant="body" tone="accent"><strong shuku-edit-id="e-35ea5a4b-1f45-4d03-99e2-b1825122a8c6">学生：</strong>获得导师指导与科研机会</Typography>
      </div>
    </div>
  </ContentBlock>;
}

