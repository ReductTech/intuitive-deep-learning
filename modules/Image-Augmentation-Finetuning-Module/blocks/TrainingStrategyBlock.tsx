import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Feedback, NoticeStrip, Select, emitTelemetry, getTelemetryState } from '../../shared/react';

type Strategy = '' | 'freeze' | 'finetune' | 'scratch';
type ScenarioId = 'recycling' | 'dog' | 'spectral';
type Answers = Record<ScenarioId, Strategy>;

interface TrainingStrategyBlockProps {
  onComplete?: () => void;
}

interface StrategyState {
  answers?: Partial<Answers>;
  correct?: boolean;
}

const stateKey = 'exercise:vision-training-strategy-v1';
const initialAnswers: Answers = { recycling: '', dog: '', spectral: '' };
const correctAnswers: Answers = { recycling: 'freeze', dog: 'finetune', spectral: 'scratch' };
const strategyOptions = [
  { value: '', label: '选择训练策略', disabled: true },
  { value: 'freeze', label: '冻结骨干，只训练新分类头' },
  { value: 'finetune', label: '替换分类头，并小学习率微调骨干' },
  { value: 'scratch', label: '从零训练或寻找同领域预训练模型' },
];

const scenarios: Array<{
  id: ScenarioId;
  title: string;
  description: string;
  signals: string[];
  rationale: string;
}> = [
  {
    id: 'recycling',
    title: '校园回收物四分类',
    description: '只有 300 张手机照片，类别是瓶子、纸杯、纸盒和易拉罐；可用 ImageNet 预训练模型。',
    signals: ['数据很少', '自然 RGB 图像', '物体与 ImageNet 相近'],
    rationale: '数据极少且领域相近，先把预训练骨干当稳定特征提取器，只训练新分类头，过拟合风险更低。',
  },
  {
    id: 'dog',
    title: '犬种识别',
    description: '有 8000 张标注照片，需要区分 20 个外观接近的犬种；可用 ImageNet 预训练模型。',
    signals: ['中等数据量', '领域相近', '需要细粒度差异'],
    rationale: '通用特征有用，但细粒度犬种需要调整高层表示；替换分类头后用更小学习率微调骨干。',
  },
  {
    id: 'spectral',
    title: '八通道遥感地块分类',
    description: '有 15 万张八通道多光谱图像，而现有预训练模型只接收三通道自然照片。',
    signals: ['数据充足', '输入通道不同', '领域差异很大'],
    rationale: '输入和领域都显著不同，RGB 自然图像特征不能直接照搬；应从零训练或优先寻找遥感领域预训练模型。',
  },
];

export function TrainingStrategyBlock({ onComplete }: TrainingStrategyBlockProps) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [attempted, setAttempted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);
  const allAnswered = Object.values(answers).every(Boolean);
  const incorrectIds = scenarios.filter(({ id }) => answers[id] !== correctAnswers[id]).map(({ id }) => id);

  useEffect(() => {
    let active = true;
    void getTelemetryState<StrategyState>(stateKey).then((entry) => {
      if (!active) return;
      if (entry?.state?.answers) setAnswers({ ...initialAnswers, ...entry.state.answers });
      if (entry?.state?.correct) {
        setCompleted(true);
        setAttempted(true);
        completedRef.current = true;
      }
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  function choose(id: ScenarioId, strategy: Strategy) {
    setAnswers((current) => ({ ...current, [id]: strategy }));
    setAttempted(false);
    setCompleted(false);
  }

  function checkStrategies() {
    if (!hydrated || !allAnswered) return;
    const correct = incorrectIds.length === 0;
    setAttempted(true);
    setCompleted(correct);
    emitTelemetry('strategy_transfer_submit', rootRef.current, {
      state_key: stateKey,
      state: { answers, correct },
      correct,
      incorrect_ids: incorrectIds,
    });
    if (correct && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }

  return (
    <ContentBlock
      className="vgen-block vgen-strategy-block"
      title="什么时候冻结、微调，什么时候从零训练？"
      subtitle="数据量决定能承受多大的参数更新，领域差异决定预训练特征能复用多少。请把两条线索一起用于判断。"
    >
      <NoticeStrip tone="blue" lead="判断顺序：">先比较新数据与预训练数据是否相似，再看标注数据是否足以支持更多参数更新。</NoticeStrip>
      <div className="vgen-scenario-list" ref={rootRef}>
        {scenarios.map((scenario, index) => {
          const isWrong = attempted && answers[scenario.id] !== correctAnswers[scenario.id];
          const isCorrect = attempted && answers[scenario.id] === correctAnswers[scenario.id];
          return (
            <article className={isWrong ? 'is-wrong' : isCorrect ? 'is-correct' : undefined} key={scenario.id}>
              <div className="vgen-scenario-index" aria-hidden="true">{index + 1}</div>
              <div className="vgen-scenario-copy">
                <h3>{scenario.title}</h3>
                <p>{scenario.description}</p>
                <div className="vgen-scenario-signals" aria-label="判断线索">
                  {scenario.signals.map((signal) => <span key={signal}>{signal}</span>)}
                </div>
                {isCorrect && <p className="vgen-scenario-rationale"><strong>判断依据：</strong>{scenario.rationale}</p>}
              </div>
              <Select
                label="你的策略"
                value={answers[scenario.id]}
                options={strategyOptions}
                onChange={(value) => choose(scenario.id, value as Strategy)}
              />
            </article>
          );
        })}
      </div>
      <div className="vgen-strategy-submit">
        <Button variant="primary" hint={!attempted} disabled={!allAnswered} onClick={checkStrategies}>检查三个判断</Button>
        {!allAnswered && <span>还需为 {Object.values(answers).filter((answer) => !answer).length} 个情境选择策略</span>}
      </div>
      {attempted && !completed && (
        <Feedback status="wrong" message={`还有 ${incorrectIds.length} 个情境需要调整。重新比较“领域相似度”和“标注数据量”，再提交一次。`} />
      )}
      {completed && (
        <Feedback
          status="correct"
          message="全部判断正确。你已经能根据数据规模和领域差异，在冻结骨干、微调整网和重新训练之间做出有依据的选择。"
        />
      )}
    </ContentBlock>
  );
}
