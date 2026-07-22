import { useState } from 'react';
import { Callout } from '../../shared/react/feedback/Callout';
import { ContentBlock } from '../../shared/react/layout/ContentBlock';
import { FormulaBlock, FormulaTerm } from '../../shared/react/learning/FormulaBlock';
import { Question } from '../../shared/react/learning/Question';
import type { LessonBlockProps } from './NumberLineBlock';

export function GradientBlock({ onComplete }: LessonBlockProps) {
  const [l1Complete, setL1Complete] = useState(false);
  const [l2Complete, setL2Complete] = useState(false);

  return (
    <ContentBlock className="lg-react-block" title="计算 L1 与 L2 的梯度" subtitle="损失告诉我们错了多少；梯度进一步告诉模型预测值应该往哪个方向改，以及需要多强的修正。">
      <Callout tone="blue" label="怎样读梯度" text="梯度的正负表示修正方向，绝对值表示当前误差产生的修正强度。训练时会沿梯度的反方向更新预测。" />
      <section className="lg-react-gradient-step"><h3>L1 Loss</h3><FormulaBlock ariaLabel="L1 梯度"><FormulaTerm tooltip="L1 绝对误差损失">∂L₁/∂ŷ</FormulaTerm> = <FormulaTerm tooltip="sign 只保留预测误差的正负号">sign(ŷ - y)</FormulaTerm></FormulaBlock><Question type="judgement" title="L1 Loss 的梯度包含误差大小信息。" options={[{ key: '对', value: 'true', label: '有，误差越大梯度绝对值越大' }, { key: '错', value: 'false', label: '没有，它只用正负号表示方向' }]} answer="false" feedback={{ correct: '正确。L1 梯度通常只有 -1 或 +1，不会保留误差大小。' }} onCheck={(result) => setL1Complete(result.ok)} /></section>
      {l1Complete && <section className="lg-react-gradient-step"><h3>L2 Loss</h3><FormulaBlock ariaLabel="L2 梯度"><FormulaTerm tooltip="L2 平方误差损失">∂L₂/∂ŷ</FormulaTerm> = <FormulaTerm tooltip="误差越大，修正强度越大">2(ŷ - y)</FormulaTerm></FormulaBlock><Question type="judgement" title="L2 Loss 的梯度包含误差大小信息。" options={[{ key: '对', value: 'true', label: '有，梯度绝对值会随误差变化' }, { key: '错', value: 'false', label: '没有，梯度绝对值始终固定' }]} answer="true" feedback={{ correct: '正确。L2 梯度既提供方向，也会随着误差大小改变修正强度。' }} onCheck={(result) => setL2Complete(result.ok)} /></section>}
      {l2Complete && <Question type="judgement" title="L1 的梯度只有方向信息，这是否意味着 L1 Loss 一定不如 L2 Loss？" options={[{ key: '对', value: 'true', label: '是，L2 永远更好' }, { key: '错', value: 'false', label: '不是，两者适合不同的误差假设' }]} answer="false" feedback={{ correct: '正确。面对离群点时，L1 不会让单个异常样本无限放大更新。' }} onCheck={(result) => { if (result.ok) onComplete(); }} />}
    </ContentBlock>
  );
}
