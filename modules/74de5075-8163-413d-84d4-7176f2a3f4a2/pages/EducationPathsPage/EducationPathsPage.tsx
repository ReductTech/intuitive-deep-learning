import outline from '../../outlines.json';
import { Typography } from "@shuku/course-style/react";
import { KnowledgeIcebergScene } from './KnowledgeIcebergScene';
import './EducationPathsPage.css';

export function EducationPathsPage() {
  return <article shuku-edit-id="e-9a4e3d13-dd16-4ff4-8d7f-26f52d38d170" className="llmpe-cg-education-page llmpe-cg-creator-typography" aria-labelledby="llmpe-cg-education-title">
    <header shuku-edit-id="e-f5f7f0df-878d-4b0d-a2da-fa026650d776" className="llmpe-cg-education-header">
      <Typography shuku-edit-id="e-baf58d9d-efb1-4426-be14-5e8124e4fcba" as="h1" id="llmpe-cg-education-title" variant="display" tone="inherit" align="center">{outline.pages.find(page => page.id === '96d7298c-135c-4ecb-8133-a97eb6c4e659')!.title}</Typography>
    </header>
    <KnowledgeIcebergScene />
    <footer shuku-edit-id="e-3ed0d756-2608-4643-b9b5-13e305edeec5" className="llmpe-cg-education-question">
      <Typography shuku-edit-id="e-439d9768-08b3-4dc2-8554-1b0a7071de6d" variant="h2" tone="inherit" align="center">能否更容易地开始，又能逐步走向深入？</Typography>
    </footer>
  </article>;
}
