import { useEffect, useRef, useState } from 'react';
import { Button, Typography } from '../../shared/react';

/** Time advances the explanation; scrolling only determines whether it is being read. */
export function useLecturePlayback(count: number, dwell = 1000, waitAt?: number) {
  const [stage, setStage] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const waiting = stage === waitAt && !interacted;
  const [finished, setFinished] = useState(false);
  const [visible, setVisible] = useState(false);
  const [foreground, setForeground] = useState(!document.hidden);
  const anchor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = anchor.current?.closest('.course-page-surface, .ppt-slide-surface') ?? anchor.current?.parentElement;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.45), { threshold: [0, 0.45] });
    observer.observe(element);
    const visibility = () => setForeground(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (!visible || !foreground || finished || waiting || stage >= count - 1) return;
    const timer = window.setTimeout(() => setStage(value => Math.min(count - 1, value + 1)), dwell);
    return () => window.clearTimeout(timer);
  }, [visible, foreground, finished, stage, count, dwell, waiting]);
  useEffect(() => {
    if (stage >= count - 1) setFinished(true);
  }, [stage, count]);
  const controls = <div ref={anchor} data-playback-mode={finished ? 'review' : 'auto'} style={{ display: 'flex', gap: 12, minWidth: 0, maxWidth: '100%' }}>
    {waiting && <Typography as="span" variant="bodySmall" tone="muted">拖动滑块，比较两个分布</Typography>}
    {finished && <>
      <Button disabled={stage === 0} onClick={() => setStage(value => Math.max(0, value - 1))}>上一段</Button>
      <Button variant="primary" disabled={stage >= count - 1} onClick={() => setStage(value => Math.min(count - 1, value + 1))}>下一段</Button>
    </>}
  </div>;
  return { stage, controls, resumeAfterAction: () => setInteracted(true) };
}
