import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Typography } from '../../../../shared/react';

const PANEL = 4;
const BEND = Math.PI * 1.15;
const LENGTH = PANEL * 2 + BEND;
const BOTTOM = -2.3;
const ease = (t: number) => { const x = Math.max(0, Math.min(1, t)); return x * x * (3 - 2 * x); };
function paper(s: number, depth: number, angle: number) {
  if (s <= PANEL || angle < .0001) return new THREE.Vector3(s, 0, depth);
  const radius = BEND / angle;
  const theta = Math.min(s - PANEL, BEND) / radius;
  const tail = Math.max(0, s - PANEL - BEND);
  return new THREE.Vector3(PANEL + radius * Math.sin(theta) + tail * Math.cos(angle), -radius * (1 - Math.cos(theta)) - tail * Math.sin(angle), depth);
}

export function FoldingPaperScene({ mode, elapsed, resetVersion }: { mode: 'flat' | 'folded'; elapsed: number; resetVersion: number }) {
  const host = useRef<HTMLDivElement>(null);
  const labels = useRef<Array<HTMLElement | null>>([]);
  const current = useRef({ mode, elapsed, resetVersion });
  current.current = { mode, elapsed, resetVersion };
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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.setAttribute('aria-label', '可旋转、缩放的三维折纸虫洞；上下开口由中空通道连通');
    mount.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-7, 7, 3.25, -3.25, .1, 100);
    camera.position.set(7, 9, 13);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minZoom = .65;
    controls.maxZoom = 2.4;
    let autoFrame = true;
    const stopAutoFrame = () => { autoFrame = false; };
    controls.addEventListener('start', stopAutoFrame);
    scene.add(new THREE.HemisphereLight(0xe6f2ff, 0x8996a8, 2.6));
    const key = new THREE.DirectionalLight(0xfff8ec, 3.5);
    key.position.set(-3, 8, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0xc1ddff, 2.8);
    rim.position.set(5, 2, -5); scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, 1.2);
    fill.position.set(-4, -3, 3); scene.add(fill);
    const model = new THREE.Group(); scene.add(model);

    const rows = 128, cols = 48;
    const positions = new Float32Array((rows + 1) * (cols + 1) * 3);
    const uv = new Float32Array((rows + 1) * (cols + 1) * 2);
    const indices: number[] = [];
    for (let i = 0; i <= rows; i++) for (let j = 0; j <= cols; j++) {
      const n = i * (cols + 1) + j;
      uv[n * 2] = LENGTH * i / rows;
      uv[n * 2 + 1] = -1.85 + 3.7 * j / cols;
      if (i < rows && j < cols) indices.push(n, n + cols + 1, n + 1, n + 1, n + cols + 1, n + cols + 2);
    }
    const paperGeometry = new THREE.BufferGeometry();
    paperGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    paperGeometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    paperGeometry.setIndex(indices);
    const aperture = { value: 0 };
    const paperMaterial = new THREE.MeshPhysicalMaterial({ color: 0xe5eff8, roughness: .64, metalness: .02, clearcoat: .25, side: THREE.DoubleSide });
    paperMaterial.onBeforeCompile = shader => {
      shader.uniforms.aperture = aperture;
      shader.vertexShader = 'varying vec2 paperUV;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\npaperUV = uv;');
      shader.fragmentShader = 'varying vec2 paperUV; uniform float aperture;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        if (aperture > 0.0 && (length(paperUV-vec2(1.5,0.0)) < aperture || length(paperUV-vec2(${LENGTH - 1.5},0.0)) < aperture)) discard;
        vec2 gridUV = paperUV / 0.38;
        vec2 grid = abs(fract(gridUV-0.5)-0.5) / max(fwidth(gridUV), vec2(0.0001));
        float line = 1.0-min(min(grid.x,grid.y),1.0);
        diffuseColor.rgb = mix(diffuseColor.rgb,vec3(0.39,0.57,0.73),line*0.32);`);
    };
    const sheet = new THREE.Mesh(paperGeometry, paperMaterial);
    sheet.frustumCulled = false; model.add(sheet);

    // A continuous, open-ended surface, with no end discs or solid plugs.
    const tubePositions: number[] = [], tubeIndices: number[] = [];
    for (let i = 0; i <= 64; i++) for (let j = 0; j <= 96; j++) {
      const v = i / 64, phi = j / 96 * Math.PI * 2;
      const r = .43 + .65 * (2 * v - 1) ** 2;
      tubePositions.push(r * Math.cos(phi), BOTTOM * v, r * Math.sin(phi));
      if (i < 64 && j < 96) { const n = i * 97 + j; tubeIndices.push(n, n + 1, n + 97, n + 1, n + 98, n + 97); }
    }
    const tubeGeometry = new THREE.BufferGeometry();
    tubeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(tubePositions, 3));
    tubeGeometry.setIndex(tubeIndices); tubeGeometry.computeVertexNormals();
    const tubeMaterial = new THREE.MeshPhysicalMaterial({ color: 0x71acd1, roughness: .24, metalness: .12, clearcoat: 1, transparent: true, opacity: .48, depthWrite: false, side: THREE.DoubleSide });
    const tunnel = new THREE.Group(); tunnel.position.x = 1.5;
    tunnel.add(new THREE.Mesh(tubeGeometry, tubeMaterial)); model.add(tunnel);
    const rimMaterial = new THREE.MeshPhysicalMaterial({ color: 0x659bbc, roughness: .3, metalness: .24 });
    const rimGeometry = new THREE.TorusGeometry(1.08, .024, 12, 96);
    for (const y of [0, BOTTOM]) {
      const ring = new THREE.Mesh(rimGeometry, rimMaterial); ring.rotation.x = Math.PI / 2; ring.position.y = y; tunnel.add(ring);
    }
    const markerMaterial = new THREE.MeshPhysicalMaterial({ color: 0x336c96, roughness: .4, metalness: .1 });
    const markerGeometry = new THREE.SphereGeometry(.06, 20, 16);
    const marks = [new THREE.Mesh(markerGeometry, markerMaterial), new THREE.Mesh(markerGeometry, markerMaterial)];
    marks.forEach(mark => model.add(mark));
    const gold = new THREE.MeshPhysicalMaterial({ color: 0xefb03d, roughness: .28, metalness: .35, emissive: 0x945200, emissiveIntensity: .13 });
    const traveller = new THREE.Mesh(new THREE.SphereGeometry(.105, 32, 24), gold); model.add(traveller);
    const routeMaterial = new THREE.LineDashedMaterial({ color: 0xc99538, dashSize: .14, gapSize: .12, transparent: true, opacity: .85 });
    const routeGeometry = new THREE.BufferGeometry();
    const route = new THREE.Line(routeGeometry, routeMaterial); model.add(route);
    let lastFold = -1, lastOpen = -1, lastVersion = -1;
    let lastRouteShape = '';
    // The embedding diagram's allowed path lies on its surface, along a
    // meridian. Offset the ball's centre by its radius along the wall normal.
    const meridian = Math.atan2(13, 7);
    const wallPoint = (v: number, pop: number, offset: number) => {
      const radius = (.43 + .65 * (2 * v - 1) ** 2) * pop;
      const slope = 2.6 * (2 * v - 1) * pop;
      const normalLength = Math.hypot(-BOTTOM, slope);
      const r = radius + offset * (-BOTTOM) / normalLength;
      return new THREE.Vector3(1.5 + r * Math.cos(meridian), BOTTOM * v + offset * slope / normalLength, r * Math.sin(meridian));
    };
    let visible = false, frame = 0, previousTime = -100;
    const updatePaper = (angle: number) => {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let i = 0; i <= rows; i++) for (let j = 0; j <= cols; j++) {
        const p = paper(LENGTH * i / rows, -1.85 + 3.7 * j / cols, angle);
        const n = (i * (cols + 1) + j) * 3;
        positions[n] = p.x; positions[n + 1] = p.y; positions[n + 2] = p.z;
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      }
      paperGeometry.attributes.position.needsUpdate = true;
      paperGeometry.computeVertexNormals();
      model.position.set(-(minX + maxX) / 2, -(minY + maxY) / 2, 0);
    };
    const draw = (time: number) => {
      if (time - previousTime >= 30) {
        previousTime = time;
        const state = current.current;
        const fold = state.mode === 'flat' ? 0 : ease(state.elapsed / 1900);
        const open = state.mode === 'flat' ? 0 : Math.max(0, Math.min(1, (state.elapsed - 2200) / 550));
        const pop = open ? 1 + 2.7 * (open - 1) ** 3 + 1.7 * (open - 1) ** 2 : 0;
        if (state.resetVersion !== lastVersion) {
          camera.position.set(7, 9, 13); camera.zoom = 1; controls.target.set(0, 0, 0); autoFrame = true; lastVersion = state.resetVersion;
        }
        if (fold !== lastFold) { updatePaper(Math.PI * fold); lastFold = fold; }
        if (open !== lastOpen) { aperture.value = 1.08 * pop; tunnel.scale.set(pop, 1, pop); tunnel.visible = open > 0; lastOpen = open; }
        if (autoFrame) { camera.zoom = 1 + .3 * fold; camera.updateProjectionMatrix(); }
        const travel = Math.max(0, Math.min(1, (state.elapsed - (state.mode === 'flat' ? 300 : 2900)) / (state.mode === 'flat' ? 2400 : 1200)));
        traveller.visible = state.mode === 'flat' || state.elapsed >= 2900;
        traveller.position.copy(state.mode === 'flat' ? paper(1.5 + (LENGTH - 3) * travel, 0, 0).add(new THREE.Vector3(0, .12, 0)) : wallPoint(travel, pop, .11));
        marks[0].position.copy(paper(1.5, 0, Math.PI * fold).lerp(wallPoint(0, pop, .06), ease(open)));
        marks[1].position.copy(paper(LENGTH - 1.5, 0, Math.PI * fold).lerp(wallPoint(1, pop, .06), ease(open)));
        const routeShape = `${fold.toFixed(5)}:${pop.toFixed(5)}`;
        if (routeShape !== lastRouteShape) {
          const routePoints = open > 0 ? Array.from({ length: 101 }, (_, i) => wallPoint(i / 100, pop, .018)) : Array.from({ length: 101 }, (_, i) => paper(1.5 + (LENGTH - 3) * i / 100, 0, Math.PI * fold).add(new THREE.Vector3(0, .025, 0)));
          route.geometry.dispose(); route.geometry = new THREE.BufferGeometry().setFromPoints(routePoints); route.computeLineDistances(); lastRouteShape = routeShape;
        }
        controls.update();
        renderer.render(scene, camera);
        marks.forEach((mark, i) => {
          const label = labels.current[i]; if (!label) return;
          const point = mark.getWorldPosition(new THREE.Vector3()).project(camera);
          label.style.left = `${Math.max(4, Math.min(mount.clientWidth - 30, (point.x * .5 + .5) * mount.clientWidth + 10))}px`;
          label.style.top = `${Math.max(4, Math.min(mount.clientHeight - 34, (-point.y * .5 + .5) * mount.clientHeight - 25))}px`;
        });
      }
      if (visible && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.left = -3.25 * w / h; camera.right = 3.25 * w / h; camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize); ro.observe(mount); resize();
    const resume = () => { cancelAnimationFrame(frame); previousTime = -100; if (visible && !document.hidden) frame = requestAnimationFrame(draw); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); }); observer.observe(mount);
    document.addEventListener('visibilitychange', resume); draw(0);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', resume);
      controls.removeEventListener('start', stopAutoFrame); controls.dispose();
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
      scene.traverse(object => { const mesh = object as THREE.Mesh; if (mesh.geometry) geometries.add(mesh.geometry); if (mesh.material) for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(material); });
      geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  return <div ref={host} className="aipe-replay-cg-folding-scene">
    {failed ? <Typography variant="bodySmall" tone="muted">当前浏览器无法启动三维显示。</Typography> : <>
      <Typography ref={el => { labels.current[0] = el; }} as="span" variant="bodySmall" tone="accent" className="aipe-replay-cg-folding-label">A</Typography>
      <Typography ref={el => { labels.current[1] = el; }} as="span" variant="bodySmall" tone="accent" className="aipe-replay-cg-folding-label">B</Typography>
      <Typography as="span" variant="bodySmall" tone="muted" className="aipe-replay-cg-folding-gesture">拖动旋转 · 滚轮缩放</Typography>
    </>}
  </div>;
}
