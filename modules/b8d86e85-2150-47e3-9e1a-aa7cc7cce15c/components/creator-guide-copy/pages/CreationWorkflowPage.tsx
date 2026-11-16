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
  return <svg shuku-edit-id="e-47d06566-8c76-449a-b08d-09353263feee" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path shuku-edit-id="e-ea4c5c10-1e55-4b04-9838-cf53b9995c1e" d={paths[kind]}/></svg>;
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
  return <GomokuLessonProvider key={runId}><article shuku-edit-id="e-6ff38ae0-b795-4e6d-a382-c5aa034e26ac" className="aipe-replay-cg-workflow-page aipe-replay-cg-creator-typography" aria-label="术库实践创作流程模拟" onKeyDown={event => {
    if (event.target instanceof Element && event.target.closest('button,input,textarea,svg,canvas,summary,.aipe-replay-cg-sim-native') && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End',' '].includes(event.key)) event.stopPropagation();
  }}>
    <header shuku-edit-id="e-8dcc3e1e-7e22-4345-b0e6-6a4c15047ec9" className="aipe-replay-cg-sim-toolbar">
      <div shuku-edit-id="e-64ff600b-25dd-43d2-b5cf-ba66a2c79cba" className="aipe-replay-cg-sim-brand"><span shuku-edit-id="e-f13a9d1e-8640-42d0-937d-f80a745bf6b4"><Glyph kind="spark"/></span><Typography shuku-edit-id="e-b2ff4380-f002-463d-a699-2d8a7961dac9" as="strong" variant="h3" tone="inherit">术库</Typography></div>
      <Typography shuku-edit-id="e-e2e1816a-9005-44b0-8426-f63c32d26176" variant="bodySmall" tone="muted">{revised ? '从五子棋到卷积核' : ready ? '卷积核入门' : '新建知识呈现作品'}</Typography>
      <div shuku-edit-id="e-bcc8d2fc-ac97-4a75-83e3-11f2dd00d295" className="aipe-replay-cg-sim-toolbar-right"><Typography shuku-edit-id="e-72ccd014-94fd-48c8-8439-e05abe5cb3e2" variant="bodySmall" tone="muted">模拟演示</Typography><Button aria-label="重新体验" onClick={replay}><Glyph kind="replay"/></Button></div>
    </header>
    <div shuku-edit-id="e-44919ec5-0746-4ac9-8636-aa4c67f96aeb" className="aipe-replay-cg-sim-workspace">
      <aside shuku-edit-id="e-780996c1-96c8-4aad-ab04-3dcf391e133a" className="aipe-replay-cg-sim-sidebar">
        <Typography shuku-edit-id="e-46505cf9-52ec-4f23-9e6f-7a8b313afb53" variant="bodySmall" tone="inherit">{completed >= 5 ? '幻灯片' : '课程大纲'}</Typography>
        {ready ? <nav shuku-edit-id="e-54f6700a-576d-457d-b3b5-44832d290d65" ref={navigation} aria-label="模拟课程页面">{simulationOutline(revised).map((item,i) => <Button key={item.title} aria-current={page === item.index ? 'page' : undefined} active={page === item.index} onClick={() => { setPage(item.index); setBrowsing(revised); }} className="aipe-replay-cg-sim-page-item"><Typography shuku-edit-id="e-5f042008-5313-47a1-a932-0ccdfa4c438f" as="span" variant="bodySmall" tone="muted">{String(i+1).padStart(2,'0')}</Typography><Typography shuku-edit-id="e-644c1d01-04d0-4762-99db-7c9715b4ca1a" as="span" variant="bodySmall" tone="inherit">{item.title}</Typography></Button>)}</nav> : <Typography shuku-edit-id="e-31a89621-0a73-4bf3-9fd9-ed20a549d3ea" className="aipe-replay-cg-sim-sidebar-empty" variant="bodySmall" tone="muted">暂无页面</Typography>}
      </aside>
      <main shuku-edit-id="e-3ca5cbf7-f488-4da3-b117-b24ead67ab73" className="aipe-replay-cg-sim-main">
        <section shuku-edit-id="e-a77fcb9c-ac5c-45fc-bf8b-3144c0383c8c" className="aipe-replay-cg-sim-preview" aria-label="实践作品预览">
          {ready ? <WorkflowSimulationPreview key={completed >= 5 ? `produced-${page}` : `${view}-${page}`} view={view} page={page} reviewed={completed >= 7} browsing={browsing}/> : <div shuku-edit-id="e-f7f438fc-6309-48c2-89c6-246e125775d4" className="aipe-replay-cg-sim-empty"><Typography shuku-edit-id="e-f728ac85-ccb1-42bc-b377-9a8b18d6964f" as="h2" variant="h2" tone="accent">从一个想法开始</Typography><Typography shuku-edit-id="e-3defa1e7-9ee6-40f2-a65e-ebd5d909ca7e" variant="bodySmall" tone="muted">在下方描述你想做的知识呈现作品</Typography></div>}
        </section>
        <section shuku-edit-id="e-16418f73-eed4-4c00-8276-f55fc4ee9d00" className="aipe-replay-cg-sim-agent" aria-label="智能体对话">
          <div shuku-edit-id="e-555c8d60-8623-4b3a-98d6-576a048dc708" className="aipe-replay-cg-sim-messages" ref={log} role="log" aria-label="对话记录" aria-live="polite" aria-busy={running}>
            {!messages.length && <Typography shuku-edit-id="e-158c2cbf-dfb4-471f-a72c-c5a782310b3f" className="aipe-replay-cg-sim-chat-empty" variant="bodySmall" tone="muted">你想让学生理解什么？</Typography>}
            {messages.map((message,i) => <div shuku-edit-id="e-74935f98-1f54-48e1-89ac-d65a7762b04a" className="aipe-replay-cg-sim-exchange" key={i}>
              <div shuku-edit-id="e-f485a555-4a55-4f4c-9d4b-968d15eaadff" className="aipe-replay-cg-sim-user" aria-label="用户"><Typography shuku-edit-id="e-e8d404eb-a9df-4f71-9bd1-e7b9c3803d95" variant="bodySmall" tone="inherit">{message.user}</Typography></div>
              <div shuku-edit-id="e-d6a016d9-0801-44e6-8c91-63c6a105cd18" className="aipe-replay-cg-sim-assistant" aria-label="智能体"><span shuku-edit-id="e-fa2414cd-3afe-49bc-8838-7c7fed3fe20b" className="aipe-replay-cg-sim-avatar"><Glyph kind="spark"/></span><div shuku-edit-id="e-9c473d00-902b-4afa-bf45-4cd51a63950d">
                {message.done ? <details shuku-edit-id="e-c2c7420c-4f80-4da0-8a30-ae331ccc4da1" className="aipe-replay-cg-sim-work"><summary shuku-edit-id="e-72080135-4cfe-45e8-927b-e195b92c002e"><Typography shuku-edit-id="e-212a9f22-2c8f-4ab1-ad72-86b057a78597" as="span" variant="bodySmall" tone="muted">处理完成</Typography></summary>{turns[i].steps.map(step => <Typography shuku-edit-id="e-bc5f3cd0-da78-4bf0-abb5-b91cb4ef4df4" key={step} variant="bodySmall" tone="muted">✓ {step}</Typography>)}</details> : <div shuku-edit-id="e-6fd27241-ac64-411e-be1d-7b8918d05e83" className="aipe-replay-cg-sim-work" role="status"><Typography shuku-edit-id="e-7d483d7c-a83a-4ae1-b5e1-328006137fc1" variant="bodySmall" tone="muted"><span shuku-edit-id="e-9cff0333-8cff-4a79-9dac-53513bf8d59d" className="aipe-replay-cg-sim-working-dot"/> {message.reply ? '正在回复…' : turns[i].steps[Math.min(message.steps - 1, turns[i].steps.length - 1)] + '…'}</Typography></div>}
                {message.reply && <Typography shuku-edit-id="e-81c72ecf-a38e-4dc1-918d-1910c1693f0e" variant="bodySmall" tone="inherit">{message.reply}</Typography>}
              </div></div>
            </div>)}
          </div>
          <div shuku-edit-id="e-030aabc6-e4cd-4101-a406-91aeb230ff41" className="aipe-replay-cg-sim-compose"><Typography shuku-edit-id="e-85924191-a58d-4fe3-a57b-3d8de9177f74" as="div" variant="bodySmall" tone="inherit"><TextInput aria-label="预设教学要求" value={running ? '正在处理…' : turn?.prompt ?? '实践创作完成'} readOnly onKeyDown={event => { if(event.key==='Enter') {event.preventDefault();send();} }}/></Typography><Button variant="primary" aria-label="发送教学要求" onClick={send} disabled={!turn || running}><Glyph kind="send"/></Button></div>
        </section>
      </main>
    </div>
  </article></GomokuLessonProvider>;
}
