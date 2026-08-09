import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Feedback, NoticeStrip, Select, emitTelemetry, getTelemetryState } from '../../shared/react';

type RoleId = '' | 'features' | 'classes' | 'upsample';
type StageId = 'backbone' | 'classifier' | 'decoder';
type Answers = Record<StageId, RoleId>;
interface FcnAssemblyBlockProps { onComplete?: () => void; }
interface FcnState { answers?: Partial<Answers>; correct?: boolean; }
const stateKey = 'exercise:fcn-assembly-v1';
const initialAnswers: Answers = { backbone: '', classifier: '', decoder: '' };
const correctAnswers: Answers = { backbone: 'features', classifier: 'classes', decoder: 'upsample' };
const options = [{ value: '', label: '选择职责', disabled: true }, { value: 'features', label: '提取特征并缩小空间尺寸' }, { value: 'classes', label: '把通道数变为语义类别数' }, { value: 'upsample', label: '上采样到输入图像尺寸' }];
const stages: Array<{ id: StageId; title: string; shape: string }> = [
  { id: 'backbone', title: '预训练卷积骨干', shape: '(B, 512, H/32, W/32)' },
  { id: 'classifier', title: '1×1 卷积', shape: '(B, C, H/32, W/32)' },
  { id: 'decoder', title: '转置卷积', shape: '(B, C, H, W)' },
];

export function FcnAssemblyBlock({ onComplete }: FcnAssemblyBlockProps) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [attempted, setAttempted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const completedRef = useRef(false);
  const allAnswered = Object.values(answers).every(Boolean);
  const incorrect = stages.filter(({ id }) => answers[id] !== correctAnswers[id]);

  useEffect(() => {
    let alive = true;
    void getTelemetryState<FcnState>(stateKey).then((entry) => {
      if (!alive) return;
      if (entry?.state?.answers) setAnswers({ ...initialAnswers, ...entry.state.answers });
      if (entry?.state?.correct) { setAttempted(true); setCompleted(true); completedRef.current = true; }
      setHydrated(true);
    });
    return () => { alive = false; };
  }, []);

  function choose(id: StageId, role: RoleId) { setAnswers((current) => ({ ...current, [id]: role })); setAttempted(false); setCompleted(false); }
  function check() {
    if (!hydrated || !allAnswered) return;
    const correct = incorrect.length === 0; setAttempted(true); setCompleted(correct);
    emitTelemetry('fcn_assembly_submit', null, { state_key: stateKey, answers, correct, incorrect_ids: incorrect.map(({ id }) => id), state: { answers, correct } });
    if (correct && !completedRef.current) { completedRef.current = true; onComplete?.(); }
  }

  return (
    <ContentBlock className="pvm-block pvm-fcn-block" title="FCN 用全卷积结构把图像特征重新变成逐像素类别预测" subtitle="为 FCN 的三个阶段匹配职责，确保最终输出与输入图像具有相同的高和宽。">
      <NoticeStrip tone="blue" lead="输出契约：">最终张量形状是 (批量, 类别数, 高, 宽)，每个空间位置在类别通道上取最大值。</NoticeStrip>
      <div className="pvm-fcn-pipeline">
        {stages.map((stage, index) => <article key={stage.id} className={attempted ? answers[stage.id] === correctAnswers[stage.id] ? 'is-correct' : 'is-wrong' : undefined}><header><span>{index + 1}</span><div><strong>{stage.title}</strong><small>{stage.shape}</small></div></header><Select label="这一层负责什么？" value={answers[stage.id]} options={options} onChange={(value) => choose(stage.id, value as RoleId)} /></article>)}
      </div>
      <div className="pvm-fcn-submit"><Button variant="primary" hint={!attempted} disabled={!allAnswered} onClick={check}>检查 FCN 结构</Button>{!allAnswered && <span>还有 {Object.values(answers).filter((answer) => !answer).length} 个阶段未匹配</span>}</div>
      {attempted && !completed && <Feedback status="wrong" message={`还有 ${incorrect.length} 个阶段职责不正确。沿着“空间缩小 → 通道变类别 → 空间放大”重新检查。`} />}
      {completed && <Feedback status="correct" message="FCN 组装正确：骨干提取特征，1×1 卷积产生类别得分，转置卷积恢复逐像素输出。" />}
    </ContentBlock>
  );
}
