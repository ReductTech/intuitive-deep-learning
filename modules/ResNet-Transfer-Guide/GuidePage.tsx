import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { emitTelemetry, LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import '../shared/react/presentation.css';
import { resNetTransferCourse } from './course';
import { reconcileGuideProgress } from './services/guideProgress';

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
      <div className="course-page-surface course-shell" style={{ transform: 'scale(' + scale + ')' }}>
        {children}
      </div>
    </div>
  );
}

const lessonSteps: LessonFlowStep[] = resNetTransferCourse.map(({ id, revealMode, component }) => ({
  id,
  // In the study host, part of the next canvas is already visible when it is
  // revealed, which dismisses the shared cue before the reader can follow it.
  revealMode: revealMode === 'cue' ? 'scroll' : revealMode,
  render: (context) => <BlogLessonCanvas>{component(context)}</BlogLessonCanvas>,
}));

export function GuidePage() {
  const flowRef = useRef<HTMLDivElement>(null);
  const [flowReady, setFlowReady] = useState(false);

  useLayoutEffect(() => {
    const key = 'lesson-flow:resnet-transfer-guide-v1';
    try {
      const progress = JSON.parse(localStorage.getItem(key) || 'null');
      const state = reconcileGuideProgress(progress, lessonSteps.map(step => step.id));
      if (state.visibleCount > (Number(progress?.visibleCount) || 1)) {
        localStorage.setItem(key, JSON.stringify(state));
        // The study host scopes storage and derives its current page from this
        // public event. Reconcile it before LessonFlow reads the restored seed.
        emitTelemetry('lesson_progress', flowRef.current, { state_key: key, state });
      }
    } catch { /* A new lesson remains available when storage is unavailable. */ }
    const frame = requestAnimationFrame(() => setFlowReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => {
    if (!flowReady) return;
    let visibleCount = 1;
    try {
      visibleCount = Number(JSON.parse(localStorage.getItem('lesson-flow:resnet-transfer-guide-v1') || 'null')?.visibleCount) || 1;
    } catch { /* Start at the opening page when progress cannot be read. */ }
    const step = lessonSteps[Math.min(lessonSteps.length, visibleCount) - 1];
    const root = flowRef.current;
    if (!root || !step || visibleCount <= 1) return;
    let frame = 0;
    const observer = new MutationObserver(restorePosition);
    function restorePosition() {
      const target = root?.querySelector<HTMLElement>(`[data-step-id="${step.id}"]`);
      if (!target) return;
      observer.disconnect();
      frame = requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    }
    observer.observe(root, { childList: true, subtree: true });
    restorePosition();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [flowReady]);

  return (
    <ModuleShell
      title="深层网络与表示学习"
      subtitle="从 300 张可回收物照片出发，逐步理解 ResNet、预训练与迁移学习。"
      shellClassName="course-shell course-blog-shell"
    >
      <div ref={flowRef}>
        {flowReady && <LessonFlow steps={lessonSteps} persistenceKey="resnet-transfer-guide-v1" />}
      </div>
    </ModuleShell>
  );
}
