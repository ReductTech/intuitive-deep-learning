import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Feedback, NoticeStrip, Select, emitTelemetry, getTelemetryState } from '../../shared/react';

type Role = '' | 'fit' | 'select' | 'refit' | 'submit';
type Split = 'train' | 'valid' | 'trainValid' | 'test';
type Answers = Record<Split, Role>;
interface CompetitionPipelineBlockProps { onComplete?: () => void; }
interface PipelineState { answers?: Partial<Answers>; correct?: boolean; }
const stateKey = 'exercise:competition-data-pipeline-v1';
const initialAnswers: Answers = { train: '', valid: '', trainValid: '', test: '' };
const correctAnswers: Answers = { train: 'fit', valid: 'select', trainValid: 'refit', test: 'submit' };
const options = [{ value: '', label: '选择职责', disabled: true }, { value: 'fit', label: '随机增强并更新模型参数' }, { value: 'select', label: '固定预处理，选择超参数与模型' }, { value: 'refit', label: '方案确定后，用全部有标签数据重训' }, { value: 'submit', label: '只做推理，按样本顺序生成提交文件' }];
const splits: Array<{ id: Split; title: string; detail: string }> = [
  { id: 'train', title: 'train', detail: '有标签；从训练样本中切出验证集后，剩余部分用于搜索阶段拟合。' },
  { id: 'valid', title: 'valid', detail: '有标签但不参与参数更新，用来比较增强、学习率和模型配置。' },
  { id: 'trainValid', title: 'train_valid', detail: '竞赛代码常把全部有标签数据合并，供选定方案最后一次训练。' },
  { id: 'test', title: 'test', detail: '标签不可见，输出必须保持题目规定的样本顺序和类别列。' },
];

export function CompetitionPipelineBlock({ onComplete }: CompetitionPipelineBlockProps) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [attempted, setAttempted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const completedRef = useRef(false);
  const allAnswered = Object.values(answers).every(Boolean);
  const incorrect = splits.filter(({ id }) => answers[id] !== correctAnswers[id]);
  useEffect(() => { let active = true; void getTelemetryState<PipelineState>(stateKey).then((entry) => { if (!active) return; if (entry?.state?.answers) setAnswers({ ...initialAnswers, ...entry.state.answers }); if (entry?.state?.correct) { setAttempted(true); setCompleted(true); completedRef.current = true; } setHydrated(true); }); return () => { active = false; }; }, []);
  function choose(id: Split, role: Role) { setAnswers((current) => ({ ...current, [id]: role })); setAttempted(false); setCompleted(false); }
  function check() { if (!hydrated || !allAnswered) return; const correct = incorrect.length === 0; setAttempted(true); setCompleted(correct); emitTelemetry('competition_pipeline_submit', null, { state_key: stateKey, answers, correct, incorrect_ids: incorrect.map(({ id }) => id), state: { answers, correct } }); if (correct && !completedRef.current) { completedRef.current = true; onComplete?.(); } }
  return (
    <ContentBlock className="vsc-block vsc-pipeline-block" title="排行榜之前，先把四份数据的职责分清" subtitle="搜索阶段只用 train 与 valid；配置确定后再合并标签，最后对 test 推理并生成提交文件。">
      <NoticeStrip tone="blue" lead="防止信息泄漏：">测试集不能参与选模型，验证集也不能被训练过程反复“记住”。</NoticeStrip>
      <div className="vsc-pipeline-list">
        {splits.map((split, index) => <article key={split.id} className={attempted ? answers[split.id] === correctAnswers[split.id] ? 'is-correct' : 'is-wrong' : undefined}><span>{index + 1}</span><div><h3>{split.title}</h3><p>{split.detail}</p></div><Select label={`${split.title} 的职责`} value={answers[split.id]} options={options} onChange={(value) => choose(split.id, value as Role)} /></article>)}
      </div>
      <div className="vsc-submit"><Button variant="primary" hint={!attempted} disabled={!allAnswered} onClick={check}>检查数据流程</Button>{!allAnswered && <span>还有 {Object.values(answers).filter((answer) => !answer).length} 份数据未分配职责</span>}</div>
      {attempted && !completed && <Feedback status="wrong" message={`还有 ${incorrect.length} 处不匹配。按“搜索配置 → 全标签重训 → 测试提交”的时间顺序再检查。`} />}
      {completed && <Feedback status="correct" message="流程正确：训练集更新参数，验证集做选择，train_valid 完成最终重训，test 只负责推理与提交。" />}
    </ContentBlock>
  );
}
