import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { PCA } from '../../vendor/ml-pca.mjs';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { Button } from '../../../shared/react/controls/Button';
import { LessonStage } from '../LessonStage';
import './EmbeddingRelationCard.css';
const EMBEDDING_SIZE = 50;
const DEFAULT_WORDS = ['father', 'mother', 'son', 'daughter'];
interface DirectionExplanation {
    icon: string;
    title: string;
    pairs: string[];
    meaning: string;
    caveat: string;
}
interface Preset {
    label: string;
    icon: string;
    words: string[];
    explanation: DirectionExplanation;
}
const FAMILY_EXPLANATION: DirectionExplanation = {
    icon: '🧭', title: '称呼里的方向感',
    pairs: ['爸爸 → 妈妈', '儿子 → 女儿'], meaning: '男性 → 女性',
    caveat: '也会混合亲属等信息。',
};
const CUSTOM_EXPLANATION: DirectionExplanation = {
    icon: '🧭', title: '方向可能承载什么？',
    pairs: [], meaning: '相似的语义变化',
    caveat: '具体含义需结合词语判断。',
};
const PRESETS: Preset[] = [
    // Descending original-space difference cosine, measured with the local model.
    // 0.9216660871
    { label: '跨国语言局', icon: '🌍', words: ['germany', 'german', 'italy', 'italian'], explanation: {
            icon: '🌍', title: '国家名与语言名',
            pairs: ['德国 → 德语', '意大利 → 意大利语'], meaning: '国家 → 语言',
            caveat: '也会混合国籍等词义。',
        } },
    // 0.8700596364
    { label: '首都传送门', icon: '🗺️', words: ['japan', 'tokyo', 'thailand', 'bangkok'], explanation: {
            icon: '🗺️', title: '从国家指向首都',
            pairs: ['日本 → 东京', '泰国 → 曼谷'], meaning: '国家 → 首都',
            caveat: '换一组词，结果可能不同。',
        } },
    // 0.8538778639
    { label: '战场定位', icon: '🪖', words: ['budapest', 'hungary', 'warsaw', 'poland'], explanation: {
            icon: '🪖', title: '战场城市与国家',
            pairs: ['布达佩斯 → 匈牙利', '华沙 → 波兰'], meaning: '城市 → 国家',
            caveat: '这不代表模型理解了战役。',
        } },
    // 0.8145879312
    { label: '全家换称呼', icon: '👪', words: ['father', 'mother', 'son', 'daughter'], explanation: FAMILY_EXPLANATION },
    // Founder names: https://www.harrypotter.com/features/stories-of-the-hogwarts-founders
    // 0.7318164087
    { label: '分院帽寻根', icon: '🧙', words: ['ravenclaw', 'rowena', 'hufflepuff', 'helga'], explanation: {
            icon: '🧙', title: '学院与创始人',
            pairs: ['拉文克劳 → 罗伊纳', '赫奇帕奇 → 赫尔加'], meaning: '学院 → 创始人',
            caveat: '方向也会混合其他信息。',
        } },
];
const matchesWords = (left: string[], right: string[]) => left.every((word, index) => word.trim().toLowerCase() === right[index]);
const WORD_VECTOR_COLOR = 0x168faa;
const RELATION_VECTOR_COLOR = 0xe77c56;
const DEFAULT_CAMERA_POSITION: [
    number,
    number,
    number
] = [1.94, 1.36, 2.28];
interface VectorRow {
    token: string;
    values: number[];
}
interface Projection {
    points: [
        number,
        number,
        number
    ][];
}
function cosineOfDifferences(rows: VectorRow[]) {
    const left = rows[1].values.map((value, index) => value - rows[0].values[index]);
    const right = rows[3].values.map((value, index) => value - rows[2].values[index]);
    let dot = 0;
    let leftSquared = 0;
    let rightSquared = 0;
    for (let index = 0; index < left.length; index += 1) {
        dot += left[index] * right[index];
        leftSquared += left[index] * left[index];
        rightSquared += right[index] * right[index];
    }
    if (leftSquared < 1e-20 || rightSquared < 1e-20)
        return null;
    return Math.max(-1, Math.min(1, dot / Math.sqrt(leftSquared * rightSquared)));
}
/** Standard centered PCA (SVD). Scores are separately computed from the original embeddings. */
function projectFourWords(rows: VectorRow[]): Projection {
    const data = rows.map(row => row.values);
    const pca = new PCA(data, { center: true, scale: false, method: 'SVD' });
    const points = pca.predict(data, { nComponents: 3 }).to2DArray() as [
        number,
        number,
        number
    ][];
    const radius = Math.max(...points.map(point => Math.hypot(...point)), 1e-9);
    const scale = 1.55 / radius;
    return {
        points: points.map(point => point.map(value => value * scale) as [
            number,
            number,
            number
        ]),
    };
}
async function requestEmbeddings(words: string[]) {
    const response = await fetch('/api/glove/embedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: words.join(' '), words }),
        signal: AbortSignal.timeout(60000),
    });
    const raw = await response.text();
    if (!raw)
        throw new Error('本地模型服务暂未就绪，请稍后重试。');
    let data: {
        hidden_size?: number;
        rows?: VectorRow[];
        detail?: string;
    };
    try {
        data = JSON.parse(raw);
    }
    catch {
        throw new Error('本地模型服务响应异常，请重新计算。');
    }
    if (!response.ok) {
        const message = response.status === 404 ? '词表未收录这个词，请换个英文词。'
            : response.status === 503 ? '本地词向量数据未就绪。'
                : 'GloVe 模型计算失败。';
        throw new Error(message);
    }
    if (data.hidden_size !== EMBEDDING_SIZE || !Array.isArray(data.rows) || data.rows.length !== words.length ||
        data.rows.some(row => row.values.length !== EMBEDDING_SIZE || row.values.some(value => !Number.isFinite(value)))) {
        throw new Error('模型没有返回完整词向量，请重试。');
    }
    return data.rows;
}
function makeGlowTexture(color: number) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (!context)
        return null;
    const tint = new THREE.Color(color).convertLinearToSRGB();
    const colored = `rgba(${Math.round(tint.r * 255)}, ${Math.round(tint.g * 255)}, ${Math.round(tint.b * 255)},`;
    const gradient = context.createRadialGradient(58, 54, 3, 64, 64, 62);
    gradient.addColorStop(0, 'rgba(255,255,255,.98)');
    gradient.addColorStop(0.2, `${colored} .94)`);
    gradient.addColorStop(0.48, `${colored} .38)`);
    gradient.addColorStop(0.76, `${colored} .10)`);
    gradient.addColorStop(1, `${colored} 0)`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    context.beginPath();
    context.ellipse(47, 42, 8, 4, -0.6, 0, Math.PI * 2);
    context.fillStyle = 'rgba(255,255,255,.86)';
    context.fill();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}
