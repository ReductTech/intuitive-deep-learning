import type { ReactNode } from 'react';
import { ContentBlock, Typography } from '../../shared/react';
import outline from '../outlines.json';
import './LessonPage.css';
import { coursePosition } from './coursePosition';

export function LessonPage({ id, subtitle, children, takeaway }: { id: string; subtitle: string; children: ReactNode; takeaway?: ReactNode }) {
  // Keep page-specific detail available to assistive reading as well.
  const page = outline.pages.find(page => page.id === id)!;
  return <ContentBlock className={`daa-lesson${takeaway == null ? ' daa-lesson-no-takeaway' : ''}`} headingLevel={1} title={page.title} subtitle={coursePosition(id)} bodyClassName="daa-lesson-body">
    <div className="daa-lesson-main" aria-label={subtitle}>{children}</div>
    {takeaway != null && <div className="daa-takeaway" aria-live="polite"><Typography variant="body" tone="accent">{takeaway}</Typography></div>}
  </ContentBlock>;
}
