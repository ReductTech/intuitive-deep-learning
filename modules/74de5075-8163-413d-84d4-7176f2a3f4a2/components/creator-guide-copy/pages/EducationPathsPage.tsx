import { Typography } from "@shuku/course-style/react";
import { KnowledgeIcebergScene } from '../components/KnowledgeIcebergScene';
import './EducationPathsPage.css';

export function EducationPathsPage() {
  return <article shuku-edit-id="e-495d07be-aba2-49c8-bb7c-ae1a35680ca9" className="aipe-replay-cg-education-page aipe-replay-cg-creator-typography" aria-labelledby="aipe-replay-cg-education-title">
    <header shuku-edit-id="e-9370177a-4653-47dd-860b-5d689efc1564" className="aipe-replay-cg-education-header">
      <Typography shuku-edit-id="e-077336fe-15c2-41c5-9ceb-4fab5e1348b7" as="h1" id="aipe-replay-cg-education-title" variant="display" tone="inherit" align="center">面对陌生的知识，我们通常怎么学？</Typography>
    </header>
    <KnowledgeIcebergScene />
    <footer shuku-edit-id="e-2c3d22d2-865d-46bb-8931-4ed6414daf1b" className="aipe-replay-cg-education-question">
      <Typography shuku-edit-id="e-7422f10e-0611-4568-b479-40e97a3af91e" variant="h2" tone="inherit" align="center">能否更容易地开始，又能逐步走向深入？</Typography>
    </footer>
  </article>;
}
