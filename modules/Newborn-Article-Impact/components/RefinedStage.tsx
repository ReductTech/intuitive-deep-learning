import type { ReactNode } from 'react';
import { ContentBlock } from '../../shared/react';
import './RefinedStage.css';
export function RefinedStage({ title, subtitle, children, className = '' }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return <div className={`naipf-canvas ${className}`}><ContentBlock headingLevel={1} title={title} subtitle={subtitle} className="naipf-content" bodyClassName="naipf-body">{children}</ContentBlock></div>;
}
