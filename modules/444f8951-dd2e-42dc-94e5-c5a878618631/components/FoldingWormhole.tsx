import { useEffect, useRef, useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import './FoldingWormhole.css';
import { FoldingPaperScene } from './FoldingPaperScene';

export function FoldingWormhole() {
  const host = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const [replay, setReplay] = useState(0);
  const [mode, setMode] = useState<'flat' | 'folded'>('flat');

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const duration = mode === 'flat' ? 3000 : 4500;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setElapsed(duration); return; }
    let visible = false, total = 0, previous = 0, lastPaint = 0, frame = 0;
    setElapsed(0);
    const tick = (now: number) => {
      if (previous) total += Math.min(80, now - previous);
      previous = now;
      if (now - lastPaint >= 32 || total >= duration) { setElapsed(Math.min(total, duration)); lastPaint = now; }
      if (visible && !document.hidden && total < duration) frame = requestAnimationFrame(tick);
    };
    const resume = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      if (visible && !document.hidden && total < duration) frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); }, { threshold: .2 });
    observer.observe(element);
    document.addEventListener('visibilitychange', resume);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener('visibilitychange', resume); };
  }, [replay, mode]);

  const travel = Math.max(0, Math.min(1, (elapsed - (mode === 'flat' ? 300 : 2900)) / (mode === 'flat' ? 2400 : 1200)));
  const stage = mode === 'flat' ? (travel < 1 ? '先沿纸面，从 A 走到 B' : '走到了 B；点击“折叠”试试捷径') : elapsed < 1900 ? '纸面正在对折' : elapsed < 2750 ? '虫洞通道张开' : travel < 1 ? '沿虫洞曲面，从 A 经喉部走到 B' : '沿虫洞曲面，到达了 B';
  const foldPaper = () => { setElapsed(0); setMode('folded'); setReplay(value => value + 1); };
  const restart = () => { setElapsed(0); setMode('flat'); setReplay(value => value + 1); };
  return <div shuku-edit-id="e-097b7d40-96e1-4208-bc5f-80505939733c" className="cg-folding-wormhole" ref={host}>
    <FoldingPaperScene mode={mode} elapsed={elapsed} resetVersion={replay} />
    <div shuku-edit-id="e-21799fd4-1a93-48a9-aedb-72e2cfd2216e" className="cg-folding-footer"><Typography shuku-edit-id="e-df186d74-7ed3-4475-b778-dd12715569ad" variant="bodySmall" tone="accent">{stage}</Typography><div shuku-edit-id="e-60c3e6cc-212b-4684-b079-8b0c637fcf54" className="cg-folding-actions">{mode === 'flat' ? <Button variant="primary" disabled={travel < 1} onClick={foldPaper}><Typography shuku-edit-id="e-58050130-2cb2-4954-9cf2-8fea3ed3ca8c" as="span" variant="bodySmall" tone="inherit">折叠</Typography></Button> : <Button disabled={elapsed < 4100} onClick={restart}><Typography shuku-edit-id="e-d5e1b2c9-9ec7-4dd8-b586-d6f811274e34" as="span" variant="bodySmall" tone="inherit">展开重来</Typography></Button>}</div></div>
  </div>;
}
