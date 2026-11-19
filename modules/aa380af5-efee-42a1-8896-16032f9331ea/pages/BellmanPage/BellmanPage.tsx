import { valueBasedRlAssetUrl } from '../../assetUrls';
import { Typography } from "@shuku/course-style/react";
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import './BellmanPage.css';

const robotArt = valueBasedRlAssetUrl("cover-v2/robot.webp");

function FlowArrow({ down = false }: { down?: boolean }) {
  return <svg shuku-edit-id="e-36339cfb-8f4c-453b-b4af-c20624a577f6" className={'vbrl-bellman-theory__arrow' + (down ? ' is-down' : '')} viewBox="0 0 24 24" aria-hidden="true">
    <path shuku-edit-id="e-299e9cc1-207e-4daa-9bf6-6fae6e0792f1" d="M2 9H14V2L24 12L14 22V15H2Z" transform={down ? 'rotate(90 12 12)' : undefined} />
  </svg>;
}

export function BellmanPage() {
  return <LessonPage className="vbrl-foundation-page vbrl-bellman-theory-page" title="Bellman：从回报分解到 Q 表更新"
    subtitle="Bellman 关系把长期价值拆成即时奖励与折扣后的后续价值，为估值更新提供目标。"
    footer={<div shuku-edit-id="e-7ece7138-ea7b-4877-af26-3943815372c7" className="vbrl-bellman-theory__footer">
      <Typography shuku-edit-id="e-9e00d1ee-e13d-4681-b334-f39ae39f4725" variant="bodySmall" tone="accent">用一步估计未来，再让当前 Q 值向这个目标靠近。</Typography>
      <div shuku-edit-id="e-0a7dd25f-311d-4674-8b38-e7634bcf4bcf"><Typography shuku-edit-id="e-09043324-9718-497d-a418-7d880050dfb8" variant="bodySmall" tone="accent">终止时</Typography><Formula latex="y=r" /><Typography shuku-edit-id="e-23b6f206-f811-4269-9445-69288a42d543" variant="bodySmall" tone="muted">后续价值为 0。</Typography></div>
    </div>}>
    <div shuku-edit-id="e-7745ce47-b524-4529-b722-7c1deaab1201" className="vbrl-bellman-theory">
      <TeachingPanel title="1 · 回报的一步分解" className="vbrl-bellman-theory__return">
        <Typography shuku-edit-id="e-3ce34ddf-27fe-4229-9d6e-e7947220c604" variant="bodySmall" tone="muted">从当前时刻开始，累计未来奖励。</Typography>
        <div shuku-edit-id="e-feb9538e-e5f5-4706-b01d-e9671f47d341" className="vbrl-bellman-theory__expanded" data-equation="return-expanded">
          <Formula latex={String.raw`G_t=r_{t+1}+\gamma r_{t+2}+\gamma^2r_{t+3}+\cdots`} />
        </div>
        <div shuku-edit-id="e-8117ee64-8045-4aa0-b8f0-21a0d18e3caa" className="vbrl-bellman-theory__extract"><FlowArrow down /><Typography shuku-edit-id="e-972f2b55-6b2d-4d35-b2d0-b4d489338419" variant="bodySmall" tone="accent">把第一项单独拿出来</Typography></div>
        <div shuku-edit-id="e-a68141c8-1e60-425e-8054-8a5307cacaac" className="vbrl-bellman-theory__decomposed" data-equation="return-decomposed">
          <Formula latex={String.raw`G_t=r_{t+1}+\gamma G_{t+1}`} />
        </div>
        <div shuku-edit-id="e-a93826de-9bfd-4c63-b4c3-acef32102912" className="vbrl-bellman-theory__terms">
          <div shuku-edit-id="e-2623f7b6-ffa9-48f4-909a-6e4a24caff48"><Formula latex={String.raw`r_{t+1}`} /><Typography shuku-edit-id="e-218c7f9b-1734-40ff-9b92-c3815288133d" variant="bodySmall" tone="accent">这一步的奖励</Typography></div>
          <div shuku-edit-id="e-ebdafce9-6442-4a9d-8100-c4bbbf2c6ab2"><Formula latex={String.raw`\gamma G_{t+1}`} /><Typography shuku-edit-id="e-0ea682bf-77f0-4477-bf9e-06de0d9772f4" variant="bodySmall" tone="success">剩余回报<br shuku-edit-id="e-b5e9dcad-0a8b-4cac-93ac-b6b5bb5f8ee8" />再折扣一次</Typography></div>
        </div>
      </TeachingPanel>
      <div shuku-edit-id="e-bc3e77bf-b40d-45b8-aff2-ed08e7347aac" className="vbrl-bellman-theory__right">
        <TeachingPanel title="2 · 最优动作价值的 Bellman 关系" className="vbrl-bellman-theory__optimal">
          <div shuku-edit-id="e-8c96a700-8cdd-413e-8239-0fb4c45b6203" className="vbrl-bellman-theory__flow" aria-label="当前状态执行动作，收到奖励与下一状态，之后选择最优动作">
            <div shuku-edit-id="e-1002b67e-7e48-4985-9bc0-d6832cdb1458"><img shuku-edit-id="e-c76da3e0-4d22-40d3-ac93-50df4f30cf7f" src={robotArt} alt="当前状态的机器人" /><Typography shuku-edit-id="e-ac72ed31-add6-4f83-97a1-b2c13fc79a25" variant="bodySmall" tone="accent">状态</Typography><Formula latex="s" /></div>
            <FlowArrow /><div shuku-edit-id="e-00664027-3c2c-4358-bc2a-59633dff23e1"><Typography shuku-edit-id="e-eded06b4-2568-4e34-9618-2730ae7ab59a" variant="bodySmall" tone="accent">动作</Typography><Formula latex="a" /></div>
            <FlowArrow /><div shuku-edit-id="e-b293c50a-f057-4c1c-8de8-0decf35689bf"><Typography shuku-edit-id="e-3ecacae9-8842-4e56-852d-59064d6d4871" variant="bodySmall" tone="accent">返回</Typography><Formula latex={String.raw`r,\;s'`} /></div>
            <FlowArrow /><div shuku-edit-id="e-0b85d872-9414-4e02-ae6b-94f1b30a422d"><img shuku-edit-id="e-2dac5dd4-1a53-4ccc-b6e2-5a3f3db9a46d" src={robotArt} alt="下一状态的机器人" /><Typography shuku-edit-id="e-77c8e787-08e8-435a-b647-b502f96b0451" variant="bodySmall" tone="accent">之后选最优动作</Typography></div>
          </div>
          <div shuku-edit-id="e-ab3c365a-62df-4f9c-a795-7d3243ba9880" className="vbrl-bellman-theory__relation" data-equation="optimal-expectation">
            <Typography shuku-edit-id="e-6429fc6e-fde3-4f4c-814e-dc1d972c2745" variant="bodySmall" tone="accent">最优 Q 值：对可能的奖励与下一状态取平均</Typography>
            <Formula latex={String.raw`Q^*(s,a)=\mathbb E\!\left[r+\gamma\max_{a'}Q^*(s',a')\mid s,a\right]`} />
          </div>
          <div shuku-edit-id="e-a6d61eba-db56-4b17-9859-1fff1875a815" className="vbrl-bellman-theory__deterministic" data-equation="optimal-deterministic">
            <Typography shuku-edit-id="e-2257e675-c75f-4e3d-a0cb-bd5b5e7f4ac2" variant="bodySmall" tone="success">本课中，转移与奖励确定，期望简化为一个结果。</Typography>
            <Formula latex={String.raw`Q^*(s,a)=r+\gamma\max_{a'}Q^*(s',a')`} />
          </div>
        </TeachingPanel>
        <TeachingPanel title="3 · 用当前 Q 构造目标，修正表项" className="vbrl-bellman-theory__update">
          <div shuku-edit-id="e-afdd57d8-0b00-4154-905d-db8ab9589f0f" className="vbrl-bellman-theory__target" data-equation="learning-target">
            <Typography shuku-edit-id="e-1377d7a4-9a7d-45e7-8e56-b12883baf2ed" variant="bodySmall" tone="success">构造目标</Typography>
            <Formula latex={String.raw`y=r+\gamma\max_{a'}Q(s',a')`} />
            <Typography shuku-edit-id="e-cd10c227-3278-40d6-832d-238e6558d201" variant="bodySmall" tone="muted">用当前 Q 估计未来</Typography>
          </div>
          <div shuku-edit-id="e-4465a7c4-8c2f-4540-b251-a68d5d7f840f" className="vbrl-bellman-theory__writeback" data-equation="q-update">
            <Typography shuku-edit-id="e-2eaa78c2-1d5c-4004-a4a9-fa407771d914" variant="bodySmall" tone="warning">修正表项</Typography>
            <Formula latex={String.raw`Q(s,a)\leftarrow Q(s,a)+\alpha\bigl[y-Q(s,a)\bigr]`} />
          </div>
        </TeachingPanel>
      </div>
    </div>
  </LessonPage>;
}
