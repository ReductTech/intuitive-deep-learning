import type { ReactNode } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../outlines.json';
import './LessonPage.css';
import { coursePosition } from './coursePosition';

export function LessonPage({ id, subtitle, children, takeaway }: { id: string; subtitle: string; children: ReactNode; takeaway?: ReactNode }) {
  // Keep page-specific detail available to assistive reading as well.
  const page = outline.pages.find(page => page.id === id)!;
  return <ContentBlock shuku-edit-id="e-7be249d8-619f-4869-ae64-1a6d852a8989" className={`daa-lesson${takeaway == null ? ' daa-lesson-no-takeaway' : ''}`} headingLevel={1} title={page.title} subtitle={coursePosition(id)} bodyClassName="daa-lesson-body">
    <div shuku-edit-id="e-a442a15e-c849-443d-9095-b94b16c2b1b6" className="daa-lesson-main" aria-label={subtitle}>{children}</div>
    {takeaway != null && <div shuku-edit-id="e-83b45beb-b6cc-479f-86a4-e8a4c196653a" className="daa-takeaway" aria-live="polite"><Typography shuku-edit-id="e-4588f653-a876-43b4-b3fa-8dbb09785113" variant="body" tone="accent">{takeaway}</Typography></div>}
  </ContentBlock>;
}
