import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { LessonFlow, ModuleShell, Typography, type LessonFlowStep } from "@shuku/course-style/react";
import "@shuku/course-style/react/styles.css";
import "@shuku/course-style/react/ui-kit.css";
import "@shuku/course-style/react/presentation.css";
import './tailwind.css';
import { convolutionCourse } from './course';
import { GomokuLessonProvider } from './LessonContext';

/**
 * 讲解页没有交互可做，读者往下滚动（或点一下）就继续；
 * 需要动手的页面仍然由页面自己报告完成。
 */
function LectureAdvanceCue({ children, complete, onContinue, label = '读完了，继续往下' }: {
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
    <div shuku-edit-id="e-ed0505d5-a456-4222-81f9-5fab209c5e0e" className="lesson-step">
      {children}
      {!complete && (
        <button shuku-edit-id="e-c8f98fbe-6b17-41e6-b3f8-1f578486e605" type="button" className="edu-scroll-cue" onClick={advance} aria-label={label}>
          <Typography shuku-edit-id="e-c218ca61-5aae-44c4-9b4d-b9ac0c2f678a" as="span" variant="bodySmall" tone="inherit" className="edu-scroll-cue-arrow" aria-hidden="true">↓</Typography>
          <Typography shuku-edit-id="e-78c4ea79-c265-40d1-97a5-8feda130e8cb" as="span" variant="bodySmall" tone="inherit">{label}</Typography>
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
    if (!frame) return undefined;
    const update = () => setScale(Math.min(1, (frame.clientWidth || 1600) / 1600));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div shuku-edit-id="e-3eaa4003-b689-4c04-a227-977dccce3e20" ref={frameRef} className="lesson-canvas-frame relative w-full overflow-hidden" style={{ height: 900 * scale }}>
      <div shuku-edit-id="e-bed28f44-ba83-48d3-90e1-ace646fc1534" className="course-page-surface cg-copy-course-shell cg-copy-tw-canvas origin-top-left" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

export const convolutionLessonSteps: LessonFlowStep[] = convolutionCourse
  .filter((item) => item.showInBlog !== false)
  .map(({ id, revealMode, component }) => ({
    id,
    revealMode,
    render: (context) => (
      <BlogLessonCanvas>
        {revealMode === 'scroll'
          ? <LectureAdvanceCue complete={context.isComplete} onContinue={context.complete}>{component(context)}</LectureAdvanceCue>
          : component(context)}
      </BlogLessonCanvas>
    ),
  }));

export function GuidePage() {
  return (
    <ModuleShell
      title="卷积核入门"
      subtitle="从一局五子棋开始，一步步走到图像上的卷积。"
      shellClassName="cg-copy-course-shell course-blog-shell cg-copy-tw-root bg-[#f4f7fb] text-[#21334e]"
    >
      <GomokuLessonProvider><LessonFlow steps={convolutionLessonSteps} persistenceKey="ai-practice-education-spp-copied-convolution-guide-v1" /></GomokuLessonProvider>
    </ModuleShell>
  );
}
