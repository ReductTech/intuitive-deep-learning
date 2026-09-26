import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Typography } from '../../../shared/react';

export type SharingKind = 'independent' | 'shared';
type Tile = THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
const SCAN_ORDER = [0, 1, 2, 5, 8, 7, 6, 3, 4];
const KERNEL_COLORS = [0x3d7de0, 0x8169dd, 0x18a0a1, 0xe49b46, 0x3868c8, 0xba6aaf, 0x41a477, 0x9b78db, 0x417fdb];

function Fallback({ kind, active }: { kind: SharingKind; active: number }) {
  const row = Math.floor(active / 3);
  const col = active % 3;
  return <div className="ck-share__fallback">
    <div className="ck-share__fallback-grid is-input">{Array.from({ length: 25 }, (_, index) => <span key={index} className={Math.floor(index / 5) >= row && Math.floor(index / 5) < row + 3 && index % 5 >= col && index % 5 < col + 3 ? 'is-active' : ''} />)}</div>
    <Typography as="span" variant="h3" tone="accent" className="ck-share__fallback-arrow">→</Typography>
    <div className="ck-share__fallback-grid is-kernel">{Array.from({ length: 9 }, (_, index) => <span key={index} className={kind === 'independent' ? `is-version-${active % 3}` : ''} />)}</div>
    <Typography as="span" variant="h3" tone="accent" className="ck-share__fallback-arrow">→</Typography>
    <div className="ck-share__fallback-grid is-output">{Array.from({ length: 9 }, (_, index) => <span key={index} className={index === active ? 'is-active' : ''} />)}</div>
  </div>;
}

