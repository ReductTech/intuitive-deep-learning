import { useState, type ReactNode } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
import outline from '../../outlines.json';
import { RoleScene, ParallelScene, MessageScene, IntegrationScene } from '../InteractiveScenes/InteractiveScenes';
import { LaunchStudio, ToolPipeline, SpecificationLab, ToolsWorkbench, EvidenceSorter } from '../OpeningScenes/OpeningScenes';
import { ReActNavigator, CodeMicroscope, PatchWorkbench, AcceptanceMission, BudgetSimulator } from '../ReasoningScenes/ReasoningScenes';
import { CourseSummary } from '../../components/WorkflowTheatre';
import {PaperScene,CotExample,ReActCloseup,TimerHandle,RegressionExperiment,AgentMessage} from '../ResearchScenes/ResearchScenes';
import {WorkflowEntry,WorkflowGate,FailureCloseup,TimeoutCloseup,MechanismChoice,CaseSplit,CaseMerge,CaseRepair,CaseDeliver,TransferExercise} from '../ProcessScenes/ProcessScenes';
import './LessonSlide.css';
import './layout.css';

const T = ({ children, tone = 'main', variant = 'body', className = '' }: {children: ReactNode; tone?: 'main'|'muted'|'success'|'danger'|'accent'|'warning'; variant?: 'body'|'bodySmall'|'h3'|'subtitle'; className?: string}) => <Typography as="div" tone={tone} variant={variant} className={className}>{children}</Typography>;
const Choice = ({ value, selected, onClick }: {value: string; selected: boolean; onClick: () => void}) => <Button className="act-choice" active={selected} onClick={onClick}>{value}</Button>;

function Quiz({ question, options, correct, explanation }: {question: string; options: string[]; correct: number; explanation: string}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  return <div className="act-quiz">
    <T variant="h3">{question}</T>
    <div className="act-choice-list">{options.map((option, i) => <Choice key={option} value={`${'ABC'[i]}  ${option}`} selected={selected === i} onClick={() => { setSelected(i); setChecked(false); }} />)}</div>
    <Button variant="primary" disabled={selected === null} onClick={() => setChecked(true)}>检查答案</Button>
    {checked && <T tone={selected === correct ? 'success' : 'warning'}>{selected === correct ? '正确。' : '再看一次证据。'}{explanation}</T>}
  </div>;
}

function Visual({ id }: {id: string}) {
  switch (id) {
    case 'task': return <LaunchStudio />;
    case 'tool-boundary': return <ToolPipeline />;
    case 'requirements': return <SpecificationLab />;
    case 'tool-evidence': return <ToolsWorkbench />;
    case 'cot-paper': return <PaperScene kind="cot"/>;
    case 'cot-step': return <CotExample/>;
    case 'react-paper': return <PaperScene kind="react"/>;
    case 'react-reason': return <ReActCloseup part="reason"/>;
    case 'react-action': return <ReActCloseup part="action"/>;
    case 'react-observe': return <ReActCloseup part="observe"/>;
    case 'quiz-observation': return <EvidenceSorter />;
    case 'react-cycle': return <ReActNavigator />;
    case 'timer-handle': return <TimerHandle/>;
    case 'read-code': return <CodeMicroscope />;
    case 'fix-test': return <PatchWorkbench />;
    case 'acceptance': return <AcceptanceMission />;
    case 'regression-resume': return <RegressionExperiment kind="resume"/>;
    case 'regression-record': return <RegressionExperiment kind="record"/>;
    case 'round-limit': return <BudgetSimulator />;
    case 'parallel': return <ParallelScene />;
    case 'agent-paper': return <PaperScene kind="agent"/>;
    case 'agent-message': return <AgentMessage/>;
    case 'roles': return <RoleScene />;
    case 'integration': return <IntegrationScene />;
    case 'messages': return <MessageScene />;
    case 'quiz-integration': return <Quiz question="模块 B1 暂停测试通过，合并页面 M0 报接口错误。下一步？" options={['直接交付','核对版本和接口，再做集成测试','让更多角色投票']} correct={1} explanation="验证对象不同，模块通过不代表页面能调用它。" />;
    case 'workflow-paper': return <PaperScene kind="workflow"/>;
    case 'workflow': return <WorkflowEntry/>;
    case 'workflow-gate': return <WorkflowGate/>;
    case 'workflow-fail': return <FailureCloseup/>;
    case 'timeout': return <TimeoutCloseup/>;
    case 'mechanism': return <MechanismChoice/>;
    case 'quiz-workflow': return <Quiz question="三次不同改动，交付前都要走同一套检查。优先怎么组织？" options={['固定工作流','无限制地自由探索','让所有角色反复讨论']} correct={0} explanation="重复检查步骤固定，失败节点再局部排查。" />;
    case 'case-split': return <CaseSplit/>;
    case 'case-merge': return <CaseMerge/>;
    case 'case-evidence': return <FailureCloseup integrated/>;
    case 'case-repair': return <CaseRepair/>;
    case 'case-deliver': return <CaseDeliver/>;
    case 'transfer': return <TransferExercise/>;
    case 'recap': return <CourseSummary />;
    default: return null;
  }
}

export function LessonSlide({ index }: {index: number}) {
  const page = outline.pages[index];
  return <article className={`act-slide ${index < 19 ? 'is-lab' : ''}`}>
    <ContentBlock title={page.title} subtitle={page.goal}>
      <div className="act-main"><Visual key={page.id} id={page.id}/></div>
      <div className="act-footer"><T variant="bodySmall" tone="muted">{outline.title}</T><T variant="bodySmall" tone="muted">{String(index+1).padStart(2,'0')} / {outline.pages.length}</T></div>
    </ContentBlock>
  </article>;
}
