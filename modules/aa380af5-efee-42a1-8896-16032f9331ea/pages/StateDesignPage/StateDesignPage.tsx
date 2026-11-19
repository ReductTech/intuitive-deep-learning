import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useState } from 'react';
import { Typography } from "@shuku/course-style/react";
import { LessonPage } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import { WarehouseMap } from '../../components/WarehouseMap';
import { GOAL, START, keyOf, type Position } from '../../model';
import { TRAP } from '../QLearningLoopPage/qLearningSimulation';
import './StateDesignPage.css';

const robotArt = valueBasedRlAssetUrl("cover-v2/robot.webp");
const receivingStation = valueBasedRlAssetUrl("cover-v2/receiving-station-empty.webp");
const maintenancePit = valueBasedRlAssetUrl("cover-v2/maintenance-pit.webp");

const comparison = [
  { label: '含义', state: '环境的真实情况', observation: '机器人收到的信息' },
  { label: '包含内容', state: '位置、目标与地图', observation: '自身位置坐标' },
  { label: '是否可见', state: '本例不直接提供全图', observation: '机器人直接获得' },
  { label: '作用', state: '决定转移与奖励', observation: '作为决策的输入' },
];

export function StateDesignPage() {
  const [position, setPosition] = useState<Position>(START);
  const legends = [
    { id: 'robot', label: '机器人（位置）', art: <img shuku-edit-id="e-4cee9231-bb71-434c-9f68-445e5e0ce8c6" src={robotArt} alt="" /> },
    { id: 'goal', label: '签收站（终点）', art: <img shuku-edit-id="e-8144c067-f4cb-4335-8143-151cd7a93cb9" src={receivingStation} alt="" /> },
    { id: 'trap', label: '维修坑（终止）', art: <img shuku-edit-id="e-21b0634b-6923-4651-a3de-ba711046fb88" src={maintenancePit} alt="" /> },
    { id: 'wall', label: '障碍（不可走）', art: <i shuku-edit-id="e-82761a99-ab02-4808-ad5a-55fd5bee2aa0" className="vbrl-state__obstacle" /> },
    { id: 'floor', label: '可通行区域', art: <i shuku-edit-id="e-3d6a8810-0dfe-4998-8dcd-ccf68d50fc1d" className="vbrl-state__floor" /> },
  ];
  return <LessonPage className="vbrl-foundation-page vbrl-state-page"
    title="状态与观测：真实环境和机器人感知的"
    subtitle="状态描述环境的真实情况，观测是智能体实际获得的信息。"
    footer={<div shuku-edit-id="e-d5f19e1f-9b0f-4e0e-bc6c-3ffab5073430" className="vbrl-state__summary">
      <Typography shuku-edit-id="e-37d907b8-b95c-42b0-aab4-5ff133ff913d" variant="body" tone="accent">一句话总结</Typography>
      <div shuku-edit-id="e-4f60013b-053e-4ffa-88f9-7c4bb07a1751" className="vbrl-state__summary-copy">
        <Typography shuku-edit-id="e-e8f07193-bf97-46cd-a998-c8d871d1d13d" variant="body" tone="accent">状态描述真实情况，观测是机器人实际获得的信息。</Typography>
        <Typography shuku-edit-id="e-a17988a0-9366-4a7a-a020-e382f6935d25" variant="bodySmall" tone="muted">本课地图与任务固定；当前位置足以作为学习使用的状态编号。</Typography>
      </div>
      <img shuku-edit-id="e-a6886773-4c8e-42d5-a33e-9ce2bea00db1" src={robotArt} alt="" />
    </div>}>
    <div shuku-edit-id="e-39fe9661-fa79-471a-bcb3-23a91bbab14a" className="vbrl-state" data-position={keyOf(position)} data-goal={keyOf(GOAL)} data-trap={keyOf(TRAP)}>
      <TeachingPanel title="环境全图 · 状态（State）" className="vbrl-state__warehouse">
        <div shuku-edit-id="e-d8ba8267-1117-4261-bcea-a9a799aedfcf" className="vbrl-state__map-column">
          <WarehouseMap className="vbrl-state__map" robot={position} selected={position} onSelect={setPosition}
            markers={{ [keyOf(TRAP)]: '!' }} coordinates goalArt={receivingStation} dangerArt={maintenancePit} />
          <Typography shuku-edit-id="e-43c0077e-070e-4a7a-b9a7-4f42116b9b55" variant="bodySmall" tone="muted" align="center">点击格子，更换机器人位置。</Typography>
        </div>
        <div shuku-edit-id="e-6083c47b-c7b8-45c5-9e19-da59a45e95b0" className="vbrl-state__environment">
          <div shuku-edit-id="e-98004f74-c598-454c-99f5-dd476f2a1e9b" className="vbrl-state__legend" role="list" aria-label="地图图例">
            {legends.map(legend => <div shuku-edit-id="e-7e96699a-a135-466f-95c7-8d8f69f58004" className="vbrl-state__legend-item" role="listitem" key={legend.id}>
              <span shuku-edit-id="e-c07ba348-4e4d-42d8-a6cc-e597f104ab09" className="vbrl-state__legend-art" aria-hidden="true">{legend.art}</span>
              <Typography shuku-edit-id="e-63ddaa23-ae2f-454e-8c15-eb735d79741c" as="span" variant="bodySmall" tone="accent">{legend.label}</Typography>
            </div>)}
          </div>
          <div shuku-edit-id="e-f8296b45-ecb2-4bb2-8274-f1a1d06aad14" className="vbrl-state__full-state">
            <Typography shuku-edit-id="e-30697a5f-136f-4967-8fc9-79314fe10755" variant="bodySmall" tone="accent">环境的完整状态</Typography>
            <Typography shuku-edit-id="e-e42c003a-72b1-4a81-8ec3-2f68f8e854d9" variant="bodySmall" tone="muted">当前位置与整张地图</Typography>
            <Typography shuku-edit-id="e-26917538-afca-4871-835b-d765f0d2c6aa" variant="bodySmall" tone="muted">（目标、障碍等）</Typography>
          </div>
        </div>
      </TeachingPanel>
      <div shuku-edit-id="e-12034d69-9b98-4c07-a85e-d0817777a512" className="vbrl-state__right">
        <TeachingPanel title="自身定位 · 观测（Observation）" className="vbrl-state__observation">
          <div shuku-edit-id="e-554a31da-e7e1-40f6-aacf-d345b3ba4928" className="vbrl-state__position-sensor" role="group" aria-label="机器人感知到的当前位置" data-observed-position={keyOf(position)}>
            <img shuku-edit-id="e-e584de3d-1d0e-43c4-aa92-57c55cce6c75" src={robotArt} alt="" />
            <div shuku-edit-id="e-52b80378-0d1a-4dab-bb79-3290e66c13fb" className="vbrl-state__position-reading" aria-live="polite">
              <Typography shuku-edit-id="e-6adaa54d-7fc3-4e9a-ac58-18b0c94533b9" as="span" variant="bodySmall" tone="accent">第{position.row + 1}行</Typography>
              <Typography shuku-edit-id="e-85658539-dec7-4507-9fd6-4f8ade483e48" as="span" variant="bodySmall" tone="accent">第{position.col + 1}列</Typography>
            </div>
          </div>
          <div shuku-edit-id="e-931da551-0d25-4989-913b-1d91ab87f3d3" className="vbrl-state__observation-copy">
            <Typography shuku-edit-id="e-654a7d47-a124-49a0-88a5-a396a6a5fe3c" variant="bodySmall" tone="accent">本课只感知自身位置坐标。</Typography>
            <Typography shuku-edit-id="e-3f34c02a-04de-4092-83ee-dd693ed45632" variant="bodySmall" tone="muted">不提供障碍、签收站或维修坑的位置。</Typography>
            <Typography shuku-edit-id="e-0b139401-4758-4f5e-a8a3-e9c3dea56c47" variant="bodySmall" tone="accent">行动后，才得到奖励与新位置。</Typography>
          </div>
        </TeachingPanel>
        <TeachingPanel title="两者的区别" className="vbrl-state__comparison">
          <table shuku-edit-id="e-b845cd2c-1165-467f-8222-b80a39418d70" className="vbrl-state__comparison-table" aria-label="状态与观测的区别">
            <colgroup shuku-edit-id="e-0e52b3ca-365f-45ac-9e5e-4c9c591bbe6a"><col shuku-edit-id="e-33c4a81a-f9e5-437e-9f79-66cfe98a3cc9" className="vbrl-state__comparison-label" /><col shuku-edit-id="e-6d94f928-a86d-445d-93f8-55c18065fe65" /><col shuku-edit-id="e-3aab4872-1075-4d6d-b62f-97380d571b71" /></colgroup>
            <thead shuku-edit-id="e-d15cafe2-a738-4809-a172-3605467ba272"><tr shuku-edit-id="e-338af109-3031-41e1-ae24-aac670bb9d3e">
              <th shuku-edit-id="e-489448a0-7469-41f7-98e0-6140577ee3d6" scope="col"><Typography shuku-edit-id="e-4a46f064-0223-4cf6-a0bb-73d2d075f419" as="span" variant="bodySmall" tone="accent">对照</Typography></th>
              <th shuku-edit-id="e-4b6e02ab-c4a8-4cb1-b168-dd11607fbf55" scope="col"><Typography shuku-edit-id="e-e1dbb5bd-8511-4a79-b2d1-e0c188741c17" as="span" variant="bodySmall" tone="accent">状态（State）</Typography></th>
              <th shuku-edit-id="e-4f1dfc8c-fd75-4c95-8747-6841dec223d4" scope="col"><Typography shuku-edit-id="e-66d185c7-9d65-49ee-872e-dc281d375718" as="span" variant="bodySmall" tone="accent">观测（Observation）</Typography></th>
            </tr></thead>
            <tbody shuku-edit-id="e-d84c2681-60fc-4f3a-a80a-1bd663f4f51d">{comparison.map(row => <tr shuku-edit-id="e-363e1434-a59c-436f-bca0-7f9109933b2b" key={row.label}>
              <th shuku-edit-id="e-6ec258e2-c2ba-42b2-a785-72265821feff" scope="row"><Typography shuku-edit-id="e-4e1cdab2-3d9e-4694-b0dc-9bac20f50e69" as="span" variant="bodySmall" tone="accent">{row.label}</Typography></th>
              <td shuku-edit-id="e-556e5ef9-6d01-4594-8d4c-da0e84834280"><Typography shuku-edit-id="e-ae3797a6-9395-4295-ae51-56fef118dedf" as="span" variant="bodySmall" tone="accent">{row.state}</Typography></td>
              <td shuku-edit-id="e-ba233c1c-e660-47fd-9a5f-0c2f0ac327e8"><Typography shuku-edit-id="e-1a40da07-bc5d-46f4-9984-c5b4e26593ec" as="span" variant="bodySmall" tone="accent">{row.observation}</Typography></td>
            </tr>)}</tbody>
          </table>
        </TeachingPanel>
      </div>
    </div>
  </LessonPage>;
}
