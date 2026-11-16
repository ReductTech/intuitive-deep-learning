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
  return <svg shuku-edit-id="e-950b4895-69e6-4369-ae1a-2e43328c96c1" viewBox="-4 -4 40 40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path shuku-edit-id="e-544cd6d9-5b9a-49c6-9dc5-2cf9b97ebd95" d={paths[kind]} /></svg>;
}

export function WormholeBenefit({ kind, title, children }: { kind: Parameters<typeof WormholeIcon>[0]['kind']; title: string; children: ReactNode }) {
  return <div shuku-edit-id="e-b971815c-f176-4d46-b676-bde59f67d6a1" className="llmpe-cg-wormhole-benefit"><span shuku-edit-id="e-21476b0e-e51c-4ce5-80d0-12d9c63f4602" className="llmpe-cg-wormhole-icon"><WormholeIcon kind={kind} /></span><div shuku-edit-id="e-a46acbc1-909a-4737-ba76-1ec1b0a86432"><Typography shuku-edit-id="e-135beb14-1be7-4f31-8e25-3b1e1e4b195f" as="h3" variant="h3" tone="accent">{title}</Typography><Typography shuku-edit-id="e-4d0275b2-8395-47fc-bc46-6e365b8064da" variant="bodySmall" tone="muted">{children}</Typography></div></div>;
}

export function WormholeLessonFrame({ className, title, subtitle, children, sidebar, conclusion }: {
  className: string; title: string; subtitle: string; children: ReactNode; sidebar: ReactNode; conclusion: string;
}) {
  return <ContentBlock shuku-edit-id="e-bb395330-69c9-49d8-8700-700488fff4ed" className={`llmpe-cg-wormhole-page llmpe-cg-creator-typography ${className}`} headingLevel={1} title={title} subtitle={subtitle} bodyClassName="llmpe-cg-wormhole-body">
    <div shuku-edit-id="e-d711ac3d-9947-42b0-9f6c-89a682982069" className="llmpe-cg-wormhole-content"><section shuku-edit-id="e-1b993c86-3e2f-4993-ba6f-64752e62ef68" className="llmpe-cg-wormhole-example">{children}</section><aside shuku-edit-id="e-5e6b53b6-dcff-4289-848b-1732d3f80aa6" className="llmpe-cg-wormhole-sidebar">{sidebar}</aside></div>
    <div shuku-edit-id="e-d1222396-315d-46ac-b8f8-c7e5dd01b44d" className="llmpe-cg-wormhole-conclusion"><Typography shuku-edit-id="e-588539cb-d22b-4a2d-8915-57e0ba0b3aa1" variant="body" tone="accent">{conclusion}</Typography></div>
  </ContentBlock>;
}
