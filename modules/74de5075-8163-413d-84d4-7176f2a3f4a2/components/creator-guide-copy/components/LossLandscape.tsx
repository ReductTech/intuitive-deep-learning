import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Button, Typography } from '../../../../shared/react';

export type LossPoint = { w: number; b: number };
export const lossAt = ({ w, b }: LossPoint) => .7 * w * w + .4 * w * b + 1.2 * b * b;
export const descend = ({ w, b }: LossPoint, rate: number): LossPoint => ({ w: w - rate * (1.4 * w + .4 * b), b: b - rate * (.4 * w + 2.4 * b) });
const initial = { w: 1.8, b: 1.5 };
const height = .22;
const position = (p: LossPoint, lift = 0) => new THREE.Vector3(p.w, lossAt(p) * height + lift, p.b);

export function LossLandscapeScene({ point, trail, interactive = true }: { point: LossPoint; trail: LossPoint[]; interactive?: boolean }) {
  const mount = useRef<HTMLDivElement>(null);
  const update = useRef<((p: LossPoint, trail: LossPoint[]) => void) | null>(null);
  const latest = useRef({ point, trail }); latest.current = { point, trail };
  const [labels, setLabels] = useState<{ text: string; x: number; y: number }[]>([]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = mount.current; if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true }); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-4.5, 4.5, 3, -3, .1, 100);
    camera.position.set(6, 16, 7); camera.lookAt(0, .8, 0);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, .8, 0); controls.enableZoom = false; controls.enablePan = false;
    controls.enabled = interactive; controls.minPolarAngle = .32; controls.maxPolarAngle = .65; controls.update();
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [], colors: number[] = [], indices: number[] = [];
    const divisions = 52;
    for (let row = 0; row <= divisions; row++) for (let col = 0; col <= divisions; col++) {
      const p = { w: -2.2 + col * 4.4 / divisions, b: -2.2 + row * 4.4 / divisions };
      const pos = position(p); vertices.push(pos.x, pos.y, pos.z);
      const color = new THREE.Color('#398cd7').lerp(new THREE.Color('#deedf8'), Math.min(1, lossAt(p) / 10));
      colors.push(color.r, color.g, color.b);
      if (row < divisions && col < divisions) { const a = row * (divisions + 1) + col; indices.push(a, a + 1, a + divisions + 1, a + 1, a + divisions + 2, a + divisions + 1); }
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geometry.setIndex(indices);
    const surface = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: .83 })); scene.add(surface);
    const grid: THREE.Vector3[] = [];
    for (let axis = 0; axis < 2; axis++) for (let i = 0; i <= 11; i++) for (let j = 0; j < 44; j++) {
      const fixed = -2.2 + i * .4, from = -2.2 + j * .1;
      for (const t of [from, from + .1]) grid.push(position(axis ? { w: t, b: fixed } : { w: fixed, b: t }, .008));
    }
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(grid), new THREE.LineBasicMaterial({ color: '#6797b9', transparent: true, opacity: .45 })));
    const origin = new THREE.Vector3(-2.5, 0, -2.5);
    const ends = [new THREE.Vector3(2.7, 0, -2.5), new THREE.Vector3(-2.5, 0, 2.7), new THREE.Vector3(-2.5, 2.8, -2.5)];
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ends.flatMap(end => [origin, end])), new THREE.LineBasicMaterial({ color: '#506b87' })));
    const dot = new THREE.Mesh(new THREE.SphereGeometry(.115, 20, 16), new THREE.MeshBasicMaterial({ color: '#f28b30', depthTest: false, transparent: true })); dot.renderOrder = 5; scene.add(dot);
    const route = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#e77821', depthTest: false, transparent: true })); route.renderOrder = 4; scene.add(route);
    const bottom = new THREE.Mesh(new THREE.TorusGeometry(.17, .025, 10, 36), new THREE.MeshBasicMaterial({ color: '#217f70', depthTest: false, transparent: true })); bottom.rotation.x = Math.PI / 2; bottom.position.set(0, .025, 0); bottom.renderOrder = 6; scene.add(bottom);
    const floor = new THREE.GridHelper(5, 10, '#9cb5ca', '#d1dde7'); floor.position.y = -.025; floor.material.transparent = true; floor.material.opacity = .4; scene.add(floor);
    const fitPoints = [origin, ...ends, ...[-2.5, 2.5].flatMap(w => [-2.5, 2.5].map(b => new THREE.Vector3(w, -.025, b))), ...Array.from({ length: vertices.length / 3 }, (_, i) => new THREE.Vector3(vertices[3 * i], vertices[3 * i + 1], vertices[3 * i + 2]))];
    function render() {
      const width = el!.clientWidth, h = el!.clientHeight; if (!width || !h) return;
      // Fit the entire surface and axes in camera space after every rotation.
      camera.updateMatrixWorld();
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const point of fitPoints) {
        const p = point.clone().applyMatrix4(camera.matrixWorldInverse);
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      }
      const aspect = width / h, span = Math.max(maxY - minY, (maxX - minX) / aspect) * 1.24;
      const x = (minX + maxX) / 2, y = (minY + maxY) / 2;
      camera.left = x - span * aspect / 2; camera.right = x + span * aspect / 2; camera.top = y + span / 2; camera.bottom = y - span / 2; camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      const projected = fitPoints.map(point => point.clone().project(camera));
      el!.dataset.fits = String(projected.every(p => Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1));
      el!.dataset.polar = controls.getPolarAngle().toFixed(3);
      const labels = ends.map((end, i) => { const p = end.clone().project(camera); return { text: ['w', 'b', 'Loss'][i], x: Math.max(20, Math.min(width - 26, (p.x + 1) * width / 2)), y: Math.max(12, Math.min(h - 20, (1 - p.y) * h / 2)) }; });
      const minimum = new THREE.Vector3(0, 0, 0).project(camera);
      labels.push({ text: '最低点 w=0，b=0', x: Math.max(115, Math.min(width - 115, (minimum.x + 1) * width / 2 - 155)), y: Math.min(h - 20, (1 - minimum.y) * h / 2 + 24) });
      setLabels(labels);
    }
    function resize() {
      const width = el!.clientWidth, h = el!.clientHeight; if (!width || !h) return;
      renderer.setSize(width, h); render();
    }
    let animation = 0;
    let shown = latest.current.point;
    update.current = (p, points) => {
      cancelAnimationFrame(animation);
      const from = shown;
      const start = performance.now();
      const animate = (now: number) => {
        const t = points.length < 2 ? 1 : Math.min(1, (now - start) / 280);
        shown = { w: from.w + (p.w - from.w) * t, b: from.b + (p.b - from.b) * t };
        dot.position.copy(position(shown, .1));
        const history = points.length < 2 ? [shown] : [...points.slice(0, -1), shown];
        const trace: THREE.Vector3[] = [];
        history.forEach((item, i) => {
          if (!i) { trace.push(position(item, .08)); return; }
          const previous = history[i - 1];
          for (let j = 1; j <= 12; j++) { const t = j / 12; trace.push(position({ w: previous.w + (item.w - previous.w) * t, b: previous.b + (item.b - previous.b) * t }, .08)); }
        });
        route.geometry.dispose(); route.geometry = new THREE.BufferGeometry().setFromPoints(trace);
        render();
        if (t < 1) animation = requestAnimationFrame(animate);
      };
      animate(start);
    };
    update.current(latest.current.point, latest.current.trail);
    controls.addEventListener('change', render);
    const observer = new ResizeObserver(resize); observer.observe(el); resize();
    return () => {
      cancelAnimationFrame(animation); update.current = null; observer.disconnect(); controls.dispose();
      scene.traverse(object => { if (object instanceof THREE.Mesh || object instanceof THREE.Line) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach(material => material.dispose()); } });
      renderer.dispose(); renderer.domElement.remove();
    };
  }, [interactive]);
  useEffect(() => { update.current?.(point, trail); }, [point, trail]);
  return <div className="aipe-replay-cg-loss-scene" role="img" aria-label={`三维损失地形，横轴w与b，纵轴Loss；当前位置w=${point.w.toFixed(2)}，b=${point.b.toFixed(2)}，损失${lossAt(point).toFixed(3)}`}>
    <div className="aipe-replay-cg-loss-mount" ref={mount}/>
    {labels.map(label => <Typography as="span" key={label.text} variant="bodySmall" tone="inherit" className={`aipe-replay-cg-loss-axis${label.text.startsWith('最低点') ? ' aipe-replay-cg-loss-minimum' : ''}`} style={{ left: label.x, top: label.y }}>{label.text}</Typography>)}
    {failed && <Typography variant="bodySmall" tone="muted">当前浏览器无法显示3D地形。</Typography>}
  </div>;
}

