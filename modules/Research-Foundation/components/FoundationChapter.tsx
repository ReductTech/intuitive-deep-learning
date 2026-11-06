import { useEffect, useRef } from 'react';
import { Typography } from '../../shared/react';
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
  return <section ref={root} className="rf-page rf-chapter" aria-label={`研究基础${number}：${title}`} data-chapter={index}>
    <div className="rf-chapter-copy">
      <Typography variant="subtitle" className="rf-chapter-label">研究基础{number}</Typography>
      <Typography as="h1" variant="display" className="rf-chapter-title">{title}</Typography>
      <Typography variant="subtitle" className="rf-chapter-description">{description}</Typography>
    </div>
    <Typography as="span" variant="display" className="rf-chapter-index" aria-hidden="true">{index}</Typography>
    <div className="rf-chapter-topics" aria-label="本章内容">{topics.map(topic => <Typography key={topic} variant="body" className="rf-chapter-topic">{topic}</Typography>)}</div>
  </section>;
}
