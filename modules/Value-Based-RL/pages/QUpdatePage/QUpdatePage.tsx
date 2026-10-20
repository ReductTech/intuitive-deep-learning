import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { WarehouseMap } from '../../components/WarehouseMap';
import robotArt from '../../assets/cover-v2/robot.png';
import emptyStationArt from '../../assets/cover-v2/receiving-station-empty.png';
import loadedStationArt from '../../assets/cover-v2/receiving-station-loaded.png';
import pitArt from '../../assets/cover-v2/maintenance-pit.png';
import { ACTIONS, START, keyOf, type Position } from '../../model';
import {
  ALPHA, GAMMA, TRAP, INITIAL_ACTION, INITIAL_POSITION,
  createQUpdateLab, isTerminal, observeStep, type SingleQUpdate,
} from './qUpdateSimulation';
import './QUpdatePage.css';

type Phase = 'ready' | 'moving' | 'experience' | 'to-target' | 'target' | 'to-table' | 'done';
type Flight = { id: number; kind: 'experience' | 'target'; style: CSSProperties };
const number = (value: number) => Math.abs(value) < .00001 ? '0.00' : value.toFixed(2);
const signed = (value: number) => (value > 0 ? '+' : '') + number(value);
const coordinate = (position: Position) => '(' + (position.row + 1) + ', ' + (position.col + 1) + ')';
const busyPhases: Phase[] = ['moving', 'to-target', 'to-table'];

