import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Typography } from "@shuku/course-style/react";

/** Presentation-owned timeline: finite, pausable and safe to reset. */
export function usePlayback(count: number, delay = 3200) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [revision, setRevision] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const visible = useRef(true);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { visible.current = entry.isIntersecting; if (!entry.isIntersecting) setPlaying(false); });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      if (document.hidden || !visible.current) return;
      setStep(s => {
        if (s >= count - 1) return s;
        return s + 1;
      });
    }, delay);
    const stop = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', stop);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', stop); };
  }, [playing, count, delay]);
  useEffect(() => { if (step === count - 1) setPlaying(false); }, [step, count]);
  function go(n: number) { setPlaying(false); setStep(Math.max(0, Math.min(count - 1, n))); }
  return { root, step, playing, revision, go, reset: () => { go(0); setRevision(r => r + 1); }, toggle: () => { if (step === count - 1) { setStep(0); setRevision(r => r + 1); } setPlaying(p => !p); }, count };
}
export type Playback = ReturnType<typeof usePlayback>;
export function PlaybackBar({ playback: p, label = '播放演示', hint }: { playback: Playback; label?: string; hint?: string }) {
  return <div shuku-edit-id="e-3dddb2c6-befa-4143-b0bd-c94b31eb1855" className="rf-playback" ref={p.root} title={hint}>
    <Button variant="primary" onClick={p.toggle} data-action="play" aria-label={p.playing ? '暂停演示' : label} title={p.playing ? '暂停演示' : p.step === p.count - 1 ? '重新播放' : label}>{p.playing ? <Pause size={20}/> : <Play size={20}/>}</Button>
    <Button onClick={() => p.go(p.step - 1)} disabled={p.step === 0} aria-label="上一步"><ChevronLeft size={20}/></Button>
    <div shuku-edit-id="e-b958d9cb-a921-4d2f-87c8-2cf1eb914496" className="rf-progress" aria-label={`演示进度 ${p.step + 1}/${p.count}`}>{Array.from({ length: p.count }, (_, i) => <button shuku-edit-id="e-b2c951a2-aab9-46ca-936e-27452fd845c5" key={i} aria-label={`跳到第 ${i+1} 步`} aria-pressed={p.step === i} className={i <= p.step ? 'is-done' : ''} onClick={() => p.go(i)}/>)}</div>
    <Typography shuku-edit-id="e-c107de13-778c-402c-a8b2-1eb02f989ccb" variant="bodySmall" tone="muted">{p.step + 1} / {p.count}</Typography>
    <Button onClick={() => p.go(p.step + 1)} disabled={p.step === p.count - 1} aria-label="下一步"><ChevronRight size={20}/></Button>
    <Button onClick={p.reset} aria-label="重置演示" title="重置演示"><RotateCcw size={18}/></Button>
  </div>;
}
