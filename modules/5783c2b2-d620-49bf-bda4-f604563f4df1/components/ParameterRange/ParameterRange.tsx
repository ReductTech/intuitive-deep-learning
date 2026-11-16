import { Typography } from "@shuku/course-style/react";
import './ParameterRange.css';

export const PARAMETER_GROUPS = ['Stem', 'Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', '新分类头'] as const;
export function UpdateStateIcon({ trainable }: { trainable: boolean }) {
  return <svg shuku-edit-id="e-5de9f6c4-9be0-47a5-ac26-e795363bad4b" viewBox="0 0 32 32" aria-hidden="true" className="rtg-parameter-range__state-icon">
    {trainable ? <><path shuku-edit-id="e-f6b94288-7de4-4057-97f7-ea7695024581" d="M25 13a10 10 0 1 0 0 9M25 5v8h-8" /><path shuku-edit-id="e-5be3abf9-59e3-4cfd-a008-0a37af6a0524" d="M13 12l6 5-6 5" /></>
      : <><path shuku-edit-id="e-44025dcb-5b1e-42b7-9e79-3119506a4415" d="M10 14V9a6 6 0 0 1 12 0v5" /><rect shuku-edit-id="e-32bdff15-0467-4a0a-a92f-6f91045230c8" x="6" y="14" width="20" height="15" rx="3" /><path shuku-edit-id="e-bcc51c37-ef92-48c1-be49-36a8b40d009b" d="M16 19v5" /></>}
  </svg>;
}
export interface ParameterRangeProps { trainableFrom: number; compact?: boolean; pending?: boolean; backboneOnly?: boolean; label?: string; }
export function ParameterRange({ trainableFrom, compact = false, pending = false, backboneOnly = false, label = '各层参数更新范围' }: ParameterRangeProps) {
  return <div shuku-edit-id="e-56055da9-947d-4af1-983d-752109794b8b" className={'rtg-parameter-range' + (compact ? ' is-compact' : '') + (pending ? ' is-pending' : '') + (backboneOnly ? ' is-backbone-only' : '')} aria-label={label}>
    {(backboneOnly ? PARAMETER_GROUPS.slice(0, 5) : PARAMETER_GROUPS).map((name, index) => {
      const trainable = !pending && index >= trainableFrom;
      return <div shuku-edit-id="e-8ebac250-8ac0-44b7-85c2-8ca98e563c85" className={'rtg-parameter-range__group' + (trainable ? ' is-trainable' : '')}
        key={name} data-layer-name={name} data-trainable={pending ? undefined : trainable} aria-label={name + '：' + (pending ? '待选择更新范围' : trainable ? '可训练，参数允许更新' : '冻结，参数不更新')}>
        {!compact && <Typography shuku-edit-id="e-dbe29102-5218-4d01-9b8d-ab49a92cc632" variant="bodySmall" tone="inherit" align="center">{name}</Typography>}
        <svg shuku-edit-id="e-1f1c71b5-d868-42ab-803f-6f640b915bdf" className="rtg-parameter-range__blocks" viewBox={compact ? '0 0 80 90' : '0 0 170 140'} aria-hidden="true" data-block-count={compact || index === 5 ? 1 : 3}>
          {(compact || index === 5 ? [0] : [0, 1, 2]).map(i => <g shuku-edit-id="e-1168937a-bf3d-45f8-8b93-d355c2767f4e" key={i} transform={'translate(' + (compact ? 0 : index === 5 ? 40 : i * 40) + ',0)'}>
            <path shuku-edit-id="e-9a0b4b21-d768-4578-b1bc-5fc94493f03a" className="block-top" d={compact ? 'M12 28L34 8H66L44 28Z' : 'M16 42L40 20H64L40 42Z'} />
            <path shuku-edit-id="e-c48b803f-1e2d-4f0e-9d4f-0d4917f22cc1" className="block-side" d={compact ? 'M44 28L66 8V62L44 82Z' : 'M40 42L64 20V97L40 119Z'} />
            <rect shuku-edit-id="e-3ff77831-9ccf-4486-911d-aaf2cdee2224" className="block-front" x={compact ? 12 : 16} y={compact ? 28 : 42} width={compact ? 32 : 24} height={compact ? 54 : 77} />
          </g>)}
          {!pending && !trainable && !compact && <rect shuku-edit-id="e-8ba157a2-0d2b-4102-8c4a-7ca1e52cd232" className="block-frozen-outline" x={index === 5 ? 48 : 8} y="12" width={index === 5 ? 64 : 144} height="115" rx="6" />}
        </svg>
        <div shuku-edit-id="e-c41f321b-e78f-4099-91df-6c209a00ed0d" className="rtg-parameter-range__status">{!pending && <UpdateStateIcon trainable={trainable} />}
          {!compact && <Typography shuku-edit-id="e-37de5234-9283-49f4-a09b-a2699bdd196d" as="span" variant="bodySmall" tone="inherit">{pending ? '待选' : trainable ? '可训练' : '冻结'}</Typography>}
        </div>
      </div>;
    })}
  </div>;
}
