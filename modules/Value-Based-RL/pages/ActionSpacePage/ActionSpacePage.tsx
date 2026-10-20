import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useState, type CSSProperties } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import { WarehouseMap } from '../../components/WarehouseMap';
import { ACTIONS, DELTAS, START, keyOf, type Position } from '../../model';
import { TRAP, warehouseStep } from '../QLearningLoopPage/qLearningSimulation';
import './ActionSpacePage.css';

const robotArt = valueBasedRlAssetUrl('cover-v2/robot.png');
const receivingStation = valueBasedRlAssetUrl('cover-v2/receiving-station-empty.png');
const maintenancePit = valueBasedRlAssetUrl('cover-v2/maintenance-pit.png');
const warehouseScene = valueBasedRlAssetUrl('cover-v2/warehouse.png');
const stateSpaceIcon = valueBasedRlAssetUrl('action-footer/state-space.png');
const actionSpaceIcon = valueBasedRlAssetUrl('action-footer/action-space.png');
const policyIcon = valueBasedRlAssetUrl('action-footer/policy.png');

const CASES = [
  { id: 'move', from: START, title: '前方空地，成功移动', explanation: '选择向右后，到达新的位置。' },
  { id: 'collision', from: { row: 5, col: 2 }, title: '前方障碍，位置不变', explanation: '仍能选择向右；受阻后位置不变。' },
] as const;
type CaseId = typeof CASES[number]['id'];
const actionOrder = [0, 2, 3, 1];
const actionDetails = ['\\text{行}-1', '\\text{列}+1', '\\text{行}+1', '\\text{列}-1'];
const coordinate = (position: Position) => '(' + (position.row + 1) + ',' + (position.col + 1) + ')';

