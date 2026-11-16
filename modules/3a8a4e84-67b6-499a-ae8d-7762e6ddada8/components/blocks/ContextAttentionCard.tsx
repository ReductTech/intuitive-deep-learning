import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import './ContextAttentionCard.css';
type Phase = 'initial' | 'scanning' | 'resolved';
const UNFOLD_DURATION = 6000;
const EXAMPLES = [
    { words: ['She', 'deposited', 'money', 'in', 'the', 'bank.'], clues: [1, 2], chinese: '她把钱存进银行。', meaning: '银行', color: '#248ca8', pale: '#e6f4f8', art: 'bank' },
    { words: ['They', 'sat', 'on', 'the', 'bank', 'of', 'the', 'river.'], clues: [7], chinese: '他们坐在河岸上。', meaning: '河岸', color: '#4d9c79', pale: '#eaf5ee', art: 'river' },
    { words: ['A', 'bank', 'of', 'clouds', 'covered', 'the', 'sky.'], clues: [3, 6], chinese: '一大片云层遮住了天空。', meaning: '云层', color: '#8b79bc', pale: '#f1edf9', art: 'clouds' },
    { words: ['The', 'pilot', 'began', 'to', 'bank', 'the', 'plane.'], clues: [1, 6], chinese: '飞行员开始让飞机倾斜转弯。', meaning: '倾斜转弯', color: '#d58650', pale: '#fcf0e4', art: 'plane' },
] as const;
// Original vector artwork, used as semantic labels rather than model output.
const ART: Record<string, string> = {
    bank: '<path d="M12 35 40 16 68 35Z" fill="#a9dce7"/><path d="M16 36h48v6H16zM14 67h52v7H14z" fill="#4d94a8"/><path d="M23 42v25m17-25v25m17-25v25" stroke="#8bc6d5" stroke-width="8"/><circle cx="40" cy="29" r="6" fill="#fff4c4"/><path d="M37 29h6m-3-3v6" stroke="#b69141" stroke-width="2"/><path d="M21 76h38" stroke="#cee7ed" stroke-width="3"/><circle cx="64" cy="57" r="9" fill="#f4c76d"/><path d="M64 52v10m-3-8h5m-5 6h5" stroke="#bb8a34" stroke-width="1.8"/>',
    river: '<path d="M7 43Q19 25 39 40T74 39v35H7Z" fill="#acd9a8"/><path d="M38 39Q18 51 40 58T29 77h32Q77 65 56 56T62 38Z" fill="#7dc8e6"/><path d="M38 48q-8 5 4 8m7 10q-9 4-7 7" fill="none" stroke="#e5f9ff" stroke-width="3" stroke-linecap="round"/><path d="M16 44V26" stroke="#9d8057" stroke-width="4"/><circle cx="16" cy="23" r="12" fill="#73af85"/><circle cx="25" cy="27" r="8" fill="#8dc799"/><path d="M65 49l3-9m-3 9-4-6" stroke="#609b6e" stroke-width="3" stroke-linecap="round"/>',
    clouds: '<circle cx="57" cy="24" r="13" fill="#f5d78e"/><path d="M13 48a12 12 0 0 1 1-24 17 17 0 0 1 32-2 13 13 0 0 1 14 26Z" fill="#fff" stroke="#b5c6de" stroke-width="2"/><path d="M27 67a10 10 0 0 1 1-20 14 14 0 0 1 27-1 11 11 0 0 1 14 21Z" fill="#d5e2f2" stroke="#b5c6de" stroke-width="2"/><path d="M14 59h8m-7 9h5m39-30h9" stroke="#a9b6d4" stroke-width="2.5" stroke-linecap="round"/>',
    plane: '<path d="M10 61q10 10 27 4m-22 9q12 5 20 0" fill="none" stroke="#b9d6e8" stroke-width="2.5" stroke-linecap="round"/><g transform="rotate(-24 42 40)"><path d="m13 42 23-5 4-23q1-5 5-4l4 26 19 2q7 2 5 6l-24 3-4 20-6 1-3-19-19 4-6-7Z" fill="#f9fcff" stroke="#6b9cb8" stroke-width="2.4" stroke-linejoin="round"/><path d="m51 38 12 2" stroke="#e9a276" stroke-width="5" stroke-linecap="round"/><path d="M40 26v8" stroke="#7eb5d1" stroke-width="3" stroke-linecap="round"/></g>',
};
function artMarkup(kind: string) { return `<svg viewBox="0 0 80 88" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${ART[kind]}</svg>`; }
function SentenceCard({ index, phase, selected, onSelect }: {
    index: number;
    phase: Phase;
    selected: boolean;
    onSelect: () => void;
}) {
    const example = EXAMPLES[index];
    const chineseBank = index === 2 ? '一大片' : example.meaning;
    const [chineseBefore, chineseAfter] = example.chinese.split(chineseBank);
    const row = useRef<HTMLDivElement>(null);
    const [arcs, setArcs] = useState<{
        d: string;
        clue: boolean;
        delay: number;
    }[]>([]);
    useLayoutEffect(() => {
        const element = row.current;
        if (!element)
            return;
        const measure = () => {
            const box = element.getBoundingClientRect();
            const tokens = [...element.querySelectorAll<HTMLElement>('[data-word]')];
            const bankIndex = example.words.findIndex(word => word.toLowerCase().replace('.', '') === 'bank');
            const centers = tokens.map(token => { const bounds = token.getBoundingClientRect(); return (bounds.left + bounds.width / 2 - box.left) * element.clientWidth / box.width; });
            const source = centers[bankIndex];
            setArcs(centers.map((x, i) => ({
                // Every token participates, including bank itself through a small self-loop.
                d: i === bankIndex
                    ? `M ${source - 6} 3 C ${source - 27} 31, ${source + 27} 31, ${source + 6} 3`
                    : `M ${source} 3 C ${source} ${25 + Math.abs(source - x) * .10}, ${x} ${25 + Math.abs(source - x) * .10}, ${x} 3`,
                clue: (example.clues as readonly number[]).includes(i),
                delay: i * -.27 - index * .13,
            })));
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        return () => observer.disconnect();
    }, [example, index]);
    return <button shuku-edit-id="e-7caef576-4cee-4687-92a4-d95e19e01751" type="button" className={`tr-bank-sentence ${selected ? 'is-selected' : ''} ${phase !== 'initial' ? 'has-context' : ''} ${phase === 'scanning' ? 'is-scanning' : ''}`} style={{ '--sense': example.color, '--sense-pale': example.pale } as CSSProperties} onClick={onSelect} aria-pressed={selected} aria-label={`${example.chinese}，高亮对应向量`}>
    <span shuku-edit-id="e-d73bde16-9574-4947-b737-73203b068034" className="tr-bank-sentence__number">0{index + 1}</span>
    <div shuku-edit-id="e-38386d83-7b58-4adf-b7be-e9450149a282" className="tr-bank-sentence__english" ref={row}>
      <div shuku-edit-id="e-77ff8c1f-04a5-4b44-9f81-fd67752d5d7b" className="tr-bank-sentence__words">{example.words.map((word, i) => <span shuku-edit-id="e-b762b6d1-1dd7-4539-9e28-b288849f49f5" key={i} data-word className={word.toLowerCase().replace('.', '') === 'bank' ? 'is-bank' : ''}>{word}</span>)}</div>
      <svg shuku-edit-id="e-f5028451-067b-440a-9806-a344eeaa360e" className="tr-bank-arcs" aria-hidden="true">{arcs.map((arc, i) => <g shuku-edit-id="e-27581700-e5c5-4bb5-b939-e1c620510445" key={i} style={{ '--delay': `${arc.delay}s` } as CSSProperties} className={arc.clue ? 'is-clue' : ''}><path shuku-edit-id="e-9482dc7b-112f-4760-85cb-250408aed14b" className="tr-bank-arc-outline" d={arc.d}/><path shuku-edit-id="e-615bf2b5-75f8-496d-8699-3b4986cb9694" className="tr-bank-arc" d={arc.d}/><path shuku-edit-id="e-88c0fd68-effa-44a9-8bd3-0c8361ea702c" className="tr-bank-flow" d={arc.d}/></g>)}</svg>
    </div>
    <span shuku-edit-id="e-57b27726-8e72-406a-8881-8eef38650cd6" className="tr-bank-sentence__chinese">{chineseBefore}<strong shuku-edit-id="e-84f26752-e71f-4e68-b29c-f807e6c3aff9" className="is-bank-translation">{chineseBank}</strong>{chineseAfter}</span>
  </button>;
}
function ContextSpace({ phase, selected }: {
    phase: Phase;
    selected: number | null;
}) {
    const host = useRef<HTMLDivElement>(null);
    const state = useRef({ phase, selected });
    const reset = useRef<() => void>(() => { });
    useEffect(() => { state.current = { phase, selected }; }, [phase, selected]);
    useEffect(() => {
        const element = host.current;
        if (!element)
            return;
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        element.appendChild(renderer.domElement);
        const labels = new CSS2DRenderer();
        labels.domElement.className = 'tr-bank-space__labels';
        element.appendChild(labels.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
        const cameraStart = new THREE.Vector3(3, 2.2, 4.6);
        camera.position.copy(cameraStart);
        camera.lookAt(0, 0, 0);
        const orbit = new OrbitControls(camera, renderer.domElement);
        orbit.enableDamping = true;
        orbit.enablePan = false;
        orbit.minDistance = 4.5;
        orbit.maxDistance = 9;
        reset.current = () => { camera.position.copy(cameraStart); orbit.target.set(0, 0, 0); orbit.update(); };
        scene.add(new THREE.HemisphereLight(0xffffff, 0xa9bfca, 2));
        const axesGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-2.2, 0, 0), new THREE.Vector3(2.2, 0, 0), new THREE.Vector3(0, -1.7, 0), new THREE.Vector3(0, 1.7, 0), new THREE.Vector3(0, 0, -2), new THREE.Vector3(0, 0, 2),
        ]);
        const axisMaterial = new THREE.LineBasicMaterial({ color: 0x8aa0b7, transparent: true, opacity: .57 });
        scene.add(new THREE.LineSegments(axesGeometry, axisMaterial));
        const grid = new THREE.GridHelper(4.4, 11, 0xa0b7cb, 0xb6cbdc);
        grid.position.y = -1.35;
        (grid.material as THREE.Material).transparent = true;
        (grid.material as THREE.Material).opacity = .28;
        scene.add(grid);
        // Fixed teaching coordinates. These are not measured embeddings or PCA scores.
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        const initial = right.clone().multiplyScalar(.1).addScaledVector(up, .72);
        const depth = cameraStart.clone().normalize();
        const targets = [[-1.08, .78, -.28], [1.08, .75, .30], [-1.08, -.72, .22], [1.08, -.72, -.35]].map(([x, y, z]) => right.clone().multiplyScalar(x).addScaledVector(up, y).addScaledVector(depth, z));
        const arrows = EXAMPLES.map((example, index) => {
            const geometry = new LineGeometry();
            geometry.setPositions([0, 0, 0, ...initial.toArray()]);
            const material = new LineMaterial({ color: example.color, linewidth: 3, transparent: true, opacity: .94 });
            const line = new Line2(geometry, material);
            line.frustumCulled = false;
            scene.add(line);
            const head = new THREE.Mesh(new THREE.ConeGeometry(.052, .16, 20), new THREE.MeshBasicMaterial({ color: example.color }));
            scene.add(head);
            const tip = new THREE.Mesh(new THREE.SphereGeometry(.043, 20, 16), new THREE.MeshBasicMaterial({ color: example.color }));
            scene.add(tip);
            const labelElement = document.createElement('div');
            labelElement.className = 'tr-bank-space__sense';
            labelElement.style.setProperty('--sense', example.color);
            labelElement.innerHTML = `${artMarkup(example.art)}<strong>${example.meaning}</strong>`;
            const label = new CSS2DObject(labelElement);
            scene.add(label);
            return { line, material, head, tip, label, labelElement, index };
        });
        const resize = () => {
            const width = Math.max(1, element.clientWidth), height = Math.max(1, element.clientHeight);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height, false);
            labels.setSize(width, height);
            arrows.forEach(arrow => arrow.material.resolution.set(width, height));
        };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(element);
        let frame = 0, started = 0, lastPhase: Phase = 'initial';
        const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const axisUp = new THREE.Vector3(0, 1, 0);
        const point = new THREE.Vector3();
        const animate = (time: number) => {
            frame = requestAnimationFrame(animate);
            orbit.update();
            const current = state.current;
            if (current.phase !== lastPhase) {
                started = time;
                lastPhase = current.phase;
            }
            const raw = current.phase === 'resolved' ? 1 : current.phase === 'scanning' ? Math.max(0, Math.min(1, (time - started - 400) / (UNFOLD_DURATION - 400))) : 0;
            const progress = reducedMotion ? (current.phase !== 'initial' ? 1 : 0) : raw * raw * (3 - 2 * raw);
            const labelUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
            const labelRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
            arrows.forEach(arrow => {
                point.lerpVectors(initial, targets[arrow.index], progress);
                const visible = current.phase !== 'initial' || arrow.index === 0;
                const highlight = current.selected === arrow.index && current.phase === 'resolved';
                arrow.line.visible = arrow.head.visible = arrow.tip.visible = visible;
                arrow.material.color.set(current.phase !== 'initial' ? EXAMPLES[arrow.index].color : '#248ca8');
                arrow.material.linewidth = highlight ? 5 : 3;
                const endpoint = arrow.line.geometry.attributes.instanceEnd as THREE.InterleavedBufferAttribute;
                endpoint.setXYZ(0, point.x, point.y, point.z);
                endpoint.data.needsUpdate = true;
                const direction = point.clone().normalize();
                arrow.head.position.copy(point).addScaledVector(direction, -.08);
                arrow.head.quaternion.setFromUnitVectors(axisUp, direction);
                arrow.tip.position.copy(point);
                arrow.tip.scale.setScalar(highlight ? 1.6 : 1);
                arrow.label.visible = true;
                const stackX = (arrow.index - 1.5) * .13;
                const stackY = (arrow.index - 1.5) * -.045;
                const finalX = arrow.index % 2 === 0 ? -.16 : .16;
                const finalY = arrow.index < 2 ? .24 : -.25;
                arrow.label.position.copy(point)
                    .addScaledVector(labelUp, (.18 + stackY) * (1 - progress) + finalY * progress)
                    .addScaledVector(labelRight, stackX * (1 - progress) + finalX * progress);
                arrow.labelElement.classList.toggle('is-stacked', progress < .16);
                arrow.labelElement.style.zIndex = String(progress < .16 ? arrow.index + 1 : highlight ? 6 : 1);
                arrow.labelElement.classList.toggle('is-highlighted', highlight);
            });
            renderer.render(scene, camera);
            labels.render(scene, camera);
        };
        frame = requestAnimationFrame(animate);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            orbit.dispose();
            scene.traverse(object => {
                if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof Line2) {
                    object.geometry.dispose();
                    (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose());
                }
            });
            renderer.dispose();
            renderer.domElement.remove();
            labels.domElement.remove();
        };
    }, []);
    return <div shuku-edit-id="e-c8f7b1d1-4a3b-4208-b6e4-477f622c7c1d" className={`tr-bank-space ${phase === 'initial' ? 'has-initial-note' : ''}`} role="group" aria-label={phase === 'resolved' ? '四种语境对应四个不同的示意向量，可拖动旋转' : '四句话中的 bank 共用一个初始词向量，可拖动旋转'}><div shuku-edit-id="e-6fb12264-6ff5-45fd-a614-a88342552ffe" className="tr-bank-space__viewport" ref={host}><button shuku-edit-id="e-d8fddb65-b907-47d6-bfbb-1a5761896685" type="button" className="tr-bank-reset" onClick={() => reset.current()}>重置视角</button></div>{phase === 'initial' && <div shuku-edit-id="e-5902a2b9-c1a2-44d6-a52c-c53bae10394f" className="tr-bank-space__initial"><strong shuku-edit-id="e-bfda30b2-e685-41a2-a16b-afee92144c44">bank</strong><span shuku-edit-id="e-54e77ac8-aace-4a25-835f-3302c559a6f3">四句话，共用一个初始向量</span></div>}</div>;
}
export function ContextAttentionCard({ onComplete }: {
    onComplete: () => void;
}) {
    const [phase, setPhase] = useState<Phase>('initial');
    const [selected, setSelected] = useState<number | null>(null);
    useEffect(() => {
        if (phase !== 'scanning')
            return;
        const timer = window.setTimeout(() => setPhase('resolved'), UNFOLD_DURATION + 100);
        return () => window.clearTimeout(timer);
    }, [phase]);
    const start = () => { setSelected(null); setPhase('scanning'); };
    return <section shuku-edit-id="e-ba77360e-550c-49ed-9c1f-1cdbe8cc36b3" className="tr-bank-page" aria-labelledby="tr-bank-title">
    <header shuku-edit-id="e-acdfd94f-6726-4dd6-9007-0773198b081c" className="tr-lesson-header"><h1 shuku-edit-id="e-09a7f57b-0a7d-455d-9fff-4f86fefdf5e3" id="tr-bank-title">自注意力：结合上下文理解词义</h1><p shuku-edit-id="e-cd3cf9eb-a5f8-401c-9d4c-78c5ba4dcd78">{phase === 'initial' ? '点击“加入自注意力”，观察四个句子中的 bank 向量怎样变化。' : phase === 'scanning' ? '留意各句的上下文线索，观察 bank 的向量逐渐改变。' : '点击不同例句，对照它们的上下文和 bank 的向量方向。'}</p></header>
    <main shuku-edit-id="e-48a6b5ee-8bff-4a57-87f6-47c68d12b2a4" className="tr-bank-layout">
      <section shuku-edit-id="e-43d0fe1e-2130-4112-aca0-b4ab5f1196fa" className="tr-bank-examples" aria-label="bank 的四种语境"><div shuku-edit-id="e-b1331e5f-401c-483d-90a2-557b77e2bde3">{EXAMPLES.map((_, index) => <SentenceCard key={index} index={index} phase={phase} selected={selected === index} onSelect={() => setSelected(current => current === index ? null : index)}/>)}</div></section>
      <section shuku-edit-id="e-edb4cff0-8645-4365-a61b-a3e390cdd77a" className={`tr-bank-visual is-${phase}`} aria-label="自注意力语境演示">
        <div shuku-edit-id="e-711f9d9c-416b-4258-867a-97142999190b" className="tr-bank-visual__head"><h2 shuku-edit-id="e-d4e03e4a-f903-4846-a51a-3d466e05b364">{phase === 'initial' ? '句子不同，初始向量相同' : phase === 'scanning' ? '让 bank 联系各句的上下文' : '结合上下文，形成不同表示'}</h2><span shuku-edit-id="e-7f942333-fd6f-4f6e-ae4b-2906438e4f31">{phase === 'initial' ? '初始嵌入' : phase === 'scanning' ? '汇聚线索中…' : '语境表示'}</span></div>
        <ContextSpace phase={phase} selected={selected}/>
        <div shuku-edit-id="e-76f14200-40d5-4e66-b010-0c616cf28d7a" className="tr-bank-explanation" aria-live="polite">
          <h3 shuku-edit-id="e-20755825-90ed-40b4-a391-754b2f2cb56f">{phase === 'initial' ? '初始嵌入，还没有读懂语境' : '自注意力是一种根据上下文更新词向量的机制'}</h3>
          <div shuku-edit-id="e-ae996942-f958-4ac9-a261-6f3a2e711845" className="tr-bank-explanation__flow">{phase === 'initial' ? <><strong shuku-edit-id="e-dc37d62a-1e73-445f-b0ef-ae5e6604596a">同一个 bank</strong><span shuku-edit-id="e-01b09fa2-e2ca-4e72-8bf6-231230fd46f8" aria-hidden="true">→</span><strong shuku-edit-id="e-f32b01c3-5d7b-4508-b5ea-5dc9b3709da4">相同的初始向量</strong><em shuku-edit-id="e-8448388f-9224-4833-ad84-78a760557d2b">尚未结合上下文</em></> : <><strong shuku-edit-id="e-c3c9e19a-b726-42fa-94aa-bfc99b1d02ca">所在句子的上下文</strong><span shuku-edit-id="e-8e324c8d-2db5-4065-9209-6c089397a432" aria-hidden="true">→</span><strong shuku-edit-id="e-60a08cfa-ddde-4444-92e6-9c78ed73be58">更新 bank 的表示</strong><em shuku-edit-id="e-0b50a4a9-340b-4b95-bd13-1415d13fbb99">帮助区分词义</em></>}</div>
          <p shuku-edit-id="e-4122432e-fb08-4e60-9415-dc034a45bdc3" className="tr-bank-demo-note"><b shuku-edit-id="e-26c139b8-6b3f-48c2-ab6d-52c2d59a9fea">教学示意</b>连线与方向由人为设计，并非真实模型的计算结果。</p>
        </div>
      </section>
    </main>
    <footer shuku-edit-id="e-a1d7079f-df2e-46c2-834c-ca091142729a"><span shuku-edit-id="e-edb0a0a2-6c0d-4a66-81f6-405c0d2b55cc">{phase === 'resolved' ? '点击例句，高亮对应向量。' : ''}</span><div shuku-edit-id="e-0a924f7e-a53e-43d4-bbc9-285f7641a029"><button shuku-edit-id="e-7501c3d9-6c30-43f4-b0d4-267cbe8f6296" className="tr-bank-action" type="button" disabled={phase === 'scanning'} onClick={start}>{phase === 'initial' ? '加入自注意力 →' : phase === 'scanning' ? '正在汇聚上下文…' : '↻ 重播注意力'}</button>{phase === 'resolved' && <button shuku-edit-id="e-2d78ce76-7255-479e-8ddd-ea10f25a0837" className="tr-bank-next" type="button" onClick={onComplete}>继续探索 →</button>}</div></footer>
  </section>;
}
