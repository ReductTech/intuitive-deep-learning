import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from '../utils';

export type ValueTileTone = 'orange' | 'blue' | 'success' | 'danger';

export interface ValueTileProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  value: ReactNode;
  tone?: ValueTileTone;
}

export function ValueTile({ label, value, tone, className, ...props }: ValueTileProps) {
  return (
    <div className={classNames('edu-value-tile', tone && `edu-value-tile--${tone}`, className)} {...props}>
      <span className="edu-value-label">{label}</span>
      <output className="edu-value-number" data-i18n-ignore="true">{value}</output>
    </div>
  );
}