function DirectionArrow({ action, className = '' }: { action: number; className?: string }) {
  return <svg className={'vbrl-action__arrow ' + className} viewBox="0 0 32 32" aria-hidden="true">
    <path d="M16 3 29 16H22V29H10V16H3Z" transform={'rotate(' + action * 90 + ' 16 16)'} />
  </svg>;
}
function PositionMini({ position }: { position: Position }) {
  return <div className="vbrl-action__mini-position">
    <div className="vbrl-action__mini-tile"><img src={robotArt} alt="" /></div>
    <Formula latex={coordinate(position)} label={'行列坐标' + coordinate(position)} />
  </div>;
}
export function ActionSpacePage() {
  const [caseId, setCaseId] = useState<CaseId>('move'), [action, setAction] = useState(1);
  const scenario = CASES.find(item => item.id === caseId)!;
  const result = warehouseStep(scenario.from, action);
  function selectCase(id: CaseId) { setCaseId(id); setAction(1); }

  return <LessonPage className="vbrl-foundation-page vbrl-action-page"
    title="动作空间：机器人每一步能做什么？"
    subtitle="动作空间是智能体在一个状态下可以选择的所有动作的集合。"
    footer={<div className="vbrl-action__footer">
      <div className="vbrl-action__footer-item"><img src={stateSpaceIcon} alt="" /><Typography variant="bodySmall" tone="accent">状态空间 · 我在哪里？</Typography></div>
      <div className="vbrl-action__footer-item"><img src={actionSpaceIcon} alt="" /><Typography variant="bodySmall" tone="accent">动作空间 · 我能做什么？</Typography></div>
      <div className="vbrl-action__footer-item"><img src={policyIcon} alt="" /><Typography variant="bodySmall" tone="accent">策略 · 我该选哪个？</Typography></div>
    </div>}>
    <div className="vbrl-action" data-case={caseId} data-from={keyOf(scenario.from)} data-action={action}
      data-next={keyOf(result.next)} data-hit={result.hit}
      onKeyDown={event => { if (event.key === ' ' && event.target instanceof HTMLElement && event.target.closest('button')) event.stopPropagation(); }}>
      <TeachingPanel title="本课动作空间 · 四个离散动作" className="vbrl-action__discrete">
        <div className="vbrl-action__choice-layout">
          <WarehouseMap className="vbrl-action__map" robot={scenario.from} selected={scenario.from}
            coordinates markers={{ [keyOf(TRAP)]: '!' }} goalArt={receivingStation} dangerArt={maintenancePit}
            overlay={<div className="vbrl-action__compass" role="group" aria-label="在地图上选择动作">
              {DELTAS.map((delta, index) => <Button key={index} className="vbrl-action__map-direction"
                data-map-action={index} active={action === index} aria-pressed={action === index}
                aria-label={'地图上选择' + ACTIONS[index]} onClick={() => setAction(index)}
                style={{ gridRow: scenario.from.row + delta.row + 1, gridColumn: scenario.from.col + delta.col + 1 } as CSSProperties}>
                <DirectionArrow action={index} />
              </Button>)}
            </div>} />
          <div className="vbrl-action__directions" role="group" aria-label="四个可选择的方向">
            {actionOrder.map(index => <Button key={index} className="vbrl-action__direction"
              data-direction={index} active={action === index} aria-pressed={action === index}
              aria-label={'选择' + ACTIONS[index]} onClick={() => setAction(index)}>
              <DirectionArrow action={index} />
              <div className="vbrl-action__direction-label" inert>
                <Typography as="span" variant="bodySmall" tone="accent">{ACTIONS[index]}</Typography>
                <Formula latex={actionDetails[index]} />
              </div>
            </Button>)}
          </div>
        </div>
        <div className="vbrl-action__set"><Formula latex={'\\mathcal A=\\{\\uparrow,\\downarrow,\\leftarrow,\\rightarrow\\},\\quad|\\mathcal A|=4'} /></div>
        <Typography variant="bodySmall" tone="muted" align="center">点击方向，对照动作和环境给出的结果。</Typography>
      </TeachingPanel>
      <TeachingPanel title="动作不等于结果 · 环境决定下一状态" className="vbrl-action__transition">
        <div className="vbrl-action__sequence" aria-label="当前状态、选择动作、环境执行、下一状态">
          <div className="vbrl-action__node">
            <Typography variant="bodySmall" tone="accent">当前状态</Typography>
            <Formula latex={coordinate(scenario.from)} label={'当前状态的行列坐标' + coordinate(scenario.from)} />
            <img src={robotArt} alt="当前位置的机器人" />
          </div>
          <DirectionArrow action={1} className="vbrl-action__link" />
          <div className="vbrl-action__node">
            <Typography variant="bodySmall" tone="accent">选择动作</Typography>
            <DirectionArrow action={action} className="vbrl-action__selected-arrow" />
            <Typography variant="bodySmall" tone="accent">{ACTIONS[action]}</Typography>
          </div>
          <DirectionArrow action={1} className="vbrl-action__link" />
          <div className="vbrl-action__node">
            <Typography variant="bodySmall" tone="accent">环境执行</Typography>
            <img className="vbrl-action__warehouse-art" src={warehouseScene} alt="仓库环境" />
            <Typography variant="bodySmall" tone={result.hit ? 'warning' : 'accent'}>{result.hit ? '受阻，原地停留' : '按规则移动'}</Typography>
          </div>
          <DirectionArrow action={1} className="vbrl-action__link" />
          <div className={'vbrl-action__node is-result' + (result.hit ? ' is-blocked' : '')} aria-live="polite">
            <Typography variant="bodySmall" tone="accent">下一状态</Typography>
            <Formula latex={coordinate(result.next)} label={'下一状态的行列坐标' + coordinate(result.next)} />
            <img src={robotArt} alt="下一位置的机器人" />
          </div>
        </div>
        <div className="vbrl-action__examples" role="group" aria-label="比较成功移动和受阻的例子">
          {CASES.map((example, index) => {
            const outcome = warehouseStep(example.from, 1);
            return <Button key={example.id} className={'vbrl-action__example is-' + example.id}
              active={caseId === example.id} aria-pressed={caseId === example.id}
              aria-label={'查看' + (index === 0 ? '成功移动' : '障碍受阻') + '示例'} onClick={() => selectCase(example.id)}>
              <Typography variant="bodySmall" tone={index === 0 ? 'success' : 'warning'}>示例{index + 1} · {example.title}</Typography>
              <div className="vbrl-action__example-body" inert>
                <div className="vbrl-action__mini-transition"><PositionMini position={example.from} />
                  <DirectionArrow action={1} className="vbrl-action__mini-link" /><PositionMini position={outcome.next} /></div>
                <Typography variant="bodySmall" tone="accent">{example.explanation}</Typography>
              </div>
            </Button>;
          })}
        </div>
        <div className="vbrl-action__rule"><Typography variant="bodySmall" tone="accent">回合未结束时，四个方向都可选；撞到障碍或边界时，位置不变。</Typography></div>
        <div className="vbrl-action__conclusion"><Typography variant="body" tone="accent" align="center">机器人选择动作；实际到达哪里，由环境转移规则决定。</Typography></div>
      </TeachingPanel>
    </div>
  </LessonPage>;
}
