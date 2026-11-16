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
  return <svg shuku-edit-id="e-6dc3acb8-ca32-41a0-8f97-7fe5f8188963" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path shuku-edit-id="e-92296c68-ed3d-4511-a071-274dc2389668" d={paths[kind]}/></svg>;
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
  return <GomokuLessonProvider key={runId}><article shuku-edit-id="e-028b5f55-845b-4725-85e6-d83c1d7243ef" className="cg-workflow-page cg-creator-typography" aria-label="术库实践创作流程模拟" onKeyDown={event => {
    if (event.target instanceof Element && event.target.closest('button,input,textarea,svg,canvas,summary,.cg-sim-native') && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End',' '].includes(event.key)) event.stopPropagation();
  }}>
    <header shuku-edit-id="e-4390b345-c618-447f-bf1a-793c0bf31cd3" className="cg-sim-toolbar">
      <div shuku-edit-id="e-e86dd3dc-7fc4-44d9-8b65-5923387568fe" className="cg-sim-brand"><span shuku-edit-id="e-513e9f9e-e259-4d1a-8cad-5908bd2d82eb"><Glyph kind="spark"/></span><Typography shuku-edit-id="e-a45c8275-bba0-4cb0-b096-09a9798661e1" as="strong" variant="h3" tone="inherit">术库</Typography></div>
      <Typography shuku-edit-id="e-6ef98e97-0a9d-4e21-bae7-8c93a59ed3d6" variant="bodySmall" tone="muted">{revised ? '从五子棋到卷积核' : ready ? '卷积核入门' : '新建知识呈现作品'}</Typography>
      <div shuku-edit-id="e-9fcdd7d5-619e-4f58-8e95-1c27c41e4c59" className="cg-sim-toolbar-right"><Typography shuku-edit-id="e-0d37aabc-6e8b-43d6-a48a-f2f3fe042c1b" variant="bodySmall" tone="muted">模拟演示</Typography><Button aria-label="重新体验" onClick={replay}><Glyph kind="replay"/></Button></div>
    </header>
    <div shuku-edit-id="e-c138036d-fab0-4346-b9b0-81be2fecb7f1" className="cg-sim-workspace">
      <aside shuku-edit-id="e-319c592a-2a11-421d-8627-7c687bd76969" className="cg-sim-sidebar">
        <Typography shuku-edit-id="e-6e1b5ad3-0fbf-460b-948b-20e2fc917313" variant="bodySmall" tone="inherit">{completed >= 5 ? '幻灯片' : '课程大纲'}</Typography>
        {ready ? <nav shuku-edit-id="e-cc20e8b9-9437-493b-806b-338c56fa559e" ref={navigation} aria-label="模拟课程页面">{simulationOutline(revised).map((item,i) => <Button key={item.title} aria-current={page === item.index ? 'page' : undefined} active={page === item.index} onClick={() => { setPage(item.index); setBrowsing(revised); }} className="cg-sim-page-item"><Typography shuku-edit-id="e-694924cb-4055-4cfc-8e8e-79c0ecd8bd56" as="span" variant="bodySmall" tone="muted">{String(i+1).padStart(2,'0')}</Typography><Typography shuku-edit-id="e-4498fa6c-3428-4976-99d9-26364b39d01e" as="span" variant="bodySmall" tone="inherit">{item.title}</Typography></Button>)}</nav> : <Typography shuku-edit-id="e-e4a940ae-09a6-44e1-8a3d-0b3fb69dd934" className="cg-sim-sidebar-empty" variant="bodySmall" tone="muted">暂无页面</Typography>}
      </aside>
      <main shuku-edit-id="e-c9c41039-b094-4280-b92e-d870b4655b59" className="cg-sim-main">
        <section shuku-edit-id="e-2048972f-ce99-4956-b8e5-966db88b6ded" className="cg-sim-preview" aria-label="实践作品预览">
          {ready ? <WorkflowSimulationPreview key={completed >= 5 ? `produced-${page}` : `${view}-${page}`} view={view} page={page} reviewed={completed >= 7} browsing={browsing}/> : <div shuku-edit-id="e-4f145222-43d3-4f10-843e-ceb043adf1d6" className="cg-sim-empty"><Typography shuku-edit-id="e-2ad6e14c-1a67-4af6-91b7-3fc4e0775479" as="h2" variant="h2" tone="accent">从一个想法开始</Typography><Typography shuku-edit-id="e-73d7960d-80b7-439b-87ce-82f8298852a0" variant="bodySmall" tone="muted">在下方描述你想做的知识呈现作品</Typography></div>}
        </section>
        <section shuku-edit-id="e-6edfbb1e-bbaf-4ffa-83f3-c728f4061d52" className="cg-sim-agent" aria-label="智能体对话">
          <div shuku-edit-id="e-559a0b13-0e5b-43e3-b220-f1b10f28add3" className="cg-sim-messages" ref={log} role="log" aria-label="对话记录" aria-live="polite" aria-busy={running}>
            {!messages.length && <Typography shuku-edit-id="e-a80ab0d3-06e6-4464-b4b8-4c17a1f505ec" className="cg-sim-chat-empty" variant="bodySmall" tone="muted">你想让学生理解什么？</Typography>}
            {messages.map((message,i) => <div shuku-edit-id="e-e603fd8e-7317-4ca7-b72f-fa8351a184e0" className="cg-sim-exchange" key={i}>
              <div shuku-edit-id="e-078e2fed-d7a2-4f81-a5d9-05765a119161" className="cg-sim-user" aria-label="用户"><Typography shuku-edit-id="e-28af0cf0-c182-43a4-b09a-ca094fd4df3d" variant="bodySmall" tone="inherit">{message.user}</Typography></div>
              <div shuku-edit-id="e-499a9c42-5f52-441b-97bf-f4d3a3b65725" className="cg-sim-assistant" aria-label="智能体"><span shuku-edit-id="e-21103119-aae9-497b-8960-9b1f6f32bb8f" className="cg-sim-avatar"><Glyph kind="spark"/></span><div shuku-edit-id="e-11c7e12e-e1ff-4751-a973-96c21ea84b66">
                {message.done ? <details shuku-edit-id="e-b0bbc727-bd1d-46e7-95dc-9785c2cde0ce" className="cg-sim-work"><summary shuku-edit-id="e-2bd7acc7-8a6b-45fd-a27d-cee0ccb66cec"><Typography shuku-edit-id="e-ad4a206a-f45c-4fae-a40c-c11014c7f46c" as="span" variant="bodySmall" tone="muted">处理完成</Typography></summary>{turns[i].steps.map(step => <Typography shuku-edit-id="e-43ed8bf3-7545-4084-92de-6d6d6cc4d66f" key={step} variant="bodySmall" tone="muted">✓ {step}</Typography>)}</details> : <div shuku-edit-id="e-04d202c2-a574-466f-ad0b-ac1e6f4bde95" className="cg-sim-work" role="status"><Typography shuku-edit-id="e-af7d8bfe-0f2e-4d6b-b2bf-d182cd7aad0e" variant="bodySmall" tone="muted"><span shuku-edit-id="e-c079450a-7836-4774-9451-b296be4d5927" className="cg-sim-working-dot"/> {message.reply ? '正在回复…' : turns[i].steps[Math.min(message.steps - 1, turns[i].steps.length - 1)] + '…'}</Typography></div>}
                {message.reply && <Typography shuku-edit-id="e-b964bd67-5b71-47f1-bf8d-53c4196c8d0b" variant="bodySmall" tone="inherit">{message.reply}</Typography>}
              </div></div>
            </div>)}
          </div>
          <div shuku-edit-id="e-50df8ab0-6ca4-4752-a19c-f2ea232ab1c6" className="cg-sim-compose"><Typography shuku-edit-id="e-9976afbd-70b5-4d24-8d97-a72cda55d202" as="div" variant="bodySmall" tone="inherit"><TextInput aria-label="预设教学要求" value={running ? '正在处理…' : turn?.prompt ?? '实践创作完成'} readOnly onKeyDown={event => { if(event.key==='Enter') {event.preventDefault();send();} }}/></Typography><Button variant="primary" aria-label="发送教学要求" onClick={send} disabled={!turn || running}><Glyph kind="send"/></Button></div>
        </section>
      </main>
    </div>
  </article></GomokuLessonProvider>;
}
