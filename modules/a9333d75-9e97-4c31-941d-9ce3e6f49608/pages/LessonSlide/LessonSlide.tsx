import { useState, type ReactNode } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import { RoleScene, ParallelScene, MessageScene, IntegrationScene } from '../InteractiveScenes/InteractiveScenes';
import { LaunchStudio, ToolPipeline, SpecificationLab, ToolsWorkbench, EvidenceSorter } from '../OpeningScenes/OpeningScenes';
import { ReActNavigator, CodeMicroscope, PatchWorkbench, AcceptanceMission, BudgetSimulator } from '../ReasoningScenes/ReasoningScenes';
import { CourseSummary } from '../../components/WorkflowTheatre';
import {PaperScene,CotExample,ReActCloseup,TimerHandle,RegressionExperiment,AgentMessage} from '../ResearchScenes/ResearchScenes';
import {WorkflowEntry,WorkflowGate,FailureCloseup,TimeoutCloseup,MechanismChoice,CaseSplit,CaseMerge,CaseRepair,CaseDeliver,TransferExercise} from '../ProcessScenes/ProcessScenes';
import './LessonSlide.css';
import './layout.css';

const T = ({ children, tone = 'main', variant = 'body', className = '' }: {children: ReactNode; tone?: 'main'|'muted'|'success'|'danger'|'accent'|'warning'; variant?: 'body'|'bodySmall'|'h3'|'subtitle'; className?: string}) => <Typography shuku-edit-id="e-62aed4cc-afc4-41a1-89f7-27baaf08d55d" as="div" tone={tone} variant={variant} className={className}>{children}</Typography>;
const Choice = ({ value, selected, onClick }: {value: string; selected: boolean; onClick: () => void}) => <Button className="act-choice" active={selected} onClick={onClick}>{value}</Button>;

function Quiz({ question, options, correct, explanation }: {question: string; options: string[]; correct: number; explanation: string}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  return <div shuku-edit-id="e-030bc693-6c80-479a-a649-f3a8be306877" className="act-quiz">
    <T variant="h3">{question}</T>
    <div shuku-edit-id="e-7294ff37-bb82-447f-8b86-9fb1241cd77f" className="act-choice-list">{options.map((option, i) => <Choice key={option} value={`${'ABC'[i]}  ${option}`} selected={selected === i} onClick={() => { setSelected(i); setChecked(false); }} />)}</div>
    <Button variant="primary" disabled={selected === null} onClick={() => setChecked(true)}>检查答案</Button>
    {checked && <T tone={selected === correct ? 'success' : 'warning'}>{selected === correct ? '正确。' : '再看一次证据。'}{explanation}</T>}
  </div>;
}

