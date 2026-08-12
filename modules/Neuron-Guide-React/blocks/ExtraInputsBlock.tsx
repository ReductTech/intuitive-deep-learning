import { Callout, ContentBlock, Question } from '../../shared/react';
import { FactorCard } from '../components/FactorCard';
import { NeuronSignalNetwork } from '../components/NeuronSignalNetwork';
import { useNeuronLesson } from '../model/NeuronLessonContext';

export interface ExtraInputsBlockProps {
  onComplete: () => void;
}

export function ExtraInputsBlock({ onComplete }: ExtraInputsBlockProps) {
  const {
    state,
    scenario,
    hydrated,
    setValueDraft,
    commitValues,
    markThresholdPassed,
  } = useNeuronLesson();
  return (
    <ContentBlock
      className="ng-multi-stage ng-extra-inputs-stage"
      title="同一个决定，三个输入怎样形成最终判断？"
      subtitle="补充另外两个输入，观察三个加权信号如何汇总成分数，并通过判断门槛形成最终倾向。"
    >
      <div className="ng-extra-factor-grid">
        {scenario.factors.slice(1).map((factor, offset) => {
          const index = offset + 1;
          return (
            <FactorCard
              factor={factor}
              index={index}
              value={state.values[index]}
              touched={state.touched[index]}
              disabled={!hydrated}
              key={factor.name}
              onValueChange={(value) => {
                setValueDraft(index, value);
              }}
              onValueCommit={commitValues}
            />
          );
        })}
      </div>

      <div className="ng-theory-panel">
        <Callout
          tone="green"
          label="三个输入汇总"
          text="每个输入先与自己的权重相乘，三个单项结果再相加，形成用于判断的加权总分。"
        />
        <NeuronSignalNetwork scenario={scenario} values={state.values} />
        <div className="ng-question-wrap">
          <Question
            persistenceKey="neuron-multi-threshold-v2"
            type="fill"
            title={`三个加权输入的总分范围是 0～3。若取中点为分界，总分大于 ____ 时，更倾向于“${scenario.positiveLabel}”。`}
            blanks={[{ label: '三个输入的倾向分界', placeholder: '填写数值' }]}
            answer="1.5"
            feedback={{
              correct: `正确：3 ÷ 2 = 1.5。总分超过 1.5 时，模型更倾向于“${scenario.positiveLabel}”。`,
              wrong: '这里要找 0～3 的中点。把总范围 3 平分成两半，分界点是多少？',
            }}
            onCheck={(result) => {
              if (!result.ok) return;
              markThresholdPassed();
              onComplete();
            }}
          />
        </div>
      </div>
    </ContentBlock>
  );
}
