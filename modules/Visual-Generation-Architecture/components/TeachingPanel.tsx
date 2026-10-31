import type { ReactNode } from 'react';
import { Typography } from '../../shared/react/typography/Typography';

/** Course-specific composition following Value-Based-RL's teaching workspaces. */
export function TeachingPanel({ title, aside, children, className = '' }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`vga-teaching-panel ${className}`} aria-label={title}>
    <header className="vga-teaching-panel__head"><Typography as="h2" variant="h3" tone="inherit">{title}</Typography>{aside && <div className="vga-panel-aside">{aside}</div>}</header>
    <div className="vga-teaching-panel__body">{children}</div>
  </section>;
}

export function LessonSplit({ children, equal = false, className = '' }: { children: ReactNode; equal?: boolean; className?: string }) {
  return <div className={`vga-lesson-split${equal ? ' is-equal' : ''} ${className}`}>{children}</div>;
}
