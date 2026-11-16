import { Typography } from "@shuku/course-style/react";
import { KnowledgeIcebergScene } from '../components/KnowledgeIcebergScene';
import './EducationPathsPage.css';

export function EducationPathsPage() {
  return <article shuku-edit-id="e-9e007ebe-10dc-41ad-b37c-5e967b6bc1ea" className="cg-education-page cg-creator-typography" aria-labelledby="cg-education-title">
    <header shuku-edit-id="e-8baec92a-b7fe-48b5-87db-da8738e4e1f0" className="cg-education-header">
      <Typography shuku-edit-id="e-2cf358f4-04fc-46d6-835d-0b39c34ae9e6" as="h1" id="cg-education-title" variant="display" tone="inherit" align="center">面对陌生的知识，我们通常怎么学？</Typography>
    </header>
    <KnowledgeIcebergScene />
    <footer shuku-edit-id="e-cd85a2e8-f209-4617-a534-b84949e9d8a0" className="cg-education-question">
      <Typography shuku-edit-id="e-7a827a05-a947-41b6-b827-cfa2934655a5" variant="h2" tone="inherit" align="center">能否更容易地开始，又能逐步走向深入？</Typography>
    </footer>
  </article>;
}
