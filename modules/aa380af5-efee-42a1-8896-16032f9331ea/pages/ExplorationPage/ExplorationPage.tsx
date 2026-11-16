import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useMemo, useState } from 'react';
import { Button, RangeControl, Typography } from "@shuku/course-style/react";
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { TeachingHeading, TeachingPanel } from '../../components/TeachingPanel';
import { WarehouseMap } from '../../components/WarehouseMap';
import { ACTIONS, keyOf, START } from '../../model';
import { TRAP } from '../QLearningLoopPage/qLearningSimulation';
import { actionProbabilities, createExplorationQ, evaluateExploration, SNAPSHOT_UPDATES, TRIALS } from './explorationSimulation';
import './ExplorationPage.css';

const emptyStationArt = valueBasedRlAssetUrl('cover-v2/receiving-station-empty.png');
const loadedStationArt = valueBasedRlAssetUrl('cover-v2/receiving-station-loaded.png');
const pitArt = valueBasedRlAssetUrl('cover-v2/maintenance-pit.png');

type Mode = 'greedy' | 'random' | 'mixed';
const MODES = [{ id: 'greedy', label: '只利用' }, { id: 'random', label: '只探索' }, { id: 'mixed', label: 'ε-greedy' }] as const;
const OUTCOMES = { delivered: '送达', trap: '陷阱', limit: '截断' };

function DirectionArrow({ action }: { action: number }) {
  return <svg shuku-edit-id="e-50d3e456-fd64-4f0f-8259-45c9488f1246" className="vbrl-exploration__arrow" viewBox="0 0 24 24" aria-hidden="true">
    <path shuku-edit-id="e-74cb5c57-c00c-430e-8cf3-b8fce7b8ba59" d="M9 22H15V10H22L12 0L2 10H9Z" transform={'rotate(' + action * 90 + ' 12 12)'} />
  </svg>;
}

