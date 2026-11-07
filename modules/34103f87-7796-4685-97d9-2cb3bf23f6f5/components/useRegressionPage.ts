import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ActivityProps } from './AttentionActivity';

export function useRegressionPage(done: boolean, { onComplete, isComplete }: ActivityProps) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const [mathReady, setMathReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    void customElements.whenDefined('math-field').then(() => { if (mounted) setMathReady(true); });
    return () => { mounted = false; };
  }, []);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const sync = () => {
      const hidden = Boolean(element.closest('[aria-hidden="true"], [hidden]'));
      element.inert = hidden;
      setActive(!hidden && !document.hidden);
    };
    const observer = new MutationObserver(sync);
    for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
      observer.observe(ancestor, { attributes: true, attributeFilter: ['aria-hidden', 'hidden'] });
    }
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, []);
  useEffect(() => { if (active && done && !isComplete) onComplete(); }, [active, done, isComplete, onComplete]);
  const canAct = () => active && !document.hidden && Boolean(root.current)
    && !root.current?.closest('[aria-hidden="true"], [hidden], [inert]');
  return { root, active, mathReady, canAct };
}
