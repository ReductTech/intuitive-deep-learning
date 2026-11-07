import { useEffect, useRef, useState } from 'react';

export const PIPELINE_DURATION = 60;
export const pipelineChapters = ['每日调度', '获取 PDF', '自研解析', '提取图表', '大纲与机构', '结构化入库'];

/** A presentation clock; never invokes a scheduler or changes backend state. */
export function usePipelinePlayback() {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const elapsedRef = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const visible = useRef(true);
  const seek = (second: number) => {
    const next = Math.max(0, Math.min(PIPELINE_DURATION, second));
    elapsedRef.current = next;
    setElapsed(next);
    setPlaying(false);
  };
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
      if (!entry.isIntersecting) setPlaying(false);
    });
    if (root.current) observer.observe(root.current);
    const onVisibility = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (!visible.current || document.hidden) { setPlaying(false); return; }
      // RAF may carry a timestamp just before the effect's performance.now().
      const delta = Math.max(0, Math.min(.2, (now - last) / 1000));
      const next = Math.min(PIPELINE_DURATION, Math.max(0, elapsedRef.current + delta));
      last = now;
      elapsedRef.current = next;
      setElapsed(next);
      if (next >= PIPELINE_DURATION) { setPlaying(false); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  const toggle = () => {
    if (elapsedRef.current >= PIPELINE_DURATION) { elapsedRef.current = 0; setElapsed(0); }
    setPlaying(value => !value);
  };
  return { root, elapsed, playing, phase: Math.max(0, Math.min(5, Math.floor(elapsed / 10))), seek, toggle, pause: () => setPlaying(false) };
}
