import { useState } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
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
  return <ContentBlock shuku-edit-id="e-11ab57be-22b3-4715-bfce-49d57833b567" className="vbrl-value vbrl-q-value" title="动作价值：先走哪一步，未来更好？"
    subtitle="动作价值是在某个状态先执行一个动作，再遵循给定策略时的期望回报。" headingLevel={1}>
    <div shuku-edit-id="e-983e0e75-e99c-4342-b175-68ba85ad797a" className="vbrl-value__comparison" ref={node => { groups.forEach(group => { group.rootRef.current = node; }); }}
      data-action={action} data-cursor={selected.cursor} data-playing={selected.playing} data-pending={selected.pending}>
      <section shuku-edit-id="e-a7fea10c-6841-4fa8-ae92-0e92c88d2033" className="vbrl-experience-panel" aria-label="指定第一步并实际送货">
        <header shuku-edit-id="e-20870072-0800-4094-a2d0-54d78f97fe6e" className="vbrl-experience-panel__head"><Typography shuku-edit-id="e-b148dcab-5091-4b3e-b274-c86026d3a2bf" as="h2" variant="h3" tone="inherit">只改变第一步</Typography>
          <div shuku-edit-id="e-81c0aa1f-a650-43fc-a64a-c69ea18d9d25" className="vbrl-value__sampling"><Formula latex={String.raw`s \to a \to \pi_{\mathrm{safe}}`} />
            <Button variant="primary" disabled={selected.pending && selected.record} onClick={() => selected.addBatch()}>{selected.samples.length ? '再采样 10 次' : '采样 10 次'}</Button>
          </div></header>
        <div shuku-edit-id="e-c1757021-bb1a-4fad-ad68-2e3381510076" className="vbrl-experience-panel__body">
          <div shuku-edit-id="e-6dc03d0e-be6c-4207-829b-6096cf7d9c2e" className="vbrl-experience-panel__scene">
            <ExperienceMap experience={selected.active} cursor={selected.cursor} firstStep />
            <div shuku-edit-id="e-b78c25e4-342e-4785-b9a1-9edcfc4d6328" className="vbrl-q-value__choice">
              <Typography shuku-edit-id="e-efa63280-871e-45c7-8c16-488a46f87c58" variant="bodySmall" tone="warning">① 第一步由你选择</Typography>
              <div shuku-edit-id="e-6dcfeffb-ea02-4b5b-8e04-76911dffce78" className="vbrl-q-value__actions" role="group" aria-label="选择第一步动作">
                {ACTIONS.map((label, index) => <Button key={label} active={index === action} aria-pressed={index === action} onClick={() => choose(index)}>{label}</Button>)}
              </div>
              <Typography shuku-edit-id="e-9daa19ab-24ab-4a41-b4d4-1262b046d2e8" variant="bodySmall" tone="accent">② 后续策略保持相同</Typography>
              <Typography shuku-edit-id="e-89e78bbf-992e-4732-bde4-432991c7e8b7" variant="bodySmall" tone="muted">80% 朝终点方向走<br shuku-edit-id="e-c36edb34-b1c6-4782-8866-14da8377e2eb" />20% 在安全方向中随机</Typography>
              <Typography shuku-edit-id="e-965c888b-abef-4ee6-b460-92316aba7616" variant="bodySmall" tone="warning">橙色：指定的第一步</Typography>
              <Typography shuku-edit-id="e-58494071-c723-48bd-9892-d718a82478ec" variant="bodySmall" tone="success">绿色：后续实际经历</Typography>
            </div>
          </div>
        </div>
      </section>
      <section shuku-edit-id="e-37e54d32-bae6-4479-a18b-c02deae369ff" className="vbrl-experience-panel" aria-label="四个第一步动作的样本与均值">
        <header shuku-edit-id="e-e113d306-bc5f-4357-b1a7-72ac46d8a721" className="vbrl-experience-panel__head">
          <Typography shuku-edit-id="e-c9b88d67-86a3-4ef8-b61d-f51582387329" as="h2" variant="h3" tone="inherit">四个动作的 Q 值</Typography>
          <Button disabled={pending} onClick={() => groups.forEach(group => group.addBatch())}>各采样 10 次</Button>
        </header>
        <div shuku-edit-id="e-0bcd4a75-6885-4af7-9bd9-282273bbe524" className="vbrl-q-value__results">
          <table shuku-edit-id="e-59b87488-a888-4e0d-9263-91695c8ceb2e" className="vbrl-q-value__table" aria-label="同一后续策略下四个动作的估计价值">
            <thead shuku-edit-id="e-1b178684-7530-4291-962d-08eaadcc439d"><tr shuku-edit-id="e-462531a9-af18-4a2d-afd6-184dff2ad32a">{['第一步', '样本数', '平均回报'].map(label => <th shuku-edit-id="e-ec00fc28-14e8-435d-a8d3-11392491439d" key={label} scope="col"><Typography shuku-edit-id="e-7e603d65-d501-4668-9bb7-924216726b39" variant="bodySmall" tone="muted">{label}</Typography></th>)}</tr></thead>
            <tbody shuku-edit-id="e-1bb17972-4c0f-4174-a93d-6bf40422a659">{groups.map((group, index) => {
              const mean = experienceMean(group.samples);
              return <tr shuku-edit-id="e-90ed3cc4-c9c3-4ea3-b9bc-2e5036c38028" key={index} className={index === action ? 'is-selected' : undefined} data-action-row={index} data-count={group.samples.length} data-mean={mean}>
                <th shuku-edit-id="e-247e20a0-999a-4706-8bd0-47c9768fdc3a" scope="row"><Button aria-pressed={index === action} active={index === action} onClick={() => choose(index)}>{ACTIONS[index]}</Button></th>
                <td shuku-edit-id="e-f017aa27-8145-415d-95c2-cc64a658fd16"><Typography shuku-edit-id="e-1c4966b8-ca0d-4c48-8b8b-a20def8c2c58" variant="bodySmall" tone="muted">{group.samples.length}</Typography></td>
                <td shuku-edit-id="e-dd91130e-94a0-4948-9395-22fb973ba786"><Typography shuku-edit-id="e-0e2975a7-2693-4a1f-aec5-eb2f14d5ed07" variant="bodySmall" tone={index === action ? 'warning' : 'accent'}>{mean === undefined ? '—' : displayReturn(mean)}</Typography></td>
              </tr>;
            })}</tbody>
          </table>
          <ReturnDistribution samples={selected.samples} active={selected.active} disabled={selected.pending && selected.record} onSelect={selected.replay} />
          <Typography shuku-edit-id="e-3e261f5a-c3e4-4c1f-8853-e6d267fa3110" variant="bodySmall" tone="accent" role="status">
            {selected.samples.length ? '当前样本都以' + ACTIONS[action] + '开始，再按相同策略继续。' : '选择第一步并采样，结果加入对应动作的一行。'}
          </Typography>
        </div>
      </section>
    </div>
    <section shuku-edit-id="e-55587f9b-0fa2-45e2-878d-335e06ac355c" className="vbrl-value__definition" aria-label="动作价值定义">
      <Formula latex={String.raw`Q_\pi(s,a)=\mathbb E_\pi[G_t\mid S_t=s,A_t=a]`} />
      <Typography shuku-edit-id="e-7834b046-44c6-4311-9213-1591bdb55e79" variant="bodySmall" tone="accent">V 评价状态；Q 进一步区分第一步动作。</Typography>
    </section>
  </ContentBlock>;
}
