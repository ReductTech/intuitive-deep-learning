import { Typography } from '../../../shared/react';
import './ParameterRange.css';

export const PARAMETER_GROUPS = ['Stem', 'Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', '新分类头'] as const;
export function UpdateStateIcon({ trainable }: { trainable: boolean }) {
  return <svg viewBox="0 0 32 32" aria-hidden="true" className="rtg-parameter-range__state-icon">
    {trainable ? <><path d="M25 13a10 10 0 1 0 0 9M25 5v8h-8" /><path d="M13 12l6 5-6 5" /></>
      : <><path d="M10 14V9a6 6 0 0 1 12 0v5" /><rect x="6" y="14" width="20" height="15" rx="3" /><path d="M16 19v5" /></>}
  </svg>;
}
export interface ParameterRangeProps { trainableFrom: number; compact?: boolean; pending?: boolean; backboneOnly?: boolean; label?: string; }
export function ParameterRange({ trainableFrom, compact = false, pending = false, backboneOnly = false, label = '各层参数更新范围' }: ParameterRangeProps) {
  return <div className={'rtg-parameter-range' + (compact ? ' is-compact' : '') + (pending ? ' is-pending' : '') + (backboneOnly ? ' is-backbone-only' : '')} aria-label={label}>
    {(backboneOnly ? PARAMETER_GROUPS.slice(0, 5) : PARAMETER_GROUPS).map((name, index) => {
      const trainable = !pending && index >= trainableFrom;
      return <div className={'rtg-parameter-range__group' + (trainable ? ' is-trainable' : '')}
        key={name} data-layer-name={name} data-trainable={pending ? undefined : trainable} aria-label={name + '：' + (pending ? '待选择更新范围' : trainable ? '可训练，参数允许更新' : '冻结，参数不更新')}>
        {!compact && <Typography variant="bodySmall" tone="inherit" align="center">{name}</Typography>}
        <svg className="rtg-parameter-range__blocks" viewBox={compact ? '0 0 80 90' : '0 0 170 140'} aria-hidden="true" data-block-count={compact || index === 5 ? 1 : 3}>
          {(compact || index === 5 ? [0] : [0, 1, 2]).map(i => <g key={i} transform={'translate(' + (compact ? 0 : index === 5 ? 40 : i * 40) + ',0)'}>
            <path className="block-top" d={compact ? 'M12 28L34 8H66L44 28Z' : 'M16 42L40 20H64L40 42Z'} />
            <path className="block-side" d={compact ? 'M44 28L66 8V62L44 82Z' : 'M40 42L64 20V97L40 119Z'} />
            <rect className="block-front" x={compact ? 12 : 16} y={compact ? 28 : 42} width={compact ? 32 : 24} height={compact ? 54 : 77} />
          </g>)}
          {!pending && !trainable && !compact && <rect className="block-frozen-outline" x={index === 5 ? 48 : 8} y="12" width={index === 5 ? 64 : 144} height="115" rx="6" />}
        </svg>
        <div className="rtg-parameter-range__status">{!pending && <UpdateStateIcon trainable={trainable} />}
          {!compact && <Typography as="span" variant="bodySmall" tone="inherit">{pending ? '待选' : trainable ? '可训练' : '冻结'}</Typography>}
        </div>
      </div>;
    })}
  </div>;
}
