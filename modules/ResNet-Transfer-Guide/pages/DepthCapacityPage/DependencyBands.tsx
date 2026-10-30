import { useLayoutEffect, useState, type RefObject } from 'react';
import { dependencyPolygons, gridRegionRect, layerSize, traceReceptiveField, type Cell, type ConvDepth, type MapRect } from './receptiveField';

interface Props {
  hostRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLDivElement | null>;
  previousRef: RefObject<HTMLDivElement | null>;
  outputRef: RefObject<HTMLDivElement | null>;
  depth: ConvDepth;
  cell: Cell;
}
interface Layout { width: number; height: number; boxes: [MapRect, MapRect, MapRect]; }

export function DependencyBands({ hostRef, inputRef, previousRef, outputRef, depth, cell }: Props) {
  const [layout, setLayout] = useState<Layout | null>(null);
  useLayoutEffect(() => {
    const host = hostRef.current;
    const maps = [inputRef.current, previousRef.current, outputRef.current];
    if (!host || maps.some(map => !map)) return;
    const readLayout = () => {
      const hostBox = host.getBoundingClientRect();
      if (!host.clientWidth || !host.clientHeight || !hostBox.width || !hostBox.height) return;
      // Convert rendered coordinates back to the 1600×900 logical canvas.
      const sx = hostBox.width / host.clientWidth, sy = hostBox.height / host.clientHeight;
      const boxes = maps.map(map => {
        const element = map!, rect = element.getBoundingClientRect();
        return {
          left: (rect.left - hostBox.left) / sx + element.clientLeft,
          top: (rect.top - hostBox.top) / sy + element.clientTop,
          width: element.clientWidth, height: element.clientHeight,
        };
      }) as [MapRect, MapRect, MapRect];
      const next: Layout = { width: host.clientWidth, height: host.clientHeight, boxes };
      setLayout(current => JSON.stringify(current) === JSON.stringify(next) ? current : next);
    };
    readLayout();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(readLayout);
    observer.observe(host);
    maps.forEach(map => {
      observer.observe(map!);
      if (map!.parentElement) observer.observe(map!.parentElement!);
    });
    return () => observer.disconnect();
  }, [hostRef, inputRef, previousRef, outputRef, depth]);

  if (!layout) return null;
  const polygons = dependencyPolygons(layout.boxes, depth, cell);
  const middle = gridRegionRect(layout.boxes[1], layerSize((depth - 1) as 0 | 1 | 2), 4, traceReceptiveField(depth, cell).previous);
  return <svg className="rtg-depth-capacity__dependency-bands"
    viewBox={'0 0 ' + layout.width + ' ' + layout.height} preserveAspectRatio="none" aria-hidden="true">
    {polygons.map((points, index) => <polygon key={index} points={points} />)}
    <rect x={middle.left} y={middle.top} width={middle.width} height={middle.height} />
  </svg>;
}
