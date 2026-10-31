import { MathFormulaBlock, MathFormulaStatic } from '../../shared/react';
import { Page, T, H, F } from '../components/LessonVisuals';
import './focusedTheory.css';

export function GradientAscentLesson() {
  return (
    <Page
      title="目标确定了，网络权重怎样改？"
      subtitle="调整网络权重，让期望得分提高。"
      takeaway="最大化回报：沿梯度方向，迈一小步。"
    >
      <div className="pg-ga-layout">
        <div className="pg-ga-chain">
          <div className="pg-ga-node"><H>改权重</H><F latex={String.raw`\theta`} /></div>
          <div className="pg-ga-connector" aria-hidden="true"><T tone="accent">↓</T></div>
          <div className="pg-ga-node"><H>改变选择</H><F latex={String.raw`\pi_\theta(a\mid s)`} /></div>
          <div className="pg-ga-connector" aria-hidden="true"><T tone="accent">↓</T></div>
          <div className="pg-ga-node"><H>改变平均得分</H><F latex={String.raw`J(\theta)`} /></div>
        </div>
        <div className="pg-ga-update">
          <H>梯度上升</H>
          <MathFormulaBlock appearance="plain" ariaLabel="梯度上升，学习率控制步长，梯度给出方向">
            <div className="pg-ga-expression">
              <div className="pg-ga-prefix"><MathFormulaStatic latex={String.raw`\theta_{\mathrm{new}}=\theta+`} /></div>
              <div className="pg-ga-factor pg-ga-rate">
                <MathFormulaStatic latex={String.raw`\alpha`} />
                <i aria-hidden="true" />
                <div className="pg-ga-factor-label"><T tone="warning">学习率</T><T tone="warning">改多少</T></div>
              </div>
              <div className="pg-ga-factor pg-ga-gradient">
                <MathFormulaStatic latex={String.raw`\nabla_\theta J(\theta)`} />
                <i aria-hidden="true" />
                <div className="pg-ga-factor-label"><T tone="accent">梯度</T><T tone="accent">往哪边改</T></div>
              </div>
            </div>
          </MathFormulaBlock>
        </div>
      </div>
    </Page>
  );
}
