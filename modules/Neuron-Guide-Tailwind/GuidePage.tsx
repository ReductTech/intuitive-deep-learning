import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { LessonFlow, ModuleShell, Typography, type LessonFlowStep } from '../shared/react';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import '../shared/react/presentation.css';
import './tailwind.css';
import { LessonProvider } from './LessonContext';
import { lessonContextOptions, neuronCourse } from './course';

function LectureAdvanceCue({ children, complete, onContinue, label = '继续向下滚动' }: {
  children: ReactNode;
  complete: boolean;
  onContinue: () => void;
  label?: string;
}) {
  const touchStartY = useRef<number | null>(null);
  const advancedRef = useRef(false);
  const advance = useCallback(() => {
    if (complete || advancedRef.current) return;
    advancedRef.current = true;
    onContinue();
  }, [complete, onContinue]);

  useEffect(() => {
    if (complete) return undefined;
    let armed = false;
    const armTimer = window.setTimeout(() => { armed = true; }, 350);
    const handleWheel = (event: WheelEvent) => { if (armed && event.deltaY > 12) advance(); };
    const handleTouchStart = (event: TouchEvent) => { touchStartY.current = event.touches[0]?.clientY ?? null; };
    const handleTouchEnd = (event: TouchEvent) => {
      const endY = event.changedTouches[0]?.clientY;
      if (armed && touchStartY.current !== null && endY !== undefined && touchStartY.current - endY > 24) advance();
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
  }, [advance, complete]);

  return (
    <div className="lesson-step">
      {children}
      {!complete && (
        <button type="button" className="edu-scroll-cue" onClick={advance} aria-label={label}>
          <Typography as="span" variant="bodySmall" tone="inherit" className="edu-scroll-cue-arrow" aria-hidden="true">↓</Typography>
          <Typography as="span" variant="bodySmall" tone="inherit">{label}</Typography>
        </button>
      )}
    </div>
  );
}

function BlogLessonCanvas({ children }: { children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => {
      const width = frame.clientWidth || 1600;
      setScale(Math.min(1, width / 1600));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);
  return <div ref={frameRef} className="lesson-canvas-frame" style={{ height: 900 * scale }}><div className="course-page-surface course-shell" style={{ transform: 'scale(' + scale + ')' }}>{children}</div></div>;
}

export const neuronGuideLessonSteps: LessonFlowStep[] = neuronCourse
  .filter((item) => item.showInBlog !== false)
  .map(({ id, revealMode, advanceLabel, component }) => ({
    id,
    revealMode,
    render: (context) => (
      <BlogLessonCanvas>
        {revealMode === 'scroll' ? (
          <LectureAdvanceCue complete={context.isComplete} onContinue={context.complete} {...(advanceLabel ? { label: advanceLabel } : {})}>
            {component(context)}
          </LectureAdvanceCue>
        ) : component(context)}
      </BlogLessonCanvas>
    ),
  }));

export function GuidePage() {
  return (
    <LessonProvider {...lessonContextOptions}>
      <ModuleShell
        title="认识人工神经元 · Tailwind 试验版"
        subtitle="从秀丽隐杆线虫的刺激反应出发，逐步建立输入、权重、加权和与偏置的数学模型。"
        shellClassName="course-shell course-blog-shell"
      >
        <LessonFlow steps={neuronGuideLessonSteps} persistenceKey="neuron-guide-tailwind-guidepage-v1" />
      </ModuleShell>
    </LessonProvider>
  );
}




