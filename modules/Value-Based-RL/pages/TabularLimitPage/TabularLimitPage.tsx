import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useState } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import { WarehouseMap } from '../../components/WarehouseMap';
import { BLOCKED, GRID, START, keyOf } from '../../model';
import { TRAP } from '../QLearningLoopPage/qLearningSimulation';
import './TabularLimitPage.css';

const emptyStationArt = valueBasedRlAssetUrl('cover-v2/receiving-station-empty.png');
const pitArt = valueBasedRlAssetUrl('cover-v2/maintenance-pit.png');
const directionKeycap = valueBasedRlAssetUrl('cover-v2/direction-keycap.png');
const expandedWarehouse = valueBasedRlAssetUrl('tabular-limit/expanded-warehouse.png');
const qTableGrowth = valueBasedRlAssetUrl('tabular-limit/q-table-growth.png');

const VARIABLES = [
  { name: '朝向', count: 4, latex: '4' },
  { name: '电量等级', count: 100, latex: '100' },
  { name: '载货状态', count: 3, latex: '3' },
  { name: '10 扇门开关', count: 2 ** 10, latex: String.raw`2^{10}=1\,024` },
];
const POSITIONS = 100 * 100, ACTION_COUNT = 8, FLOAT32_BYTES = 4;
const SMALL_STATES = GRID * GRID - BLOCKED.length;
const largeNumber = (value: number) => value >= 1e8 ? (value / 1e8).toFixed(2).replace(/\.00$/, '') + ' 亿' : value.toLocaleString('en-US');

export function TabularLimitPage() {
  const [included, setIncluded] = useState(() => VARIABLES.map(() => true));
  const counts = VARIABLES.map((variable, index) => included[index] ? variable.count : 1);
  const states = counts.reduce((product, count) => product * count, POSITIONS);
  const entries = states * ACTION_COUNT, gb = entries * FLOAT32_BYTES / 1e9;
  const allIncluded = included.every(Boolean);

  return <LessonPage className="vbrl-foundation-page vbrl-limit-page"
    title="从小地图到真实仓库：Q 表为什么会膨胀？"
    subtitle="Q 表为每个状态–动作组合存一个数；多个状态变量组合后，表的规模会相乘增长。"
    footer={null}>
    <div className="vbrl-limit" data-states={states} data-entries={entries} data-storage-gb={gb} data-actions={ACTION_COUNT}>
      <TeachingPanel title="① 7×7 的小地图" className="vbrl-limit__small">
        <WarehouseMap className="vbrl-limit__map" coordinates selected={START} markers={{ [keyOf(TRAP)]: '!' }} goalArt={emptyStationArt} dangerArt={pitArt} />
        <div className="vbrl-limit__small-count"><Typography variant="bodySmall" tone="muted">{SMALL_STATES} 个非障碍格</Typography>
          <Formula latex={`${SMALL_STATES}\\times4=176`} /></div>
        <div className="vbrl-limit__actions" aria-label="四个移动动作">
          {['向上', '向右', '向下', '向左'].map((label, action) => <div key={label}>
            <div className="vbrl-limit__keycap"><img src={directionKeycap} alt="" /><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 22h6V10h7L12 0 2 10h7z" transform={`rotate(${action * 90} 12 12)`} /></svg></div>
            <Typography variant="bodySmall" tone="accent">{label}</Typography>
          </div>)}
        </div>
        <Typography variant="bodySmall" tone="success">4 个移动动作，逐项存储与学习。</Typography>
      </TeachingPanel>

      <div className="vbrl-limit__growth">
        <TeachingPanel title="② 扩展仓库示例：状态变量相乘" className="vbrl-limit__states">
          <div className="vbrl-limit__visual-state">
            <figure className="vbrl-limit__warehouse-art">
              <img src={expandedWarehouse} alt="扩展仓库示意：机器人、货架、包裹、自动门与充电位" />
              <figcaption><Formula latex={String.raw`100\times100=10\,000`} /></figcaption>
            </figure>
            <div className="vbrl-limit__variables" role="group" aria-label="将状态变量固定为一种，比较组合数量">
            {VARIABLES.map((variable, index) => <Button key={variable.name} active={included[index]} aria-pressed={included[index]}
              aria-label={variable.name + '，' + counts[index] + ' 种' + (included[index] ? '：固定为一种' : '：恢复全部取值')}
              onClick={() => setIncluded(previous => previous.map((value, i) => i === index ? !value : value))}>
              <Typography as="span" variant="bodySmall" tone={included[index] ? 'accent' : 'muted'}>{variable.name}</Typography>
              <span className="vbrl-limit__variable-value" inert><Formula latex={included[index] ? variable.latex : '1'} /></span>
            </Button>)}
            </div>
          </div>
          <Formula latex={String.raw`|S|=10\,000\times${counts.map(count => count.toLocaleString('en-US').replace(/,/g, String.raw`\,`)).join(String.raw`\times`)}`} />
          <div className="vbrl-limit__state-total" aria-live="polite">
            <Typography variant="h2" tone="success">{allIncluded ? '≈123 亿' : largeNumber(states)}个状态</Typography>
            <Typography variant="bodySmall" tone="muted">{allIncluded ? '组合上限 · 点变量固定为 1 种' : '组合上限 · 再点变量恢复全部'}</Typography>
          </div>
        </TeachingPanel>

        <TeachingPanel title="③ 动作也增多，表项继续相乘" className="vbrl-limit__size">
          <Typography variant="bodySmall" tone="accent">8 个动作：上、下、左、右、取件、放件、充电、等待</Typography>
          <div className="vbrl-limit__scale">
            <img className="vbrl-limit__table-art" src={qTableGrowth} alt="层叠网格和存储设备示意 Q 表的存储规模增长" />
            <div className="vbrl-limit__costs">
            <div><Typography variant="bodySmall" tone="muted">Q 表项：状态数 × 8</Typography>
              <Typography variant="h2" tone="danger">{allIncluded ? '≈983 亿' : largeNumber(entries)}个</Typography></div>
            <div><Typography variant="bodySmall" tone="muted">float32 · 4 字节/项</Typography>
              <Typography variant="h2" tone="danger">≈{gb >= 1 ? gb.toFixed(gb >= 100 ? 0 : 2) + ' GB' : (gb * 1000).toFixed(2) + ' MB'}</Typography></div>
            </div>
          </div>
          <div className="vbrl-limit__problems" aria-label="逐项存储带来的三个局限">
            <Typography variant="bodySmall" tone="danger">大表存储昂贵</Typography><Typography variant="bodySmall" tone="danger">难以遍历大表</Typography><Typography variant="bodySmall" tone="danger">相似状态不共享</Typography>
          </div>
        </TeachingPanel>
      </div>
    </div>
  </LessonPage>;
}
