import type { ReactNode } from 'react';
import { ContentBlock } from "@shuku/course-style/react";
import './RefinedStage.css';
export function RefinedStage({ title, subtitle, children, className = '' }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return <div shuku-edit-id="e-f5168d56-9b40-437a-a203-04caffb2e69c" className={`naipf-canvas ${className}`}><ContentBlock shuku-edit-id="e-2d0534c2-3d2a-4de4-b659-abde68eeae7c" headingLevel={1} title={title} subtitle={subtitle} className="naipf-content" bodyClassName="naipf-body">{children}</ContentBlock></div>;
}
