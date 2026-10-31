import { useEffect, useRef, useState } from 'react';
import './ShukuWebsiteShowcasePage.css';

/** Show the real course library, including its current course covers. */
export function ShukuWebsiteShowcasePage() {
  const iframe = useRef<HTMLIFrameElement>(null);
  const frame = useRef(0);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<'ready' | 'scrolling' | 'finished'>('ready');
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  async function loaded() {
    const doc = iframe.current?.contentDocument;
    if (!doc) return;
    // The library renders asynchronously; wait for actual course cards.
    const started = performance.now();
    while (!doc.querySelector('.sd-library-card') && performance.now() - started < 20000) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!iframe.current) return;
    }
    const images = Array.from(doc.querySelectorAll<HTMLImageElement>('.sd-library-cover img'));
    images.forEach(image => { image.loading = 'eager'; });
    await Promise.all(images.map(image => image.decode().catch(() => {})));
    if (iframe.current) setReady(true);
  }
  function scroll() {
    const win = iframe.current?.contentWindow;
    const doc = iframe.current?.contentDocument;
    if (!ready || !win || !doc || phase !== 'ready') return;
    setPhase('scrolling');
    const start = performance.now();
    const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 14000;
    function tick(now: number) {
      if (!win || !doc) return;
      const t = duration ? Math.min(1, (now - start) / duration) : 1;
      // Gentle acceleration and deceleration, with a steady middle passage.
      const progress = t * t * (3 - 2 * t);
      win.scrollTo(0, progress * Math.max(0, doc.documentElement.scrollHeight - win.innerHeight));
      if (t < 1) frame.current = requestAnimationFrame(tick);
      else setPhase('finished');
    }
    frame.current = requestAnimationFrame(tick);
  }
  return <section className="rf-page rf-shuku-website" data-capture-ready={ready} data-scroll-phase={phase} onClick={scroll} aria-label="术库课程网站，点击画面连续向下浏览">
    <div className="rf-shuku-browser">
      <iframe ref={iframe} src="/" title="术库 · 真实课程库" onLoad={loaded} tabIndex={-1} />
    </div>
  </section>;
}
