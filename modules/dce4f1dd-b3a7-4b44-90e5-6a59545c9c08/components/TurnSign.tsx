import './TurnSign.css';

/** A directional teaching symbol; the same drawing is mirrored for a right turn. */
export function TurnSign({ direction = 'left', small = false }: { direction?: 'left' | 'right'; small?: boolean }) {
  return <svg className={`daa-turn-sign${small ? ' daa-turn-sign-small' : ''}`} viewBox="0 0 100 100" role="img" aria-label={direction === 'left' ? '左转标志' : '右转标志'}>
    <circle cx="50" cy="50" r="47" fill="var(--ui-accent)" />
    <circle cx="50" cy="50" r="43" fill="none" stroke="white" strokeWidth="1.5" />
    <path d="M64 78 H50 V49 C50 41 46 37 37 37 H33 V49 L13 30 L33 11 V23 H37 C55 23 64 33 64 49 Z" fill="white" transform={direction === 'right' ? 'translate(100 0) scale(-1 1)' : undefined} />
  </svg>;
}
