import { transformerAsset } from '../../assetUrls';
import { AssemblyFeedbackBody } from './AssemblyFeedbackBody';
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../../shared/react/controls/Button';
import { LessonStage } from '../LessonStage';
import { SvgPathTraveler } from './SvgPathTraveler';
import { decoderAssemblyFeedback } from '../../domain/assemblyFeedback';
import './DecoderBlockBuilder.css';
interface DecoderBlockBuilderProps {
    onComplete: () => void;
}
type PieceId = 'masked' | 'cross' | 'norm' | 'ffn';
type Piece = {
    id: PieceId;
    title: string;
    detail: string;
    image: string;
    count: number;
};
const pieces: Piece[] = [
    { id: 'masked', title: '掩码多头自注意力', detail: '译文 Q/K/V', image: transformerAsset("07_架构拼装/多头注意力.svg"), count: 1 },
    { id: 'cross', title: '交叉注意力', detail: '译文 Q；源句 K/V', image: transformerAsset("07_架构拼装/多头注意力.svg"), count: 1 },
    { id: 'norm', title: '残差连接与层规范化', detail: '三个子层后各一次', image: transformerAsset("07_架构拼装/残差与规范化.svg"), count: 3 },
    { id: 'ffn', title: '逐位前馈网络', detail: '每个词元独立加工', image: transformerAsset("07_架构拼装/前馈网络.svg"), count: 1 },
];
const expectedSlots: PieceId[] = ['masked', 'norm', 'cross', 'norm', 'ffn', 'norm'];
const layerColors = ['#268bb1', '#249e89', '#657cbd', '#a675b3', '#d08558', '#c96b75'];
const transferDurationMs = 1800;
const layerPauseMs = 280;
const slotY = [452, 382, 312, 242, 172, 102];
const encoderNodes = [
    { title: '多头自注意力', image: pieces[0].image, y: 430, tone: 'attention' },
    { title: '残差连接与层规范化', image: pieces[2].image, y: 320, tone: 'norm' },
    { title: '逐位前馈网络', image: pieces[3].image, y: 210, tone: 'ffn' },
    { title: '残差连接与层规范化', image: pieces[2].image, y: 100, tone: 'norm' },
] as const;
function initialMatrix(seed: number) {
    return Array.from({ length: 30 }, (_, index) => ((index * 17 + (index % 6) * 13 + seed) % 83) / 100 + .09);
}
function nextMatrix(values: number[], layer: number) {
    return values.map((value, index) => Math.max(.08, Math.min(.95, .48 * value + .31 * values[(index + layer * 7 + 5) % values.length]
        + .21 * values[(index * 3 + 11) % values.length]
        + .08 * Math.sin((index + 2) * layer))));
}
function MatrixCells({ values, tone }: {
    values: number[];
    tone: 'source' | 'target' | 'output';
}) {
    return <span className={`tr-dec-builder-matrix is-${tone}`} aria-hidden="true">{values.map((value, index) => <i key={index} style={{ opacity: .28 + value * .68 }}/>)}</span>;
}
function MatrixPort({ title, shape, values, tone }: {
    title: string;
    shape: string;
    values: number[];
    tone: 'source' | 'target' | 'output';
}) {
    return <div className={`tr-dec-builder-port is-${tone}`}><MatrixCells values={values} tone={tone}/><span><strong>{title}</strong><small>{shape}</small></span></div>;
}
function DecoderSlot({ index, expected, installed, hovered, selectedId, onInstall, onRemove, onInspect }: {
    index: number;
    expected: PieceId;
    installed: PieceId | null;
    hovered: boolean;
    selectedId: PieceId | null;
    onInstall: (index: number, piece: PieceId) => void;
    onRemove: (index: number) => void;
    onInspect: (index: number) => void;
}) {
    const piece = pieces.find(item => item.id === installed);
    const wrong = installed !== null && installed !== expected;
    return <div className={`tr-dec-builder-slot is-${installed ?? expected}${installed ? ' is-installed' : ' is-empty'}${hovered ? ' is-hovered' : ''}${wrong ? ' is-wrong' : ''}`} data-decoder-slot-index={index} role="button" tabIndex={0} aria-label={`解码器第 ${index + 1} 个安装位，${piece ? `已安装${piece.title}` : '待安装'}`} onClick={() => { if (selectedId)
        onInstall(index, selectedId);
    else
        onInspect(index); }} onFocus={() => onInspect(index)} onKeyDown={event => { if (selectedId && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onInstall(index, selectedId);
    } }}>
    {piece ? <><img src={piece.image} alt=""/><strong>{piece.title}</strong>{wrong && <button type="button" onClick={event => { event.stopPropagation(); onRemove(index); }} aria-label="撤回错误安装">×</button>}</> : <><b>＋</b><strong>待安装</strong></>}
  </div>;
}
function Architecture({ slots, encoderValues, inputValues, outputValues, running, transferring, layer, hovered, selectedId, onInstall, onRemove, onInspect }: {
    slots: (PieceId | null)[];
    encoderValues: number[];
    inputValues: number[];
    outputValues: number[];
    running: boolean;
    transferring: boolean;
    layer: number;
    hovered: number | null;
    selectedId: PieceId | null;
    onInstall: (index: number, piece: PieceId) => void;
    onRemove: (index: number) => void;
    onInspect: (index: number) => void;
}) {
    const marker = useId().replace(/:/g, '');
    const loopMarker = `${marker}-loop`;
    const loopPath = 'M785 35H1080Q1098 35 1098 53V562Q1098 580 1080 580H785';
    return <svg className="tr-dec-builder-architecture" viewBox="0 0 1460 620" style={{ '--dec-layer-accent': layerColors[layer - 1], '--dec-input-accent': layerColors[Math.max(0, layer - 2)] } as CSSProperties} role="img" aria-label="编码器在左，解码器在右。解码器输入分三根 Q、K、V 线进入掩码自注意力；编码器输出分 K、V 两根线接入交叉注意力，译文端另有 Q 线。解码器每个子层有一条残差旁路。">
    <defs>
      <marker id={marker} markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto"><path d="M1 1L11 6L1 11Z"/></marker>
      <marker id={loopMarker} className="tr-dec-builder-loop-marker" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto"><path d="M1 1L11 6L1 11Z"/></marker>
    </defs>
    <rect className="tr-dec-builder-outline" x="70" y="80" width="350" height="455" rx="18"/>
    <rect className="tr-dec-builder-outline is-decoder" x="650" y="80" width="400" height="455" rx="18"/>

    <g className="tr-dec-builder-wires is-encoder" markerEnd={`url(#${marker})`}>
      <path d="M245 552V525"/>
      <path d="M245 525H205Q192 525 192 512V484"/>
      <path d="M245 525V484"/>
      <path d="M245 525H285Q298 525 298 512V484"/>
      <path d="M245 430V374"/><path d="M245 320V264"/><path d="M245 210V154"/><path d="M245 100V64"/>
    </g>
    <g className="tr-dec-builder-wires is-decoder" markerEnd={`url(#${marker})`}>
      <path d="M850 552V532"/>
      <path d="M850 532H810Q797 532 797 519V502"/>
      <path d="M850 532V502"/>
      <path d="M850 532H890Q903 532 903 519V502"/>
      <path d="M850 452V432"/><path d="M850 382V362"/><path d="M850 312V292"/>
      <path d="M850 242V222"/><path d="M850 172V152"/><path d="M850 102V64"/>
    </g>
    <g className="tr-dec-builder-wires is-residual" markerEnd={`url(#${marker})`}>
      <path d="M245 525H122Q110 525 110 513V347H155"/>
      <path d="M245 305H122Q110 305 110 293V127H155"/>
      <path d="M850 532H678Q665 532 665 519V407H710"/>
      <path d="M850 377H1020Q1033 377 1033 364V267H990"/>
      <path d="M850 237H1020Q1033 237 1033 224V127H990"/>
    </g>
    <g className="tr-dec-builder-wires is-memory" markerEnd={`url(#${marker})`}>
      <path d="M370 25H518Q532 25 532 39V324Q532 324 548 324H710"/>
      <path d="M370 47H550Q564 47 564 61V344H710"/>
    </g>
    <g className="tr-dec-builder-wire-labels">
      <text x="177" y="520">Q</text><text x="252" y="520">K</text><text x="301" y="520">V</text>
      <text x="785" y="526">Q</text><text x="855" y="526">K</text><text x="908" y="526">V</text>
      <text x="859" y="377">Q</text><text x="675" y="318">K</text><text x="675" y="348">V</text>
      <text className="tr-dec-builder-repeat" x="430" y="112">× 6</text><text className="tr-dec-builder-repeat" x="1055" y="112">× 6</text>
    </g>

    <foreignObject x="120" y="6" width="250" height="58"><MatrixPort title="编码器输出 Hₑₙ꜀" shape="源词数 × 512" values={encoderValues} tone="source"/></foreignObject>
    <foreignObject x="120" y="552" width="250" height="58"><MatrixPort title="编码器输入" shape="源词数 × 512" values={initialMatrix(19)} tone="source"/></foreignObject>
    {encoderNodes.map(node => <foreignObject x="155" y={node.y} width="180" height="54" key={node.y}><div className={`tr-dec-builder-encoder-node is-${node.tone}`}><img src={node.image} alt=""/><strong>{node.title}</strong></div></foreignObject>)}
    <foreignObject className={transferring ? 'tr-dec-builder-layer-output is-sending' : undefined} x="710" y="6" width="280" height="58"><MatrixPort title={running ? `Block ${layer} 输出` : '解码器输出'} shape="目标词数 × 512" values={outputValues} tone="output"/></foreignObject>
    <foreignObject className={running ? 'tr-dec-builder-layer-input' : undefined} key={`input-${layer}`} x="710" y="552" width="280" height="58"><MatrixPort title={running ? `Block ${layer} 输入` : '解码器输入'} shape="目标词数 × 512" values={inputValues} tone="target"/></foreignObject>
    {expectedSlots.map((expected, index) => <foreignObject x="710" y={slotY[index]} width="280" height="50" key={index}><DecoderSlot index={index} expected={expected} installed={slots[index]} hovered={hovered === index} selectedId={selectedId} onInstall={onInstall} onRemove={onRemove} onInspect={onInspect}/></foreignObject>)}
    {running && <g className={`tr-dec-builder-transfer${transferring ? ' is-transferring' : ''}`}>
      <path d={loopPath} markerEnd={`url(#${loopMarker})`}/>
      {transferring && <SvgPathTraveler key={layer} path={loopPath} durationMs={transferDurationMs} className="tr-dec-builder-travelling-matrix">
        <rect className="tr-dec-builder-travelling-frame" x="-34" y="-23" width="68" height="46" rx="6"/>
        {outputValues.map((value, index) => <rect className="tr-dec-builder-travelling-cell" key={index} x={-28 + (index % 6) * 9} y={-18 + Math.floor(index / 6) * 8} width="7" height="6" rx="1" opacity={.28 + value * .68}/>)}
      </SvgPathTraveler>}
    </g>}
  </svg>;
}
export function DecoderBlockBuilder({ onComplete }: DecoderBlockBuilderProps) {
    const [slots, setSlots] = useState<(PieceId | null)[]>(() => expectedSlots.map(() => null));
    const [selectedId, setSelectedId] = useState<PieceId | null>(null);
    const [feedbackSlot, setFeedbackSlot] = useState<number | null>(null);
    const [drag, setDrag] = useState<{
        id: PieceId;
        x: number;
        y: number;
    } | null>(null);
    const [hovered, setHovered] = useState<number | null>(null);
    const [running, setRunning] = useState(false);
    const [autoRunning, setAutoRunning] = useState(false);
    const [transferring, setTransferring] = useState(false);
    const [layer, setLayer] = useState(1);
    const rootRef = useRef<HTMLDivElement>(null);
    const dragIdRef = useRef<PieceId | null>(null);
    useEffect(() => {
        if (!autoRunning)
            return;
        if (layer === 6) {
            setAutoRunning(false);
            setTransferring(false);
            return;
        }
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const pause = reducedMotion ? 0 : layerPauseMs;
        const duration = reducedMotion ? 150 : transferDurationMs;
        const startTimer = window.setTimeout(() => setTransferring(true), pause);
        const finishTimer = window.setTimeout(() => {
            setLayer(value => value + 1);
            setTransferring(false);
        }, pause + duration);
        return () => {
            window.clearTimeout(startTimer);
            window.clearTimeout(finishTimer);
        };
    }, [autoRunning, layer]);
    const ready = slots.every((slot, index) => slot === expectedSlots[index]);
    const installedCount = slots.filter(Boolean).length;
    const wrongSlots = slots.flatMap((id, index) => id && id !== expectedSlots[index] ? [index] : []);
    const activeWrong = feedbackSlot !== null && wrongSlots.includes(feedbackSlot) ? feedbackSlot : wrongSlots[0] ?? null;
    const feedback = activeWrong !== null ? decoderAssemblyFeedback(expectedSlots[activeWrong], slots[activeWrong]!, activeWrong) : null;
    const sourceValues = useMemo(() => {
        let values = initialMatrix(19);
        for (let index = 1; index <= 6; index += 1)
            values = nextMatrix(values, index);
        return values;
    }, []);
    const layers = useMemo(() => {
        const snapshots: {
            input: number[];
            output: number[];
        }[] = [];
        let input = initialMatrix(47);
        for (let index = 1; index <= 6; index += 1) {
            const output = nextMatrix(input, index);
            snapshots.push({ input, output });
            input = output;
        }
        return snapshots;
    }, []);
    const install = (index: number, id: PieceId) => {
        if (running)
            return;
        setSlots(previous => previous.map((slot, slotIndex) => slotIndex === index ? id : slot));
        setFeedbackSlot(index);
        setSelectedId(null);
        setHovered(null);
    };
    const nearestSlot = (x: number, y: number) => {
        const panel = rootRef.current?.querySelector<HTMLElement>('.tr-dec-builder-diagram');
        const panelBox = panel?.getBoundingClientRect();
        if (!panelBox || x < panelBox.left || x > panelBox.right || y < panelBox.top || y > panelBox.bottom)
            return null;
        let nearest: {
            index: number;
            distance: number;
        } | null = null;
        for (const slot of Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[data-decoder-slot-index]') ?? [])) {
            const box = slot.getBoundingClientRect();
            const dx = Math.max(box.left - x, 0, x - box.right);
            const dy = Math.max(box.top - y, 0, y - box.bottom);
            const distance = dx * dx + dy * dy;
            if (!nearest || distance < nearest.distance)
                nearest = { index: Number(slot.dataset.decoderSlotIndex), distance };
        }
        return nearest?.index ?? null;
    };
    const startDrag = (event: PointerEvent<HTMLButtonElement>, id: PieceId) => {
        if (running)
            return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragIdRef.current = id;
        setDrag({ id, x: event.clientX, y: event.clientY });
    };
    const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
        const id = dragIdRef.current;
        if (!id)
            return;
        setDrag({ id, x: event.clientX, y: event.clientY });
        setHovered(nearestSlot(event.clientX, event.clientY));
    };
    const finishDrag = (event: PointerEvent<HTMLButtonElement>) => {
        const id = dragIdRef.current;
        if (!id)
            return;
        const index = nearestSlot(event.clientX, event.clientY);
        if (index !== null)
            install(index, id);
        else
            setSelectedId(id);
        dragIdRef.current = null;
        setDrag(null);
        setHovered(null);
    };
    const advanceLayer = () => {
        if (autoRunning)
            return;
        if (!running) {
            setRunning(true);
            setLayer(1);
            setAutoRunning(true);
            return;
        }
        if (layer === 6)
            onComplete();
    };
    const snapshot = layers[layer - 1];
    return <LessonStage kicker="第六幕 · 拼装解码器" title="拼装一个解码器 Block" description="沿箭头辨认两路输入，把模块拖入对应位置，再运行解码器。" className="tr-stage tr-decoder-builder-stage">
    <div className="tr-dec-builder-layout" ref={rootRef}>
      <aside className="tr-dec-builder-bank">
        <header><b>模块工具箱</b><span>{installedCount} / 6</span></header>
        {pieces.map(piece => <button type="button" key={piece.id} disabled={running} className={`${selectedId === piece.id ? 'is-selected ' : ''}is-${piece.id}`} onPointerDown={event => startDrag(event, piece.id)} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={() => { dragIdRef.current = null; setDrag(null); setHovered(null); }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setSelectedId(piece.id);
        } }} aria-label={`拖动${piece.title}到右侧解码器安装框`}><img src={piece.image} alt=""/><span><strong>{piece.title}</strong><small>{piece.detail}</small></span><b>×{piece.count}</b></button>)}
      </aside>
      <section className="tr-dec-builder-diagram" aria-label="编码器与解码器完整框架图">
        <header><b>编码器（已装好）</b><b>{running ? `Decoder Block ${layer} / 6` : '1 个 Decoder Block'}</b></header>
        <Architecture slots={slots} encoderValues={sourceValues} inputValues={snapshot.input} outputValues={snapshot.output} running={running} transferring={transferring} layer={layer} hovered={hovered} selectedId={selectedId} onInstall={install} onRemove={index => setSlots(previous => previous.map((slot, slotIndex) => slotIndex === index ? null : slot))} onInspect={setFeedbackSlot}/>
        <aside className="tr-dec-builder-side-notes">
          {feedback && activeWrong !== null && <div className="tr-dec-builder-paper" role="note" aria-label="安装提示" aria-live="polite"><AssemblyFeedbackBody feedback={feedback}/><button type="button" onClick={() => setSlots(previous => previous.map((slot, index) => index === activeWrong ? null : slot))}>撤回 ↶</button></div>}
        </aside>
      </section>
    </div>
    {drag && createPortal(<div className="tr-dec-builder-drag-preview" style={{ left: drag.x, top: drag.y }} aria-hidden="true"><img src={pieces.find(piece => piece.id === drag.id)?.image} alt=""/></div>, document.body)}
    <footer className="tr-dec-builder-footer"><Button variant="primary" disabled={!ready || autoRunning} onClick={advanceLayer}>{!running ? '依次运行 6 个 Block' : autoRunning ? `正在运行 Block ${layer} / 6` : '完成解码器组装'}</Button></footer>
  </LessonStage>;
}