function addArrow(root: THREE.Group, start: THREE.Vector3, end: THREE.Vector3, color: number, width: number, maxHeadLength: number, materials: LineMaterial[]) {
    const displacement = end.clone().sub(start);
    const length = displacement.length();
    if (length < 1e-5)
        return;
    const direction = displacement.normalize();
    const headLength = Math.min(maxHeadLength, length * 0.14);
    const geometry = new LineGeometry();
    geometry.setPositions([...start.toArray(), ...end.clone().addScaledVector(direction, -headLength * 0.45).toArray()]);
    const glowMaterial = new LineMaterial({
        color,
        linewidth: width * 3,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    const lineMaterial = new LineMaterial({ color, linewidth: width, transparent: true, opacity: 0.96, depthWrite: false });
    materials.push(glowMaterial, lineMaterial);
    const glow = new Line2(geometry, glowMaterial);
    glow.computeLineDistances();
    glow.renderOrder = 1;
    root.add(glow);
    const line = new Line2(geometry.clone(), lineMaterial);
    line.computeLineDistances();
    line.renderOrder = 2;
    root.add(line);
    const head = new THREE.Mesh(new THREE.ConeGeometry(headLength * 0.38, headLength, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.98, depthWrite: false }));
    head.position.copy(end).addScaledVector(direction, -headLength / 2);
    head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    head.renderOrder = 3;
    root.add(head);
}
interface PlotProps {
    words: string[];
    points: [
        number,
        number,
        number
    ][];
}
function VectorPlot3D({ words, points }: PlotProps) {
    const host = useRef<HTMLDivElement>(null);
    const controls = useRef<OrbitControls | null>(null);
    useEffect(() => {
        const container = host.current;
        if (!container)
            return;
        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        }
        catch {
            container.dataset.webglError = 'true';
            return;
        }
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
        // Three.js uses a right-handed world coordinate system: +X × +Y = +Z, with Y upward.
        const startPosition = new THREE.Vector3(...DEFAULT_CAMERA_POSITION);
        camera.up.set(0, 1, 0);
        camera.position.copy(startPosition);
        camera.lookAt(0, 0, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setClearColor(0xf7fbff, 0);
        container.appendChild(renderer.domElement);
        const labels = new CSS2DRenderer();
        labels.domElement.className = 'tr-embedding-plot__labels';
        container.appendChild(labels.domElement);
        const orbit = new OrbitControls(camera, renderer.domElement);
        orbit.enableDamping = true;
        orbit.dampingFactor = 0.075;
        orbit.enablePan = false;
        orbit.minDistance = 3.1;
        orbit.maxDistance = 9;
        controls.current = orbit;
        scene.add(new THREE.HemisphereLight(0xe8f4ff, 0x4e527e, 1.2));
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.7);
        keyLight.position.set(-2.6, 4.2, 5);
        scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0x8ecfff, 0.8);
        fillLight.position.set(4, -1.5, -3);
        scene.add(fillLight);
        const positionVectors = points.map(point => new THREE.Vector3(...point));
        const root = new THREE.Group();
        const vectorLineMaterials: LineMaterial[] = [];
        const labelOffsets: [
            number,
            number
        ][] = [[-0.34, 0.24], [0.34, 0.22], [-0.34, -0.22], [0.34, 0.24]];
        const labelObjects: CSS2DObject[] = [];
        scene.add(root);
        const axisExtent = 1.95;
        const tickHalfLength = 0.055;
        const tickSegments: number[] = [];
        const addSegment = (target: number[], start: [
            number,
            number,
            number
        ], end: [
            number,
            number,
            number
        ]) => {
            target.push(...start, ...end);
        };
        for (const tick of [-1.5, -1, -0.5, 0.5, 1, 1.5]) {
            addSegment(tickSegments, [tick, -tickHalfLength, 0], [tick, tickHalfLength, 0]);
            addSegment(tickSegments, [-tickHalfLength, tick, 0], [tickHalfLength, tick, 0]);
            addSegment(tickSegments, [-tickHalfLength, 0, tick], [tickHalfLength, 0, tick]);
        }
        const lineGeometry = (segments: number[]) => {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(segments, 3));
            return geometry;
        };
        const axisColor = 0x718ba4;
        const ticks = new THREE.LineSegments(lineGeometry(tickSegments), new THREE.LineBasicMaterial({ color: axisColor, transparent: true, opacity: 0.5, depthWrite: false }));
        ticks.renderOrder = 0;
        root.add(ticks);
        const grid = new THREE.GridHelper(3.2, 8, 0x9fb6cd, 0xb8cbdb);
        grid.position.y = -1.65;
        const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
        gridMaterials.forEach(material => {
            material.transparent = true;
            material.opacity = 0.52;
            material.depthWrite = false;
        });
        root.add(grid);
        const axisSegments: number[] = [];
        addSegment(axisSegments, [-axisExtent, 0, 0], [axisExtent, 0, 0]);
        addSegment(axisSegments, [0, -axisExtent, 0], [0, axisExtent, 0]);
        addSegment(axisSegments, [0, 0, -axisExtent], [0, 0, axisExtent]);
        const axes = new THREE.LineSegments(lineGeometry(axisSegments), new THREE.LineBasicMaterial({ color: axisColor, transparent: true, opacity: 0.72, depthWrite: false }));
        axes.renderOrder = 0;
        root.add(axes);
        positionVectors.forEach(position => {
            addArrow(root, new THREE.Vector3(0, 0, 0), position, WORD_VECTOR_COLOR, 2.7, 0.16, vectorLineMaterials);
        });
        for (const [from, to] of [[0, 1], [2, 3]] as const) {
            addArrow(root, positionVectors[from], positionVectors[to], RELATION_VECTOR_COLOR, 3.6, 0.17, vectorLineMaterials);
        }
        const wordTexture = makeGlowTexture(WORD_VECTOR_COLOR);
        const wordMaterial = new THREE.SpriteMaterial({ map: wordTexture, transparent: true, depthWrite: false, alphaTest: 0.01 });
        positionVectors.forEach((position, index) => {
            const sprite = new THREE.Sprite(wordMaterial);
            sprite.position.copy(position);
            sprite.scale.set(0.25, 0.25, 1);
            sprite.renderOrder = 3;
            root.add(sprite);
            const label = document.createElement('span');
            label.className = 'tr-embedding-plot__word';
            label.textContent = words[index];
            const labelObject = new CSS2DObject(label);
            labelObjects.push(labelObject);
            root.add(labelObject);
        });
        let initialViewFitted = false;
        const resize = () => {
            const width = Math.max(1, container.clientWidth);
            const height = Math.max(1, container.clientHeight);
            camera.aspect = width / height;
            // Keep the geometry slightly left of center, with room for the floating note.
            camera.setViewOffset(width, height, width * 0.045, 0, width, height);
            camera.updateProjectionMatrix();
            if (!initialViewFitted) {
                const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
                const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
                const viewBounds = positionVectors.flatMap((point, index) => [point, point.clone()
                        .addScaledVector(right, labelOffsets[index][0])
                        .addScaledVector(up, labelOffsets[index][1])]);
                for (let attempt = 0; attempt < 36; attempt += 1) {
                    camera.updateMatrixWorld();
                    const fits = viewBounds.every(point => {
                        const projected = point.clone().project(camera);
                        return Math.abs(projected.x) <= Math.max(0.35, 1 - 180 / width) &&
                            Math.abs(projected.y) <= Math.max(0.35, 1 - 74 / height);
                    });
                    if (fits)
                        break;
                    camera.position.multiplyScalar(1.04);
                }
                initialViewFitted = true;
            }
            renderer.setSize(width, height, false);
            labels.setSize(width, height);
            vectorLineMaterials.forEach(material => material.resolution.set(width, height));
        };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(container);
        let frame = 0;
        const cameraRight = new THREE.Vector3();
        const cameraUp = new THREE.Vector3();
        const render = () => {
            frame = window.requestAnimationFrame(render);
            orbit.update();
            cameraRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
            cameraUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
            labelObjects.forEach((label, index) => {
                const [horizontal, vertical] = labelOffsets[index];
                label.position.copy(positionVectors[index])
                    .addScaledVector(cameraRight, horizontal)
                    .addScaledVector(cameraUp, vertical);
            });
            renderer.render(scene, camera);
            labels.render(scene, camera);
        };
        render();
        return () => {
            window.cancelAnimationFrame(frame);
            observer.disconnect();
            orbit.dispose();
            controls.current = null;
            scene.traverse(object => {
                if (object instanceof THREE.Mesh) {
                    object.geometry.dispose();
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    materials.forEach(material => material.dispose());
                }
                else if (object instanceof THREE.Line) {
                    object.geometry.dispose();
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    materials.forEach(material => material.dispose());
                }
            });
            wordTexture?.dispose();
            wordMaterial.dispose();
            renderer.dispose();
            labels.domElement.remove();
            renderer.domElement.remove();
        };
    }, [points, words]);
    return <div className="tr-embedding-plot" ref={host} role="group" aria-label="可旋转的四个高维词向量三维投影图">
    <div className="tr-embedding-plot__legend" aria-label="图例">
      <span><i className="is-word-vector"/>词向量</span>
      <span><i className="is-relation-vector"/>差向量</span>
    </div>
  </div>;
}
interface EmbeddingRelationCardProps {
    onComplete: () => void;
}
export function EmbeddingRelationCard({ onComplete }: EmbeddingRelationCardProps) {
    const [words, setWords] = useState(DEFAULT_WORDS);
    const [vectorRows, setVectorRows] = useState<(VectorRow | null)[]>(() => Array(4).fill(null));
    const [loadingWords, setLoadingWords] = useState<boolean[]>(() => Array(4).fill(false));
    const [wordErrors, setWordErrors] = useState<string[]>(() => Array(4).fill(''));
    const wordsRef = useRef<string[]>([...DEFAULT_WORDS]);
    const requestIdsRef = useRef<number[]>([0, 0, 0, 0]);
    const timersRef = useRef<(number | null)[]>([null, null, null, null]);
    const queueVector = (index: number, candidate: string, delay = 320) => {
        const previousTimer = timersRef.current[index];
        if (previousTimer !== null)
            window.clearTimeout(previousTimer);
        const requestId = requestIdsRef.current[index] + 1;
        requestIdsRef.current[index] = requestId;
        const clean = candidate.trim();
        const validationError = /\s/.test(clean) ? '每格只输入一个英文词。'
            : /\p{Script=Han}/u.test(clean) ? '当前词表支持英文，请换成英文词。' : '';
        const invalid = Boolean(validationError);
        setVectorRows(current => current.map((row, item) => item === index ? null : row));
        setWordErrors(current => current.map((message, item) => item === index ? validationError : message));
        setLoadingWords(current => current.map((loading, item) => item === index ? Boolean(clean) && !invalid : loading));
        if (!clean || invalid)
            return;
        timersRef.current[index] = window.setTimeout(async () => {
            timersRef.current[index] = null;
            const isCurrent = () => requestIdsRef.current[index] === requestId && wordsRef.current[index].trim() === clean;
            try {
                const [row] = await requestEmbeddings([clean]);
                if (!isCurrent())
                    return;
                setVectorRows(current => current.map((item, slot) => slot === index ? row : item));
                setLoadingWords(current => current.map((loading, slot) => slot === index ? false : loading));
            }
            catch (caught) {
                if (!isCurrent())
                    return;
                setWordErrors(current => current.map((message, slot) => slot === index
                    ? (caught instanceof Error ? caught.message : '读取向量失败，请重试。')
                    : message));
                setLoadingWords(current => current.map((loading, slot) => slot === index ? false : loading));
            }
        }, delay);
    };
    const rows = vectorRows.every((row): row is VectorRow => row !== null) ? vectorRows : null;
    const isLoading = loadingWords.some(Boolean);
    const serviceUnavailable = wordErrors.some(message => /服务|未就绪|计算失败|没有返回/.test(message));
    const projection = useMemo(() => rows ? projectFourWords(rows) : null, [rows]);
    const cosine = useMemo(() => rows ? cosineOfDifferences(rows) : null, [rows]);
    const refreshAll = (candidate: string[]) => {
        wordsRef.current = [...candidate];
        setWords([...candidate]);
        candidate.forEach((word, index) => queueVector(index, word, 0));
    };
    useEffect(() => {
        DEFAULT_WORDS.forEach((word, index) => queueVector(index, word, 0));
        return () => {
            timersRef.current.forEach(timer => { if (timer !== null)
                window.clearTimeout(timer); });
            requestIdsRef.current = requestIdsRef.current.map(id => id + 1);
        };
    }, []);
    const updateWord = (index: number, value: string) => {
        const next = wordsRef.current.map((word, item) => item === index ? value : word);
        wordsRef.current = next;
        setWords(next);
        queueVector(index, value);
    };
    const choosePreset = (presetWords: readonly string[]) => {
        refreshAll([...presetWords]);
    };
    const similarityPosition = cosine === null ? 50 : (cosine + 1) * 50;
    const activePreset = PRESETS.find(preset => matchesWords(words, preset.words));
    const explanation = activePreset?.explanation ?? (matchesWords(words, DEFAULT_WORDS) ? FAMILY_EXPLANATION : CUSTOM_EXPLANATION);
    return <LessonStage kicker="第一幕 · 装备二" title="从几何角度理解词嵌入" description="切换词组或输入四个英文词，比较两组差向量的方向与余弦相似度。" className="tr-stage tr-embedding-relation">
    <div className="tr-embedding-relation__layout">
      <section className="tr-embedding-relation__panel tr-embedding-relation__inputs" aria-label="词语向量配对实验">
        <div className="tr-embedding-relation__panel-head">
          <span>输入 4 个英文词，比较两组词的差向量方向</span>
          <div className="tr-embedding-relation__presets" aria-label="示例关系">
            {PRESETS.map(preset => <button type="button" key={preset.label} title={preset.words.join(' → ')} aria-pressed={activePreset === preset} onClick={() => choosePreset(preset.words)}>
              <span aria-hidden="true">{preset.icon}</span>{preset.label}
            </button>)}
          </div>
        </div>
        <div className="tr-embedding-relation__pairs">
          {[0, 1].map(relation => <div className="tr-relation-input" key={relation}>
            <div className="tr-relation-input__label">{relation === 0 ? '词组 A' : '词组 B'}</div>
            <label className="tr-relation-input__field"><input aria-label={`关系${relation === 0 ? 'A' : 'B'}起点词`} aria-invalid={Boolean(wordErrors[relation * 2])} aria-describedby={wordErrors[relation * 2] ? `tr-word-error-${relation * 2}` : undefined} placeholder="输入英文词" value={words[relation * 2]} maxLength={24} autoComplete="off" spellCheck={false} onChange={event => updateWord(relation * 2, event.currentTarget.value)}/>{wordErrors[relation * 2] && <span id={`tr-word-error-${relation * 2}`} role="alert">{wordErrors[relation * 2]}</span>}</label>
            <b aria-hidden="true">→</b>
            <label className="tr-relation-input__field"><input aria-label={`关系${relation === 0 ? 'A' : 'B'}终点词`} aria-invalid={Boolean(wordErrors[relation * 2 + 1])} aria-describedby={wordErrors[relation * 2 + 1] ? `tr-word-error-${relation * 2 + 1}` : undefined} placeholder="输入英文词" value={words[relation * 2 + 1]} maxLength={24} autoComplete="off" spellCheck={false} onChange={event => updateWord(relation * 2 + 1, event.currentTarget.value)}/>{wordErrors[relation * 2 + 1] && <span id={`tr-word-error-${relation * 2 + 1}`} role="alert">{wordErrors[relation * 2 + 1]}</span>}</label>
          </div>)}
        </div>
      </section>

      <section className="tr-embedding-relation__panel tr-embedding-relation__visual" aria-label="词向量三维投影">
        <div className="tr-embedding-relation__panel-head">
          <span>用 PCA 将高维词向量投影到三维空间</span><p className="tr-relation-model-note">使用预训练 GloVe Wiki-Gigaword 50维词向量演示；三维投影仅用于理解，并不意味着每个方向都能解释成人类可理解的语义。</p>
        </div>
        <div className="tr-embedding-relation__visual-body">
          <div className="tr-embedding-relation__plot-wrap">
            {projection ? <VectorPlot3D words={words} points={projection.points}/> : <div className="tr-embedding-relation__empty" role="status">
              <strong>{isLoading ? '正在读取向量…' : serviceUnavailable ? '本地词向量服务暂不可用' : wordErrors.some(Boolean) ? '请修改上方标出的单词' : '等待四个词向量'}</strong>{serviceUnavailable && !isLoading && <><small>请重新运行课程 CMD，或点击下面重试。</small><Button onClick={() => refreshAll(words)}>重新连接模型</Button></>}
            </div>}
            {projection && <aside className="tr-direction-note" aria-label="当前例子的方向说明" aria-live="polite">
              <div className="tr-direction-note__head"><span aria-hidden="true">{explanation.icon}</span><strong>{explanation.title}</strong></div>
              {explanation.pairs.length > 0 && <div className="tr-direction-note__pairs">{explanation.pairs.map(pair => <div key={pair}>{pair}</div>)}</div>}
              <p>相近方向可能承载<strong>{explanation.meaning}</strong>的信息。{explanation.caveat}</p>
            </aside>}
          </div>
          <div className="tr-relation-metric" aria-live="polite">
            <div className="tr-relation-metric__readout" title="用原始词向量的两条差向量计算，与三维视角无关"><span>原始空间的余弦相似度</span><strong>{cosine === null ? '—' : cosine.toFixed(3)}</strong></div>
            {cosine !== null && <>
              <div className="tr-relation-metric__scale" role="img" aria-label={`余弦相似度 ${cosine.toFixed(3)}，范围负一到正一`}>
                <span className="tr-relation-metric__zero"/><i style={{ left: `${similarityPosition}%` }}/>
              </div>
              <div className="tr-relation-metric__ends"><span>方向相反</span><span>垂直</span><span>方向相同</span></div>
            </>}
            {rows && cosine === null && <span className="tr-relation-metric__undefined">有一组变化为零，方向无法比较</span>}
            <Button className="tr-relation-next" variant="primary" disabled={!rows} onClick={onComplete}>继续：词义进入语境</Button>
          </div>
        </div>
      </section>
    </div>
  </LessonStage>;
}
