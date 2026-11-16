import type { HTMLAttributes, ReactNode } from 'react';
import { Typography } from "@shuku/course-style/react/typography/Typography";

interface LessonStageProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  kicker?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
}

/** Compatibility frame for the migrated Transformer lesson blocks. */
export function LessonStage({ kicker, title, description, className = '', children, ...props }: LessonStageProps) {
  return <section className={`edu-stage ${className}`} {...props}>
    <header shuku-edit-id="e-3af9c853-4893-49c2-8476-4a847fd2e951" className="edu-stage-head">
      {kicker && <Typography variant="bodySmall" tone="muted">{kicker}</Typography>}
      {title && <Typography as="h2" variant="h2" className="edu-stage-title">{title}</Typography>}
      {description && <Typography variant="subtitle" tone="muted">{description}</Typography>}
    </header>
    <div shuku-edit-id="e-0ae5f469-d247-4b4e-bcd9-25052a68d78f" className="edu-stage-body">{children}</div>
  </section>;
}
