import { useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import { PositionQNetwork } from '../../components/PositionQNetwork';
import { dqnForward, dqnTarget, syncTargetExperiment, updateTargetExperiment } from '../../dqnSimulation';
import { TARGET_WARMUP, createTargetLesson } from './targetLesson';
import './TargetNetworkPage.css';

const coordinate = (p: { row: number; col: number }) => `(${p.row + 1},${p.col + 1})`;
const arrows = [String.raw`\uparrow`, String.raw`\rightarrow`, String.raw`\downarrow`, String.raw`\leftarrow`];
const labels = ['↑ 上','→ 右','↓ 下','← 左'];
export function TargetNetworkPage() {
  const [state, setState] = useState(createTargetLesson), [selected, setSelected] = useState(0);
  const entry = state.batch[selected], online = dqnForward(state.online, entry.s), target = dqnForward(state.target, entry.next);
  const best = target.values.indexOf(Math.max(...target.values)), frozen = dqnTarget(state.target, entry), moving = dqnTarget(state.online, entry);
  const unchanged = state.updates === state.lastSync;
  const tuple = String.raw`s=${coordinate(entry.s)},\quad a=${arrows[entry.action]},\quad r=${entry.reward},\quad s'=${coordinate(entry.next)}`;
  return <LessonPage className="vbrl-foundation-page vbrl-target-page" title="目标网络：固定参照，再更新估计"
    subtitle="当前网络负责学习，目标网络提供后续价值的参照，并在两次同步之间保持参数不变。"
    footer={<Typography shuku-edit-id="e-17e5f6a5-ae20-4ded-89f9-dd25580ddd80" variant="bodySmall" tone="accent">固定的是目标网络参数；同一条经历的目标在两次同步之间保持不变。终止时，目标只取本步奖励。</Typography>}>
    <div shuku-edit-id="e-a6c3af40-e1e6-4b1b-a6dd-67d779a81b60" className="vbrl-target" data-updates={state.updates} data-syncs={state.syncs} data-last-sync={state.lastSync} data-selected={entry.id}
      data-batch-ids={state.batch.map(item => item.id).join(',')} data-online-q={online.values[entry.action]} data-frozen-y={frozen} data-moving-y={moving}
      data-loss-before={state.lastUpdate?.lossBefore} data-loss-after={state.lastUpdate?.lossAfter}
      data-online-values={online.values.join(',')} data-target-values={target.values.join(',')}
      onKeyDown={event => { if (event.key === ' ' && event.target instanceof HTMLElement && event.target.closest('button')) event.stopPropagation(); }}>
      <div shuku-edit-id="e-f1be3052-7571-47c2-8ba6-d6cd65e8f323" className="vbrl-target__experience">
        <div shuku-edit-id="e-fa874e9f-ca7c-4f00-9517-67e5a2217eab" className="vbrl-target__batch" aria-label="固定的四条真实经历">{state.batch.map((item,index) => <Button key={item.id} active={selected === index} aria-pressed={selected === index}
          onClick={() => setSelected(index)} data-id={item.id} aria-label={`观察经历 #${item.id}`}>#{item.id}</Button>)}</div>
        <Formula latex={tuple} /><Typography shuku-edit-id="e-204dc034-eeb9-4377-a39d-9efccab24b7c" variant="bodySmall" tone={entry.done ? entry.trapped ? 'danger' : 'success' : 'muted'}>{entry.done ? entry.trapped ? '陷阱终止' : '送达终止' : '尚未终止'}</Typography>
      </div>
      <div shuku-edit-id="e-95980ab8-f8fe-4340-afae-0d1084f3f4ca" className="vbrl-target__panels">
        <TeachingPanel title="① 当前网络：给当前动作评分" className="vbrl-target__online">
          <div shuku-edit-id="e-17c6fcc2-f52b-464c-83b6-908dbcae5734" className="vbrl-target__status"><Formula latex={String.raw`\theta`} /><Typography shuku-edit-id="e-356b9164-9a1f-43bc-bdf1-b66d44293f82" variant="bodySmall" tone="accent">持续学习 · 只取实际执行的动作</Typography></div>
          <div shuku-edit-id="e-c29514af-511d-4984-bade-8c6d3773e7b9" className="vbrl-target__network-and-values">
            <div shuku-edit-id="e-bf34d793-fdec-436e-a71c-de524936f7d1" className="vbrl-target__network"><Formula latex={`s=${coordinate(entry.s)}`} /><PositionQNetwork hidden={online.hidden} />
              <Formula latex={String.raw`49\to24\to4`} /></div>
            <div shuku-edit-id="e-0137864d-23c5-4267-b43d-aa74850f4ce1" className="vbrl-target__values">
              {online.values.map((value,action) => <div shuku-edit-id="e-75e6f206-355f-43c9-b975-9b375fabbeb7" key={action} className={action === entry.action ? 'is-executed' : ''} data-action={action} data-q={value}>
                <Typography shuku-edit-id="e-9bd9f7e9-790c-4a76-838a-286d4c2c44de" variant="bodySmall" tone="accent">{labels[action]}</Typography><Typography shuku-edit-id="e-f04e0d73-f0d5-4ba1-8388-d6ac2bb2415e" variant="bodySmall" tone={action === entry.action ? 'warning' : 'muted'}>{value.toFixed(2)}</Typography>
              </div>)}
              <div shuku-edit-id="e-82f600e1-dea9-45b7-a159-df84b278b312" className="vbrl-target__chosen"><Formula latex={String.raw`Q_\theta(s,${arrows[entry.action]})=${online.values[entry.action].toFixed(2)}`} /></div>
            </div>
          </div>
          <Typography shuku-edit-id="e-6c172bba-91be-44b2-bec8-fb8cf0118246" variant="bodySmall" tone="accent">参与反向传播，更新当前参数。</Typography>
        </TeachingPanel>
        <TeachingPanel title="② 目标网络：提供后续估计" className="vbrl-target__frozen">
          <div shuku-edit-id="e-b79a2142-cc9c-4d72-b9cb-4bec4e7c9a90" className="vbrl-target__status"><Formula latex={String.raw`\theta^-`} /><Typography shuku-edit-id="e-f0d67f99-a337-48b2-9bf4-4e856ce93939" variant="bodySmall" tone="success">{unchanged ? '刚完成同步 · 现在冻结' : '暂时固定 · 本次不参与梯度更新'}</Typography></div>
          <div shuku-edit-id="e-78f96e02-dc13-410b-b09e-3a127db3e574" className="vbrl-target__network-and-values">
            <div shuku-edit-id="e-1044e936-487a-4cd0-802b-6fc5b420cc49" className="vbrl-target__network"><Formula latex={`s'=${coordinate(entry.next)}`} /><PositionQNetwork hidden={target.hidden} target />
              <Typography shuku-edit-id="e-4d7cb36e-8541-4b37-9a88-3478666744ad" variant="bodySmall" tone="muted" align="center">同一结构，参数是延迟副本。</Typography></div>
            <div shuku-edit-id="e-69acaf54-df62-41b4-b06e-460d3f829aad" className="vbrl-target__values">
              {target.values.map((value,action) => <div shuku-edit-id="e-cc568162-a47f-440c-9dd0-7a650d18d22a" key={action} className={!entry.done && action === best ? 'is-maximum' : ''} data-action={action} data-q={value}>
                <Typography shuku-edit-id="e-dc634772-0184-4b55-8f8e-42fbeb938885" variant="bodySmall" tone="accent">{labels[action]}</Typography><Typography shuku-edit-id="e-4983f3ee-9364-4cc7-9089-b6f9773bfadf" variant="bodySmall" tone={!entry.done && action === best ? 'success' : 'muted'}>{value.toFixed(2)}</Typography>
              </div>)}
              <div shuku-edit-id="e-39b0d17a-f46b-45c7-88ca-df086c419a64" className="vbrl-target__chosen is-target"><Formula latex={entry.done ? String.raw`\text{终止：不续接未来价值}` : String.raw`\max_{a'}Q_{\theta^-}(s',a')=${target.values[best].toFixed(2)}`} /></div>
            </div>
          </div>
          <div shuku-edit-id="e-c7430a86-1cf1-4813-ab38-5bc97026674c" className="vbrl-target__target-value"><Formula latex={entry.done ? `y=r=${entry.reward}` : `y=${entry.reward}+0.9\\times ${target.values[best].toFixed(2)}\\approx ${frozen.toFixed(2)}`} /></div>
        </TeachingPanel>
      </div>
      <div shuku-edit-id="e-63a86b44-9560-4f15-b66b-296da77b8c51" className="vbrl-target__actions">
        <div shuku-edit-id="e-c5f6e4db-42b8-4670-b9a4-fd69e4840172" className="vbrl-target__controls"><Button variant="primary" onClick={() => setState(previous => updateTargetExperiment(previous))}>更新当前网络</Button>
          <Button onClick={() => setState(previous => updateTargetExperiment(previous,10))}>再更新 10 次</Button>
          <Button className="vbrl-target__sync" disabled={unchanged} onClick={() => setState(syncTargetExperiment)}>同步目标参数</Button>
          <Button onClick={() => { setState(createTargetLesson()); setSelected(0); }}>重置</Button></div>
        <div shuku-edit-id="e-a35db75e-4019-45f9-be78-97c60d7ee93c" className="vbrl-target__sync-note"><Formula latex={String.raw`\theta^-\leftarrow\theta`} /><Typography shuku-edit-id="e-84e09fb5-6ce6-403e-865c-93e714c8e1bb" variant="bodySmall" tone="muted">本轮更新 {state.updates-TARGET_WARMUP} 次 · 同步 {state.syncs-1} 次</Typography></div>
      </div>
    </div>
  </LessonPage>;
}
