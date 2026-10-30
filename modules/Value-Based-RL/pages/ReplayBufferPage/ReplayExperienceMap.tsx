import { valueBasedRlAssetUrl } from '../../assetUrls';
import { type CSSProperties } from 'react';
import { WarehouseMap } from '../../components/WarehouseMap';
import { GOAL, keyOf, type Position } from '../../model';
import { TRAP } from '../QLearningLoopPage/qLearningSimulation';
import { type ReplayExperience } from './replaySimulation';
import './ReplayExperienceMap.css';

const robotArt = valueBasedRlAssetUrl('cover-v2/robot.png');
const emptyStation = valueBasedRlAssetUrl('cover-v2/receiving-station-empty.png');
const loadedStation = valueBasedRlAssetUrl('cover-v2/receiving-station-loaded.png');
const pitArt = valueBasedRlAssetUrl('cover-v2/maintenance-pit.png');

export function ReplayExperienceMap({ position, experience, atEnd, robotKey }: {
  position: Position; experience: ReplayExperience | null; atEnd: boolean; robotKey: string;
}) {
  const source = experience?.s, destination = experience?.next;
  const grid = (p: Position): CSSProperties => ({ gridRow: p.row + 1, gridColumn: p.col + 1 });
  const pose = atEnd && destination ? destination : source ?? position;
  const same = source && destination && keyOf(source) === keyOf(destination);
  const small = !!source && (keyOf(pose) === keyOf(source) || [keyOf(GOAL), keyOf(TRAP)].includes(keyOf(pose)));
  return <WarehouseMap className="vbrl-replay__map" coordinates robot={pose} selected={source ?? pose} markers={{ [keyOf(TRAP)]: '!' }}
    goalArt={atEnd && experience?.done && !experience.trapped ? loadedStation : emptyStation} dangerArt={pitArt} overlay={
    <div className="vbrl-replay__map-overlay">
      {source && <div className="vbrl-replay__origin" style={grid(source)} />}
      {destination && <div className={'vbrl-replay__destination' + (same ? ' is-same' : '')} style={grid(destination)} />}
      {source && <svg className="vbrl-replay__action" style={grid(source)} viewBox="0 0 100 100" aria-hidden="true">
        <path d="M50 90V66M42 74L50 66L58 74" transform={'rotate(' + experience!.action * 90 + ' 50 78)'} />
      </svg>}
      <div key={robotKey} className={'vbrl-replay__robot' + (small ? ' is-small' : '')}
        style={{ '--replay-row': pose.row, '--replay-col': pose.col } as CSSProperties}>
        <img src={robotArt} alt="实际交互或回放经历的机器人" />
      </div>
    </div>
  } />;
}
