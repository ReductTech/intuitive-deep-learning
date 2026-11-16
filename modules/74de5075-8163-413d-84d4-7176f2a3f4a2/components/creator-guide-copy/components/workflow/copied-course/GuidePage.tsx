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
    <div shuku-edit-id="e-76973228-115c-4b4b-90e1-c9aab0e2b29b" className="lesson-step">
      {children}
      {!complete && (
        <button shuku-edit-id="e-be67585a-608f-40c2-91d1-575aff06b658" type="button" className="edu-scroll-cue" onClick={advance} aria-label={label}>
          <Typography shuku-edit-id="e-375d92aa-8f7b-4fee-9f9e-ff0e09f3c8d2" as="span" variant="bodySmall" tone="inherit" className="edu-scroll-cue-arrow" aria-hidden="true">↓</Typography>
          <Typography shuku-edit-id="e-956b9f72-9ca3-4bea-a7ed-825acfa77179" as="span" variant="bodySmall" tone="inherit">{label}</Typography>
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
    <div shuku-edit-id="e-63b7e946-8429-4ac2-be90-c1df7f4cdb54" ref={frameRef} className="lesson-canvas-frame relative w-full overflow-hidden" style={{ height: 900 * scale }}>
      <div shuku-edit-id="e-bee47ce7-67e1-4be9-85ab-227011ea0aa0" className="course-page-surface aipe-replay-cg-copy-course-shell aipe-replay-cg-copy-tw-canvas origin-top-left" style={{ transform: `scale(${scale})` }}>
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
