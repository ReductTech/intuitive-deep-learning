import { useState } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
import { Formula } from '../../components/LessonPrimitives';
import { ExperienceMap, ReturnDistribution, displayReturn } from '../../components/PolicyExperience';
import { usePolicyExperience } from '../../components/usePolicyExperience';
import { experienceMean } from '../../components/policyEvaluation';
import { ACTIONS } from '../../model';
import '../StateValuePage/StateValuePage.css';
import './ActionValuePage.css';

export function ActionValuePage() {
  const [action, setAction] = useState(0);
  const up = usePolicyExperience('safe', 0), right = usePolicyExperience('safe', 1);
  const down = usePolicyExperience('safe', 2), left = usePolicyExperience('safe', 3);
  const groups = [up, right, down, left], selected = groups[action];
  const pending = groups.some(group => group.pending && group.record);
  function choose(next: number) { if (next !== action) { groups.forEach(group => group.cancel()); setAction(next); } }
  return <ContentBlock className="vbrl-value vbrl-q-value" title="动作价值：先走哪一步，未来更好？"
    subtitle="动作价值是在某个状态先执行一个动作，再遵循给定策略时的期望回报。" headingLevel={1}>
    <div className="vbrl-value__comparison" ref={node => { groups.forEach(group => { group.rootRef.current = node; }); }}
      data-action={action} data-cursor={selected.cursor} data-playing={selected.playing} data-pending={selected.pending}>
      <section className="vbrl-experience-panel" aria-label="指定第一步并实际送货">
        <header className="vbrl-experience-panel__head"><Typography as="h2" variant="h3" tone="inherit">只改变第一步</Typography>
          <div className="vbrl-value__sampling"><Formula latex={String.raw`s \to a \to \pi_{\mathrm{safe}}`} />
            <Button variant="primary" disabled={selected.pending && selected.record} onClick={() => selected.addBatch()}>{selected.samples.length ? '再采样 10 次' : '采样 10 次'}</Button>
          </div></header>
        <div className="vbrl-experience-panel__body">
          <div className="vbrl-experience-panel__scene">
            <ExperienceMap experience={selected.active} cursor={selected.cursor} firstStep />
            <div className="vbrl-q-value__choice">
              <Typography variant="bodySmall" tone="warning">① 第一步由你选择</Typography>
              <div className="vbrl-q-value__actions" role="group" aria-label="选择第一步动作">
                {ACTIONS.map((label, index) => <Button key={label} active={index === action} aria-pressed={index === action} onClick={() => choose(index)}>{label}</Button>)}
              </div>
              <Typography variant="bodySmall" tone="accent">② 后续策略保持相同</Typography>
              <Typography variant="bodySmall" tone="muted">80% 朝终点方向走<br />20% 在安全方向中随机</Typography>
              <Typography variant="bodySmall" tone="warning">橙色：指定的第一步</Typography>
              <Typography variant="bodySmall" tone="success">绿色：后续实际经历</Typography>
            </div>
          </div>
        </div>
      </section>
      <section className="vbrl-experience-panel" aria-label="四个第一步动作的样本与均值">
        <header className="vbrl-experience-panel__head">
          <Typography as="h2" variant="h3" tone="inherit">四个动作的 Q 值</Typography>
          <Button disabled={pending} onClick={() => groups.forEach(group => group.addBatch())}>各采样 10 次</Button>
        </header>
        <div className="vbrl-q-value__results">
          <table className="vbrl-q-value__table" aria-label="同一后续策略下四个动作的估计价值">
            <thead><tr>{['第一步', '样本数', '平均回报'].map(label => <th key={label} scope="col"><Typography variant="bodySmall" tone="muted">{label}</Typography></th>)}</tr></thead>
            <tbody>{groups.map((group, index) => {
              const mean = experienceMean(group.samples);
              return <tr key={index} className={index === action ? 'is-selected' : undefined} data-action-row={index} data-count={group.samples.length} data-mean={mean}>
                <th scope="row"><Button aria-pressed={index === action} active={index === action} onClick={() => choose(index)}>{ACTIONS[index]}</Button></th>
                <td><Typography variant="bodySmall" tone="muted">{group.samples.length}</Typography></td>
                <td><Typography variant="bodySmall" tone={index === action ? 'warning' : 'accent'}>{mean === undefined ? '—' : displayReturn(mean)}</Typography></td>
              </tr>;
            })}</tbody>
          </table>
          <ReturnDistribution samples={selected.samples} active={selected.active} disabled={selected.pending && selected.record} onSelect={selected.replay} />
          <Typography variant="bodySmall" tone="accent" role="status">
            {selected.samples.length ? '当前样本都以' + ACTIONS[action] + '开始，再按相同策略继续。' : '选择第一步并采样，结果加入对应动作的一行。'}
          </Typography>
        </div>
      </section>
    </div>
    <section className="vbrl-value__definition" aria-label="动作价值定义">
      <Formula latex={String.raw`Q_\pi(s,a)=\mathbb E_\pi[G_t\mid S_t=s,A_t=a]`} />
      <Typography variant="bodySmall" tone="accent">V 评价状态；Q 进一步区分第一步动作。</Typography>
    </section>
  </ContentBlock>;
}
