import type { ReactNode } from 'react';
import { Typography } from "@shuku/course-style/react/typography/Typography";

/** Course-specific composition following Value-Based-RL's teaching workspaces. */
export function TeachingPanel({ title, aside, children, className = '' }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return <section shuku-edit-id="e-c458042e-7c4f-46a7-8fed-9ba9ce279815" className={`vga-teaching-panel ${className}`} aria-label={title}>
    <header shuku-edit-id="e-4ef02f37-8017-47eb-8907-23b23bbc0b35" className="vga-teaching-panel__head"><Typography as="h2" variant="h3" tone="inherit">{title}</Typography>{aside && <div shuku-edit-id="e-220a051f-32ba-4dca-9787-d5694f597646" className="vga-panel-aside">{aside}</div>}</header>
    <div shuku-edit-id="e-f57465bf-f9a3-4933-baec-2aef568e9014" className="vga-teaching-panel__body">{children}</div>
  </section>;
}

export function LessonSplit({ children, equal = false, className = '' }: { children: ReactNode; equal?: boolean; className?: string }) {
  return <div shuku-edit-id="e-8bcd8430-32e0-4285-b273-d2d0f1d41a05" className={`vga-lesson-split${equal ? ' is-equal' : ''} ${className}`}>{children}</div>;
}
