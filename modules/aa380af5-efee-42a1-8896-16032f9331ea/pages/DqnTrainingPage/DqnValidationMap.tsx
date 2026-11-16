import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { WarehouseMap } from '../../components/WarehouseMap';
import { keyOf } from '../../model';
import { type DqnEvaluation } from '../../dqnSimulation';
import { TRAP } from '../QLearningLoopPage/qLearningSimulation';

const emptyStation = valueBasedRlAssetUrl('cover-v2/receiving-station-empty.png');
const loadedStation = valueBasedRlAssetUrl('cover-v2/receiving-station-loaded.png');
const pitArt = valueBasedRlAssetUrl('cover-v2/maintenance-pit.png');

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
    overlay={<svg shuku-edit-id="e-849ddeb6-edc0-4716-8f59-d572deede62d" className="vbrl-map__trails vbrl-dqn__routes" ref={svgRef} viewBox={'0 0 ' + board.width + ' ' + board.height} aria-hidden="true">
      <defs shuku-edit-id="e-de3e48d9-9685-4ab9-80bc-f0104659d91c"><marker shuku-edit-id="e-9a554382-95ce-4af2-a4c0-d43403e120e6" id={id} markerWidth="4" markerHeight="4" refX="3.5" refY="2" orient="auto"><path shuku-edit-id="e-a4fffc50-0a34-498d-a0fb-c2ccba288c7c" d="M0,0 L4,2 L0,4 Z" fill={color} /></marker></defs>
      <polyline shuku-edit-id="e-1a82cc0e-9325-4278-b6b0-26763ef9e690" data-route="before" points={points(before.route)} fill="none" stroke="#a1b1c7" strokeWidth="7" strokeDasharray="5 5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline shuku-edit-id="e-8e7d316a-9d9d-4128-b3a6-560fed7e3492" data-route="current" points={points(result.route.slice(0, index + 1))} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" markerEnd={'url(#' + id + ')'} />
    </svg>} />;
}
