import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { WarehouseMap } from '../../components/WarehouseMap';
import { ACTIONS, START, keyOf, type Position } from '../../model';
import {
  ALPHA, GAMMA, TRAP, INITIAL_ACTION, INITIAL_POSITION,
  createQUpdateLab, isTerminal, observeStep, type SingleQUpdate,
} from './qUpdateSimulation';
import './QUpdatePage.css';

const robotArt = valueBasedRlAssetUrl('cover-v2/robot.png');
const emptyStationArt = valueBasedRlAssetUrl('cover-v2/receiving-station-empty.png');
const loadedStationArt = valueBasedRlAssetUrl('cover-v2/receiving-station-loaded.png');
const pitArt = valueBasedRlAssetUrl('cover-v2/maintenance-pit.png');

type Phase = 'ready' | 'moving' | 'experience' | 'to-target' | 'target' | 'to-table' | 'done';
type Flight = { id: number; kind: 'experience' | 'target'; style: CSSProperties };
const number = (value: number) => Math.abs(value) < .00001 ? '0.00' : value.toFixed(2);
const signed = (value: number) => (value > 0 ? '+' : '') + number(value);
const coordinate = (position: Position) => '(' + (position.row + 1) + ', ' + (position.col + 1) + ')';
const busyPhases: Phase[] = ['moving', 'to-target', 'to-table'];

function StageHeading({ step, children, active }: {
  step: number; children: string; active: boolean;
}) {
  return <div shuku-edit-id="e-c50e6ed1-1bf9-4984-9f6c-1c6ccb8429e5" className={'vbrl-single__heading' + (active ? ' is-active' : '')}>
    <Typography shuku-edit-id="e-acf5592d-7fd8-4c83-89fd-fd884ea5faca" variant="bodySmall" tone="accent">{step}</Typography>
    <Typography shuku-edit-id="e-4b72de06-a2f8-460a-89da-ec895b09dc99" variant="h3" tone={active ? 'accent' : 'muted'}>{children}</Typography>
  </div>;
}

