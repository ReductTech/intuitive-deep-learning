import { Button, RangeControl, Typography } from '../../shared/react';
import type { CSSProperties } from 'react';
import type { NeuronFactor } from '../model/neuronMath';

export interface FactorCardProps {
  factor: NeuronFactor;
  index: number;
  value: number | null;
  touched: boolean;
  accepted?: boolean;
  requireAccept?: boolean;
  disabled?: boolean;
  onAccept?: () => void;
  onValueChange: (value: number) => void;
  onValueCommit: () => void;
}

export function FactorCard({
  factor,
  index,
  value,
  touched,
  accepted = true,
  requireAccept = false,
  disabled,
  onAccept,
  onValueChange,
  onValueCommit,
}: FactorCardProps) {
  const showInput = !requireAccept || accepted;
  return (
    <article className="ng-factor-card">
      <div className="ng-factor-heading">
        <div className="ng-factor-heading-copy">
          <Typography as="h3" variant="body" tone="accent" className="ng-panel-title">{factor.name}</Typography>
          <Typography variant="bodySmall" tone="muted">{factor.explanation}</Typography>
        </div>
        <Typography as="span" variant="bodySmall" tone="muted" className="edu-badge ng-factor-index">{String(index + 1).padStart(2, '0')}</Typography>
      </div>
      <div className={`ng-factor-controls${showInput ? '' : ' is-single'}`}>
        <div className="ng-model-importance">
          <div className="ng-model-range" aria-label={`建议的重要程度为 ${factor.suggestedImportance} 分，此滑杆不可调整`}>
            <div className="ng-model-range-head">
              <Typography as="span" variant="bodySmall" tone="accent">建议权重 w <Typography as="span" variant="bodySmall" tone="warning" className="ng-readonly-note">已设定</Typography></Typography>
              <Typography as="output" variant="bodySmall" tone="warning">{factor.suggestedImportance} / 10</Typography>
            </div>
            <input
              className="ng-readonly-range"
              type="range"
              min="0"
              max="10"
              step="1"
              value={factor.suggestedImportance}
              style={{ '--ng-weight-percent': `${factor.suggestedImportance * 10}%` } as CSSProperties}
              tabIndex={-1}
              aria-disabled="true"
              disabled
              readOnly
            />
            <div className="ng-segment-scale" aria-hidden="true">
              {Array.from({ length: 11 }, (_, tick) => <Typography as="span" variant="bodySmall" tone="light" key={tick}>{tick}</Typography>)}
            </div>
          </div>
          {requireAccept && !accepted && <Button className="ng-accept-importance" variant="primary" onClick={onAccept}>好的</Button>}
        </div>
        {showInput && (
          <RangeControl
            controlClassName="ng-range-group"
            label="你的当前程度"
            min={0}
            max={10}
            step={1}
            value={value ?? 5}
            formatValue={() => touched ? `${value} / 10` : ''}
            unset={!touched}
            scale={Array.from({ length: 11 }, (_, tick) => tick)}
            discrete
            disabled={disabled}
            onChange={(event) => onValueChange(Number(event.currentTarget.value))}
            onPointerUp={onValueCommit}
            onPointerCancel={onValueCommit}
            onKeyUp={onValueCommit}
            onBlur={onValueCommit}
          />
        )}
      </div>
    </article>
  );
}
