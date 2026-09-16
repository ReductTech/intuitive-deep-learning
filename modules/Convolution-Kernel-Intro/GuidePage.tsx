import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import '../shared/react/presentation.css';
import { KernelLessonProvider } from './LessonContext';
import { kernelCourse } from './course';

/** 把 1600 × 900 的逻辑页面缩放并居中到阅读栏宽度。 */
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
    <div ref={frameRef} className="lesson-canvas-frame" style={{ height: 900 * scale }}>
      <div className="course-page-surface course-shell" style={{ transform: 'scale(' + scale + ')' }}>
        {children}
      </div>
    </div>
  );
}

export const kernelLessonSteps: LessonFlowStep[] = kernelCourse
  .filter((item) => item.showInBlog !== false)
  .map(({ id, revealMode, component }) => ({
    id,
    revealMode,
    render: (context) => <BlogLessonCanvas>{component(context)}</BlogLessonCanvas>,
  }));

export function GuidePage() {
  return (
    <KernelLessonProvider>
      <ModuleShell
        title="卷积核入门"
        subtitle="先从一局五子棋开始：计算机怎样从棋盘里判断「谁赢了」？"
        shellClassName="course-shell course-blog-shell"
      >
        <LessonFlow steps={kernelLessonSteps} persistenceKey="convolution-kernel-intro-guidepage-v1" />
      </ModuleShell>
    </KernelLessonProvider>
  );
}
