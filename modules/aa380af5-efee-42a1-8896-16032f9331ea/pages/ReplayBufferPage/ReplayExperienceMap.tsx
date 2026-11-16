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
    <div shuku-edit-id="e-5f750560-4441-45b3-8bf0-60a92b3f038a" className="vbrl-replay__map-overlay">
      {source && <div shuku-edit-id="e-55c8a3d2-1948-47a9-8545-7462191bf386" className="vbrl-replay__origin" style={grid(source)} />}
      {destination && <div shuku-edit-id="e-61544c15-0e06-4faa-a7da-00b8d6bf0925" className={'vbrl-replay__destination' + (same ? ' is-same' : '')} style={grid(destination)} />}
      {source && <svg shuku-edit-id="e-42eb013f-0b47-4829-9b53-c57dc7965eba" className="vbrl-replay__action" style={grid(source)} viewBox="0 0 100 100" aria-hidden="true">
        <path shuku-edit-id="e-6b16cf1d-4b3b-465e-b71c-1f1deca9eea4" d="M50 90V66M42 74L50 66L58 74" transform={'rotate(' + experience!.action * 90 + ' 50 78)'} />
      </svg>}
      <div shuku-edit-id="e-e4c68fb7-6a50-40c8-9046-1903bfb0fe4b" key={robotKey} className={'vbrl-replay__robot' + (small ? ' is-small' : '')}
        style={{ '--replay-row': pose.row, '--replay-col': pose.col } as CSSProperties}>
        <img shuku-edit-id="e-06d40f75-9a07-4ebc-98cf-8a9c63ae7cdb" src={robotArt} alt="实际交互或回放经历的机器人" />
      </div>
    </div>
  } />;
}
