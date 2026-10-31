import { Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './EducationCasePage.css';

export function EducationCasePage() {
 return <section className="rf-page rf-case" aria-label="研究基础五：人工智能与研究生教育典型案例">
  <header className="rf-case-heading">
   <Typography variant="bodySmall" className="rf-case-eyebrow">教育实践基础</Typography>
   <Typography variant="subtitle">入选 2026 年天津市<br/>人工智能＋研究生教育典型案例</Typography>
   <Typography as="h1" variant="h1">个人智能体<br/>重构人才培养范式</Typography>
   <span className="rf-case-accent" aria-hidden="true"/>
  </header>
  <figure className="rf-case-document">
   <div className="rf-case-document-image"><img src={moduleAssetUrl(outline.moduleIdentity.id, 'evidence/education-case-list-2026.png')} alt="2026年天津市人工智能加研究生教育典型案例名单：首项为南开大学个人智能体重构人才培养范式，负责人程明明"/><span className="rf-case-first-row" aria-hidden="true"/></div>
  </figure>
 </section>;
}