export function WeightSharingScene({ kind }: { kind: SharingKind }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!fallback) return;
    let step = 0;
    const timer = window.setInterval(() => { step = (step + 1) % SCAN_ORDER.length; setActive(SCAN_ORDER[step]); }, 1500);
    return () => window.clearInterval(timer);
  }, [fallback]);

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
    const camera = new THREE.OrthographicCamera(-6.4, 6.4, 3.15, -3.15, .1, 100);
    camera.position.set(0, .15, 13);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 2.1));
    const light = new THREE.DirectionalLight(0xd4e6ff, 3.2);
    light.position.set(-3, 5, 8);
    scene.add(light);
    const tileGeometry = new THREE.BoxGeometry(.52, .52, .18);
    const edgeGeometry = new THREE.EdgesGeometry(tileGeometry);

    const makeGrid = (size: number, x: number, tilt: number): { group: THREE.Group; tiles: Tile[] } => {
      const group = new THREE.Group();
      group.position.x = x;
      group.rotation.set(-.16, tilt, 0);
      scene.add(group);
      const back = new THREE.Mesh(new THREE.BoxGeometry(size * .59 + .12, size * .59 + .12, .06), new THREE.MeshStandardMaterial({ color: 0xe7effc, transparent: true, opacity: .6 }));
      back.position.z = -.16;
      group.add(back);
      const tiles: Tile[] = [];
      for (let row = 0; row < size; row += 1) for (let col = 0; col < size; col += 1) {
        const material = new THREE.MeshStandardMaterial({ color: 0xeaf2ff, emissive: 0x173c72, emissiveIntensity: .08, roughness: .3, metalness: .08, transparent: true, opacity: .96 });
        const tile = new THREE.Mesh(tileGeometry, material);
        tile.position.set((col - (size - 1) / 2) * .59, ((size - 1) / 2 - row) * .59, .04);
        tile.add(new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({ color: 0xadc8ec, transparent: true, opacity: .9 })));
        group.add(tile);
        tiles.push(tile);
      }
      group.updateMatrixWorld(true);
      return { group, tiles };
    };
    const input = makeGrid(5, -3.7, -.45);
    // 独立权重对应九个真实的核对象；共享权重始终只有一个核对象。
    const kernelVersions = Array.from({ length: kind === 'shared' ? 1 : 9 }, (_, version) => {
      const grid = makeGrid(3, 0, .22);
      const base = new THREE.Color(kind === 'shared' ? 0x3d7de0 : KERNEL_COLORS[version]);
      grid.tiles.forEach((tile, cell) => {
        const variation = kind === 'shared' ? (cell % 3) * .08 : ((version * 5 + cell * 3 + version * cell) % 9) * .055;
        tile.material.color.copy(base.clone().lerp(new THREE.Color(0xe5f0ff), variation));
        tile.material.emissive.copy(base);
        tile.material.emissiveIntensity = .32;
      });
      grid.group.visible = version === 0;
      return grid;
    });
    let activeKernel = kernelVersions[0];
    const output = makeGrid(3, 3.6, .45);
    const lineMaterial = new THREE.LineBasicMaterial({ color: kind === 'shared' ? 0x2e73d8 : 0x7386cd, transparent: true, opacity: .45, depthTest: false });
    const particleMaterial = new THREE.PointsMaterial({ color: kind === 'shared' ? 0x236dec : 0x7a64e5, size: .11, transparent: true, opacity: .9, depthTest: false });
    let lines: THREE.LineSegments | null = null;
    let particles: THREE.Points | null = null;
    let paths: { from: THREE.Vector3; middle: THREE.Vector3; to: THREE.Vector3 }[] = [];
    let particlePositions: Float32Array | null = null;

    const select = (index: number) => {
      mount.dataset.activeOutput = String(index);
      setActive(index);
      kernelVersions.forEach((version, versionIndex) => { version.group.visible = kind === 'shared' || versionIndex === index; });
      activeKernel = kernelVersions[kind === 'shared' ? 0 : index];
      const row = Math.floor(index / 3);
      const col = index % 3;
      const sourceIndices = input.tiles.map((_, inputIndex) => inputIndex).filter((inputIndex) =>
        Math.floor(inputIndex / 5) >= row && Math.floor(inputIndex / 5) < row + 3 && inputIndex % 5 >= col && inputIndex % 5 < col + 3);
      input.tiles.forEach((tile, inputIndex) => {
        const selected = sourceIndices.includes(inputIndex);
        tile.material.color.setHex(selected ? 0x72aafa : 0xeaf2ff);
        tile.material.emissive.setHex(selected ? 0x1c5aaa : 0x173c72);
        tile.material.emissiveIntensity = selected ? .3 : .08;
      });
      output.tiles.forEach((tile, outputIndex) => {
        const selected = outputIndex === index;
        tile.material.color.setHex(selected ? 0x397ef2 : 0xeaf0fa);
        tile.material.emissive.setHex(selected ? 0x2364de : 0x173c72);
        tile.material.emissiveIntensity = selected ? .65 : .06;
      });
      if (lines) { scene.remove(lines); lines.geometry.dispose(); }
      if (particles) { scene.remove(particles); particles.geometry.dispose(); }
      const target = output.group.localToWorld(output.tiles[index].position.clone().add(new THREE.Vector3(0, 0, .15)));
      paths = sourceIndices.map((inputIndex, pathIndex) => ({
        from: input.group.localToWorld(input.tiles[inputIndex].position.clone().add(new THREE.Vector3(0, 0, .15))),
        middle: activeKernel.group.localToWorld(activeKernel.tiles[pathIndex].position.clone().add(new THREE.Vector3(0, 0, .15))),
        to: target.clone(),
      }));
      const positions = new Float32Array(paths.length * 12);
      paths.forEach((path, pathIndex) => {
        positions.set(path.from.toArray(), pathIndex * 12);
        positions.set(path.middle.toArray(), pathIndex * 12 + 3);
        positions.set(path.middle.toArray(), pathIndex * 12 + 6);
        positions.set(path.to.toArray(), pathIndex * 12 + 9);
      });
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

    let scanStep = 0;
    let nextStepAt = performance.now() + 1500;
    let lastRender = 0;
    let frame = 0;
    let visible = false;
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    visibilityObserver.observe(mount);
    select(SCAN_ORDER[scanStep]);
    const animate = (now: number) => {
      if (!visible) { frame = requestAnimationFrame(animate); return; }
      if (now >= nextStepAt) { scanStep = (scanStep + 1) % SCAN_ORDER.length; select(SCAN_ORDER[scanStep]); nextStepAt = now + 1500; }
      if (now - lastRender >= 33) {
        if (particles && particlePositions) {
          paths.forEach((path, index) => {
            const t = (now * .00045 + index * .09) % 1;
            const point = t < .5 ? path.from.clone().lerp(path.middle, t * 2) : path.middle.clone().lerp(path.to, (t - .5) * 2);
            particlePositions!.set(point.toArray(), index * 3);
          });
          (particles.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
        }
        output.tiles[SCAN_ORDER[scanStep]].material.emissiveIntensity = .5 + .2 * Math.sin(now * .005);
        activeKernel.group.scale.setScalar(1 + .02 * Math.sin(now * .004));
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
      const halfWidth = 3.15 * width / height;
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

  return <div className="ck-share__scene" ref={mountRef} role="img" aria-label={kind === 'shared' ? '同一个三乘三卷积核不断移动并用于所有输出位置' : '每个输出位置使用另一套三乘三局部权重'}>
    <div className="ck-share__scene-labels"><Typography variant="bodySmall" tone="accent">输入 5 × 5</Typography><Typography variant="bodySmall" tone="accent">{kind === 'shared' ? '同一套 K' : `第 ${active + 1} 套 K`}</Typography><Typography variant="bodySmall" tone="accent">输出 3 × 3</Typography></div>
    {fallback && <Fallback kind={kind} active={active} />}
  </div>;
}
