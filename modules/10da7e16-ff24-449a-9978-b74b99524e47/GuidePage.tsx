import { useLayoutEffect, useRef, useState } from 'react';
import { ModuleShell } from '@shuku/course-style/react';
import '@shuku/course-style/react/styles.css';
import '@shuku/course-style/react/ui-kit.css';
import '@shuku/course-style/react/presentation.css';
import { deck } from './digitalImagePpt';
import outline from './outlines.json';

export function GuidePage() {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    const resize = () => setScale(Math.min(1, element.clientWidth / 1600));
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => observer.disconnect();
  }, []);
  return <ModuleShell shellClassName="course-shell course-blog-shell"><div ref={frame}>
    {outline.pages.map(page => {
      const scene = deck.scenes.find(scene => scene.id === page.id);
      if (!scene) throw new Error('Missing digital image page: ' + page.id);
      return <div key={page.id} data-step-id={page.id} className="lesson-canvas-frame" style={{ height: scale * 900 }}>
        <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}>{scene.render({ complete: () => {}, reset: () => {}, isComplete: false })}</div>
      </div>;
    })}
  </div></ModuleShell>;
}