function StageHeading({ step, children, active }: {
  step: number; children: string; active: boolean;
}) {
  return <div className={'vbrl-single__heading' + (active ? ' is-active' : '')}>
    <Typography variant="bodySmall" tone="accent">{step}</Typography>
    <Typography variant="h3" tone={active ? 'accent' : 'muted'}>{children}</Typography>
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
    footer={<div className="vbrl-single__footer">
      <Formula latex={targetVisible && record
        ? 'Q_{\\mathrm{new}}=' + number(record.before[record.action]) + '+' + ALPHA.toFixed(2) + '\\times[' + number(record.target) + '-(' + number(record.before[record.action]) + ')]=' + (done ? number(record.after[record.action]) : '?')
        : 'Q(s,a)\\leftarrow Q(s,a)+\\alpha\\,[y-Q(s,a)]'} />
    </div>}>
    <div className={'vbrl-single' + (busy ? ' is-busy' : '')} ref={rootRef}
      data-phase={phase} data-from={keyOf(from)} data-robot={keyOf(robot)} data-action={action}
      data-updates={lab.updates} data-automatic={automatic} data-replaying={replaying}
      data-target={record?.target} data-before={record?.before[record.action]} data-after={record?.after[record.action]}>
      <div className="vbrl-single__toolbar">
        <div className="vbrl-single__playback vbrl-controls">
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
        <Typography variant="bodySmall" tone={done ? 'success' : 'muted'} role="status" aria-live="polite">{feedback}</Typography>
      </div>
      <div className="vbrl-single__scene">
        <section className="vbrl-single__region vbrl-single__map-region" aria-label="地图中的一次真实经历">
          <div className="vbrl-single__map-heading">
            <StageHeading step={1} active={['ready', 'moving', 'experience'].includes(phase)}>经历一步</StageHeading>
            <div className="vbrl-single__directions" role="group" aria-label="选择机器人本次动作">
              {ACTIONS.map((label, direction) => <Button key={label} active={direction === action} aria-pressed={direction === action}
                aria-label={label} title={label} disabled={busy || phase !== 'ready'} onClick={() => { setAction(direction); setNotice(''); }}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V4M5 11L12 4L19 11" transform={'rotate(' + direction * 90 + ' 12 12)'} /></svg>
              </Button>)}
            </div>
          </div>
          <div className="vbrl-single__warehouse">
            <WarehouseMap className="vbrl-single__map" coordinates robot={robot} selected={from}
              onSelect={position => prepare(position)} markers={{ [keyOf(TRAP)]: '!' }}
              goalArt={delivered ? loadedStationArt : emptyStationArt} dangerArt={pitArt}
              update={{ position: from, action: record?.action ?? action }}
              overlay={<div className="vbrl-single__map-overlay">
                {record && keyOf(record.next) !== keyOf(record.from) && <div className={'vbrl-single__arrival' + (record.trapped ? ' is-trapped' : '')} style={{ gridRow: record.next.row + 1, gridColumn: record.next.col + 1 }} />}
                <div className={'vbrl-single__robot' + (phase === 'ready' ? ' is-ready' : '') + (isTerminal(robot) ? ' is-terminal' : '') + (phase === 'moving' && record?.hit ? ' is-collision' : '')}
                  style={{ '--single-robot-row': robot.row, '--single-robot-col': robot.col } as CSSProperties}>
                  <img src={robotArt} alt="执行本次动作的机器人" />
                </div>
              </div>} />
            <div ref={experienceRef} className={'vbrl-single__experience' + (phase === 'to-target' ? ' is-travelling' : '')}>
              <Typography variant="bodySmall" tone="accent">{record ? coordinate(record.from) + ' → ' + coordinate(record.next) : '出发格 ' + coordinate(lab.position)}</Typography>
              <Typography variant="bodySmall" tone={record?.trapped ? 'danger' : record?.done ? 'success' : 'muted'}>
                {record ? (record.trapped ? '陷阱 ' : record.done ? '送达 ' : record.hit ? '碰撞 ' : '奖励 ') + signed(record.reward) : ACTIONS[action]}
              </Typography>
            </div>
          </div>
        </section>
        <div className="vbrl-single__learning">
          <section className="vbrl-single__region vbrl-single__target-region" aria-label="由本次经历计算更新目标">
            <StageHeading step={2} active={['to-target', 'target'].includes(phase)}>形成目标值</StageHeading>
            <div className="vbrl-single__target">
              <div className="vbrl-single__term">
                <Typography variant="bodySmall" tone="muted">即时奖励</Typography>
                <Formula latex={record && phase !== 'moving' && phase !== 'ready' ? number(record.reward) : 'r'} />
              </div>
              <div className="vbrl-single__operator"><Formula latex="+" /></div>
              <div className="vbrl-single__term">
                <Typography variant="bodySmall" tone="muted">{record?.done && targetVisible ? '终止后的价值' : '折扣后的未来'}</Typography>
                <Formula latex={targetVisible && record ? record.done ? '0' : GAMMA.toFixed(2) + '\\times ' + number(record.nextMax) : "\\gamma\\max_{a'}Q(s',a')"} />
              </div>
              <div className="vbrl-single__operator"><Formula latex="=" /></div>
              <div ref={targetRef} className={'vbrl-single__target-anchor' + (targetVisible ? ' is-revealed' : '')}>
                <Typography variant="bodySmall" tone={targetVisible ? 'warning' : 'muted'}>更新目标</Typography>
                <Formula latex={targetVisible && record ? 'y=' + number(record.target) : 'y=?'} />
              </div>
            </div>
            <Typography variant="bodySmall" tone="muted" className="vbrl-single__target-note">{targetVisible && record
              ? record.done ? '回合结束，目标只包含这一步的奖励。'
                : record.hit ? '位置未变：从原格更新前的 Q 值中取最大值。'
                  : '从下一格 ' + coordinate(record.next) + ' 的四个 Q 值中取最大值。'
              : '一步经历给出奖励与下一状态，未来价值来自下一格的 Q 表。'}</Typography>
          </section>
          <section className="vbrl-single__region vbrl-single__table-region" aria-label="本次改动的唯一 Q 表项">
            <div className="vbrl-single__table-heading">
              <StageHeading step={3} active={['to-table', 'done'].includes(phase)}>改写一个 Q 值</StageHeading>
              <Typography variant="bodySmall" tone="muted">行 · 状态　列 · 动作</Typography>
            </div>
            <div className="vbrl-single__q-area">
              <table className="vbrl-single__table" aria-label="出发状态与下一状态的 Q 表局部">
                <thead><tr><th scope="col"><Typography variant="bodySmall" tone="muted">格</Typography></th>{ACTIONS.map(label => <th key={label} scope="col"><Typography variant="bodySmall" tone="muted">{label}</Typography></th>)}</tr></thead>
                <tbody>{rowPositions.map((position, rowIndex) => <tr key={keyOf(position)} data-state={keyOf(position)}>
                  <th scope="row"><Typography variant="bodySmall" tone="accent">{rowIndex === 0 ? '出发格 ' : '下一格 '}{coordinate(position)}</Typography></th>
                  {displayQ[keyOf(position)].map((value, direction) => {
                    const selected = rowIndex === 0 && direction === (record?.action ?? action);
                    return <td key={direction} ref={selected ? destinationRef : undefined} data-q={value} data-action={direction}
                      style={selected ? { '--single-q-color': value < 0 ? 'var(--ui-danger)' : 'var(--ui-success)' } as CSSProperties : undefined}
                      className={selected ? 'is-destination' + (done ? ' is-updated' : '') : undefined}>
                      {selected && done && record ? <div className="vbrl-single__cell-change">
                        <Typography variant="bodySmall" tone="muted">{number(record.before[direction])}</Typography>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12H21M15 6L21 12L15 18" /></svg>
                        <Typography variant="body" tone={value < 0 ? 'danger' : 'success'}>{number(value)}</Typography>
                      </div> : <Typography variant="body" tone={selected ? 'warning' : 'muted'}>{number(value)}</Typography>}
                    </td>;
                  })}
                </tr>)}
                  {rowPositions.length === 1 && <tr className="vbrl-single__pending-row">
                    <th scope="row"><Typography variant="bodySmall" tone="muted">下一格</Typography></th>
                    {!record ? ACTIONS.map(label => <td key={label}><Typography variant="body" tone="light">—</Typography></td>)
                      : <td colSpan={4}><Typography variant="bodySmall" tone="muted">位置未变，复用出发格这一行</Typography></td>}
                  </tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
      {flight && record && <div key={flight.id} className="vbrl-single__flight" style={flight.style} aria-hidden="true">
        <Typography variant="bodySmall" tone="warning">{flight.kind === 'experience' ? '本次经历' : '更新目标'}</Typography>
        <Typography variant="bodySmall" tone="accent">{flight.kind === 'experience' ? ACTIONS[record.action] + ' · 奖励 ' + signed(record.reward) : number(record.target)}</Typography>
      </div>}
    </div>
  </LessonPage>;
}
