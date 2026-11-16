import { ContentBlock, Typography } from "@shuku/course-style/react";
import type { ReactNode } from 'react';
import './WormholePages.css';

export function WormholeIcon({ kind }: { kind: 'light' | 'book' | 'heart' | 'eye' | 'ring' | 'formula' }) {
  const paths = {
    light: 'M11 25c0-4-5-6-5-12a10 10 0 0 1 20 0c0 6-5 8-5 12H11ZM12 29h8M14 33h4',
    book: 'M16 7C10 3 4 4 1 6v24c5-3 10-2 15 1V7ZM16 7c6-4 12-3 15-1v24c-5-3-10-2-15 1V7Z',
    heart: 'M16 30 3 17C-6 5 8-3 16 8c8-11 22-3 13 9Z',
    eye: 'M0 16S6 5 16 5s16 11 16 11-6 11-16 11S0 16 0 16ZM16 10a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z',
    ring: 'M1 14a15 7 0 1 0 30 0 15 7 0 1 0-30 0ZM1 14v5a15 7 0 0 0 30 0v-5M5 14a11 4 0 1 0 22 0 11 4 0 1 0-22 0Z',
    formula: 'M3 3h26v26H3ZM9 11h14M9 21h14M16 7v8M13 18l6 6M19 18l-6 6',
  };
  return <svg shuku-edit-id="e-3426877b-8977-4e34-8f7e-822ba121b52f" viewBox="-4 -4 40 40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-789d1c39-49ad-47da-a778-405d0eb3a34d" d={paths[kind]} /></svg>;
}

export function WormholeBenefit({ kind, title, children }: { kind: Parameters<typeof WormholeIcon>[0]['kind']; title: string; children: ReactNode }) {
  return <div shuku-edit-id="e-ea649f19-25e8-4f8d-97f4-41f713077429" className="llmpe-cg-wormhole-benefit"><span shuku-edit-id="e-15236a1c-44ac-41b2-96ef-703008fea285" className="llmpe-cg-wormhole-icon"><WormholeIcon kind={kind} /></span><div shuku-edit-id="e-7a540942-d4e5-4a90-9da6-a74dd4a2f296"><Typography shuku-edit-id="e-e1f0e19f-e6ec-4f5b-a749-971758aff5b9" as="h3" variant="h3" tone="accent">{title}</Typography><Typography shuku-edit-id="e-192a9511-d518-4948-a68f-29f257a2398f" variant="bodySmall" tone="muted">{children}</Typography></div></div>;
}

export function WormholeLessonFrame({ className, title, subtitle, children, sidebar, conclusion }: {
  className: string; title: string; subtitle: string; children: ReactNode; sidebar: ReactNode; conclusion: string;
}) {
  return <ContentBlock shuku-edit-id="e-9f202c58-12e1-4700-9d85-6932353b1e9f" className={`llmpe-cg-wormhole-page llmpe-cg-creator-typography ${className}`} headingLevel={1} title={title} subtitle={subtitle} bodyClassName="llmpe-cg-wormhole-body">
    <div shuku-edit-id="e-07687b66-bd91-4aad-bcc7-0c465fd4c6dd" className="llmpe-cg-wormhole-content"><section shuku-edit-id="e-5c2393bd-e994-4912-8202-5d485f0ef202" className="llmpe-cg-wormhole-example">{children}</section><aside shuku-edit-id="e-36c871e4-59db-4909-ba8e-474f1538d859" className="llmpe-cg-wormhole-sidebar">{sidebar}</aside></div>
    <div shuku-edit-id="e-59441666-9535-49ae-9d14-dbbce8292beb" className="llmpe-cg-wormhole-conclusion"><Typography shuku-edit-id="e-106eef76-8e38-4303-a715-2053ff083ef0" variant="body" tone="accent">{conclusion}</Typography></div>
  </ContentBlock>;
}
