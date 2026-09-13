import { useLayoutEffect, useRef, useState } from 'react';
import { ModuleShell } from '../shared/react';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import '../shared/react/presentation.css';
import { UncertaintyOpeningPage } from './pages/UncertaintyOpeningPage/UncertaintyOpeningPage';

function BlogLessonCanvas() {
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
        <UncertaintyOpeningPage />
      </div>
    </div>
  );
}

export function GuidePage() {
  return (
    <ModuleShell
      title="从身高遗传到线性回归"
      subtitle="从不确定的现实数据出发，理解模型、误差与损失函数。"
      shellClassName="course-shell course-blog-shell"
    >
      <BlogLessonCanvas />
    </ModuleShell>
  );
}
