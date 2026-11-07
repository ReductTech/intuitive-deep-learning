import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Typography } from '../../../shared/react';

// Closed, faceted geometry: the initial elevation and every rotated view are
// rendered from the same vertices, rather than switching between pictures.
function icebergGeometry() {
  const positions: number[] = [], colors: number[] = [];
  const triangle = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, color: THREE.Color) => {
    for (const p of [a, b, c]) { positions.push(p.x, p.y, p.z); colors.push(color.r, color.g, color.b); }
  };
  const rings = [
    { y: 1, radius: 1.65, depth: .73, x: -.05 },
    { y: .48, radius: 1.96, depth: .96, x: .07 },
    { y: -.18, radius: 1.64, depth: .87, x: .01 },
    { y: -.91, radius: 1.36, depth: .72, x: -.08 },
    { y: -1.7, radius: .88, depth: .49, x: -.17 },
    { y: -2.51, radius: .13, depth: .11, x: -.08 },
  ].map((ring, level) => Array.from({ length: 10 }, (_, i) => {
    const angle = i * Math.PI / 5;
    const uneven = 1 + .07 * Math.sin(i * 2.3 + level * 1.7);
    return new THREE.Vector3(ring.x + ring.radius * Math.cos(angle) * uneven,
      ring.y + (level === 0 ? 0 : .09 * Math.sin(i * 1.9 + level)), ring.depth * Math.sin(angle) * uneven);
  }));
  const blue = ['#a3d4ff', '#7db5ef', '#5996e4', '#3477cf', '#2058ae'];
  rings.slice(0, -1).forEach((ring, level) => ring.forEach((a, i) => {
    const j = (i + 1) % ring.length, next = rings[level + 1];
    const color = new THREE.Color(blue[level]).multiplyScalar(.92 + .13 * Math.sin(i * 2.8 + level));
    triangle(a, next[i], ring[j], color);
    triangle(ring[j], next[i], next[j], color.clone().multiplyScalar(.94));
  }));
  for (let i = 0; i < 10; i++) {
    const j = (i + 1) % 10;
    triangle(new THREE.Vector3(-.05, 1, 0), rings[0][j], rings[0][i], new THREE.Color('#b8dfff'));
    triangle(new THREE.Vector3(-.08, -2.68, 0), rings[5][i], rings[5][j], new THREE.Color('#1e51a1'));
  }
  // Two different above-water peaks share the base of the submerged volume.
  for (const peak of [{ x: -.65, z: .13, radius: .91, height: 1.39 }, { x: .65, z: -.14, radius: 1.12, height: 1.04 }]) {
    const ring = Array.from({ length: 7 }, (_, i) => {
      const a = i * Math.PI * 2 / 7;
      return new THREE.Vector3(peak.x + peak.radius * Math.cos(a), 1, peak.z + .62 * Math.sin(a));
    });
    ring.forEach((p, i) => {
      const next = ring[(i + 1) % 7];
      const color = new THREE.Color(['#ffcc76', '#f7b84f', '#ffda94', '#e99a25'][i % 4]);
      triangle(p, next, new THREE.Vector3(peak.x + .12, 1 + peak.height, peak.z), color);
      triangle(new THREE.Vector3(peak.x, 1, peak.z), next, p, color);
    });
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function KnowledgeIcebergScene() {
  const host = useRef<HTMLDivElement>(null);
  const lens = useRef<SVGGElement>(null);
  const popularLine = useRef<SVGPathElement>(null);
  const professionalLine = useRef<SVGPathElement>(null);
  const professionalDot = useRef<SVGCircleElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xffffff, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    mount.prepend(canvas);
    const scene = new THREE.Scene();
    const model = new THREE.Group(); scene.add(model);
    const geometry = icebergGeometry();
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85, flatShading: true, side: THREE.DoubleSide });
    model.add(new THREE.Mesh(geometry, material));
    scene.add(new THREE.AmbientLight(0xffffff, 2));
    const light = new THREE.DirectionalLight(0xffffff, 1.4); light.position.set(-3, 5, 8); scene.add(light);
    const camera = new THREE.OrthographicCamera(-6.5, 6.5, 2.9, -2.9, .1, 100);
    camera.position.set(0, 0, 15); camera.lookAt(0, 0, 0);
    const waterGeometry = new THREE.PlaneGeometry(9.6, 3);
    const waterMaterial = new THREE.MeshBasicMaterial({ color: '#8bc7ff', transparent: true, opacity: .11, side: THREE.DoubleSide, depthWrite: false });
    const water = new THREE.Mesh(waterGeometry, waterMaterial); water.rotation.x = -Math.PI / 2; water.position.y = 1; water.renderOrder = 2; model.add(water);
    const waterLineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-4.8, 1, 1.5), new THREE.Vector3(4.8, 1, 1.5)]);
    const waterLineMaterial = new THREE.LineBasicMaterial({ color: '#7cbfff' });
    model.add(new THREE.Line(waterLineGeometry, waterLineMaterial));
    const target = { x: 0, y: 0 };
    let frame = 0, disposed = false;
    const anchorTop = new THREE.Vector3(-.65, 1.99, .55);
    const anchorDeep = new THREE.Vector3(.72, -1.55, .37);
    function project(point: THREE.Vector3) {
      const p = point.clone().applyMatrix4(model.matrixWorld).project(camera);
      return { x: (p.x + 1) * 640, y: (1 - p.y) * 285 };
    }
    function draw() {
      frame = 0;
      if (disposed) return;
      model.rotation.x += (target.x - model.rotation.x) * .23;
      model.rotation.y += (target.y - model.rotation.y) * .23;
      model.updateMatrixWorld(true);
      renderer.render(scene, camera);
      const top = project(anchorTop), deep = project(anchorDeep);
      lens.current?.setAttribute('transform', `translate(${top.x} ${top.y})`);
      popularLine.current?.setAttribute('d', `M350 64 H395 L${top.x - 57} ${top.y}`);
      professionalLine.current?.setAttribute('d', `M1020 300 H980 L${deep.x} ${deep.y}`);
      professionalDot.current?.setAttribute('cx', String(deep.x));
      professionalDot.current?.setAttribute('cy', String(deep.y));
      mount!.dataset.rotation = `${model.rotation.x.toFixed(3)},${model.rotation.y.toFixed(3)}`;
      mount!.dataset.view = Math.abs(model.rotation.x) + Math.abs(model.rotation.y) > .05 ? 'spatial' : 'front';
      if (Math.abs(target.x - model.rotation.x) + Math.abs(target.y - model.rotation.y) > .0005) requestDraw();
    }
    function requestDraw() { if (!frame && !disposed) frame = requestAnimationFrame(draw); }
    function resize() {
      const width = mount!.clientWidth, height = mount!.clientHeight;
      camera.left = -2.9 * width / height; camera.right = 2.9 * width / height;
      camera.updateProjectionMatrix(); renderer.setSize(width, height); requestDraw();
    }
    const observer = new ResizeObserver(resize); observer.observe(mount); resize();
    const update = (x: number, y: number) => {
      target.x = Math.max(-.5, Math.min(.5, x)); target.y = Math.max(-1.3, Math.min(1.3, y));
      requestDraw();
    };
    let pointer: { id: number; x: number; y: number } | null = null;
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      pointer = { id: e.pointerId, x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId); mount.dataset.dragging = 'true';
    };
    const move = (e: PointerEvent) => {
      if (!pointer || pointer.id !== e.pointerId) return;
      const scale = mount.getBoundingClientRect().width / mount.clientWidth;
      const dx = (e.clientX - pointer.x) / scale, dy = (e.clientY - pointer.y) / scale;
      if (Math.abs(dx) + Math.abs(dy) > 1) update(target.x + dy * .006, target.y + dx * .008);
      pointer.x = e.clientX; pointer.y = e.clientY;
    };
    const end = () => { pointer = null; mount.dataset.dragging = 'false'; };
    const key = (e: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(e.key)) return;
      e.preventDefault(); e.stopPropagation();
      if (e.key === 'Home') update(0, 0);
      else update(target.x + (e.key === 'ArrowDown' ? .13 : e.key === 'ArrowUp' ? -.13 : 0), target.y + (e.key === 'ArrowRight' ? .2 : e.key === 'ArrowLeft' ? -.2 : 0));
    };
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end); canvas.addEventListener('lostpointercapture', end);
    mount.addEventListener('keydown', key);
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', end);
      canvas.removeEventListener('pointercancel', end); canvas.removeEventListener('lostpointercapture', end); mount.removeEventListener('keydown', key);
      geometry.dispose(); material.dispose(); waterGeometry.dispose(); waterMaterial.dispose(); waterLineGeometry.dispose(); waterLineMaterial.dispose();
      renderer.dispose(); canvas.remove();
    };
  }, []);

  return <>
    <div ref={host} className="llmpe-cg-education-scene" tabIndex={0} role="group"
      aria-label="知识冰山：拖动观察立体结构，也可使用方向键旋转，Home恢复正面">
      {failed && <Typography className="llmpe-cg-education-render-error" variant="body" tone="muted">暂时无法显示三维冰山，请刷新页面重试。</Typography>}
      <svg className="llmpe-cg-education-annotations" viewBox="0 0 1280 570" aria-hidden="true">
        <path ref={popularLine} fill="none" stroke="#eaa027" strokeWidth="2.5" />
        <g ref={lens}>
          <circle r="49" fill="#fff" fillOpacity=".08" stroke="#eaa027" strokeWidth="6" />
          <path d="M-38 36l-42 35" stroke="#eaa027" strokeWidth="15" strokeLinecap="round" />
        </g>
        <path ref={professionalLine} fill="none" stroke="#2862d9" strokeWidth="3" />
        <circle ref={professionalDot} r="6" fill="#2862d9" />
      </svg>
      <div className="llmpe-cg-education-scene-label llmpe-cg-education-scene-label--popular"><Typography as="h2" variant="h3" tone="inherit">科普式了解</Typography></div>
      <div className="llmpe-cg-education-scene-label llmpe-cg-education-scene-label--professional"><Typography as="h2" variant="h3" tone="inherit">专业式学习</Typography></div>
    </div>
  </>;
}
