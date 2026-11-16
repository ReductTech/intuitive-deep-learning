import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { ChoiceButtons, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { DECODING_STEP_SNAPSHOT as snapshot } from '../../model/decodingStepSnapshot';
import './AttentionDecodingStepPage.css';

type Phase = 1 | 2 | 3 | 4;
type VectorKind = 'word' | 'context' | 'state' | 'input' | 'output';
const DURATION = 3200;
const descriptions = [
  '按 ATT 汇聚 V → Context。',
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
  return <span shuku-edit-id="e-8ab66035-3aaa-45fd-b03c-c3ddbf7caa68" className="attn-decode-cells" role="img" aria-label={label} data-vector={kind} data-flow-anchor={anchor} style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}>
    {values.map((value, index) => <span shuku-edit-id="e-07e2e3af-3ccd-4263-98cf-62ac2d2fe822" key={index} data-value={value} style={{ background: `rgba(${vectorColor(kind, index)}, ${.22 + .78 * Math.min(1, Math.abs(value))})` }}/>)}</span>;
}
function Group({ x, y, width, height, children, className = '', anchor }: { x: number; y: number; width: number; height: number; children: ReactNode; className?: string; anchor?: string }) {
  return <div shuku-edit-id="e-e7b48c60-45c4-4692-a891-87b840a10c3c" className={`attn-decode-object ${className}`} style={place(x, y, width, height)} data-flow-anchor={anchor}>{children}</div>;
}
type Port = { anchor: string; side: 'left' | 'right' | 'top' | 'bottom'; fraction?: number; cells?: readonly [number, number] };
type Connection = { name: string; from: Port; to: Port; color?: string; width?: number; active?: boolean };
type Point = { x: number; y: number };
const portDirection = { left: [-1, 0], right: [1, 0], top: [0, -1], bottom: [0, 1] } as const;
function connectionPath(from: Point, to: Point, link: Connection) {
  const distance = Math.max(8, Math.min(150, Math.hypot(to.x - from.x, to.y - from.y) * .45));
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
  return <svg shuku-edit-id="e-f19e5dc6-c119-43db-a55a-740e25d8370c" ref={svg} className="attn-decode-lines" viewBox="0 0 1488 480" preserveAspectRatio="none" aria-hidden="true">
    <defs shuku-edit-id="e-3fe280dc-8504-400e-bf8a-6be2989cc733"><marker shuku-edit-id="e-42fb08fc-d837-421f-9fea-afbc5f6999b1" id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto"><path shuku-edit-id="e-d9dfca1a-175b-4ca3-b2ab-5589d02da235" d="M1 1L9 5L1 9" stroke="context-stroke" strokeWidth="2" fill="none"/></marker></defs>
    {connections.map(({ name, from, to, color = 'var(--ui-accent)', width = 3, active = true }) => paths[name] && <g shuku-edit-id="e-396463f3-0ffa-40a1-bb26-11e6b36c7f5b" key={name} data-connection={name} data-from={JSON.stringify(from)} data-to={JSON.stringify(to)} className={active ? '' : 'is-muted'} style={{ color }}>
      <path shuku-edit-id="e-27e53f04-7bfa-4e5b-a3cc-3eaef5d867b0" d={paths[name]} markerEnd={`url(#${id})`} fill="none" stroke="currentColor" strokeWidth={width} className="attn-decode-wire"/>
      {active && <path shuku-edit-id="e-358af5f2-acb4-493e-8b6f-7192cc1d519d" d={paths[name]} pathLength="1" fill="none" stroke="currentColor" strokeWidth={width + 4} className="attn-decode-travel"/>}
    </g>)}
  </svg>;
}
function ReadingScene({ id, selected, select }: { id: string; selected: number; select: (index: number) => void }) {
  return <>
    <Edges id={id} connections={[
      { name: 'query-matching', from: { anchor: 'query', side: 'right' }, to: { anchor: 'matching', side: 'left' } },
      { name: 'matching-weights', from: { anchor: 'matching', side: 'bottom' }, to: { anchor: 'source-bank', side: 'top' } },
      ...snapshot.weights.map((weight, index): Connection => ({ name: `weighted-value-${index}`, from: { anchor: `value-${index}`, side: 'bottom' }, to: { anchor: 'context', side: 'top' }, color: 'var(--ui-success)', width: 2 + 9 * weight, active: index === selected })),
    ]}/>
    <Group x={35} y={50} width={250} height={160}><Typography shuku-edit-id="e-6ee9b4c2-31ed-4dc0-80c6-75706311d4d1" variant="h3" tone="accent">Q · 状态投影</Typography><Vector anchor="query" values={snapshot.projectedQuery} kind="state" label="用于匹配的三维查询"/></Group>
    <Group anchor="matching" className="attn-decode-matching" x={350} y={0} width={1040} height={48}><Typography shuku-edit-id="e-13cf32ee-5e1d-488e-be50-5549c4acc884" variant="bodySmall" tone="muted">Q/K 评分 → Softmax；数字为比例，色格为 V</Typography></Group>
    <div shuku-edit-id="e-40fd1122-ba06-4dec-a072-9ac62a0ab465" className="attn-decode-source" data-flow-anchor="source-bank" style={place(350, 65, 1040, 165)} role="group" aria-label="选择原词，突出它对Context的贡献">
      {snapshot.sourceTokens.map((word, index) => <Button key={word} className={`attn-decode-source-word${selected === index ? ' is-selected' : ''}`} style={{ background: `rgba(var(--ui-accent-rgb), ${.06 + .88 * snapshot.weights[index]})`, color: snapshot.weights[index] >= .46 ? 'var(--ui-bg-card)' : 'var(--ui-text-main)' }} aria-label={`${word}，读取比例${(snapshot.weights[index] * 100).toFixed(1)}%`} aria-pressed={selected === index} title={`ATT ${(snapshot.weights[index] * 100).toFixed(1)}%`} data-weight={snapshot.weights[index]} onClick={() => select(index)}>
        <Typography shuku-edit-id="e-71f9db7a-9571-4493-b7e7-29b44df84712" as="span" variant="h2" tone="inherit">{word}</Typography><Typography shuku-edit-id="e-01150558-218b-4ff9-803a-588fa8edd422" as="span" variant="bodySmall" tone="inherit">{(snapshot.weights[index]*100).toFixed(1)}%</Typography><Vector anchor={`value-${index}`} values={snapshot.projectedValues[index]} kind="context" label={`${word}的四维内容表示`}/>
      </Button>)}
    </div>
    <Group x={790} y={320} width={260} height={136} className="attn-decode-arrive"><Vector anchor="context" values={snapshot.context} kind="context" label="全部源词按ATT加权得到的Context"/><Typography shuku-edit-id="e-026be9ee-c390-4e19-84c2-7d534b1c1b51" variant="h3" tone="success">Context</Typography></Group>
  </>;
}
function MergeScene({ id }: { id: string }) {
  return <>
    <Edges id={id} connections={[
      { name: 'word-embedding', from: { anchor: 'previous-word', side: 'right' }, to: { anchor: 'word-vector', side: 'left' }, color: 'var(--ui-accent-alt)' },
      { name: 'embedding-concat', from: { anchor: 'word-vector', side: 'right' }, to: { anchor: 'input', side: 'top', cells: [0, 3] }, color: 'var(--ui-accent-alt)' },
      { name: 'context-concat', from: { anchor: 'context', side: 'right' }, to: { anchor: 'input', side: 'bottom', cells: [3, 7] }, color: 'var(--ui-success)' },
    ]}/>
    <Group x={20} y={30} width={230} height={170}><Typography shuku-edit-id="e-837c3bca-8035-44d7-ba3d-081abd92bfb0" variant="bodySmall" tone="muted">给定前词</Typography><Typography shuku-edit-id="e-9c262cb5-9643-4c16-a069-3bd2ea20b098" variant="display" className="attn-decode-word-label" data-flow-anchor="previous-word">{snapshot.previousToken}</Typography></Group>
    <Group x={400} y={45} width={300} height={155}><Typography shuku-edit-id="e-a988e9ee-fb6d-4c8f-951d-1b945ed26fcd" variant="h3" className="attn-decode-word-label">词向量 · 3 维</Typography><Vector anchor="word-vector" values={snapshot.wordEmbedding} kind="word" label={snapshot.previousToken+'查表得到的三维词向量'}/></Group>
    <Group x={400} y={280} width={340} height={145}><Typography shuku-edit-id="e-49ae3527-f503-4a15-b6b5-309a7f8ad50a" variant="h3" tone="success">Context</Typography><Vector anchor="context" values={snapshot.context} kind="context" label="四维Context"/></Group>
    <Group x={980} y={140} width={450} height={180} className="attn-decode-arrive"><Typography shuku-edit-id="e-810f1327-6727-4344-bd87-baed7084b308" variant="h3">解码输入 · 7 维</Typography><Vector anchor="input" values={input} kind="input" label="前3格词向量与后4格Context拼接为7维输入"/></Group>
  </>;
}
function DecodeScene({ id }: { id: string }) {
  return <>
    <Edges id={id} connections={[
      { name: 'input-decoder', from: { anchor: 'input', side: 'right' }, to: { anchor: 'decoder', side: 'left', fraction: .3 } },
      { name: 'old-state-decoder', from: { anchor: 'query', side: 'right' }, to: { anchor: 'decoder', side: 'left', fraction: .75 } },
      { name: 'decoder-new-state', from: { anchor: 'decoder', side: 'right' }, to: { anchor: 'new-state', side: 'left' } },
    ]}/>
    <Group x={30} y={55} width={380} height={165}><Typography shuku-edit-id="e-14cfb3e9-fd32-4017-a241-24b11b9d437b" variant="h3">解码输入 · 7 维</Typography><Vector anchor="input" values={input} kind="input" label="七维解码输入"/></Group>
    <Group x={30} y={290} width={280} height={150}><Typography shuku-edit-id="e-93ab971a-e9b9-4db1-aa79-f2b530796126" variant="h3" tone="accent">旧状态 · 4 维</Typography><Vector anchor="query" values={snapshot.query} kind="state" label="另一路输入的四维旧状态"/></Group>
    <Group anchor="decoder" x={590} y={180} width={280} height={150} className="attn-decode-machine"><Typography shuku-edit-id="e-015ecbfc-890e-4372-a357-8d45f7e64fbb" variant="h2" tone="accent">解码器</Typography></Group>
    <Group x={1110} y={175} width={340} height={165} className="attn-decode-arrive"><Typography shuku-edit-id="e-447e8aad-5462-4fdc-b130-c0c7eb85db4b" variant="h3" tone="accent">新状态 · 4 维</Typography><Vector anchor="new-state" values={snapshot.decoderState} kind="state" label="更新得到的四维新状态"/></Group>
  </>;
}
function OutputScene({ id }: { id: string }) {
  return <>
    <Edges id={id} connections={[
      { name: 'new-state-output', from: { anchor: 'new-state', side: 'right' }, to: { anchor: 'output-layer', side: 'left', fraction: .3 } },
      { name: 'context-output', from: { anchor: 'context', side: 'right' }, to: { anchor: 'output-layer', side: 'left', fraction: .75 }, color: 'var(--ui-success)' },
      { name: 'output-word', from: { anchor: 'output-layer', side: 'right' }, to: { anchor: 'predicted-word', side: 'left' } },
    ]}/>
    <Group x={30} y={55} width={320} height={155}><Typography shuku-edit-id="e-80d92334-04e6-4b34-8f05-53e3c86f4004" variant="h3" tone="accent">新状态 · 4 维</Typography><Vector anchor="new-state" values={snapshot.decoderState} kind="state" label="四维新状态"/></Group>
    <Group x={30} y={280} width={320} height={155}><Typography shuku-edit-id="e-ee216136-128a-48df-bc51-f052b98939dd" variant="h3" tone="success">Context</Typography><Vector anchor="context" values={snapshot.context} kind="context" label="输出层同样读取四维Context"/></Group>
    <Group anchor="output-layer" x={610} y={135} width={320} height={210} className="attn-decode-machine"><Typography shuku-edit-id="e-3577ab8d-188f-447e-9c68-64cf6386e695" variant="h2" tone="accent">输出层</Typography><Typography shuku-edit-id="e-970272ae-58d9-4231-9130-1d79ae088da8" variant="bodySmall" tone="muted">14 词类 · 输入 8 维</Typography><Vector anchor="output-input" values={outputInput} kind="output" label="新状态与Context拼接后的八维输出层输入"/></Group>
    <Group x={1110} y={125} width={340} height={220} className="attn-decode-arrive attn-decode-result"><Typography shuku-edit-id="e-c1c1c9d3-2acf-43eb-a3b2-42a91d727086" variant="bodySmall" tone="muted">预测词</Typography><Typography shuku-edit-id="e-3ea9f410-e6d9-4ea8-9ffd-922bf66449a9" as="output" variant="display" tone={snapshot.predicted===snapshot.target?'success':'warning'} data-flow-anchor="predicted-word" data-predicted={snapshot.predicted}>{snapshot.predicted}</Typography><Typography shuku-edit-id="e-070476bb-88b6-4ffd-9769-9c71dc8a7ae5" variant="bodySmall" tone="muted">译词概率 {snapshot.targetProbability.toFixed(4)}</Typography></Group>
  </>;
}

