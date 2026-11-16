import { Typography } from "@shuku/course-style/react";
import { KnowledgeIcebergScene } from '../components/KnowledgeIcebergScene';
import './EducationPathsPage.css';

export function EducationPathsPage() {
  return <article shuku-edit-id="e-34e790d0-1002-422a-b6ac-396cad4926a9" className="cg-education-page cg-creator-typography" aria-labelledby="cg-education-title">
    <header shuku-edit-id="e-4ff2d84d-8fa6-482e-b92a-f846261a6fe7" className="cg-education-header">
      <Typography shuku-edit-id="e-e4634d94-5346-4996-bdcb-2f4fa33cf3a4" as="h1" id="cg-education-title" variant="display" tone="inherit" align="center">面对陌生的知识，我们通常怎么学？</Typography>
    </header>
    <KnowledgeIcebergScene />
    <footer shuku-edit-id="e-bc2f5aca-68d4-463c-85f3-92fd3a2eb128" className="cg-education-question">
      <Typography shuku-edit-id="e-f7cf4eec-30fd-4cfc-ae24-06f129c989a3" variant="h2" tone="inherit" align="center">能否更容易地开始，又能逐步走向深入？</Typography>
    </footer>
  </article>;
}
