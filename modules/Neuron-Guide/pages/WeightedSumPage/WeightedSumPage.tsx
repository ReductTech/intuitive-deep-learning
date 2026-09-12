import { Callout, ContentBlock } from '../../../shared/react';
import "./WeightedSumPage.css";
import { FactorCard } from '../../components/FactorCard';
import { NeuronSignalNetwork } from '../../components/NeuronSignalNetwork';
import { useNeuronLesson } from '../../model/NeuronLessonContext';

export interface WeightedSumPageProps {
  onComplete: () => void;
}

export function WeightedSumPage({ onComplete }: WeightedSumPageProps) {
  const {
    state,
    scenario,
    hydrated,
    setValueDraft,
    commitValues,
  } = useNeuronLesson();
  const factor = scenario.factors[0];

  return (
    <ContentBlock
      headingLevel={1}
      className="ng-analysis-stage ng-signal-quantization"
      title="把一个现实因素，翻译成神经元能处理的输入"
      subtitle="模型不能直接计算“表现好不好”，需要先规定衡量问题，再把回答映射到统一的数值尺度。"
    >
      <div className="ng-signal-quantization__hero">
        <NeuronSignalNetwork scenario={scenario} values={state.values} count={1} />
      </div>
      <div className="ng-signal-quantization__input">
        <FactorCard
          factor={factor}
          index={0}
          value={state.values[0]}
          touched={state.touched[0]}
          disabled={!hydrated}
          onValueChange={(value) => {
            setValueDraft(0, value);
            onComplete();
          }}
          onValueCommit={commitValues}
        />
        <Callout tone="green" label="直觉观察" text="你的回答先变成输入强度，再沿着带有权重的连线传递；权重越大，这个因素对最终判断的影响越明显。" />
      </div>
    </ContentBlock>
  );
}




