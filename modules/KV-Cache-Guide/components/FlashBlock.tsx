import { Typography } from '../../shared/react';
import './FlashBlock.css';

export type ScorePosition = '11' | '12' | '21' | '22';

type FlashBlockProps = {
  name: string;
  rows?: number;
  cols?: number;
  position?: ScorePosition;
  active?: boolean;
  subdued?: boolean;
  compact?: boolean;
  highlightLastRow?: boolean;
  className?: string;
};

export function FlashBlock({
  name,
  rows = 3,
  cols = 3,
  position,
  active = false,
  subdued = false,
  compact = false,
  highlightLastRow = false,
  className = '',
}: FlashBlockProps) {
  const masked = (row: number, col: number) => {
    if (position === '12') return true;
    if (position === '11' || position === '22') return col > row;
    return false;
  };

  return <div className={`fba-block${compact ? ' fba-block--compact' : ''}${subdued ? ' fba-block--subdued' : ''} ${className}`}>
    <Typography as="span" variant={compact ? 'bodySmall' : 'h3'} className="fba-block-name">{name}</Typography>
    <div className="fba-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} role="img" aria-label={`${name}，${rows} 行 ${cols} 列${position === '12' ? '，因果遮罩' : ''}`}>
      {Array.from({ length: rows * cols }, (_, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        return <span key={index} className={`fba-cell${masked(row, col) ? ' fba-cell--masked' : active ? ' fba-cell--active' : ''}${highlightLastRow && row === rows - 1 && !masked(row, col) ? ' fba-cell--row' : ''}`} />;
      })}
    </div>
  </div>;
}
