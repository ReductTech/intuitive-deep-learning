import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ModuleShell } from '../shared/react';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import '../shared/react/presentation.css';
import { DigitRecognitionOpeningPage } from './pages/DigitRecognitionOpeningPage/DigitRecognitionOpeningPage';
import { FixedDigitPage } from './pages/FixedDigitPage/FixedDigitPage';

function LessonCanvas({ children }: { children: ReactNode }) {
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

  return <div className="lesson-canvas-frame" ref={frameRef} style={{ height: 900 * scale }}>
    <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}>{children}</div>
  </div>;
}

export function GuidePage() {
  return <ModuleShell
    title="视觉特征学习"
    subtitle="从手写数字的形状线索出发，探索视觉特征怎样成为可以学习的参数。"
    shellClassName="course-shell course-blog-shell"
  >
    <LessonCanvas><DigitRecognitionOpeningPage /></LessonCanvas>
    <LessonCanvas><FixedDigitPage /></LessonCanvas>
  </ModuleShell>;
}
