import { useEffect, type CSSProperties, type PointerEvent, type RefObject } from 'react';
import { Plus, ArrowUp } from 'lucide-react';
import { Button, Typography } from "@shuku/course-style/react";
import { convId, graphNodes, connectionError, receptiveFieldPath, type Connection } from './res2netGraph';

type Point = { x: number; y: number };
type Tile = Point & { id: string; kind: 'input' | 'pointwise' | 'conv' | 'sum' | 'output'; width: number; branch?: number; label: string; detail?: string };
type StageProps = {
  readOnly?: boolean;
  guideDrop?: boolean;
  highlightedScale?: number;
  wireSource: string | null;
  wireDragging: boolean;
  phase: 'depth' | 'scales' | 'compact'; lengths: number[]; grouped: boolean; connections: Connection[];
  boardRef: RefObject<HTMLDivElement | null>; wiring: boolean; selectedGroup: number; selectedEdge: string | null;
  over: number | null; overInput: string | null; invalid: boolean; draft: { from: string; x: number; y: number } | null;
  canAdd: (branch: number) => boolean; onAdd: (branch: number) => void; onObserve: (branch: number) => void;
  onStartWire: (e: PointerEvent<HTMLElement>, id: string) => void; onMove: (e: PointerEvent<HTMLElement>) => void;
  onFinish: (e: PointerEvent<HTMLElement>) => void; onCancel: () => void; onSelectEdge: (key: string) => void;
  onSelectSource: (id: string) => void; onInput: (id: string) => void;
};
const place = ({ x, y }: Point): CSSProperties => ({ left: x, top: y });

function routeGroupConnection(source: Point, target: Point): Point[] {
  if (Math.abs(target.x-source.x)<24 && Math.abs(target.y-source.y)<24) {
    return [source,{x:target.x,y:source.y},target];
  }
  if (target.x>=source.x+32) {
    const bend=(source.x+target.x)/2;
    return [source,{x:bend,y:source.y},{x:bend,y:target.y},target];
  }
  // Returning toward the left: exit to the right, cross the gap between rows,
  // then approach the input vertically instead of cutting through a convolution.
  const exitX=source.x+24;
  const direction=target.y<source.y?-1:1;
  let laneY=source.y+direction*70;
  if(laneY<30||laneY>510)laneY=source.y-direction*70;
  return [source,{x:exitX,y:source.y},{x:exitX,y:laneY},{x:target.x,y:laneY},target];
}

/** New native DOM scene: every operator and connector has its own geometry and hit area. */
function Connector({ points, kind = '', label, onSelect, arrow = true, disabled = false }: { points: Point[]; kind?: string; label?: string; onSelect?: () => void; arrow?: boolean; disabled?: boolean }) {
  return <div shuku-edit-id="e-a59a64ec-05a4-4a26-b4bf-c93691d4c367" className={`r2-studio-connector ${kind}`} role={onSelect ? 'group' : undefined} aria-label={label}>
    {points.slice(1).map((point, i) => {
      const start = points[i], dx = point.x - start.x, dy = point.y - start.y;
      if (Math.hypot(dx, dy) < .1) return null;
      const style: CSSProperties = { left: start.x, top: start.y, width: Math.hypot(dx, dy), transform: `rotate(${Math.atan2(dy, dx)}rad)` };
      const content = <span shuku-edit-id="e-393e83fa-cc1e-4acc-820b-85722f1ba1dd" className={`r2-studio-stroke ${arrow && i === points.length - 2 ? 'has-arrow' : ''}`}/>;
      return onSelect ? <button shuku-edit-id="e-870c04bb-aaed-4d56-afea-f3c5865a5667" key={i} type="button" disabled={disabled} className="r2-studio-edge-segment" style={style} aria-label={label} onClick={onSelect}>{content}</button> : <span shuku-edit-id="e-920cb6af-7c27-4797-af98-95ba91d11d58" key={i} className="r2-studio-edge-segment" style={style}>{content}</span>;
    })}
  </div>;
}

