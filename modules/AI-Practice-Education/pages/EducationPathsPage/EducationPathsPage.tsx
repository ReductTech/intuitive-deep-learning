import outline from '../../outlines.json';
import { Typography } from '../../../shared/react';
import { KnowledgeIcebergScene } from './KnowledgeIcebergScene';
import './EducationPathsPage.css';

export function EducationPathsPage() {
  return <article className="llmpe-cg-education-page llmpe-cg-creator-typography" aria-labelledby="llmpe-cg-education-title">
    <header className="llmpe-cg-education-header">
      <Typography as="h1" id="llmpe-cg-education-title" variant="display" tone="inherit" align="center">{outline.pages[10].title}</Typography>
    </header>
    <KnowledgeIcebergScene />
    <footer className="llmpe-cg-education-question">
      <Typography variant="h2" tone="inherit" align="center">能否更容易地开始，又能逐步走向深入？</Typography>
    </footer>
  </article>;
}
