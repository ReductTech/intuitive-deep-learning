import { Button, ExplainPanelButton, RangeControl, Typography } from '../../shared/react';
import '../../shared/react/learning/FactorCard.css';
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
    <article className="factor-card">
      <div className="factor-heading">
        <div className="factor-heading-copy">
          <div className="factor-title-row">
            <Typography as="h3" variant="body" tone="accent" className="factor-title">{factor.name}</Typography>
            {factor.valueTransform === 'inverse' && (
              <ExplainPanelButton
                triggerContent={<Typography as="span" variant="bodySmall" tone="inherit">反</Typography>}
                label="查看反向计入说明"
              >
                <Typography as="strong" variant="bodySmall" tone="accent">反向计入</Typography>
                <Typography variant="bodySmall" tone="muted">评分越高，越不支持当前选择。</Typography>
              </ExplainPanelButton>
            )}
          </div>
          <Typography variant="bodySmall" tone="muted">{factor.explanation}</Typography>
        </div>
        <Typography as="span" variant="bodySmall" tone="muted" className="edu-badge factor-index">{String(index + 1).padStart(2, '0')}</Typography>
      </div>
      <div className={`factor-controls${showInput ? '' : ' is-single'}`}>
        <div className="model-importance">
          <div className="model-importance-copy" aria-label={`分析建议权重为 ${factor.suggestedImportance} 分`}>
            <Typography variant="bodySmall" tone="muted">
              AI 建议：在这次判断中，这个因素按 <Typography as="strong" variant="h3" tone="warning">{factor.suggestedImportance} / 10</Typography> 的权重计入。
            </Typography>
          </div>
          {requireAccept && !accepted && <Button className="accept-importance" variant="primary" onClick={onAccept}>好的</Button>}
        </div>
        {showInput && (
          <RangeControl
            controlClassName="range-group"
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
