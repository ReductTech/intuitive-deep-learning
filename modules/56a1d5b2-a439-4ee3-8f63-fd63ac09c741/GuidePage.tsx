import { useLayoutEffect, useRef, useState } from 'react';
import { EvacuationPage } from './pages/EvacuationPage/EvacuationPage';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import '../shared/react/presentation.css';
import './guide.css';

export function GuidePage() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => { const host = ref.current; if (!host) return; const update = () => setScale(Math.min(1, host.clientWidth / 1600)); const observer = new ResizeObserver(update); observer.observe(host); update(); return () => observer.disconnect(); }, []);
  return <main className="gd-guide"><div ref={ref} className="gd-guide-frame" style={{ height: 900 * scale }}><div className="course-page-surface gd-slide-surface" style={{ transform: `scale(${scale})` }}><EvacuationPage/></div></div></main>;
}
