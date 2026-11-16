import { transformerAsset } from '../../assetUrls';
import { AssemblyFeedbackBody } from './AssemblyFeedbackBody';
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { Button } from "@shuku/course-style/react/controls/Button";
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
    return <div shuku-edit-id="e-c24369fb-ca12-49b5-86ab-6a1e12081eb5" className="tr-enc-matrix" style={{ '--matrix-hue': hue } as CSSProperties}>{values.map((value, index) => <i shuku-edit-id="e-62877bb9-0d0d-4afd-b23f-171895586e14" key={index} style={{ '--cell-light': `${96 - value * 43}%` } as CSSProperties}/>)}</div>;
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
    return <div shuku-edit-id="e-dad7f44d-12cd-4bd0-ad49-fee1b44cf098" data-encoder-slot-index={index} role="button" tabIndex={0} aria-label={`第 ${index + 1} 个安装位置${actual ? `，当前是${actual.title}` : '，待安装'}`} onClick={() => selectedId ? onInstall(index, selectedId) : onInspect(index)} onFocus={() => onInspect(index)} onKeyDown={event => { if (selectedId && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onInstall(index, selectedId);
    } }} className={`tr-enc-flow-module is-${actual?.kind ?? expected.kind}${actual ? ' is-installed' : ' is-empty'}${wrong ? ' is-wrong' : ''}${hoveredIndex === index ? ' is-drop-hovered' : ''}`}>
    {actual ? <><img shuku-edit-id="e-62c12812-889c-4199-af9a-29fd60d02640" src={actual.image} alt=""/><span shuku-edit-id="e-5546f497-8eb6-4ff8-9a2f-43b4d16cefc3"><strong shuku-edit-id="e-d7bacb26-4d04-466b-8107-1bedf4af7cd7">{actual.title}</strong><small shuku-edit-id="e-7bda2a56-d748-4b94-9105-c7b6aae27690">{actual.detail}</small></span>{wrong && <button shuku-edit-id="e-289e3898-2d43-4544-8162-a41e6c826b58" type="button" className="tr-enc-remove-wrong" aria-label={`撤回第 ${index + 1} 个位置的错误模块`} onClick={event => { event.stopPropagation(); onRemove(index); }}>×</button>}</> : <><b shuku-edit-id="e-3259621c-c8a8-42c2-b0e5-ac374cfbf755">+</b><span shuku-edit-id="e-7fe1134f-8504-4c2d-bf96-1fb8dccc28b7"><strong shuku-edit-id="e-e7ac5576-86e9-4f7a-80bf-1f75c5b26811">待安装</strong></span></>}
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
    return <div shuku-edit-id="e-264e778a-31eb-45d5-8089-f33cbcb3f7e2" className="tr-enc-flow" aria-label="编码器一层的完整连接图">
    <svg shuku-edit-id="e-b1e7d62f-1659-4af9-be65-9fd8de91043f" viewBox="0 0 720 540" role="img" aria-label="从下向上：输入分成 Q、K、V 三路进入多头自注意力，经加与规范化、前馈网络、加与规范化得到输出；两条残差旁路分别从子层输入接回对应的加与规范化">
      <defs shuku-edit-id="e-e642a02f-1aa4-43b0-badf-fe9be8e92900">
        <marker shuku-edit-id="e-2f6c815e-ecbb-48d9-8a77-20f01241e407" id={arrowId} markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16" refX="14" refY="8" orient="auto"><path shuku-edit-id="e-2e7a742d-5767-4dc3-9756-67ee2a9f47f4" className="tr-enc-arrow-head" d="M1 2L14 8L1 14Z"/></marker>
        <marker shuku-edit-id="e-a580ae49-cb99-4bfe-86fa-0f24baf5cf62" id={transferArrowId} markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16" refX="14" refY="8" orient="auto"><path shuku-edit-id="e-92bd9b69-4ab8-4172-8f5a-bb899eb030fd" className="tr-enc-transfer-head" d="M1 2L14 8L1 14Z"/></marker>
      </defs>
      <rect shuku-edit-id="e-e91f481f-e70b-40b0-9c4e-8a2e65f27920" className="tr-enc-block-outline" x="145" y="70" width="430" height="398" rx="18"/>
      <g shuku-edit-id="e-3ef704c8-5fe8-4237-ae97-b13cf1360ccb" className="tr-enc-wires">
        <path shuku-edit-id="e-12aecc93-3ad4-4b20-948c-2de73384a2d8" className="is-main" d="M360 478V454"/>
        <path shuku-edit-id="e-5525d552-5050-420a-9f33-7c3314c3e7e2" className="is-main" d="M360 454H330Q318 454 318 442V427" markerEnd={`url(#${arrowId})`}/>
        <path shuku-edit-id="e-6b44e5c7-e612-451c-aa72-a7881fa2ac83" className="is-main" d="M360 454V427" markerEnd={`url(#${arrowId})`}/>
        <path shuku-edit-id="e-b69f34bf-6663-4014-b4f0-21db3237f55b" className="is-main" d="M360 454H390Q402 454 402 442V427" markerEnd={`url(#${arrowId})`}/>
        <path shuku-edit-id="e-2d6c6681-b924-4a4e-adce-e80762439ad9" className="is-main" d="M360 358V335" markerEnd={`url(#${arrowId})`}/>
        <path shuku-edit-id="e-5f8b3d06-2a40-4b50-a08f-ab461021c81c" className="is-main" d="M360 266V243" markerEnd={`url(#${arrowId})`}/>
        <path shuku-edit-id="e-65a2a241-a39c-4d22-a26c-3885882b349c" className="is-main" d="M360 174V151" markerEnd={`url(#${arrowId})`}/>
        <path shuku-edit-id="e-25e07d03-d0d9-43b6-9198-5e46baa7b09d" className="is-main" d="M360 82V65" markerEnd={`url(#${arrowId})`}/>
        <path shuku-edit-id="e-bf532428-ad54-45f6-94a8-288a6fa5bd41" className="is-residual" d="M360 454H187Q175 454 175 442V308Q175 296 187 296H202" markerEnd={`url(#${arrowId})`}/>
        <path shuku-edit-id="e-92342f5b-11f4-43af-807e-a2e12c095500" className="is-residual" d="M360 250H187Q175 250 175 238V124Q175 112 187 112H202" markerEnd={`url(#${arrowId})`}/>
      </g>
      <text shuku-edit-id="e-53bf9a32-419c-4e44-8dd7-cc4f5c793d88" x="295" y="473">Q</text><text shuku-edit-id="e-fafaeb1d-bf3e-426c-986f-bd0d8b78410b" x="369" y="473">K</text><text shuku-edit-id="e-6d7d4573-09bf-477d-945e-acae720354ec" x="413" y="473">V</text>
      <text shuku-edit-id="e-c41a2474-898e-444a-be1b-434958ff9af0" className="tr-enc-residual-text" x="88" y="372">保留 X</text>
      <text shuku-edit-id="e-22d8802e-c318-4726-b819-6d64dfc93e2b" className="tr-enc-residual-text" x="88" y="188">保留 H</text>
      <text shuku-edit-id="e-d1ee1fdf-0375-4b21-8a9d-7cb6270deaf3" className="tr-enc-repeat" x="587" y="98">× 6</text>
      <foreignObject shuku-edit-id="e-75961ad9-850d-4499-bbc6-a4044f9eb539" className={transferring ? 'tr-enc-layer-output is-sending' : undefined} x="175" y="4" width="370" height="52"><div shuku-edit-id="e-4ccafe58-2817-4c52-8d6a-c0ae7b52c6e8" className="tr-enc-port is-output">{running && <MatrixCells values={outputValues} hue={hue + 8}/>}<span shuku-edit-id="e-5e465f74-85ef-497a-9b2f-0c24ba87f6df"><strong shuku-edit-id="e-b6125f99-f63b-4c35-898e-92466c9563ad">Block 输出 Xˡ</strong><small shuku-edit-id="e-ccd3b8f2-ce5f-4ec7-8ec6-5b48dfcecda7">n × 512</small></span></div></foreignObject>
      {flowPieceIds.map((pieceId, index) => {
            const expected = pieces.find(item => item.id === pieceId)!;
            const actual = pieces.find(item => item.id === installedSlots[index]) ?? null;
            return <foreignObject shuku-edit-id="e-7d5cc470-c2ef-4d43-992c-3b47b8da6772" key={`${pieceId}-${index}`} x="210" y={358 - index * 92} width="300" height="60"><FlowNode expected={expected} actual={actual} index={index} hoveredIndex={hoveredIndex} selectedId={selectedId} onInstall={onInstall} onRemove={onRemove} onInspect={onInspect}/></foreignObject>;
        })}
      <foreignObject shuku-edit-id="e-a8d2afaa-9c5d-41b0-aea0-161f7209f120" x="175" y="478" width="370" height="56"><div shuku-edit-id="e-32083ee2-4190-40f3-addd-fcd2525e18af" className="tr-enc-port is-input">{running && <MatrixCells values={inputValues} hue={hue}/>}<span shuku-edit-id="e-93c920c5-5b26-435d-9f82-c36961c65883"><strong shuku-edit-id="e-f75fb19e-03e0-45cc-8dfa-7605c64eef1d">Block 输入 Xˡ⁻¹</strong><small shuku-edit-id="e-96674993-d3bd-4cd4-8271-f7a135fec5d5">n × 512</small></span></div></foreignObject>
      {transferring && <g shuku-edit-id="e-b6616e54-20ea-41ba-a803-2d2b8ed4e2e8" className="tr-enc-transfer" aria-label="本层输出矩阵正在移动到下一层输入">
        <path shuku-edit-id="e-2a32cc29-4510-4c90-a8cb-47fd201a542f" d={transferPath} markerEnd={`url(#${transferArrowId})`}/>
        <SvgPathTraveler path={transferPath} durationMs={transferDurationMs} className="tr-enc-travelling-card">
          <rect shuku-edit-id="e-ae056689-98f0-41ab-b275-49d03cc68f11" className="tr-enc-travelling-frame" x="-36" y="-23" width="72" height="46" rx="6"/>
          {outputValues.map((value, index) => <rect shuku-edit-id="e-e16d1bfe-efdb-482f-93c1-5af748365961" key={index} x={-29 + (index % 6) * 9} y={-18 + Math.floor(index / 6) * 6} width="7" height="5" rx="1" style={{ fill: `hsl(${hue + 8} 42% ${96 - value * 43}%)` }}/>)}
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
    <div shuku-edit-id="e-8cd0f35d-3543-4690-9a19-324de8d91934" className="tr-enc-assembly-layout" ref={assemblyRef}>
      <aside shuku-edit-id="e-c5d290c7-5933-48da-b091-a02af298549c" className="tr-enc-piece-bank"><header shuku-edit-id="e-150d5f37-2521-41e3-91f6-309e0b23c3fb"><b shuku-edit-id="e-1b0d2289-9301-4dad-86eb-6753e930e1b2">模块工具箱</b><span shuku-edit-id="e-3c24124a-a798-405f-8423-f1e23f2b4c57">{filledCount} / 4</span></header>{pieces.map(piece => <button shuku-edit-id="e-0d14fa25-8014-4c00-a72a-5153c4cb42a9" type="button" className={`is-${piece.kind}${selectedId === piece.id ? ' is-selected' : ''}`} key={piece.id} disabled={assembled} onPointerDown={event => startDrag(event, piece.id)} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={() => { dragIdRef.current = null; setDrag(null); setHoveredIndex(null); }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setSelectedId(piece.id);
    } }} aria-label={`拖动${piece.title}到中间的安装框`}><img shuku-edit-id="e-824d3cbe-6ed1-45e2-8fbd-932b80d67b80" src={piece.image} alt=""/><span shuku-edit-id="e-5cd0af7a-8150-4e98-9ea1-054f8cce1e80"><strong shuku-edit-id="e-369b3c2a-36bf-4547-acf3-01a4e4cdd8be">{piece.title}</strong><small shuku-edit-id="e-25de6f08-b53c-40c5-b582-8d1e2796e883">{piece.detail}</small></span><em shuku-edit-id="e-5dfd11cf-6910-4c29-90a7-a969eaeca9ed">×{piece.kind === 'norm' ? 2 : 1}</em></button>)}<p shuku-edit-id="e-65145d39-5261-4b4d-81cc-5a250644ca11">拖入安装位，也可先选模块再点安装位。</p></aside>
      <section shuku-edit-id="e-e97ed42a-4e2e-4089-9b08-472f4eb4979d" className={`tr-enc-diagram-panel${assembled ? ' is-running' : ''}`}><header shuku-edit-id="e-d4eb2c6a-2321-4279-b023-22acba625a99"><b shuku-edit-id="e-aaea50af-8fc4-4470-a06a-b4bb33ca32fe">{assembled ? `Encoder Block ${layerLabels[layerIndex]} / 6` : '1 个 Encoder Block'}</b><span shuku-edit-id="e-615c3e3c-6ded-49bd-ab1e-50c4de2812ee">从下往上 ↑</span></header><EncoderFlowDiagram installedSlots={installedSlots} inputValues={current.input} outputValues={current.output} hue={layerHues[layerIndex]} running={assembled} transferring={transferring} hoveredIndex={hoveredIndex} selectedId={selectedId} onInstall={install} onRemove={remove} onInspect={setFeedbackSlot}/></section>
      <aside shuku-edit-id="e-33902d0e-7375-40bf-b708-9f33e954488a" className={`tr-enc-explain-panel${feedback ? ' has-feedback' : ''}`} aria-live="polite">
        {!feedback && <header shuku-edit-id="e-b0b71f26-2506-46c6-b2ed-d04f49bf51b6">从 Block 到编码器</header>}
        {feedback && activeWrong !== null ? <section shuku-edit-id="e-182350f6-05a8-47e1-86a1-f8ca1200ac2d" className="tr-enc-feedback" role="note" aria-label="安装提示">
          <AssemblyFeedbackBody feedback={feedback}/><button shuku-edit-id="e-82ae8a26-0871-45d6-93a0-56fbe3461039" type="button" onClick={() => remove(activeWrong)}>撤回 ↶</button>
        </section> : <section shuku-edit-id="e-2d88ed2d-64c9-4d13-8f19-294c6f11bf6b" className="tr-enc-hierarchy">
          <h3 shuku-edit-id="e-d50374a5-5aca-44e0-954c-17fae99e0251">1 个 Block：两个子层</h3>
          <div shuku-edit-id="e-5c593b97-d569-4e0c-9293-bd700a7eb93e" className="tr-enc-sublayer-pair">
            <div shuku-edit-id="e-39c353b6-011a-489d-8e43-d2050f5eb0d5"><strong shuku-edit-id="e-db5deafc-66ce-45a3-b72e-c9f4773eb9c8">多头自注意力</strong><span shuku-edit-id="e-6d839b52-c492-4c7f-81d1-776b60d464c9">残差相加 → 层规范化</span></div>
            <div shuku-edit-id="e-8c1d6553-62d9-46ff-ac35-f25498918893"><strong shuku-edit-id="e-47f98113-afab-4aa0-a2e4-119621d32c03">前馈网络 FFN</strong><span shuku-edit-id="e-081d4f51-e09e-462d-bd22-94b033c6ac07">残差相加 → 层规范化</span></div>
          </div>
          {correctlyAssembled && <span shuku-edit-id="e-09503e68-e430-443f-b82a-697b40432c7f" className="tr-enc-ready">组装完成 ✓</span>}
        </section>}
        <section shuku-edit-id="e-60ea3390-bda2-457a-aaec-83b5829fa9a7" className="tr-enc-stack-note">
          <h3 shuku-edit-id="e-740900c3-997e-49a9-9ae1-718b66a6ba15">多个 Block → 编码器</h3>
          <p shuku-edit-id="e-b3c55ec7-4a5d-4145-9970-0f668291d9a2">原始模型 6 层，<strong shuku-edit-id="e-b929fb7f-ffb2-4989-8484-45b2f0f30a1a">层数可调整</strong>。</p>
          <div shuku-edit-id="e-bb41f3da-14e3-4723-81e0-d4c5f68a4a21" className="tr-enc-six-blocks">{layerLabels.map((label, i) => <span shuku-edit-id="e-02559051-ee5b-44b5-8f4b-d1211a28ab32" key={label} className={assembled && layerIndex === i ? 'is-active' : ''}>{label}</span>)}</div>
          <p shuku-edit-id="e-24927c53-6d99-4b25-af8a-09936fa1a669" className="tr-enc-shape-note">每层输入输出：<br shuku-edit-id="e-973926f4-3c35-42d4-bf3a-222b58eb7ec9" /><strong shuku-edit-id="e-e26bce12-db6a-402d-a1ca-300643144d9e">n × 512 → n × 512</strong></p>
          <p shuku-edit-id="e-512f6795-a6aa-4d84-b004-0f55f01ff760" className="tr-enc-sharing-note">各 Block 结构相同，<br shuku-edit-id="e-ea9295ff-71fc-46e7-8a9b-bd13556b9003" /><strong shuku-edit-id="e-9b178e70-4263-4f55-9260-62e711fbd753">参数分别学习</strong>。</p>
        </section>
      </aside>
    </div>
    {drag && createPortal(<div shuku-edit-id="e-a88c9b7c-d4a4-42ed-8253-48b2e2b89d16" className="tr-enc-drag-preview" style={{ left: drag.x, top: drag.y }} aria-hidden="true"><img shuku-edit-id="e-c5f3649a-e538-400f-b467-dff71600c7ce" src={pieces.find(piece => piece.id === drag.id)?.image} alt=""/></div>, document.body)}
    <div shuku-edit-id="e-69f3a773-9cff-4d11-a371-bd73a7eefde6" className="tr-encoder-builder-footer"><Button variant="primary" disabled={!correctlyAssembled || autoRunning} onClick={advanceLayer}>{!assembled ? '依次运行 6 个 Block' : autoRunning ? `正在运行 Block ${layerLabels[layerIndex]} / 6` : '编码完成：交给解码器 →'}</Button></div>
  </LessonStage>;
}
