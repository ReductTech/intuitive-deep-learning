import { Typography } from '../../shared/react';
import candidateData from '../data/decisionCandidates.json';

const choiceRows = candidateData.rows;

export function DecisionMarquee({ selected, onSelect }: { selected: string; onSelect: (value: string) => void }) {
  const renderGroup = (choices: string[], rowIndex: number, duplicate: boolean) => (
    <div className="ng-choice-group" aria-hidden={duplicate || undefined}>
      {choices.map((choice, index) => (
        <button
          className={`ng-choice-chip${selected === choice ? ' is-selected' : ''}`}
          data-tone={(rowIndex + index) % 4}
          key={`${choice}-${duplicate ? 'duplicate' : 'main'}`}
          type="button"
          tabIndex={duplicate ? -1 : undefined}
          aria-pressed={!duplicate && selected === choice}
          onClick={() => onSelect(choice)}
        >
          <Typography as="span" variant="bodySmall" tone="inherit">{choice}</Typography>
        </button>
      ))}
    </div>
  );

  return (
    <div className="ng-decision-stream" aria-label="常见决定示例">
      {choiceRows.map((choices, rowIndex) => (
        <div className={`ng-marquee-row ${rowIndex % 2 === 0 ? 'ng-marquee-row--right' : 'ng-marquee-row--left'}`} key={rowIndex}>
          <div className="ng-marquee-track" style={{ animationDuration: `${92 + rowIndex * 7}s` }}>
            {renderGroup(choices, rowIndex, false)}
            {renderGroup(choices, rowIndex, true)}
          </div>
        </div>
      ))}
    </div>
  );
}
