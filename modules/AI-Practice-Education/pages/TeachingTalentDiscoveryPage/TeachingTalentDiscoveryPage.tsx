import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './TeachingTalentDiscoveryPage.css';

const stages = [
  { title: '教学中发现人才', detail: '从理解、实践与交流中识别潜力' },
  { title: '带领学生深入科研', detail: '围绕研究方向，持续指导与协作' },
  { title: '师生共同产出成果', detail: '推进研究，形成有影响力的成果' },
] as const;
const asset = (name: string) => moduleAssetUrl(outline.moduleIdentity.id, `images/talent/${name}`);

export function TeachingTalentDiscoveryPage() {
  return <ContentBlock title="在教学中发现人才，在科研中共同成长"
    subtitle="教学发现 → 导师培养 → 科研产出" headingLevel={1}
    className="aipe-talent-page" bodyClassName="aipe-talent-body">
    <figure className="aipe-talent-process">
      <img className="aipe-talent-scenes" src={asset('research-growth-scenes.png')}
        alt="教师从课堂交流与实践中了解学生，带领学生深入科研，师生共同分析实验、推进研究成果。" draggable={false}/>
      <figcaption className="aipe-talent-stage-labels">
        {stages.map(stage => <div key={stage.title}>
          <Typography as="h2" variant="h3" tone="accent">{stage.title}</Typography>
          <Typography as="p" variant="bodySmall" tone="muted">{stage.detail}</Typography>
        </div>)}
      </figcaption>
    </figure>
    <div className="aipe-talent-benefits">
      <div>
        <img src={asset('teacher-portrait.png')} alt="" aria-hidden="true" draggable={false}/>
        <Typography as="p" variant="body" tone="accent"><strong>教师：</strong>发现合适生源，充实研究团队</Typography>
      </div>
      <div>
        <img src={asset('students-portrait.png')} alt="" aria-hidden="true" draggable={false}/>
        <Typography as="p" variant="body" tone="accent"><strong>学生：</strong>获得导师指导与科研机会</Typography>
      </div>
    </div>
  </ContentBlock>;
}

