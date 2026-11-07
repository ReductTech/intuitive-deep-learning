import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useState, type CSSProperties } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { WarehouseMap } from '../../components/WarehouseMap';
import { TeachingHeading, TeachingPanel } from '../../components/TeachingPanel';
import { ACTIONS, BLOCKED, GOAL, GRID, keyOf, type Position } from '../../model';
import { TRAP } from '../QLearningLoopPage/qLearningSimulation';
import snapshot from './qTableSnapshot.json';
import './QTablePage.css';

const emptyStationArt = valueBasedRlAssetUrl('cover-v2/receiving-station-empty.png');
const pitArt = valueBasedRlAssetUrl('cover-v2/maintenance-pit.png');

const isTerminal = (position: Position) => [keyOf(GOAL), keyOf(TRAP)].includes(keyOf(position));
const coordinates = (position: Position) => `(${position.row + 1},${position.col + 1})`;
const trainedQ: Record<string, readonly number[]> = snapshot.q;
const visits: Record<string, number> = snapshot.visits;
const qAt = (position: Position) => trainedQ[keyOf(position)];
const actionOrder = [0, 2, 3, 1];
const actionSymbols = [String.raw`\uparrow`, String.raw`\rightarrow`, String.raw`\downarrow`, String.raw`\leftarrow`];
const bestActions = (position: Position) => {
  if (isTerminal(position)) return [];
  const values = qAt(position), best = Math.max(...values);
  // Compare stored values rather than rounded labels; tolerate arithmetic noise only.
  return actionOrder.filter(action => Math.abs(values[action] - best) < 1e-9);
};
const valueStyle = (value: number) => ({
  '--vbrl-q-alpha': Math.min(.3, Math.abs(value) / 10 * .3),
  '--vbrl-q-color': value < 0 ? 'var(--ui-danger)' : 'var(--ui-success)',
}) as CSSProperties;
const states = Array.from({ length: GRID * GRID }, (_, index) => ({ row: Math.floor(index / GRID), col: index % GRID }))
  .filter(position => !BLOCKED.includes(keyOf(position)));
const sectionSize = Math.ceil(states.length / 4);
const sections = Array.from({ length: 4 }, (_, index) => states.slice(index * sectionSize, (index + 1) * sectionSize));
const initialState = { row: 3, col: 5 };

function DirectionArrow({ action }: { action: number }) {
  return <svg className="vbrl-qtable__arrow" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 22H15V10H22L12 0L2 10H9Z" transform={`rotate(${action * 90} 12 12)`} />
  </svg>;
}

function QValueTable({ positions, state, action, complete = false, onState, onAction }: {
  positions: readonly Position[]; state: Position; action: number | null; complete?: boolean;
  onState: (position: Position, action?: number) => void; onAction: (action: number) => void;
}) {
  const best = bestActions(state), terminal = isTerminal(state);
  return <table className={'vbrl-qtable__table' + (complete ? ' is-complete' : '')} aria-label={complete ? '完整 Q 表分段' : 'Q 表局部'}>
    <thead><tr>
      <th scope="col"><Typography variant="bodySmall" tone="accent">状态</Typography></th>
      {actionOrder.map(direction => <th key={direction} scope="col" data-column-action={direction} className={direction === action ? 'is-action-selected' : undefined}>
        <Button className="vbrl-qtable__column-button" onClick={() => onAction(direction)} disabled={terminal}
          active={direction === action} aria-pressed={direction === action} aria-label={`选择${ACTIONS[direction]}列`}>
          <DirectionArrow action={direction} />
        </Button>
      </th>)}
    </tr></thead>
    <tbody>{positions.map(position => {
      const selected = keyOf(position) === keyOf(state), ended = isTerminal(position);
      return <tr key={keyOf(position)} data-state={keyOf(position)} className={(selected ? 'is-state-selected' : '') + (ended ? ' is-terminal' : '')}>
        <th scope="row"><Button className="vbrl-qtable__state-button" onClick={() => onState(position)} active={selected}
          aria-pressed={selected} aria-label={`定位状态 ${coordinates(position)}${ended ? '，终止状态' : ''}`}>
          <Typography variant="bodySmall" tone={selected ? 'accent' : 'muted'} wrap="nowrap">{coordinates(position)}</Typography>
        </Button></th>
        {actionOrder.map(direction => {
          const value = qAt(position)[direction], chosen = selected && direction === action;
          return <td key={direction} data-action={direction} data-q={value}
            className={(direction === action ? 'is-action-selected' : '') + (selected && best.includes(direction) ? ' is-best' : '') + (chosen ? ' is-q-selected' : '')}
            style={valueStyle(value)}>
            <Button className="vbrl-qtable__value-button" onClick={() => onState(position, direction)} active={chosen} aria-pressed={chosen}
              aria-label={`状态 ${coordinates(position)}，${ACTIONS[direction]}，Q 值 ${value.toFixed(2)}`}>
              <Typography variant="bodySmall" tone={ended ? 'muted' : value < 0 ? 'danger' : value > 0 ? 'success' : 'accent'} wrap="nowrap">{value.toFixed(2)}</Typography>
            </Button>
          </td>;
        })}
      </tr>;
    })}</tbody>
    {!complete && <tfoot><tr>{Array.from({ length: 5 }, (_, index) => <td key={index}><Typography variant="bodySmall" tone="muted">…</Typography></td>)}</tr></tfoot>}
  </table>;
}

