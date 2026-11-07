import { useId } from 'react';
import { Building2, FlaskConical, GraduationCap } from 'lucide-react';
import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
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
  return <ContentBlock title="连接教学、科研、人才与产业" headingLevel={1}
    className="aipe-ecosystem-page" bodyClassName="aipe-ecosystem-body">
    <div className="aipe-ecosystem-headings">
      {stages.map(stage => <div key={stage.title}>
        <Typography as="h2" variant="h3" tone="accent">{stage.title}</Typography>
        <span aria-hidden="true" />
      </div>)}
    </div>
    <img className="aipe-ecosystem-panorama"
      src={moduleAssetUrl(outline.moduleIdentity.id, 'images/closing-preview/education-ecosystem-panorama-v3.png')}
      alt="同一大学教学研究空间中的连续长图：师生共同改进学习资料，指导学生实践，并与研究伙伴讨论成果。"
      draggable={false}/>
    <div className="aipe-ecosystem-outcomes">
      {stages.map(stage => <Typography as="p" key={stage.title} variant="h3" tone="accent">{stage.outcome}</Typography>)}
    </div>
    <div className="aipe-ecosystem-feedback">
      <svg viewBox="0 0 1540 90" preserveAspectRatio="none" aria-hidden="true">
        <defs><marker id={arrowId} viewBox="0 0 12 12" refX="10" refY="6" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L12 6L0 12Z" fill="#80a9d7"/></marker></defs>
        <path d="M1450 10C1170 105 390 105 95 14" fill="none" stroke="#a8c9eb" strokeWidth="10" strokeLinecap="round" markerEnd={`url(#${arrowId})`}/>
      </svg>
      <Typography as="p" variant="body" tone="muted">内容、人才与成果，持续支持下一轮教学</Typography>
    </div>
    <div className="aipe-ecosystem-participants">
      {participants.map(({ Icon, title, contribution }) => <div key={title}>
        <Icon aria-hidden="true" strokeWidth={1.7}/>
        <Typography as="p" variant="body" tone="accent"><strong>{title}：</strong>{contribution}</Typography>
      </div>)}
    </div>
  </ContentBlock>;
}

