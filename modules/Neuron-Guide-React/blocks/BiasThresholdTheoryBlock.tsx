import { useState } from 'react';
import { Button, ContentBlock, FormulaBlock, FormulaTerm, NoticeStrip, Typography } from '../../shared/react';
import { formatScore, weightedSum } from '../model/neuronMath';
import { useNeuronLesson } from '../model/NeuronLessonContext';

export function BiasThresholdTheoryBlock() {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const { state, scenario } = useNeuronLesson();
  const score = weightedSum(scenario, state.values);
  const centeredScore = score - 1.5;
  const tendency = centeredScore >= 0 ? scenario.positiveLabel : scenario.negativeLabel;
  const decisionAction = scenario.question
    .trim()
    .replace(/[？?。！!]$/u, '')
    .replace(/^(要不要|是否要|是否)/u, '');

  return (
    <ContentBlock
      className="ng-lecture-stage ng-bias-derivation-ppt"
      title={`所以，从神经元的角度看，我们是否要${decisionAction}？`}
      subtitle="把三个输入的加权总分与判断门槛比较，得到这次决策的倾向。"
    >
      <div className="ng-bias-derivation-ppt__context">
        <div>
          <Typography variant="bodySmall" tone="warning">原来的判断规则</Typography>
          <Typography as="h3" variant="h3" tone="accent">加权总分超过 1.5，输出正向结果</Typography>
        </div>
        <Typography as="code" variant="bodySmall" tone="muted">门槛 T = 1.5</Typography>
      </div>

      <section className="ng-bias-derivation-ppt__stage" aria-live="polite">
        <Typography variant="bodySmall" tone="warning">
          {step === 0 ? '第一步：写出门槛' : step === 1 ? '第二步：把门槛移到左边' : '第三步：把常数记作偏置'}
        </Typography>

        <FormulaBlock ariaLabel="从判断门槛推导偏置">
          <FormulaTerm tooltip="三个输入的加权总分">w₁x₁ + w₂x₂ + w₃x₃</FormulaTerm>
          {step === 0 ? (
            <>{' > '}<FormulaTerm tooltip="判断门槛 T">1.5</FormulaTerm></>
          ) : step === 1 ? (
            <>{' − '}<FormulaTerm tooltip="移到左侧后，门槛变成负数">1.5</FormulaTerm>{' > 0'}</>
          ) : (
            <>{' + '}<FormulaTerm tooltip="偏置 b = −1.5">b</FormulaTerm>{' > 0'}</>
          )}
        </FormulaBlock>

        <div className="ng-bias-derivation-ppt__action">
          {step === 0 && <Button variant="primary" onClick={() => setStep(1)}>把 1.5 移到左边</Button>}
          {step === 1 && <Button variant="primary" onClick={() => setStep(2)}>把 −1.5 记作 b</Button>}
          {step === 2 && <Typography as="code" variant="bodySmall" tone="success">b = −1.5</Typography>}
        </div>
      </section>

      <div className="ng-bias-derivation-ppt__equivalence">
        <div className={step === 0 ? 'is-current' : ''}>
          <Typography variant="bodySmall" tone="muted">门槛形式</Typography>
          <Typography as="code" variant="bodySmall" tone="accent">wᵀx &gt; T</Typography>
        </div>
        <Typography variant="h3" tone="warning">⇔</Typography>
        <div className={step === 1 ? 'is-current' : ''}>
          <Typography variant="bodySmall" tone="muted">移项</Typography>
          <Typography as="code" variant="bodySmall" tone="accent">wᵀx − T &gt; 0</Typography>
        </div>
        <Typography variant="h3" tone="warning">⇔</Typography>
        <div className={step === 2 ? 'is-current' : ''}>
          <Typography variant="bodySmall" tone="muted">偏置形式</Typography>
          <Typography as="code" variant="bodySmall" tone="success">wᵀx + b &gt; 0</Typography>
        </div>
      </div>

      {step === 2 ? (
        <div className="ng-bias-derivation-ppt__result-stack">
          <NoticeStrip className="ng-bias-derivation-ppt__notice">
            <Typography as="strong" variant="bodySmall" tone="accent">偏置就是移入公式的判断门槛。</Typography>
            <Typography as="span" variant="bodySmall" tone="muted">当门槛为 T 时，b = −T；这样所有判断都可以统一与 0 比较。</Typography>
          </NoticeStrip>
          <div className="ng-bias-derivation-ppt__current-result">
            <Typography variant="bodySmall" tone="warning">当前结果</Typography>
            <Typography as="code" variant="bodySmall" tone="main">z = {formatScore(score)} + (−1.50) = {formatScore(centeredScore)}</Typography>
            <Typography variant="bodySmall" tone={centeredScore >= 0 ? 'success' : 'accent'}>更倾向于“{tendency}”</Typography>
          </div>
        </div>
      ) : (
        <div className="ng-bias-derivation-ppt__hint">
          <Typography variant="bodySmall" tone="muted">公式两边进行相同的移项，判断结果不会改变。</Typography>
        </div>
      )}
    </ContentBlock>
  );
}
