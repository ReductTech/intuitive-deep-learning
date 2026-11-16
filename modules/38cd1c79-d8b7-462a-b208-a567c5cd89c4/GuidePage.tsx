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
    <div shuku-edit-id="e-f6f3a362-dd2f-4a96-a3ea-3af6e1fd98a4" className="lesson-step">
      {children}
      {!complete && (
        <button shuku-edit-id="e-ed3658ac-86cf-4094-b648-1f75eaf47b77" type="button" className="edu-scroll-cue" onClick={advance} aria-label={label}>
          <Typography shuku-edit-id="e-f1fcc812-70d0-4af0-a5bb-28fd1d6c5526" as="span" variant="bodySmall" tone="inherit" className="edu-scroll-cue-arrow" aria-hidden="true">↓</Typography>
          <Typography shuku-edit-id="e-bac677a1-9355-46f9-90c9-db449b8a4f9b" as="span" variant="bodySmall" tone="inherit">{label}</Typography>
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
    <div shuku-edit-id="e-2a4589df-d34c-45e3-9986-d854afbe39b0" ref={frameRef} className="lesson-canvas-frame relative w-full overflow-hidden" style={{ height: 900 * scale }}>
      <div shuku-edit-id="e-f52b80d8-0242-41e1-a1ec-2852cefe702a" className="course-page-surface course-shell cktw-canvas origin-top-left" style={{ transform: `scale(${scale})` }}>
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
      shellClassName="course-shell course-blog-shell cktw-root bg-[#f4f7fb] text-[#21334e]"
    >
      <GomokuLessonProvider><LessonFlow steps={convolutionLessonSteps} persistenceKey="convolution-kernel-intro-guide-v1" /></GomokuLessonProvider>
    </ModuleShell>
  );
}
