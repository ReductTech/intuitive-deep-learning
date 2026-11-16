import { useLayoutEffect, useRef, useState } from 'react';
import { EvacuationPage } from './pages/EvacuationPage/EvacuationPage';
import "@shuku/course-style/react/styles.css";
import "@shuku/course-style/react/ui-kit.css";
import "@shuku/course-style/react/presentation.css";
import './guide.css';

export function GuidePage() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => { const host = ref.current; if (!host) return; const update = () => setScale(Math.min(1, host.clientWidth / 1600)); const observer = new ResizeObserver(update); observer.observe(host); update(); return () => observer.disconnect(); }, []);
  return <main shuku-edit-id="e-d1d0c75d-fd27-4237-b49b-916404b3ce31" className="gd-guide"><div shuku-edit-id="e-42e36f86-7ab7-4968-83aa-1a1a9fd242bc" ref={ref} className="gd-guide-frame" style={{ height: 900 * scale }}><div shuku-edit-id="e-3764aed0-ce39-487b-8c72-0dcfc79304f0" className="course-page-surface gd-slide-surface" style={{ transform: `scale(${scale})` }}><EvacuationPage/></div></div></main>;
}
