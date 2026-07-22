import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from '../utils';

export interface ContentBlockProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  headerClassName?: string;
  bodyClassName?: string;
}

export function ContentBlock({
  title,
  subtitle,
  headingLevel = 2,
  headerClassName,
  bodyClassName,
  className,
  children,
  ...props
}: ContentBlockProps) {
  const Heading = `h${headingLevel}` as const;
  const hasHeader = title !== undefined || subtitle !== undefined;

  return (
    <section className={classNames('edu-content-block', className)} {...props}>
      {hasHeader && (
        <header className={classNames('edu-content-head', headerClassName)}>
          {title !== undefined && <Heading className="edu-content-title">{title}</Heading>}
          {subtitle !== undefined && <p className="edu-content-subtitle">{subtitle}</p>}
        </header>
      )}
      <div className={classNames('edu-content-body', bodyClassName)}>{children}</div>
    </section>
  );
}
