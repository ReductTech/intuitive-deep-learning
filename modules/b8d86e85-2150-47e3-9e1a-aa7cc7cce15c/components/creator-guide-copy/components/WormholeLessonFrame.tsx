import { ContentBlock, Typography } from "@shuku/course-style/react";
import type { ReactNode } from 'react';
import '../pages/WormholePages.css';

export function WormholeIcon({ kind }: { kind: 'light' | 'book' | 'heart' | 'eye' | 'ring' | 'formula' }) {
  const paths = {
    light: 'M11 25c0-4-5-6-5-12a10 10 0 0 1 20 0c0 6-5 8-5 12H11ZM12 29h8M14 33h4',
    book: 'M16 7C10 3 4 4 1 6v24c5-3 10-2 15 1V7ZM16 7c6-4 12-3 15-1v24c-5-3-10-2-15 1V7Z',
    heart: 'M16 30 3 17C-6 5 8-3 16 8c8-11 22-3 13 9Z',
    eye: 'M0 16S6 5 16 5s16 11 16 11-6 11-16 11S0 16 0 16ZM16 10a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z',
    ring: 'M1 14a15 7 0 1 0 30 0 15 7 0 1 0-30 0ZM1 14v5a15 7 0 0 0 30 0v-5M5 14a11 4 0 1 0 22 0 11 4 0 1 0-22 0Z',
    formula: 'M3 3h26v26H3ZM9 11h14M9 21h14M16 7v8M13 18l6 6M19 18l-6 6',
  };
  return <svg shuku-edit-id="e-49d0a1c8-0a1f-4b2f-b925-b1d66179d4f2" viewBox="-4 -4 40 40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-1c3c8a24-5db9-47bf-80fb-1a6ca69e0881" d={paths[kind]} /></svg>;
}

export function WormholeBenefit({ kind, title, children }: { kind: Parameters<typeof WormholeIcon>[0]['kind']; title: string; children: ReactNode }) {
  return <div shuku-edit-id="e-313697bc-1352-4ea3-a659-37904c3d2cc7" className="aipe-replay-cg-wormhole-benefit"><span shuku-edit-id="e-95caf6ac-84d6-4774-a7c3-a86d4a7d290c" className="aipe-replay-cg-wormhole-icon"><WormholeIcon kind={kind} /></span><div shuku-edit-id="e-cc9aee21-62f6-4cc1-961e-d9bce66bd778"><Typography shuku-edit-id="e-98a861c4-9019-4850-b15d-22d2b8c34bf4" as="h3" variant="h3" tone="accent">{title}</Typography><Typography shuku-edit-id="e-dfda10f1-8b46-4fff-bebc-a09f5347c16a" variant="bodySmall" tone="muted">{children}</Typography></div></div>;
}

export function WormholeLessonFrame({ className, title, subtitle, children, sidebar, conclusion }: {
  className: string; title: string; subtitle: string; children: ReactNode; sidebar: ReactNode; conclusion: string;
}) {
  return <ContentBlock shuku-edit-id="e-95b3b476-468e-4498-acb3-fe849346ff17" className={`aipe-replay-cg-wormhole-page aipe-replay-cg-creator-typography ${className}`} headingLevel={1} title={title} subtitle={subtitle} bodyClassName="aipe-replay-cg-wormhole-body">
    <div shuku-edit-id="e-bc6f4a5f-e4f0-44dc-aaaf-9c32b34bb6d9" className="aipe-replay-cg-wormhole-content"><section shuku-edit-id="e-4e04a164-746a-4f76-bc68-6fe11f55f124" className="aipe-replay-cg-wormhole-example">{children}</section><aside shuku-edit-id="e-8b6c6ffc-2482-41a2-90ec-2565ca3b92e4" className="aipe-replay-cg-wormhole-sidebar">{sidebar}</aside></div>
    <div shuku-edit-id="e-248f7ba8-0912-414f-8dec-1312bf7d373f" className="aipe-replay-cg-wormhole-conclusion"><Typography shuku-edit-id="e-4bd84c49-37b1-42ce-86f5-1034904d60e6" variant="body" tone="accent">{conclusion}</Typography></div>
  </ContentBlock>;
}
