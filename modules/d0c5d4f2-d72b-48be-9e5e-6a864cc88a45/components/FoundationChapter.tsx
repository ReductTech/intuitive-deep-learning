import { useEffect, useRef } from 'react';
import { Typography } from "@shuku/course-style/react";
import './FoundationChapter.css';

type Props = { number: '一' | '二' | '三' | '四' | '五'; index: string; title: string; description: string; topics: string[]; onComplete?: () => void };

export function FoundationChapter({ number, index, title, description, topics, onComplete }: Props) {
  const root = useRef<HTMLElement>(null), complete = useRef(onComplete);
  complete.current = onComplete;
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let timer: number | undefined, started = 0, remaining = 2800, intersecting = false, finished = false;
    const stop = () => {
      if (timer === undefined) return;
      window.clearTimeout(timer); timer = undefined;
      remaining = Math.max(0, remaining - (performance.now() - started));
    };
    const update = () => {
      if (!intersecting || document.hidden) { stop(); return; }
      if (finished || timer !== undefined) return;
      started = performance.now();
      timer = window.setTimeout(() => { timer = undefined; finished = true; complete.current?.(); }, remaining);
    };
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; update(); });
    observer.observe(element); document.addEventListener('visibilitychange', update);
    return () => { stop(); observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  return <section shuku-edit-id="e-53db392a-a649-486b-8d3a-55986e4cfe66" ref={root} className="rf-page rf-chapter" aria-label={`研究基础${number}：${title}`} data-chapter={index}>
    <div shuku-edit-id="e-b89b8623-ad49-4a16-a880-c1ef0aaa9178" className="rf-chapter-copy">
      <Typography shuku-edit-id="e-1037bd61-0aca-4a06-a116-bab974d8f864" variant="subtitle" className="rf-chapter-label">研究基础{number}</Typography>
      <Typography shuku-edit-id="e-3eb65089-ce1c-4dbb-9a67-35704dd589bf" as="h1" variant="display" className="rf-chapter-title">{title}</Typography>
      <Typography shuku-edit-id="e-de1d68d0-91af-40ae-8e9c-e30140a8a2e6" variant="subtitle" className="rf-chapter-description">{description}</Typography>
    </div>
    <Typography shuku-edit-id="e-c56f8973-9130-46a0-8774-03d4d8383817" as="span" variant="display" className="rf-chapter-index" aria-hidden="true">{index}</Typography>
    <div shuku-edit-id="e-da162000-e040-4d48-a9d4-c515e5dba0a1" className="rf-chapter-topics" aria-label="本章内容">{topics.map(topic => <Typography shuku-edit-id="e-17a58bee-e5cc-4880-b059-435087a4cc37" key={topic} variant="body" className="rf-chapter-topic">{topic}</Typography>)}</div>
  </section>;
}
