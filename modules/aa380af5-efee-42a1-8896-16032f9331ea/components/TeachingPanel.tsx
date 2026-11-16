import type { ReactNode } from 'react';
import { Typography } from "@shuku/course-style/react";
import './TeachingPanel.css';

export function TeachingHeading({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return <header shuku-edit-id="e-ed011b37-75b7-4659-bf26-bb973cca88d7" className="vbrl-teaching-heading"><Typography shuku-edit-id="e-ec8aaa07-218d-489a-a55a-ef4995351fd7" as="h2" variant="h3" tone="inherit">{children}</Typography>
    {aside && <div shuku-edit-id="e-e26338a0-4a12-4e93-9445-f5362528ad29" className="vbrl-teaching-heading__aside">{aside}</div>}</header>;
}

export function TeachingPanel({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return <section shuku-edit-id="e-c45e18c4-4055-4b91-bb85-170d534d781c" className={'vbrl-teaching-panel ' + className} aria-label={title}>
    <header shuku-edit-id="e-d93e665f-9366-4678-8628-c33f38c43991" className="vbrl-teaching-panel__head"><Typography shuku-edit-id="e-b458661b-8994-4fd8-867d-820b35989037" as="h2" variant="h3" tone="inherit">{title}</Typography></header>
    <div shuku-edit-id="e-9fdb1e0a-041b-410b-b993-a88ee66e3209" className="vbrl-teaching-panel__body">{children}</div>
  </section>;
}
