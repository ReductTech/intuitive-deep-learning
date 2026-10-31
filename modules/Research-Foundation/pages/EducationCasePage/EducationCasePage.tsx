import { Typography, moduleAssetUrl } from '../../../shared/react';
import { ResearchAppPhone } from '../../../AI-Practice-Education/pages/ResearchRecommendationAppPage/ResearchAppPhone';
import outline from '../../outlines.json';
import './EducationCasePage.css';

export function EducationCasePage() {
 return <section className="rf-page rf-case" aria-label="研究基础五：典型案例与新芽培养实践">
  <header className="rf-case-heading">
   <Typography variant="bodySmall" className="rf-case-eyebrow">研究基础五 · 教育实践基础</Typography>
   <Typography as="h1" variant="h1">个人智能体重构人才培养范式</Typography>
   <Typography variant="subtitle">入选2026年天津市“人工智能＋研究生教育”典型案例</Typography>
  </header>
  <figure className="rf-case-document">
   <figcaption><Typography variant="bodySmall">典型案例名单</Typography><Typography variant="bodySmall">南开大学 · 程明明</Typography></figcaption>
   <div className="rf-case-document-image"><img src={moduleAssetUrl(outline.moduleIdentity.id, 'evidence/education-case-list-2026.png')} alt="2026年天津市人工智能加研究生教育典型案例名单：首项为南开大学个人智能体重构人才培养范式，负责人程明明"/><span className="rf-case-first-row" aria-hidden="true"/></div>
  </figure>
  <Typography variant="body" className="rf-case-phone-label">新芽计划 · 学习与培养</Typography>
  <div className="rf-case-phone-host" aria-label="与平台展示共用的移动端应用，新芽计划入口"><ResearchAppPhone initialEntry="sprout" autoPlaySprout/></div>
 </section>;
}
