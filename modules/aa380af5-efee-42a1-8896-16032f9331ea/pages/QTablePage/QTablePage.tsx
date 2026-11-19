import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useState, type CSSProperties } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { WarehouseMap } from '../../components/WarehouseMap';
import { TeachingHeading, TeachingPanel } from '../../components/TeachingPanel';
import { ACTIONS, BLOCKED, GOAL, GRID, keyOf, type Position } from '../../model';
import { TRAP } from '../QLearningLoopPage/qLearningSimulation';
import snapshot from './qTableSnapshot.json';
import './QTablePage.css';

const emptyStationArt = valueBasedRlAssetUrl("cover-v2/receiving-station-empty.webp");
const pitArt = valueBasedRlAssetUrl("cover-v2/maintenance-pit.webp");

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
  return <svg shuku-edit-id="e-38e4ecb4-b79a-4313-b659-8709f5a5e8bd" className="vbrl-qtable__arrow" viewBox="0 0 24 24" aria-hidden="true">
    <path shuku-edit-id="e-4a382ce8-9408-495a-b28b-d39fdbf83b0d" d="M9 22H15V10H22L12 0L2 10H9Z" transform={`rotate(${action * 90} 12 12)`} />
  </svg>;
}

function QValueTable({ positions, state, action, complete = false, onState, onAction }: {
  positions: readonly Position[]; state: Position; action: number | null; complete?: boolean;
  onState: (position: Position, action?: number) => void; onAction: (action: number) => void;
}) {
  const best = bestActions(state), terminal = isTerminal(state);
  return <table shuku-edit-id="e-eca7d401-71c5-4afe-a89d-e9ef56e551b2" className={'vbrl-qtable__table' + (complete ? ' is-complete' : '')} aria-label={complete ? '完整 Q 表分段' : 'Q 表局部'}>
    <thead shuku-edit-id="e-7a224bc8-2784-42ba-9fbf-c491645013d4"><tr shuku-edit-id="e-98058c47-d412-4acb-8433-c42615999e19">
      <th shuku-edit-id="e-664e3c45-6b81-4b78-8d1b-0f6eb8b8f3ab" scope="col"><Typography shuku-edit-id="e-c8e28492-8371-47d4-873a-1e6975ff8a29" variant="bodySmall" tone="accent">状态</Typography></th>
      {actionOrder.map(direction => <th shuku-edit-id="e-99280c3a-e45e-4fab-83a1-e4c7a5664001" key={direction} scope="col" data-column-action={direction} className={direction === action ? 'is-action-selected' : undefined}>
        <Button className="vbrl-qtable__column-button" onClick={() => onAction(direction)} disabled={terminal}
          active={direction === action} aria-pressed={direction === action} aria-label={`选择${ACTIONS[direction]}列`}>
          <DirectionArrow action={direction} />
        </Button>
      </th>)}
    </tr></thead>
    <tbody shuku-edit-id="e-101ebe54-0a46-4d17-89cd-5e4c5c93f790">{positions.map(position => {
      const selected = keyOf(position) === keyOf(state), ended = isTerminal(position);
      return <tr shuku-edit-id="e-197c8c9e-bfef-4375-b3a1-f10695101c40" key={keyOf(position)} data-state={keyOf(position)} className={(selected ? 'is-state-selected' : '') + (ended ? ' is-terminal' : '')}>
        <th shuku-edit-id="e-8bed09e9-5f28-48d5-bab5-a161d1ac8fa3" scope="row"><Button className="vbrl-qtable__state-button" onClick={() => onState(position)} active={selected}
          aria-pressed={selected} aria-label={`定位状态 ${coordinates(position)}${ended ? '，终止状态' : ''}`}>
          <Typography shuku-edit-id="e-f3802521-8698-4350-9c8c-c86124283d8c" variant="bodySmall" tone={selected ? 'accent' : 'muted'} wrap="nowrap">{coordinates(position)}</Typography>
        </Button></th>
        {actionOrder.map(direction => {
          const value = qAt(position)[direction], chosen = selected && direction === action;
          return <td shuku-edit-id="e-ead75a03-fc0f-48ce-90c7-6e9fbee6c710" key={direction} data-action={direction} data-q={value}
            className={(direction === action ? 'is-action-selected' : '') + (selected && best.includes(direction) ? ' is-best' : '') + (chosen ? ' is-q-selected' : '')}
            style={valueStyle(value)}>
            <Button className="vbrl-qtable__value-button" onClick={() => onState(position, direction)} active={chosen} aria-pressed={chosen}
              aria-label={`状态 ${coordinates(position)}，${ACTIONS[direction]}，Q 值 ${value.toFixed(2)}`}>
              <Typography shuku-edit-id="e-7c220395-d09a-4f0a-9983-a2cc937cb044" variant="bodySmall" tone={ended ? 'muted' : value < 0 ? 'danger' : value > 0 ? 'success' : 'accent'} wrap="nowrap">{value.toFixed(2)}</Typography>
            </Button>
          </td>;
        })}
      </tr>;
    })}</tbody>
    {!complete && <tfoot shuku-edit-id="e-118b9a6e-03c8-4f64-97ea-eb6f8ff68bff"><tr shuku-edit-id="e-9d0eb027-6f2a-4298-8411-b11e35837fa0">{Array.from({ length: 5 }, (_, index) => <td shuku-edit-id="e-f202fed8-9dc0-4c04-91f9-34a877a5ceec" key={index}><Typography shuku-edit-id="e-c08e33d3-8512-4bb8-9fa5-3190d18d65d2" variant="bodySmall" tone="muted">…</Typography></td>)}</tr></tfoot>}
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
    footer={<div shuku-edit-id="e-faba61a3-c217-484c-a57e-3995b48d3ab3" className="vbrl-qtable__footer"><Typography shuku-edit-id="e-e24132fb-ef1a-453e-a58d-8c5cf02547ff" variant="bodySmall" tone="accent">Q 表把动作价值整理成表格，每个数对应一个状态和动作。</Typography>
      <Typography shuku-edit-id="e-eebe7fb1-4b78-43bc-b13b-31bfd33b8f33" variant="bodySmall" tone="accent">怎样更新这些评分？下一步：Bellman 目标。</Typography></div>}>
    <div shuku-edit-id="e-362a74ae-6848-44b3-8572-62ece5d26855" className={'vbrl-qtable is-' + view} data-selected-state={keyOf(state)} data-selected-action={action ?? ''} data-view={view}
      data-best-actions={best.join(',')} data-training-updates={snapshot.training.updates}>
      {view === 'all' ? <section shuku-edit-id="e-ed6bfa74-bd8b-47d1-9f95-05cf6385ea04" className="vbrl-qtable__full" aria-label="完整 Q 表">
        <TeachingHeading aside={<Button onClick={() => setView('detail')}>返回讲解</Button>}>完整 Q 表：每一行是一种状态</TeachingHeading>
        <div shuku-edit-id="e-156193f2-0e4b-4753-93e4-6cece7a5b73d" className="vbrl-qtable__tables">{sections.map((positions, section) => <QValueTable key={section} positions={positions}
          state={state} action={action} complete onState={selectState} onAction={selectAction} />)}</div>
      </section> : <>
        <TeachingPanel title="当前状态的四个动作价值" className="vbrl-qtable__warehouse">
          <div shuku-edit-id="e-904f9884-b63f-4c3a-ae8f-3a830480e9cd" className="vbrl-qtable__scene">
            <WarehouseMap className="vbrl-qtable__map" robot={state} selected={state} onSelect={selectState} coordinates
              markers={{ [keyOf(TRAP)]: '!' }} goalArt={emptyStationArt} dangerArt={pitArt}
              update={!terminal && action !== null ? { position: state, action } : undefined} />
            <div shuku-edit-id="e-53579484-6c59-4615-8f5a-fb8540725a50" className="vbrl-qtable__actions" role="group" aria-label="当前状态的四个动作价值">
              {actionOrder.map(direction => <Button key={direction} data-map-action={direction} data-q={values[direction]}
                className={'vbrl-qtable__direction' + (best.includes(direction) ? ' is-best' : '')}
                style={valueStyle(values[direction])} active={action === direction} aria-pressed={action === direction} disabled={terminal}
                onClick={() => selectAction(direction)} aria-label={`${ACTIONS[direction]}，Q 值 ${values[direction].toFixed(2)}`}>
                <DirectionArrow action={direction} /><div shuku-edit-id="e-91f224e7-c476-422d-9f35-01972e51d4db" className="vbrl-qtable__action-value" inert>
                  <div shuku-edit-id="e-0523d56a-87d4-4423-886b-be5d479fd8bc" className="vbrl-qtable__action-label"><Typography shuku-edit-id="e-e78a4379-7697-4e33-ade5-0c545e64e6f9" variant="bodySmall" tone="accent">{ACTIONS[direction]}</Typography>
                    {best.includes(direction) && <Typography shuku-edit-id="e-4b050f10-6cca-4f45-a370-5fa3f6fb9592" variant="bodySmall" tone="success">最大</Typography>}</div>
                  <Formula latex={'Q=' + values[direction].toFixed(2)} />
                </div>
              </Button>)}
            </div>
          </div>
          <div shuku-edit-id="e-e420b73e-280b-494f-820f-85bc61e08bcc" className="vbrl-qtable__state" aria-live="polite"><Typography shuku-edit-id="e-72172e07-780a-4e9e-bf4d-358a4d6eae54" variant="bodySmall" tone="accent">当前状态</Typography>
            <Formula latex={`s=(${state.row + 1},${state.col + 1})`} /><Typography shuku-edit-id="e-55c12ac1-dc8c-43af-b463-3fcf073e42b7" variant="bodySmall" tone="muted">行，列</Typography></div>
          <Typography shuku-edit-id="e-4c2fa63b-07d3-4bb3-9f11-b77da30ba815" variant="bodySmall" tone="muted" align="center">{terminal ? '终止状态的后续价值为 0。' : '同一个状态，不同动作有不同的长期评分。'}</Typography>
        </TeachingPanel>
        <section shuku-edit-id="e-ec34f399-edbe-4ea5-b321-a68c24a512f7" className="vbrl-qtable__overview" aria-label="把动作价值整理成 Q 表">
          <TeachingHeading aside={<Button onClick={() => setView('all')}>完整 Q 表</Button>}>把动作价值整理成 Q 表</TeachingHeading>
          <div shuku-edit-id="e-ad530c8b-06fd-4652-9d05-d65e0ff6caf9" className="vbrl-qtable__lesson">
            <QValueTable positions={excerpt} state={state} action={action} onState={selectState} onAction={selectAction} />
            <div shuku-edit-id="e-c95f694e-067d-4e93-9745-438b21a1619e" className="vbrl-qtable__reading" aria-label="使用 Q 表的三个步骤">
              <div shuku-edit-id="e-ed5a1d15-2055-44bf-acf9-6b2d127ba6ce"><Typography shuku-edit-id="e-772800f9-9dd5-4803-ae78-2c976811fee7" as="span" variant="bodySmall" tone="inherit" className="vbrl-qtable__step">1</Typography><Typography shuku-edit-id="e-087de189-1f18-4778-bdb7-4f27d8622ed9" variant="bodySmall" tone="accent">找到状态行</Typography></div>
              <DirectionArrow action={1} /><div shuku-edit-id="e-78baba33-7aaa-49c3-ac4b-1dc61266a74f"><Typography shuku-edit-id="e-58e38b28-76db-4409-a288-4f7cb56ccb76" as="span" variant="bodySmall" tone="inherit" className="vbrl-qtable__step">2</Typography><Typography shuku-edit-id="e-28eb4f53-f216-4441-a005-8468641a4dd0" variant="bodySmall" tone="accent">比较四个值</Typography></div>
              <DirectionArrow action={1} /><Button className="vbrl-qtable__greedy" disabled={terminal} onClick={() => selectAction(greedy)} aria-label="暂选最大值">
                <Typography shuku-edit-id="e-b96974ed-2e07-4215-ba54-1db085fad371" as="span" variant="bodySmall" tone="inherit" className="vbrl-qtable__step">3</Typography><Typography shuku-edit-id="e-c9470768-fb6d-4ccd-852f-51f2bba38fbc" variant="bodySmall" tone="accent">暂选最大值</Typography>
              </Button>
            </div>
            <div shuku-edit-id="e-f1a79b9e-887b-4549-b55f-0cf8b0927fba" className="vbrl-qtable__decision" role="status" aria-live="polite"><Formula latex={greedyLatex} />
              <Typography shuku-edit-id="e-2d259d87-1633-4eda-8b16-ee8b3c7d7cdf" variant="bodySmall" tone="muted">{decisionNote}</Typography></div>
            <div shuku-edit-id="e-6fd9503a-e539-4bd7-96e7-69cafa17c7d2" className="vbrl-qtable__initial"><Typography shuku-edit-id="e-b4b86a1a-5fa5-4f28-9a21-77e606c456b8" as="span" variant="bodySmall" tone="warning" className="vbrl-qtable__initial-mark">!</Typography>
              <Typography shuku-edit-id="e-a09602cd-b795-422c-880e-20e84ca66e9e" variant="bodySmall" tone="warning">未更新的初值 0，不代表四个动作真的一样好。</Typography></div>
          </div>
        </section>
      </>}
    </div>
  </LessonPage>;
}
