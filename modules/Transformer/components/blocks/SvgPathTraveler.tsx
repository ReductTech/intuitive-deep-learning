import { useLayoutEffect, useRef, type ReactNode } from 'react';
interface SvgPathTravelerProps {
    path: string;
    durationMs: number;
    className: string;
    children: ReactNode;
}
/** Move an SVG group along a rendered path without relying on SMIL support. */
export function SvgPathTraveler({ path, durationMs, className, children }: SvgPathTravelerProps) {
    const guideRef = useRef<SVGPathElement>(null);
    const travelerRef = useRef<SVGGElement>(null);
    useLayoutEffect(() => {
        const guide = guideRef.current;
        const traveler = travelerRef.current;
        if (!guide || !traveler)
            return;
        const total = guide.getTotalLength();
        const place = (fraction: number) => {
            const point = guide.getPointAtLength(total * fraction);
            traveler.setAttribute('transform', `translate(${point.x} ${point.y})`);
        };
        place(0);
        const effectiveDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 150 : durationMs;
        const start = performance.now();
        let frame = 0;
        const tick = (now: number) => {
            const progress = Math.min(1, (now - start) / effectiveDuration);
            place(progress);
            if (progress < 1)
                frame = window.requestAnimationFrame(tick);
        };
        frame = window.requestAnimationFrame(tick);
        return () => window.cancelAnimationFrame(frame);
    }, [path, durationMs]);
    return <>
    <path ref={guideRef} d={path} style={{ fill: 'none', stroke: 'none', pointerEvents: 'none' }}/>
    <g ref={travelerRef} className={className}>{children}</g>
  </>;
}
