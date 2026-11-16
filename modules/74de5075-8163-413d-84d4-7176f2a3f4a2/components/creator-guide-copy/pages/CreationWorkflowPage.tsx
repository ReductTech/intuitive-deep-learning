import { useEffect, useRef, useState } from 'react';
import { Button, TextInput, Typography } from "@shuku/course-style/react";
import { WorkflowSimulationPreview } from '../components/workflow/WorkflowSimulationPreview';
import { simulationOutline, walkthroughTurns } from '../components/workflow/simulation';
import { GomokuLessonProvider } from '../components/workflow/copied-course/LessonContext';
import './CreationWorkflowPage.css';

type Message = { user: string; reply: string; steps: number; done: boolean };
const turns = walkthroughTurns;
function Glyph({ kind }: { kind: 'spark' | 'send' | 'replay' }) {
  const paths = { spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z', send: 'M12 20V4M5 11l7-7 7 7', replay: 'M4 10a8 8 0 1 1 1 8M4 4v6h6' };
  return <svg shuku-edit-id="e-bb622561-bbef-422c-b5cb-290fa036d044" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path shuku-edit-id="e-7337b15c-c4dd-4ab6-8f18-c9de2009518c" d={paths[kind]}/></svg>;
}
export function CreationWorkflowPage() {
  const [completed, setCompleted] = useState(0);
  const [page, setPage] = useState(0);
  const [browsing, setBrowsing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState(0);
  const log = useRef<HTMLDivElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const turn = turns[completed];
  const ready = completed > 0;
  const view = completed ? turns[completed - 1].view : 'empty';
  const revised = completed >= 2;


  useEffect(() => {
    if (!running) return;
    const started = performance.now();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const steps = turn.steps;
    const thinkingTime = reduced ? 150 : steps.length * 700;
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - started;
      const count = Math.max(0, Math.floor((elapsed - thinkingTime) / (reduced ? 1 : 22)));
      const done = count >= turn.reply.length;
      setMessages(current => current.map((message, index) => index === current.length - 1 ? {
        ...message,
        steps: Math.min(steps.length, Math.floor(elapsed / (reduced ? 50 : 700)) + 1),
        reply: turn.reply.slice(0, count),
        done,
      } : message));
      if (done) {
        window.clearInterval(timer);
        setCompleted(value => value + 1);
        setBrowsing(false);
        if (turn.page !== undefined) setPage(turn.page);
        else setPage(0);
        setRunning(false);
      }
    }, 60);
    return () => window.clearInterval(timer);
  }, [running, completed, runId, turn]);

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    navigation.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' });
  }, [page, completed]);

  const send = () => {
    if (!turn || running) return;
    setMessages(current => [...current, { user: turn.prompt, reply: '', steps: 1, done: false }]);
    setRunning(true);
  };
  const replay = () => {
    setRunning(false); setRunId(value => value + 1); setCompleted(0); setMessages([]); setPage(0); setBrowsing(false);
  };
  return <GomokuLessonProvider key={runId}><article shuku-edit-id="e-fb510f3b-128b-4eed-be94-ff296a5330b9" className="aipe-replay-cg-workflow-page aipe-replay-cg-creator-typography" aria-label="术库实践创作流程模拟" onKeyDown={event => {
    if (event.target instanceof Element && event.target.closest('button,input,textarea,svg,canvas,summary,.aipe-replay-cg-sim-native') && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End',' '].includes(event.key)) event.stopPropagation();
  }}>
    <header shuku-edit-id="e-49c1c16f-32c1-4f4e-a490-f5db501efe65" className="aipe-replay-cg-sim-toolbar">
      <div shuku-edit-id="e-d96f60ff-e5d2-4465-9b26-c2a003801e20" className="aipe-replay-cg-sim-brand"><span shuku-edit-id="e-55d1c464-2408-4b8b-9c46-9873f5914615"><Glyph kind="spark"/></span><Typography shuku-edit-id="e-262cccb1-da10-4cba-926e-429c2f86ad6b" as="strong" variant="h3" tone="inherit">术库</Typography></div>
      <Typography shuku-edit-id="e-eefe19c9-8c6d-4c82-94a4-27bc0c534a1b" variant="bodySmall" tone="muted">{revised ? '从五子棋到卷积核' : ready ? '卷积核入门' : '新建知识呈现作品'}</Typography>
      <div shuku-edit-id="e-c4cd87df-a860-4b00-9f75-3cff0577e596" className="aipe-replay-cg-sim-toolbar-right"><Typography shuku-edit-id="e-9907d24f-fb4c-4820-a563-11afbfab44f3" variant="bodySmall" tone="muted">模拟演示</Typography><Button aria-label="重新体验" onClick={replay}><Glyph kind="replay"/></Button></div>
    </header>
    <div shuku-edit-id="e-54cb0499-fd0c-4065-8d8a-2f2cbe40a499" className="aipe-replay-cg-sim-workspace">
      <aside shuku-edit-id="e-73f9c710-39a2-4c26-93fa-a1f8a9f1ea30" className="aipe-replay-cg-sim-sidebar">
        <Typography shuku-edit-id="e-0394daf6-cffb-406d-9761-f5706acef398" variant="bodySmall" tone="inherit">{completed >= 5 ? '幻灯片' : '课程大纲'}</Typography>
        {ready ? <nav shuku-edit-id="e-219c8643-4f0e-41b9-8fe9-3e9487824b00" ref={navigation} aria-label="模拟课程页面">{simulationOutline(revised).map((item,i) => <Button key={item.title} aria-current={page === item.index ? 'page' : undefined} active={page === item.index} onClick={() => { setPage(item.index); setBrowsing(revised); }} className="aipe-replay-cg-sim-page-item"><Typography shuku-edit-id="e-57a6babf-caed-424d-8c1b-cf4ab889de4a" as="span" variant="bodySmall" tone="muted">{String(i+1).padStart(2,'0')}</Typography><Typography shuku-edit-id="e-349d08e4-9411-45f5-a18d-c687247bcea6" as="span" variant="bodySmall" tone="inherit">{item.title}</Typography></Button>)}</nav> : <Typography shuku-edit-id="e-9a7eb5ea-ab92-4747-a53e-388a7263111b" className="aipe-replay-cg-sim-sidebar-empty" variant="bodySmall" tone="muted">暂无页面</Typography>}
      </aside>
      <main shuku-edit-id="e-5abd1843-93ec-48af-9e09-87e1c45b8081" className="aipe-replay-cg-sim-main">
        <section shuku-edit-id="e-bea58ea4-2912-4642-a023-484c3fade94a" className="aipe-replay-cg-sim-preview" aria-label="实践作品预览">
          {ready ? <WorkflowSimulationPreview key={completed >= 5 ? `produced-${page}` : `${view}-${page}`} view={view} page={page} reviewed={completed >= 7} browsing={browsing}/> : <div shuku-edit-id="e-ceac2db7-148f-4366-8bd3-042fbe8ea89d" className="aipe-replay-cg-sim-empty"><Typography shuku-edit-id="e-f17d86ac-fcdb-4487-9fbd-42ff45a98f9f" as="h2" variant="h2" tone="accent">从一个想法开始</Typography><Typography shuku-edit-id="e-bb1a3b17-00f1-428d-b2eb-af83ebe2cc3b" variant="bodySmall" tone="muted">在下方描述你想做的知识呈现作品</Typography></div>}
        </section>
        <section shuku-edit-id="e-433a6d95-678a-4d70-96ff-eca6b00856c4" className="aipe-replay-cg-sim-agent" aria-label="智能体对话">
          <div shuku-edit-id="e-64801e12-8a76-4d84-82b5-1057cc94f617" className="aipe-replay-cg-sim-messages" ref={log} role="log" aria-label="对话记录" aria-live="polite" aria-busy={running}>
            {!messages.length && <Typography shuku-edit-id="e-1c5b6153-01c1-4918-8070-e90b82418426" className="aipe-replay-cg-sim-chat-empty" variant="bodySmall" tone="muted">你想让学生理解什么？</Typography>}
            {messages.map((message,i) => <div shuku-edit-id="e-a930e476-abf7-420f-9b1c-82ae14068b2a" className="aipe-replay-cg-sim-exchange" key={i}>
              <div shuku-edit-id="e-251ed9ce-249a-41de-b8ee-6c8cad29f1c6" className="aipe-replay-cg-sim-user" aria-label="用户"><Typography shuku-edit-id="e-a30ce1c7-c1b6-453e-b51e-786b63f49bf2" variant="bodySmall" tone="inherit">{message.user}</Typography></div>
              <div shuku-edit-id="e-c090c221-0f46-4dc8-a725-3ef8c3ac361f" className="aipe-replay-cg-sim-assistant" aria-label="智能体"><span shuku-edit-id="e-8beff7ae-c456-4b5f-a044-a913057a1203" className="aipe-replay-cg-sim-avatar"><Glyph kind="spark"/></span><div shuku-edit-id="e-b889e543-1b48-4e5b-bbba-3f3d3aaacb70">
                {message.done ? <details shuku-edit-id="e-70481d29-1081-4431-b677-7a8ba8db6314" className="aipe-replay-cg-sim-work"><summary shuku-edit-id="e-415e44c1-b435-45ec-92b6-bae440bab020"><Typography shuku-edit-id="e-7a5392a1-0f06-4c64-b265-16c6d414afdd" as="span" variant="bodySmall" tone="muted">处理完成</Typography></summary>{turns[i].steps.map(step => <Typography shuku-edit-id="e-f1dae913-0706-452e-aee1-d785cb67669a" key={step} variant="bodySmall" tone="muted">✓ {step}</Typography>)}</details> : <div shuku-edit-id="e-242ab06d-43d7-496b-ba65-04c067c8841c" className="aipe-replay-cg-sim-work" role="status"><Typography shuku-edit-id="e-f7918b7e-5da3-4a92-9178-7b4a996d42b3" variant="bodySmall" tone="muted"><span shuku-edit-id="e-661aa9dd-3cae-4a78-ab78-9af681576fbd" className="aipe-replay-cg-sim-working-dot"/> {message.reply ? '正在回复…' : turns[i].steps[Math.min(message.steps - 1, turns[i].steps.length - 1)] + '…'}</Typography></div>}
                {message.reply && <Typography shuku-edit-id="e-ebb46d6f-3d96-41f6-a1f8-977654bab8a8" variant="bodySmall" tone="inherit">{message.reply}</Typography>}
              </div></div>
            </div>)}
          </div>
          <div shuku-edit-id="e-feacf2c4-2e58-4c9c-9024-7ca04541b5be" className="aipe-replay-cg-sim-compose"><Typography shuku-edit-id="e-aa55cd71-ede7-4ec0-b3bf-740262402709" as="div" variant="bodySmall" tone="inherit"><TextInput aria-label="预设教学要求" value={running ? '正在处理…' : turn?.prompt ?? '实践创作完成'} readOnly onKeyDown={event => { if(event.key==='Enter') {event.preventDefault();send();} }}/></Typography><Button variant="primary" aria-label="发送教学要求" onClick={send} disabled={!turn || running}><Glyph kind="send"/></Button></div>
        </section>
      </main>
    </div>
  </article></GomokuLessonProvider>;
}