export function LossLandscape() {
  const root = useRef<HTMLDivElement>(null);
  const [path, setPath] = useState<LossPoint[]>([initial]);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(.25);
  const [visible, setVisible] = useState(false);
  const point = path[path.length - 1];
  useEffect(() => {
    const el = root.current; if (!el) return;
    let inView = false;
    const update = () => { setVisible(inView && !document.hidden); };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); });
    observer.observe(el); document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  useEffect(() => {
    if (!playing || !visible) return;
    if (lossAt(point) < .0001 || path.length >= 90) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setPath(previous => [...previous, descend(previous[previous.length - 1], rate)]), 450);
    return () => window.clearTimeout(timer);
  }, [playing, visible, path, point, rate]);
  function changeRate(value: number) { setRate(value); setPath([initial]); setPlaying(true); }
  return <div ref={root} className="aipe-replay-cg-loss-lab" data-loss={lossAt(point)} data-w={point.w} data-b={point.b} data-rate={rate} data-step={path.length - 1}>
    <LossLandscapeScene point={point} trail={path}/>
    <div className="aipe-replay-cg-loss-readout"><Typography variant="bodySmall" tone="accent">w {point.w.toFixed(2)}　 b {point.b.toFixed(2)}</Typography><Typography variant="bodySmall" tone="accent">Loss {lossAt(point).toFixed(3)}</Typography></div>
    <div className="aipe-replay-cg-loss-sliders"><label><Typography as="span" variant="bodySmall" tone="inherit">学习率 η</Typography><input aria-label="学习率" type="range" min="0.02" max="0.78" step=".01" value={rate} onChange={event => changeRate(Number(event.target.value))}/><Typography as="span" variant="bodySmall" tone="accent">{rate.toFixed(2)}</Typography></label></div>
    <div className="aipe-replay-cg-loss-actions"><Button active={playing} onClick={() => { if (lossAt(point) < .0001 || path.length >= 90) setPath([initial]); setPlaying(value => !value); }}>{playing ? '暂停' : '梯度下降'}</Button><Button onClick={() => { setPlaying(false); setPath([initial]); }}>重置</Button><Typography variant="bodySmall" tone={rate >= .4 ? 'warning' : 'muted'}>{rate < .12 ? '小步缓慢下降' : rate < .4 ? '平稳靠近最低点' : '大步来回震荡'}</Typography></div>
  </div>;
}
