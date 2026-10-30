import { Typography } from '../../shared/react';
import { KnowledgeIcebergScene } from '../components/KnowledgeIcebergScene';
import './EducationPathsPage.css';

export function EducationPathsPage() {
  return <article className="cg-education-page cg-creator-typography" aria-labelledby="cg-education-title">
    <header className="cg-education-header">
      <Typography as="h1" id="cg-education-title" variant="display" tone="inherit" align="center">面对陌生的知识，我们通常怎么学？</Typography>
    </header>
    <KnowledgeIcebergScene />
    <footer className="cg-education-question">
      <Typography variant="h2" tone="inherit" align="center">能否更容易地开始，又能逐步走向深入？</Typography>
    </footer>
  </article>;
}
