import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ModuleShell } from '../shared/react';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import '../shared/react/presentation.css';
import { visualGenerationCourse } from './course';

function BlogLessonCanvas({ children }: { children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setScale(Math.min(1, (frame.clientWidth || 1600) / 1600));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} className="lesson-canvas-frame" style={{ height: 900 * scale }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

export function GuidePage() {
  const progressKey = 'lesson-flow:visual-generation-guide-v4';
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try { const ids = JSON.parse(localStorage.getItem(progressKey) ?? '{}').completedIds; return Array.isArray(ids) ? ids : []; }
    catch { return []; }
  });
  const complete = (id: string) => setCompletedIds(ids => {
    if (ids.includes(id)) return ids;
    const next = [...ids, id];
    try { localStorage.setItem(progressKey, JSON.stringify({ completedIds: next, visibleCount: visualGenerationCourse.length })); }
    catch { /* Reading remains available when storage is disabled. */ }
    return next;
  });
  return <ModuleShell
    title="视觉生成：从噪声到图像"
    subtitle="从多种合理答案出发，先理解 GAN 的对抗生成，再认识 Diffusion 的加噪与去噪。"
    shellClassName="course-shell course-blog-shell"
  >
    <div className="edu-lesson-flow" data-state-key={progressKey}>
    {visualGenerationCourse.filter(item => item.showInBlog !== false).map(item =>
      <section key={item.id} data-step-id={item.id}>
        <BlogLessonCanvas>{item.component({ complete: () => complete(item.id), reset: () => {}, isComplete: completedIds.includes(item.id) })}</BlogLessonCanvas>
      </section>
    )}
    </div>
  </ModuleShell>;
}
