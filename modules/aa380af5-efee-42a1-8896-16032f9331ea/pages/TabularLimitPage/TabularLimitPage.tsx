import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import { WarehouseMap } from '../../components/WarehouseMap';
import { BLOCKED, GRID, START, keyOf } from '../../model';
import { TRAP } from '../QLearningLoopPage/qLearningSimulation';
import './TabularLimitPage.css';

const emptyStationArt = valueBasedRlAssetUrl("cover-v2/receiving-station-empty.webp");
const pitArt = valueBasedRlAssetUrl("cover-v2/maintenance-pit.webp");
const directionKeycap = valueBasedRlAssetUrl("cover-v2/direction-keycap.webp");
const expandedWarehouse = valueBasedRlAssetUrl("tabular-limit/expanded-warehouse.webp");
const qTableGrowth = valueBasedRlAssetUrl("tabular-limit/q-table-growth.webp");

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
    <div shuku-edit-id="e-fe8643ea-be5e-4e40-9a39-34a8b1e6064b" className="vbrl-limit" data-states={states} data-entries={entries} data-storage-gb={gb} data-actions={ACTION_COUNT}>
      <TeachingPanel title="① 7×7 的小地图" className="vbrl-limit__small">
        <WarehouseMap className="vbrl-limit__map" coordinates selected={START} markers={{ [keyOf(TRAP)]: '!' }} goalArt={emptyStationArt} dangerArt={pitArt} />
        <div shuku-edit-id="e-070a0a19-4c58-4faa-a9d3-773181f23e2e" className="vbrl-limit__small-count"><Typography shuku-edit-id="e-dc209200-a2bf-4109-aa25-537461d3b3b2" variant="bodySmall" tone="muted">{SMALL_STATES} 个非障碍格</Typography>
          <Formula latex={`${SMALL_STATES}\\times4=176`} /></div>
        <div shuku-edit-id="e-1352baa8-bff0-40cb-83b0-b10be0c95fc0" className="vbrl-limit__actions" aria-label="四个移动动作">
          {['向上', '向右', '向下', '向左'].map((label, action) => <div shuku-edit-id="e-b2e3dbba-83dc-4990-a6f0-465aa1ee8008" key={label}>
            <div shuku-edit-id="e-4fc50835-f1f4-4a2c-bbf8-3227a59929ed" className="vbrl-limit__keycap"><img shuku-edit-id="e-f8ce22e1-46b9-4bda-b3ac-932cbfce73e8" src={directionKeycap} alt="" /><svg shuku-edit-id="e-79404392-4a57-4d3c-abfd-b617cdbeb606" viewBox="0 0 24 24" aria-hidden="true"><path shuku-edit-id="e-c40ca433-d705-4584-918c-d6fe56d3f149" d="M9 22h6V10h7L12 0 2 10h7z" transform={`rotate(${action * 90} 12 12)`} /></svg></div>
            <Typography shuku-edit-id="e-0aa3037c-e5da-4741-852c-0551890fd383" variant="bodySmall" tone="accent">{label}</Typography>
          </div>)}
        </div>
        <Typography shuku-edit-id="e-12b8fb65-79fc-4db1-b7f5-4a392c8afcba" variant="bodySmall" tone="success">4 个移动动作，逐项存储与学习。</Typography>
      </TeachingPanel>

      <div shuku-edit-id="e-ca0b3c09-b627-428f-9d50-bf33e899029b" className="vbrl-limit__growth">
        <TeachingPanel title="② 扩展仓库示例：状态变量相乘" className="vbrl-limit__states">
          <div shuku-edit-id="e-41c4cd8e-2fb9-4ba8-bb94-ec4c8bbc491e" className="vbrl-limit__visual-state">
            <figure shuku-edit-id="e-23913c31-f634-4d97-96c4-0652ece37939" className="vbrl-limit__warehouse-art">
              <img shuku-edit-id="e-210ba314-af8e-4d18-a1e9-676ae79ed1c1" src={expandedWarehouse} alt="扩展仓库示意：机器人、货架、包裹、自动门与充电位" />
              <figcaption shuku-edit-id="e-64442fc7-e81a-4bbf-91a7-e29911057f6f"><Formula latex={String.raw`100\times100=10\,000`} /></figcaption>
            </figure>
            <div shuku-edit-id="e-117bcccc-499e-49ee-8f34-152d818bb0d9" className="vbrl-limit__variables" role="group" aria-label="将状态变量固定为一种，比较组合数量">
            {VARIABLES.map((variable, index) => <Button key={variable.name} active={included[index]} aria-pressed={included[index]}
              aria-label={variable.name + '，' + counts[index] + ' 种' + (included[index] ? '：固定为一种' : '：恢复全部取值')}
              onClick={() => setIncluded(previous => previous.map((value, i) => i === index ? !value : value))}>
              <Typography shuku-edit-id="e-481ee4a5-3f9f-4da5-a9d3-07b4a87e3ed4" as="span" variant="bodySmall" tone={included[index] ? 'accent' : 'muted'}>{variable.name}</Typography>
              <span shuku-edit-id="e-59822860-8227-4749-8ede-189299ba53d2" className="vbrl-limit__variable-value" inert><Formula latex={included[index] ? variable.latex : '1'} /></span>
            </Button>)}
            </div>
          </div>
          <Formula latex={String.raw`|S|=10\,000\times${counts.map(count => count.toLocaleString('en-US').replace(/,/g, String.raw`\,`)).join(String.raw`\times`)}`} />
          <div shuku-edit-id="e-1fa2e589-4330-418d-ac08-10f8e2eb05e3" className="vbrl-limit__state-total" aria-live="polite">
            <Typography shuku-edit-id="e-02bb9e14-58d7-4008-ace8-0e51e12fb30a" variant="h2" tone="success">{allIncluded ? '≈123 亿' : largeNumber(states)}个状态</Typography>
            <Typography shuku-edit-id="e-4532b9f4-6b1c-4e4c-b923-83fe73ebd4f5" variant="bodySmall" tone="muted">{allIncluded ? '组合上限 · 点变量固定为 1 种' : '组合上限 · 再点变量恢复全部'}</Typography>
          </div>
        </TeachingPanel>

        <TeachingPanel title="③ 动作也增多，表项继续相乘" className="vbrl-limit__size">
          <Typography shuku-edit-id="e-70489a8b-272c-4d86-af58-24cd48568fbb" variant="bodySmall" tone="accent">8 个动作：上、下、左、右、取件、放件、充电、等待</Typography>
          <div shuku-edit-id="e-01d1a871-6e24-4d51-9b7e-0ca5fdbd3ec8" className="vbrl-limit__scale">
            <img shuku-edit-id="e-ce57280f-4f96-44e7-8f41-46dc281d78be" className="vbrl-limit__table-art" src={qTableGrowth} alt="层叠网格和存储设备示意 Q 表的存储规模增长" />
            <div shuku-edit-id="e-074b141a-a374-4b01-9be1-0f7341693a13" className="vbrl-limit__costs">
            <div shuku-edit-id="e-9462caac-5ad1-451d-8780-9414ee98991b"><Typography shuku-edit-id="e-a19582c3-b6f0-4d24-a78d-84b3b925f6b0" variant="bodySmall" tone="muted">Q 表项：状态数 × 8</Typography>
              <Typography shuku-edit-id="e-917a6ffd-b2f0-4a62-b4e3-37a8d6251538" variant="h2" tone="danger">{allIncluded ? '≈983 亿' : largeNumber(entries)}个</Typography></div>
            <div shuku-edit-id="e-d9fa6371-a556-423b-a2ba-acd41026e946"><Typography shuku-edit-id="e-32baceaa-956a-4fab-9bcb-9b843cd10a5e" variant="bodySmall" tone="muted">float32 · 4 字节/项</Typography>
              <Typography shuku-edit-id="e-58361e1e-5970-4df8-b4e6-e0567d4a3148" variant="h2" tone="danger">≈{gb >= 1 ? gb.toFixed(gb >= 100 ? 0 : 2) + ' GB' : (gb * 1000).toFixed(2) + ' MB'}</Typography></div>
            </div>
          </div>
          <div shuku-edit-id="e-7e152a00-c6b3-4d6b-8291-1d2ccc44e4e0" className="vbrl-limit__problems" aria-label="逐项存储带来的三个局限">
            <Typography shuku-edit-id="e-9c371ea9-3230-475b-9b2b-90042a1b58ff" variant="bodySmall" tone="danger">大表存储昂贵</Typography><Typography shuku-edit-id="e-dd9cd731-9d9b-4db0-9420-a2372cc662f8" variant="bodySmall" tone="danger">难以遍历大表</Typography><Typography shuku-edit-id="e-e69a630a-82e1-4314-a20d-5f4e1daafa7d" variant="bodySmall" tone="danger">相似状态不共享</Typography>
          </div>
        </TeachingPanel>
      </div>
    </div>
  </LessonPage>;
}