export function ExplorationPage() {
  const [mode, setMode] = useState<Mode>('mixed'), [customEpsilon, setCustomEpsilon] = useState(.25), [episode, setEpisode] = useState(0);
  const q = useMemo(createExplorationQ, []);
  const epsilon = mode === 'greedy' ? 0 : mode === 'random' ? 1 : customEpsilon;
  const result = useMemo(() => evaluateExploration(q, epsilon), [q, epsilon]);
  const trace = result.records[episode], values = q[keyOf(START)], probabilities = actionProbabilities(values, epsilon);
  const best = values.flatMap((value, action) => Math.abs(value - Math.max(...values)) < 1e-8 ? [action] : []);
  const robot = trace.route[trace.route.length - 1];
  const tone = trace.outcome === 'delivered' ? 'success' : trace.outcome === 'trap' ? 'danger' : 'warning';
  const routeColor = mode === 'random' ? 'var(--ui-accent-alt)' : mode === 'greedy' ? 'var(--ui-accent)' : 'var(--ui-success)';

  return <LessonPage className="vbrl-foundation-page vbrl-exploration-page" title="Q 值还不准，机器人应该怎么选择动作？"
    subtitle="探索尝试不同动作以获取信息，利用选择当前 Q 值最高的动作，ε-greedy 将两者结合。"
    footer={<Typography shuku-edit-id="e-b008c3ae-390f-43ef-9cff-ccc21ae929c5" variant="bodySmall" tone="accent">当前估计最高，不代表真实最好；探索获得新经历，随后仍需用经历更新 Q。</Typography>}>
    <div shuku-edit-id="e-03dda9bb-4f56-4624-bc17-5369cfb87231" className="vbrl-exploration" data-mode={mode} data-epsilon={epsilon} data-episode={episode + 1} data-outcome={trace.outcome}
      data-source-updates={SNAPSHOT_UPDATES} data-coverage={result.coverage} data-deliveries={result.deliveries} data-traps={result.traps}>
      <section shuku-edit-id="e-b1c2333f-5f29-4ea4-83d7-571c474bc383" className="vbrl-exploration__warehouse" aria-label="当前选动作规则的实际走法">
        <TeachingHeading aside={<><Typography shuku-edit-id="e-9b5d374b-0052-4a45-80ef-67d2ce6bea30" variant="bodySmall" tone="inherit">{OUTCOMES[trace.outcome]}</Typography>
          <Button onClick={() => setEpisode(value => (value + 1) % TRIALS)} aria-label="查看下一回合路线">回合 {episode + 1} →</Button></>}>实际走法</TeachingHeading>
        <div shuku-edit-id="e-55cd6307-adc1-4a20-b4ca-e57135bb62b0" className="vbrl-exploration__map-body">
          <WarehouseMap className="vbrl-exploration__map" coordinates selected={START} robot={robot} markers={{ [keyOf(TRAP)]: '!' }}
            goalArt={trace.outcome === 'delivered' ? loadedStationArt : emptyStationArt} dangerArt={pitArt}
            trails={[{ points: trace.route, color: routeColor }]} />
          <div shuku-edit-id="e-dbd0193a-18ad-4cac-b116-39433d86b8c2" className="vbrl-exploration__metrics" aria-label="三十次实际试走的结果">
            {[
              { label: '访问格数', value: String(result.coverage), tone: 'accent' },
              { label: '送达次数', value: result.deliveries + '/' + TRIALS, tone: result.deliveries ? 'success' : 'muted' },
              { label: '陷阱次数', value: result.traps + '/' + TRIALS, tone: result.traps ? 'danger' : 'muted' },
            ].map(metric => <div shuku-edit-id="e-f6e67aa0-d40b-40b5-9cd0-103ff10d384f" key={metric.label}><Typography shuku-edit-id="e-55cbba97-d134-49ca-b148-c0aca90d23b3" variant="bodySmall" tone="muted">{metric.label}</Typography>
              <Typography shuku-edit-id="e-65a459a9-fe2e-45d4-b036-f42fed2b35c6" variant="body" tone={metric.tone as 'accent' | 'success' | 'danger' | 'muted'}>{metric.value}</Typography></div>)}
          </div>
        </div>
      </section>
      <TeachingPanel title="给当前估计留一些尝试的机会" className="vbrl-exploration__decision">
        <div shuku-edit-id="e-b5d549aa-c0eb-4af1-94aa-169947849f79" className="vbrl-exploration__modes" role="group" aria-label="选择行为策略">
          <Typography shuku-edit-id="e-24e78744-4003-437d-92bc-7ad30ae60c79" variant="bodySmall" tone="muted">选动作的规则</Typography>
          {MODES.map(item => <Button key={item.id} active={mode === item.id} aria-pressed={mode === item.id} onClick={() => { setMode(item.id); setEpisode(0); }}>{item.label}</Button>)}
        </div>
        <RangeControl label="探索率 ε" min={0} max={1} step={.05} digits={2} value={epsilon} disabled={mode !== 'mixed'}
          onChange={event => { setCustomEpsilon(Number(event.target.value)); setEpisode(0); }} />
        <div shuku-edit-id="e-16b809d7-64ea-4c38-9547-6211b9817ee7" className="vbrl-exploration__allocation">
          <div shuku-edit-id="e-3d0a127b-9475-4a86-b64e-a1bfbcc56aed" className="vbrl-exploration__branch-labels">
            <div shuku-edit-id="e-139b3db0-8f56-4c53-ba21-7e682765798d" className="vbrl-exploration__branch is-exploit">
              <div shuku-edit-id="e-d5505cdd-7fa7-4033-af19-83402cc604c2"><Typography shuku-edit-id="e-752bf9fd-a962-4be1-9acc-2c66acc07d1c" variant="body" tone="accent">利用</Typography><Formula latex={'1-\\varepsilon=' + Math.round((1 - epsilon) * 100) + '\\%'} /></div>
              <Typography shuku-edit-id="e-fcc294ac-9335-4558-9124-2c140a2af0f5" variant="bodySmall" tone="muted">选择当前 Q 值最大的动作</Typography>
            </div>
            <div shuku-edit-id="e-6a744f70-94af-4377-8d13-ee06a89288c7" className="vbrl-exploration__branch is-explore">
              <div shuku-edit-id="e-a8f57235-0832-41de-bfe4-e3d5d29b37af"><Typography shuku-edit-id="e-9e831590-a888-4910-98dd-97ab62d52240" variant="body" tone="warning">探索</Typography><Formula latex={'\\varepsilon=' + Math.round(epsilon * 100) + '\\%'} /></div>
              <Typography shuku-edit-id="e-22569678-9ec7-4d49-b053-38b81eda90a0" variant="bodySmall" tone="muted">从四个方向中随机选择</Typography>
            </div>
          </div>
          <div shuku-edit-id="e-a8dad937-37ab-414f-a011-bab850bb4bbb" className="vbrl-exploration__probability-bar" role="img" aria-label={'利用占 ' + Math.round((1 - epsilon) * 100) + '%，随机探索占 ' + Math.round(epsilon * 100) + '%'}>
            <div shuku-edit-id="e-b5eceddf-3370-4c4f-9080-be9d38d19034" className="is-exploit" style={{ width: (1 - epsilon) * 100 + '%' }} /><div shuku-edit-id="e-6723ab54-3a46-4b3d-bb2f-c074a098a818" className="is-explore" style={{ width: epsilon * 100 + '%' }} />
          </div>
        </div>
        <table shuku-edit-id="e-badebad1-bbdb-4734-b120-bfc986f4697e" className="vbrl-exploration__actions" aria-label="起点的 Q 值与四个动作的实际选择概率">
          <thead shuku-edit-id="e-173c1e0e-96bd-4cfe-8a16-f697bb042ca8"><tr shuku-edit-id="e-9fdd712c-e504-4883-a884-fd25ee94b75f"><th shuku-edit-id="e-8dbf74e6-6e2d-4822-b2de-96fb1459057a"><Typography shuku-edit-id="e-8ee04b42-255a-4c6d-bddf-fde563cbecc1" variant="bodySmall" tone="muted">起点 (6,2)</Typography></th>{ACTIONS.map((label, action) => <th shuku-edit-id="e-2dd5166b-50c6-4387-a743-5396e3b22225" key={label} className={best.includes(action) ? 'is-best' : undefined}>
            <div shuku-edit-id="e-5c2f38ac-30be-46cd-a354-c4399b2e8b36"><DirectionArrow action={action} /><Typography shuku-edit-id="e-1757d69c-a7e0-476e-9aa3-acb3366a3b58" variant="bodySmall" tone="accent">{label}</Typography>{best.includes(action) && <Typography shuku-edit-id="e-63e12ebb-b861-4903-a031-ce2d052a112f" variant="bodySmall" tone="success">最大</Typography>}</div></th>)}</tr></thead>
          <tbody shuku-edit-id="e-2482beb3-099f-4365-8371-a6928679563a"><tr shuku-edit-id="e-bc76f088-75c5-447a-8cf3-a61e58bb83d3"><th shuku-edit-id="e-c016b2c4-9c65-4efb-b508-fef10a075a93"><Formula latex="Q(s,a)" /></th>{values.map((value, action) => <td shuku-edit-id="e-a6ebc0ef-b609-446d-b447-7cccf6f25080" key={action} data-q-action={action} data-q={value} className={best.includes(action) ? 'is-best' : undefined}>
            <Typography shuku-edit-id="e-0fdd2c60-9a7e-4329-8946-0550d150efb1" variant="bodySmall" tone={value < 0 ? 'danger' : value > 0 ? 'success' : 'muted'}>{value.toFixed(2)}</Typography></td>)}</tr>
            <tr shuku-edit-id="e-592ab0d9-d6a9-4685-8d78-5e54319b3330"><th shuku-edit-id="e-3346bb83-ee12-4b08-98bf-0885e0374020"><Typography shuku-edit-id="e-4645486d-253e-4b38-96ea-8b89c4ec59ad" variant="bodySmall" tone="accent">动作概率</Typography></th>{probabilities.map((probability, action) => <td shuku-edit-id="e-b53dbd83-f81f-46c1-a1ee-2d8003f39ce9" key={action} data-probability-action={action} data-probability={probability} className={best.includes(action) ? 'is-best' : undefined}>
              <Typography shuku-edit-id="e-10733ef4-4719-4a12-8346-97c1163b256a" variant="bodySmall" tone="accent">{(probability * 100).toFixed(2)}%</Typography></td>)}</tr></tbody>
        </table>
        <div shuku-edit-id="e-e03ffa76-ba99-4b55-9a51-28a4cbf979dd" className="vbrl-exploration__notes">
          <Typography shuku-edit-id="e-be8dad01-ee37-42db-be35-451d7ace0c18" variant="bodySmall" tone="accent">随机探索也可能选中当前 Q 值最大的动作。</Typography>
          <Typography shuku-edit-id="e-b5097025-624a-4e4e-8b48-60e440bc6267" variant="bodySmall" tone="muted">固定同一份早期 Q 表，比较 30 次实际试走；本页不更新 Q。</Typography>
        </div>
      </TeachingPanel>
    </div>
  </LessonPage>;
}
