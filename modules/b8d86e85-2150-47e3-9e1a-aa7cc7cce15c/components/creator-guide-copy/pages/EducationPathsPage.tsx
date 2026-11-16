import { Typography } from "@shuku/course-style/react";
import { KnowledgeIcebergScene } from '../components/KnowledgeIcebergScene';
import './EducationPathsPage.css';

export function EducationPathsPage() {
  return <article shuku-edit-id="e-3113c3d9-99dc-4892-8eff-865918fd9f0c" className="aipe-replay-cg-education-page aipe-replay-cg-creator-typography" aria-labelledby="aipe-replay-cg-education-title">
    <header shuku-edit-id="e-2e86ca5a-c7e9-49e9-8e79-746d7b7aef92" className="aipe-replay-cg-education-header">
      <Typography shuku-edit-id="e-387eda6d-6e87-4d43-b332-ad3129cc840c" as="h1" id="aipe-replay-cg-education-title" variant="display" tone="inherit" align="center">面对陌生的知识，我们通常怎么学？</Typography>
    </header>
    <KnowledgeIcebergScene />
    <footer shuku-edit-id="e-5f5412c0-de0b-48e3-8a84-22104ef2a1d7" className="aipe-replay-cg-education-question">
      <Typography shuku-edit-id="e-8822b5c8-1786-4e3f-8fa1-8bf80552b0d0" variant="h2" tone="inherit" align="center">能否更容易地开始，又能逐步走向深入？</Typography>
    </footer>
  </article>;
}
