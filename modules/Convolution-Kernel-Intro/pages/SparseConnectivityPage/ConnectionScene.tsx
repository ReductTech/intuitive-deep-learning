import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Typography } from '../../../shared/react';

export type ConnectionKind = 'dense' | 'local';
type Tile = THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
const SCAN_ORDER = [0, 1, 2, 5, 8, 7, 6, 3, 4];

function Fallback({ kind }: { kind: ConnectionKind }) {
  const input = Array.from({ length: 25 }, (_, index) => ({ x: 45 + (index % 5) * 36, y: 50 + Math.floor(index / 5) * 36, index }));
  const sources = kind === 'dense' ? input : input.filter(({ index }) => Math.floor(index / 5) >= 1 && Math.floor(index / 5) <= 3 && index % 5 >= 1 && index % 5 <= 3);
  return <svg className="ck-sparse__fallback" viewBox="0 0 620 280" role="img" aria-label={kind === 'dense' ? '全部二十五个输入连接一个输出' : '局部九个输入连接一个输出'}>
    {sources.map((point) => <line key={point.index} x1={point.x + 15} y1={point.y + 15} x2="499" y2="147" />)}
    {input.map((point) => <rect key={point.index} className={sources.includes(point) ? 'is-active' : ''} x={point.x} y={point.y} width="30" height="30" rx="4" />)}
    {Array.from({ length: 9 }, (_, index) => <rect key={index} className={index === 4 ? 'is-selected' : ''} x={448 + index % 3 * 36} y={96 + Math.floor(index / 3) * 36} width="30" height="30" rx="4" />)}
  </svg>;
}

