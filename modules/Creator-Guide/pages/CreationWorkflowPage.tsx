import { useEffect, useId, useRef, useState } from 'react';
import { Button, ContentBlock, TextInput, Typography } from '../../shared/react';
import { WorkflowArtifactCard, WorkflowBrowser, CaoChongPreview } from '../components/WorkflowPreview';
import { workflowStages, type WorkflowArtifact } from '../components/workflowDemo';
import './CreationWorkflowPage.css';

type Phase = 'typing' | 'ready' | 'thinking' | 'streaming' | 'settling' | 'complete';
interface Exchange { turn: number; user: string; reply: string; done: boolean; }
interface Session { turn: number; phase: Phase; draft: string; activity: number; exchanges: Exchange[]; }
const emptySession = (): Session => ({ turn: 0, phase: 'typing', draft: '', activity: 0, exchanges: [] });
function Glyph({ kind }: { kind: 'send' | 'file' | 'folder' | 'agent' | 'replay' | 'close' }) {
  const paths = { send:'M12 20V4M5 11l7-7 7 7', file:'M6 3h8l4 4v14H6ZM14 3v5h4M9 12h6M9 16h6', folder:'M3 6h7l2 3h9v11H3Z', agent:'M12 2 21 7v10l-9 5-9-5V7ZM3 7l9 5 9-5M12 12v10', replay:'M4 10a8 8 0 1 1 1 8M4 4v6h6', close:'m6 6 12 12M18 6 6 18' };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]}/></svg>;
}
export function CreationWorkflowPage() {
  const uid = useId();
  const [selected, setSelected] = useState(0);
  const [introOpen, setIntroOpen] = useState(true);
  const [introLeaving, setIntroLeaving] = useState(false);
  const introButton = useRef<HTMLDivElement>(null);
  const [sessions, setSessions] = useState<Session[]>(() => workflowStages.map(emptySession));
  const [visible, setVisible] = useState(false);
  const [preview, setPreview] = useState<WorkflowArtifact | null>(null);
  const surface = useRef<HTMLDivElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const dialog = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const phase = sessions[selected];
  const stage = workflowStages[selected];
  const turn = stage.turns[phase.turn];
  const busy = phase.phase === 'thinking' || phase.phase === 'streaming' || phase.phase === 'settling';
  const reducedMotion = useRef(false);
  useEffect(() => {
    const mount = surface.current;
    if (!mount) return;
    let inView = false;
    const update = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); }, { threshold: .15 });
    observer.observe(mount);
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => { reducedMotion.current = preference.matches; };
    motion(); preference.addEventListener('change', motion);
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); preference.removeEventListener('change', motion); document.removeEventListener('visibilitychange', update); };
  }, []);
  useEffect(() => {
    if (!introOpen || !visible) return;
    const button = introButton.current?.querySelector<HTMLButtonElement>('button');
    button?.focus({ preventScroll: true });
    const trap = (event: KeyboardEvent) => {
      if (event.key === 'Tab') { event.preventDefault(); event.stopPropagation(); button?.focus(); }
    };
    document.addEventListener('keydown', trap, true);
    return () => document.removeEventListener('keydown', trap, true);
  }, [introOpen, visible]);
  useEffect(() => {
    if (!introLeaving) return;
    const timer = window.setTimeout(() => {
      setIntroOpen(false);
    }, reducedMotion.current ? 0 : 320);
    return () => window.clearTimeout(timer);
  }, [introLeaving]);
  useEffect(() => {
    if (!introOpen) surface.current?.parentElement?.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]')?.focus({ preventScroll: true });
  }, [introOpen]);
  const update = (apply: (current: Session) => Session) => setSessions(previous => previous.map((session, i) => i === selected ? apply(session) : session));
  useEffect(() => {
    if (!visible || introOpen || preview || !turn) return;
    let delay = 32;
    if (phase.phase === 'thinking') delay = 520;
    if (phase.phase === 'settling') delay = 1300;
    if (phase.phase === 'ready' || phase.phase === 'complete') return;
    const timer = window.setTimeout(() => {
      setSessions(previous => previous.map((session, i) => {
        if (i !== selected) return session;
        if (session.phase === 'typing') {
          const draft = turn.prompt.slice(0, reducedMotion.current ? undefined : session.draft.length + 3);
          return { ...session, draft, phase: draft === turn.prompt ? 'ready' : 'typing' };
        }
        if (session.phase === 'thinking') return session.activity + 1 < turn.activity.length ? { ...session, activity: session.activity + 1 } : { ...session, phase: 'streaming' };
        if (session.phase === 'streaming') {
          const exchanges = session.exchanges.map((item, j) => {
            if (j !== session.exchanges.length - 1) return item;
            const reply = turn.reply.slice(0, reducedMotion.current ? undefined : item.reply.length + (item.reply.length % 7 === 0 ? 5 : 3));
            return { ...item, reply, done: reply === turn.reply };
          });
          return { ...session, exchanges, phase: exchanges.at(-1)!.done ? 'settling' : 'streaming' };
        }
        if (session.phase === 'settling') return session.turn + 1 < workflowStages[selected].turns.length ? { ...session, turn: session.turn + 1, draft: '', activity: 0, phase: 'typing' } : { ...session, draft: '', phase: 'complete' };
        return session;
      }));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [selected, phase, visible, preview, turn, introOpen]);
  useEffect(() => {
    if (log.current && follow.current) log.current.scrollTop = log.current.scrollHeight;
  }, [selected, phase.exchanges, phase.phase]);
  useEffect(() => {
    const input = surface.current?.querySelector<HTMLTextAreaElement>('textarea');
    if (input && phase.phase === 'typing') {
      input.setSelectionRange(input.value.length, input.value.length);
      input.scrollTop = input.scrollHeight;
    }
  }, [phase.draft, phase.phase]);
  useEffect(() => {
    if (!preview) return;
    const mount = dialog.current;
    const focusable = () => Array.from(mount?.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input, [tabindex="0"]') ?? []);
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setPreview(null); }
      if (event.key === 'Tab') {
        const items = focusable(), first = items[0], last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => { document.removeEventListener('keydown', onKey, true); returnFocus.current?.focus(); };
  }, [preview]);
  const open = (artifact: WorkflowArtifact) => { returnFocus.current = document.activeElement as HTMLElement; setPreview(artifact); };
  const chooseStage = (index: number) => { setSelected(index); follow.current = true; };
  const send = () => {
    if (phase.phase !== 'ready') return;
    follow.current = true;
    update(current => ({ ...current, draft: '', phase: 'thinking', activity: 0, exchanges: [...current.exchanges, { turn: current.turn, user: current.draft, reply: '', done: false }] }));
  };
  const latestArtifact = [...phase.exchanges].reverse().find(exchange => exchange.done && stage.turns[exchange.turn].artifact);
  const lastFile = [...phase.exchanges].reverse().find(exchange => exchange.done && stage.turns[exchange.turn].file);
  const isDesign = preview?.startsWith('design');
  return <ContentBlock className="cg-workflow-page cg-creator-typography" aria-label="模拟体验课件制作流程" bodyClassName="cg-workflow-body">
    <div className="cg-workflow-tabs" inert={introOpen} role="tablist" aria-label="创作流程">{workflowStages.map((item, i) => <Button key={item.title} role="tab" id={uid+'-tab-'+i} aria-selected={selected === i} aria-controls={uid+'-conversation'} tabIndex={selected === i ? 0 : -1} active={selected === i} className="cg-workflow-tab" onClick={() => chooseStage(i)} onKeyDown={event => {
      const index = event.key === 'ArrowRight' ? (i + 1) % 3 : event.key === 'ArrowLeft' ? (i + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : null;
      if (index !== null) { event.preventDefault(); chooseStage(index); (event.currentTarget.parentElement?.children[index] as HTMLElement)?.focus(); }
    }}><Typography as="span" variant="h3" tone="inherit" className="cg-workflow-step">{i + 1}</Typography><Typography as="span" variant="h3" tone="inherit">{item.title}</Typography></Button>)}</div>
    <div className="cg-workflow-window" ref={surface} inert={introOpen}>
      <div className="cg-workflow-toolbar"><div className="cg-workflow-window-title"><span className="cg-workflow-traffic" aria-hidden="true"><i/><i/><i/></span><Glyph kind="agent"/><Typography variant="bodySmall" tone="accent">Codex</Typography></div><div className="cg-workflow-toolbar-actions"><Typography variant="bodySmall" tone="muted">{busy ? '正在处理' : '协作演示'}</Typography><Button aria-label="重新播放当前阶段" title="重新播放当前阶段" className="cg-workflow-replay" onClick={() => { follow.current = true; update(emptySession); }}><Glyph kind="replay"/></Button></div></div>
      <div className="cg-workflow-workspace">
        <aside className="cg-workflow-sidebar"><div className="cg-workflow-project"><Glyph kind="folder"/><Typography variant="bodySmall" tone="accent">Regression-Loss</Typography></div><div className="cg-workflow-skill"><Glyph kind="folder"/><Typography variant="bodySmall" tone="muted">creator-skill</Typography></div><Button className="cg-workflow-file is-active" onClick={() => open(selected === 0 && !phase.exchanges.some(e => e.done && e.turn >= 1) ? 'outline-first' : 'outline-revised')}><Glyph kind="file"/><Typography variant="bodySmall" tone="accent" wrap="truncate">outlines.json</Typography></Button><Button className="cg-workflow-file" onClick={() => open(latestArtifact ? stage.turns[latestArtifact.turn].artifact! : 'design-revised')}><Glyph kind="file"/><Typography variant="bodySmall" tone="muted" wrap="truncate">{selected === 0 ? '01 曹冲称象' : stage.file}</Typography></Button><div className="cg-workflow-sidebar-pages">{['01 曹冲称象', '02 石头不够，如何估重？', '03 预测误差'].map((title, i) => <div key={title}><Glyph kind="file"/><Typography variant="bodySmall" tone="muted">{title}</Typography>{i === 0 && selected > 0 && <span className="cg-workflow-file-dot"/>}</div>)}</div>{lastFile && <div className="cg-workflow-saved"><span className="cg-workflow-save-dot"/><Typography variant="bodySmall" tone="success">更改已保存</Typography></div>}</aside>
        <section className="cg-workflow-conversation" id={uid+'-conversation'} role="tabpanel" aria-labelledby={uid+'-tab-'+selected}>
          <div className="cg-workflow-log" ref={log} onScroll={() => { const node = log.current; if (node) follow.current = node.scrollHeight - node.scrollTop - node.clientHeight < 100; }}>
            {!phase.exchanges.length && <div className="cg-workflow-welcome"><div className="cg-workflow-welcome-icon"><Glyph kind="agent"/></div><Typography variant="h2" tone="accent">{selected === 0 ? '从一个想法开始' : selected === 1 ? '把想法做成第一页' : '用学习者的顺序走一遍'}</Typography><Typography variant="bodySmall" tone="muted">{selected === 0 ? '曹冲称象 · 回归与损失' : selected === 1 ? '设计图 → 反馈 → 页面 → 修复' : '浏览课件 → 发现问题 → 再次确认'}</Typography></div>}
            {phase.exchanges.map((exchange, index) => {
              const item = stage.turns[exchange.turn];
              return <div className="cg-workflow-exchange" key={exchange.turn}><div className="cg-workflow-user-message"><Typography variant="bodySmall" tone="inherit">{exchange.user}</Typography></div><div className="cg-workflow-agent-message"><span className="cg-workflow-agent-avatar"><Glyph kind="agent"/></span><div className="cg-workflow-agent-content">{!exchange.reply && index === phase.exchanges.length - 1 ? <div className="cg-workflow-thinking"><span className="cg-workflow-spinner"/><Typography variant="bodySmall" tone="muted">{item.activity[phase.activity]}…</Typography></div> : <Typography variant="bodySmall" tone="inherit">{exchange.reply}{!exchange.done && <span className="cg-workflow-caret"/>}</Typography>}{exchange.done && item.artifact && <WorkflowArtifactCard artifact={item.artifact} onOpen={open}/>} {exchange.done && item.file && <div className="cg-workflow-file-change"><Glyph kind="file"/><Typography variant="bodySmall" tone="success">{item.file}</Typography><Typography variant="bodySmall" tone="muted">已保存</Typography></div>}</div></div></div>;
            })}
            {phase.phase === 'complete' && <div className="cg-workflow-stage-complete"><Typography variant="bodySmall" tone="success">{selected === 0 ? '大纲已确认' : selected === 1 ? '第一页已确认' : '本轮核验已完成'}</Typography>{selected < 2 && <Button onClick={() => chooseStage(selected + 1)}>进入{workflowStages[selected + 1].title} →</Button>}</div>}
          </div>
          <div className="cg-workflow-composer"><TextInput multiline rows={2} aria-label="演示提示词，点击发送继续对话" value={phase.draft} readOnly placeholder={busy ? 'Codex 正在回复…' : phase.phase === 'complete' ? '本阶段已完成' : '正在输入…'} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }}/><div className="cg-workflow-composer-bottom"><div className="cg-workflow-context"><Typography as="span" variant="bodySmall" tone="muted"><Glyph kind="file"/> Creators’ Skills</Typography><Typography as="span" variant="bodySmall" tone="muted"><Glyph kind="folder"/> Regression-Loss</Typography></div><Button variant="primary" className="cg-workflow-send" aria-label="发送提示词" title="发送 · Enter" disabled={phase.phase !== 'ready'} onClick={send}><Glyph kind="send"/></Button></div></div>
        </section>
      </div>
      {preview && <div className="cg-workflow-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setPreview(null); }}><div ref={dialog} className="cg-workflow-modal" role="dialog" aria-modal="true" aria-label={isDesign ? '设计示意图预览' : '课件网页预览'}><div className="cg-workflow-modal-heading"><Typography variant="bodySmall" tone="accent">{isDesign ? '第一页 · 设计示意图 '+(preview === 'design-first' ? '01' : '02') : preview.startsWith('outline') ? '课程大纲 · outlines.json' : '页面预览'}</Typography><Button aria-label="关闭预览，返回对话" onClick={() => setPreview(null)}><Glyph kind="close"/></Button></div>{isDesign ? <CaoChongPreview firstDesign={preview === 'design-first'}/> : preview.startsWith('outline') ? <WorkflowArtifactCard artifact={preview} onOpen={open}/> : <WorkflowBrowser artifact={preview}/>}</div></div>}
    </div>
    {introOpen && <div className={'cg-workflow-intro'+(introLeaving ? ' is-leaving' : '')} role="dialog" aria-modal="true" aria-labelledby={uid+'-intro-title'} aria-describedby={uid+'-intro-description'}><div className="cg-workflow-intro-band"><span className="cg-workflow-intro-emblem" aria-hidden="true"><Glyph kind="agent"/></span><Typography id={uid+'-intro-title'} variant="display" tone="inherit">制作体验</Typography><Typography id={uid+'-intro-description'} variant="subtitle" tone="inherit">模拟体验一次课件制作过程</Typography><div className="cg-workflow-intro-route">{['设计大纲','逐页制作','人工核验'].map((label,i)=><div key={label}><span className="cg-workflow-intro-dot" aria-hidden="true"/><Typography variant="bodySmall" tone="muted">{label}</Typography>{i<2&&<span className="cg-workflow-intro-connector" aria-hidden="true"/>}</div>)}</div><div ref={introButton} className="cg-workflow-intro-action"><Button className="cg-workflow-intro-confirm" disabled={introLeaving} onClick={() => setIntroLeaving(true)}>开始体验 <span aria-hidden="true">→</span></Button></div></div></div>}
  </ContentBlock>;
}
