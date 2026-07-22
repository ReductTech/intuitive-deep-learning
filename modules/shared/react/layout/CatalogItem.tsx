import type { ReactNode } from 'react';
import { classNames } from '../utils';

export type CatalogItemVariant = 'foundation' | 'button' | 'control' | 'visual';

export interface CatalogItemProps {
  title: ReactNode;
  description?: ReactNode;
  variant?: CatalogItemVariant;
  className?: string;
  children: ReactNode;
}

export function CatalogItem({
  title,
  description,
  variant = 'foundation',
  className,
  children,
}: CatalogItemProps) {
  if (variant === 'button' || variant === 'control') {
    return (
      <article className={classNames(`${variant}-entry`, className)}>
        <div className={`${variant}-preview`}>{children}</div>
        <div className={`${variant}-copy`}>
          <h3>{title}</h3>
          {description !== undefined && <p>{description}</p>}
        </div>
      </article>
    );
  }

  const visual = variant === 'visual';
  return (
    <article className={classNames(visual ? 'visual-entry' : 'foundation-entry', className)}>
      <header className={visual ? 'visual-entry-head' : 'foundation-entry-head'}>
        <h3>{title}</h3>
        {description !== undefined && <p>{description}</p>}
      </header>
      {children}
    </article>
  );
}
