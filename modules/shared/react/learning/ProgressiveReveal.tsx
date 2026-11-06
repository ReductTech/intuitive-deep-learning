import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '../controls/Button';
import { ScrollCue } from './ScrollCue';

export type ProgressiveRevealMode = 'scroll' | 'cue';

export interface ProgressiveRevealProps {
  mode?: ProgressiveRevealMode;
  revealLabel: ReactNode;
  resetLabel?: ReactNode;
  cueText?: ReactNode;
  contentClassName?: string;
  children: ReactNode;
}

export function ProgressiveReveal({
  mode = 'scroll',
  revealLabel,
  resetLabel,
  cueText = '下方出现了新模块，向下滚动查看',
  contentClassName,
  children,
}: ProgressiveRevealProps) {
  const [visible, setVisible] = useState(false);
  const [cueVisible, setCueVisible] = useState(false);
  const stageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!visible || !stageRef.current) return;
    if (mode === 'scroll') {
      requestAnimationFrame(() => stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      return;
    }
  }, [mode, visible]);

  const reveal = () => {
    setVisible(true);
    if (mode !== 'cue') {
      setCueVisible(false);
      return;
    }

    const bounds = stageRef.current?.getBoundingClientRect();
    const stageIsInViewport = bounds !== undefined
      && bounds.bottom > 0
      && bounds.top < window.innerHeight
      && bounds.right > 0
      && bounds.left < window.innerWidth;
    setCueVisible(!stageIsInViewport);
  };

  const reset = () => {
    setVisible(false);
    setCueVisible(false);
  };

  return (
    <>
      <div className="edu-reveal-actions">
        <Button variant="primary" onClick={reveal}>{revealLabel}</Button>
        {resetLabel !== undefined && <Button onClick={reset}>{resetLabel}</Button>}
      </div>
      {visible && <section className={contentClassName} ref={stageRef}>{children}</section>}
      {visible && cueVisible && mode === 'cue' && (
        <ScrollCue targetRef={stageRef} onDismiss={() => setCueVisible(false)}>{cueText}</ScrollCue>
      )}
    </>
  );
}
