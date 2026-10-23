import { useEffect, useRef, useState } from 'react';
import { Button, TextInput, Typography } from '../../shared/react';
import { WorkflowSimulationPreview } from '../components/workflow/WorkflowSimulationPreview';
import { simulationOutline, walkthroughTurns } from '../components/workflow/simulation';
import { GomokuLessonProvider } from '../components/workflow/copied-course/LessonContext';
import './CreationWorkflowPage.css';

type Message = { user: string; reply: string; steps: number; done: boolean };
const turns = walkthroughTurns;
function Glyph({ kind }: { kind: 'spark' | 'send' | 'replay' }) {
  const paths = { spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z', send: 'M12 20V4M5 11l7-7 7 7', replay: 'M4 10a8 8 0 1 1 1 8M4 4v6h6' };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]}/></svg>;
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
  return <GomokuLessonProvider key={runId}><article className="cg-workflow-page cg-creator-typography" aria-label="SceneDeck课件创作流程模拟" onKeyDown={event => {
    if (event.target instanceof Element && event.target.closest('button,input,textarea,svg,canvas,summary,.cg-sim-native') && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End',' '].includes(event.key)) event.stopPropagation();
  }}>
    <header className="cg-sim-toolbar">
      <div className="cg-sim-brand"><span><Glyph kind="spark"/></span><Typography as="strong" variant="h3" tone="inherit">SceneDeck</Typography></div>
      <Typography variant="bodySmall" tone="muted">{revised ? '从五子棋到卷积核' : ready ? '卷积核入门' : '新建课件'}</Typography>
      <div className="cg-sim-toolbar-right"><Typography variant="bodySmall" tone="muted">模拟演示</Typography><Button aria-label="重新体验" onClick={replay}><Glyph kind="replay"/></Button></div>
    </header>
    <div className="cg-sim-workspace">
      <aside className="cg-sim-sidebar">
        <Typography variant="bodySmall" tone="inherit">{completed >= 5 ? '幻灯片' : '课程大纲'}</Typography>
        {ready ? <nav ref={navigation} aria-label="模拟课程页面">{simulationOutline(revised).map((item,i) => <Button key={item.title} aria-current={page === item.index ? 'page' : undefined} active={page === item.index} onClick={() => { setPage(item.index); setBrowsing(revised); }} className="cg-sim-page-item"><Typography as="span" variant="bodySmall" tone="muted">{String(i+1).padStart(2,'0')}</Typography><Typography as="span" variant="bodySmall" tone="inherit">{item.title}</Typography></Button>)}</nav> : <Typography className="cg-sim-sidebar-empty" variant="bodySmall" tone="muted">暂无页面</Typography>}
      </aside>
      <main className="cg-sim-main">
        <section className="cg-sim-preview" aria-label="课件预览">
          {ready ? <WorkflowSimulationPreview key={completed >= 5 ? `produced-${page}` : `${view}-${page}`} view={view} page={page} reviewed={completed >= 7} browsing={browsing}/> : <div className="cg-sim-empty"><Typography as="h2" variant="h2" tone="accent">从一个想法开始</Typography><Typography variant="bodySmall" tone="muted">在下方描述你想做的课件</Typography></div>}
        </section>
        <section className="cg-sim-agent" aria-label="智能体对话">
          <div className="cg-sim-messages" ref={log} role="log" aria-label="对话记录" aria-live="polite" aria-busy={running}>
            {!messages.length && <Typography className="cg-sim-chat-empty" variant="bodySmall" tone="muted">你想让学生理解什么？</Typography>}
            {messages.map((message,i) => <div className="cg-sim-exchange" key={i}>
              <div className="cg-sim-user" aria-label="用户"><Typography variant="bodySmall" tone="inherit">{message.user}</Typography></div>
              <div className="cg-sim-assistant" aria-label="智能体"><span className="cg-sim-avatar"><Glyph kind="spark"/></span><div>
                {message.done ? <details className="cg-sim-work"><summary><Typography as="span" variant="bodySmall" tone="muted">处理完成</Typography></summary>{turns[i].steps.map(step => <Typography key={step} variant="bodySmall" tone="muted">✓ {step}</Typography>)}</details> : <div className="cg-sim-work" role="status"><Typography variant="bodySmall" tone="muted"><span className="cg-sim-working-dot"/> {message.reply ? '正在回复…' : turns[i].steps[Math.min(message.steps - 1, turns[i].steps.length - 1)] + '…'}</Typography></div>}
                {message.reply && <Typography variant="bodySmall" tone="inherit">{message.reply}</Typography>}
              </div></div>
            </div>)}
          </div>
          <div className="cg-sim-compose"><Typography as="div" variant="bodySmall" tone="inherit"><TextInput aria-label="预设教学要求" value={running ? '正在处理…' : turn?.prompt ?? '课件制作完成'} readOnly onKeyDown={event => { if(event.key==='Enter') {event.preventDefault();send();} }}/></Typography><Button variant="primary" aria-label="发送教学要求" onClick={send} disabled={!turn || running}><Glyph kind="send"/></Button></div>
        </section>
      </main>
    </div>
  </article></GomokuLessonProvider>;
}
