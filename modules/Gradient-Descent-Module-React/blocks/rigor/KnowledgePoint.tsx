import type { ReactNode } from 'react';
import { Typography } from '../../../shared/react/typography/Typography';

interface KnowledgePointProps {
  ariaLabel: string;
  title: ReactNode;
  children: ReactNode;
  caption?: ReactNode;
}

export function KnowledgePoint({ ariaLabel, title, children, caption }: KnowledgePointProps) {
  return (
    <section className="gd-react-interaction-insight" aria-label={ariaLabel}>
      <Typography as="h3" variant="h3" tone="accent">{title}</Typography>
      <Typography variant="bodySmall">{children}</Typography>
      {caption && <Typography variant="bodySmall" tone="muted">{caption}</Typography>}
    </section>
  );
}
