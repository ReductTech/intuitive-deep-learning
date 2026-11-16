import { Fragment, useEffect, useRef, useState } from 'react';
import { ModuleShell } from "@shuku/course-style/react";
import { COURSE_TOPICS } from './pages/CourseCoverPage';
import { courseScenes } from './course';
import outline from './outlines.json';
import './KvCacheGuide.css';

export function KvCacheGuide() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setScale(Math.min(1, frame.clientWidth / 1600));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return <ModuleShell
    title={outline.title}
    subtitle={COURSE_TOPICS}
    badge="Blog / Guide"
    shellClassName="kvc-guide-shell"
  >
    <div shuku-edit-id="e-827ca8c2-e315-47d0-b837-c2f04f0bf584" ref={frameRef} className="kvc-guide-frame" style={{ height: 900 * scale * outline.pages.length }}>
      <div shuku-edit-id="e-2329fc2c-5013-4d7d-824e-a41ad9e166d4" className="kvc-guide-surface" style={{ transform: `scale(${scale})` }}>{courseScenes.map(scene => <Fragment key={scene.id}>{scene.render({ complete: () => undefined, reset: () => undefined, isComplete: false })}</Fragment>)}</div>
    </div>
  </ModuleShell>;
}
