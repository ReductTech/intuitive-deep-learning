import { useId, useLayoutEffect, useRef, useState } from 'react';
import { WarehouseMap } from '../../components/WarehouseMap';
import { keyOf } from '../../model';
import { type DqnEvaluation } from '../../dqnSimulation';
import { TRAP } from '../QLearningLoopPage/qLearningSimulation';
import emptyStation from '../../assets/cover-v2/receiving-station-empty.png';
import loadedStation from '../../assets/cover-v2/receiving-station-loaded.png';
import pitArt from '../../assets/cover-v2/maintenance-pit.png';

export function DqnValidationMap({ result, index, before }: { result: DqnEvaluation; index: number; before: DqnEvaluation }) {
  const id = useId().replace(/:/g, ''), color = result.outcome === 'delivered' ? 'var(--ui-success)' : 'var(--ui-accent-alt)';
  const svgRef = useRef<SVGSVGElement>(null), [board, setBoard] = useState({ width: 278, height: 278 });
  useLayoutEffect(() => {
    if (!svgRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBoard(previous => previous.width === width && previous.height === height ? previous : { width, height });
    });
    observer.observe(svgRef.current); return () => observer.disconnect();
  }, []);
  const points = (route: DqnEvaluation['route']) => route.map(p => {
    const width = (board.width - 48) / 7, height = (board.height - 48) / 7;
    return (p.col * (width + 8) + width / 2) + ',' + (p.row * (height + 8) + height / 2);
  }).join(' ');
  return <WarehouseMap className="vbrl-dqn__validation-map" coordinates robot={result.route[index]} selected={result.route[index]} markers={{ [keyOf(TRAP)]: '!' }}
    goalArt={index===result.route.length-1&&result.outcome==='delivered'?loadedStation:emptyStation} dangerArt={pitArt}
    overlay={<svg className="vbrl-map__trails vbrl-dqn__routes" ref={svgRef} viewBox={'0 0 ' + board.width + ' ' + board.height} aria-hidden="true">
      <defs><marker id={id} markerWidth="4" markerHeight="4" refX="3.5" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill={color} /></marker></defs>
      <polyline data-route="before" points={points(before.route)} fill="none" stroke="#a1b1c7" strokeWidth="7" strokeDasharray="5 5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline data-route="current" points={points(result.route.slice(0, index + 1))} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" markerEnd={'url(#' + id + ')'} />
    </svg>} />;
}
