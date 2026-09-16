import { useRef, useState } from 'react';
import { ContentBlock } from '../../shared/react';
import { LinearChoiceBlock } from './LinearChoiceBlocks';

export function LinearRecognitionBlock({ onComplete = () => undefined }: { onComplete?: () => void }) {
  const completedRef = useRef([false, false]);
  const didCompleteRef = useRef(false);
  const [completed, setCompleted] = useState([false, false]);
  const completeQuestion = (index: number) => {
    completedRef.current[index] = true;
    setCompleted([...completedRef.current]);
    if (completedRef.current.every(Boolean) && !didCompleteRef.current) {
      didCompleteRef.current = true;
      onComplete();
    }
  };
  return <ContentBlock className="bm-linear-recognition" title="认识线性" subtitle="刚才的人工神经元先完成加权求和。接下来先判断：什么样的关系可以称为线性？">
    <div className="bm-linear-recognition__questions">
      <div className={completed[0] ? 'is-complete' : ''}><LinearChoiceBlock dimension="2d" onComplete={() => completeQuestion(0)} /></div>
      <div className={completed[1] ? 'is-complete' : ''}><LinearChoiceBlock dimension="3d" onComplete={() => completeQuestion(1)} /></div>
    </div>
  </ContentBlock>;
}
