import { ContentBlock, Typography } from '../../../../shared/react';
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
  return <svg viewBox="-4 -4 40 40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]} /></svg>;
}

export function WormholeBenefit({ kind, title, children }: { kind: Parameters<typeof WormholeIcon>[0]['kind']; title: string; children: ReactNode }) {
  return <div className="aipe-replay-cg-wormhole-benefit"><span className="aipe-replay-cg-wormhole-icon"><WormholeIcon kind={kind} /></span><div><Typography as="h3" variant="h3" tone="accent">{title}</Typography><Typography variant="bodySmall" tone="muted">{children}</Typography></div></div>;
}

export function WormholeLessonFrame({ className, title, subtitle, children, sidebar, conclusion }: {
  className: string; title: string; subtitle: string; children: ReactNode; sidebar: ReactNode; conclusion: string;
}) {
  return <ContentBlock className={`aipe-replay-cg-wormhole-page aipe-replay-cg-creator-typography ${className}`} headingLevel={1} title={title} subtitle={subtitle} bodyClassName="aipe-replay-cg-wormhole-body">
    <div className="aipe-replay-cg-wormhole-content"><section className="aipe-replay-cg-wormhole-example">{children}</section><aside className="aipe-replay-cg-wormhole-sidebar">{sidebar}</aside></div>
    <div className="aipe-replay-cg-wormhole-conclusion"><Typography variant="body" tone="accent">{conclusion}</Typography></div>
  </ContentBlock>;
}
