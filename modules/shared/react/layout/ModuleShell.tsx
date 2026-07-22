import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from '../utils';

export interface ModuleShellProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  header?: ReactNode;
  headerClassName?: string;
  progress?: ReactNode;
  shellClassName?: string;
}

export function ModuleShell({
  title,
  subtitle,
  badge,
  header,
  headerClassName,
  progress,
  shellClassName,
  className,
  children,
  ...props
}: ModuleShellProps) {
  const hasHeader = header !== undefined || title !== undefined || subtitle !== undefined || badge !== undefined;

  return (
    <main className={classNames('edu-root', className)} {...props}>
      <section className={classNames('edu-shell', shellClassName)}>
        {hasHeader && (
          <header className={classNames('edu-header', headerClassName)}>
            {header ?? (
              <>
                <div>
                  {title !== undefined && <h1 className="edu-title">{title}</h1>}
                  {subtitle !== undefined && <p className="edu-subtitle">{subtitle}</p>}
                </div>
                {badge !== undefined && <span className="edu-badge">{badge}</span>}
              </>
            )}
          </header>
        )}
        {progress}
        {children}
      </section>
    </main>
  );
}
