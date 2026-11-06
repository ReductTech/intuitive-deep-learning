import { transformerAsset } from '../../assetUrls';
import { AssemblyFeedbackBody } from './AssemblyFeedbackBody';
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../../shared/react/controls/Button';
import { LessonStage } from '../LessonStage';
import { SvgPathTraveler } from './SvgPathTraveler';
import { encoderAssemblyFeedback } from '../../domain/assemblyFeedback';
import './EncoderBuilderExperience.css';
interface TransformerBlockCardProps {
    onComplete: () => void;
}
type ModuleKind = 'mha' | 'ffn' | 'norm';
type Piece = {
    id: string;
    kind: ModuleKind;
    title: string;
    detail: string;
    image: string;
};
const pieces: Piece[] = [
    { id: 'mha', kind: 'mha', title: '多头自注意力', detail: '注意力子层 · 词元间交流', image: transformerAsset("07_架构拼装/多头注意力.svg") },
    { id: 'ffn', kind: 'ffn', title: '逐位前馈网络', detail: 'FFN 子层 · 逐词加工', image: transformerAsset("07_架构拼装/前馈网络.svg") },
    { id: 'norm', kind: 'norm', title: '残差连接与层规范化', detail: '保留输入，规范数值', image: transformerAsset("07_架构拼装/残差与规范化.svg") },
];
const flowPieceIds = ['mha', 'norm', 'ffn', 'norm'];
const layerLabels = ['1', '2', '3', '4', '5', '6'];
const layerHues = [190, 160, 225, 270, 22, 335];
const transferDurationMs = 1800;
const layerPauseMs = 280;
function makeInitialMatrix() {
    return Array.from({ length: 36 }, (_, index) => ((index * 17 + (index % 6) * 11 + 23) % 83) / 100 + .08);
}
function transformMatrix(values: number[], round: number) {
    return values.map((value, index) => {
        const mixed = value * .47 + values[(index + round * 5 + 7) % values.length] * .35 + values[(index * 3 + 11) % values.length] * .18;
        return Math.max(.08, Math.min(.94, mixed + Math.sin((index + 2) * (round + 1)) * .09));
    });
}
function MatrixCells({ values, hue }: {
    values: number[];
    hue: number;
}) {
    return <div className="tr-enc-matrix" style={{ '--matrix-hue': hue } as CSSProperties}>{values.map((value, index) => <i key={index} style={{ '--cell-light': `${96 - value * 43}%` } as CSSProperties}/>)}</div>;
}
function FlowNode({ expected, actual, index, hoveredIndex, selectedId, onInstall, onRemove, onInspect }: {
    expected: Piece;
    actual: Piece | null;
    index: number;
    hoveredIndex: number | null;
    selectedId: string | null;
    onInstall: (index: number, id: string) => void;
    onRemove: (index: number) => void;
    onInspect: (index: number) => void;
}) {
    const wrong = !!actual && actual.id !== expected.id;
    return <div data-encoder-slot-index={index} role="button" tabIndex={0} aria-label={`第 ${index + 1} 个安装位置${actual ? `，当前是${actual.title}` : '，待安装'}`} onClick={() => selectedId ? onInstall(index, selectedId) : onInspect(index)} onFocus={() => onInspect(index)} onKeyDown={event => { if (selectedId && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onInstall(index, selectedId);
    } }} className={`tr-enc-flow-module is-${actual?.kind ?? expected.kind}${actual ? ' is-installed' : ' is-empty'}${wrong ? ' is-wrong' : ''}${hoveredIndex === index ? ' is-drop-hovered' : ''}`}>
    {actual ? <><img src={actual.image} alt=""/><span><strong>{actual.title}</strong><small>{actual.detail}</small></span>{wrong && <button type="button" className="tr-enc-remove-wrong" aria-label={`撤回第 ${index + 1} 个位置的错误模块`} onClick={event => { event.stopPropagation(); onRemove(index); }}>×</button>}</> : <><b>+</b><span><strong>待安装</strong></span></>}
  </div>;
}
function EncoderFlowDiagram({ installedSlots, inputValues, outputValues, hue, running, transferring = false, hoveredIndex, selectedId, onInstall, onRemove, onInspect }: {
    installedSlots: (string | null)[];
    inputValues: number[];
    outputValues: number[];
    hue: number;
    running: boolean;
    transferring?: boolean;
    hoveredIndex: number | null;
    selectedId: string | null;
    onInstall: (index: number, id: string) => void;
    onRemove: (index: number) => void;
    onInspect: (index: number) => void;
}) {
    const arrowId = useId().replace(/:/g, '');
    const transferArrowId = `${arrowId}-transfer`;
    const transferPath = 'M305 30H626Q640 30 640 44V492Q640 506 626 506H305';
    return <div className="tr-enc-flow" aria-label="编码器一层的完整连接图">
    <svg viewBox="0 0 720 540" role="img" aria-label="从下向上：输入分成 Q、K、V 三路进入多头自注意力，经加与规范化、前馈网络、加与规范化得到输出；两条残差旁路分别从子层输入接回对应的加与规范化">
      <defs>
        <marker id={arrowId} markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16" refX="14" refY="8" orient="auto"><path className="tr-enc-arrow-head" d="M1 2L14 8L1 14Z"/></marker>
        <marker id={transferArrowId} markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16" refX="14" refY="8" orient="auto"><path className="tr-enc-transfer-head" d="M1 2L14 8L1 14Z"/></marker>
      </defs>
      <rect className="tr-enc-block-outline" x="145" y="70" width="430" height="398" rx="18"/>
      <g className="tr-enc-wires">
        <path className="is-main" d="M360 478V454"/>
        <path className="is-main" d="M360 454H330Q318 454 318 442V427" markerEnd={`url(#${arrowId})`}/>
        <path className="is-main" d="M360 454V427" markerEnd={`url(#${arrowId})`}/>
        <path className="is-main" d="M360 454H390Q402 454 402 442V427" markerEnd={`url(#${arrowId})`}/>
        <path className="is-main" d="M360 358V335" markerEnd={`url(#${arrowId})`}/>
        <path className="is-main" d="M360 266V243" markerEnd={`url(#${arrowId})`}/>
        <path className="is-main" d="M360 174V151" markerEnd={`url(#${arrowId})`}/>
        <path className="is-main" d="M360 82V65" markerEnd={`url(#${arrowId})`}/>
        <path className="is-residual" d="M360 454H187Q175 454 175 442V308Q175 296 187 296H202" markerEnd={`url(#${arrowId})`}/>
        <path className="is-residual" d="M360 250H187Q175 250 175 238V124Q175 112 187 112H202" markerEnd={`url(#${arrowId})`}/>
      </g>
      <text x="295" y="473">Q</text><text x="369" y="473">K</text><text x="413" y="473">V</text>
      <text className="tr-enc-residual-text" x="88" y="372">保留 X</text>
      <text className="tr-enc-residual-text" x="88" y="188">保留 H</text>
      <text className="tr-enc-repeat" x="587" y="98">× 6</text>
      <foreignObject className={transferring ? 'tr-enc-layer-output is-sending' : undefined} x="175" y="4" width="370" height="52"><div className="tr-enc-port is-output">{running && <MatrixCells values={outputValues} hue={hue + 8}/>}<span><strong>Block 输出 Xˡ</strong><small>n × 512</small></span></div></foreignObject>
      {flowPieceIds.map((pieceId, index) => {
            const expected = pieces.find(item => item.id === pieceId)!;
            const actual = pieces.find(item => item.id === installedSlots[index]) ?? null;
            return <foreignObject key={`${pieceId}-${index}`} x="210" y={358 - index * 92} width="300" height="60"><FlowNode expected={expected} actual={actual} index={index} hoveredIndex={hoveredIndex} selectedId={selectedId} onInstall={onInstall} onRemove={onRemove} onInspect={onInspect}/></foreignObject>;
        })}
      <foreignObject x="175" y="478" width="370" height="56"><div className="tr-enc-port is-input">{running && <MatrixCells values={inputValues} hue={hue}/>}<span><strong>Block 输入 Xˡ⁻¹</strong><small>n × 512</small></span></div></foreignObject>
      {transferring && <g className="tr-enc-transfer" aria-label="本层输出矩阵正在移动到下一层输入">
        <path d={transferPath} markerEnd={`url(#${transferArrowId})`}/>
        <SvgPathTraveler path={transferPath} durationMs={transferDurationMs} className="tr-enc-travelling-card">
          <rect className="tr-enc-travelling-frame" x="-36" y="-23" width="72" height="46" rx="6"/>
          {outputValues.map((value, index) => <rect key={index} x={-29 + (index % 6) * 9} y={-18 + Math.floor(index / 6) * 6} width="7" height="5" rx="1" style={{ fill: `hsl(${hue + 8} 42% ${96 - value * 43}%)` }}/>)}
        </SvgPathTraveler>
      </g>}
    </svg>
  </div>;
}
export function TransformerBlockCard({ onComplete }: TransformerBlockCardProps) {
    const [installedSlots, setInstalledSlots] = useState<(string | null)[]>(() => flowPieceIds.map(() => null));
    const [drag, setDrag] = useState<{
        id: string;
        x: number;
        y: number;
    } | null>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [feedbackSlot, setFeedbackSlot] = useState<number | null>(null);
    const assemblyRef = useRef<HTMLDivElement>(null);
    const dragIdRef = useRef<string | null>(null);
    const [assembled, setAssembled] = useState(false);
    const [autoRunning, setAutoRunning] = useState(false);
    const [layerIndex, setLayerIndex] = useState(0);
    const [transferring, setTransferring] = useState(false);
    useEffect(() => {
        if (!autoRunning)
            return;
        if (layerIndex === layerLabels.length - 1) {
            setAutoRunning(false);
            setTransferring(false);
            return;
        }
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const pause = reducedMotion ? 0 : layerPauseMs;
        const duration = reducedMotion ? 150 : transferDurationMs;
        const startTimer = window.setTimeout(() => setTransferring(true), pause);
        const finishTimer = window.setTimeout(() => {
            setLayerIndex(value => value + 1);
            setTransferring(false);
        }, pause + duration);
        return () => {
            window.clearTimeout(startTimer);
            window.clearTimeout(finishTimer);
        };
    }, [autoRunning, layerIndex]);
    const filledCount = installedSlots.filter(Boolean).length;
    const correctlyAssembled = installedSlots.every((id, index) => id === flowPieceIds[index]);
    const wrongSlots = installedSlots.flatMap((id, index) => id && id !== flowPieceIds[index] ? [index] : []);
    const activeWrong = feedbackSlot !== null && wrongSlots.includes(feedbackSlot) ? feedbackSlot : wrongSlots[0] ?? null;
    const feedback = activeWrong !== null ? encoderAssemblyFeedback(flowPieceIds[activeWrong], installedSlots[activeWrong]!, activeWrong) : null;
    const layerMatrices = useMemo(() => {
        const snapshots: {
            input: number[];
            output: number[];
        }[] = [];
        let input = makeInitialMatrix();
        layerLabels.forEach((_, index) => {
            const output = transformMatrix(input, index + 1);
            snapshots.push({ input, output });
            input = output;
        });
        return snapshots;
    }, []);
    const install = (index: number, id: string) => {
        if (assembled)
            return;
        setInstalledSlots(previous => previous.map((current, slotIndex) => slotIndex === index ? id : current));
        setFeedbackSlot(index);
        setSelectedId(null);
        setHoveredIndex(null);
    };
    const remove = (index: number) => {
        if (assembled)
            return;
        setInstalledSlots(previous => previous.map((current, slotIndex) => slotIndex === index ? null : current));
    };
    const nearestSlot = (x: number, y: number) => {
        const panel = assemblyRef.current?.querySelector<HTMLElement>('.tr-enc-diagram-panel');
        if (!panel)
            return null;
        const panelBox = panel.getBoundingClientRect();
        if (x < panelBox.left || x > panelBox.right || y < panelBox.top || y > panelBox.bottom)
            return null;
        const slots = assemblyRef.current?.querySelectorAll<HTMLElement>('.tr-enc-flow-module[data-encoder-slot-index]');
        let nearest: {
            index: number;
            distance: number;
        } | null = null;
        for (const slot of Array.from(slots ?? [])) {
            const box = slot.getBoundingClientRect();
            const dx = Math.max(box.left - x, 0, x - box.right);
            const dy = Math.max(box.top - y, 0, y - box.bottom);
            const distance = dx * dx + dy * dy;
            if (!nearest || distance < nearest.distance)
                nearest = { index: Number(slot.dataset.encoderSlotIndex), distance };
        }
        return nearest?.index ?? null;
    };
    const startDrag = (event: PointerEvent<HTMLButtonElement>, id: string) => {
        if (assembled)
            return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragIdRef.current = id;
        setSelectedId(null);
        setDrag({ id, x: event.clientX, y: event.clientY });
    };
    const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
        const id = dragIdRef.current;
        if (!id)
            return;
        setDrag({ id, x: event.clientX, y: event.clientY });
        setHoveredIndex(nearestSlot(event.clientX, event.clientY));
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
        setHoveredIndex(null);
    };
    const advanceLayer = () => {
        if (autoRunning)
            return;
        if (!assembled) {
            setAssembled(true);
            setLayerIndex(0);
            setAutoRunning(true);
            return;
        }
        if (layerIndex === layerLabels.length - 1)
            onComplete();
    };
    const current = layerMatrices[layerIndex];
    return <LessonStage kicker="第六幕 · 进入编码器" title="拼装一个编码器 Block" description="把左侧模块拖入中间安装位；装好后，运行各层并观察信息流。" className="tr-stage tr-encoder-builder-stage">
    <div className="tr-enc-assembly-layout" ref={assemblyRef}>
      <aside className="tr-enc-piece-bank"><header><b>模块工具箱</b><span>{filledCount} / 4</span></header>{pieces.map(piece => <button type="button" className={`is-${piece.kind}${selectedId === piece.id ? ' is-selected' : ''}`} key={piece.id} disabled={assembled} onPointerDown={event => startDrag(event, piece.id)} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={() => { dragIdRef.current = null; setDrag(null); setHoveredIndex(null); }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setSelectedId(piece.id);
    } }} aria-label={`拖动${piece.title}到中间的安装框`}><img src={piece.image} alt=""/><span><strong>{piece.title}</strong><small>{piece.detail}</small></span><em>×{piece.kind === 'norm' ? 2 : 1}</em></button>)}<p>拖入安装位，也可先选模块再点安装位。</p></aside>
      <section className={`tr-enc-diagram-panel${assembled ? ' is-running' : ''}`}><header><b>{assembled ? `Encoder Block ${layerLabels[layerIndex]} / 6` : '1 个 Encoder Block'}</b><span>从下往上 ↑</span></header><EncoderFlowDiagram installedSlots={installedSlots} inputValues={current.input} outputValues={current.output} hue={layerHues[layerIndex]} running={assembled} transferring={transferring} hoveredIndex={hoveredIndex} selectedId={selectedId} onInstall={install} onRemove={remove} onInspect={setFeedbackSlot}/></section>
      <aside className={`tr-enc-explain-panel${feedback ? ' has-feedback' : ''}`} aria-live="polite">
        {!feedback && <header>从 Block 到编码器</header>}
        {feedback && activeWrong !== null ? <section className="tr-enc-feedback" role="note" aria-label="安装提示">
          <AssemblyFeedbackBody feedback={feedback}/><button type="button" onClick={() => remove(activeWrong)}>撤回 ↶</button>
        </section> : <section className="tr-enc-hierarchy">
          <h3>1 个 Block：两个子层</h3>
          <div className="tr-enc-sublayer-pair">
            <div><strong>多头自注意力</strong><span>残差相加 → 层规范化</span></div>
            <div><strong>前馈网络 FFN</strong><span>残差相加 → 层规范化</span></div>
          </div>
          {correctlyAssembled && <span className="tr-enc-ready">组装完成 ✓</span>}
        </section>}
        <section className="tr-enc-stack-note">
          <h3>多个 Block → 编码器</h3>
          <p>原始模型 6 层，<strong>层数可调整</strong>。</p>
          <div className="tr-enc-six-blocks">{layerLabels.map((label, i) => <span key={label} className={assembled && layerIndex === i ? 'is-active' : ''}>{label}</span>)}</div>
          <p className="tr-enc-shape-note">每层输入输出：<br /><strong>n × 512 → n × 512</strong></p>
          <p className="tr-enc-sharing-note">各 Block 结构相同，<br /><strong>参数分别学习</strong>。</p>
        </section>
      </aside>
    </div>
    {drag && createPortal(<div className="tr-enc-drag-preview" style={{ left: drag.x, top: drag.y }} aria-hidden="true"><img src={pieces.find(piece => piece.id === drag.id)?.image} alt=""/></div>, document.body)}
    <div className="tr-encoder-builder-footer"><Button variant="primary" disabled={!correctlyAssembled || autoRunning} onClick={advanceLayer}>{!assembled ? '依次运行 6 个 Block' : autoRunning ? `正在运行 Block ${layerLabels[layerIndex]} / 6` : '编码完成：交给解码器 →'}</Button></div>
  </LessonStage>;
}
