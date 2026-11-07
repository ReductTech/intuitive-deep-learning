import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import '../shared/react/presentation.css';
import { visionLanguageCourse } from './course';

function GuideCanvas({ children }: { children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    if (!frame.current) return;
    const element = frame.current;
    const resize = () => setScale(Math.min(1, element.clientWidth / 1600));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={frame} className="vlm-guide-frame" style={{ height: scale * 900 }}><div className="vlm-guide-surface" style={{ transform: `scale(${scale})` }}>{children}</div></div>;
}
const steps: LessonFlowStep[] = visionLanguageCourse.map((scene, index) => ({ id: scene.id, revealMode: 'scroll', completesLesson: index === visionLanguageCourse.length - 1, render: context => <GuideCanvas>{scene.render(context)}</GuideCanvas> }));
export function GuidePage() {
  return <ModuleShell title="视觉 Transformer 与视觉语言模型" subtitle="ViT、CLIP 与 VLM：表示、对齐与生成。" shellClassName="course-blog-shell"><LessonFlow steps={steps} persistenceKey="vision-language-models-guide-v1" /></ModuleShell>;
}
