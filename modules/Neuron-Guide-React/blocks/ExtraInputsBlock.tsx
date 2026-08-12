import { Callout, ContentBlock } from '../../shared/react';
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
  } = useNeuronLesson();
  return (
    <ContentBlock
      className="ng-multi-stage ng-extra-inputs-stage"
      title="从一个因素，到三个因素"
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
              onValueCommit={() => {
                commitValues();
                onComplete();
              }}
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
      </div>
    </ContentBlock>
  );
}
