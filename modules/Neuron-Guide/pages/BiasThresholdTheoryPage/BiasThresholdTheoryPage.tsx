import { useState } from 'react';
import "./BiasThresholdTheoryPage.css";
import { Button, ContentBlock, FormulaBlock, FormulaTerm, NoticeStrip, Question, Typography } from '../../../shared/react';
import { formatScore, weightedSum } from '../../model/neuronMath';
import { useNeuronLesson } from '../../model/NeuronLessonContext';

export function BiasThresholdTheoryPage({ onComplete }: { onComplete?: () => void }) {
  const { state, scenario } = useNeuronLesson();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [thresholdRevealed, setThresholdRevealed] = useState(false);
  const score = weightedSum(scenario, state.values);
  const centeredScore = score - 1.5;
  const tendency = centeredScore >= 0 ? scenario.positiveLabel : scenario.negativeLabel;

  return <ContentBlock
    headingLevel={1}
    className="ng-bias-theory"
    title={`所以，从神经元的角度看，${scenario.question}`}
    subtitle="把三个输入的加权总分与判断门槛比较，得到这次决策的倾向。"
  >
    <div className="ng-bias-theory__question">
      <Question
        persistenceKey="neuron-threshold-v4" type="fill"
        title={`三个加权输入的总分范围是 0～3。若取中点为分界，总分大于 ____ 时，更倾向于“${scenario.positiveLabel}”。`}
        blanks={[{ label: '三个输入的倾向分界', placeholder: '填写数值' }]}
        answer="1.5"
        feedback={{ correct: `正确：3 ÷ 2 = 1.5。总分超过 1.5 时，模型更倾向于“${scenario.positiveLabel}”。`, wrong: '这里要找 0～3 的中点。把总范围 3 平分成两半，分界点是多少？' }}
        onCheck={(result) => result.ok && setThresholdRevealed(true)}
      />
    </div>
    <section className="ng-bias-theory__stage" aria-live="polite">
      <FormulaBlock ariaLabel="从判断门槛推导偏置">
        <FormulaTerm tooltip="三个输入的加权总分">w₁x₁ + w₂x₂ + w₃x₃</FormulaTerm>
        {step === 0 ? <>{' > '}<FormulaTerm tooltip={thresholdRevealed ? '判断门槛 T' : '先完成上方填空'}>{thresholdRevealed ? '1.5' : '?'}</FormulaTerm></> : step === 1 ? <>{' − '}<FormulaTerm tooltip="移到左侧后，门槛变成负数">1.5</FormulaTerm>{' > 0'}</> : <>{' + '}<FormulaTerm tooltip="偏置 b = −1.5">b</FormulaTerm>{' > 0'}</>}
      </FormulaBlock>
      <div className="ng-bias-theory__action">
        {step === 0 && <Button variant="primary" disabled={!thresholdRevealed} onClick={() => setStep(1)}>{thresholdRevealed ? '把 1.5 移到左边' : '先确定判断门槛'}</Button>}
        {step === 1 && <Button variant="primary" onClick={() => { setStep(2); onComplete?.(); }}>把 −1.5 记作 b</Button>}
        {step === 2 && <Typography as="code" variant="body" tone="success">b = −1.5</Typography>}
      </div>
    </section>
    <div className="ng-bias-theory__equivalence">
      <div className={step === 0 ? 'is-current' : ''}><Typography variant="body" tone="muted">门槛形式</Typography><Typography as="code" variant="body" tone="accent">wᵀx &gt; T</Typography></div>
      <Typography variant="h3" tone="warning">⇔</Typography>
      <div className={step === 1 ? 'is-current' : ''}><Typography variant="body" tone="muted">移项</Typography><Typography as="code" variant="body" tone="accent">wᵀx − T &gt; 0</Typography></div>
      <Typography variant="h3" tone="warning">⇔</Typography>
      <div className={step === 2 ? 'is-current' : ''}><Typography variant="body" tone="muted">偏置形式</Typography><Typography as="code" variant="body" tone="success">wᵀx + b &gt; 0</Typography></div>
    </div>
    {step === 2 ? <div className="ng-bias-theory__result-stack">
      <NoticeStrip className="ng-bias-theory__notice"><Typography as="strong" variant="body" tone="accent">偏置就是移入公式的判断门槛。</Typography><Typography as="span" variant="body" tone="muted">当门槛为 T 时，b = −T；这样所有判断都可以统一与 0 比较。</Typography></NoticeStrip>
      <div className="ng-bias-theory__current-result"><Typography variant="body" tone="warning">当前结果</Typography><Typography as="code" variant="body" tone="main">z = {formatScore(score)} + (−1.50) = {formatScore(centeredScore)}</Typography><Typography variant="body" tone={centeredScore >= 0 ? 'success' : 'accent'}>更倾向于“{tendency}”</Typography></div>
    </div> : <div className="ng-bias-theory__hint"><Typography variant="body" tone="muted">公式两边进行相同的移项，判断结果不会改变。</Typography></div>}
  </ContentBlock>;
}




