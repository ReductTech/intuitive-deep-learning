import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { Typography, type TypographyVariant } from '../typography/Typography';
import { classNames } from '../utils';

export interface ContentBlockProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  headingLevel?: 1 | 2 | 3 | 4;
  headerClassName?: string;
  bodyClassName?: string;
}

const headingVariants: Record<1 | 2 | 3 | 4, TypographyVariant> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h3',
};

export const ContentBlock = forwardRef<HTMLElement, ContentBlockProps>(function ContentBlock({
  title,
  subtitle,
  headingLevel = 2,
  headerClassName,
  bodyClassName,
  className,
  children,
  ...props
}, ref) {
  const Heading = `h${headingLevel}` as const;
  const headingVariant = headingVariants[headingLevel];
  const hasHeader = title !== undefined || subtitle !== undefined;

  return (
    <section className={classNames('edu-content-block', className)} ref={ref} {...props}>
      {hasHeader && (
        <header className={classNames('edu-content-head', headerClassName)}>
          {title !== undefined && <Typography as={Heading} variant={headingVariant} tone="accent" className="edu-content-title">{title}</Typography>}
          {subtitle !== undefined && <Typography variant="subtitle" tone="muted" className="edu-content-subtitle">{subtitle}</Typography>}
        </header>
      )}
      <div className={classNames('edu-content-body', bodyClassName)}>{children}</div>
    </section>
  );
});
