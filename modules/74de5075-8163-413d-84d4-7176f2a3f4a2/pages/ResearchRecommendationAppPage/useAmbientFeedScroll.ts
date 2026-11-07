import { useEffect, type RefObject } from 'react';

// Once handed over, a screen remains manual even when the visitor revisits the slide.
const handedOver = new Set<string>();

export function useAmbientFeedScroll(ref: RefObject<HTMLDivElement | null>, screen: string, enabled = true) {
 useEffect(() => {
  const viewport = ref.current;
  const content = viewport?.querySelector<HTMLElement>('[data-ambient-feed-content]');
  if (!enabled || !viewport || !content || handedOver.has(screen) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const surface = viewport.closest<HTMLElement>('[data-feed-screen]') || viewport;
  let stopped = false, visible = false;
  let animation: Animation | undefined;
  let start = viewport.scrollTop, distance = 0;
  const release = () => {
   if (!animation) return;
   // Read the fractional compositor position before removing the transform.
   const progress = animation?.effect?.getComputedTiming().progress || 0;
   const position = start + distance * progress;
   animation?.cancel();
   animation = undefined;
   content.style.willChange = '';
   viewport.scrollTop = position;
  };
  const stop = () => {
   if (stopped) return;
   stopped = true;
   handedOver.add(screen);
   release();
  };
  const resume = () => {
   if (stopped) return;
   if (!visible || document.hidden) { animation?.pause(); return; }
   if (!animation) {
    start = viewport.scrollTop;
    distance = Math.max(0, content.offsetHeight - viewport.clientHeight - start);
    if (!distance) return;
    content.style.willChange = 'transform';
    // Transform animation runs on the compositor and retains subpixel movement;
    // writing scrollTop each frame quantizes this slow motion to whole pixels.
    animation = content.animate([
     { transform: 'translate3d(0,0,0)' },
     { transform: `translate3d(0,${-distance}px,0)` },
    ], { duration: distance / 20 * 1000, delay: 1000, easing: 'linear', fill: 'both' });
    animation.onfinish = stop;
   } else { animation.play(); }
  };
  const observer = new IntersectionObserver(([entry]) => {
   visible = entry.isIntersecting && entry.intersectionRatio > .1;
   resume();
  }, { threshold: [0, .1] });
  const events = ['pointerenter', 'pointerdown', 'wheel', 'focusin', 'keydown'] as const;
  events.forEach(event => surface.addEventListener(event, stop, { passive: true }));
  document.addEventListener('visibilitychange', resume);
  if (surface.matches(':hover') || surface.contains(document.activeElement)) stop();
  observer.observe(viewport);
  return () => {
   observer.disconnect();
   events.forEach(event => surface.removeEventListener(event, stop));
   document.removeEventListener('visibilitychange', resume);
   release();
  };
 }, [ref, screen, enabled]);
}
