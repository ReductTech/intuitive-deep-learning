import type { ReactNode } from 'react';
import { Typography } from '../../shared/react';
import './TeachingPanel.css';

export function TeachingHeading({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return <header className="vbrl-teaching-heading"><Typography as="h2" variant="h3" tone="inherit">{children}</Typography>
    {aside && <div className="vbrl-teaching-heading__aside">{aside}</div>}</header>;
}

export function TeachingPanel({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return <section className={'vbrl-teaching-panel ' + className} aria-label={title}>
    <header className="vbrl-teaching-panel__head"><Typography as="h2" variant="h3" tone="inherit">{title}</Typography></header>
    <div className="vbrl-teaching-panel__body">{children}</div>
  </section>;
}
