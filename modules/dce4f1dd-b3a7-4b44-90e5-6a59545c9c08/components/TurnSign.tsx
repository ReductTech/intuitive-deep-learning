import './TurnSign.css';

/** A directional teaching symbol; the same drawing is mirrored for a right turn. */
export function TurnSign({ direction = 'left', small = false }: { direction?: 'left' | 'right'; small?: boolean }) {
  return <svg shuku-edit-id="e-5341c60a-ba78-4abd-911b-7ac0af94c7d5" className={`daa-turn-sign${small ? ' daa-turn-sign-small' : ''}`} viewBox="0 0 100 100" role="img" aria-label={direction === 'left' ? '左转标志' : '右转标志'}>
    <circle shuku-edit-id="e-f408d35a-ca45-4c3d-b63f-8bae6c6920ad" cx="50" cy="50" r="47" fill="var(--ui-accent)" />
    <circle shuku-edit-id="e-9778c8a0-ba30-4e81-87e1-28d9163a7bec" cx="50" cy="50" r="43" fill="none" stroke="white" strokeWidth="1.5" />
    <path shuku-edit-id="e-a2ecf06c-8229-4863-ad44-d6c302e20f15" d="M64 78 H50 V49 C50 41 46 37 37 37 H33 V49 L13 30 L33 11 V23 H37 C55 23 64 33 64 49 Z" fill="white" transform={direction === 'right' ? 'translate(100 0) scale(-1 1)' : undefined} />
  </svg>;
}
