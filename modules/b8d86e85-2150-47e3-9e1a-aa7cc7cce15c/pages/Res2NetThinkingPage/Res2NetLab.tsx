import { useEffect, useRef, useState, type PointerEvent, type CSSProperties } from 'react';
import { GripVertical, Link2, RotateCcw, Undo2, ArrowRight, Columns3, Info, X, Plus, Check, Hand, Target, PartyPopper } from 'lucide-react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { convId, graphNodes, connectionError, parameterWeights, type Connection } from './res2netGraph';
import { NetworkStage } from './NetworkStage';
import './NetworkStudio.css';

type Phase = 'depth' | 'scales' | 'compact';
type Network = { depth: number; branches: number[]; grouped: boolean; connections: Connection[] };
type Tool = 'conv' | 'skip';
type Drag = { kind: 'conv'; x: number; y: number } | { kind: 'wire'; from: string; x: number; y: number; startX: number; startY: number };
// Divisible by 2, 3 and 4: every intermediate group has an integer channel width.
const D = 96;
const initialNetwork = (): Network => ({ depth: 1, branches: [1], grouped: false, connections: [] });

export function Res2NetThinkingPage() {
  const [phase, setPhase] = useState<Phase>('depth');
  const [network, setNetwork] = useState<Network>(initialNetwork);
  const [history, setHistory] = useState<Network[]>([]);
  const [lastChange, setLastChange] = useState<{ before: number; after: number; reason: string } | null>(null);
  const [selected, setSelected] = useState(0);
  const [hoveredScale, setHoveredScale] = useState<number|null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [pickedTool, setPickedTool] = useState<Tool | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [overInput, setOverInput] = useState<string | null>(null);
  const [wireSource, setWireSource] = useState<string | null>(null);
  const [wireCursor, setWireCursor] = useState<{x:number;y:number}|null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [notice, setNotice] = useState('把左侧卷积拖到虚线位置，松开吸附。');
  const [showInfo, setShowInfo] = useState(false);
  const [dismissedCompletion, setDismissedCompletion] = useState<Phase | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const [guide, setGuide] = useState<{x:number;y:number;dx:number;dy:number}|null>(null);
  const completion = useRef<HTMLElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);
  const { depth, branches, grouped, connections } = network;
  const groupCount = grouped ? branches.length + 1 : 1;
  const groupWidth = D / groupCount;
  const lengths = phase === 'depth' ? [depth] : branches;
  const modules = graphNodes(lengths, connections);
  const moduleById = new Map(modules.map(node => [node.id, node]));
  const ranges = lengths.map((n, i) => n === 0 ? [1] : moduleById.get(convId(i, n - 1))!.ranges);
  const convCount = lengths.reduce((sum, n) => sum + n, 0);
  const coverage = phase === 'depth' ? [1 + 2 * depth] : [...new Set([...ranges.flat(), ...(grouped ? [1] : [])])];
  const selectedIndex = Math.min(Math.max(selected, 0), branches.length - 1);
  const selectedRanges = selected === -1 && grouped ? [1] : ranges[selectedIndex];
  const canWire = phase === 'compact' && grouped && convCount >= 2;
  const goalMet = phase === 'compact' && grouped && [3, 5, 7].every(n => coverage.includes(n));
  const ready = phase === 'depth' ? depth === 3 : phase === 'scales' ? [3, 5, 7].every(n => coverage.includes(n)) : goalMet;
  const showCompletion = ready && dismissedCompletion !== phase;
  const canInspectScale=goalMet&&!showCompletion;
  const highlightedScale=canInspectScale&&hoveredScale!==null?hoveredScale:undefined;
  const weights = parameterWeights(lengths, D, grouped);
  const baseline = parameterWeights([1], D, false).total;
  const ratio = weights.total / baseline;
  const priorRatio = (lastChange?.before ?? weights.total) / baseline;
  const retainedRatio = Math.min(ratio, priorRatio);
  const meterMax = Math.max(8,2**Math.ceil(Math.log2(Math.max(ratio,priorRatio))));
  const observed = phase === 'depth' ? modules.flatMap(node => node.ranges) : coverage;
  const countWeights = (value: Network) => parameterWeights(phase === 'depth' ? [value.depth] : value.branches, D, value.grouped).total;
  const activeTool = drag?.kind === 'wire' ? 'skip' : drag?.kind ?? pickedTool;
  const canAddConv = (i: number) => phase === 'depth' ? depth < 3 : phase === 'scales' && branches[i] < 3;
  const edgeKey = (edge: Connection) => `${edge.from}>${edge.to}`;
  useEffect(() => {
    if(!showCompletion)return;
    cancel();setShowInfo(false);
    completion.current?.focus({preventScroll:true});
  }, [showCompletion]);
  useEffect(()=>{
    if(!wireSource||ready)return;
    // Disabling the selected output can move focus outside the slide; Escape must still cancel the wire.
    const onEscape=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cancel();}};
    window.addEventListener('keydown',onEscape,true);
    return()=>window.removeEventListener('keydown',onEscape,true);
  },[wireSource,ready]);
  const showGuide=phase==='depth'&&!hasDragged&&!drag&&!showCompletion;
  useEffect(()=>{
    if(!showGuide){setGuide(null);return;}
    function measure(){
      const element=root.current;
      const source=element?.querySelector('[aria-label="拖动3乘3卷积"]')?.getBoundingClientRect();
      const target=board.current?.querySelector('[data-r2-target]')?.getBoundingClientRect();
      const bounds=element?.getBoundingClientRect();
      if(element&&source&&target&&bounds){
        const scale=element.offsetWidth/bounds.width;
        const x=(source.x+source.width/2-bounds.left)*scale-element.clientLeft;
        const y=(source.y+source.height/2-bounds.top)*scale-element.clientTop;
        setGuide({x,y,dx:(target.x+target.width/2-source.x-source.width/2)*scale,dy:(target.y+target.height/2-source.y-source.height/2)*scale});
      }
    }
    const frame=requestAnimationFrame(measure);
    const observer=new ResizeObserver(measure);
    if(root.current)observer.observe(root.current);
    if(root.current?.parentElement)observer.observe(root.current.parentElement);
    window.addEventListener('resize',measure);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',measure);};
  },[showGuide]);
  function closeCelebration(){setDismissedCompletion(phase);}
  function change(next: Network, message: string, reason: string) {
    if(ready)return;
    setLastChange({ before: weights.total, after: countWeights(next), reason });
    setHistory(old => [...old, network]); setNetwork(next); setNotice(message);
  }
  function cancel() { setDrag(null); setOver(null); setOverInput(null); setWireSource(null); setWireCursor(null);setPickedTool(null); setSelectedEdge(null);setHoveredScale(null); }
  function findTarget(x: number, y: number) {
    return [...(board.current?.querySelectorAll<HTMLElement>('[data-r2-target]') ?? [])].find(element => {
      const r = element.getBoundingClientRect();
      return element.dataset.r2Kind === 'conv' && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });
  }
  function findInput(x: number, y: number) {
    const port = [...(board.current?.querySelectorAll<HTMLElement>('[data-r2-input]') ?? [])].find(element => {
      const r = element.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    })?.dataset.r2Input;
    if (port) return port;
    return [...(board.current?.querySelectorAll<HTMLElement>('[data-r2-node]') ?? [])].find(element => {
      const r = element.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    })?.dataset.r2Node ?? null;
  }
  function addConv(index: number) {
    if (ready || !canAddConv(index)) return;
    setHasDragged(true);
    if (phase === 'depth') change({ ...network, depth: depth + 1 }, '卷积已吸附，观察覆盖范围如何扩大。', '新增全通道卷积');
    else {
      change({ ...network, branches: branches.map((n, i) => i === index ? n + 1 : n) }, '卷积已吸附，观察覆盖范围与参数开销。', grouped ? `新增 ${groupWidth} 通道卷积` : '新增全通道卷积'); setSelected(index);
    }
  }
  function addParallelBranch() {
    if (phase !== 'scales' || branches.length >= 3) return;
    change({ ...network, branches: [...branches, 1] }, '新增一条并行分支，各分支仍处理完整 D 通道。', '新增分支与融合');
    setSelected(branches.length); cancel();
  }
  function splitChannels() {
    if (phase !== 'compact' || (grouped && groupCount >= 4)) return;
    const nextBranches = grouped ? [...branches, 1] : branches;
    const nextGroups = nextBranches.length + 1;
    change({ ...network, branches: nextBranches, grouped: true }, `已均分为 ${nextGroups} 组，每组 D/${nextGroups} 通道。${nextGroups===2?'继续均分，看看能否保留更多尺度。':'点击“跳跃连接”，先选右侧输出点，再选另一组左侧的加号。'}`, `均分为 ${nextGroups} 组并配置卷积`);
    setSelected(nextBranches.length - 1); cancel();
  }
  function addWire(from: string, to: string) {
    if(ready||!canWire)return;
    const error = connectionError(branches, connections, from, to);
    if (error) { setNotice(error); return; }
    change({ ...network, connections: [...connections, { from, to }] }, '已连接两个模块，观察感受野如何变化；参数不变。', '连接不增加权重');
    setSelected(moduleById.get(to)!.branch); setSelectedEdge(null);
  }
  function removeWire() {
    if (!selectedEdge) return;
    change({ ...network, connections: connections.filter(edge => edgeKey(edge) !== selectedEdge) }, '已删除所选连接，覆盖范围按剩余结构更新。', '删线，权重不变');
    setSelectedEdge(null);
  }
  function start(e: PointerEvent<HTMLButtonElement>, kind: 'conv') { if(ready)return; e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setPickedTool(null); setDrag({ kind, x: e.clientX, y: e.clientY }); }
  function startWire(e: PointerEvent<HTMLElement>, from: string) {
    if(ready||!canWire||wireSource)return;
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
    setPickedTool('skip'); setWireSource(from); setSelectedEdge(null);
    setWireCursor({x:e.clientX,y:e.clientY});
    setDrag({ kind: 'wire', from, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY });
  }
  function chooseWireSource(from: string) {
    if(ready||!canWire||wireSource)return;
    setWireSource(from);setPickedTool('skip');setSelectedEdge(null);
    const port=board.current?.querySelector(`[data-r2-output="${from}"]`)?.getBoundingClientRect();
    if(port)setWireCursor({x:port.x+port.width/2,y:port.y+port.height/2});
  }
  function chooseWireInput(to: string) {
    if(!wireSource||ready||connectionError(branches,connections,wireSource,to))return;
    addWire(wireSource,to);setWireSource(null);setWireCursor(null);setDrag(null);setOverInput(null);
  }
  function followWire(e: PointerEvent<HTMLElement>) {
    if(!wireSource||drag||ready)return;
    setWireCursor({x:e.clientX,y:e.clientY});
    setOverInput(findInput(e.clientX,e.clientY));
  }
  function move(e: PointerEvent<HTMLElement>) {
    if (!drag) return;
    setDrag({ ...drag, x: e.clientX, y: e.clientY });
    if (drag.kind === 'wire') setOverInput(findInput(e.clientX, e.clientY));
    else { const target = findTarget(e.clientX, e.clientY); setOver(target ? Number(target.dataset.r2Target) : null); }
  }
  function finish(e: PointerEvent<HTMLElement>) {
    if (!drag) return;
    if (drag.kind === 'wire') {
      const target = findInput(e.clientX, e.clientY);
      const moved = Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>6;
      if (moved&&target&&!connectionError(branches,connections,drag.from,target)) {
        addWire(drag.from,target);setWireSource(null);setWireCursor(null);
      } else setWireCursor({x:e.clientX,y:e.clientY});
      // A click selects the output; a drag can connect immediately. Both reveal the same valid + targets.
      setDrag(null);setOverInput(null);
    } else {
      const target = findTarget(e.clientX, e.clientY);
      if (target) addConv(Number(target.dataset.r2Target)); else setNotice('把卷积放进虚线吸附区再松开。');
      cancel();
    }
  }
  function undo() {
    if (ready || !history.length) return;
    setLastChange({ before: weights.total, after: countWeights(history[history.length - 1]), reason: '撤回上一步操作' });
    setNetwork(history[history.length - 1]); setHistory(old => old.slice(0, -1)); setSelected(0); cancel(); setNotice('已撤回上一步。');
  }
  function restartStage() {
    setNetwork(initialNetwork()); setHistory([]); setLastChange(null); setSelected(0); cancel(); setShowInfo(false); setDismissedCompletion(null);
    setNotice(phase === 'depth' ? '把左侧卷积拖到虚线位置，松开吸附。' : phase === 'scales' ? '点击“并行分支”增加一条，再拖入卷积。' : '先从普通残差块出发，点击“均分通道”重新搭建。');
  }
  function next() {
    if (!ready || phase === 'compact') return;
    const nextPhase = phase === 'depth' ? 'scales' : 'compact';
    setDismissedCompletion(null); setPhase(nextPhase); setNetwork(initialNetwork()); setHistory([]); setLastChange(null); setSelected(0); cancel(); setShowInfo(false);
    setNotice(nextPhase === 'scales' ? '目标：同时保留三种感受野。点击“并行分支”，再拖入卷积。' : '先点击“均分通道”，窄通道卷积会自动就位，再尝试连接小组。');
  }
  const rootRect = root.current?.getBoundingClientRect();
  const boardRect = board.current?.getBoundingClientRect();
  const wirePoint=drag?.kind==='wire'?drag:wireCursor;
  const pointer = wireSource && wirePoint && boardRect ? { from: wireSource, x: (wirePoint.x - boardRect.left) * 1040 / boardRect.width+(board.current?.scrollLeft??0), y: (wirePoint.y - boardRect.top) * 1040 / boardRect.width } : null;
  const hoverError = wireSource && overInput ? connectionError(branches, connections, wireSource, overInput) : null;
  const context = drag?.kind === 'wire' ? hoverError ?? '拖到亮起的加号上，松开完成相加。' : wireSource ? hoverError??'连线跟随鼠标，点击亮起的加号完成相加；按 Esc 取消。' : selectedEdge ? '连接已选中，可在顶部删线或按 Delete。' : notice;

  return <ContentBlock shuku-edit-id="e-075a93ca-3b80-425d-9d86-91b46654dbe4" ref={root} className={`r2-studio-page ${drag?.kind==='conv'?'is-dragging-conv':''}`} headingLevel={1} title="让教学、实践与研究相互启发" subtitle="用研究案例组织探索，让学生的理解与想法获得实践机会" bodyClassName="r2-studio-body" onPointerMove={followWire} onKeyDown={e => { if (e.target instanceof Element && e.target.closest('button') && [' ', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(e.key)) e.stopPropagation(); if (e.key === 'Escape') cancel(); if (e.key === 'Delete' && selectedEdge) { e.preventDefault(); e.stopPropagation(); removeWire(); } }}>
    <div shuku-edit-id="e-e155898a-1ac9-4ff8-b345-e1dbbbf9cb8e" className="r2-studio-layout">
      <section shuku-edit-id="e-b729bfb9-0dd7-4ae0-891f-98919956c8ce" className="r2-studio-workspace" aria-label="网络实验台">
        <div shuku-edit-id="e-3ac35d82-847f-453f-9691-525ba886c6ad" className="r2-studio-topbar"><div shuku-edit-id="e-39ae268a-558b-45ef-84c9-6d4c73e71c6d" className="r2-studio-actions">
          {!ready&&<Button className="r2-studio-action" aria-label="撤回" disabled={!history.length} onClick={undo}><Undo2 aria-hidden="true"/><Typography shuku-edit-id="e-08ff9014-4b2d-41d8-9906-9818f0ce6fd6" as="span" variant="body" tone="inherit">撤回</Typography></Button>}
          <Button className="r2-studio-action" aria-label="重置当前目标" disabled={showCompletion} onClick={restartStage}><RotateCcw aria-hidden="true"/><Typography shuku-edit-id="e-8fb71627-c17f-40af-90d1-28b4048c67a4" as="span" variant="body" tone="inherit">重置</Typography></Button>
          {selectedEdge && <Button className="r2-studio-action" aria-label="删除所选连接" disabled={ready} onClick={removeWire}><X aria-hidden="true"/><Typography shuku-edit-id="e-9be24fb1-f4d3-43a1-8db2-8fc7e6d9e7a5" as="span" variant="body" tone="inherit">删线</Typography></Button>}
          {ready&&phase!=='compact'&&!showCompletion&&<Button className="r2-studio-next" onClick={next}><Typography shuku-edit-id="e-5dd3748f-0596-4b82-9013-3e274e576ccb" as="span" variant="body" tone="inherit">继续挑战</Typography><ArrowRight/></Button>}
        </div></div>
        <div shuku-edit-id="e-29380d50-97f4-40cf-834b-8d88ec04a7be" className="r2-studio-assembly">
          <aside shuku-edit-id="e-97603749-5f95-408d-b37d-068624ccbba5" className="r2-studio-palette" aria-label="网络操作工具">
            <Typography shuku-edit-id="e-ed0ab092-3e73-4439-bd3a-ee6b4157e0ae" variant="body" tone="muted">搭建工具</Typography>
            {phase!=='compact'&&<Button className={`r2-studio-tool ${activeTool === 'conv' ? 'is-active' : ''} ${showGuide?'is-guided':''}`} aria-label="拖动3乘3卷积" disabled={ready||(phase === 'depth' ? depth >= 3 : branches.every(n => n >= 3))} onPointerDown={e => start(e, 'conv')} onPointerMove={move} onPointerUp={finish} onPointerCancel={cancel} onClick={e => { if (e.detail === 0) setPickedTool('conv'); }}><GripVertical aria-hidden="true"/><Typography shuku-edit-id="e-9ada3d1b-5972-48c8-85b7-0bfa0cc143c6" as="span" variant="body" tone="inherit">3×3 卷积</Typography><Hand aria-hidden="true"/></Button>}
            {phase !== 'compact' ? <Button className="r2-studio-tool r2-studio-click-tool" aria-label="增加并行分支" disabled={ready||phase !== 'scales' || branches.length >= 3} onClick={addParallelBranch}><Plus aria-hidden="true"/><Typography shuku-edit-id="e-29b500ec-2af9-40db-8327-8d23d3dd4296" as="span" variant="body" tone="inherit">并行分支</Typography></Button> : <>
              <Button className="r2-studio-tool r2-studio-click-tool" aria-label="按通道分组" disabled={ready||(grouped && groupCount >= 4)} onClick={splitChannels}><Columns3 aria-hidden="true"/><Typography shuku-edit-id="e-f619716c-dcd5-4fd3-a8de-669552f143c5" as="span" variant="body" tone="inherit">均分通道</Typography></Button>
              {canWire&&<Button className={`r2-studio-tool r2-studio-click-tool ${activeTool === 'skip' ? 'is-active' : ''}`} aria-label="自由连接模块" disabled={ready} aria-pressed={activeTool === 'skip'} onClick={() => { setPickedTool(wireSource?'skip':activeTool === 'skip' ? null : 'skip'); setWireSource(null);setWireCursor(null);setDrag(null);setOverInput(null);setSelectedEdge(null);setNotice(activeTool==='skip'&&!wireSource?'点击“跳跃连接”可继续连线。':'先选右侧输出点，再选另一组左侧的加号；也可以直接拖线。'); }}><Link2 aria-hidden="true"/><Typography shuku-edit-id="e-295bbd6b-3e50-48a1-8843-85fd70ab7388" as="span" variant="body" tone="inherit">{wireSource?'取消连线':'跳跃连接'}</Typography></Button>}
              
            </>}
          </aside>
          <NetworkStage highlightedScale={highlightedScale} wireDragging={drag?.kind==='wire'} wireSource={wireSource} readOnly={ready} guideDrop={showGuide} phase={phase} lengths={lengths} grouped={grouped} connections={connections} boardRef={board} wiring={canWire&&activeTool==='skip'} selectedGroup={selected} selectedEdge={selectedEdge} over={over} overInput={overInput} invalid={Boolean(hoverError)} draft={pointer} canAdd={canAddConv} onAdd={addConv} onObserve={setSelected} onStartWire={startWire} onMove={move} onFinish={finish} onCancel={cancel} onSelectEdge={key=>{cancel();setSelectedEdge(key);}} onSelectSource={chooseWireSource} onInput={chooseWireInput}/>
          <div shuku-edit-id="e-7f246e84-168e-4d98-99dd-f7db617de774" className="r2-studio-context"><Typography shuku-edit-id="e-5484f173-623e-4fee-8a01-7ff94bc3d672" variant="body" tone={hoverError?'danger':ready?'success':'muted'} aria-live="polite">{context}</Typography></div>
        </div>
      </section>
      <aside shuku-edit-id="e-7288e604-b4b1-4562-90d8-a7c33aed5219" className="r2-studio-sidebar" aria-label="参数量与任务目标">
        <div shuku-edit-id="e-b31b2603-046a-4e77-9edd-73da64e049f7" className={`r2-studio-mission ${ready?'is-complete':''}`} role="region" aria-label="本页目标"><Target aria-hidden="true"/><Typography shuku-edit-id="e-ceea3b85-8dd7-4549-93b5-c566ac832e9d" variant="h3" tone="inherit">{phase==='depth'?'目标：达到7×7':'目标：保留三种尺度'}</Typography></div>
        <div shuku-edit-id="e-5d96c352-b05f-4848-a18d-86bc4f92dd2c" className={`r2-studio-rf-list ${phase==='depth'?'is-single':''}`} role="group" aria-label="感受野示意图与状态">
          {(phase==='depth'?[7]:[3,5,7]).map(n=>{const met=phase==='depth'?ready:observed.includes(n);const current=phase==='depth'?1+2*depth:n;return <div shuku-edit-id="e-f9ee8256-75e7-4016-8faa-ac984c765b3d" key={n} className={`r2-studio-rf-row ${met?'is-met':''} ${canInspectScale?hoveredScale===n?'is-hovered':'':grouped&&selectedRanges.includes(n)?'is-observed':''}`} onPointerEnter={()=>{if(canInspectScale)setHoveredScale(n);}} onPointerLeave={()=>setHoveredScale(null)}>
            <div shuku-edit-id="e-2bc4ca37-8978-4fb3-8875-dde2e2b19286" className="r2-studio-goal-mark" role="checkbox" aria-readonly="true" aria-disabled="true" aria-checked={met} aria-label={`${n}×${n}感受野，自动判定`}>{met&&<Check/>}</div>
            <div shuku-edit-id="e-8dc87df7-705d-40ca-80d2-7535421e3d39" className="r2-studio-field" data-scale={n} aria-label={phase==='depth'?`当前${current}乘${current}，目标7乘7`:`${n}乘${n}感受野网格，${met?'已覆盖':'未达到'}`}>{Array.from({length:121},(_,cell)=>{const distance=Math.max(Math.abs(cell%11-5),Math.abs(Math.floor(cell/11)-5));return <i shuku-edit-id="e-ad8166b3-9e06-4693-869b-a7e43ab774e4" key={cell} className={phase==='depth'?distance<=(current-1)/2?distance===0?'is-center':'is-covered':'':distance<=(n-1)/2?(met?distance===0?'is-center':'is-covered':'is-target'):''}/>;})}</div>
            <div shuku-edit-id="e-5191b9e6-1103-4e96-93f9-fe5141f05e9b"><Typography shuku-edit-id="e-dee4316e-10b0-4aa4-9a4c-30940565bae3" variant="body" tone={met?'accent':'muted'}>{n}×{n}</Typography><Typography shuku-edit-id="e-ec20df4e-b627-4587-970c-c63f8337adc3" variant="body" tone="muted">{phase==='depth'?`当前${current}×${current}`:met?'已保留':'尚未保留'}</Typography></div>
          </div>;})}
        </div>
        <section shuku-edit-id="e-f1a3211f-5543-4bf9-87ba-fd73255f5099" className="r2-studio-cost"><div shuku-edit-id="e-5ef4b2c2-2ec4-4d1a-92aa-73b9c44381f8" className="r2-studio-cost-head"><Typography shuku-edit-id="e-76f052da-bf60-41cf-b8f8-a2351783a9fc" variant="body" tone="accent">参数开销</Typography><div shuku-edit-id="e-af467386-f62b-4028-9489-ccdc9e363def" className="r2-studio-param-legend"><Typography shuku-edit-id="e-d9863d06-6568-4919-882d-311a4ee79f20" variant="body" tone="muted"><i shuku-edit-id="e-358d4e94-9476-4b81-9fd1-d54ce0d67ed7"/>原有</Typography><Typography shuku-edit-id="e-c9f9f40d-5a32-4e4c-9b1f-835c6a5bc961" variant="body" tone="muted"><i shuku-edit-id="e-3c1356f9-e9ad-4c14-9bd8-418e04b3f058"/>新增</Typography></div><Button className="r2-studio-info-button" aria-label="参数计数说明" disabled={ready} aria-expanded={showInfo} onClick={()=>setShowInfo(v=>!v)}><Info/></Button></div>
          <div shuku-edit-id="e-f9af9caf-6f19-437e-9ba8-c791f62fa98f" className="r2-studio-param-bar" role="meter" aria-label="相对普通残差块参数开销" aria-valuemin={0} aria-valuemax={meterMax} aria-valuenow={ratio} aria-valuetext={`普通块的${ratio.toFixed(2)}倍`}>
            <div shuku-edit-id="e-8a543855-9aa9-4f26-8b21-7c02479e5ce6" className="r2-studio-param-retained" style={{width:`${retainedRatio/meterMax*100}%`}}/>
            <div shuku-edit-id="e-1a303a57-0e22-41ba-8d33-5794177de26d" className={ratio>=priorRatio?'r2-studio-param-added':'r2-studio-param-removed'} style={{left:`${retainedRatio/meterMax*100}%`,width:`${Math.abs(ratio-priorRatio)/meterMax*100}%`}}/>
            <span shuku-edit-id="e-dafd2f10-dd34-4bd9-aa1d-0ecb0031a8fb" className="r2-studio-param-current" style={{left:`${ratio/meterMax*100}%`}}/>
          </div>
          <div shuku-edit-id="e-6df58ba2-9606-435e-bf50-82542dfdddeb" className="r2-studio-param-axis">{[0,1,meterMax/4,meterMax/2,meterMax*3/4,meterMax].map(n=><Typography shuku-edit-id="e-d80f113b-1db8-4405-9891-e321b42dfe92" key={n} variant="body" tone="muted" style={{left:`${n/meterMax*100}%`}}>{n===0?'0':`${n}×`}</Typography>)}</div>
          <Typography shuku-edit-id="e-216adc2c-86a3-4971-87bd-7791626e881d" variant="body" tone="accent" aria-live="polite">普通块的 {ratio.toFixed(2)} 倍</Typography>
          {showInfo&&<div shuku-edit-id="e-fc21b48f-6bd8-4dd1-a44e-1d2d9780b1cc" className="r2-studio-info" role="dialog" aria-label="教学参数计数"><Button className="r2-studio-info-close" aria-label="关闭计数说明" onClick={()=>setShowInfo(false)}><X/></Button><Typography shuku-edit-id="e-fe23a7e4-4bfa-41bb-92aa-736a249f860d" variant="body">以普通块为基准；超出量程时刻度扩展。D={D}，不计偏置与BN。绿色为保留权重，橙色为本次增加，虚线为本次减少。参数量不代表实测延迟。当前 {weights.total.toLocaleString()} 个权重。</Typography></div>}
        </section>
        <Typography shuku-edit-id="e-7300a157-722d-4938-a58b-bb27eb5d0ece" variant="body" tone={ready?'success':'muted'} aria-live="polite">{ready?'✓ 目标达成':phase==='depth'?'目标：达到 7×7':'目标：三种尺度同时保留'}</Typography>
      </aside>
    </div>
    {guide&&!drag&&<div shuku-edit-id="e-eb840ee6-842c-49fe-9406-73d80f07d20d" className="r2-studio-onboarding" aria-label="操作提示：按住卷积，拖到下方虚线框后松开">
      <div shuku-edit-id="e-03a44423-059a-458b-acdf-a029d6a84b38" className="r2-studio-guide-label" style={{left:guide.x+140,top:guide.y+85}}><Typography shuku-edit-id="e-cca615a1-2623-49fc-8ee4-8227d14df1c2" variant="body" tone="accent">按住卷积，拖到下方虚线框</Typography></div>
      <div shuku-edit-id="e-0738d80c-c0e1-4524-a557-e54c9ccec4af" className="r2-studio-guide-hand" style={{left:guide.x,top:guide.y,'--guide-dx':`${guide.dx}px`,'--guide-dy':`${guide.dy}px`} as CSSProperties}><Hand/><div shuku-edit-id="e-c4320eef-8079-445b-8917-2807f6decaa0" className="r2-studio-guide-mini"/></div>
    </div>}
    {showCompletion&&<>
    <div shuku-edit-id="e-3c4a0f82-c212-41f4-ae4c-a698a34293fb" className="r2-studio-confetti" aria-hidden="true">{Array.from({length:42},(_,i)=><i shuku-edit-id="e-d049cf31-a7b6-4411-9e47-4f1c3ca82e0e" key={i} style={{left:`${(i*37)%96+2}%`,background:['#63b88a','#efbc62','#7aa4d4','#db88a5'][i%4],animationDelay:`${i%7*.09}s`,'--confetti-drift':`${(i%5-2)*60}px`} as CSSProperties}/>)}</div>
    <section shuku-edit-id="e-48bbaf20-9f3b-4362-8855-723cd325197c" ref={completion} className="r2-studio-completion" role="dialog" tabIndex={-1} aria-modal="false" aria-labelledby="r2-completion-title" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();closeCelebration();}}}>
      <Button className="r2-studio-celebration-close" aria-label="关闭达标提示" onClick={closeCelebration}><X/></Button>
      <div shuku-edit-id="e-11bb0eab-8b9d-448a-a7eb-7efaa8570851" className="r2-studio-completion-icon"><PartyPopper/></div>
      <Typography shuku-edit-id="e-36a0aa41-99b7-4521-858b-a8ab496c3953" id="r2-completion-title" variant="h3" tone="accent">{phase==='depth'?'恭喜！感受野达到 7×7':phase==='scales'?'挑战完成！三种尺度都保留了':'恭喜，你发现了 Res2Net 的核心思路！'}</Typography>
      <Typography shuku-edit-id="e-5d644942-4ba0-4e83-bbb7-74944d414707" variant="body" tone="muted">{phase==='depth'?'你让网络看得更远了！下一关，同时保留三种尺度。':phase==='scales'?'不同尺度已经一起工作了！下一关，试着减少参数开销。':'均分通道，用三个窄卷积在组间接力，再保留各组输出。你亲手找到了在一个残差块内组合多尺度的思路，这正是 Res2Net 的核心。'}</Typography>
      {phase==='compact'?<Typography shuku-edit-id="e-522370c0-75e4-48fa-a34f-4ff84296464a" variant="body" tone="muted"><a shuku-edit-id="e-3b38eb94-3b7b-4b91-961c-c109ebca49ba" href="https://arxiv.org/abs/1904.01169" target="_blank" rel="noreferrer">Res2Net: A New Multi-scale Backbone Architecture · IEEE TPAMI 2021 ↗</a></Typography>:<Typography shuku-edit-id="e-bd9bf918-ad16-48cc-879d-09aacfea76a8" variant="body" tone="muted">确认后，将从默认残差块重新开始。</Typography>}
      <div shuku-edit-id="e-d7d58739-3ebf-4040-878c-e77275988fb4" className="r2-studio-completion-actions">{phase==='compact'?<Button className="r2-studio-next" onClick={closeCelebration}><Typography shuku-edit-id="e-bf64b1f9-0120-4a96-a78b-2c9f1de46574" variant="body" tone="inherit">返回网络结构</Typography><ArrowRight/></Button>:<><Button className="r2-studio-action" onClick={closeCelebration}><Typography shuku-edit-id="e-1e3d94f0-1aaf-47b6-8de2-e6a333f181e7" variant="body" tone="inherit">再看看当前结构</Typography></Button><Button className="r2-studio-next" data-r2-continue onClick={next}><Typography shuku-edit-id="e-ae95f13d-2227-423b-a911-ee9f8d252248" variant="body" tone="inherit">{phase==='depth'?'开始多尺度挑战':'开始低开销挑战'}</Typography><ArrowRight/></Button></>}</div>
    </section></>}
    {drag?.kind === 'conv' && rootRect && <div shuku-edit-id="e-52cce93e-81c5-45bb-a66c-5dbf2a8e6b2a" className={`r2-studio-ghost ${phase==='compact'?'is-compact':''} ${grouped?'is-grouped':''}`} aria-hidden="true" style={{ left: (drag.x - rootRect.left) * 1600 / rootRect.width, top: (drag.y - rootRect.top) * 900 / rootRect.height }}><Typography shuku-edit-id="e-12581fce-37e8-4acd-afed-2da3a313b9dd" variant="body" tone="inherit" wrap="nowrap">3×3</Typography><Typography shuku-edit-id="e-605442e8-f84f-44f2-b689-efe3c6bda18c" variant="body" tone="inherit" wrap="nowrap">{grouped?`D/${groupCount}`:'卷积'}</Typography></div>}
  </ContentBlock>;
}