export function AttentionDecodingStepPage(props: ActivityProps) {
  const [done, setDone] = useActivityState('C20-campus-decoding-complete', false);
  const [phase, setPhase] = useState<Phase>(1);
  const [running, setRunning] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [animation, setAnimation] = useState(0);
  const [source, setSource] = useState(3);
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
    const page = root.current;
    if (!page) return;
    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting && entry.intersectionRatio > 0;
      if (!visibleRef.current) pause();
    }, { threshold: 0 });
    observer.observe(page);
    const syncHidden=()=>{const hidden=Boolean(page.closest('[aria-hidden="true"], [hidden]'));page.inert=hidden;if(hidden)pause();};
    const mutations=new MutationObserver(syncHidden);
    for(let ancestor:HTMLElement|null=page;ancestor;ancestor=ancestor.parentElement)mutations.observe(ancestor,{attributes:true,attributeFilter:['aria-hidden','hidden']});
    syncHidden();
    const visibilityChanged = () => { if (document.visibilityState === 'hidden') pause(); };
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => { observer.disconnect(); mutations.disconnect(); document.removeEventListener('visibilitychange', visibilityChanged); runningRef.current = false; visibleRef.current = false; };
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

  useEffect(()=>{if(done&&safe()&&!props.isComplete)props.onComplete();},[done,props.isComplete,props.onComplete,safe]);

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

  return <ContentBlock shuku-edit-id="e-66533873-dc0f-4b4b-b36c-406e5e73637f" ref={root} headingLevel={1} title="一步解码：从读取到译词"
    subtitle="展开生成“传球”的一步。"
    className="attn-decode-page" bodyClassName="attn-decode-body" data-activity="C20" data-activity-complete={done}
    onKeyDown={event=>{if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))event.stopPropagation();}}>
    <div shuku-edit-id="e-434115a2-4613-4ece-944d-b30087d14e00" className="attn-decode-stage" data-decode-phase={phase} data-decode-running={running} data-decode-paused={motionPaused} data-snapshot-epoch={snapshot.epoch}>
      <div shuku-edit-id="e-bb0111ee-d090-46b0-a8f8-e70a15256d4a" key={`${phase}-${animation}`} className={`attn-decode-scene${animation > 0 ? ' is-animated' : ''}${motionPaused ? ' is-paused' : ''}`} aria-label={`第${phase}步：${['读取原句', '合并输入', '更新状态', '输出译词'][phase - 1]}`}>
        {phase === 1 ? <ReadingScene id={marker} selected={source} select={selectSource}/> : phase === 2 ? <MergeScene id={marker}/> : phase === 3 ? <DecodeScene id={marker}/> : <OutputScene id={marker}/>}
      </div>
    </div>
    <footer shuku-edit-id="e-8a56f0d8-fc40-482c-b16e-77e0e5b8a465" className="attn-decode-footer"><div shuku-edit-id="e-88bb4904-c9fa-416c-9e96-a8e267b87e62" className="attn-decode-controls">
      <div shuku-edit-id="e-e258634c-3ba3-4187-a204-e1749c77de4b" className="attn-decode-control-top"><Typography shuku-edit-id="e-0a709545-eec3-49aa-b984-9d2a75e40190" variant="h3" tone="accent" role="status" aria-live="polite">{descriptions[phase - 1]}</Typography><div shuku-edit-id="e-87b663b3-e963-461c-b6eb-7a97cd22978b" className="attn-decode-actions">
        <Button variant="primary" aria-pressed={running} onClick={() => play()}><Typography shuku-edit-id="e-6d833731-05c8-4739-b742-06868b81493b" as="span" variant="bodySmall" tone="inherit">{running ? '暂停' : phase === 4 || animation === 0 ? '播放一次' : '继续播放'}</Typography></Button>
        <Button onClick={() => play(true)}><Typography shuku-edit-id="e-ad5067cc-0c3a-48ff-b342-5a3046ac0a1f" as="span" variant="bodySmall" tone="inherit">重播</Typography></Button>
      </div></div>
      <div shuku-edit-id="e-864e22cb-e5fc-4ab9-9cfd-e44456e936c3" className="attn-decode-control-bottom"><Button disabled={phase === 1} onClick={() => goTo((phase - 1) as Phase)}><Typography shuku-edit-id="e-9db11759-57e8-4521-8f7a-9fe353101e27" as="span" variant="bodySmall" tone="inherit">上一步</Typography></Button>
        <ChoiceButtons label="一次解码的四个步骤" value={String(phase)} options={[{ value: '1', label: '1 读取' }, { value: '2', label: '2 合并' }, { value: '3', label: '3 解码' }, { value: '4', label: '4 输出' }]} onChange={value => goTo(Number(value) as Phase)}/>
        <Button disabled={phase === 4} onClick={() => goTo((phase + 1) as Phase)}><Typography shuku-edit-id="e-b409a925-a12c-4a7b-bf89-72cf31ad6ac6" as="span" variant="bodySmall" tone="inherit">下一步</Typography></Button>
      </div>
    </div></footer>
    <Typography shuku-edit-id="e-ebfd51d2-6c77-464f-8bf6-aec0baccd7a5" variant="bodySmall" tone="muted">{snapshot.epoch} 轮快照 · 给定前词“{snapshot.previousToken}”。</Typography>
  </ContentBlock>;
}
