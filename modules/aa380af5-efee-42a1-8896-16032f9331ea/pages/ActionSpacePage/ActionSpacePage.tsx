import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useState, type CSSProperties } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import { WarehouseMap } from '../../components/WarehouseMap';
import { ACTIONS, DELTAS, START, keyOf, type Position } from '../../model';
import { TRAP, warehouseStep } from '../QLearningLoopPage/qLearningSimulation';
import './ActionSpacePage.css';

const robotArt = valueBasedRlAssetUrl('cover-v2/robot.png');
const receivingStation = valueBasedRlAssetUrl('cover-v2/receiving-station-empty.png');
const maintenancePit = valueBasedRlAssetUrl('cover-v2/maintenance-pit.png');
const warehouseScene = valueBasedRlAssetUrl('cover-v2/warehouse.jpg');
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
  return <svg shuku-edit-id="e-6b9e8ed0-c114-42d3-8861-f2733ab0de48" className={'vbrl-action__arrow ' + className} viewBox="0 0 32 32" aria-hidden="true">
    <path shuku-edit-id="e-82b61641-ae02-4d5c-8b4a-9f244bd7343e" d="M16 3 29 16H22V29H10V16H3Z" transform={'rotate(' + action * 90 + ' 16 16)'} />
  </svg>;
}
function PositionMini({ position }: { position: Position }) {
  return <div shuku-edit-id="e-a27f3ee3-b0c4-4f54-8682-1c658ad01455" className="vbrl-action__mini-position">
    <div shuku-edit-id="e-96dfa15e-0a66-4a4b-866c-7db2312c075d" className="vbrl-action__mini-tile"><img shuku-edit-id="e-6e988d26-08d4-4fca-a1c8-326a95aa3dd6" src={robotArt} alt="" /></div>
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
    footer={<div shuku-edit-id="e-1c850a8c-9235-4219-8bf2-eba5d5afbf78" className="vbrl-action__footer">
      <div shuku-edit-id="e-1fd34792-2cb0-4bbe-a0d5-c9e9db32f5a9" className="vbrl-action__footer-item"><img shuku-edit-id="e-95a6d3ab-d8e6-46f9-b668-2533aa87e33d" src={stateSpaceIcon} alt="" /><Typography shuku-edit-id="e-d3daac6f-4d3c-4542-bb22-c411b7d50be7" variant="bodySmall" tone="accent">状态空间 · 我在哪里？</Typography></div>
      <div shuku-edit-id="e-58778c26-0d0a-4f3e-bb8f-b9d77b9641d2" className="vbrl-action__footer-item"><img shuku-edit-id="e-21b75467-b958-40ab-a74b-4766ceee4017" src={actionSpaceIcon} alt="" /><Typography shuku-edit-id="e-3c99015e-a3d2-42bf-b4da-c5694869f783" variant="bodySmall" tone="accent">动作空间 · 我能做什么？</Typography></div>
      <div shuku-edit-id="e-f9318985-02f2-4c93-912a-552cf1bee5a2" className="vbrl-action__footer-item"><img shuku-edit-id="e-9135064d-5fcf-4047-89dc-5832d9a4a1c3" src={policyIcon} alt="" /><Typography shuku-edit-id="e-a35cb2c5-c183-4e47-8d13-93565c6d709d" variant="bodySmall" tone="accent">策略 · 我该选哪个？</Typography></div>
    </div>}>
    <div shuku-edit-id="e-a36aa7e3-8273-4dbb-b313-e993c9ac890e" className="vbrl-action" data-case={caseId} data-from={keyOf(scenario.from)} data-action={action}
      data-next={keyOf(result.next)} data-hit={result.hit}
      onKeyDown={event => { if (event.key === ' ' && event.target instanceof HTMLElement && event.target.closest('button')) event.stopPropagation(); }}>
      <TeachingPanel title="本课动作空间 · 四个离散动作" className="vbrl-action__discrete">
        <div shuku-edit-id="e-d33bbb8d-d536-4e17-8429-ab6387885479" className="vbrl-action__choice-layout">
          <WarehouseMap className="vbrl-action__map" robot={scenario.from} selected={scenario.from}
            coordinates markers={{ [keyOf(TRAP)]: '!' }} goalArt={receivingStation} dangerArt={maintenancePit}
            overlay={<div shuku-edit-id="e-34207b75-25e3-441f-a526-4086566805af" className="vbrl-action__compass" role="group" aria-label="在地图上选择动作">
              {DELTAS.map((delta, index) => <Button key={index} className="vbrl-action__map-direction"
                data-map-action={index} active={action === index} aria-pressed={action === index}
                aria-label={'地图上选择' + ACTIONS[index]} onClick={() => setAction(index)}
                style={{ gridRow: scenario.from.row + delta.row + 1, gridColumn: scenario.from.col + delta.col + 1 } as CSSProperties}>
                <DirectionArrow action={index} />
              </Button>)}
            </div>} />
          <div shuku-edit-id="e-1738129d-d081-4ab4-8ed5-e3bd6269d6d1" className="vbrl-action__directions" role="group" aria-label="四个可选择的方向">
            {actionOrder.map(index => <Button key={index} className="vbrl-action__direction"
              data-direction={index} active={action === index} aria-pressed={action === index}
              aria-label={'选择' + ACTIONS[index]} onClick={() => setAction(index)}>
              <DirectionArrow action={index} />
              <div shuku-edit-id="e-f791526a-6b18-49ee-b654-211bf77879d1" className="vbrl-action__direction-label" inert>
                <Typography shuku-edit-id="e-ce528d6b-0f49-4eb5-b250-2e13078ca0f1" as="span" variant="bodySmall" tone="accent">{ACTIONS[index]}</Typography>
                <Formula latex={actionDetails[index]} />
              </div>
            </Button>)}
          </div>
        </div>
        <div shuku-edit-id="e-3d43b66a-9fc5-4033-94c8-d908e279e3d4" className="vbrl-action__set"><Formula latex={'\\mathcal A=\\{\\uparrow,\\downarrow,\\leftarrow,\\rightarrow\\},\\quad|\\mathcal A|=4'} /></div>
        <Typography shuku-edit-id="e-2dec3e8f-af2a-445c-aaee-e28552a5ff7e" variant="bodySmall" tone="muted" align="center">点击方向，对照动作和环境给出的结果。</Typography>
      </TeachingPanel>
      <TeachingPanel title="动作不等于结果 · 环境决定下一状态" className="vbrl-action__transition">
        <div shuku-edit-id="e-f4521d5e-d313-480f-8167-dfdd7e710743" className="vbrl-action__sequence" aria-label="当前状态、选择动作、环境执行、下一状态">
          <div shuku-edit-id="e-aa46c3df-3c8e-463c-9d95-724b191778fe" className="vbrl-action__node">
            <Typography shuku-edit-id="e-f0b20c76-b104-4004-958f-f6554c20b37a" variant="bodySmall" tone="accent">当前状态</Typography>
            <Formula latex={coordinate(scenario.from)} label={'当前状态的行列坐标' + coordinate(scenario.from)} />
            <img shuku-edit-id="e-c4438490-05c9-495f-84a3-5ce9e3ba5694" src={robotArt} alt="当前位置的机器人" />
          </div>
          <DirectionArrow action={1} className="vbrl-action__link" />
          <div shuku-edit-id="e-78024f3e-0b68-42b3-8bd3-c2466e7793b6" className="vbrl-action__node">
            <Typography shuku-edit-id="e-92ac4868-2e26-4e32-a5f5-58609c5b7f6c" variant="bodySmall" tone="accent">选择动作</Typography>
            <DirectionArrow action={action} className="vbrl-action__selected-arrow" />
            <Typography shuku-edit-id="e-ee307dff-a0dc-40a5-92ac-d99cbc9dfbed" variant="bodySmall" tone="accent">{ACTIONS[action]}</Typography>
          </div>
          <DirectionArrow action={1} className="vbrl-action__link" />
          <div shuku-edit-id="e-5bcc4f0b-5c83-4c2e-89b0-ff0cdce35c5d" className="vbrl-action__node">
            <Typography shuku-edit-id="e-40041a89-15a5-4ea6-ba66-eef0938389e0" variant="bodySmall" tone="accent">环境执行</Typography>
            <img shuku-edit-id="e-58ff525a-3a63-41bd-970e-391039c33211" className="vbrl-action__warehouse-art" src={warehouseScene} alt="仓库环境" />
            <Typography shuku-edit-id="e-9c784c0a-b373-4f0c-85e1-52c6dabfec59" variant="bodySmall" tone={result.hit ? 'warning' : 'accent'}>{result.hit ? '受阻，原地停留' : '按规则移动'}</Typography>
          </div>
          <DirectionArrow action={1} className="vbrl-action__link" />
          <div shuku-edit-id="e-1c1690be-9107-4569-a1bc-97008ca7afbc" className={'vbrl-action__node is-result' + (result.hit ? ' is-blocked' : '')} aria-live="polite">
            <Typography shuku-edit-id="e-06431e32-ebdf-4adf-82c5-923fe2d182fe" variant="bodySmall" tone="accent">下一状态</Typography>
            <Formula latex={coordinate(result.next)} label={'下一状态的行列坐标' + coordinate(result.next)} />
            <img shuku-edit-id="e-3370ea1f-d349-44b5-9798-782aec67aa8e" src={robotArt} alt="下一位置的机器人" />
          </div>
        </div>
        <div shuku-edit-id="e-da3da440-cf3c-4150-8292-f7d919fb9481" className="vbrl-action__examples" role="group" aria-label="比较成功移动和受阻的例子">
          {CASES.map((example, index) => {
            const outcome = warehouseStep(example.from, 1);
            return <Button key={example.id} className={'vbrl-action__example is-' + example.id}
              active={caseId === example.id} aria-pressed={caseId === example.id}
              aria-label={'查看' + (index === 0 ? '成功移动' : '障碍受阻') + '示例'} onClick={() => selectCase(example.id)}>
              <Typography shuku-edit-id="e-9dcbccac-d13e-4fef-9352-091a51e0ecea" variant="bodySmall" tone={index === 0 ? 'success' : 'warning'}>示例{index + 1} · {example.title}</Typography>
              <div shuku-edit-id="e-49f8b92d-972d-4f64-a1a3-1b7e86763c55" className="vbrl-action__example-body" inert>
                <div shuku-edit-id="e-1abbadb3-16c6-413b-8221-7f3243aa79d1" className="vbrl-action__mini-transition"><PositionMini position={example.from} />
                  <DirectionArrow action={1} className="vbrl-action__mini-link" /><PositionMini position={outcome.next} /></div>
                <Typography shuku-edit-id="e-e2c64c5c-8f19-4f76-b657-2b60bf5f771a" variant="bodySmall" tone="accent">{example.explanation}</Typography>
              </div>
            </Button>;
          })}
        </div>
        <div shuku-edit-id="e-66a5926c-fb9f-491c-b597-beb76d7f1e77" className="vbrl-action__rule"><Typography shuku-edit-id="e-83b79018-1048-4b32-b1a9-a717e0e998a8" variant="bodySmall" tone="accent">回合未结束时，四个方向都可选；撞到障碍或边界时，位置不变。</Typography></div>
        <div shuku-edit-id="e-0020d485-da30-4a44-b602-49b1be08d52e" className="vbrl-action__conclusion"><Typography shuku-edit-id="e-ad35d8e7-0d26-4865-89c7-8ed9b939d35b" variant="body" tone="accent" align="center">机器人选择动作；实际到达哪里，由环境转移规则决定。</Typography></div>
      </TeachingPanel>
    </div>
  </LessonPage>;
}
