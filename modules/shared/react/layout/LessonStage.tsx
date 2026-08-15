import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { Typography, type TypographyVariant } from '../typography/Typography';
import { classNames } from '../utils';

export type LessonStageVariant = 'default' | 'flat' | 'featured';

export interface LessonStageProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  descriptionVariant?: TypographyVariant;
  actions?: ReactNode;
  variant?: LessonStageVariant;
  locked?: boolean;
  revealing?: boolean;
  headingLevel?: 2 | 3 | 4;
  bodyClassName?: string;
}

export const LessonStage = forwardRef<HTMLElement, LessonStageProps>(function LessonStage({
  title,
  description,
  descriptionVariant = 'bodySmall',
  actions,
  variant = 'default',
  locked = false,
  revealing = false,
  headingLevel = 2,
  bodyClassName,
  className,
  children,
  ...props
}, ref) {
  const Heading = `h${headingLevel}` as const;
  const headingVariant: TypographyVariant = headingLevel === 2 ? 'h2' : 'h3';
  const hasHeader = title !== undefined || description !== undefined || actions !== undefined;

  return (
    <section
      className={classNames(
        'edu-stage',
        variant !== 'default' && `edu-stage--${variant}`,
        locked && 'is-locked',
        revealing && 'is-revealing',
        className,
      )}
      aria-disabled={locked || undefined}
      ref={ref}
      {...props}
    >
      {hasHeader && (
        <header className="edu-stage-head">
          <div className="edu-stage-copy">
            {title !== undefined && <Typography as={Heading} variant={headingVariant} tone="accent" className="edu-stage-title">{title}</Typography>}
            {description !== undefined && <Typography variant={descriptionVariant} tone="muted" className="edu-stage-description">{description}</Typography>}
          </div>
          {actions}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
});