function Visual({ id }: {id: string}) {
  switch (id) {
    case '3c8af52d-dba2-415d-9700-770a30f9127d': return <LaunchStudio />;
    case 'de849b4c-b127-43a7-864d-c68b91330ebf': return <ToolPipeline />;
    case 'ee321940-c709-4c19-af2d-3ed3f35bc920': return <SpecificationLab />;
    case 'c1d9351b-5c85-4d11-92f4-99cc7ee2db58': return <ToolsWorkbench />;
    case 'd6479b8d-d730-40c2-9ee3-c1169a577604': return <PaperScene kind="cot"/>;
    case '745995b4-f0f4-45b7-9d76-21da4c23c578': return <CotExample/>;
    case '26487fc9-67f3-415a-b205-778595ece7dd': return <PaperScene kind="react"/>;
    case '8ebcf6dc-99ed-4d5d-a688-07538b4c6034': return <ReActCloseup part="reason"/>;
    case 'fe9a2646-c340-4bc1-bae3-114c0903f194': return <ReActCloseup part="action"/>;
    case '8aa85ad7-a354-48d8-a444-1c516ffd8c66': return <ReActCloseup part="observe"/>;
    case '75fcb15a-9b97-401f-990e-53227cc86359': return <EvidenceSorter />;
    case 'db0f9c79-be9d-4931-a962-0347350e7311': return <ReActNavigator />;
    case '5d97f813-0fd3-407a-877f-71e71a0989eb': return <TimerHandle/>;
    case '4dfa8d4b-4e07-4740-a2f6-130fbdcaae25': return <CodeMicroscope />;
    case 'ca42d9be-f63b-47ac-b6cc-02115fd4291b': return <PatchWorkbench />;
    case '3c6e6d67-28a1-4b45-b888-c8d421e35798': return <AcceptanceMission />;
    case '27bf4149-033d-4710-803a-893f77cafd39': return <RegressionExperiment kind="resume"/>;
    case 'c7e378fa-2aeb-4c13-a43d-4f64615b60d6': return <RegressionExperiment kind="record"/>;
    case 'a48758ed-815a-4184-8d9b-d65fbc4f09ad': return <BudgetSimulator />;
    case '83d46c41-0458-4cc8-be42-6922aa99d686': return <ParallelScene />;
    case 'af7b67c2-b54c-4616-aa8a-faf7150d37f4': return <PaperScene kind="agent"/>;
    case '98f93ec2-7e19-4cac-a43b-c7707a3ebbb7': return <AgentMessage/>;
    case '01d5557e-fa8d-484f-9a12-af615becb85f': return <RoleScene />;
    case '2bf4cf15-6b6c-4086-85db-8d9e9dfc3d7d': return <IntegrationScene />;
    case '54bdbe9e-c82e-4b7c-a8e7-ec7f77ea3d46': return <MessageScene />;
    case 'c3b6a468-e882-4862-9da7-acf8a0a5388b': return <Quiz question="模块 B1 暂停测试通过，合并页面 M0 报接口错误。下一步？" options={['直接交付','核对版本和接口，再做集成测试','让更多角色投票']} correct={1} explanation="验证对象不同，模块通过不代表页面能调用它。" />;
    case 'bff2ff06-2a70-487d-9c8a-a81338434241': return <PaperScene kind="workflow"/>;
    case 'b63f7a20-1a79-4083-8bbf-580d3705c9c2': return <WorkflowEntry/>;
    case '0fa68a7a-b1d1-4175-8e05-cadfdda494d9': return <WorkflowGate/>;
    case '3618decb-afab-4eb3-9ed1-87f5f067949c': return <FailureCloseup/>;
    case '5e4c901b-b1c3-444d-a57c-14d3502552f2': return <TimeoutCloseup/>;
    case '00603547-6e4c-4e55-8c55-cd11d0f92d4b': return <MechanismChoice/>;
    case 'fe1c3bf5-dfa1-4288-924b-bd8de1905709': return <Quiz question="三次不同改动，交付前都要走同一套检查。优先怎么组织？" options={['固定工作流','无限制地自由探索','让所有角色反复讨论']} correct={0} explanation="重复检查步骤固定，失败节点再局部排查。" />;
    case '8ae9b849-1f65-4440-850e-7938da30a6df': return <CaseSplit/>;
    case '80a0f39b-9601-4c57-85a3-655113127892': return <CaseMerge/>;
    case '359e73ec-07b1-4dab-925f-dbf18651558b': return <FailureCloseup integrated/>;
    case 'ee1a907e-ca05-47a0-8b09-4065849b0c1a': return <CaseRepair/>;
    case 'ffe2020f-72c2-434f-afc1-506cd218fc92': return <CaseDeliver/>;
    case 'd2c5dada-5a43-49fd-97d5-1181fc8c7f87': return <TransferExercise/>;
    case 'f761bd43-5ca1-4ac1-a835-8bf707c0a209': return <CourseSummary />;
    default: return null;
  }
}

export function LessonSlide({ pageId }: {pageId: string}) {
  const page = outline.pages.find(page => page.id === pageId);
  if (!page) return null;
  const index = outline.pages.findIndex(page => page.id === pageId);
  return <article shuku-edit-id="e-505858c4-6fd5-4c06-91c7-736db8d5ffab" className={`act-slide ${index < 19 ? 'is-lab' : ''}`}>
    <ContentBlock shuku-edit-id="e-dd19d153-ee81-4dae-a025-f1133a2fe013" title={page.title} subtitle={page.goal}>
      <div shuku-edit-id="e-2b47292c-ea3b-49af-b487-52197b6befad" className="act-main"><Visual key={page.id} id={page.id}/></div>
      <div shuku-edit-id="e-96f34b2e-5df0-47c5-bb64-8d924e3a1a2a" className="act-footer"><T variant="bodySmall" tone="muted">{outline.title}</T></div>
    </ContentBlock>
  </article>;
}
