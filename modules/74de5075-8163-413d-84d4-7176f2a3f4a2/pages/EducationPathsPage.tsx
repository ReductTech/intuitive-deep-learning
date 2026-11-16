import { Typography } from "@shuku/course-style/react";
import { KnowledgeIcebergScene } from '../components/KnowledgeIcebergScene';
import './EducationPathsPage.css';

export function EducationPathsPage() {
  return <article shuku-edit-id="e-c66be12d-6a27-490f-9896-cad2612580e3" className="cg-education-page cg-creator-typography" aria-labelledby="cg-education-title">
    <header shuku-edit-id="e-83c7f9ba-97f7-4e17-803c-91990366986e" className="cg-education-header">
      <Typography shuku-edit-id="e-75dfbfb7-ceae-4ebb-ad3d-f8cd744c6dd6" as="h1" id="cg-education-title" variant="display" tone="inherit" align="center">面对陌生的知识，我们通常怎么学？</Typography>
    </header>
    <KnowledgeIcebergScene />
    <footer shuku-edit-id="e-e2f002c4-36f6-4941-ba56-6a2c41b2942e" className="cg-education-question">
      <Typography shuku-edit-id="e-23ec47e9-6e4f-45d1-8f3c-7ec9bd828d9f" variant="h2" tone="inherit" align="center">能否更容易地开始，又能逐步走向深入？</Typography>
    </footer>
  </article>;
}
