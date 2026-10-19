import { useEffect, useRef, useState } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import { ACTIONS, keyOf } from '../../model';
import { ReplayExperienceMap } from './ReplayExperienceMap';
import { BUFFER_CAPACITY, BATCH_SIZE, bufferEntries, collectReplayExperience, createReplaySimulation,
  experienceKey, sampleReplayBatch, type ReplayExperience } from './replaySimulation';
import { createReplayExample } from './replayLesson';
import './ReplayBufferPage.css';

const coordinate = (p: { row: number; col: number }) => `(${p.row + 1},${p.col + 1})`;
const arrows = ['↑', '→', '↓', '←'];
const reward = (value: number) => (value > 0 ? '+' : '−') + Math.abs(value);
type ReplayView = { entry: ReplayExperience; end: boolean; nonce: number };

function ActionArrow({ action }: { action: number }) {
  return <svg className="vbrl-replay__direction-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 21V10H3L12 1L21 10H15V21Z" transform={`rotate(${action * 90} 12 12)`} />
  </svg>;
}

export function ReplayBufferPage() {
  const [state, setState] = useState(() => sampleReplayBatch(createReplayExample()));
  const [replay, setReplay] = useState<ReplayView | null>(() => ({ entry: state.batch[0], end: false, nonce: 0 }));
  const nonce = useRef(0), current = replay?.entry ?? state.latest, occupied = bufferEntries(state);
  const priority = [occupied.find(entry => entry.id === current?.id), occupied.find(entry => entry.done && !entry.trapped), occupied.find(entry => entry.trapped), ...[...occupied].reverse()];
  const cards = priority.filter((entry, index): entry is ReplayExperience => !!entry && priority.findIndex(other => other?.id === entry.id) === index).slice(0, 3);
  function view(entry: ReplayExperience) { setReplay({ entry, end: false, nonce: ++nonce.current }); }
  function collect(action: number) { if (!replay) setState(previous => collectReplayExperience(previous, action)); }
  function demonstration() {
    const next = createReplayExample(); setState(next);
    view(bufferEntries(next).find(entry => entry.id === 8)!);
  }
  function draw() {
    const next = sampleReplayBatch(state); setState(next);
    if (next.batch[0]) view(next.batch[0]);
  }
  useEffect(() => {
    if (!replay || replay.end) return;
    const token = replay.nonce, timer = window.setTimeout(() => setReplay(previous => previous?.nonce === token ? { ...previous, end: true } : previous), 450);
    return () => window.clearTimeout(timer);
  }, [replay?.nonce, replay?.end]);

  return <LessonPage className="vbrl-foundation-page vbrl-replay-page" title="经验回放：保存经历，随机抽样再学习"
    subtitle="经验回放保存完整交互记录，再随机抽样，以减少时间相关性并重复利用已有数据。"
    footer={null}>
    <div className="vbrl-replay" data-collected={state.collected} data-draw={state.drawCount}
      data-batch-ids={state.batch.map(entry => entry.id).join(',')} data-buffer-ids={state.slots.map(entry => entry?.id ?? '').join(',')}
      data-selected={current?.id} data-mode={replay ? 'replay' : 'collect'} data-phase={replay ? replay.end ? 'end' : 'start' : 'live'}
      data-live-position={keyOf(state.position)} data-next-slot={state.nextSlot} data-evicted={state.evicted}
      onKeyDown={event => { if (event.key === ' ' && event.target instanceof HTMLElement && event.target.closest('button')) event.stopPropagation(); }}>
      <TeachingPanel title="① 交互生成一条经历" className="vbrl-replay__interaction">
        <ReplayExperienceMap position={state.position} experience={current} atEnd={replay ? replay.end : true}
          robotKey={replay ? 'replay-' + replay.nonce : 'live-' + state.episode} />
        <div className="vbrl-replay__directions" aria-label="实际走一步并保存经历">
          {ACTIONS.map((action, index) => <Button key={action} disabled={!!replay} onClick={() => collect(index)} aria-label={action}>{arrows[index]} {action.slice(1)}</Button>)}
        </div>
        <div className="vbrl-replay__transition" aria-live="polite">
          {current ? <><div className="vbrl-replay__transition-states"><Typography variant="bodySmall" tone="warning">起点 {coordinate(current.s)}</Typography>
            <Typography variant="bodySmall" tone="muted">→</Typography><Typography variant="bodySmall" tone="success">下一状态 {coordinate(current.next)}</Typography></div>
            <div className="vbrl-replay__step-feedback"><Typography variant="bodySmall" tone="accent">{ACTIONS[current.action]}</Typography>
              <Typography variant="bodySmall" tone={current.reward < 0 ? 'danger' : 'success'}>奖励 {reward(current.reward)}</Typography>
              <Typography variant="bodySmall" tone="muted">{current.done ? current.trapped ? '陷阱终止' : '送达终止' : '未终止'}{replay ? ' · 回放' : ''}</Typography></div></>
            : <><Typography variant="bodySmall" tone="accent">选一个动作，环境返回真实反馈。</Typography><Typography variant="bodySmall" tone="muted">一条经历记录这一步发生了什么。</Typography></>}
        </div>
      </TeachingPanel>
      <TeachingPanel title="② 保存到经验池" className="vbrl-replay__storage">
        <div className="vbrl-replay__pool-heading"><Typography variant="bodySmall" tone="muted">已实际采集 {state.collected} 步</Typography><Typography variant="bodySmall" tone="accent">{occupied.length}/{BUFFER_CAPACITY} 条</Typography></div>
        <div className="vbrl-replay__record-list" aria-label="完整经历示例，点击回放">
          <div className="vbrl-replay__record-head" aria-hidden="true"><Typography variant="bodySmall" tone="muted">编号</Typography><div className="vbrl-replay__record-fields">
            <Typography variant="bodySmall" tone="warning">当前状态</Typography><Typography variant="bodySmall" tone="accent">动作</Typography>
            <Typography variant="bodySmall" tone="muted">奖励</Typography><Typography variant="bodySmall" tone="success">下一状态</Typography>
          </div></div>
          <div className="vbrl-replay__records">
          {Array.from({ length: 3 }, (_, index) => {
            const entry = cards[index]; return entry ? <Button key={entry.id} className={'vbrl-replay__record' + (entry.done ? entry.trapped ? ' is-trap' : ' is-delivery' : '')}
              active={entry.id === current?.id} onClick={() => view(entry)} data-id={entry.id} data-experience={experienceKey(entry)} aria-label={`回放经历 #${entry.id}`}>
              <Typography variant="bodySmall" tone="inherit" className="vbrl-replay__record-id">#{entry.id}</Typography>
              <div><div className="vbrl-replay__record-fields">
                <Typography variant="bodySmall" tone="warning" data-field="state">{coordinate(entry.s)}</Typography>
                <div className="vbrl-replay__record-action" data-field="action"><ActionArrow action={entry.action} /><Typography variant="bodySmall" tone="accent">{ACTIONS[entry.action]}</Typography></div>
                <Typography variant="bodySmall" tone={entry.reward < 0 ? 'danger' : 'success'} data-field="reward">{reward(entry.reward)}</Typography>
                <Typography variant="bodySmall" tone="success" data-field="next-state">{coordinate(entry.next)}</Typography>
              </div><Typography variant="bodySmall" tone="muted" className="vbrl-replay__record-meta">{entry.done ? entry.trapped ? '陷阱终止' : '送达终止' : entry.hit ? '碰撞，未终止' : '未终止'} · 第 {entry.episode} 回合</Typography></div>
            </Button> : <div className="vbrl-replay__record is-empty" key={'empty-' + index}><Typography variant="bodySmall" tone="muted">{['起点 · 动作 · 奖励 · 下一状态', '还会记录：这一步是否终止', '实际交互后，完整记录保存在这里'][index]}</Typography></div>;
          })}
          </div>
        </div>
        <div className="vbrl-replay__slots" aria-label="八个环形经验槽">
          {state.slots.map((entry, slot) => <Button key={slot} disabled={!entry} active={entry?.id === current?.id} onClick={() => entry && view(entry)}
            data-slot={slot} data-id={entry?.id} className={entry && state.batch.some(item => item.id === entry.id) ? 'is-picked' : ''} aria-label={entry ? `回放槽 ${slot + 1} 的经历 #${entry.id}` : `空槽 ${slot + 1}`}>
            <Typography variant="bodySmall" tone="inherit">{entry ? '#' + entry.id : '·'}</Typography>
          </Button>)}
        </div>
        <div className="vbrl-replay__storage-note"><Typography variant="bodySmall" tone="accent">抽样时，整条经历一起取出。</Typography></div>
        <div className="vbrl-replay__tools"><Button onClick={replay ? () => setReplay(null) : demonstration}>{replay ? '返回采集' : '采集示例'}</Button><Button onClick={() => { setReplay(null); setState(createReplaySimulation()); }}>清空</Button></div>
      </TeachingPanel>
      <TeachingPanel title="③ 随机抽取一批" className="vbrl-replay__sampling">
        <div className="vbrl-replay__batch-heading"><Formula latex={`B=${BATCH_SIZE}`} /><Button variant="primary" disabled={occupied.length < BATCH_SIZE} onClick={draw}>{state.drawCount ? '再次抽样' : '随机抽取 4 条'}</Button></div>
        <div className="vbrl-replay__batch" aria-label="抽中的完整经历，点击在地图回放">
          {Array.from({ length: BATCH_SIZE }, (_, index) => {
            const entry = state.batch[index]; return entry ? <Button key={entry.id} active={entry.id === current?.id} onClick={() => view(entry)}
              data-id={entry.id} data-experience={experienceKey(entry)} aria-label={`回放抽中的经历 #${entry.id}`}>
              <Typography variant="bodySmall" tone="accent">#{entry.id} · {ACTIONS[entry.action]}</Typography>
              <Typography variant="bodySmall" tone={entry.reward < 0 ? 'danger' : 'success'}>奖励 {reward(entry.reward)}</Typography>
            </Button> : <div className="vbrl-replay__sample-empty" key={'sample-' + index}><Typography variant="bodySmall" tone="muted">待抽样</Typography></div>;
          })}
        </div>
        <Typography variant="bodySmall" tone="muted" align="center">按编号查看完整经历。<br />点击后，在地图回放这一步。</Typography>
        <div className="vbrl-replay__training-chain" aria-label="经历用于网络训练的基本链路">
          {['预测与目标', '计算误差', '更新参数'].map((text, index) => <div key={text}><Typography variant="bodySmall" tone={index === 2 ? 'success' : 'accent'} align="center">{text}</Typography>{index < 2 && <span aria-hidden="true">→</span>}</div>)}
        </div>
        <Typography variant="bodySmall" tone="accent">批内不重复，跨批可以再次抽到。</Typography>
      </TeachingPanel>
    </div>
  </LessonPage>;
}
