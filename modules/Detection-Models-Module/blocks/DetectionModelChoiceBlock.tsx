import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Feedback, NoticeStrip, Select, emitTelemetry, getTelemetryState } from '../../shared/react';

type ModelId = '' | 'ssd' | 'faster' | 'mask';
type ScenarioId = 'realtime' | 'proposal' | 'instance-mask';
type Answers = Record<ScenarioId, ModelId>;

interface DetectionModelChoiceBlockProps {
  onComplete?: () => void;
}

interface ChoiceState {
  answers?: Partial<Answers>;
  correct?: boolean;
}

const stateKey = 'exercise:detection-model-choice-v1';
const initialAnswers: Answers = { realtime: '', proposal: '', 'instance-mask': '' };
const correctAnswers: Answers = { realtime: 'ssd', proposal: 'faster', 'instance-mask': 'mask' };
const modelOptions = [
  { value: '', label: '选择检测模型', disabled: true },
  { value: 'ssd', label: 'SSD · 单阶段密集预测' },
  { value: 'faster', label: 'Faster R-CNN · RPN + 检测头' },
  { value: 'mask', label: 'Mask R-CNN · 检测 + 实例掩码' },
];
const scenarios: Array<{ id: ScenarioId; title: string; detail: string; signal: string; rationale: string }> = [
  {
    id: 'realtime',
    title: '仓储机器人实时避障',
    detail: '摄像头连续输入，要求较低延迟；只需输出物体类别和边界框。',
    signal: '速度优先 · 无需候选区域第二阶段',
    rationale: 'SSD 在多尺度特征图上一次完成密集预测，流程短，适合更重视吞吐与延迟的场景。',
  },
  {
    id: 'proposal',
    title: '离线分析复杂街景',
    detail: '允许更高计算成本，希望用可学习的区域提议网络筛选高质量候选区。',
    signal: 'RPN 提议 · 两阶段精细判断',
    rationale: 'Faster R-CNN 用 RPN 学习候选区域，再由检测头对每个 RoI 分类和回归边界框。',
  },
  {
    id: 'instance-mask',
    title: '机械臂分拣重叠零件',
    detail: '不仅要框出零件，还要获得每个实例的像素轮廓，区分相互遮挡的物体。',
    signal: '实例级像素输出 · 保留空间对齐',
    rationale: 'Mask R-CNN 在 Faster R-CNN 上加入 RoI Align 与掩码分支，能为每个实例预测像素区域。',
  },
];

export function DetectionModelChoiceBlock({ onComplete }: DetectionModelChoiceBlockProps) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [attempted, setAttempted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const completedRef = useRef(false);
  const allAnswered = Object.values(answers).every(Boolean);
  const incorrectIds = scenarios.filter(({ id }) => answers[id] !== correctAnswers[id]).map(({ id }) => id);

  useEffect(() => {
    let alive = true;
    void getTelemetryState<ChoiceState>(stateKey).then((entry) => {
      if (!alive) return;
      if (entry?.state?.answers) setAnswers({ ...initialAnswers, ...entry.state.answers });
      if (entry?.state?.correct) {
        setAttempted(true);
        setCompleted(true);
        completedRef.current = true;
      }
      setHydrated(true);
    });
    return () => { alive = false; };
  }, []);

  function choose(id: ScenarioId, model: ModelId) {
    setAnswers((current) => ({ ...current, [id]: model }));
    setAttempted(false);
    setCompleted(false);
  }

  function checkAnswers() {
    if (!hydrated || !allAnswered) return;
    const correct = incorrectIds.length === 0;
    setAttempted(true);
    setCompleted(correct);
    emitTelemetry('detection_model_choice_submit', null, {
      state_key: stateKey,
      answers,
      correct,
      incorrect_ids: incorrectIds,
      state: { answers, correct },
    });
    if (correct && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }

  return (
    <ContentBlock
      className="dmm-block dmm-choice-block"
      title="没有永远最好的检测器，只有与输出和计算约束匹配的方案"
      subtitle="为三种项目选择合适的模型，并用前面学到的结构差异解释选择。"
    >
      <NoticeStrip tone="blue" lead="先读约束：">速度、候选区域质量、是否需要像素掩码，会比“模型名字更新”更直接地决定架构。</NoticeStrip>
      <div className="dmm-choice-scenarios">
        {scenarios.map((scenario) => {
          const isCorrect = attempted && answers[scenario.id] === correctAnswers[scenario.id];
          const isWrong = attempted && !isCorrect;
          return (
            <article className={isCorrect ? 'is-correct' : isWrong ? 'is-wrong' : undefined} key={scenario.id}>
              <div>
                <h3>{scenario.title}</h3>
                <p>{scenario.detail}</p>
                <strong>{scenario.signal}</strong>
                {isCorrect && <p className="dmm-choice-rationale">{scenario.rationale}</p>}
              </div>
              <Select
                label="模型方案"
                value={answers[scenario.id]}
                options={modelOptions}
                onChange={(value) => choose(scenario.id, value as ModelId)}
              />
            </article>
          );
        })}
      </div>
      <div className="dmm-choice-submit">
        <Button variant="primary" hint={!attempted} disabled={!allAnswered} onClick={checkAnswers}>检查模型选择</Button>
        {!allAnswered && <span>还有 {Object.values(answers).filter((answer) => !answer).length} 个场景没有选择</span>}
      </div>
      {attempted && !completed && <Feedback status="wrong" message={`还有 ${incorrectIds.length} 个方案不匹配。重新比较“是否单阶段、提议区域来源、是否输出掩码”。`} />}
      {completed && <Feedback status="correct" message="全部匹配正确。你已经能从任务约束出发，在 SSD、Faster R-CNN 与 Mask R-CNN 之间做出有依据的选择。" />}
    </ContentBlock>
  );
}
