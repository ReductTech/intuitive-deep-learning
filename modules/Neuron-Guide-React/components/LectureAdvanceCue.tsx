import { useEffect, useRef, type ReactNode } from 'react';
import { Typography } from '../../shared/react';

export function LectureAdvanceCue({ children, complete, onContinue }: {
  children: ReactNode;
  complete: boolean;
  onContinue: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (complete) return undefined;
    let armed = false;
    let advanced = false;
    const armTimer = window.setTimeout(() => { armed = true; }, 350);
    const advance = () => {
      if (!armed || advanced) return;
      const bounds = rootRef.current?.getBoundingClientRect();
      if (bounds && bounds.bottom > window.innerHeight + 140) return;
      advanced = true;
      onContinue();
    };
    const handleWheel = (event: WheelEvent) => { if (event.deltaY > 12) advance(); };
    const handleTouchStart = (event: TouchEvent) => { touchStartY.current = event.touches[0]?.clientY ?? null; };
    const handleTouchEnd = (event: TouchEvent) => {
      const endY = event.changedTouches[0]?.clientY;
      if (touchStartY.current !== null && endY !== undefined && touchStartY.current - endY > 24) advance();
      touchStartY.current = null;
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      if (['ArrowDown', 'PageDown', ' '].includes(event.key)) advance();
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(armTimer);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [complete, onContinue]);

  return (
    <div className="ng-lecture-step" ref={rootRef}>
      {children}
      {!complete && (
        <div className="edu-scroll-cue" role="status">
          <Typography as="span" variant="bodySmall" tone="inherit" className="edu-scroll-cue-arrow" aria-hidden="true">↓</Typography>
          <Typography as="span" variant="bodySmall" tone="inherit">继续向下滚动</Typography>
        </div>
      )}
    </div>
  );
}