export function ConnectionScene({ kind }: { kind: ConnectionKind }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' }); }
    catch { setFallback(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0xffffff, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-6.5, 6.5, 3.35, -3.35, .1, 100);
    camera.position.set(0, .1, 13);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 2.2));
    const light = new THREE.DirectionalLight(0xcde4ff, 3.4);
    light.position.set(-3, 5, 9);
    scene.add(light);
    const tileGeometry = new THREE.BoxGeometry(.66, .66, .19);
    const edgeGeometry = new THREE.EdgesGeometry(tileGeometry);
    const inputGroup = new THREE.Group();
    const outputGroup = new THREE.Group();
    inputGroup.position.x = -3.35;
    inputGroup.rotation.set(-.2, -.58, 0);
    outputGroup.position.x = 3.35;
    outputGroup.rotation.set(-.2, .58, 0);
    scene.add(inputGroup, outputGroup);

    const createGrid = (group: THREE.Group, size: number): Tile[] => {
      const back = new THREE.Mesh(new THREE.BoxGeometry(size * .76 + .13, size * .76 + .13, .07), new THREE.MeshStandardMaterial({ color: 0xe6efff, transparent: true, opacity: .55 }));
      back.position.z = -.16;
      group.add(back);
      const tiles: Tile[] = [];
      for (let row = 0; row < size; row += 1) for (let col = 0; col < size; col += 1) {
        const material = new THREE.MeshStandardMaterial({ color: 0xe8f1ff, emissive: 0x102d5f, emissiveIntensity: .08, metalness: .08, roughness: .29, transparent: true, opacity: .94 });
        const tile = new THREE.Mesh(tileGeometry, material);
        tile.position.set((col - (size - 1) / 2) * .76, ((size - 1) / 2 - row) * .76, .04);
        tile.add(new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({ color: 0x9cbdeb, transparent: true, opacity: .85 })));
        group.add(tile);
        tiles.push(tile);
      }
      return tiles;
    };
    const inputs = createGrid(inputGroup, 5);
    const outputs = createGrid(outputGroup, 3);
    inputGroup.updateMatrixWorld(true);
    outputGroup.updateMatrixWorld(true);
    const lineMaterial = new THREE.LineBasicMaterial({ color: kind === 'dense' ? 0x6f91d2 : 0x3479e9, transparent: true, opacity: kind === 'dense' ? .31 : .62, depthTest: false });
    const particleMaterial = new THREE.PointsMaterial({ color: 0x2767e2, size: kind === 'dense' ? .085 : .12, transparent: true, opacity: .9, depthTest: false });
    let lines: THREE.LineSegments | null = null;
    let particles: THREE.Points | null = null;
    let paths: { from: THREE.Vector3; to: THREE.Vector3 }[] = [];
    let particlePositions: Float32Array | null = null;

    const select = (index: number) => {
      mount.dataset.activeOutput = String(index);
      const row = Math.floor(index / 3);
      const col = index % 3;
      const sourceIndices = inputs.map((_, inputIndex) => inputIndex).filter((inputIndex) => kind === 'dense' || (
        Math.floor(inputIndex / 5) >= row && Math.floor(inputIndex / 5) < row + 3 && inputIndex % 5 >= col && inputIndex % 5 < col + 3));
      inputs.forEach((tile, inputIndex) => {
        const active = sourceIndices.includes(inputIndex);
        tile.material.color.setHex(active ? 0x6da9ff : 0xe8f1ff);
        tile.material.emissive.setHex(active ? 0x1f5cb4 : 0x102d5f);
        tile.material.emissiveIntensity = active ? .34 : .08;
      });
      outputs.forEach((tile, outputIndex) => {
        const active = outputIndex === index;
        tile.material.color.setHex(active ? 0x347cff : 0xe8edf8);
        tile.material.emissive.setHex(active ? 0x225ee7 : 0x102d5f);
        tile.material.emissiveIntensity = active ? .72 : .04;
      });
      if (lines) { scene.remove(lines); lines.geometry.dispose(); }
      if (particles) { scene.remove(particles); particles.geometry.dispose(); }
      const target = outputGroup.localToWorld(outputs[index].position.clone().add(new THREE.Vector3(0, 0, .15)));
      paths = sourceIndices.map((inputIndex) => ({ from: inputGroup.localToWorld(inputs[inputIndex].position.clone().add(new THREE.Vector3(0, 0, .15))), to: target.clone() }));
      const positions = new Float32Array(paths.length * 6);
      paths.forEach((path, pathIndex) => { positions.set(path.from.toArray(), pathIndex * 6); positions.set(path.to.toArray(), pathIndex * 6 + 3); });
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      lines = new THREE.LineSegments(lineGeometry, lineMaterial);
      lines.renderOrder = 1;
      scene.add(lines);
      particlePositions = new Float32Array(paths.length * 3);
      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      particles = new THREE.Points(particleGeometry, particleMaterial);
      particles.renderOrder = 2;
      scene.add(particles);
    };

    let step = 0;
    let nextStepAt = performance.now() + 1500;
    let frame = 0;
    let lastRender = 0;
    let visible = false;
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    visibilityObserver.observe(mount);
    select(SCAN_ORDER[step]);
    const animate = (now: number) => {
      if (!visible) { frame = requestAnimationFrame(animate); return; }
      if (now >= nextStepAt) { step = (step + 1) % SCAN_ORDER.length; select(SCAN_ORDER[step]); nextStepAt = now + 1500; }
      if (now - lastRender >= 33 && particles && particlePositions) {
        paths.forEach((path, index) => {
          const travel = (now * .00048 + index * .073) % 1;
          particlePositions!.set(path.from.clone().lerp(path.to, travel).toArray(), index * 3);
        });
        (particles.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      }
      if (now - lastRender >= 33) {
        outputs[SCAN_ORDER[step]].material.emissiveIntensity = .55 + .22 * Math.sin(now * .005);
        renderer.render(scene, camera);
        lastRender = now;
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      const halfWidth = 3.35 * width / height;
      camera.left = -halfWidth;
      camera.right = halfWidth;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibilityObserver.disconnect();
      if (lines) lines.geometry.dispose();
      if (particles) particles.geometry.dispose();
      lineMaterial.dispose();
      particleMaterial.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) { if (object.geometry !== tileGeometry) object.geometry.dispose(); object.material.dispose(); }
        if (object instanceof THREE.LineSegments && object !== lines) object.material.dispose();
      });
      edgeGeometry.dispose();
      tileGeometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [kind]);

  return <div className="ck-sparse__scene" ref={mountRef} role="img" aria-label={kind === 'dense' ? '立体网格持续扫描：每个输出与全部二十五个输入相连' : '立体网格持续扫描：每个输出只与对应的九个输入相连'}>
    <div className="ck-sparse__scene-labels"><Typography variant="bodySmall" tone="accent">输入 5 × 5</Typography><Typography variant="bodySmall" tone="accent">输出 3 × 3</Typography></div>
    {fallback && <Fallback kind={kind} />}
  </div>;
}
