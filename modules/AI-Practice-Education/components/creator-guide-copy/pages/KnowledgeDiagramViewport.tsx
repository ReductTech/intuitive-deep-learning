import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Button, Typography } from '../../../../shared/react';

type Point = { x: number; y: number };
export type DiagramView = Point & { scale: number };
type View = DiagramView;
const initialView: View = { x: 0, y: 0, scale: 1 };
const limitScale = (scale: number) => Math.max(.6, Math.min(40, scale));
const center = { x: 325, y: 277 };

type DiagramNote = { point: Point; text: string };

export function KnowledgeDiagramViewport({ children, note, renderLabels }: {
  children: ReactNode; note?: DiagramNote; renderLabels?: (view: DiagramView) => ReactNode;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const current = useRef<View>(initialView);
  const pointers = useRef(new Map<number, Point>());
  const [view, setView] = useState(initialView);
  const [dragging, setDragging] = useState(false);
  const descriptionId = useId();
  const noteId = useId();
  const [noteOpen, setNoteOpen] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const noteBox = useRef<HTMLDivElement>(null);
  const [noteHeight, setNoteHeight] = useState(180);
  useLayoutEffect(() => {
    if (!surface.current) return;
    const element = surface.current;
    const update = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    if (!noteOpen || !noteBox.current) return;
    const element = noteBox.current;
    const update = () => setNoteHeight(element.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [noteOpen, note?.text]);

  function commit(next: View) {
    // Keep some of the diagram's coordinate space within reach of the viewport.
    const bounded = { ...next,
      x: Math.max(80 - 650 * next.scale, Math.min(570, next.x)),
      y: Math.max(60 - 550 * next.scale, Math.min(490, next.y)),
    };
    current.current = bounded;
    setView(bounded);
  }

  function localPoint(clientX: number, clientY: number): Point {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return center;
    // Includes the parent slide's CSS scaling and SVG letterboxing.
    const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
    // DOMPoint's coordinates are accessors, so object spread would lose them.
    return { x: point.x, y: point.y };
  }

  function zoom(factor: number, anchor: Point = center) {
    const previous = current.current;
    const scale = limitScale(previous.scale * factor);
    const ratio = scale / previous.scale;
    commit({ scale, x: anchor.x - (anchor.x - previous.x) * ratio, y: anchor.y - (anchor.y - previous.y) * ratio });
  }

  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    function wheel(event: WheelEvent) {
      event.preventDefault();
      event.stopPropagation();
      const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 550 : 1;
      const delta = Math.max(-400, Math.min(400, event.deltaY * units));
      zoom(Math.exp(-delta * .0025), localPoint(event.clientX, event.clientY));
    }
    function cancelDrag() {
      pointers.current.clear();
      setDragging(false);
    }
    // Use the full HTML surface, including SVG letterboxing and labels.
    // Window listeners retain the drag when the pointer leaves the diagram.
    element.addEventListener('pointerdown', pointerDown, true);
    element.addEventListener('wheel', wheel, { passive: false, capture: true });
    window.addEventListener('pointermove', pointerMove, true);
    window.addEventListener('pointerup', pointerEnd, true);
    window.addEventListener('pointercancel', pointerEnd, true);
    window.addEventListener('blur', cancelDrag);
    return () => {
      element.removeEventListener('pointerdown', pointerDown, true);
      element.removeEventListener('wheel', wheel, true);
      window.removeEventListener('pointermove', pointerMove, true);
      window.removeEventListener('pointerup', pointerEnd, true);
      window.removeEventListener('pointercancel', pointerEnd, true);
      window.removeEventListener('blur', cancelDrag);
    };
  }, []);

  function gesture() {
    const [a, b] = [...pointers.current.values()];
    return b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distance: Math.hypot(a.x - b.x, a.y - b.y) } : { x: a.x, y: a.y, distance: 0 };
  }

  function pointerDown(event: PointerEvent) {
    if ((event.target as Element).closest('[data-diagram-note]')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    setNoteOpen(false);
    event.preventDefault();
    event.stopPropagation();
    pointers.current.set(event.pointerId, localPoint(event.clientX, event.clientY));
    surface.current?.focus({ preventScroll: true });
    setDragging(true);
  }

  function pointerMove(event: PointerEvent) {
    if (!pointers.current.has(event.pointerId)) return;
    if (event.pointerType === 'mouse' && !(event.buttons & 1)) {
      pointerEnd(event);
      return;
    }
    const before = gesture();
    pointers.current.set(event.pointerId, localPoint(event.clientX, event.clientY));
    const after = gesture();
    const previous = current.current;
    const scale = before.distance > 0 ? limitScale(previous.scale * after.distance / before.distance) : previous.scale;
    const ratio = scale / previous.scale;
    commit({ scale, x: after.x - (before.x - previous.x) * ratio, y: after.y - (before.y - previous.y) * ratio });
  }

  function pointerEnd(event: PointerEvent) {
    pointers.current.delete(event.pointerId);
    setDragging(pointers.current.size > 0);
  }

  function reset() {
    pointers.current.clear();
    setDragging(false);
    commit(initialView);
  }

  // Use the same padded frame for every era, so the larger future frontier
  // remains fully visible without cancelling its size difference by auto-fit.
  const diagramScale = Math.min(size.width / 700, size.height / 650);
  const anchor = note ? {
    x: (size.width - 700 * diagramScale) / 2 + (note.point.x * view.scale + view.x + 25) * diagramScale + 12,
    y: (size.height - 650 * diagramScale) / 2 + (note.point.y * view.scale + view.y + 50) * diagramScale - 10,
  } : null;
  const noteVisible = anchor && anchor.x >= 0 && anchor.x <= size.width - 24 && anchor.y >= 0 && anchor.y <= size.height - 24;
  const noteWidth = Math.min(260, size.width - 24);
  const noteLeft = anchor ? Math.max(12, Math.min(anchor.x - noteWidth + 24, size.width - noteWidth - 12)) : 0;
  const noteTop = anchor ? Math.max(8, Math.min(anchor.y + 32, size.height - noteHeight - 8)) : 0;

  return <div ref={surface} className="aipe-replay-cg-k-viewport" data-scale={view.scale.toFixed(3)} data-zoomed={view.scale > 1.5} data-dragging={dragging}
      tabIndex={0} role="group" aria-label="可拖拽缩放的知识图" aria-describedby={descriptionId}
      onDoubleClick={event => { event.preventDefault(); event.stopPropagation(); }}
      onKeyDown={event => {
        if ((event.target as Element).closest('[data-diagram-note]')) return;
        const pan: Record<string, Point> = { ArrowLeft: { x: 32, y: 0 }, ArrowRight: { x: -32, y: 0 }, ArrowUp: { x: 0, y: 32 }, ArrowDown: { x: 0, y: -32 } };
        if (pan[event.key] || ['+', '=', '-', '0', 'Home'].includes(event.key)) event.stopPropagation();
        if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(1.4); }
        else if (event.key === '-') { event.preventDefault(); zoom(1 / 1.4); }
        else if (event.key === '0' || event.key === 'Home') { event.preventDefault(); reset(); }
        else if (pan[event.key]) { event.preventDefault(); commit({ ...current.current, x: current.current.x + pan[event.key].x, y: current.current.y + pan[event.key].y }); }
      }}>
    <svg ref={svg} className="aipe-replay-cg-k-growth-circle" viewBox="-25 -50 700 650" role="img"
      aria-label="蓝色为个人已理解的知识，橙色为新的贡献">
      <desc id={descriptionId}>按住鼠标左键拖动，滚轮缩放。也可使用方向键平移，加减键缩放，零键复位。切换时代保留当前视角。</desc>
      <rect x="-25" y="-50" width="700" height="650" fill="transparent" pointerEvents="all" />
      <g className="aipe-replay-cg-k-diagram-world" pointerEvents="none" transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>{children}</g>
      {renderLabels?.(view)}
    </svg>
    {note && anchor && noteVisible && <div data-diagram-note className="aipe-replay-cg-k-tip-note" style={{ left: anchor.x, top: anchor.y }}
      onMouseEnter={() => setNoteOpen(true)} onMouseLeave={() => setNoteOpen(false)}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setNoteOpen(false); }}
      onKeyDown={event => { if (event.key === 'Escape') { setNoteOpen(false); event.stopPropagation(); } }}>
      <Button className="aipe-replay-cg-k-tip-question" aria-label="为什么可能难以抵达知识前沿？" aria-describedby={noteOpen ? noteId : undefined}
        onFocus={() => setNoteOpen(true)} onClick={() => setNoteOpen(true)}>
        <svg className="aipe-replay-cg-k-tip-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M5 5a3 3 0 0 1 6 0c0 2-3 2-3 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="8" cy="12" r="1" fill="currentColor" />
        </svg>
      </Button>
      {noteOpen && <div ref={noteBox} id={noteId} role="tooltip" className="aipe-replay-cg-k-tip-popover"
        style={{ width: noteWidth, left: noteLeft - anchor.x, top: noteTop - anchor.y }}>
        <Typography variant="bodySmall">{note.text}</Typography>
      </div>}
    </div>}
  </div>;
}
