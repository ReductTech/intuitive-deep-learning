import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { classNames } from '../utils';

export type LessonStageVariant = 'default' | 'flat' | 'featured';

export interface LessonStageProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  kicker?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  variant?: LessonStageVariant;
  locked?: boolean;
  revealing?: boolean;
  headingLevel?: 2 | 3 | 4;
  bodyClassName?: string;
}

export const LessonStage = forwardRef<HTMLElement, LessonStageProps>(function LessonStage({
  kicker,
  title,
  description,
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
  const hasHeader = kicker !== undefined || title !== undefined || description !== undefined || actions !== undefined;

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
            {kicker !== undefined && <span className="edu-kicker">{kicker}</span>}
            {title !== undefined && <Heading className="edu-stage-title">{title}</Heading>}
            {description !== undefined && <p className="edu-stage-description">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
});
