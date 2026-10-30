import { valueBasedRlAssetUrl } from '../../assetUrls';
import { Typography } from '../../../shared/react';
import { LessonPage, Formula } from '../../components/LessonPrimitives';
import { TeachingPanel } from '../../components/TeachingPanel';
import './BellmanPage.css';

const robotArt = valueBasedRlAssetUrl('cover-v2/robot.png');

function FlowArrow({ down = false }: { down?: boolean }) {
  return <svg className={'vbrl-bellman-theory__arrow' + (down ? ' is-down' : '')} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2 9H14V2L24 12L14 22V15H2Z" transform={down ? 'rotate(90 12 12)' : undefined} />
  </svg>;
}

export function BellmanPage() {
  return <LessonPage className="vbrl-foundation-page vbrl-bellman-theory-page" title="Bellman：从回报分解到 Q 表更新"
    subtitle="Bellman 关系把长期价值拆成即时奖励与折扣后的后续价值，为估值更新提供目标。"
    footer={<div className="vbrl-bellman-theory__footer">
      <Typography variant="bodySmall" tone="accent">用一步估计未来，再让当前 Q 值向这个目标靠近。</Typography>
      <div><Typography variant="bodySmall" tone="accent">终止时</Typography><Formula latex="y=r" /><Typography variant="bodySmall" tone="muted">后续价值为 0。</Typography></div>
    </div>}>
    <div className="vbrl-bellman-theory">
      <TeachingPanel title="1 · 回报的一步分解" className="vbrl-bellman-theory__return">
        <Typography variant="bodySmall" tone="muted">从当前时刻开始，累计未来奖励。</Typography>
        <div className="vbrl-bellman-theory__expanded" data-equation="return-expanded">
          <Formula latex={String.raw`G_t=r_{t+1}+\gamma r_{t+2}+\gamma^2r_{t+3}+\cdots`} />
        </div>
        <div className="vbrl-bellman-theory__extract"><FlowArrow down /><Typography variant="bodySmall" tone="accent">把第一项单独拿出来</Typography></div>
        <div className="vbrl-bellman-theory__decomposed" data-equation="return-decomposed">
          <Formula latex={String.raw`G_t=r_{t+1}+\gamma G_{t+1}`} />
        </div>
        <div className="vbrl-bellman-theory__terms">
          <div><Formula latex={String.raw`r_{t+1}`} /><Typography variant="bodySmall" tone="accent">这一步的奖励</Typography></div>
          <div><Formula latex={String.raw`\gamma G_{t+1}`} /><Typography variant="bodySmall" tone="success">剩余回报<br />再折扣一次</Typography></div>
        </div>
      </TeachingPanel>
      <div className="vbrl-bellman-theory__right">
        <TeachingPanel title="2 · 最优动作价值的 Bellman 关系" className="vbrl-bellman-theory__optimal">
          <div className="vbrl-bellman-theory__flow" aria-label="当前状态执行动作，收到奖励与下一状态，之后选择最优动作">
            <div><img src={robotArt} alt="当前状态的机器人" /><Typography variant="bodySmall" tone="accent">状态</Typography><Formula latex="s" /></div>
            <FlowArrow /><div><Typography variant="bodySmall" tone="accent">动作</Typography><Formula latex="a" /></div>
            <FlowArrow /><div><Typography variant="bodySmall" tone="accent">返回</Typography><Formula latex={String.raw`r,\;s'`} /></div>
            <FlowArrow /><div><img src={robotArt} alt="下一状态的机器人" /><Typography variant="bodySmall" tone="accent">之后选最优动作</Typography></div>
          </div>
          <div className="vbrl-bellman-theory__relation" data-equation="optimal-expectation">
            <Typography variant="bodySmall" tone="accent">最优 Q 值：对可能的奖励与下一状态取平均</Typography>
            <Formula latex={String.raw`Q^*(s,a)=\mathbb E\!\left[r+\gamma\max_{a'}Q^*(s',a')\mid s,a\right]`} />
          </div>
          <div className="vbrl-bellman-theory__deterministic" data-equation="optimal-deterministic">
            <Typography variant="bodySmall" tone="success">本课中，转移与奖励确定，期望简化为一个结果。</Typography>
            <Formula latex={String.raw`Q^*(s,a)=r+\gamma\max_{a'}Q^*(s',a')`} />
          </div>
        </TeachingPanel>
        <TeachingPanel title="3 · 用当前 Q 构造目标，修正表项" className="vbrl-bellman-theory__update">
          <div className="vbrl-bellman-theory__target" data-equation="learning-target">
            <Typography variant="bodySmall" tone="success">构造目标</Typography>
            <Formula latex={String.raw`y=r+\gamma\max_{a'}Q(s',a')`} />
            <Typography variant="bodySmall" tone="muted">用当前 Q 估计未来</Typography>
          </div>
          <div className="vbrl-bellman-theory__writeback" data-equation="q-update">
            <Typography variant="bodySmall" tone="warning">修正表项</Typography>
            <Formula latex={String.raw`Q(s,a)\leftarrow Q(s,a)+\alpha\bigl[y-Q(s,a)\bigr]`} />
          </div>
        </TeachingPanel>
      </div>
    </div>
  </LessonPage>;
}
