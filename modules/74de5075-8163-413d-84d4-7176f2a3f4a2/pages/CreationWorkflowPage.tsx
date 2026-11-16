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
  return <svg shuku-edit-id="e-91e2a674-2cd3-4441-b1c5-8499f5c4221e" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path shuku-edit-id="e-c3429e07-4ae9-4586-a5c0-dd501dfc8e05" d={paths[kind]}/></svg>;
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
  return <GomokuLessonProvider key={runId}><article shuku-edit-id="e-d3220226-6a95-4a48-8a3a-569dcb67034b" className="cg-workflow-page cg-creator-typography" aria-label="术库实践创作流程模拟" onKeyDown={event => {
    if (event.target instanceof Element && event.target.closest('button,input,textarea,svg,canvas,summary,.cg-sim-native') && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End',' '].includes(event.key)) event.stopPropagation();
  }}>
    <header shuku-edit-id="e-7ddd31fc-cab6-41bb-9965-7bf86941d279" className="cg-sim-toolbar">
      <div shuku-edit-id="e-df5fe806-85dd-40c8-b9ae-3e4d7d1a7b91" className="cg-sim-brand"><span shuku-edit-id="e-a7aca2f3-bc4c-4d2e-9b29-5121ce5734a8"><Glyph kind="spark"/></span><Typography shuku-edit-id="e-fc06221d-5a28-45e4-a438-0953ef649721" as="strong" variant="h3" tone="inherit">术库</Typography></div>
      <Typography shuku-edit-id="e-bc8f8fa9-9db3-4dc9-bd66-6ef6d4089691" variant="bodySmall" tone="muted">{revised ? '从五子棋到卷积核' : ready ? '卷积核入门' : '新建知识呈现作品'}</Typography>
      <div shuku-edit-id="e-e611e795-b174-40e1-938b-ed45b9e4200e" className="cg-sim-toolbar-right"><Typography shuku-edit-id="e-5c69e070-b19a-40e1-a4af-6bb7a5cd6025" variant="bodySmall" tone="muted">模拟演示</Typography><Button aria-label="重新体验" onClick={replay}><Glyph kind="replay"/></Button></div>
    </header>
    <div shuku-edit-id="e-743b9f61-3fda-4a2a-92c4-ea044bbbc1f5" className="cg-sim-workspace">
      <aside shuku-edit-id="e-61f06c96-5f73-483b-8800-186b9dbc702a" className="cg-sim-sidebar">
        <Typography shuku-edit-id="e-17641581-8710-4c72-8227-0fb285a2a610" variant="bodySmall" tone="inherit">{completed >= 5 ? '幻灯片' : '课程大纲'}</Typography>
        {ready ? <nav shuku-edit-id="e-48b4acab-3fb9-4e96-91b0-19318e1637c6" ref={navigation} aria-label="模拟课程页面">{simulationOutline(revised).map((item,i) => <Button key={item.title} aria-current={page === item.index ? 'page' : undefined} active={page === item.index} onClick={() => { setPage(item.index); setBrowsing(revised); }} className="cg-sim-page-item"><Typography shuku-edit-id="e-c5bd1ffe-b647-4632-9d31-a524d27730d4" as="span" variant="bodySmall" tone="muted">{String(i+1).padStart(2,'0')}</Typography><Typography shuku-edit-id="e-1200d2f9-fddb-4e76-95ec-9137f774720c" as="span" variant="bodySmall" tone="inherit">{item.title}</Typography></Button>)}</nav> : <Typography shuku-edit-id="e-e204b589-ba3b-4a9a-9a1c-17782b00a53b" className="cg-sim-sidebar-empty" variant="bodySmall" tone="muted">暂无页面</Typography>}
      </aside>
      <main shuku-edit-id="e-e2481ae6-eaa4-462c-bdd3-08c204224ff7" className="cg-sim-main">
        <section shuku-edit-id="e-290f72ca-5fe1-4206-b3bf-4b471f87043b" className="cg-sim-preview" aria-label="实践作品预览">
          {ready ? <WorkflowSimulationPreview key={completed >= 5 ? `produced-${page}` : `${view}-${page}`} view={view} page={page} reviewed={completed >= 7} browsing={browsing}/> : <div shuku-edit-id="e-413ef0a1-3fe8-43c6-b539-250df520f5c8" className="cg-sim-empty"><Typography shuku-edit-id="e-bd7a9f60-0ff6-4224-82ee-10012fccb69b" as="h2" variant="h2" tone="accent">从一个想法开始</Typography><Typography shuku-edit-id="e-c0b12fcb-7cc6-4266-a976-b17cf6b3254e" variant="bodySmall" tone="muted">在下方描述你想做的知识呈现作品</Typography></div>}
        </section>
        <section shuku-edit-id="e-f9b8a69c-c1eb-4242-945a-4ca56f532ce8" className="cg-sim-agent" aria-label="智能体对话">
          <div shuku-edit-id="e-db597ccc-3669-41d1-9ba5-ce718a028dbd" className="cg-sim-messages" ref={log} role="log" aria-label="对话记录" aria-live="polite" aria-busy={running}>
            {!messages.length && <Typography shuku-edit-id="e-c2f5a908-58e6-4535-843d-9c8797febe8f" className="cg-sim-chat-empty" variant="bodySmall" tone="muted">你想让学生理解什么？</Typography>}
            {messages.map((message,i) => <div shuku-edit-id="e-7d9b3fc2-0417-4204-a0a3-c47e0f437aa0" className="cg-sim-exchange" key={i}>
              <div shuku-edit-id="e-f1e03936-40b5-4410-abfe-fd1dac91a17b" className="cg-sim-user" aria-label="用户"><Typography shuku-edit-id="e-362e991c-0498-4a78-828a-c8cd8568e23d" variant="bodySmall" tone="inherit">{message.user}</Typography></div>
              <div shuku-edit-id="e-bd05aad2-6e88-4ec2-a601-1aaaa7298d40" className="cg-sim-assistant" aria-label="智能体"><span shuku-edit-id="e-b7277cdb-54e7-4b1d-b06f-defafc970267" className="cg-sim-avatar"><Glyph kind="spark"/></span><div shuku-edit-id="e-cde9d7e0-b356-4482-83f6-0abd4bbf8f59">
                {message.done ? <details shuku-edit-id="e-950a3f2a-c1c1-490a-9e6d-698d1545ce36" className="cg-sim-work"><summary shuku-edit-id="e-6044761f-89f3-41b7-8e75-005dffe213eb"><Typography shuku-edit-id="e-e7394d9e-338f-42cc-9097-8b3ebad234c3" as="span" variant="bodySmall" tone="muted">处理完成</Typography></summary>{turns[i].steps.map(step => <Typography shuku-edit-id="e-55504b04-3049-41e5-9b37-0d74fd3c065b" key={step} variant="bodySmall" tone="muted">✓ {step}</Typography>)}</details> : <div shuku-edit-id="e-60b219cc-e159-4402-acc5-ce2a2ad53a49" className="cg-sim-work" role="status"><Typography shuku-edit-id="e-0ae870bf-d77c-44dd-ab05-255d96f7b2bb" variant="bodySmall" tone="muted"><span shuku-edit-id="e-3188e262-aaa0-42ae-97ee-b16a745cea3b" className="cg-sim-working-dot"/> {message.reply ? '正在回复…' : turns[i].steps[Math.min(message.steps - 1, turns[i].steps.length - 1)] + '…'}</Typography></div>}
                {message.reply && <Typography shuku-edit-id="e-2561c69c-aa7a-4318-a99f-df03df86ed81" variant="bodySmall" tone="inherit">{message.reply}</Typography>}
              </div></div>
            </div>)}
          </div>
          <div shuku-edit-id="e-dc99341e-5708-4bcf-8af2-85bed447830c" className="cg-sim-compose"><Typography shuku-edit-id="e-20585748-7571-4a99-a500-f55474b4009f" as="div" variant="bodySmall" tone="inherit"><TextInput aria-label="预设教学要求" value={running ? '正在处理…' : turn?.prompt ?? '实践创作完成'} readOnly onKeyDown={event => { if(event.key==='Enter') {event.preventDefault();send();} }}/></Typography><Button variant="primary" aria-label="发送教学要求" onClick={send} disabled={!turn || running}><Glyph kind="send"/></Button></div>
        </section>
      </main>
    </div>
  </article></GomokuLessonProvider>;
}
