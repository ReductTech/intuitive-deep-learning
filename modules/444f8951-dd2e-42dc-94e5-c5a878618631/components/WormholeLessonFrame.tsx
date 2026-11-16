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
  return <svg shuku-edit-id="e-9ddbf6e6-1e74-40db-a93e-c843b5ade8a1" viewBox="-4 -4 40 40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-3db7c274-35bf-4864-a44f-b8f96c44e73a" d={paths[kind]} /></svg>;
}

export function WormholeBenefit({ kind, title, children }: { kind: Parameters<typeof WormholeIcon>[0]['kind']; title: string; children: ReactNode }) {
  return <div shuku-edit-id="e-2f5e076a-c9e0-4378-87bd-d97292321a5e" className="cg-wormhole-benefit"><span shuku-edit-id="e-8cfb9d9d-7ade-403e-901d-e71fef82bb52" className="cg-wormhole-icon"><WormholeIcon kind={kind} /></span><div shuku-edit-id="e-2efee65e-0fb4-4649-9e89-406b107a962e"><Typography shuku-edit-id="e-fe064291-a94b-4ad4-8649-bdd71bb1a43c" as="h3" variant="h3" tone="accent">{title}</Typography><Typography shuku-edit-id="e-aa07b2ed-245c-401f-9ea8-243b826f6c1c" variant="bodySmall" tone="muted">{children}</Typography></div></div>;
}

export function WormholeLessonFrame({ className, title, subtitle, children, sidebar, conclusion }: {
  className: string; title: string; subtitle: string; children: ReactNode; sidebar: ReactNode; conclusion: string;
}) {
  return <ContentBlock shuku-edit-id="e-dc64d34f-5e16-4bf0-914d-0515f68dc789" className={`cg-wormhole-page cg-creator-typography ${className}`} headingLevel={1} title={title} subtitle={subtitle} bodyClassName="cg-wormhole-body">
    <div shuku-edit-id="e-17f57cd7-ed6c-464e-ba7e-c9246b97adcb" className="cg-wormhole-content"><section shuku-edit-id="e-e3219538-3dd9-4e4c-9516-e0192edcf756" className="cg-wormhole-example">{children}</section><aside shuku-edit-id="e-7ab07af1-6c77-4064-8b8d-6a094f1a67ed" className="cg-wormhole-sidebar">{sidebar}</aside></div>
    <div shuku-edit-id="e-fffe22e0-2b9e-4355-ba06-a68d7bde26ac" className="cg-wormhole-conclusion"><Typography shuku-edit-id="e-49e87bd6-e97d-4b4f-b5b8-fb6d3f0e9d3a" variant="body" tone="accent">{conclusion}</Typography></div>
  </ContentBlock>;
}
