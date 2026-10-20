import { useState } from 'react';
import { Button, Typography } from '../../../shared/react';
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
    footer={<Typography variant="bodySmall" tone="accent">固定的是目标网络参数；同一条经历的目标在两次同步之间保持不变。终止时，目标只取本步奖励。</Typography>}>
    <div className="vbrl-target" data-updates={state.updates} data-syncs={state.syncs} data-last-sync={state.lastSync} data-selected={entry.id}
      data-batch-ids={state.batch.map(item => item.id).join(',')} data-online-q={online.values[entry.action]} data-frozen-y={frozen} data-moving-y={moving}
      data-loss-before={state.lastUpdate?.lossBefore} data-loss-after={state.lastUpdate?.lossAfter}
      data-online-values={online.values.join(',')} data-target-values={target.values.join(',')}
      onKeyDown={event => { if (event.key === ' ' && event.target instanceof HTMLElement && event.target.closest('button')) event.stopPropagation(); }}>
      <div className="vbrl-target__experience">
        <div className="vbrl-target__batch" aria-label="固定的四条真实经历">{state.batch.map((item,index) => <Button key={item.id} active={selected === index} aria-pressed={selected === index}
          onClick={() => setSelected(index)} data-id={item.id} aria-label={`观察经历 #${item.id}`}>#{item.id}</Button>)}</div>
        <Formula latex={tuple} /><Typography variant="bodySmall" tone={entry.done ? entry.trapped ? 'danger' : 'success' : 'muted'}>{entry.done ? entry.trapped ? '陷阱终止' : '送达终止' : '尚未终止'}</Typography>
      </div>
      <div className="vbrl-target__panels">
        <TeachingPanel title="① 当前网络：给当前动作评分" className="vbrl-target__online">
          <div className="vbrl-target__status"><Formula latex={String.raw`\theta`} /><Typography variant="bodySmall" tone="accent">持续学习 · 只取实际执行的动作</Typography></div>
          <div className="vbrl-target__network-and-values">
            <div className="vbrl-target__network"><Formula latex={`s=${coordinate(entry.s)}`} /><PositionQNetwork hidden={online.hidden} />
              <Formula latex={String.raw`49\to24\to4`} /></div>
            <div className="vbrl-target__values">
              {online.values.map((value,action) => <div key={action} className={action === entry.action ? 'is-executed' : ''} data-action={action} data-q={value}>
                <Typography variant="bodySmall" tone="accent">{labels[action]}</Typography><Typography variant="bodySmall" tone={action === entry.action ? 'warning' : 'muted'}>{value.toFixed(2)}</Typography>
              </div>)}
              <div className="vbrl-target__chosen"><Formula latex={String.raw`Q_\theta(s,${arrows[entry.action]})=${online.values[entry.action].toFixed(2)}`} /></div>
            </div>
          </div>
          <Typography variant="bodySmall" tone="accent">参与反向传播，更新当前参数。</Typography>
        </TeachingPanel>
        <TeachingPanel title="② 目标网络：提供后续估计" className="vbrl-target__frozen">
          <div className="vbrl-target__status"><Formula latex={String.raw`\theta^-`} /><Typography variant="bodySmall" tone="success">{unchanged ? '刚完成同步 · 现在冻结' : '暂时固定 · 本次不参与梯度更新'}</Typography></div>
          <div className="vbrl-target__network-and-values">
            <div className="vbrl-target__network"><Formula latex={`s'=${coordinate(entry.next)}`} /><PositionQNetwork hidden={target.hidden} target />
              <Typography variant="bodySmall" tone="muted" align="center">同一结构，参数是延迟副本。</Typography></div>
            <div className="vbrl-target__values">
              {target.values.map((value,action) => <div key={action} className={!entry.done && action === best ? 'is-maximum' : ''} data-action={action} data-q={value}>
                <Typography variant="bodySmall" tone="accent">{labels[action]}</Typography><Typography variant="bodySmall" tone={!entry.done && action === best ? 'success' : 'muted'}>{value.toFixed(2)}</Typography>
              </div>)}
              <div className="vbrl-target__chosen is-target"><Formula latex={entry.done ? String.raw`\text{终止：不续接未来价值}` : String.raw`\max_{a'}Q_{\theta^-}(s',a')=${target.values[best].toFixed(2)}`} /></div>
            </div>
          </div>
          <div className="vbrl-target__target-value"><Formula latex={entry.done ? `y=r=${entry.reward}` : `y=${entry.reward}+0.9\\times ${target.values[best].toFixed(2)}\\approx ${frozen.toFixed(2)}`} /></div>
        </TeachingPanel>
      </div>
      <div className="vbrl-target__actions">
        <div className="vbrl-target__controls"><Button variant="primary" onClick={() => setState(previous => updateTargetExperiment(previous))}>更新当前网络</Button>
          <Button onClick={() => setState(previous => updateTargetExperiment(previous,10))}>再更新 10 次</Button>
          <Button className="vbrl-target__sync" disabled={unchanged} onClick={() => setState(syncTargetExperiment)}>同步目标参数</Button>
          <Button onClick={() => { setState(createTargetLesson()); setSelected(0); }}>重置</Button></div>
        <div className="vbrl-target__sync-note"><Formula latex={String.raw`\theta^-\leftarrow\theta`} /><Typography variant="bodySmall" tone="muted">本轮更新 {state.updates-TARGET_WARMUP} 次 · 同步 {state.syncs-1} 次</Typography></div>
      </div>
    </div>
  </LessonPage>;
}
