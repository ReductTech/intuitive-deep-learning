import { useEffect, useRef, useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
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
  return <svg shuku-edit-id="e-412bf6ba-58b4-44e2-9776-775df23037e9" className="vbrl-replay__direction-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path shuku-edit-id="e-74da0423-c4a1-4382-92e8-a79597f1c103" d="M9 21V10H3L12 1L21 10H15V21Z" transform={`rotate(${action * 90} 12 12)`} />
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
    <div shuku-edit-id="e-b7afab05-2ac1-460d-ab88-c320b4cc38ac" className="vbrl-replay" data-collected={state.collected} data-draw={state.drawCount}
      data-batch-ids={state.batch.map(entry => entry.id).join(',')} data-buffer-ids={state.slots.map(entry => entry?.id ?? '').join(',')}
      data-selected={current?.id} data-mode={replay ? 'replay' : 'collect'} data-phase={replay ? replay.end ? 'end' : 'start' : 'live'}
      data-live-position={keyOf(state.position)} data-next-slot={state.nextSlot} data-evicted={state.evicted}
      onKeyDown={event => { if (event.key === ' ' && event.target instanceof HTMLElement && event.target.closest('button')) event.stopPropagation(); }}>
      <TeachingPanel title="① 交互生成一条经历" className="vbrl-replay__interaction">
        <ReplayExperienceMap position={state.position} experience={current} atEnd={replay ? replay.end : true}
          robotKey={replay ? 'replay-' + replay.nonce : 'live-' + state.episode} />
        <div shuku-edit-id="e-33e6da6f-1fb0-483f-b0e3-fe538e99c429" className="vbrl-replay__directions" aria-label="实际走一步并保存经历">
          {ACTIONS.map((action, index) => <Button key={action} disabled={!!replay} onClick={() => collect(index)} aria-label={action}>{arrows[index]} {action.slice(1)}</Button>)}
        </div>
        <div shuku-edit-id="e-ed013858-84fd-4a8f-aa9d-7a4400e79cdc" className="vbrl-replay__transition" aria-live="polite">
          {current ? <><div shuku-edit-id="e-2990cc36-b1a7-4bbd-9a2f-f1a9d74ed490" className="vbrl-replay__transition-states"><Typography shuku-edit-id="e-d7ceca72-41f3-4f8c-953c-312ece784d17" variant="bodySmall" tone="warning">起点 {coordinate(current.s)}</Typography>
            <Typography shuku-edit-id="e-d9468568-e115-4804-a9fd-dc88f8bd0e16" variant="bodySmall" tone="muted">→</Typography><Typography shuku-edit-id="e-9c12e3ee-bdc5-4f86-a394-51b9850fc700" variant="bodySmall" tone="success">下一状态 {coordinate(current.next)}</Typography></div>
            <div shuku-edit-id="e-b7455e4a-9e9b-432e-a6d0-c9423ff83953" className="vbrl-replay__step-feedback"><Typography shuku-edit-id="e-4588289b-1966-4b90-99c2-f016fc06c2d1" variant="bodySmall" tone="accent">{ACTIONS[current.action]}</Typography>
              <Typography shuku-edit-id="e-aa6da125-f07c-4af4-a6f5-4f3be8e883fd" variant="bodySmall" tone={current.reward < 0 ? 'danger' : 'success'}>奖励 {reward(current.reward)}</Typography>
              <Typography shuku-edit-id="e-f8bb3d4b-94b7-42ff-8896-55a5c3ee9088" variant="bodySmall" tone="muted">{current.done ? current.trapped ? '陷阱终止' : '送达终止' : '未终止'}{replay ? ' · 回放' : ''}</Typography></div></>
            : <><Typography shuku-edit-id="e-be64d8b0-6e7f-4e99-9475-91f30291a9b0" variant="bodySmall" tone="accent">选一个动作，环境返回真实反馈。</Typography><Typography shuku-edit-id="e-93cc833e-c34b-4b01-897a-9d3442c4afb2" variant="bodySmall" tone="muted">一条经历记录这一步发生了什么。</Typography></>}
        </div>
      </TeachingPanel>
      <TeachingPanel title="② 保存到经验池" className="vbrl-replay__storage">
        <div shuku-edit-id="e-2853486c-91f8-450f-acbf-1313bc3b7bd0" className="vbrl-replay__pool-heading"><Typography shuku-edit-id="e-5c134ce4-e2bd-4cb9-b3fb-e6f8eeb2c0d7" variant="bodySmall" tone="muted">已实际采集 {state.collected} 步</Typography><Typography shuku-edit-id="e-75e038b3-352b-40e0-90cb-83a68d4f1a00" variant="bodySmall" tone="accent">{occupied.length}/{BUFFER_CAPACITY} 条</Typography></div>
        <div shuku-edit-id="e-5566daa0-6c95-4d96-9d18-ac8c00e8d157" className="vbrl-replay__record-list" aria-label="完整经历示例，点击回放">
          <div shuku-edit-id="e-aaa7effd-b108-4eda-bf38-ed6e0f403506" className="vbrl-replay__record-head" aria-hidden="true"><Typography shuku-edit-id="e-142c30d0-99ba-4d1f-92b9-6aa9b6ea11b4" variant="bodySmall" tone="muted">编号</Typography><div shuku-edit-id="e-c7ff3793-549d-4755-ab37-a47b379b4b16" className="vbrl-replay__record-fields">
            <Typography shuku-edit-id="e-8cc52ccc-e1ab-48e9-a775-3f2491244617" variant="bodySmall" tone="warning">当前状态</Typography><Typography shuku-edit-id="e-af7554c9-94a0-4deb-917e-c0e690a1bc39" variant="bodySmall" tone="accent">动作</Typography>
            <Typography shuku-edit-id="e-4dda9ed8-ab1e-4c51-81eb-72e5c77c048b" variant="bodySmall" tone="muted">奖励</Typography><Typography shuku-edit-id="e-75e1f303-41bb-48b1-886c-ac91f756fb1a" variant="bodySmall" tone="success">下一状态</Typography>
          </div></div>
          <div shuku-edit-id="e-9725d381-dfb1-418d-9f34-d445367614e8" className="vbrl-replay__records">
          {Array.from({ length: 3 }, (_, index) => {
            const entry = cards[index]; return entry ? <Button key={entry.id} className={'vbrl-replay__record' + (entry.done ? entry.trapped ? ' is-trap' : ' is-delivery' : '')}
              active={entry.id === current?.id} onClick={() => view(entry)} data-id={entry.id} data-experience={experienceKey(entry)} aria-label={`回放经历 #${entry.id}`}>
              <Typography shuku-edit-id="e-bef31b9b-b62c-4415-b19e-487d12a81a64" variant="bodySmall" tone="inherit" className="vbrl-replay__record-id">#{entry.id}</Typography>
              <div shuku-edit-id="e-54c686ea-e6ee-410f-810a-a1529b619f38"><div shuku-edit-id="e-1e866157-6287-4b25-afdd-51b793168852" className="vbrl-replay__record-fields">
                <Typography shuku-edit-id="e-938b27c0-92ee-4e71-8e23-a7045d9fa8b6" variant="bodySmall" tone="warning" data-field="state">{coordinate(entry.s)}</Typography>
                <div shuku-edit-id="e-8d847c8f-6645-4a3b-b7c5-f08ac12f814c" className="vbrl-replay__record-action" data-field="action"><ActionArrow action={entry.action} /><Typography shuku-edit-id="e-43c37018-71cd-4380-b345-351244bd77b9" variant="bodySmall" tone="accent">{ACTIONS[entry.action]}</Typography></div>
                <Typography shuku-edit-id="e-459c78f8-3d4f-4baa-8cb4-45c8f3bcf5b3" variant="bodySmall" tone={entry.reward < 0 ? 'danger' : 'success'} data-field="reward">{reward(entry.reward)}</Typography>
                <Typography shuku-edit-id="e-f7bb0d2b-a196-48e1-b21e-36b702460ef5" variant="bodySmall" tone="success" data-field="next-state">{coordinate(entry.next)}</Typography>
              </div><Typography shuku-edit-id="e-71bc130b-0a61-4699-ac8f-3f47025bea1c" variant="bodySmall" tone="muted" className="vbrl-replay__record-meta">{entry.done ? entry.trapped ? '陷阱终止' : '送达终止' : entry.hit ? '碰撞，未终止' : '未终止'} · 第 {entry.episode} 回合</Typography></div>
            </Button> : <div shuku-edit-id="e-1aa0c430-d142-4291-a582-4a88d6d9e6e7" className="vbrl-replay__record is-empty" key={'empty-' + index}><Typography shuku-edit-id="e-7da67c1e-27e0-4ecb-833d-838184db173e" variant="bodySmall" tone="muted">{['起点 · 动作 · 奖励 · 下一状态', '还会记录：这一步是否终止', '实际交互后，完整记录保存在这里'][index]}</Typography></div>;
          })}
          </div>
        </div>
        <div shuku-edit-id="e-a1790a19-5ba5-476d-acc7-83f13274ad24" className="vbrl-replay__slots" aria-label="八个环形经验槽">
          {state.slots.map((entry, slot) => <Button key={slot} disabled={!entry} active={entry?.id === current?.id} onClick={() => entry && view(entry)}
            data-slot={slot} data-id={entry?.id} className={entry && state.batch.some(item => item.id === entry.id) ? 'is-picked' : ''} aria-label={entry ? `回放槽 ${slot + 1} 的经历 #${entry.id}` : `空槽 ${slot + 1}`}>
            <Typography shuku-edit-id="e-afe3e29a-8433-46b2-8300-7d56254e4cca" variant="bodySmall" tone="inherit">{entry ? '#' + entry.id : '·'}</Typography>
          </Button>)}
        </div>
        <div shuku-edit-id="e-c35bd307-8ce1-4dc1-85ce-b0b72ae5870c" className="vbrl-replay__storage-note"><Typography shuku-edit-id="e-b07b6b16-8871-4915-b0a8-23b5ffd18e0d" variant="bodySmall" tone="accent">抽样时，整条经历一起取出。</Typography></div>
        <div shuku-edit-id="e-abb5e419-7250-40be-b06f-a281d2dbf54c" className="vbrl-replay__tools"><Button onClick={replay ? () => setReplay(null) : demonstration}>{replay ? '返回采集' : '采集示例'}</Button><Button onClick={() => { setReplay(null); setState(createReplaySimulation()); }}>清空</Button></div>
      </TeachingPanel>
      <TeachingPanel title="③ 随机抽取一批" className="vbrl-replay__sampling">
        <div shuku-edit-id="e-3ce34d91-07e1-48f8-ada6-3e7729a4625d" className="vbrl-replay__batch-heading"><Formula latex={`B=${BATCH_SIZE}`} /><Button variant="primary" disabled={occupied.length < BATCH_SIZE} onClick={draw}>{state.drawCount ? '再次抽样' : '随机抽取 4 条'}</Button></div>
        <div shuku-edit-id="e-0f74c932-a379-4c36-9897-487475dcfcbe" className="vbrl-replay__batch" aria-label="抽中的完整经历，点击在地图回放">
          {Array.from({ length: BATCH_SIZE }, (_, index) => {
            const entry = state.batch[index]; return entry ? <Button key={entry.id} active={entry.id === current?.id} onClick={() => view(entry)}
              data-id={entry.id} data-experience={experienceKey(entry)} aria-label={`回放抽中的经历 #${entry.id}`}>
              <Typography shuku-edit-id="e-837c8c9f-8f32-4fe0-9aff-bad7dbb672e1" variant="bodySmall" tone="accent">#{entry.id} · {ACTIONS[entry.action]}</Typography>
              <Typography shuku-edit-id="e-b113a9fd-92a5-47c6-a212-596933aa5bd4" variant="bodySmall" tone={entry.reward < 0 ? 'danger' : 'success'}>奖励 {reward(entry.reward)}</Typography>
            </Button> : <div shuku-edit-id="e-4a4cda2e-177a-4e55-9ea6-21f120c4b8fe" className="vbrl-replay__sample-empty" key={'sample-' + index}><Typography shuku-edit-id="e-089acc19-2b6a-479e-a8dd-25ac3bcba599" variant="bodySmall" tone="muted">待抽样</Typography></div>;
          })}
        </div>
        <Typography shuku-edit-id="e-e9556158-82d3-4ff9-9e22-2bb5fc2cc47e" variant="bodySmall" tone="muted" align="center">按编号查看完整经历。<br shuku-edit-id="e-d1f31b97-c329-43e6-908d-120ed6ee0705" />点击后，在地图回放这一步。</Typography>
        <div shuku-edit-id="e-830596d7-16db-454a-b73e-a2627645e848" className="vbrl-replay__training-chain" aria-label="经历用于网络训练的基本链路">
          {['预测与目标', '计算误差', '更新参数'].map((text, index) => <div shuku-edit-id="e-d4983133-6bd1-4f5d-a81f-99ab7a005b8e" key={text}><Typography shuku-edit-id="e-7ccb2794-05ee-464e-9ca1-68b9f188c622" variant="bodySmall" tone={index === 2 ? 'success' : 'accent'} align="center">{text}</Typography>{index < 2 && <span shuku-edit-id="e-9a998608-dd97-46bb-855c-f1975f03589f" aria-hidden="true">→</span>}</div>)}
        </div>
        <Typography shuku-edit-id="e-0fac7306-4fa4-450e-b2ff-debf97e75cc9" variant="bodySmall" tone="accent">批内不重复，跨批可以再次抽到。</Typography>
      </TeachingPanel>
    </div>
  </LessonPage>;
}
