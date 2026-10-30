import type { HTMLAttributes, ReactNode } from 'react';
import { Typography } from '../../shared/react/typography/Typography';

interface LessonStageProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  kicker?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
}

/** Compatibility frame for the migrated Transformer lesson blocks. */
export function LessonStage({ kicker, title, description, className = '', children, ...props }: LessonStageProps) {
  return <section className={`edu-stage ${className}`} {...props}>
    <header className="edu-stage-head">
      {kicker && <Typography variant="bodySmall" tone="muted">{kicker}</Typography>}
      {title && <Typography as="h2" variant="h2" className="edu-stage-title">{title}</Typography>}
      {description && <Typography variant="subtitle" tone="muted">{description}</Typography>}
    </header>
    <div className="edu-stage-body">{children}</div>
  </section>;
}