export function QUpdatePage() {
  const [lab, setLab] = useState(createQUpdateLab);
  const [action, setAction] = useState(INITIAL_ACTION);
  const [robot, setRobot] = useState<Position>(INITIAL_POSITION);
  const [record, setRecord] = useState<SingleQUpdate | null>(null);
  const [phase, setPhase] = useState<Phase>('ready');
  const [automatic, setAutomatic] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [notice, setNotice] = useState('');
  const [flight, setFlight] = useState<Flight | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLTableCellElement>(null);
  const timers = useRef(new Set<number>());
  const sequence = useRef(0);
  const labRef = useRef(lab);
  labRef.current = lab;
  const busy = busyPhases.includes(phase) || automatic;
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const from = record?.from ?? lab.position;
  const destination = record?.next ?? lab.position;
  const targetVisible = ['target', 'to-table', 'done'].includes(phase);
  const done = phase === 'done';
  const delivered = !!record?.done && !record.trapped && !['ready', 'moving'].includes(phase);
  const displayQ = record ? done ? record.tableAfter : record.tableBefore : lab.q;
  const rowPositions = keyOf(from) === keyOf(destination) || !record ? [from] : [from, destination];

  function schedule(callback: () => void, delay: number) {
    const currentSequence = sequence.current;
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      if (sequence.current === currentSequence) callback();
    }, delay);
    timers.current.add(timer);
  }
  function cancelSequence() {
    sequence.current++;
    for (const timer of timers.current) window.clearTimeout(timer);
    timers.current.clear();
    setFlight(null); setAutomatic(false); setReplaying(false);
  }
  function moveParcel(kind: Flight['kind'], source: HTMLElement | null, destinationElement: HTMLElement | null, finished: () => void) {
    const root = rootRef.current;
    if (!root || !source || !destinationElement) { finished(); return; }
    const bounds = root.getBoundingClientRect();
    const sourceBox = source.getBoundingClientRect();
    const destinationBox = destinationElement.getBoundingClientRect();
    const scale = bounds.width / root.offsetWidth;
    const width = 210;
    const clampX = (value: number) => Math.max(0, Math.min(root.offsetWidth - width, value));
    const clampY = (value: number) => Math.max(0, Math.min(root.offsetHeight - 70, value));
    const startX = clampX((sourceBox.left + sourceBox.width / 2 - bounds.left) / scale - width / 2);
    const startY = clampY((sourceBox.top + sourceBox.height / 2 - bounds.top) / scale - 35);
    const endX = clampX((destinationBox.left + destinationBox.width / 2 - bounds.left) / scale - width / 2);
    const endY = clampY((destinationBox.top + destinationBox.height / 2 - bounds.top) / scale - 35);
    setFlight({
      id: Date.now(), kind, style: {
        left: startX, top: startY, width,
        '--single-travel-x': (endX - startX) + 'px', '--single-travel-y': (endY - startY) + 'px',
        '--single-arrival-scale': kind === 'target' ? Math.min(1, destinationBox.width / scale / width) : 1,
      } as CSSProperties,
    });
    schedule(() => { setFlight(null); finished(); }, 700);
  }
  function transferToTable(update: SingleQUpdate, replay = false) {
    setPhase('to-table');
    moveParcel('target', targetRef.current, destinationRef.current, () => {
      if (!replay) setLab(previous => ({ q: update.tableAfter, position: update.next, updates: previous.updates + 1 }));
      setPhase('done'); setAutomatic(false); setReplaying(false);
    });
  }
  function transferToTarget(update: SingleQUpdate, auto = false, replay = false) {
    setPhase('to-target');
    moveParcel('experience', experienceRef.current, targetRef.current, () => {
      setPhase('target');
      if (auto) schedule(() => transferToTable(update, replay), 1300);
    });
  }
  function startMotion(update: SingleQUpdate, auto = false, replay = false) {
    setRecord(update); setPhase('moving'); setRobot(update.next);
    schedule(() => {
      setPhase('experience');
      if (auto) schedule(() => transferToTarget(update, true, replay), 900);
    }, 620);
  }
  function begin(auto = false) {
    if (busy) return;
    setNotice(''); setAutomatic(auto); setReplaying(false);
    startMotion(observeStep(lab.q, lab.position, action), auto);
  }
  function prepare(position: Position, selectedAction = action) {
    if (busy) return;
    if (isTerminal(position)) { setNotice('终点和陷阱没有后续动作，请从其他格出发。'); return; }
    cancelSequence();
    setLab(previous => ({ ...previous, position }));
    setRobot(position); setRecord(null); setPhase('ready'); setAction(selectedAction); setNotice('');
  }
  function replay() {
    if (!record || busy) return;
    cancelSequence(); setAutomatic(true); setReplaying(true); setRobot(record.from); setPhase('ready');
    // Let the robot return to the departure cell before replaying its movement.
    schedule(() => startMotion(record, true, true), 650);
  }
  function reset() {
    cancelSequence();
    const initial = createQUpdateLab();
    setLab(initial); setRobot(initial.position); setAction(INITIAL_ACTION);
    setRecord(null); setPhase('ready'); setNotice('');
  }

  useEffect(() => {
    const stop = () => {
      if (!busyRef.current) return;
      sequence.current++;
      for (const timer of timers.current) window.clearTimeout(timer);
      timers.current.clear();
      setFlight(null); setAutomatic(false); setReplaying(false);
      setRobot(labRef.current.position); setRecord(null); setPhase('ready');
    };
    const onVisibility = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', onVisibility);
    const observer = new IntersectionObserver(entries => { if (!entries[0].isIntersecting) stop(); });
    if (rootRef.current) observer.observe(rootRef.current);
    return () => {
      sequence.current++;
      for (const timer of timers.current) window.clearTimeout(timer);
      timers.current.clear();
      observer.disconnect(); document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const primaryLabel = phase === 'ready' ? '走一步' : phase === 'experience' ? '计算目标值'
    : phase === 'target' ? '更新这个表项' : phase === 'done' ? record?.done ? '开始新回合' : '准备下一步'
      : phase === 'moving' ? '机器人移动中' : phase === 'to-target' ? '经历传向目标' : '目标传向表项';
  const feedback = notice || (replaying ? '重放同一次经历，观察它怎样改变出发格的一个动作价值。'
    : phase === 'ready' ? '点地图选出发格，再选方向；橙框定位一个 Q 表项。'
      : phase === 'moving' ? '先与环境交互：机器人执行所选动作。'
        : phase === 'experience' || phase === 'to-target' ? '这次经历带回即时奖励和下一状态，用它们形成更新目标。'
          : phase === 'target' || phase === 'to-table' ? '将旧 Q 值向目标靠近一部分，再写回出发格的本次动作。'
            : '只改写出发格 × 本次动作；下一格的 Q 值用于计算目标。');

  return <LessonPage className="vbrl-single-page" title="一次经历，怎样改写一个 Q 值？"
    subtitle="一次经历提供奖励和下一状态，用来修正出发状态与所选动作对应的 Q 值。"
    footer={<div shuku-edit-id="e-822e0f6b-1f5b-4eac-959f-eb3f7448e8c2" className="vbrl-single__footer">
      <Formula latex={targetVisible && record
        ? 'Q_{\\mathrm{new}}=' + number(record.before[record.action]) + '+' + ALPHA.toFixed(2) + '\\times[' + number(record.target) + '-(' + number(record.before[record.action]) + ')]=' + (done ? number(record.after[record.action]) : '?')
        : 'Q(s,a)\\leftarrow Q(s,a)+\\alpha\\,[y-Q(s,a)]'} />
    </div>}>
    <div shuku-edit-id="e-89effe1d-c70a-487e-ba12-8b72229f40ac" className={'vbrl-single' + (busy ? ' is-busy' : '')} ref={rootRef}
      data-phase={phase} data-from={keyOf(from)} data-robot={keyOf(robot)} data-action={action}
      data-updates={lab.updates} data-automatic={automatic} data-replaying={replaying}
      data-target={record?.target} data-before={record?.before[record.action]} data-after={record?.after[record.action]}>
      <div shuku-edit-id="e-1f6585c3-1a43-4585-bac1-1b4be9de4c21" className="vbrl-single__toolbar">
        <div shuku-edit-id="e-11eaa2d7-5bef-4b4c-97fa-040a76dc08dd" className="vbrl-single__playback vbrl-controls">
          <Button variant="primary" disabled={busy} onClick={() => {
            if (phase === 'ready') begin();
            else if (phase === 'experience' && record) transferToTarget(record);
            else if (phase === 'target' && record) transferToTable(record);
            else if (phase === 'done' && record) prepare(record.done ? START : record.next);
          }}>{primaryLabel}</Button>
          <Button disabled={busy || phase !== 'ready'} onClick={() => begin(true)}>连贯演示</Button>
          <Button disabled={busy || !done} onClick={replay}>重放本次</Button>
          <Button onClick={reset}>重置</Button>
        </div>
        <Typography shuku-edit-id="e-cfcfd814-5f77-44db-84e9-5396f429d277" variant="bodySmall" tone={done ? 'success' : 'muted'} role="status" aria-live="polite">{feedback}</Typography>
      </div>
      <div shuku-edit-id="e-9ca2de75-4243-437b-b412-cbde8a586a49" className="vbrl-single__scene">
        <section shuku-edit-id="e-9315d665-b269-484e-9b76-8b0bee3602e5" className="vbrl-single__region vbrl-single__map-region" aria-label="地图中的一次真实经历">
          <div shuku-edit-id="e-4cc144ac-a68a-4f42-9ac8-387663be0474" className="vbrl-single__map-heading">
            <StageHeading step={1} active={['ready', 'moving', 'experience'].includes(phase)}>经历一步</StageHeading>
            <div shuku-edit-id="e-bed43f47-9098-46e0-a732-2a1e10359ba5" className="vbrl-single__directions" role="group" aria-label="选择机器人本次动作">
              {ACTIONS.map((label, direction) => <Button key={label} active={direction === action} aria-pressed={direction === action}
                aria-label={label} title={label} disabled={busy || phase !== 'ready'} onClick={() => { setAction(direction); setNotice(''); }}>
                <svg shuku-edit-id="e-b6bbf124-4faf-4f3c-852a-2c9b84095952" viewBox="0 0 24 24" aria-hidden="true"><path shuku-edit-id="e-dbc304b7-62e1-4deb-8236-b735dcdaafcc" d="M12 20V4M5 11L12 4L19 11" transform={'rotate(' + direction * 90 + ' 12 12)'} /></svg>
              </Button>)}
            </div>
          </div>
          <div shuku-edit-id="e-875bd1d6-55e0-4eb9-88f5-ccc2e18e61ce" className="vbrl-single__warehouse">
            <WarehouseMap className="vbrl-single__map" coordinates robot={robot} selected={from}
              onSelect={position => prepare(position)} markers={{ [keyOf(TRAP)]: '!' }}
              goalArt={delivered ? loadedStationArt : emptyStationArt} dangerArt={pitArt}
              update={{ position: from, action: record?.action ?? action }}
              overlay={<div shuku-edit-id="e-447f380f-cf90-46f7-a246-cde4c33494cf" className="vbrl-single__map-overlay">
                {record && keyOf(record.next) !== keyOf(record.from) && <div shuku-edit-id="e-4ac347d4-c2cc-4351-b95d-1aeeae9e7712" className={'vbrl-single__arrival' + (record.trapped ? ' is-trapped' : '')} style={{ gridRow: record.next.row + 1, gridColumn: record.next.col + 1 }} />}
                <div shuku-edit-id="e-b910f27b-c89f-4ed7-a10f-36a33bc36d38" className={'vbrl-single__robot' + (phase === 'ready' ? ' is-ready' : '') + (isTerminal(robot) ? ' is-terminal' : '') + (phase === 'moving' && record?.hit ? ' is-collision' : '')}
                  style={{ '--single-robot-row': robot.row, '--single-robot-col': robot.col } as CSSProperties}>
                  <img shuku-edit-id="e-34d3818b-c610-412b-b6a3-84a21e7fbf7f" src={robotArt} alt="执行本次动作的机器人" />
                </div>
              </div>} />
            <div shuku-edit-id="e-f14da33d-85ce-425d-b0c8-e5affbb94d82" ref={experienceRef} className={'vbrl-single__experience' + (phase === 'to-target' ? ' is-travelling' : '')}>
              <Typography shuku-edit-id="e-fee33cf1-48c3-42a4-a4a3-41f07c722c23" variant="bodySmall" tone="accent">{record ? coordinate(record.from) + ' → ' + coordinate(record.next) : '出发格 ' + coordinate(lab.position)}</Typography>
              <Typography shuku-edit-id="e-eb230bd4-a560-4c1a-8895-0af5b17c2aec" variant="bodySmall" tone={record?.trapped ? 'danger' : record?.done ? 'success' : 'muted'}>
                {record ? (record.trapped ? '陷阱 ' : record.done ? '送达 ' : record.hit ? '碰撞 ' : '奖励 ') + signed(record.reward) : ACTIONS[action]}
              </Typography>
            </div>
          </div>
        </section>
        <div shuku-edit-id="e-8a8ef6c9-b0f4-4eaa-85a4-2f3961c90a6f" className="vbrl-single__learning">
          <section shuku-edit-id="e-daafaab3-63c0-44f0-a7dd-e4154bb5bfba" className="vbrl-single__region vbrl-single__target-region" aria-label="由本次经历计算更新目标">
            <StageHeading step={2} active={['to-target', 'target'].includes(phase)}>形成目标值</StageHeading>
            <div shuku-edit-id="e-977e64ed-5bb2-4708-9098-67614dfa0847" className="vbrl-single__target">
              <div shuku-edit-id="e-6ac522c2-10df-43d2-80ad-93fd2f4cfd4e" className="vbrl-single__term">
                <Typography shuku-edit-id="e-4e1b74b5-ae19-45c4-968d-e298023c81ec" variant="bodySmall" tone="muted">即时奖励</Typography>
                <Formula latex={record && phase !== 'moving' && phase !== 'ready' ? number(record.reward) : 'r'} />
              </div>
              <div shuku-edit-id="e-fd37e9ef-1b4e-4f9c-9a2d-cd12f408a3ef" className="vbrl-single__operator"><Formula latex="+" /></div>
              <div shuku-edit-id="e-b3863699-6576-4f75-a5a0-7792f9c8599e" className="vbrl-single__term">
                <Typography shuku-edit-id="e-bf9a78d1-9e3e-4e1a-8a08-23a55db506bf" variant="bodySmall" tone="muted">{record?.done && targetVisible ? '终止后的价值' : '折扣后的未来'}</Typography>
                <Formula latex={targetVisible && record ? record.done ? '0' : GAMMA.toFixed(2) + '\\times ' + number(record.nextMax) : "\\gamma\\max_{a'}Q(s',a')"} />
              </div>
              <div shuku-edit-id="e-34c69ecb-3a4e-4766-bb70-5d78d15c653f" className="vbrl-single__operator"><Formula latex="=" /></div>
              <div shuku-edit-id="e-3d4d1c30-8486-4f3d-84a0-9dbe798ffda6" ref={targetRef} className={'vbrl-single__target-anchor' + (targetVisible ? ' is-revealed' : '')}>
                <Typography shuku-edit-id="e-645e78a4-8b10-42c2-aa54-8d549934eccf" variant="bodySmall" tone={targetVisible ? 'warning' : 'muted'}>更新目标</Typography>
                <Formula latex={targetVisible && record ? 'y=' + number(record.target) : 'y=?'} />
              </div>
            </div>
            <Typography shuku-edit-id="e-272228ae-ce10-41ec-9cbe-63668b775fdf" variant="bodySmall" tone="muted" className="vbrl-single__target-note">{targetVisible && record
              ? record.done ? '回合结束，目标只包含这一步的奖励。'
                : record.hit ? '位置未变：从原格更新前的 Q 值中取最大值。'
                  : '从下一格 ' + coordinate(record.next) + ' 的四个 Q 值中取最大值。'
              : '一步经历给出奖励与下一状态，未来价值来自下一格的 Q 表。'}</Typography>
          </section>
          <section shuku-edit-id="e-b29059c0-9719-439f-a987-fb5e7f57e438" className="vbrl-single__region vbrl-single__table-region" aria-label="本次改动的唯一 Q 表项">
            <div shuku-edit-id="e-878dc5f1-10cb-43f0-9ea1-27f4febe0487" className="vbrl-single__table-heading">
              <StageHeading step={3} active={['to-table', 'done'].includes(phase)}>改写一个 Q 值</StageHeading>
              <Typography shuku-edit-id="e-7bfd9935-3093-4ca8-892a-a5e65a5a214b" variant="bodySmall" tone="muted">行 · 状态　列 · 动作</Typography>
            </div>
            <div shuku-edit-id="e-428278f6-40e9-4933-a886-b7cb5629308b" className="vbrl-single__q-area">
              <table shuku-edit-id="e-dd2bdaab-4f70-46a4-845d-e38fb3f984e1" className="vbrl-single__table" aria-label="出发状态与下一状态的 Q 表局部">
                <thead shuku-edit-id="e-be0b7a84-fa66-4a58-b73f-a27ce9d070a0"><tr shuku-edit-id="e-25d284ed-6343-4607-9552-362dfafae8e7"><th shuku-edit-id="e-33c9dbb6-0e82-44e0-a59f-e823bbb07885" scope="col"><Typography shuku-edit-id="e-de59bc09-bdf3-4b16-a335-1c00e3eca80a" variant="bodySmall" tone="muted">格</Typography></th>{ACTIONS.map(label => <th shuku-edit-id="e-ae0d1d59-d2d8-41bc-9f1a-1ee38e7cff29" key={label} scope="col"><Typography shuku-edit-id="e-959b8558-bc56-47d0-a40f-814dfa3b5487" variant="bodySmall" tone="muted">{label}</Typography></th>)}</tr></thead>
                <tbody shuku-edit-id="e-710f6d0b-b332-42cb-a48b-4028a9327045">{rowPositions.map((position, rowIndex) => <tr shuku-edit-id="e-1afb46dd-5a12-4c2d-9de8-955f8bc7ffd7" key={keyOf(position)} data-state={keyOf(position)}>
                  <th shuku-edit-id="e-805fe0d2-a1db-4fdb-9ef0-d47d67ce7b83" scope="row"><Typography shuku-edit-id="e-63b27714-6f8d-4cf8-aab4-6df8a0f7e0b0" variant="bodySmall" tone="accent">{rowIndex === 0 ? '出发格 ' : '下一格 '}{coordinate(position)}</Typography></th>
                  {displayQ[keyOf(position)].map((value, direction) => {
                    const selected = rowIndex === 0 && direction === (record?.action ?? action);
                    return <td shuku-edit-id="e-f6485bf4-51a4-40dd-bab7-7f38449a0a22" key={direction} ref={selected ? destinationRef : undefined} data-q={value} data-action={direction}
                      style={selected ? { '--single-q-color': value < 0 ? 'var(--ui-danger)' : 'var(--ui-success)' } as CSSProperties : undefined}
                      className={selected ? 'is-destination' + (done ? ' is-updated' : '') : undefined}>
                      {selected && done && record ? <div shuku-edit-id="e-120a4f3b-8280-45eb-a85c-a16787fc9fb7" className="vbrl-single__cell-change">
                        <Typography shuku-edit-id="e-aa55bce2-cd65-4151-a3ae-71a9fe938e5e" variant="bodySmall" tone="muted">{number(record.before[direction])}</Typography>
                        <svg shuku-edit-id="e-1edef89c-3599-4c90-bb63-920e2803fc4b" viewBox="0 0 24 24" aria-hidden="true"><path shuku-edit-id="e-3097c98b-f369-475e-bb0b-cc233067092b" d="M3 12H21M15 6L21 12L15 18" /></svg>
                        <Typography shuku-edit-id="e-0e060299-a436-48f5-a2d5-624fcb5cd281" variant="body" tone={value < 0 ? 'danger' : 'success'}>{number(value)}</Typography>
                      </div> : <Typography shuku-edit-id="e-46e5d12a-3af4-4b9e-ad02-c686160c3d6d" variant="body" tone={selected ? 'warning' : 'muted'}>{number(value)}</Typography>}
                    </td>;
                  })}
                </tr>)}
                  {rowPositions.length === 1 && <tr shuku-edit-id="e-ad911e23-b1e5-480d-8ae1-b87d7380f201" className="vbrl-single__pending-row">
                    <th shuku-edit-id="e-dac9a36c-9f5a-4a93-b99c-846379807da2" scope="row"><Typography shuku-edit-id="e-6c344655-e2cb-43aa-b57a-42624bef4fb8" variant="bodySmall" tone="muted">下一格</Typography></th>
                    {!record ? ACTIONS.map(label => <td shuku-edit-id="e-e2842f02-aff7-4833-be4c-216b8dbbf790" key={label}><Typography shuku-edit-id="e-2b3a831c-ec95-44df-a856-8ba38a03b1d1" variant="body" tone="light">—</Typography></td>)
                      : <td shuku-edit-id="e-3c9791d8-9627-4967-946f-89a64c05a1e2" colSpan={4}><Typography shuku-edit-id="e-9a3a59dd-f77b-40e4-bc44-1abe946dd051" variant="bodySmall" tone="muted">位置未变，复用出发格这一行</Typography></td>}
                  </tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
      {flight && record && <div shuku-edit-id="e-09da32f0-6e62-4fe7-a725-5ca9ff84001e" key={flight.id} className="vbrl-single__flight" style={flight.style} aria-hidden="true">
        <Typography shuku-edit-id="e-e7b8a8b1-3b02-4ded-826e-c057509c42ca" variant="bodySmall" tone="warning">{flight.kind === 'experience' ? '本次经历' : '更新目标'}</Typography>
        <Typography shuku-edit-id="e-cc90cadc-47e9-41af-a10f-06c225d80d08" variant="bodySmall" tone="accent">{flight.kind === 'experience' ? ACTIONS[record.action] + ' · 奖励 ' + signed(record.reward) : number(record.target)}</Typography>
      </div>}
    </div>
  </LessonPage>;
}
