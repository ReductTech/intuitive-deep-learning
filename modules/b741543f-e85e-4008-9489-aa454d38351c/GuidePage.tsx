import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { LessonFlow, ModuleShell, type LessonFlowStep } from "@shuku/course-style/react";
import "@shuku/course-style/react/styles.css";
import "@shuku/course-style/react/ui-kit.css";
import "@shuku/course-style/react/presentation.css";
import { naiveRnnCourse } from './course';

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
    <div shuku-edit-id="e-f29fa1d0-07a5-4bf5-93a3-9fb21de4cb64" ref={frameRef} className="lesson-canvas-frame" style={{ height: 900 * scale }}>
      <div shuku-edit-id="e-b5388b93-d5ad-4f91-8c56-a57ef5ccca83" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

const lessonSteps: LessonFlowStep[] = naiveRnnCourse.map(({ id, revealMode, component }) => ({
  id,
  revealMode,
  render: (context) => <BlogLessonCanvas>{component(context)}</BlogLessonCanvas>,
}));

export function GuidePage() {
  return (
    <ModuleShell
      title="朴素 RNN"
      subtitle="先从记忆与预测两个问题出发，理解循环神经网络为什么需要状态。"
      shellClassName="course-shell course-blog-shell"
    >
      <LessonFlow steps={lessonSteps} persistenceKey="naive-rnn-guidepage-v1" />
    </ModuleShell>
  );
}
