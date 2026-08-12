import { Callout, ContentBlock } from '../../shared/react';
import { FactorCard } from '../components/FactorCard';
import { NeuronSignalNetwork } from '../components/NeuronSignalNetwork';
import { useNeuronLesson } from '../model/NeuronLessonContext';

export interface WeightedSumBlockProps {
  onComplete: () => void;
}

export function WeightedSumBlock({ onComplete }: WeightedSumBlockProps) {
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
      className="ng-analysis-stage ng-signal-quantization"
      title="把一个现实因素，翻译成神经元能处理的输入"
      subtitle="模型不能直接计算“表现好不好”，需要先规定衡量问题，再把回答映射到统一的数值尺度。"
    >
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
      <div className="ng-signal-quantization__result">
        <Callout
          tone="green"
          label="直觉观察"
          text="回答形成输入强度，分析建议形成连线权重；信号经过这条连线后，影响会被相应放大或缩小。"
        />
        <NeuronSignalNetwork scenario={scenario} values={state.values} count={1} />
      </div>
    </ContentBlock>
  );
}
