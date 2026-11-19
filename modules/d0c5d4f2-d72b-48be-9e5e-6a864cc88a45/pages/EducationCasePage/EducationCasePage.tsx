import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './EducationCasePage.css';

export function EducationCasePage() {
 return <section shuku-edit-id="e-a32c678a-3e5a-4c41-bff4-d9fd0d2966ef" className="rf-page rf-case" aria-label="研究基础五：人工智能与研究生教育典型案例">
  <header shuku-edit-id="e-b983f213-b0ba-4cc6-afb3-6065f3dfcd8b" className="rf-case-heading">
   <Typography shuku-edit-id="e-bfb97898-a2cb-4240-9708-887fadb57b2e" variant="bodySmall" className="rf-case-eyebrow">教育实践基础</Typography>
   <Typography shuku-edit-id="e-b490b3a9-e3d7-40e8-90ac-eb8ca35c6857" variant="subtitle">入选 2026 年天津市<br shuku-edit-id="e-e75d853a-ce40-464e-aed9-5bec667e488f"/>人工智能＋研究生教育典型案例</Typography>
   <Typography shuku-edit-id="e-3e917d07-9d4c-4f6f-800b-f2e61445cd61" as="h1" variant="h1">个人智能体<br shuku-edit-id="e-7a916782-db36-4a25-b65b-86ffa3403eba"/>重构人才培养范式</Typography>
   <span shuku-edit-id="e-b293242d-9f15-46de-acce-4f79654ac2f4" className="rf-case-accent" aria-hidden="true"/>
  </header>
  <figure shuku-edit-id="e-482c2977-0e04-4808-9125-aa2e154405ba" className="rf-case-document">
   <div shuku-edit-id="e-b52d8ae0-d63c-40be-8d5d-a11a594298a9" className="rf-case-document-image"><img shuku-edit-id="e-cdd26939-d0ac-440d-883f-5f22442e570c" src={moduleAssetUrl("evidence/education-case-list-2026.webp")} alt="2026年天津市人工智能加研究生教育典型案例名单：首项为南开大学个人智能体重构人才培养范式，负责人程明明"/><span shuku-edit-id="e-2fb1c417-dd04-4f26-9a05-24987c0c38d2" className="rf-case-first-row" aria-hidden="true"/></div>
  </figure>
 </section>;
}
