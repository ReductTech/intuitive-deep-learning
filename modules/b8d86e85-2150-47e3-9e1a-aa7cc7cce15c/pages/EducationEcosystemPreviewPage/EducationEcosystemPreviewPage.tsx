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
  return <ContentBlock shuku-edit-id="e-416fbdae-b322-48a0-9505-eae88dc0d849" title="连接教学、科研、人才与产业" headingLevel={1}
    className="aipe-ecosystem-page" bodyClassName="aipe-ecosystem-body">
    <div shuku-edit-id="e-6e08eff0-210f-477e-b23a-c973be808ab2" className="aipe-ecosystem-headings">
      {stages.map(stage => <div shuku-edit-id="e-325a120e-26a9-4056-ae3c-e98b58e4ff22" key={stage.title}>
        <Typography shuku-edit-id="e-72df23e2-99cb-42ec-9228-118d9812cbe0" as="h2" variant="h3" tone="accent">{stage.title}</Typography>
        <span shuku-edit-id="e-21970e1d-0e1e-4224-8025-9ebc8336fcfc" aria-hidden="true" />
      </div>)}
    </div>
    <img shuku-edit-id="e-7b5825aa-7423-4e98-b170-43a9551d7ad3" className="aipe-ecosystem-panorama"
      src={moduleAssetUrl('images/closing-preview/education-ecosystem-panorama-v3.jpg')}
      alt="同一大学教学研究空间中的连续长图：师生共同改进学习资料，指导学生实践，并与研究伙伴讨论成果。"
      draggable={false}/>
    <div shuku-edit-id="e-b0b1f1d9-b6c5-4ea8-9ea2-ed1b22957296" className="aipe-ecosystem-outcomes">
      {stages.map(stage => <Typography shuku-edit-id="e-87a41c3b-d7fc-4b4d-bb36-0027aea2d800" as="p" key={stage.title} variant="h3" tone="accent">{stage.outcome}</Typography>)}
    </div>
    <div shuku-edit-id="e-f76b20d1-d5f6-4ea7-a4eb-3447c0970c49" className="aipe-ecosystem-feedback">
      <svg shuku-edit-id="e-53423d22-42c5-4675-b93b-fbe38a905faa" viewBox="0 0 1540 90" preserveAspectRatio="none" aria-hidden="true">
        <defs shuku-edit-id="e-62ee623f-d85c-40a9-8a19-5f17b3b4ad8f"><marker shuku-edit-id="e-49f1a5e9-db60-4b9e-bd21-0a833a074056" id={arrowId} viewBox="0 0 12 12" refX="10" refY="6" markerWidth="4" markerHeight="4" orient="auto"><path shuku-edit-id="e-e59b2937-7d64-4b5b-85ca-e761dea4ee78" d="M0 0L12 6L0 12Z" fill="#80a9d7"/></marker></defs>
        <path shuku-edit-id="e-16dc7aaa-7847-4714-96cc-21bfef364bb7" d="M1450 10C1170 105 390 105 95 14" fill="none" stroke="#a8c9eb" strokeWidth="10" strokeLinecap="round" markerEnd={`url(#${arrowId})`}/>
      </svg>
      <Typography shuku-edit-id="e-f7352419-a4ec-423a-adc5-b10b1873bbe6" as="p" variant="body" tone="muted">内容、人才与成果，持续支持下一轮教学</Typography>
    </div>
    <div shuku-edit-id="e-ba48da7c-d2fb-4428-a4d7-76414ac88649" className="aipe-ecosystem-participants">
      {participants.map(({ Icon, title, contribution }) => <div shuku-edit-id="e-fcb58d4f-31dd-4ba8-a93b-d10cc2b79f64" key={title}>
        <Icon aria-hidden="true" strokeWidth={1.7}/>
        <Typography shuku-edit-id="e-14670e9e-2bd0-4106-98aa-eb9a479e3248" as="p" variant="body" tone="accent"><strong shuku-edit-id="e-a369403f-aa2e-4892-8e62-a2da3d57372e">{title}：</strong>{contribution}</Typography>
      </div>)}
    </div>
  </ContentBlock>;
}

