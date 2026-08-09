import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Feedback, NoticeStrip, Select, emitTelemetry, getTelemetryState } from '../../shared/react';

type Strategy = '' | 'scratch' | 'finetune' | 'refit';
type Scenario = 'cifar' | 'dogs' | 'final';
type Answers = Record<Scenario, Strategy>;
interface CompetitionStrategyBlockProps { onComplete?: () => void; }
interface StrategyState { answers?: Partial<Answers>; correct?: boolean; }
const stateKey = 'exercise:competition-strategy-v1';
const initialAnswers: Answers = { cifar: '', dogs: '', final: '' };
const correctAnswers: Answers = { cifar: 'scratch', dogs: 'finetune', final: 'refit' };
const options = [{ value: '', label: '选择策略', disabled: true }, { value: 'scratch', label: '随机初始化 ResNet，在当前数据上从零训练' }, { value: 'finetune', label: '加载 ImageNet 预训练模型并微调' }, { value: 'refit', label: '固定方案，在 train_valid 上重新训练' }];
const scenarios: Array<{ id: Scenario; title: string; facts: string[]; prompt: string; rationale: string }> = [
  { id: 'cifar', title: 'CIFAR-10', facts: ['32×32 彩色图像', '10 个类别', '50,000 张训练图'], prompt: '复现教材方案时，模型如何起步？', rationale: '教材为小尺寸输入改造 ResNet-18，并在 CIFAR-10 上从零训练。' },
  { id: 'dogs', title: 'ImageNet Dogs', facts: ['120 个细粒度犬种', '约一万张训练图', '属于 ImageNet 子集'], prompt: '怎样利用现成视觉知识？', rationale: '数据较少、类别细且与 ImageNet 同域，预训练特征很适合迁移。' },
  { id: 'final', title: '提交前的最终模型', facts: ['超参数已由验证集选定', '仍有一部分标签只用于过验证', '目标是充分使用监督信号'], prompt: '此时应怎样训练？', rationale: '配置不再搜索后，可以合并训练和验证标签，重新拟合最终模型。' },
];

export function CompetitionStrategyBlock({ onComplete }: CompetitionStrategyBlockProps) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [attempted, setAttempted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const completedRef = useRef(false);
  const allAnswered = Object.values(answers).every(Boolean);
  const incorrect = scenarios.filter(({ id }) => answers[id] !== correctAnswers[id]);
  useEffect(() => { let active = true; void getTelemetryState<StrategyState>(stateKey).then((entry) => { if (!active) return; if (entry?.state?.answers) setAnswers({ ...initialAnswers, ...entry.state.answers }); if (entry?.state?.correct) { setAttempted(true); setCompleted(true); completedRef.current = true; } setHydrated(true); }); return () => { active = false; }; }, []);
  function choose(id: Scenario, strategy: Strategy) { setAnswers((current) => ({ ...current, [id]: strategy })); setAttempted(false); setCompleted(false); }
  function check() { if (!hydrated || !allAnswered) return; const correct = incorrect.length === 0; setAttempted(true); setCompleted(correct); emitTelemetry('competition_strategy_submit', null, { state_key: stateKey, answers, correct, incorrect_ids: incorrect.map(({ id }) => id), state: { answers, correct } }); if (correct && !completedRef.current) { completedRef.current = true; onComplete?.(); } }
  return (
    <ContentBlock className="vsc-block vsc-strategy-block" title="最终测验：为两个竞赛和提交阶段选择正确策略" subtitle="不要只看数据量；还要同时判断输入尺寸、类别粒度、预训练领域和当前所处阶段。">
      <NoticeStrip tone="blue" lead="决策线索：">CIFAR-10 展示从零训练流程，Dogs 展示迁移学习，而最终提交前要重新利用全部标签。</NoticeStrip>
      <div className="vsc-scenario-grid">
        {scenarios.map((scenario, index) => { const status = attempted ? answers[scenario.id] === correctAnswers[scenario.id] ? 'is-correct' : 'is-wrong' : ''; return <article key={scenario.id} className={status}><header><span>0{index + 1}</span><h3>{scenario.title}</h3></header><div className="vsc-facts">{scenario.facts.map((fact) => <small key={fact}>{fact}</small>)}</div><p>{scenario.prompt}</p><Select label="你的策略" value={answers[scenario.id]} options={options} onChange={(value) => choose(scenario.id, value as Strategy)} />{status === 'is-correct' && <p className="vsc-rationale"><strong>依据：</strong>{scenario.rationale}</p>}</article>; })}
      </div>
      <div className="vsc-submit"><Button variant="primary" hint={!attempted} disabled={!allAnswered} onClick={check}>提交整章答案</Button>{!allAnswered && <span>还需完成 {Object.values(answers).filter((answer) => !answer).length} 个判断</span>}</div>
      {attempted && !completed && <Feedback status="wrong" message={`还有 ${incorrect.length} 个策略需要调整。对照数据领域与当前训练阶段再判断。`} />}
      {completed && <Feedback status="correct" message="全部正确。你已经从像素级任务走到风格优化与竞赛提交，完成计算机视觉章节的核心路线。" />}
    </ContentBlock>
  );
}
