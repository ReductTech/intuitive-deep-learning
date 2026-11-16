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
    <div shuku-edit-id="e-04572409-1e2e-48a3-a64b-9487120ed142" className="lesson-step">
      {children}
      {!complete && (
        <button shuku-edit-id="e-edfc66af-1fc6-4624-8b86-8c2d6abd0b73" type="button" className="edu-scroll-cue" onClick={advance} aria-label={label}>
          <Typography shuku-edit-id="e-2d8c20c2-f5fe-4f4b-9b4b-d578a9b36fe6" as="span" variant="bodySmall" tone="inherit" className="edu-scroll-cue-arrow" aria-hidden="true">↓</Typography>
          <Typography shuku-edit-id="e-4abc0cf1-16c4-4394-a804-ba6923df5380" as="span" variant="bodySmall" tone="inherit">{label}</Typography>
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
    <div shuku-edit-id="e-e6183905-aa59-4399-afd7-2151fa448518" ref={frameRef} className="lesson-canvas-frame relative w-full overflow-hidden" style={{ height: 900 * scale }}>
      <div shuku-edit-id="e-8ce0ca9b-f0cb-4ead-95c3-65a4e69b3301" className="course-page-surface aipe-replay-cg-copy-course-shell aipe-replay-cg-copy-tw-canvas origin-top-left" style={{ transform: `scale(${scale})` }}>
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
      shellClassName="aipe-replay-cg-copy-course-shell course-blog-shell aipe-replay-cg-copy-tw-root bg-[#f4f7fb] text-[#21334e]"
    >
      <GomokuLessonProvider><LessonFlow steps={convolutionLessonSteps} persistenceKey="creator-guide-copied-convolution-guide-v1" /></GomokuLessonProvider>
    </ModuleShell>
  );
}
