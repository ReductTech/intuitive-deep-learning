import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
export function LessonCanvas({ children, id, fitHeight = false }: { children: ReactNode; id?: string; fitHeight?: boolean }) {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    const resize = () => setScale(Math.min(1, element.clientWidth / 1600, fitHeight ? window.innerHeight / 900 : 1));
    const observer = new ResizeObserver(resize); observer.observe(element);
    window.addEventListener('resize', resize); resize();
    return () => { observer.disconnect(); window.removeEventListener('resize', resize); };
  }, [fitHeight]);
  return <div shuku-edit-id="e-dde33fea-401a-4187-b8b0-35971bc7653d" className="daa-canvas-frame" ref={frame} id={id} style={{ height: 900 * scale }}>
    <div shuku-edit-id="e-178c2758-8b03-4312-8dc3-c765626ca8b9" className="course-page-surface daa-slide-surface" style={{ transform: `scale(${scale})` }}>{children}</div>
  </div>;
}
