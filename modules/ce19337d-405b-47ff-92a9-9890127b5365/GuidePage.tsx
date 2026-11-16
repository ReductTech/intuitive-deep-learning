import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ModuleShell } from "@shuku/course-style/react";
import "@shuku/course-style/react/styles.css";
import "@shuku/course-style/react/ui-kit.css";
import "@shuku/course-style/react/presentation.css";
import { visualGenerationCourse } from './course';
import './GuidePage.css';

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
    <div shuku-edit-id="e-f4fa86a5-c150-4fa9-b7e9-3d4e22d4a538" ref={frameRef} className="lesson-canvas-frame" style={{ height: 900 * scale }}>
      <div shuku-edit-id="e-775f1bf3-be39-49da-84d2-b33dc1e51fd7" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}>
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
    className="vg-blog"
    title="视觉生成：从噪声到图像"
    subtitle="从多种合理答案出发，先理解 GAN 的对抗生成，再认识 Diffusion 的加噪与去噪。"
    shellClassName="course-shell course-blog-shell"
  >
    <div shuku-edit-id="e-40362f2d-da94-423a-befc-00cdaf699fa7" className="edu-lesson-flow" data-state-key={progressKey}>
    {visualGenerationCourse.filter(item => item.showInBlog !== false).map(item =>
      <section shuku-edit-id="e-00e0a426-0536-418c-b0fc-0de3106f2655" key={item.id} data-step-id={item.id}>
        <BlogLessonCanvas>{item.component({ complete: () => complete(item.id), reset: () => {}, isComplete: completedIds.includes(item.id) })}</BlogLessonCanvas>
      </section>
    )}
    </div>
  </ModuleShell>;
}