export function NetworkStage(props: StageProps) {
  const { phase, lengths, grouped, connections } = props;
  const groups = grouped ? lengths.length + 1 : 1;
  const modules = graphNodes(lengths, connections);
  const multi = grouped || lengths.length > 1;
  const center = multi ? 300 : 294;
  const row = (branch: number) => grouped ? 190 + branch * 140 : lengths.length === 1 ? center : 166 + branch * 134;
  const column = (level: number) => 338 + 144 * level;
  const lastLevel = Math.max(0, ...modules.map(node => phase==='compact'?node.level:node.layer));
  const slotLevel = Math.max(lastLevel, ...lengths.map((count,branch)=>props.canAdd(branch)?(phase==='compact'?(modules.find(node=>node.id===convId(branch,count-1))?.level??-1)+1:count):0));
  const fusionX = column(slotLevel)+156, junctionX=fusionX-68, sumX=fusionX+108, outputX=fusionX+204;
  const sceneWidth=Math.max(1040,outputX+54);
  useEffect(()=>{const viewport=props.boardRef.current;if(viewport)viewport.scrollTo({left:Math.max(0,sceneWidth-1040),behavior:'smooth'});},[sceneWidth,props.boardRef]);
  const tileById = new Map<string, Tile>();
  const common: Tile[] = [
    { id: 'input', x: 48, y: center, width: 92, kind: 'input', label: '输入', detail: 'D 通道' },
    { id: 'mix-in', x: 180, y: center, width: 96, kind: 'pointwise', label: '1×1', detail: '卷积' },
    { id: 'mix-out', x: fusionX, y: center, width: 96, kind: 'pointwise', label: '1×1', detail: '卷积' },
    { id: 'sum', x: sumX, y: center, width: 48, kind: 'sum', label: '+' },
    { id: 'output', x: outputX, y: center, width: 92, kind: 'output', label: '输出', detail: 'D 通道' },
  ];
  modules.forEach(module => tileById.set(module.id, { id: module.id, x: column(phase === 'compact' ? module.level : module.layer), y: row(module.branch), width: grouped ? 80 : 106, kind: 'conv', branch: module.branch, label: '3×3', detail: grouped ? `D/${groups}` : '卷积' }));
  const tiles = [...common, ...tileById.values()];
  const startPort = (tile: Tile): Point => ({ x: tile.x + tile.width / 2, y: tile.y });
  const endPort = (tile: Tile): Point => ({ x: tile.x - tile.width / 2 - (grouped&&(props.wiring||connections.some(edge=>edge.to===tile.id))?20:0), y: tile.y });
  const edgeName = (id: string) => { const node = modules.find(n => n.id === id)!; return `${grouped ? `第${node.branch + 2}组` : `分支${node.branch + 1}`}第${node.layer + 1}个卷积`; };
  const highlightedPath=props.highlightedScale===undefined?[]:receptiveFieldPath(lengths,connections,props.highlightedScale);
  const inspectingScale=highlightedPath.length>0;
  const firstHighlighted=highlightedPath[0],lastHighlighted=highlightedPath[highlightedPath.length-1];
  const highlight=(active:boolean)=>inspectingScale?active?'is-rf-highlighted':'is-rf-muted':'';
  const nodeHighlight=(id:string)=>highlight(highlightedPath.includes(id));
  const pathEdge=(from:string,to:string)=>highlightedPath.some((id,index)=>id===from&&highlightedPath[index+1]===to);
  const connectors: { points: Point[]; kind?: string; arrow?: boolean }[] = [
    { points: [{ x: 94, y: center }, { x: 132, y: center }],kind:highlight(true) },
    { points: [{ x: fusionX+48, y: center }, { x: sumX-24, y: center }],kind:highlight(true) },
    { points: [{ x: sumX+24, y: center }, { x: outputX-46, y: center }],kind:highlight(true) },
    { points: [{ x: 48, y: center - 51 }, { x: 48, y: multi ? 66 : 164 }, { x: sumX, y: multi ? 66 : 164 }, { x: sumX, y: center - 24 }], kind: `is-identity ${highlight(false)}` },
  ];
  lengths.forEach((count, branch) => {
    const y = row(branch), first = tileById.get(convId(branch, 0));
    connectors.push({ points: [{ x: 228, y: center }, { x: 264, y: center }, { x: 264, y }, { x: first ? endPort(first).x : junctionX, y }],kind:highlight(first?.id===firstHighlighted) });
    for (let j = 0; j < count; j++) {
      const tile = tileById.get(convId(branch, j))!, next = tileById.get(convId(branch, j + 1));
      connectors.push({ points: [startPort(tile), { x: next ? endPort(next).x : junctionX, y }], arrow:Boolean(next),kind:highlight(next?pathEdge(tile.id,next.id):tile.id===lastHighlighted) });
    }
    connectors.push({ points: [{ x: junctionX, y }, { x: junctionX, y: center }, { x: fusionX-48, y: center }],kind:highlight(convId(branch,count-1)===lastHighlighted) });
  });
  if (grouped) connectors.push({ points: [{ x: 228, y: center }, { x: 264, y: center }, { x: 264, y: 102 }, { x: junctionX, y: 102 }, { x: junctionX, y: center }, { x: fusionX-48, y: center }],kind:highlight(false) });
  const draftSource = props.draft && tileById.get(props.draft.from);
  const draftStart = draftSource && startPort(draftSource);
  return <div shuku-edit-id="e-72813e41-e9c5-461d-b371-095255e74138" className={`r2-studio-stage ${phase==='compact'?'is-compact':''} ${props.wiring ? 'is-wiring' : ''} ${props.readOnly?'is-readonly':''} ${inspectingScale?'is-rf-inspecting':''}`} inert={props.readOnly} ref={props.boardRef} aria-label="可编辑残差网络" data-ppt-viewport="可横向浏览自由搭建的网络"><div shuku-edit-id="e-f9b8fc4f-96b7-4218-a350-44a837d2f6d1" className="r2-studio-scene" style={{width:sceneWidth}}>
    <div shuku-edit-id="e-202f8132-b426-4813-9dc5-efd584e86069" className="r2-studio-links" aria-label="网络连接">{connectors.map((edge, i) => <Connector key={i} {...edge}/>)}
      {connections.map(edge => {
        const source = startPort(tileById.get(edge.from)!), target = endPort(tileById.get(edge.to)!);
        return <Connector key={`${edge.from}>${edge.to}`} points={routeGroupConnection(source,target)} kind={`is-jump ${highlight(pathEdge(edge.from,edge.to))} ${props.selectedEdge === `${edge.from}>${edge.to}` ? 'is-selected' : ''}`} label={`选择连接：${edgeName(edge.from)}到${edgeName(edge.to)}`} disabled={props.readOnly} onSelect={() => props.onSelectEdge(`${edge.from}>${edge.to}`)}/>;
      })}
      {draftStart && props.draft && <Connector kind={props.invalid ? 'is-draft is-invalid' : 'is-draft'} points={routeGroupConnection(draftStart,props.draft)}/>}
    </div>
    <Typography shuku-edit-id="e-ab52f4e6-7222-4dc2-92ba-906da865e09d" className="r2-studio-diagram-caption" variant="body" tone={props.wiring?'accent':'muted'} style={place({ x: 470, y: multi ? 25 : 127 })}>{props.wiring?props.wireSource?'再选另一组亮起的加号，完成相加':'先选一个亮起的输出点':grouped ? `总宽 D · ${groups}组，每组 D/${groups}` : multi ? '每条分支 D 通道' : '恒等映射 · 总宽 D 不变'}</Typography>
    {grouped && <Button className={`r2-studio-observe ${props.selectedGroup === -1 ? 'is-selected' : ''}`} style={place({ x: 480, y: 102 })} aria-label="观察第1组输入直通" disabled={props.readOnly} onClick={() => props.onObserve(-1)}><Typography shuku-edit-id="e-bde37d95-1087-4463-ab10-36a20855b11c" variant="body" tone="inherit">直通 · D/{groups}</Typography></Button>}
    {tiles.map(tile => {
      const canReceive = Boolean(props.wiring&&!props.readOnly&&props.wireSource&&!connectionError(lengths,connections,props.wireSource,tile.id));
      const canStart = props.wiring&&!props.readOnly&&!props.wireSource;
      const capturing = props.wireDragging&&props.draft?.from===tile.id;
      const observable = tile.kind==='conv'&&!props.wiring;
      return <div shuku-edit-id="e-5e233964-6a65-4be3-8ff0-b9adc943faf3" key={tile.id}>
      <div shuku-edit-id="e-5be31e06-d870-4358-8889-9c91bee7632f" className={`r2-studio-tile is-${tile.kind} ${tile.kind==='conv'?nodeHighlight(tile.id):highlight(true)} ${props.overInput === tile.id ? props.invalid ? 'is-invalid-target' : 'is-wire-target' : ''}`} style={{ ...place(tile), width: tile.width }} data-r2-node={tile.kind === 'conv' ? tile.id : undefined} role={observable?'button':undefined} aria-disabled={observable?props.readOnly:undefined} tabIndex={observable?(props.readOnly?-1:0):undefined} aria-label={observable?`观察${edgeName(tile.id)}`:undefined} onClick={()=>{if(tile.branch!==undefined&&!props.wiring)props.onObserve(tile.branch);}} onKeyDown={e=>{if(observable&&tile.branch!==undefined&&e.key==='Enter')props.onObserve(tile.branch);}}>
        {tile.kind === 'sum' ? <Plus/> : <><Typography shuku-edit-id="e-b5c51032-6948-460f-a6b3-f6b4d805b05d" variant="body" tone="inherit">{tile.label}</Typography>{tile.detail&&<Typography shuku-edit-id="e-dce433b1-21e3-49c2-aeb4-ca2eb95d1f76" variant="body" tone="inherit">{tile.detail}</Typography>}</>}
      </div>
      {tile.kind === 'conv' && (!multi ? <Typography shuku-edit-id="e-85313e8e-549d-4f46-84d3-134ac0848e23" className="r2-studio-dimension" variant="body" tone="accent" style={place({ x: tile.x, y: tile.y + 82 })}>D → D</Typography> : null)}
      {tile.kind === 'conv' && grouped && modules.length > 1 && <>
        {(props.wiring||connections.some(edge=>edge.to===tile.id))&&<Button className={`r2-studio-port is-input is-sum ${nodeHighlight(tile.id)} ${canReceive?'is-available':'is-muted'} ${props.overInput === tile.id ? props.invalid ? 'is-invalid' : 'is-over' : ''}`} style={place(endPort(tile))} data-r2-input={tile.id} disabled={!canReceive} aria-label={`连接到${edgeName(tile.id)}输入加号`} onClick={() => props.onInput(tile.id)}><Plus/></Button>}
        {props.wiring&&<Button className={`r2-studio-port is-output ${canStart?'is-available':'is-muted'}`} disabled={!canStart&&!capturing} aria-disabled={!canStart} style={place(startPort(tile))} data-r2-output={tile.id} aria-label={`从${edgeName(tile.id)}输出连线`} onPointerDown={e => props.onStartWire(e, tile.id)} onPointerMove={props.onMove} onPointerUp={props.onFinish} onPointerCancel={props.onCancel} onClick={e => { if (e.detail === 0) props.onSelectSource(tile.id); }}><span shuku-edit-id="e-3aba3556-5e8a-4927-a73c-e5552ea1e552"/></Button>}
      </>}
    </div>;})}
    {lengths.map((count, branch) => {
      const last = tileById.get(convId(branch, count - 1));
      const slot = { x: column(last ? (last.x - column(0)) / 144 + 1 : 0), y: row(branch) };
      return <div shuku-edit-id="e-fe6650d8-5e83-4792-85f5-59d53aa23e5c" key={branch}>
        {props.canAdd(branch) && <Button className={`r2-studio-drop ${props.over === branch ? 'is-over' : ''} ${props.guideDrop?'is-guided':''}`} style={place(slot)} data-r2-target={branch} data-r2-kind="conv" aria-label={`在第${branch + 1}条分支增加卷积`} disabled={props.readOnly} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); props.onAdd(branch); } }}><Typography shuku-edit-id="e-8b472b82-6a5f-4d36-a05c-884853d3e306" variant="body" tone="inherit">{props.over === branch ? '松开吸附' : '拖入卷积'}</Typography></Button>}
      </div>;
    })}
    {!multi && props.canAdd(0) && <div shuku-edit-id="e-f0468a1a-7487-4d10-8abc-92e951086c4c" className="r2-studio-slot-hint" style={place({ x: column(lengths[0]), y: center + 140 })}><ArrowUp/><Typography shuku-edit-id="e-379f0ca6-8c9b-45ac-930c-b1bbf8f73655" variant="body" tone="muted">拖入后，覆盖范围会怎样变化？</Typography></div>}
    {multi && <Typography shuku-edit-id="e-e1ed33a4-64c0-4ce1-8af6-c9239205f6f0" className="r2-studio-dimension" variant="body" tone="muted" style={place({ x: fusionX, y: center + 87 })}>{grouped ? '拼接融合' : `${lengths.length}D → D`}</Typography>}
  </div></div>;
}
