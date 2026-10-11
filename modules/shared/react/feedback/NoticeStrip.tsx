import type { HTMLAttributes, ReactNode } from 'react';
import type { FeedbackTone } from './Callout';
import { classNames } from '../utils';
import { Typography } from '../typography/Typography';

export interface NoticeStripProps extends HTMLAttributes<HTMLDivElement> {
  tone?: FeedbackTone;
  lead?: ReactNode;
}

export function NoticeStrip({
  tone = 'blue',
  lead,
  className,
  children,
  ...props
}: NoticeStripProps) {
  return (
    <div className={classNames('edu-notice-strip', `edu-notice-strip--${tone}`, className)} {...props}>
      {lead !== undefined && <Typography as="strong" variant="bodySmall" tone="inherit">{lead}</Typography>}
      {lead !== undefined && children !== undefined ? ' ' : null}
      {children !== undefined && <Typography as="span" variant="bodySmall" tone="inherit">{children}</Typography>}
    </div>
  );
}
