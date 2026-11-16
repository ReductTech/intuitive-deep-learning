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
  return <svg shuku-edit-id="e-d6513e1b-2b28-44ce-bf7b-e0801fa4785d" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path shuku-edit-id="e-050b7eec-8ae9-48f0-b56a-900003ccfe4a" d={paths[kind]}/></svg>;
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
  return <GomokuLessonProvider key={runId}><article shuku-edit-id="e-21652f91-4dc8-48de-b099-7ab9b0eddfd0" className="cg-workflow-page cg-creator-typography" aria-label="术库实践创作流程模拟" onKeyDown={event => {
    if (event.target instanceof Element && event.target.closest('button,input,textarea,svg,canvas,summary,.cg-sim-native') && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End',' '].includes(event.key)) event.stopPropagation();
  }}>
    <header shuku-edit-id="e-80265c17-d6eb-46c4-997b-661c9c38f5e3" className="cg-sim-toolbar">
      <div shuku-edit-id="e-de02cac7-8e14-46ae-a1f4-72d7f9be798b" className="cg-sim-brand"><span shuku-edit-id="e-87faea1b-b507-4e50-bec1-73093e51cf38"><Glyph kind="spark"/></span><Typography shuku-edit-id="e-7630f64d-65c0-4257-824f-649d8c62e5f9" as="strong" variant="h3" tone="inherit">术库</Typography></div>
      <Typography shuku-edit-id="e-fc4bbd40-ed3a-419c-8030-4dd00746541b" variant="bodySmall" tone="muted">{revised ? '从五子棋到卷积核' : ready ? '卷积核入门' : '新建知识呈现作品'}</Typography>
      <div shuku-edit-id="e-e2865da3-c47b-44fd-b788-df6550428416" className="cg-sim-toolbar-right"><Typography shuku-edit-id="e-98046555-236e-410c-a274-b55a1a10bc87" variant="bodySmall" tone="muted">模拟演示</Typography><Button aria-label="重新体验" onClick={replay}><Glyph kind="replay"/></Button></div>
    </header>
    <div shuku-edit-id="e-bc4301d8-9fff-4b48-b52f-461b20c3b3b9" className="cg-sim-workspace">
      <aside shuku-edit-id="e-40f46a1c-20c7-4066-8735-6c9507712834" className="cg-sim-sidebar">
        <Typography shuku-edit-id="e-af9996db-6c28-407b-a628-f7b4dcf79be1" variant="bodySmall" tone="inherit">{completed >= 5 ? '幻灯片' : '课程大纲'}</Typography>
        {ready ? <nav shuku-edit-id="e-0681cb6d-4e21-4c78-be2f-4d7b4b7d0d0d" ref={navigation} aria-label="模拟课程页面">{simulationOutline(revised).map((item,i) => <Button key={item.title} aria-current={page === item.index ? 'page' : undefined} active={page === item.index} onClick={() => { setPage(item.index); setBrowsing(revised); }} className="cg-sim-page-item"><Typography shuku-edit-id="e-ba60b82e-9e43-4cb9-9796-f09f24962963" as="span" variant="bodySmall" tone="muted">{String(i+1).padStart(2,'0')}</Typography><Typography shuku-edit-id="e-8ab6cb07-81e8-49c8-9823-08913709bf58" as="span" variant="bodySmall" tone="inherit">{item.title}</Typography></Button>)}</nav> : <Typography shuku-edit-id="e-70c2b305-485a-4fe9-87be-8e220c610615" className="cg-sim-sidebar-empty" variant="bodySmall" tone="muted">暂无页面</Typography>}
      </aside>
      <main shuku-edit-id="e-dbddcf64-a81f-454d-964f-b1b9786f59ce" className="cg-sim-main">
        <section shuku-edit-id="e-9a0ee22f-5c08-482e-9877-75eb7c7cf35e" className="cg-sim-preview" aria-label="实践作品预览">
          {ready ? <WorkflowSimulationPreview key={completed >= 5 ? `produced-${page}` : `${view}-${page}`} view={view} page={page} reviewed={completed >= 7} browsing={browsing}/> : <div shuku-edit-id="e-49217da2-fe58-4e99-a82b-7c359d878790" className="cg-sim-empty"><Typography shuku-edit-id="e-9b8ec7d1-bd76-4174-90ef-af980c528b5c" as="h2" variant="h2" tone="accent">从一个想法开始</Typography><Typography shuku-edit-id="e-7919fac6-691d-4b54-94db-266476fce43c" variant="bodySmall" tone="muted">在下方描述你想做的知识呈现作品</Typography></div>}
        </section>
        <section shuku-edit-id="e-7d57c71d-42bd-4f64-acef-d6082a7b2f17" className="cg-sim-agent" aria-label="智能体对话">
          <div shuku-edit-id="e-0d4b4d81-6a70-4ce2-ab20-5336c0eeb316" className="cg-sim-messages" ref={log} role="log" aria-label="对话记录" aria-live="polite" aria-busy={running}>
            {!messages.length && <Typography shuku-edit-id="e-f560f422-e0b4-4d9e-947c-089e68ad46b3" className="cg-sim-chat-empty" variant="bodySmall" tone="muted">你想让学生理解什么？</Typography>}
            {messages.map((message,i) => <div shuku-edit-id="e-65d0628a-ae26-4c38-ade2-3f2962457575" className="cg-sim-exchange" key={i}>
              <div shuku-edit-id="e-49dac3e7-f810-4823-85fb-b3d4eadadd67" className="cg-sim-user" aria-label="用户"><Typography shuku-edit-id="e-d8a4e8d0-4c34-4ace-a07b-77a0ee1ac4ec" variant="bodySmall" tone="inherit">{message.user}</Typography></div>
              <div shuku-edit-id="e-467be7b6-8dc1-4f8e-bec4-feac926f2e7c" className="cg-sim-assistant" aria-label="智能体"><span shuku-edit-id="e-aac413d5-99ec-4174-b43b-a3ebec1a26d6" className="cg-sim-avatar"><Glyph kind="spark"/></span><div shuku-edit-id="e-840f4d5f-b659-47c7-8b16-c08bbece60c2">
                {message.done ? <details shuku-edit-id="e-bbd391a7-13fc-446f-b7d5-3ac738cf5a39" className="cg-sim-work"><summary shuku-edit-id="e-7ad0e45c-0f59-4d80-b807-e580f3d2ef03"><Typography shuku-edit-id="e-696f0a38-1725-4971-a6fd-9c2938311fa1" as="span" variant="bodySmall" tone="muted">处理完成</Typography></summary>{turns[i].steps.map(step => <Typography shuku-edit-id="e-6c8f4f9a-db49-4291-9cc8-bcad97626c1f" key={step} variant="bodySmall" tone="muted">✓ {step}</Typography>)}</details> : <div shuku-edit-id="e-a061daf3-b345-48d1-a5d7-056b2a1e9cd9" className="cg-sim-work" role="status"><Typography shuku-edit-id="e-541373e7-1f34-493b-ab01-30774dd7c911" variant="bodySmall" tone="muted"><span shuku-edit-id="e-00e6a2f6-f0bc-4e13-8ec1-4809c98de9f5" className="cg-sim-working-dot"/> {message.reply ? '正在回复…' : turns[i].steps[Math.min(message.steps - 1, turns[i].steps.length - 1)] + '…'}</Typography></div>}
                {message.reply && <Typography shuku-edit-id="e-f84f277b-550a-48e0-969c-84d3d98ebf5f" variant="bodySmall" tone="inherit">{message.reply}</Typography>}
              </div></div>
            </div>)}
          </div>
          <div shuku-edit-id="e-5e2517ea-1f25-45b4-9a1b-29404b9eeda2" className="cg-sim-compose"><Typography shuku-edit-id="e-71daa6d9-83f4-4d73-805d-b9160ddb39d9" as="div" variant="bodySmall" tone="inherit"><TextInput aria-label="预设教学要求" value={running ? '正在处理…' : turn?.prompt ?? '实践创作完成'} readOnly onKeyDown={event => { if(event.key==='Enter') {event.preventDefault();send();} }}/></Typography><Button variant="primary" aria-label="发送教学要求" onClick={send} disabled={!turn || running}><Glyph kind="send"/></Button></div>
        </section>
      </main>
    </div>
  </article></GomokuLessonProvider>;
}
