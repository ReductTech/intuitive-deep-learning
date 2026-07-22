import type { HTMLAttributes, ReactNode } from 'react';
import type { FeedbackTone } from './Callout';
import { classNames } from '../utils';

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
      {lead !== undefined && <strong>{lead}</strong>}
      {lead !== undefined && children !== undefined ? ' ' : null}
      {children}
    </div>
  );
}
