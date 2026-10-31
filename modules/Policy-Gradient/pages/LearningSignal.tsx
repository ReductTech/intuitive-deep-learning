import { MathFormulaBlock, MathFormulaStatic, MathFormulaTerm } from '../../shared/react';
import { Page, T } from '../components/LessonVisuals';
import { MazeBoard } from '../components/ReinforceMaze';
import { GOAL } from '../mazeModel';
import { DEMO_PATH } from '../neuralPolicy';
import './learningSignal.css';

export function LearningSignal() {
  return (
    <Page
      title="这次选择，怎样影响权重？"
      subtitle="回报给评价，梯度给方向。"
      takeaway="用回报为方向加权，再把各步贡献相加。"
    >
      <div className="pg-signal-layout">
        <div className="pg-signal-scene">
          <div className="pg-tr-board"><MazeBoard position={GOAL} steps={DEMO_PATH} focus={1} fox showPath /></div>
          <T tone="warning">第 2 步：向右</T>
        </div>
        <div className="pg-signal-math">
          <div className="pg-signal-product">
            <div className="pg-signal-return">
              <T tone="warning">回报</T>
              <MathFormulaBlock appearance="plain" ariaLabel="第二步之后的实际回报等于6">
                <MathFormulaTerm className="pg-signal-warm" latex={String.raw`G_1=10-4=6`} tooltip="从第 2 步起，四次普通移动各扣 1 分，再送达得 10 分。" tooltipPlacement="top" />
              </MathFormulaBlock>
            </div>
            <div className="pg-signal-times"><T tone="muted">×</T></div>
            <div className="pg-signal-direction">
              <T tone="accent">梯度方向</T>
              <MathFormulaBlock appearance="plain" ariaLabel="所选向右动作的对数概率梯度">
                <MathFormulaTerm latex={String.raw`\nabla_\theta\log\pi_\theta(a_1\mid s_1)`} tooltip="让这个位置的向右动作更常出现的权重调整方向。" tooltipPlacement="top" />
              </MathFormulaBlock>
            </div>
          </div>
          <div className="pg-signal-total">
            <T tone="accent">整局贡献相加</T>
            <MathFormulaBlock appearance="plain" ariaLabel="各步回报加权梯度相加，得到整局梯度估计">
              <div className="pg-signal-sum">
                <MathFormulaStatic latex={String.raw`\widehat g=\sum_t`} />
                <MathFormulaTerm className="pg-signal-warm" latex={String.raw`G_t`} tooltip="第 t 步起的实际回报：对应上面的橙色回报。" tooltipPlacement="top" />
                <MathFormulaTerm latex={String.raw`\nabla_\theta\log\pi_\theta(a_t\mid s_t)`} tooltip="第 t 步所选动作的梯度方向：对应上面的蓝色项。" tooltipPlacement="top" />
              </div>
            </MathFormulaBlock>
          </div>
        </div>
      </div>
    </Page>
  );
}
