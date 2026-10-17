import { useState } from 'react';
import { Typography } from '../../../shared/react';
import { LessonPage } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import { WarehouseMap } from '../../components/WarehouseMap';
import { GOAL, START, keyOf, type Position } from '../../model';
import { TRAP } from '../QLearningLoopPage/qLearningSimulation';
import robotArt from '../../assets/cover-v2/robot.png';
import receivingStation from '../../assets/cover-v2/receiving-station-empty.png';
import maintenancePit from '../../assets/cover-v2/maintenance-pit.png';
import './StateDesignPage.css';

const comparison = [
  { label: '含义', state: '环境的真实情况', observation: '机器人收到的信息' },
  { label: '包含内容', state: '位置、目标与地图', observation: '自身位置坐标' },
  { label: '是否可见', state: '本例不直接提供全图', observation: '机器人直接获得' },
  { label: '作用', state: '决定转移与奖励', observation: '作为决策的输入' },
];

export function StateDesignPage() {
  const [position, setPosition] = useState<Position>(START);
  const legends = [
    { id: 'robot', label: '机器人（位置）', art: <img src={robotArt} alt="" /> },
    { id: 'goal', label: '签收站（终点）', art: <img src={receivingStation} alt="" /> },
    { id: 'trap', label: '维修坑（终止）', art: <img src={maintenancePit} alt="" /> },
    { id: 'wall', label: '障碍（不可走）', art: <i className="vbrl-state__obstacle" /> },
    { id: 'floor', label: '可通行区域', art: <i className="vbrl-state__floor" /> },
  ];
  return <LessonPage className="vbrl-foundation-page vbrl-state-page"
    title="状态与观测：真实环境和机器人感知的"
    subtitle="状态描述环境的真实情况，观测是智能体实际获得的信息。"
    footer={<div className="vbrl-state__summary">
      <Typography variant="body" tone="accent">一句话总结</Typography>
      <div className="vbrl-state__summary-copy">
        <Typography variant="body" tone="accent">状态描述真实情况，观测是机器人实际获得的信息。</Typography>
        <Typography variant="bodySmall" tone="muted">本课地图与任务固定；当前位置足以作为学习使用的状态编号。</Typography>
      </div>
      <img src={robotArt} alt="" />
    </div>}>
    <div className="vbrl-state" data-position={keyOf(position)} data-goal={keyOf(GOAL)} data-trap={keyOf(TRAP)}>
      <TeachingPanel title="环境全图 · 状态（State）" className="vbrl-state__warehouse">
        <div className="vbrl-state__map-column">
          <WarehouseMap className="vbrl-state__map" robot={position} selected={position} onSelect={setPosition}
            markers={{ [keyOf(TRAP)]: '!' }} coordinates goalArt={receivingStation} dangerArt={maintenancePit} />
          <Typography variant="bodySmall" tone="muted" align="center">点击格子，更换机器人位置。</Typography>
        </div>
        <div className="vbrl-state__environment">
          <div className="vbrl-state__legend" role="list" aria-label="地图图例">
            {legends.map(legend => <div className="vbrl-state__legend-item" role="listitem" key={legend.id}>
              <span className="vbrl-state__legend-art" aria-hidden="true">{legend.art}</span>
              <Typography as="span" variant="bodySmall" tone="accent">{legend.label}</Typography>
            </div>)}
          </div>
          <div className="vbrl-state__full-state">
            <Typography variant="bodySmall" tone="accent">环境的完整状态</Typography>
            <Typography variant="bodySmall" tone="muted">当前位置与整张地图</Typography>
            <Typography variant="bodySmall" tone="muted">（目标、障碍等）</Typography>
          </div>
        </div>
      </TeachingPanel>
      <div className="vbrl-state__right">
        <TeachingPanel title="自身定位 · 观测（Observation）" className="vbrl-state__observation">
          <div className="vbrl-state__position-sensor" role="group" aria-label="机器人感知到的当前位置" data-observed-position={keyOf(position)}>
            <img src={robotArt} alt="" />
            <div className="vbrl-state__position-reading" aria-live="polite">
              <Typography as="span" variant="bodySmall" tone="accent">第{position.row + 1}行</Typography>
              <Typography as="span" variant="bodySmall" tone="accent">第{position.col + 1}列</Typography>
            </div>
          </div>
          <div className="vbrl-state__observation-copy">
            <Typography variant="bodySmall" tone="accent">本课只感知自身位置坐标。</Typography>
            <Typography variant="bodySmall" tone="muted">不提供障碍、签收站或维修坑的位置。</Typography>
            <Typography variant="bodySmall" tone="accent">行动后，才得到奖励与新位置。</Typography>
          </div>
        </TeachingPanel>
        <TeachingPanel title="两者的区别" className="vbrl-state__comparison">
          <table className="vbrl-state__comparison-table" aria-label="状态与观测的区别">
            <colgroup><col className="vbrl-state__comparison-label" /><col /><col /></colgroup>
            <thead><tr>
              <th scope="col"><Typography as="span" variant="bodySmall" tone="accent">对照</Typography></th>
              <th scope="col"><Typography as="span" variant="bodySmall" tone="accent">状态（State）</Typography></th>
              <th scope="col"><Typography as="span" variant="bodySmall" tone="accent">观测（Observation）</Typography></th>
            </tr></thead>
            <tbody>{comparison.map(row => <tr key={row.label}>
              <th scope="row"><Typography as="span" variant="bodySmall" tone="accent">{row.label}</Typography></th>
              <td><Typography as="span" variant="bodySmall" tone="accent">{row.state}</Typography></td>
              <td><Typography as="span" variant="bodySmall" tone="accent">{row.observation}</Typography></td>
            </tr>)}</tbody>
          </table>
        </TeachingPanel>
      </div>
    </div>
  </LessonPage>;
}
