import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button, Typography } from '../../../shared/react';
import { AttentionActivity, ChoiceButtons, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { DECODING_STEP_SNAPSHOT as snapshot } from '../../model/decodingStepSnapshot';
import './AttentionDecodingStepPage.css';

type Phase = 1 | 2 | 3 | 4;
type VectorKind = 'word' | 'context' | 'state' | 'input' | 'output';
const DURATION = 3200;
const descriptions = [
  'ATT 决定读取比例，汇聚得到 Context。',
  '前词的词向量，与 Context 拼接。',
  '输入与旧状态一起，更新解码状态。',
  '新状态和 Context，共同决定下一个词。',
];
const input = [...snapshot.wordEmbedding, ...snapshot.context];
const outputInput = [...snapshot.decoderState, ...snapshot.context];
const place = (x: number, y: number, width: number, height: number): CSSProperties => ({ left: `${x / 1488 * 100}%`, top: `${y / 480 * 100}%`, width: `${width / 1488 * 100}%`, height: `${height / 480 * 100}%` });
function vectorColor(kind: VectorKind, index: number) {
  if (kind === 'word' || (kind === 'input' && index < 3)) return 'var(--ui-accent-alt-rgb)';
  if (kind === 'context' || kind === 'input' || (kind === 'output' && index >= 4)) return 'var(--ui-success-rgb)';
  return 'var(--ui-accent-rgb)';
}
function Vector({ values, kind, label, anchor }: { values: readonly number[]; kind: VectorKind; label: string; anchor: string }) {
  return <span className="attn-decode-cells" role="img" aria-label={label} data-vector={kind} data-flow-anchor={anchor} style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}>
    {values.map((value, index) => <span key={index} data-value={value} style={{ background: `rgba(${vectorColor(kind, index)}, ${.22 + .78 * Math.min(1, Math.abs(value))})` }}/>)}</span>;
}
function Group({ x, y, width, height, children, className = '', anchor }: { x: number; y: number; width: number; height: number; children: ReactNode; className?: string; anchor?: string }) {
  return <div className={`attn-decode-object ${className}`} style={place(x, y, width, height)} data-flow-anchor={anchor}>{children}</div>;
}
type Port = { anchor: string; side: 'left' | 'right' | 'top' | 'bottom'; fraction?: number; cells?: readonly [number, number] };
type Connection = { name: string; from: Port; to: Port; color?: string; width?: number; active?: boolean };
type Point = { x: number; y: number };
const portDirection = { left: [-1, 0], right: [1, 0], top: [0, -1], bottom: [0, 1] } as const;
function connectionPath(from: Point, to: Point, link: Connection) {
  const distance = Math.max(48, Math.min(150, Math.hypot(to.x - from.x, to.y - from.y) * .45));
  const start = portDirection[link.from.side];
  const end = portDirection[link.to.side];
  return `M${from.x} ${from.y}C${from.x + start[0] * distance} ${from.y + start[1] * distance} ${to.x + end[0] * distance} ${to.y + end[1] * distance} ${to.x} ${to.y}`;
}
function Edges({ id, connections }: { id: string; connections: readonly Connection[] }) {
  const svg = useRef<SVGSVGElement>(null);
  const [paths, setPaths] = useState<Record<string, string>>({});
  useLayoutEffect(() => {
    const surface = svg.current;
    const scene = surface?.parentElement;
    if (!surface || !scene) return;
    const anchors = new Map(Array.from(scene.querySelectorAll<HTMLElement>('[data-flow-anchor]'), element => [element.dataset.flowAnchor!, element]));
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const bounds = surface.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const point = (port: Port): Point | undefined => {
        const element = anchors.get(port.anchor);
        if (!element) return;
        const nodes = port.cells ? Array.from(element.children).slice(port.cells[0], port.cells[1]) : [element];
        if (!nodes.length) return;
        const rects = nodes.map(node => node.getBoundingClientRect());
        const left = Math.min(...rects.map(rect => rect.left));
        const right = Math.max(...rects.map(rect => rect.right));
        const top = Math.min(...rects.map(rect => rect.top));
        const bottom = Math.max(...rects.map(rect => rect.bottom));
        const fraction = port.fraction ?? .5;
        const x = port.side === 'left' ? left : port.side === 'right' ? right : left + (right - left) * fraction;
        const y = port.side === 'top' ? top : port.side === 'bottom' ? bottom : top + (bottom - top) * fraction;
        // Map actual DOM edges into the shared logical canvas, including Guide/PPT scaling.
        return { x: Math.round((x - bounds.left) * 1488 / bounds.width * 100) / 100, y: Math.round((y - bounds.top) * 480 / bounds.height * 100) / 100 };
      };
      const next: Record<string, string> = {};
      connections.forEach(link => {
        const from = point(link.from);
        const to = point(link.to);
        if (from && to) next[link.name] = connectionPath(from, to, link);
      });
      setPaths(previous => Object.keys(previous).length === Object.keys(next).length && Object.keys(next).every(key => next[key] === previous[key]) ? previous : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(surface);
    anchors.forEach(anchor => observer.observe(anchor));
    document.fonts.ready.then(measure);
    document.fonts.addEventListener('loadingdone', measure);
    window.addEventListener('resize', measure);
    return () => { disposed = true; observer.disconnect(); document.fonts.removeEventListener('loadingdone', measure); window.removeEventListener('resize', measure); };
  }, [connections]);
  return <svg ref={svg} className="attn-decode-lines" viewBox="0 0 1488 480" preserveAspectRatio="none" aria-hidden="true">
    <defs><marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto"><path d="M1 1L9 5L1 9" stroke="context-stroke" strokeWidth="2" fill="none"/></marker></defs>
    {connections.map(({ name, from, to, color = 'var(--ui-accent)', width = 3, active = true }) => paths[name] && <g key={name} data-connection={name} data-from={JSON.stringify(from)} data-to={JSON.stringify(to)} className={active ? '' : 'is-muted'} style={{ color }}>
      <path d={paths[name]} markerEnd={`url(#${id})`} fill="none" stroke="currentColor" strokeWidth={width} className="attn-decode-wire"/>
      {active && <path d={paths[name]} pathLength="1" fill="none" stroke="currentColor" strokeWidth={width + 4} className="attn-decode-travel"/>}
    </g>)}
  </svg>;
}
function ReadingScene({ id, selected, select }: { id: string; selected: number; select: (index: number) => void }) {
  return <>
    <Edges id={id} connections={[
      { name: 'query-matching', from: { anchor: 'query', side: 'right' }, to: { anchor: 'source-bank', side: 'left', fraction: .72 } },
      ...snapshot.weights.map((weight, index): Connection => ({ name: `weighted-value-${index}`, from: { anchor: `value-${index}`, side: 'bottom' }, to: { anchor: 'context', side: 'top' }, color: 'var(--ui-success)', width: 2 + 9 * weight, active: index === selected })),
    ]}/>
    <Group x={35} y={50} width={250} height={160}><Typography variant="h3" tone="accent">Q · 状态投影</Typography><Vector anchor="query" values={snapshot.projectedQuery} kind="state" label="用于匹配的三维查询"/></Group>
    <Group x={350} y={0} width={1040} height={48}><Typography variant="bodySmall" tone="muted">原词 · K 匹配，V 读取</Typography></Group>
    <div className="attn-decode-source" data-flow-anchor="source-bank" style={place(350, 65, 1040, 135)} role="group" aria-label="选择原词，突出它对Context的贡献">
      {snapshot.sourceTokens.map((word, index) => <Button key={word} className={`attn-decode-source-word${selected === index ? ' is-selected' : ''}`} style={{ background: `rgba(var(--ui-accent-rgb), ${.06 + .88 * snapshot.weights[index]})`, color: snapshot.weights[index] >= .46 ? 'var(--ui-bg-card)' : 'var(--ui-text-main)' }} aria-label={`${word}，读取比例${(snapshot.weights[index] * 100).toFixed(1)}%`} aria-pressed={selected === index} title={`ATT ${(snapshot.weights[index] * 100).toFixed(1)}%`} data-weight={snapshot.weights[index]} onClick={() => select(index)}>
        <Typography as="span" variant="h2" tone="inherit">{word}</Typography><Vector anchor={`value-${index}`} values={snapshot.projectedValues[index]} kind="context" label={`${word}的四维内容表示`}/>
      </Button>)}
    </div>
    <Group x={790} y={335} width={260} height={140} className="attn-decode-arrive"><Vector anchor="context" values={snapshot.context} kind="context" label="全部源词按ATT加权得到的Context"/><Typography variant="h3" tone="success">Context</Typography></Group>
  </>;
}
function MergeScene({ id }: { id: string }) {
  return <>
    <Edges id={id} connections={[
      { name: 'word-embedding', from: { anchor: 'previous-word', side: 'right' }, to: { anchor: 'word-vector', side: 'left' }, color: 'var(--ui-accent-alt)' },
      { name: 'embedding-concat', from: { anchor: 'word-vector', side: 'right' }, to: { anchor: 'input', side: 'top', cells: [0, 3] }, color: 'var(--ui-accent-alt)' },
      { name: 'context-concat', from: { anchor: 'context', side: 'right' }, to: { anchor: 'input', side: 'bottom', cells: [3, 7] }, color: 'var(--ui-success)' },
    ]}/>
    <Group x={20} y={30} width={230} height={170}><Typography variant="bodySmall" tone="muted">给定前词</Typography><Typography variant="display" className="attn-decode-word-label" data-flow-anchor="previous-word">{snapshot.previousToken}</Typography></Group>
    <Group x={400} y={45} width={300} height={155}><Typography variant="h3" className="attn-decode-word-label">词向量</Typography><Vector anchor="word-vector" values={snapshot.wordEmbedding} kind="word" label="我查表得到的三维词向量"/></Group>
    <Group x={400} y={280} width={340} height={145}><Typography variant="h3" tone="success">Context</Typography><Vector anchor="context" values={snapshot.context} kind="context" label="四维Context"/></Group>
    <Group x={980} y={140} width={450} height={180} className="attn-decode-arrive"><Typography variant="h3">解码输入</Typography><Vector anchor="input" values={input} kind="input" label="前3格词向量与后4格Context拼接为7维输入"/></Group>
  </>;
}
function DecodeScene({ id }: { id: string }) {
  return <>
    <Edges id={id} connections={[
      { name: 'input-decoder', from: { anchor: 'input', side: 'right' }, to: { anchor: 'decoder', side: 'left', fraction: .3 } },
      { name: 'old-state-decoder', from: { anchor: 'query', side: 'right' }, to: { anchor: 'decoder', side: 'left', fraction: .75 } },
      { name: 'decoder-new-state', from: { anchor: 'decoder', side: 'right' }, to: { anchor: 'new-state', side: 'left' } },
    ]}/>
    <Group x={30} y={55} width={380} height={165}><Typography variant="h3">解码输入</Typography><Vector anchor="input" values={input} kind="input" label="七维解码输入"/></Group>
    <Group x={30} y={290} width={280} height={150}><Typography variant="h3" tone="accent">旧状态</Typography><Vector anchor="query" values={snapshot.query} kind="state" label="另一路输入的四维旧状态"/></Group>
    <Group anchor="decoder" x={590} y={180} width={280} height={150} className="attn-decode-machine"><Typography variant="h2" tone="accent">解码器</Typography></Group>
    <Group x={1110} y={175} width={340} height={165} className="attn-decode-arrive"><Typography variant="h3" tone="accent">新状态</Typography><Vector anchor="new-state" values={snapshot.decoderState} kind="state" label="更新得到的四维新状态"/></Group>
  </>;
}
function OutputScene({ id }: { id: string }) {
  return <>
    <Edges id={id} connections={[
      { name: 'new-state-output', from: { anchor: 'new-state', side: 'right' }, to: { anchor: 'output-layer', side: 'left', fraction: .3 } },
      { name: 'context-output', from: { anchor: 'context', side: 'right' }, to: { anchor: 'output-layer', side: 'left', fraction: .75 }, color: 'var(--ui-success)' },
      { name: 'output-word', from: { anchor: 'output-layer', side: 'right' }, to: { anchor: 'predicted-word', side: 'left' } },
    ]}/>
    <Group x={30} y={55} width={320} height={155}><Typography variant="h3" tone="accent">新状态</Typography><Vector anchor="new-state" values={snapshot.decoderState} kind="state" label="四维新状态"/></Group>
    <Group x={30} y={280} width={320} height={155}><Typography variant="h3" tone="success">Context</Typography><Vector anchor="context" values={snapshot.context} kind="context" label="输出层同样读取四维Context"/></Group>
    <Group anchor="output-layer" x={610} y={150} width={320} height={180} className="attn-decode-machine"><Typography variant="h2" tone="accent">输出层</Typography><Vector anchor="output-input" values={outputInput} kind="output" label="新状态与Context拼接后的八维输出层输入"/></Group>
    <Group x={1110} y={125} width={340} height={220} className="attn-decode-arrive attn-decode-result"><Typography variant="bodySmall" tone="muted">预测词</Typography><Typography as="output" variant="display" tone="success" data-flow-anchor="predicted-word" data-predicted={snapshot.predicted}>{snapshot.predicted}</Typography></Group>
  </>;
}

export function AttentionDecodingStepPage(props: ActivityProps) {
  const [done, setDone] = useActivityState('C20-check', false);
  const [phase, setPhase] = useState<Phase>(1);
  const [running, setRunning] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [animation, setAnimation] = useState(0);
  const [source, setSource] = useState(2);
  const runningRef = useRef(false);
  const visibleRef = useRef(false);
  const remainingRef = useRef(DURATION);
  const generationRef = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const marker = useId().replace(/:/g, '') + '-decode-arrow';
  const safe = useCallback(() => Boolean(root.current && !root.current.closest('[aria-hidden="true"]')), []);
  const canPlay = useCallback(() => safe() && visibleRef.current && document.visibilityState !== 'hidden', [safe]);
  const pause = useCallback(() => { runningRef.current = false; setRunning(false); setMotionPaused(true); }, []);

  useEffect(() => {
    const page = root.current?.closest('.attn-activity');
    if (!page || page.closest('[aria-hidden="true"]')) return;
    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting && entry.intersectionRatio > 0;
      if (!visibleRef.current) pause();
    }, { threshold: 0 });
    observer.observe(page);
    const visibilityChanged = () => { if (document.visibilityState === 'hidden') pause(); };
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibilityChanged); runningRef.current = false; visibleRef.current = false; };
  }, [pause]);

  useEffect(() => {
    if (!running) return;
    if (!canPlay()) { pause(); return; }
    const started = performance.now();
    const generation = generationRef.current;
    let fired = false;
    const timer = window.setTimeout(() => {
      fired = true;
      remainingRef.current = DURATION;
      if (!runningRef.current || !canPlay()) { pause(); return; }
      if (phase === 4) { runningRef.current = false; setRunning(false); return; }
      const next = (phase + 1) as Phase;
      setPhase(next);
      if (next === 4) setDone(true);
    }, remainingRef.current);
    return () => { window.clearTimeout(timer); if (!fired && generation === generationRef.current) remainingRef.current = Math.max(0, remainingRef.current - (performance.now() - started)); };
  }, [phase, running, animation, canPlay, pause, setDone]);

  const goTo = (next: Phase) => {
    if (!safe() || !Number.isInteger(next) || next < 1 || next > 4) return;
    generationRef.current += 1;
    runningRef.current = false;
    setRunning(false);
    remainingRef.current = DURATION;
    setMotionPaused(false);
    setPhase(next);
    setAnimation(value => value + 1);
    if (next === 4) setDone(true);
  };
  const play = (restart = false) => {
    if (!canPlay()) return;
    if (runningRef.current && !restart) { pause(); return; }
    if (restart || phase === 4 || animation === 0) {
      generationRef.current += 1;
      setPhase(1); setAnimation(value => value + 1); remainingRef.current = DURATION;
    }
    setMotionPaused(false);
    runningRef.current = true;
    setRunning(true);
  };
  const selectSource = (index: number) => { if (safe()) { pause(); setMotionPaused(false); setSource(index); setAnimation(value => value + 1); } };

  return <AttentionActivity {...props} number={20} title="一步解码：生成当前译词" eyebrow="小明的到家消息 · 训练后示例" done={done || props.isComplete} className="attn-decode-page" footerHeight={190}
    footer={<div className="attn-decode-controls">
      <div className="attn-decode-control-top"><Typography variant="h3" tone="accent" role="status" aria-live="polite">{descriptions[phase - 1]}</Typography><div className="attn-decode-actions">
        <Button variant="primary" aria-pressed={running} onClick={() => play()}><Typography as="span" variant="bodySmall" tone="inherit">{running ? '暂停' : phase === 4 || animation === 0 ? '播放一次' : '继续播放'}</Typography></Button>
        <Button onClick={() => play(true)}><Typography as="span" variant="bodySmall" tone="inherit">重播</Typography></Button>
      </div></div>
      <div className="attn-decode-control-bottom"><Button disabled={phase === 1} onClick={() => goTo((phase - 1) as Phase)}><Typography as="span" variant="bodySmall" tone="inherit">上一步</Typography></Button>
        <ChoiceButtons label="一次解码的四个步骤" value={String(phase)} options={[{ value: '1', label: '1 读取' }, { value: '2', label: '2 合并' }, { value: '3', label: '3 解码' }, { value: '4', label: '4 输出' }]} onChange={value => goTo(Number(value) as Phase)}/>
        <Button disabled={phase === 4} onClick={() => goTo((phase + 1) as Phase)}><Typography as="span" variant="bodySmall" tone="inherit">下一步</Typography></Button>
      </div>
    </div>}>
    <div ref={root} className="attn-decode-stage" data-decode-phase={phase} data-decode-running={running} data-decode-paused={motionPaused} data-snapshot-epoch={snapshot.epoch}>
      <div key={`${phase}-${animation}`} className={`attn-decode-scene${animation > 0 ? ' is-animated' : ''}${motionPaused ? ' is-paused' : ''}`} aria-label={`第${phase}步：${['读取原句', '合并输入', '更新状态', '输出译词'][phase - 1]}`}>
        {phase === 1 ? <ReadingScene id={marker} selected={source} select={selectSource}/> : phase === 2 ? <MergeScene id={marker}/> : phase === 3 ? <DecodeScene id={marker}/> : <OutputScene id={marker}/>}
      </div>
    </div>
  </AttentionActivity>;
}
