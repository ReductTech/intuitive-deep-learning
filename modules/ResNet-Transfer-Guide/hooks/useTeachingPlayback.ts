import { useEffect, useRef, useState } from 'react';

// Three semantic frames; cancelling/replaying invalidates callbacks from an older run.
export function useTeachingPlayback(intervalMs = 260) {
  const [frame, setFrame] = useState(0), [playing, setPlaying] = useState(false), [run, setRun] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    if (!playing) return;
    const token = generation.current;
    let disposed = false;
    const timer = window.setInterval(() => {
      if (disposed || token !== generation.current) return;
      setFrame(previous => Math.min(3, previous + 1));
    }, intervalMs);
    return () => { disposed = true; window.clearInterval(timer); };
  }, [playing, run, intervalMs]);
  useEffect(() => { if (playing && frame === 3) setPlaying(false); }, [frame, playing]);
  function play() {
    generation.current += 1; setRun(previous => previous + 1);
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setFrame(reduced ? 3 : 0); setPlaying(!reduced);
  }
  function reset() {
    generation.current += 1; setFrame(0); setPlaying(false); setRun(previous => previous + 1);
  }
  return { frame, playing, run, play, reset };
}
