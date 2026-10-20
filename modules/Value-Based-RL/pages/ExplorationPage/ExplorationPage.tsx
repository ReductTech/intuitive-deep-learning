import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useMemo, useState } from 'react';
import { Button, RangeControl, Typography } from '../../../shared/react';
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
  return <svg className="vbrl-exploration__arrow" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 22H15V10H22L12 0L2 10H9Z" transform={'rotate(' + action * 90 + ' 12 12)'} />
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
    footer={<Typography variant="bodySmall" tone="accent">当前估计最高，不代表真实最好；探索获得新经历，随后仍需用经历更新 Q。</Typography>}>
    <div className="vbrl-exploration" data-mode={mode} data-epsilon={epsilon} data-episode={episode + 1} data-outcome={trace.outcome}
      data-source-updates={SNAPSHOT_UPDATES} data-coverage={result.coverage} data-deliveries={result.deliveries} data-traps={result.traps}>
      <section className="vbrl-exploration__warehouse" aria-label="当前选动作规则的实际走法">
        <TeachingHeading aside={<><Typography variant="bodySmall" tone="inherit">{OUTCOMES[trace.outcome]}</Typography>
          <Button onClick={() => setEpisode(value => (value + 1) % TRIALS)} aria-label="查看下一回合路线">回合 {episode + 1} →</Button></>}>实际走法</TeachingHeading>
        <div className="vbrl-exploration__map-body">
          <WarehouseMap className="vbrl-exploration__map" coordinates selected={START} robot={robot} markers={{ [keyOf(TRAP)]: '!' }}
            goalArt={trace.outcome === 'delivered' ? loadedStationArt : emptyStationArt} dangerArt={pitArt}
            trails={[{ points: trace.route, color: routeColor }]} />
          <div className="vbrl-exploration__metrics" aria-label="三十次实际试走的结果">
            {[
              { label: '访问格数', value: String(result.coverage), tone: 'accent' },
              { label: '送达次数', value: result.deliveries + '/' + TRIALS, tone: result.deliveries ? 'success' : 'muted' },
              { label: '陷阱次数', value: result.traps + '/' + TRIALS, tone: result.traps ? 'danger' : 'muted' },
            ].map(metric => <div key={metric.label}><Typography variant="bodySmall" tone="muted">{metric.label}</Typography>
              <Typography variant="body" tone={metric.tone as 'accent' | 'success' | 'danger' | 'muted'}>{metric.value}</Typography></div>)}
          </div>
        </div>
      </section>
      <TeachingPanel title="给当前估计留一些尝试的机会" className="vbrl-exploration__decision">
        <div className="vbrl-exploration__modes" role="group" aria-label="选择行为策略">
          <Typography variant="bodySmall" tone="muted">选动作的规则</Typography>
          {MODES.map(item => <Button key={item.id} active={mode === item.id} aria-pressed={mode === item.id} onClick={() => { setMode(item.id); setEpisode(0); }}>{item.label}</Button>)}
        </div>
        <RangeControl label="探索率 ε" min={0} max={1} step={.05} digits={2} value={epsilon} disabled={mode !== 'mixed'}
          onChange={event => { setCustomEpsilon(Number(event.target.value)); setEpisode(0); }} />
        <div className="vbrl-exploration__allocation">
          <div className="vbrl-exploration__branch-labels">
            <div className="vbrl-exploration__branch is-exploit">
              <div><Typography variant="body" tone="accent">利用</Typography><Formula latex={'1-\\varepsilon=' + Math.round((1 - epsilon) * 100) + '\\%'} /></div>
              <Typography variant="bodySmall" tone="muted">选择当前 Q 值最大的动作</Typography>
            </div>
            <div className="vbrl-exploration__branch is-explore">
              <div><Typography variant="body" tone="warning">探索</Typography><Formula latex={'\\varepsilon=' + Math.round(epsilon * 100) + '\\%'} /></div>
              <Typography variant="bodySmall" tone="muted">从四个方向中随机选择</Typography>
            </div>
          </div>
          <div className="vbrl-exploration__probability-bar" role="img" aria-label={'利用占 ' + Math.round((1 - epsilon) * 100) + '%，随机探索占 ' + Math.round(epsilon * 100) + '%'}>
            <div className="is-exploit" style={{ width: (1 - epsilon) * 100 + '%' }} /><div className="is-explore" style={{ width: epsilon * 100 + '%' }} />
          </div>
        </div>
        <table className="vbrl-exploration__actions" aria-label="起点的 Q 值与四个动作的实际选择概率">
          <thead><tr><th><Typography variant="bodySmall" tone="muted">起点 (6,2)</Typography></th>{ACTIONS.map((label, action) => <th key={label} className={best.includes(action) ? 'is-best' : undefined}>
            <div><DirectionArrow action={action} /><Typography variant="bodySmall" tone="accent">{label}</Typography>{best.includes(action) && <Typography variant="bodySmall" tone="success">最大</Typography>}</div></th>)}</tr></thead>
          <tbody><tr><th><Formula latex="Q(s,a)" /></th>{values.map((value, action) => <td key={action} data-q-action={action} data-q={value} className={best.includes(action) ? 'is-best' : undefined}>
            <Typography variant="bodySmall" tone={value < 0 ? 'danger' : value > 0 ? 'success' : 'muted'}>{value.toFixed(2)}</Typography></td>)}</tr>
            <tr><th><Typography variant="bodySmall" tone="accent">动作概率</Typography></th>{probabilities.map((probability, action) => <td key={action} data-probability-action={action} data-probability={probability} className={best.includes(action) ? 'is-best' : undefined}>
              <Typography variant="bodySmall" tone="accent">{(probability * 100).toFixed(2)}%</Typography></td>)}</tr></tbody>
        </table>
        <div className="vbrl-exploration__notes">
          <Typography variant="bodySmall" tone="accent">随机探索也可能选中当前 Q 值最大的动作。</Typography>
          <Typography variant="bodySmall" tone="muted">固定同一份早期 Q 表，比较 30 次实际试走；本页不更新 Q。</Typography>
        </div>
      </TeachingPanel>
    </div>
  </LessonPage>;
}
