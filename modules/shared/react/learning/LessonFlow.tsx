import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { classNames } from '../utils';

export type LessonFlowRevealMode = 'immediate' | 'scroll' | 'cue';

export interface LessonStepContext {
  complete: () => void;
  reset: () => void;
  isComplete: boolean;
}

export interface LessonFlowStep {
  id: string;
  revealMode?: LessonFlowRevealMode;
  render: (context: LessonStepContext) => ReactNode;
}

export interface LessonFlowProps {
  steps: LessonFlowStep[];
  className?: string;
  cueText?: ReactNode;
}

/** Manages lesson-step visibility; individual blocks only report their own completion. */
export function LessonFlow({
  steps,
  className,
  cueText = '下一段内容已经准备好，向下滚动继续学习',
}: LessonFlowProps) {
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(Math.min(1, steps.length));
  const [revealedIndex, setRevealedIndex] = useState<number | null>(null);
  const [cueIndex, setCueIndex] = useState<number | null>(null);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);

  const reset = useCallback(() => {
    setCompletedIds([]);
    setVisibleCount(Math.min(1, steps.length));
    setRevealedIndex(null);
    setCueIndex(null);
  }, [steps.length]);

  const complete = useCallback((id: string) => {
    const index = steps.findIndex((step) => step.id === id);
    if (index < 0) return;
    setCompletedIds((current) => current.includes(id) ? current : [...current, id]);
    const nextIndex = index + 1;
    if (nextIndex >= steps.length) return;
    setVisibleCount((current) => Math.max(current, nextIndex + 1));
    setRevealedIndex(nextIndex);
  }, [steps]);

  useEffect(() => {
    if (revealedIndex === null) return;
    const mode = steps[revealedIndex]?.revealMode ?? 'immediate';
    const target = stepRefs.current[revealedIndex];
    if (!target) return;
    if (mode === 'scroll') {
      requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } else if (mode === 'cue') {
      setCueIndex(revealedIndex);
    }
    setRevealedIndex(null);
  }, [revealedIndex, steps]);

  useEffect(() => {
    if (cueIndex === null) return;
    const target = stepRefs.current[cueIndex];
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setCueIndex(null);
    }, { threshold: 0.08 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [cueIndex]);

  return (
    <div className={classNames('edu-lesson-flow', className)}>
      {steps.slice(0, visibleCount).map((step, index) => (
        <section
          className={classNames('edu-lesson-flow-step', index > 0 && 'is-revealed')}
          key={step.id}
          ref={(node) => { stepRefs.current[index] = node; }}
          data-step-id={step.id}
        >
          {step.render({
            complete: () => complete(step.id),
            reset,
            isComplete: completedIds.includes(step.id),
          })}
        </section>
      ))}
      {cueIndex !== null && (
        <div className="edu-lesson-flow-cue" role="status">
          <span aria-hidden="true">↓</span>{cueText}
        </div>
      )}
    </div>
  );
}