export function QTablePage() {
  const [state, setState] = useState<Position>(initialState);
  const [action, setAction] = useState<number | null>(2);
  const [view, setView] = useState<'detail' | 'all'>('detail');
  const terminal = isTerminal(state), best = bestActions(state), values = qAt(state);
  const unlearned = !visits[keyOf(state)];
  const index = states.findIndex(position => keyOf(position) === keyOf(state));
  const excerptStart = Math.max(0, Math.min(states.length - 4, index - 1));
  const excerpt = states.slice(excerptStart, excerptStart + 4);
  const greedy = best.includes(action ?? -1) ? action! : best[0];

  function selectState(position: Position, direction?: number) {
    setState(position);
    setAction(isTerminal(position) ? null : direction ?? bestActions(position)[0]);
    setView('detail');
  }
  function selectAction(direction: number) { if (!terminal) setAction(direction); }

  const greedyLatex = terminal ? String.raw`V(s_{\mathrm{terminal}})=0`
    : unlearned ? String.raw`Q(s,a)=0,\quad\forall a`
      : best.length > 1 ? String.raw`a_{\mathrm{greedy}}\in\arg\max_a Q(s,a)`
        : String.raw`a_{\mathrm{greedy}}=\arg\max_a Q(s,a)` + `=${actionSymbols[greedy]}`;
  const decisionNote = terminal ? '回合已结束，不再选择动作。'
    : unlearned ? '四个值仍是初值，暂时不能说明哪个动作更好。'
      : best.length > 1 ? '最大值并列，可从中任选一个。这里只演示利用。'
        : '选择长期评分最高的动作。这里只演示利用，后面再加入探索。';

  return <LessonPage className="vbrl-foundation-page vbrl-qtable-page" title="Q 表：把每个状态的动作价值存起来"
    subtitle="Q 表按状态与动作存储长期回报的估计：一行对应一个状态，一列对应一个动作。"
    footer={<div className="vbrl-qtable__footer"><Typography variant="bodySmall" tone="accent">Q 表把动作价值整理成表格，每个数对应一个状态和动作。</Typography>
      <Typography variant="bodySmall" tone="accent">怎样更新这些评分？下一步：Bellman 目标。</Typography></div>}>
    <div className={'vbrl-qtable is-' + view} data-selected-state={keyOf(state)} data-selected-action={action ?? ''} data-view={view}
      data-best-actions={best.join(',')} data-training-updates={snapshot.training.updates}>
      {view === 'all' ? <section className="vbrl-qtable__full" aria-label="完整 Q 表">
        <TeachingHeading aside={<Button onClick={() => setView('detail')}>返回讲解</Button>}>完整 Q 表：每一行是一种状态</TeachingHeading>
        <div className="vbrl-qtable__tables">{sections.map((positions, section) => <QValueTable key={section} positions={positions}
          state={state} action={action} complete onState={selectState} onAction={selectAction} />)}</div>
      </section> : <>
        <TeachingPanel title="当前状态的四个动作价值" className="vbrl-qtable__warehouse">
          <div className="vbrl-qtable__scene">
            <WarehouseMap className="vbrl-qtable__map" robot={state} selected={state} onSelect={selectState} coordinates
              markers={{ [keyOf(TRAP)]: '!' }} goalArt={emptyStationArt} dangerArt={pitArt}
              update={!terminal && action !== null ? { position: state, action } : undefined} />
            <div className="vbrl-qtable__actions" role="group" aria-label="当前状态的四个动作价值">
              {actionOrder.map(direction => <Button key={direction} data-map-action={direction} data-q={values[direction]}
                className={'vbrl-qtable__direction' + (best.includes(direction) ? ' is-best' : '')}
                style={valueStyle(values[direction])} active={action === direction} aria-pressed={action === direction} disabled={terminal}
                onClick={() => selectAction(direction)} aria-label={`${ACTIONS[direction]}，Q 值 ${values[direction].toFixed(2)}`}>
                <DirectionArrow action={direction} /><div className="vbrl-qtable__action-value" inert>
                  <div className="vbrl-qtable__action-label"><Typography variant="bodySmall" tone="accent">{ACTIONS[direction]}</Typography>
                    {best.includes(direction) && <Typography variant="bodySmall" tone="success">最大</Typography>}</div>
                  <Formula latex={'Q=' + values[direction].toFixed(2)} />
                </div>
              </Button>)}
            </div>
          </div>
          <div className="vbrl-qtable__state" aria-live="polite"><Typography variant="bodySmall" tone="accent">当前状态</Typography>
            <Formula latex={`s=(${state.row + 1},${state.col + 1})`} /><Typography variant="bodySmall" tone="muted">行，列</Typography></div>
          <Typography variant="bodySmall" tone="muted" align="center">{terminal ? '终止状态的后续价值为 0。' : '同一个状态，不同动作有不同的长期评分。'}</Typography>
        </TeachingPanel>
        <section className="vbrl-qtable__overview" aria-label="把动作价值整理成 Q 表">
          <TeachingHeading aside={<Button onClick={() => setView('all')}>完整 Q 表</Button>}>把动作价值整理成 Q 表</TeachingHeading>
          <div className="vbrl-qtable__lesson">
            <QValueTable positions={excerpt} state={state} action={action} onState={selectState} onAction={selectAction} />
            <div className="vbrl-qtable__reading" aria-label="使用 Q 表的三个步骤">
              <div><Typography as="span" variant="bodySmall" tone="inherit" className="vbrl-qtable__step">1</Typography><Typography variant="bodySmall" tone="accent">找到状态行</Typography></div>
              <DirectionArrow action={1} /><div><Typography as="span" variant="bodySmall" tone="inherit" className="vbrl-qtable__step">2</Typography><Typography variant="bodySmall" tone="accent">比较四个值</Typography></div>
              <DirectionArrow action={1} /><Button className="vbrl-qtable__greedy" disabled={terminal} onClick={() => selectAction(greedy)} aria-label="暂选最大值">
                <Typography as="span" variant="bodySmall" tone="inherit" className="vbrl-qtable__step">3</Typography><Typography variant="bodySmall" tone="accent">暂选最大值</Typography>
              </Button>
            </div>
            <div className="vbrl-qtable__decision" role="status" aria-live="polite"><Formula latex={greedyLatex} />
              <Typography variant="bodySmall" tone="muted">{decisionNote}</Typography></div>
            <div className="vbrl-qtable__initial"><Typography as="span" variant="bodySmall" tone="warning" className="vbrl-qtable__initial-mark">!</Typography>
              <Typography variant="bodySmall" tone="warning">未更新的初值 0，不代表四个动作真的一样好。</Typography></div>
          </div>
        </section>
      </>}
    </div>
  </LessonPage>;
}
