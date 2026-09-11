import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import './pages/shared.css';
import { NeuronLessonProvider } from './model/NeuronLessonContext';
import { neuronCourse } from './course';

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
  return <div ref={frameRef} className="lesson-canvas-frame" style={{ height: 900 * scale }}><div className="course-page-surface guide-shell" style={{ transform: 'scale(' + scale + ')' }}>{children}</div></div>;
}

export const neuronGuideLessonSteps: LessonFlowStep[] = neuronCourse
  .filter((item) => item.showInBlog !== false)
  .map(({ id, revealMode, component }) => ({
    id,
    revealMode,
    render: (context) => <BlogLessonCanvas>{component(context)}</BlogLessonCanvas>,
  }));

export function GuidePage() {
  return (
    <NeuronLessonProvider>
      <ModuleShell
        title="认识人工神经元"
        subtitle="从秀丽隐杆线虫的刺激反应出发，逐步建立输入、权重、加权和与偏置的数学模型。"
        shellClassName="guide-shell guide-blog-shell"
      >
        <LessonFlow steps={neuronGuideLessonSteps} persistenceKey="neuron-guide-expanded-v6" />
      </ModuleShell>
    </NeuronLessonProvider>
  );
}



