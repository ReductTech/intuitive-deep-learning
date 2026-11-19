import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useId } from 'react';
import { Building2, FlaskConical, GraduationCap } from 'lucide-react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './EducationEcosystemPreviewPage.css';

const stages = [
  { title: '共建内容', outcome: '学习资料持续变好' },
  { title: '教学育人', outcome: '优秀人才得到培养' },
  { title: '协作研究', outcome: '研究成果回到教学' },
] as const;

const participants = [
  { Icon: FlaskConical, title: '科研工作者', contribution: '融入前沿成果' },
  { Icon: GraduationCap, title: '招生单位', contribution: '发现合适人才' },
  { Icon: Building2, title: '龙头企业', contribution: '连接发展机会' },
] as const;

export function EducationEcosystemPreviewPage() {
  const arrowId = `ecosystem-return-${useId().replaceAll(':', '')}`;
  return <ContentBlock shuku-edit-id="e-cfd3e15d-fab2-4d0e-9452-3a3669198a83" title="连接教学、科研、人才与产业" headingLevel={1}
    className="aipe-ecosystem-page" bodyClassName="aipe-ecosystem-body">
    <div shuku-edit-id="e-a02c2df8-326d-4d8e-9f03-5f264a93420d" className="aipe-ecosystem-headings">
      {stages.map(stage => <div shuku-edit-id="e-6eb45d7b-2969-40fd-885e-193d9176905d" key={stage.title}>
        <Typography shuku-edit-id="e-22d01090-cffc-4497-be55-1bd8c1809f54" as="h2" variant="h3" tone="accent">{stage.title}</Typography>
        <span shuku-edit-id="e-0ad71dc4-0d45-4863-8bcc-e42c6eb4d56a" aria-hidden="true" />
      </div>)}
    </div>
    <img shuku-edit-id="e-e04cd5d4-5907-4779-8066-4ddf5fb76517" className="aipe-ecosystem-panorama"
      src={moduleAssetUrl("images/closing-preview/education-ecosystem-panorama-v3.webp")}
      alt="同一大学教学研究空间中的连续长图：师生共同改进学习资料，指导学生实践，并与研究伙伴讨论成果。"
      draggable={false}/>
    <div shuku-edit-id="e-273edbf6-eda1-48cd-823d-10d750b2bd6a" className="aipe-ecosystem-outcomes">
      {stages.map(stage => <Typography shuku-edit-id="e-0d334c0f-739f-4323-8c88-b345b87fbc1c" as="p" key={stage.title} variant="h3" tone="accent">{stage.outcome}</Typography>)}
    </div>
    <div shuku-edit-id="e-65bfa377-0910-4d39-9023-328f0fb5a82d" className="aipe-ecosystem-feedback">
      <svg shuku-edit-id="e-174321aa-205c-4be7-a2d3-9a4306dcdccb" viewBox="0 0 1540 90" preserveAspectRatio="none" aria-hidden="true">
        <defs shuku-edit-id="e-1697833c-d4f4-4129-adea-2bc38f39dcc5"><marker shuku-edit-id="e-9075507b-6a7d-4994-b2ed-356c75b1765a" id={arrowId} viewBox="0 0 12 12" refX="10" refY="6" markerWidth="4" markerHeight="4" orient="auto"><path shuku-edit-id="e-3f0e98d1-7dda-4304-adda-0bacd2e2bc56" d="M0 0L12 6L0 12Z" fill="#80a9d7"/></marker></defs>
        <path shuku-edit-id="e-32b52d62-374d-4a4a-b7c9-8fcb34cd57dc" d="M1450 10C1170 105 390 105 95 14" fill="none" stroke="#a8c9eb" strokeWidth="10" strokeLinecap="round" markerEnd={`url(#${arrowId})`}/>
      </svg>
      <Typography shuku-edit-id="e-cdc33def-2b57-4ffd-98fa-bb7ff4e5dd74" as="p" variant="body" tone="muted">内容、人才与成果，持续支持下一轮教学</Typography>
    </div>
    <div shuku-edit-id="e-dc1f38f1-12c9-4723-a469-745baba3eed3" className="aipe-ecosystem-participants">
      {participants.map(({ Icon, title, contribution }) => <div shuku-edit-id="e-6efd2c93-18b4-4eac-99ec-2e09bd46d455" key={title}>
        <Icon aria-hidden="true" strokeWidth={1.7}/>
        <Typography shuku-edit-id="e-345397d9-7fd3-4559-bdd2-cf78f180b46b" as="p" variant="body" tone="accent"><strong shuku-edit-id="e-4b2d8159-3477-45ef-9e0b-965f9505cf18">{title}：</strong>{contribution}</Typography>
      </div>)}
    </div>
  </ContentBlock>;
}

