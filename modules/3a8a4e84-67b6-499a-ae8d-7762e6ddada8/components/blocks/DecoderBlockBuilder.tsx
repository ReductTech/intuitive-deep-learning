import { transformerAsset } from '../../assetUrls';
import { AssemblyFeedbackBody } from './AssemblyFeedbackBody';
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { Button } from "@shuku/course-style/react/controls/Button";
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
    return <span shuku-edit-id="e-4d340e04-bf4d-4bb4-b266-7ab8a74b4c5c" className={`tr-dec-builder-matrix is-${tone}`} aria-hidden="true">{values.map((value, index) => <i shuku-edit-id="e-cb49dea1-aab7-4896-be88-b51808b18848" key={index} style={{ opacity: .28 + value * .68 }}/>)}</span>;
}
function MatrixPort({ title, shape, values, tone }: {
    title: string;
    shape: string;
    values: number[];
    tone: 'source' | 'target' | 'output';
}) {
    return <div shuku-edit-id="e-f93a71e6-78d9-4708-bc0f-9d3801976127" className={`tr-dec-builder-port is-${tone}`}><MatrixCells values={values} tone={tone}/><span shuku-edit-id="e-4abfd1b2-8ad0-4aa4-8b37-55e881bbe50c"><strong shuku-edit-id="e-61d9c56c-4807-4ec2-846a-c1fade67ff10">{title}</strong><small shuku-edit-id="e-081e29ba-d2b8-4dba-b4f4-2906b5624838">{shape}</small></span></div>;
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
    return <div shuku-edit-id="e-90dcd9fe-ec0b-4a40-81e1-e3844099e9ac" className={`tr-dec-builder-slot is-${installed ?? expected}${installed ? ' is-installed' : ' is-empty'}${hovered ? ' is-hovered' : ''}${wrong ? ' is-wrong' : ''}`} data-decoder-slot-index={index} role="button" tabIndex={0} aria-label={`解码器第 ${index + 1} 个安装位，${piece ? `已安装${piece.title}` : '待安装'}`} onClick={() => { if (selectedId)
        onInstall(index, selectedId);
    else
        onInspect(index); }} onFocus={() => onInspect(index)} onKeyDown={event => { if (selectedId && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onInstall(index, selectedId);
    } }}>
    {piece ? <><img shuku-edit-id="e-82d38656-0249-4011-ad2b-04fc042ef878" src={piece.image} alt=""/><strong shuku-edit-id="e-1c7b79c2-0875-46a2-a975-473e015d906d">{piece.title}</strong>{wrong && <button shuku-edit-id="e-11b5d73e-8b4a-4a5d-9f28-6f03f4168542" type="button" onClick={event => { event.stopPropagation(); onRemove(index); }} aria-label="撤回错误安装">×</button>}</> : <><b shuku-edit-id="e-b3cc8a09-7e03-491a-b1d8-6abb0433a1e7">＋</b><strong shuku-edit-id="e-ebab024d-fce0-4fb8-8557-9bb1dac68af5">待安装</strong></>}
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
    return <svg shuku-edit-id="e-bd34cf24-e1f1-498c-9f08-498add450a2d" className="tr-dec-builder-architecture" viewBox="0 0 1460 620" style={{ '--dec-layer-accent': layerColors[layer - 1], '--dec-input-accent': layerColors[Math.max(0, layer - 2)] } as CSSProperties} role="img" aria-label="编码器在左，解码器在右。解码器输入分三根 Q、K、V 线进入掩码自注意力；编码器输出分 K、V 两根线接入交叉注意力，译文端另有 Q 线。解码器每个子层有一条残差旁路。">
    <defs shuku-edit-id="e-e1fa7b24-c9a9-429a-8328-786a4b155c5e">
      <marker shuku-edit-id="e-9ec904f4-41cc-4d8e-a0c8-dd82e636488b" id={marker} markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto"><path shuku-edit-id="e-027e5de8-a93e-4d58-8aed-e43668ad98e0" d="M1 1L11 6L1 11Z"/></marker>
      <marker shuku-edit-id="e-cff8718e-50aa-4c0d-b616-f8edd6df7bc2" id={loopMarker} className="tr-dec-builder-loop-marker" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto"><path shuku-edit-id="e-1f76583f-b04f-435d-bdd7-8a3d08566e8b" d="M1 1L11 6L1 11Z"/></marker>
    </defs>
    <rect shuku-edit-id="e-175f20d2-1d66-4afc-922e-34d798cc27a9" className="tr-dec-builder-outline" x="70" y="80" width="350" height="455" rx="18"/>
    <rect shuku-edit-id="e-700712e7-e4b2-429d-9d2b-8c81d1628475" className="tr-dec-builder-outline is-decoder" x="650" y="80" width="400" height="455" rx="18"/>

    <g shuku-edit-id="e-f1948988-fdb4-470e-9f81-43cb3050eb3b" className="tr-dec-builder-wires is-encoder" markerEnd={`url(#${marker})`}>
      <path shuku-edit-id="e-18f06f09-9610-4712-8d68-def5071a8caf" d="M245 552V525"/>
      <path shuku-edit-id="e-ebbdbf38-540e-48e3-aa44-c2298edcdc77" d="M245 525H205Q192 525 192 512V484"/>
      <path shuku-edit-id="e-33f7d0d0-554a-419e-b5d6-69cac196358e" d="M245 525V484"/>
      <path shuku-edit-id="e-e60d01c7-eeb6-449e-bf2c-a537c32c97d2" d="M245 525H285Q298 525 298 512V484"/>
      <path shuku-edit-id="e-2df9b9af-551f-4869-9e67-91f9a77cd8cd" d="M245 430V374"/><path shuku-edit-id="e-f2c220a4-bc06-4461-afcb-8b4869babb0c" d="M245 320V264"/><path shuku-edit-id="e-acdbd54e-386e-4a9e-b408-8c42ac809b38" d="M245 210V154"/><path shuku-edit-id="e-122b4676-be67-4f48-a5d4-620c32eceb6a" d="M245 100V64"/>
    </g>
    <g shuku-edit-id="e-2e3cec44-15e3-49cf-a605-02382fe17ddf" className="tr-dec-builder-wires is-decoder" markerEnd={`url(#${marker})`}>
      <path shuku-edit-id="e-1560cec1-f239-4cd3-89c9-1ed70a01f2bc" d="M850 552V532"/>
      <path shuku-edit-id="e-f09803f6-8b4c-4080-abad-db473c20db21" d="M850 532H810Q797 532 797 519V502"/>
      <path shuku-edit-id="e-23f276a3-7b30-4847-a3e7-be0628694365" d="M850 532V502"/>
      <path shuku-edit-id="e-4ce3f25d-6a36-41a2-9b1f-8a38029c7459" d="M850 532H890Q903 532 903 519V502"/>
      <path shuku-edit-id="e-08d984fd-36fe-496e-993d-fa506a32429f" d="M850 452V432"/><path shuku-edit-id="e-71bc3808-5261-4863-b0ee-55740868ba20" d="M850 382V362"/><path shuku-edit-id="e-c93f083b-34d1-499a-8a7c-28ab6752fd8a" d="M850 312V292"/>
      <path shuku-edit-id="e-8c88cec7-68d4-40b9-a634-48e6590c0d10" d="M850 242V222"/><path shuku-edit-id="e-6185ba49-e90d-4530-aca9-fa69d3fad85d" d="M850 172V152"/><path shuku-edit-id="e-e1c598ec-72eb-4b0d-9505-9b65d8ecb420" d="M850 102V64"/>
    </g>
    <g shuku-edit-id="e-4cbd6750-dee1-490a-a320-399b89e1b35b" className="tr-dec-builder-wires is-residual" markerEnd={`url(#${marker})`}>
      <path shuku-edit-id="e-31b1d471-0741-4df3-b6e3-e14ad84bd603" d="M245 525H122Q110 525 110 513V347H155"/>
      <path shuku-edit-id="e-8e7893e1-341f-4c19-88cb-6edf23a56fac" d="M245 305H122Q110 305 110 293V127H155"/>
      <path shuku-edit-id="e-9c1f17b5-6699-4d72-bdb2-cbb7486cfa4e" d="M850 532H678Q665 532 665 519V407H710"/>
      <path shuku-edit-id="e-d9cc2a48-01d7-4760-99ae-61044f7d7330" d="M850 377H1020Q1033 377 1033 364V267H990"/>
      <path shuku-edit-id="e-33da2caa-8863-4cc5-90a6-3af213ffb0f8" d="M850 237H1020Q1033 237 1033 224V127H990"/>
    </g>
    <g shuku-edit-id="e-87e4050a-9728-45c6-ab0c-96139f4e27cf" className="tr-dec-builder-wires is-memory" markerEnd={`url(#${marker})`}>
      <path shuku-edit-id="e-1f38d5d1-d104-4e8d-b58a-17b8726d8c4e" d="M370 25H518Q532 25 532 39V324Q532 324 548 324H710"/>
      <path shuku-edit-id="e-7de8c620-e421-4341-a5aa-8022c5238d98" d="M370 47H550Q564 47 564 61V344H710"/>
    </g>
    <g shuku-edit-id="e-fe89de8b-3d33-43b9-81a9-66f8c1e9fc70" className="tr-dec-builder-wire-labels">
      <text shuku-edit-id="e-37848fb2-9706-4da3-a54d-d289b84d8c41" x="177" y="520">Q</text><text shuku-edit-id="e-3db7b99c-c19b-4ea9-90f7-8b9957a7a129" x="252" y="520">K</text><text shuku-edit-id="e-24019e67-9969-4b68-8d41-1dd3302de1f4" x="301" y="520">V</text>
      <text shuku-edit-id="e-65ecdcd5-0391-4fc8-ab6b-1e58aefdd7f4" x="785" y="526">Q</text><text shuku-edit-id="e-61c22dc8-92d1-45c3-87f3-d234a9543c1b" x="855" y="526">K</text><text shuku-edit-id="e-b7b9bc44-cb25-432e-9b96-8400d4d57ff0" x="908" y="526">V</text>
      <text shuku-edit-id="e-bed28534-16a1-41a1-be4b-98230e42cad8" x="859" y="377">Q</text><text shuku-edit-id="e-56030836-0352-43fc-bf23-75cabf476343" x="675" y="318">K</text><text shuku-edit-id="e-de96358a-e583-4729-896c-4d4a94958dd3" x="675" y="348">V</text>
      <text shuku-edit-id="e-34c1fa2e-b36b-4795-947c-88b0c936dcd0" className="tr-dec-builder-repeat" x="430" y="112">× 6</text><text shuku-edit-id="e-c1a19ee0-74a2-4b23-b127-242cbc4c2fdf" className="tr-dec-builder-repeat" x="1055" y="112">× 6</text>
    </g>

    <foreignObject shuku-edit-id="e-03b7708f-04f8-4f1a-8443-370393219a5e" x="120" y="6" width="250" height="58"><MatrixPort title="编码器输出 Hₑₙ꜀" shape="源词数 × 512" values={encoderValues} tone="source"/></foreignObject>
    <foreignObject shuku-edit-id="e-09ccb466-2e06-4b7b-8d8c-aa1b5e68f7d7" x="120" y="552" width="250" height="58"><MatrixPort title="编码器输入" shape="源词数 × 512" values={initialMatrix(19)} tone="source"/></foreignObject>
    {encoderNodes.map(node => <foreignObject shuku-edit-id="e-97a8b872-d4a0-453d-a70e-ba88b1c30f5c" x="155" y={node.y} width="180" height="54" key={node.y}><div shuku-edit-id="e-832ed7f4-88e9-44e1-a502-a30182cf8583" className={`tr-dec-builder-encoder-node is-${node.tone}`}><img shuku-edit-id="e-97fbe332-b323-4e91-8410-565ce93a67b1" src={node.image} alt=""/><strong shuku-edit-id="e-ec52dab4-6a55-45fe-8649-56020403d8b7">{node.title}</strong></div></foreignObject>)}
    <foreignObject shuku-edit-id="e-913def49-78c5-4f7f-8edc-35b7ab77d82d" className={transferring ? 'tr-dec-builder-layer-output is-sending' : undefined} x="710" y="6" width="280" height="58"><MatrixPort title={running ? `Block ${layer} 输出` : '解码器输出'} shape="目标词数 × 512" values={outputValues} tone="output"/></foreignObject>
    <foreignObject shuku-edit-id="e-95b92f75-c063-48cb-b877-db98ece1b482" className={running ? 'tr-dec-builder-layer-input' : undefined} key={`input-${layer}`} x="710" y="552" width="280" height="58"><MatrixPort title={running ? `Block ${layer} 输入` : '解码器输入'} shape="目标词数 × 512" values={inputValues} tone="target"/></foreignObject>
    {expectedSlots.map((expected, index) => <foreignObject shuku-edit-id="e-bf6871df-6845-4684-9b9c-4629d3369340" x="710" y={slotY[index]} width="280" height="50" key={index}><DecoderSlot index={index} expected={expected} installed={slots[index]} hovered={hovered === index} selectedId={selectedId} onInstall={onInstall} onRemove={onRemove} onInspect={onInspect}/></foreignObject>)}
    {running && <g shuku-edit-id="e-f77a1f80-1947-4042-acc9-772322b798e2" className={`tr-dec-builder-transfer${transferring ? ' is-transferring' : ''}`}>
      <path shuku-edit-id="e-aae59406-7c7f-4326-a78b-8a3f72f6f923" d={loopPath} markerEnd={`url(#${loopMarker})`}/>
      {transferring && <SvgPathTraveler key={layer} path={loopPath} durationMs={transferDurationMs} className="tr-dec-builder-travelling-matrix">
        <rect shuku-edit-id="e-3aa9ca25-3fab-496c-b304-c3489136d0e6" className="tr-dec-builder-travelling-frame" x="-34" y="-23" width="68" height="46" rx="6"/>
        {outputValues.map((value, index) => <rect shuku-edit-id="e-bf295427-ba58-431c-a4f6-c4e9be871c3b" className="tr-dec-builder-travelling-cell" key={index} x={-28 + (index % 6) * 9} y={-18 + Math.floor(index / 6) * 8} width="7" height="6" rx="1" opacity={.28 + value * .68}/>)}
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
    <div shuku-edit-id="e-469ea71f-6227-4495-92aa-4432ba79c479" className="tr-dec-builder-layout" ref={rootRef}>
      <aside shuku-edit-id="e-a1facaf2-914d-45c0-b0f8-8ecb8a1eeabb" className="tr-dec-builder-bank">
        <header shuku-edit-id="e-ddf3ebb5-e541-4c8f-8b9c-aad8f5d705fd"><b shuku-edit-id="e-7906780a-bafa-4b64-b88b-01b3ba84b52a">模块工具箱</b><span shuku-edit-id="e-b73f05b2-3758-4862-8843-0f758b3b35ef">{installedCount} / 6</span></header>
        {pieces.map(piece => <button shuku-edit-id="e-19fd219a-f544-4bb0-baf1-f1ffc1c5b15b" type="button" key={piece.id} disabled={running} className={`${selectedId === piece.id ? 'is-selected ' : ''}is-${piece.id}`} onPointerDown={event => startDrag(event, piece.id)} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={() => { dragIdRef.current = null; setDrag(null); setHovered(null); }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setSelectedId(piece.id);
        } }} aria-label={`拖动${piece.title}到右侧解码器安装框`}><img shuku-edit-id="e-ebde19b8-8ea7-48be-98b0-f606bc873a62" src={piece.image} alt=""/><span shuku-edit-id="e-9deafbc7-d917-4d7d-a1d7-cab021776ce8"><strong shuku-edit-id="e-60265d26-aa39-49c4-a526-b5df4d7510e5">{piece.title}</strong><small shuku-edit-id="e-98e492e4-45f2-49f7-a549-6c216ffbe49e">{piece.detail}</small></span><b shuku-edit-id="e-6dbf7e79-fea4-42b7-af23-5bd3888e7803">×{piece.count}</b></button>)}
      </aside>
      <section shuku-edit-id="e-be7604b1-270d-411b-9145-71b2d2ce7c92" className="tr-dec-builder-diagram" aria-label="编码器与解码器完整框架图">
        <header shuku-edit-id="e-8e64e947-7c51-4104-9c80-ffa5c1283f32"><b shuku-edit-id="e-5c801870-6e3c-4fad-b9f2-f723f42d4a56">编码器（已装好）</b><b shuku-edit-id="e-fed00193-da76-4432-a3fd-d59b57892d4a">{running ? `Decoder Block ${layer} / 6` : '1 个 Decoder Block'}</b></header>
        <Architecture slots={slots} encoderValues={sourceValues} inputValues={snapshot.input} outputValues={snapshot.output} running={running} transferring={transferring} layer={layer} hovered={hovered} selectedId={selectedId} onInstall={install} onRemove={index => setSlots(previous => previous.map((slot, slotIndex) => slotIndex === index ? null : slot))} onInspect={setFeedbackSlot}/>
        <aside shuku-edit-id="e-57217caf-6da8-4d7f-b81b-e583c8e612bc" className="tr-dec-builder-side-notes">
          {feedback && activeWrong !== null && <div shuku-edit-id="e-bf58ad95-9635-472e-ae42-d8391a49a7c7" className="tr-dec-builder-paper" role="note" aria-label="安装提示" aria-live="polite"><AssemblyFeedbackBody feedback={feedback}/><button shuku-edit-id="e-20db2260-d907-46fc-9a50-e04f8ffaea82" type="button" onClick={() => setSlots(previous => previous.map((slot, index) => index === activeWrong ? null : slot))}>撤回 ↶</button></div>}
        </aside>
      </section>
    </div>
    {drag && createPortal(<div shuku-edit-id="e-a7cf1204-4e2b-4e46-a234-805a0eeabd2e" className="tr-dec-builder-drag-preview" style={{ left: drag.x, top: drag.y }} aria-hidden="true"><img shuku-edit-id="e-7ae86ff7-871d-4f93-8d1e-31f7df2acee2" src={pieces.find(piece => piece.id === drag.id)?.image} alt=""/></div>, document.body)}
    <footer shuku-edit-id="e-976a8547-d514-4db0-8304-db772e3b3ac1" className="tr-dec-builder-footer"><Button variant="primary" disabled={!ready || autoRunning} onClick={advanceLayer}>{!running ? '依次运行 6 个 Block' : autoRunning ? `正在运行 Block ${layer} / 6` : '完成解码器组装'}</Button></footer>
  </LessonStage>;
}
