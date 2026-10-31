import { useEffect, useRef, type RefObject } from 'react';
import './FullscreenLaserPointer.css';

/** Presentation-only right-button pointer; movement never rerenders the lesson. */
export function FullscreenLaserPointer({ viewport }: { viewport: RefObject<HTMLDivElement | null> }) {
  const dot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const surface = viewport.current, laser = dot.current;
    if (!surface || !laser) return;
    let pointer: number | null = null;
    const move = (event: PointerEvent) => {
      if (pointer !== event.pointerId) return;
      if (!(event.buttons & 2)) { hide(); return; }
      const rect = surface.getBoundingClientRect();
      laser.style.transform = `translate(${event.clientX - rect.left}px, ${event.clientY - rect.top}px)`;
    };
    const hide = () => {
      laser.hidden = true;
      surface.classList.remove('cw-laser-active');
      const previous = pointer; pointer = null;
      if (previous !== null && surface.hasPointerCapture(previous)) surface.releasePointerCapture(previous);
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 2 || document.fullscreenElement !== surface) return;
      event.preventDefault(); event.stopPropagation();
      pointer = event.pointerId;
      surface.setPointerCapture(pointer);
      move(event); laser.hidden = false;
      surface.classList.add('cw-laser-active');
    };
    const context = (event: MouseEvent) => { event.preventDefault(); };
    surface.addEventListener('pointerdown', down, true);
    surface.addEventListener('pointermove', move, true);
    surface.addEventListener('pointerup', hide, true);
    surface.addEventListener('pointercancel', hide);
    surface.addEventListener('lostpointercapture', hide);
    surface.addEventListener('contextmenu', context);
    window.addEventListener('blur', hide);
    return () => {
      hide();
      surface.removeEventListener('pointerdown', down, true);
      surface.removeEventListener('pointermove', move, true);
      surface.removeEventListener('pointerup', hide, true);
      surface.removeEventListener('pointercancel', hide);
      surface.removeEventListener('lostpointercapture', hide);
      surface.removeEventListener('contextmenu', context);
      window.removeEventListener('blur', hide);
    };
  }, [viewport]);
  return <div ref={dot} className="cw-laser-pointer" hidden aria-hidden="true" />;
}
