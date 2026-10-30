import { useEffect, useRef, useState, type PointerEvent, type CSSProperties } from 'react';
import { GripVertical, Link2, RotateCcw, Undo2, ArrowRight, Columns3, Info, X, Plus, Check, Hand, Target, PartyPopper } from 'lucide-react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
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

  return <ContentBlock ref={root} className={`r2-studio-page ${drag?.kind==='conv'?'is-dragging-conv':''}`} headingLevel={1} title="让教学、实践与研究相互启发" subtitle="用研究案例组织探索，让学生的理解与想法获得实践机会" bodyClassName="r2-studio-body" onPointerMove={followWire} onKeyDown={e => { if (e.target instanceof Element && e.target.closest('button') && [' ', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(e.key)) e.stopPropagation(); if (e.key === 'Escape') cancel(); if (e.key === 'Delete' && selectedEdge) { e.preventDefault(); e.stopPropagation(); removeWire(); } }}>
    <div className="r2-studio-layout">
      <section className="r2-studio-workspace" aria-label="网络实验台">
        <div className="r2-studio-topbar"><div className="r2-studio-actions">
          {!ready&&<Button className="r2-studio-action" aria-label="撤回" disabled={!history.length} onClick={undo}><Undo2 aria-hidden="true"/><Typography as="span" variant="body" tone="inherit">撤回</Typography></Button>}
          <Button className="r2-studio-action" aria-label="重置当前目标" disabled={showCompletion} onClick={restartStage}><RotateCcw aria-hidden="true"/><Typography as="span" variant="body" tone="inherit">重置</Typography></Button>
          {selectedEdge && <Button className="r2-studio-action" aria-label="删除所选连接" disabled={ready} onClick={removeWire}><X aria-hidden="true"/><Typography as="span" variant="body" tone="inherit">删线</Typography></Button>}
          {ready&&phase!=='compact'&&!showCompletion&&<Button className="r2-studio-next" onClick={next}><Typography as="span" variant="body" tone="inherit">继续挑战</Typography><ArrowRight/></Button>}
        </div></div>
        <div className="r2-studio-assembly">
          <aside className="r2-studio-palette" aria-label="网络操作工具">
            <Typography variant="body" tone="muted">搭建工具</Typography>
            {phase!=='compact'&&<Button className={`r2-studio-tool ${activeTool === 'conv' ? 'is-active' : ''} ${showGuide?'is-guided':''}`} aria-label="拖动3乘3卷积" disabled={ready||(phase === 'depth' ? depth >= 3 : branches.every(n => n >= 3))} onPointerDown={e => start(e, 'conv')} onPointerMove={move} onPointerUp={finish} onPointerCancel={cancel} onClick={e => { if (e.detail === 0) setPickedTool('conv'); }}><GripVertical aria-hidden="true"/><Typography as="span" variant="body" tone="inherit">3×3 卷积</Typography><Hand aria-hidden="true"/></Button>}
            {phase !== 'compact' ? <Button className="r2-studio-tool r2-studio-click-tool" aria-label="增加并行分支" disabled={ready||phase !== 'scales' || branches.length >= 3} onClick={addParallelBranch}><Plus aria-hidden="true"/><Typography as="span" variant="body" tone="inherit">并行分支</Typography></Button> : <>
              <Button className="r2-studio-tool r2-studio-click-tool" aria-label="按通道分组" disabled={ready||(grouped && groupCount >= 4)} onClick={splitChannels}><Columns3 aria-hidden="true"/><Typography as="span" variant="body" tone="inherit">均分通道</Typography></Button>
              {canWire&&<Button className={`r2-studio-tool r2-studio-click-tool ${activeTool === 'skip' ? 'is-active' : ''}`} aria-label="自由连接模块" disabled={ready} aria-pressed={activeTool === 'skip'} onClick={() => { setPickedTool(wireSource?'skip':activeTool === 'skip' ? null : 'skip'); setWireSource(null);setWireCursor(null);setDrag(null);setOverInput(null);setSelectedEdge(null);setNotice(activeTool==='skip'&&!wireSource?'点击“跳跃连接”可继续连线。':'先选右侧输出点，再选另一组左侧的加号；也可以直接拖线。'); }}><Link2 aria-hidden="true"/><Typography as="span" variant="body" tone="inherit">{wireSource?'取消连线':'跳跃连接'}</Typography></Button>}
              
            </>}
          </aside>
          <NetworkStage highlightedScale={highlightedScale} wireDragging={drag?.kind==='wire'} wireSource={wireSource} readOnly={ready} guideDrop={showGuide} phase={phase} lengths={lengths} grouped={grouped} connections={connections} boardRef={board} wiring={canWire&&activeTool==='skip'} selectedGroup={selected} selectedEdge={selectedEdge} over={over} overInput={overInput} invalid={Boolean(hoverError)} draft={pointer} canAdd={canAddConv} onAdd={addConv} onObserve={setSelected} onStartWire={startWire} onMove={move} onFinish={finish} onCancel={cancel} onSelectEdge={key=>{cancel();setSelectedEdge(key);}} onSelectSource={chooseWireSource} onInput={chooseWireInput}/>
          <div className="r2-studio-context"><Typography variant="body" tone={hoverError?'danger':ready?'success':'muted'} aria-live="polite">{context}</Typography></div>
        </div>
      </section>
      <aside className="r2-studio-sidebar" aria-label="参数量与任务目标">
        <div className={`r2-studio-mission ${ready?'is-complete':''}`} role="region" aria-label="本页目标"><Target aria-hidden="true"/><Typography variant="h3" tone="inherit">{phase==='depth'?'目标：达到7×7':'目标：保留三种尺度'}</Typography></div>
        <div className={`r2-studio-rf-list ${phase==='depth'?'is-single':''}`} role="group" aria-label="感受野示意图与状态">
          {(phase==='depth'?[7]:[3,5,7]).map(n=>{const met=phase==='depth'?ready:observed.includes(n);const current=phase==='depth'?1+2*depth:n;return <div key={n} className={`r2-studio-rf-row ${met?'is-met':''} ${canInspectScale?hoveredScale===n?'is-hovered':'':grouped&&selectedRanges.includes(n)?'is-observed':''}`} onPointerEnter={()=>{if(canInspectScale)setHoveredScale(n);}} onPointerLeave={()=>setHoveredScale(null)}>
            <div className="r2-studio-goal-mark" role="checkbox" aria-readonly="true" aria-disabled="true" aria-checked={met} aria-label={`${n}×${n}感受野，自动判定`}>{met&&<Check/>}</div>
            <div className="r2-studio-field" data-scale={n} aria-label={phase==='depth'?`当前${current}乘${current}，目标7乘7`:`${n}乘${n}感受野网格，${met?'已覆盖':'未达到'}`}>{Array.from({length:121},(_,cell)=>{const distance=Math.max(Math.abs(cell%11-5),Math.abs(Math.floor(cell/11)-5));return <i key={cell} className={phase==='depth'?distance<=(current-1)/2?distance===0?'is-center':'is-covered':'':distance<=(n-1)/2?(met?distance===0?'is-center':'is-covered':'is-target'):''}/>;})}</div>
            <div><Typography variant="body" tone={met?'accent':'muted'}>{n}×{n}</Typography><Typography variant="body" tone="muted">{phase==='depth'?`当前${current}×${current}`:met?'已保留':'尚未保留'}</Typography></div>
          </div>;})}
        </div>
        <section className="r2-studio-cost"><div className="r2-studio-cost-head"><Typography variant="body" tone="accent">参数开销</Typography><div className="r2-studio-param-legend"><Typography variant="body" tone="muted"><i/>原有</Typography><Typography variant="body" tone="muted"><i/>新增</Typography></div><Button className="r2-studio-info-button" aria-label="参数计数说明" disabled={ready} aria-expanded={showInfo} onClick={()=>setShowInfo(v=>!v)}><Info/></Button></div>
          <div className="r2-studio-param-bar" role="meter" aria-label="相对普通残差块参数开销" aria-valuemin={0} aria-valuemax={meterMax} aria-valuenow={ratio} aria-valuetext={`普通块的${ratio.toFixed(2)}倍`}>
            <div className="r2-studio-param-retained" style={{width:`${retainedRatio/meterMax*100}%`}}/>
            <div className={ratio>=priorRatio?'r2-studio-param-added':'r2-studio-param-removed'} style={{left:`${retainedRatio/meterMax*100}%`,width:`${Math.abs(ratio-priorRatio)/meterMax*100}%`}}/>
            <span className="r2-studio-param-current" style={{left:`${ratio/meterMax*100}%`}}/>
          </div>
          <div className="r2-studio-param-axis">{[0,1,meterMax/4,meterMax/2,meterMax*3/4,meterMax].map(n=><Typography key={n} variant="body" tone="muted" style={{left:`${n/meterMax*100}%`}}>{n===0?'0':`${n}×`}</Typography>)}</div>
          <Typography variant="body" tone="accent" aria-live="polite">普通块的 {ratio.toFixed(2)} 倍</Typography>
          {showInfo&&<div className="r2-studio-info" role="dialog" aria-label="教学参数计数"><Button className="r2-studio-info-close" aria-label="关闭计数说明" onClick={()=>setShowInfo(false)}><X/></Button><Typography variant="body">以普通块为基准；超出量程时刻度扩展。D={D}，不计偏置与BN。绿色为保留权重，橙色为本次增加，虚线为本次减少。参数量不代表实测延迟。当前 {weights.total.toLocaleString()} 个权重。</Typography></div>}
        </section>
        <Typography variant="body" tone={ready?'success':'muted'} aria-live="polite">{ready?'✓ 目标达成':phase==='depth'?'目标：达到 7×7':'目标：三种尺度同时保留'}</Typography>
      </aside>
    </div>
    {guide&&!drag&&<div className="r2-studio-onboarding" aria-label="操作提示：按住卷积，拖到下方虚线框后松开">
      <div className="r2-studio-guide-label" style={{left:guide.x+140,top:guide.y+85}}><Typography variant="body" tone="accent">按住卷积，拖到下方虚线框</Typography></div>
      <div className="r2-studio-guide-hand" style={{left:guide.x,top:guide.y,'--guide-dx':`${guide.dx}px`,'--guide-dy':`${guide.dy}px`} as CSSProperties}><Hand/><div className="r2-studio-guide-mini"/></div>
    </div>}
    {showCompletion&&<>
    <div className="r2-studio-confetti" aria-hidden="true">{Array.from({length:42},(_,i)=><i key={i} style={{left:`${(i*37)%96+2}%`,background:['#63b88a','#efbc62','#7aa4d4','#db88a5'][i%4],animationDelay:`${i%7*.09}s`,'--confetti-drift':`${(i%5-2)*60}px`} as CSSProperties}/>)}</div>
    <section ref={completion} className="r2-studio-completion" role="dialog" tabIndex={-1} aria-modal="false" aria-labelledby="r2-completion-title" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();closeCelebration();}}}>
      <Button className="r2-studio-celebration-close" aria-label="关闭达标提示" onClick={closeCelebration}><X/></Button>
      <div className="r2-studio-completion-icon"><PartyPopper/></div>
      <Typography id="r2-completion-title" variant="h3" tone="accent">{phase==='depth'?'恭喜！感受野达到 7×7':phase==='scales'?'挑战完成！三种尺度都保留了':'恭喜，你发现了 Res2Net 的核心思路！'}</Typography>
      <Typography variant="body" tone="muted">{phase==='depth'?'你让网络看得更远了！下一关，同时保留三种尺度。':phase==='scales'?'不同尺度已经一起工作了！下一关，试着减少参数开销。':'均分通道，用三个窄卷积在组间接力，再保留各组输出。你亲手找到了在一个残差块内组合多尺度的思路，这正是 Res2Net 的核心。'}</Typography>
      {phase==='compact'?<Typography variant="body" tone="muted"><a href="https://arxiv.org/abs/1904.01169" target="_blank" rel="noreferrer">Res2Net: A New Multi-scale Backbone Architecture · IEEE TPAMI 2021 ↗</a></Typography>:<Typography variant="body" tone="muted">确认后，将从默认残差块重新开始。</Typography>}
      <div className="r2-studio-completion-actions">{phase==='compact'?<Button className="r2-studio-next" onClick={closeCelebration}><Typography variant="body" tone="inherit">返回网络结构</Typography><ArrowRight/></Button>:<><Button className="r2-studio-action" onClick={closeCelebration}><Typography variant="body" tone="inherit">再看看当前结构</Typography></Button><Button className="r2-studio-next" data-r2-continue onClick={next}><Typography variant="body" tone="inherit">{phase==='depth'?'开始多尺度挑战':'开始低开销挑战'}</Typography><ArrowRight/></Button></>}</div>
    </section></>}
    {drag?.kind === 'conv' && rootRect && <div className={`r2-studio-ghost ${phase==='compact'?'is-compact':''} ${grouped?'is-grouped':''}`} aria-hidden="true" style={{ left: (drag.x - rootRect.left) * 1600 / rootRect.width, top: (drag.y - rootRect.top) * 900 / rootRect.height }}><Typography variant="body" tone="inherit" wrap="nowrap">3×3</Typography><Typography variant="body" tone="inherit" wrap="nowrap">{grouped?`D/${groupCount}`:'卷积'}</Typography></div>}
  </ContentBlock>;
}
