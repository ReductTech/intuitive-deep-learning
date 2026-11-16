import outline from '../../outlines.json';
import { Typography } from "@shuku/course-style/react";
import { KnowledgeIcebergScene } from './KnowledgeIcebergScene';
import './EducationPathsPage.css';

export function EducationPathsPage() {
  return <article shuku-edit-id="e-d429cf04-de7b-4dc4-9048-6f9fbe959250" className="llmpe-cg-education-page llmpe-cg-creator-typography" aria-labelledby="llmpe-cg-education-title">
    <header shuku-edit-id="e-8491ad9e-f741-488c-82ea-34c16686fe5c" className="llmpe-cg-education-header">
      <Typography shuku-edit-id="e-b63e1f91-f214-4a54-9400-47783da1854b" as="h1" id="llmpe-cg-education-title" variant="display" tone="inherit" align="center">{outline.pages.find(page => page.id === '74f59148-64d5-4754-9993-77aa06a25e3c')!.title}</Typography>
    </header>
    <KnowledgeIcebergScene />
    <footer shuku-edit-id="e-7615868c-cd18-47f9-9169-54aa7a85b4e3" className="llmpe-cg-education-question">
      <Typography shuku-edit-id="e-750e0797-1004-45bb-9ea6-3e46bd2cfe05" variant="h2" tone="inherit" align="center">能否更容易地开始，又能逐步走向深入？</Typography>
    </footer>
  </article>;
}
