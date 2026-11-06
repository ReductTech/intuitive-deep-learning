import { useEffect, useRef, useState, type RefObject } from 'react';

export interface ClickStepAnimation {
  wait(ms: number): Promise<void>;
  until(predicate: () => boolean, timeout?: number): Promise<void>;
  animate(ms: number, update: (progress: number) => void): Promise<void>;
}

/** One presenter action plays one animation; completion never starts the next step. */
export function useClickSteps(rootRef: RefObject<HTMLElement | null>, advance: (animation: ClickStepAnimation) => Promise<void>, ready = true) {
  const latest = useRef({ advance, ready });
  latest.current = { advance, ready };
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let mounted = true, visible = false;
    const abort = new AbortController();
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: .25 });
    observer.observe(root);
    const animate = (ms: number, update: (progress: number) => void) => new Promise<void>((resolve, reject) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { update(1); resolve(); return; }
      let elapsed = 0, previous = performance.now();
      function tick(now: number) {
        if (abort.signal.aborted) { reject(new DOMException('演示已离开', 'AbortError')); return; }
        if (visible && !document.hidden) elapsed += now - previous;
        previous = now;
        const progress = ms ? Math.min(1, elapsed / ms) : 1;
        update(progress);
        if (progress === 1) resolve(); else requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
    const animation: ClickStepAnimation = {
      animate,
      wait: ms => animate(ms, () => {}),
      until: async (predicate, timeout = 30000) => {
        const started = performance.now();
        while (!predicate()) {
          if (abort.signal.aborted) throw new DOMException('演示已离开', 'AbortError');
          if (performance.now() - started > timeout) throw new Error('等待素材加载超时');
          await new Promise<void>(resolve => window.setTimeout(resolve, 50));
        }
      },
    };
    async function run() {
      if (locked.current || !latest.current.ready) return;
      locked.current = true; setBusy(true); delete root!.dataset.stepError;
      try { await latest.current.advance(animation); }
      catch (error) { if (!abort.signal.aborted) root!.dataset.stepError = String(error); }
      finally { locked.current = false; if (mounted) setBusy(false); }
    }
    const interactive = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest('button,a,input,textarea,select,[contenteditable="true"]'));
    const click = (event: MouseEvent) => {
      if (event.button !== 0 || interactive(event.target)) return;
      event.stopPropagation(); void run();
    };
    const key = (event: KeyboardEvent) => {
      if (!visible || document.hidden || interactive(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
      const rect = root!.getBoundingClientRect();
      if (rect.top > window.innerHeight / 2 || rect.bottom < window.innerHeight / 2) return;
      if (![' ', 'Enter'].includes(event.key)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (!event.repeat) void run();
    };
    root.addEventListener('click', click);
    window.addEventListener('keydown', key, true);
    return () => {
      mounted = false; abort.abort(); observer.disconnect();
      root.removeEventListener('click', click); window.removeEventListener('keydown', key, true);
    };
  }, [rootRef]);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.dataset.manualSteps = 'true';
    root.dataset.stepState = !ready ? 'loading' : busy ? 'playing' : 'waiting';
    root.dataset.captureReady = String(ready && !busy);
  }, [rootRef, ready, busy]);
  return { busy };
}
