import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Feedback, NoticeStrip, Select, emitTelemetry, getTelemetryState } from '../../shared/react';

type Scale = '' | 'fine' | 'medium' | 'coarse';
type ScenarioId = 'traffic-light' | 'car' | 'bus';
type Answers = Record<ScenarioId, Scale>;

interface MultiScaleDetectionBlockProps {
  onComplete?: () => void;
}

interface MultiScaleState {
  answers?: Partial<Answers>;
  correct?: boolean;
}

const stateKey = 'exercise:detection-multiscale-v1';
const initialAnswers: Answers = { 'traffic-light': '', car: '', bus: '' };
const correctAnswers: Answers = { 'traffic-light': 'fine', car: 'medium', bus: 'coarse' };
const scaleOptions = [
  { value: '', label: '选择检测层', disabled: true },
  { value: 'fine', label: '4×4 特征图 · 密集小锚框' },
  { value: 'medium', label: '2×2 特征图 · 中等锚框' },
  { value: 'coarse', label: '1×1 特征图 · 稀疏大锚框' },
];

const scenarios: Array<{ id: ScenarioId; title: string; detail: string; signal: string; rationale: string }> = [
  { id: 'traffic-light', title: '远处交通灯', detail: '只占画面约 3%，可能出现在许多细小位置。', signal: '小目标 · 位置变化多', rationale: '小目标需要更密集的采样中心和较小锚框，否则很容易从采样间隙中漏掉。' },
  { id: 'car', title: '道路中央汽车', detail: '占画面约 25%，位置变化适中。', signal: '中等目标 · 平衡精度与计算', rationale: '中等分辨率特征图兼顾空间位置和感受野，适合中等大小目标。' },
  { id: 'bus', title: '近景公交车', detail: '占画面约 70%，中心位置的变化相对少。', signal: '大目标 · 需要大感受野', rationale: '粗特征图拥有更大的感受野，用少量大锚框即可覆盖大目标并节省计算。' },
];

function FeatureMap({ scale, size, label }: { scale: Exclude<Scale, ''>; size: number; label: string }) {
  return (
    <article className={`odf-feature-card is-${scale}`}>
      <div className="odf-feature-map" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }} aria-hidden="true">
        {Array.from({ length: size * size }, (_, index) => <span key={index}><i /></span>)}
      </div>
      <strong>{size}×{size} 特征图</strong>
      <span>{label}</span>
    </article>
  );
}

export function MultiScaleDetectionBlock({ onComplete }: MultiScaleDetectionBlockProps) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [attempted, setAttempted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const completedRef = useRef(false);
  const allAnswered = Object.values(answers).every(Boolean);
  const incorrectIds = scenarios.filter(({ id }) => answers[id] !== correctAnswers[id]).map(({ id }) => id);

  useEffect(() => {
    let active = true;
    void getTelemetryState<MultiScaleState>(stateKey).then((entry) => {
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

  function choose(id: ScenarioId, scale: Scale) {
    setAnswers((current) => ({ ...current, [id]: scale }));
    setAttempted(false);
    setCompleted(false);
  }

  function checkAnswers() {
    if (!hydrated || !allAnswered) return;
    const correct = incorrectIds.length === 0;
    setAttempted(true);
    setCompleted(correct);
    emitTelemetry('multiscale_strategy_submit', null, {
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
      className="odf-block odf-multiscale-block"
      title="小目标要看得密，大目标要看得远"
      subtitle="如果在每个原始像素都生成多个锚框，候选数量会爆炸。多尺度检测让不同分辨率的特征图负责不同大小的目标。"
    >
      <NoticeStrip tone="blue" lead="核心权衡：">细特征图保留更多位置，适合小目标；粗特征图感受野更大、中心更少，适合大目标。</NoticeStrip>
      <div className="odf-feature-gallery" aria-label="三种多尺度检测层">
        <FeatureMap scale="fine" size={4} label="密集中心 · 小锚框" />
        <FeatureMap scale="medium" size={2} label="中等中心 · 中锚框" />
        <FeatureMap scale="coarse" size={1} label="单个中心 · 大锚框" />
      </div>
      <div className="odf-scale-scenarios">
        {scenarios.map((scenario, index) => {
          const isCorrect = attempted && answers[scenario.id] === correctAnswers[scenario.id];
          const isWrong = attempted && !isCorrect;
          return (
            <article className={isCorrect ? 'is-correct' : isWrong ? 'is-wrong' : undefined} key={scenario.id}>
              <span className="odf-scenario-index">{index + 1}</span>
              <div>
                <h3>{scenario.title}</h3>
                <p>{scenario.detail}</p>
                <strong>{scenario.signal}</strong>
                {isCorrect && <p className="odf-scale-rationale">{scenario.rationale}</p>}
              </div>
              <Select
                label="交给哪一层检测？"
                value={answers[scenario.id]}
                options={scaleOptions}
                onChange={(value) => choose(scenario.id, value as Scale)}
              />
            </article>
          );
        })}
      </div>
      <div className="odf-scale-submit">
        <Button variant="primary" hint={!attempted} disabled={!allAnswered} onClick={checkAnswers}>检查三种尺度</Button>
        {!allAnswered && <span>还需为 {Object.values(answers).filter((answer) => !answer).length} 个目标选择检测层</span>}
      </div>
      {attempted && !completed && <Feedback status="wrong" message={`还有 ${incorrectIds.length} 个目标的尺度不合适。重新比较“目标大小、位置变化、特征图密度”。`} />}
      {completed && <Feedback status="correct" message="全部匹配正确。你已经能根据目标大小选择检测层，并解释为什么多尺度设计能兼顾召回率与计算量。" />}
    </ContentBlock>
  );
}
