/** One synchronized timeline: an expanding page frame, uniform FLIP motion, then a drawn grid. */
export function playAssemblyTimeline(host: HTMLElement, overlay: HTMLElement, onStep: (step: number) => void, onReady: () => void) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animations: Animation[] = [];
  const nodes: Element[] = [];
  const rootRect = host.getBoundingClientRect();
  const ratio = rootRect.width / 1600;
  const rect = (element: Element) => {
    const r = element.getBoundingClientRect();
    return { x: (r.left - rootRect.left) / ratio, y: (r.top - rootRect.top) / ratio, width: r.width / ratio, height: r.height / ratio };
  };
  const find = (selector: string) => host.querySelector<HTMLElement>(selector);
  const animate = (element: Element | null, frames: Keyframe[], delay: number, duration: number, easing = 'cubic-bezier(.22,1,.36,1)') => {
    if (!element) return;
    const animation = element.animate(frames, { delay, duration, easing, fill: 'both' });
    animations.push(animation);
    return animation;
  };
  const reveal = (selector: string, delay: number, duration = 500, rise = 8) => {
    host.querySelectorAll(selector).forEach((element, index) => animate(element, [
      { opacity: 0, transform: `translateY(${rise}px)` }, { opacity: 1, transform: 'translateY(0)' },
    ], delay + index * 70, duration));
  };
  const moveFrom = (targetSelector: string, sourceSelector: string, delay: number, duration: number, bend = 0) => {
    const target = find(targetSelector), source = find(sourceSelector);
    if (!target || !source) return;
    const from = rect(source), to = rect(target);
    const startScale = Math.min(.8, Math.max(.32, from.width / to.width));
    const sx = from.x, sy = from.y;
    const ex = to.x, ey = to.y;
    const frames: Keyframe[] = Array.from({ length: 51 }, (_, index) => {
      const t = index / 50, u = 1 - t;
      const x = u ** 3 * sx + 3 * u ** 2 * t * (sx + (ex - sx) * .25) + 3 * u * t ** 2 * (sx + (ex - sx) * .75) + t ** 3 * ex;
      const y = u ** 3 * sy + 3 * u ** 2 * t * (sy + bend) + 3 * u * t ** 2 * (ey + bend) + t ** 3 * ey;
      return { offset: t, transform: `translate(${x - ex}px,${y - ey}px) scale(${startScale + (1 - startScale) * t})`, opacity: Math.min(1, t * 8) };
    });
    target.style.transformOrigin = 'top left';
    animate(target, frames, delay, duration);
  };

  const catalog = find('.cg-assembly-catalog');
  const result = find('.cg-kit-result-shell');
  if (reduced) {
    animate(catalog, [{ opacity: 1 }, { opacity: 0 }], 0, 350);
    animate(result, [{ opacity: 0 }, { opacity: 1 }], 100, 350);
  } else {
    // The template itself becomes a full-page frame; text is never stretched into a bitmap.
    const template = find('.cg-kit-template-page');
    if (template) {
      const from = rect(template);
      const frame = document.createElement('div');
      frame.className = 'cg-assembly-expanding-frame'; overlay.append(frame); nodes.push(frame);
      const blueprint = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      blueprint.setAttribute('viewBox', '0 0 1600 900'); blueprint.classList.add('cg-assembly-blueprint');
      for (const d of ['M40 40h300v115H40Z M40 212h270 M40 264h240', 'M432 43h795v820H432Z', 'M1248 120h320v670h-320Z M1270 390h274v76h-274Z']) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d); path.setAttribute('pathLength', '1'); blueprint.append(path);
        animate(path, [{ strokeDashoffset: '1' }, { strokeDashoffset: '0' }], 200, 1200, 'ease-in-out');
      }
      frame.append(blueprint);
      animate(frame, [
        { left: `${from.x}px`, top: `${from.y}px`, width: `${from.width}px`, height: `${from.height}px`, borderRadius: '11px', opacity: 0 },
        { left: `${from.x}px`, top: `${from.y}px`, width: `${from.width}px`, height: `${from.height}px`, borderRadius: '11px', opacity: 1, offset: .15 },
        { left: '0px', top: '0px', width: '1600px', height: '900px', borderRadius: '0px', opacity: 1 },
      ], 200, 1450);
      animate(frame, [{ opacity: 1, borderColor: '#b3cbe9' }, { opacity: 0, borderColor: 'transparent' }], 2500, 1100);
    }
    animate(catalog, [{ opacity: 1 }, { opacity: 0 }], 500, 750);
    // FLIP the actual finished elements, with uniform scaling and a shared easing curve.
    moveFrom('.cg-built-gomoku__intro', '.cg-kit-tone-grid>div:first-child', 600, 1050, -15);
    moveFrom('.cg-built-gomoku__board', '.cg-kit-template-knowledge', 750, 1350, 0);
    moveFrom('.cg-built-gomoku__difficulty-options', '.cg-kit-demo:nth-child(4) .cg-kit-demo-control', 1250, 1250, 10);
    reveal('.cg-built-gomoku__brief', 1800, 550);
    animate(find('.cg-built-gomoku__background-video'), [{ opacity: 0 }, { opacity: 1 }], 2500, 1200);
    const status = find('.cg-built-gomoku__status');
    animate(status, [
      { background: 'rgba(248,251,255,0)', borderColor: 'transparent', boxShadow: 'none' },
      { background: 'rgba(248,251,255,.93)', borderColor: 'rgba(94,142,207,.2)', boxShadow: '0 18px 38px rgba(36,67,109,.12)' },
    ], 2050, 650);
    reveal('.cg-built-gomoku__panel-heading,.cg-built-gomoku__status-player,.cg-built-gomoku__status-situation,.cg-built-gomoku__control-heading,.cg-built-gomoku__difficulty>p,.cg-built-gomoku__actions>strong', 2250, 450);
    reveal('.cg-built-gomoku__actions>.edu-btn', 2600, 400);
    reveal('.cg-built-gomoku__board-axis', 2770, 450, 0);
    reveal('.cg-built-gomoku__board-canvas', 3160, 200, 0);
    animate(find('.cg-built-gomoku__actions'), [{ borderColor: 'transparent' }, { borderColor: 'rgba(64,112,177,.18)' }], 2600, 400);
    const board = find('.cg-built-gomoku__board');
    if (board) {
      const veil = document.createElement('div');
      veil.className = 'cg-assembly-board-veil'; board.append(veil); nodes.push(veil);
      animate(veil, [{ opacity: 1 }, { opacity: 0 }], 1600, 650);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.classList.add('cg-assembly-grid-drawing'); svg.setAttribute('viewBox', '0 0 1000 1000');
      svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
      board.append(svg); nodes.push(svg);
      for (let index = 0; index < 15; index++) {
        const p = 75 + index * 850 / 14;
        for (const vertical of [false, true]) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          for (const [key, value] of Object.entries(vertical ? { x1: p, x2: p, y1: 75, y2: 925 } : { x1: 75, x2: 925, y1: p, y2: p })) line.setAttribute(key, String(value));
          line.setAttribute('stroke', 'rgba(126,98,58,.4)'); line.setAttribute('stroke-width', '1.3');
          line.style.strokeDasharray = '850';
          svg.append(line);
          animate(line, [{ strokeDashoffset: '850', opacity: 0 }, { strokeDashoffset: '0', opacity: 1 }], 2100 + index * 19 + (vertical ? 120 : 0), 580, 'cubic-bezier(.4,0,.2,1)');
        }
      }
      animate(svg, [{ opacity: 1 }, { opacity: 0 }], 3160, 230);
    }
  }

  // A single playhead drives completion and captions, and pauses every track together offscreen.
  const clock = host.animate([{ opacity: 1 }, { opacity: 1 }], { duration: reduced ? 500 : 4100, fill: 'both' });
  animations.push(clock);
  let disposed = false, frameId = 0, previousStep = -1;
  const tick = () => {
    if (disposed) return;
    const time = Number(clock.currentTime ?? 0);
    const step = time < 1250 ? 0 : time < 2200 ? 1 : 2;
    if (step !== previousStep) { previousStep = step; onStep(step); }
    frameId = requestAnimationFrame(tick);
  };
  frameId = requestAnimationFrame(tick);
  clock.onfinish = () => { if (!disposed) onReady(); };
  const onVisibility = () => animations.forEach(animation => { if (document.hidden) animation.pause(); else if (animation.playState === 'paused') animation.play(); });
  document.addEventListener('visibilitychange', onVisibility);
  if (document.hidden) onVisibility();
  return () => {
    disposed = true; cancelAnimationFrame(frameId); document.removeEventListener('visibilitychange', onVisibility);
    animations.forEach(animation => { animation.onfinish = null; animation.cancel(); });
    nodes.forEach(node => node.remove());
    host.querySelectorAll<HTMLElement>('.cg-built-gomoku__intro,.cg-built-gomoku__board,.cg-built-gomoku__difficulty-options').forEach(element => element.style.removeProperty('transform-origin'));
  };
}
