import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { DilationRate } from './DilatedConvolutionPage';

export interface OutputCell { row: number; col: number; }
type Tile = THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
const INPUT_SIZE = 9;
const CELL = .49;

function Fallback({ rate, selected }: { rate: DilationRate; selected: OutputCell }) {
  const effectiveSize = 2 * rate + 1;
  const outputSize = INPUT_SIZE - effectiveSize + 1;
  const grids = [
    { size: outputSize, active: (row: number, col: number) => row === selected.row && col === selected.col },
    { size: INPUT_SIZE, active: (row: number, col: number) => row >= selected.row && row < selected.row + effectiveSize && col >= selected.col && col < selected.col + effectiveSize && (row - selected.row) % rate === 0 && (col - selected.col) % rate === 0 },
  ];
  return <div className="ck-dilate__fallback">{grids.map(({ size, active }, level) => <div key={level} className="ck-dilate__fallback-grid" style={{ gridTemplateColumns: `repeat(${size},minmax(0,1fr))` }}>{Array.from({ length: size * size }, (_, index) => <span key={index} className={active(Math.floor(index / size), index % size) ? 'is-active' : ''} />)}</div>)}</div>;
}

export function DilatedConvolutionScene({ rate, selected, onSelect }: { rate: DilationRate; selected: OutputCell; onSelect: (cell: OutputCell) => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const updateRef = useRef<((cell: OutputCell) => void) | null>(null);
  const onSelectRef = useRef(onSelect);
  const [fallback, setFallback] = useState(false);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { updateRef.current?.(selected); }, [selected]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' }); }
    catch { setFallback(true); return; }
    setFallback(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0xffffff, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-6, 6, 4.4, -4.4, .1, 100);
    camera.position.set(7, 8.5, 10.5);
    camera.zoom = 1.25;
    camera.lookAt(0, -.4, 0);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, -.4, 0);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minZoom = .75;
    controls.maxZoom = 2.4;
    controls.minPolarAngle = .2;
    controls.maxPolarAngle = Math.PI * .78;
    controls.update();
    scene.add(new THREE.AmbientLight(0xffffff, 2.2));
    const light = new THREE.DirectionalLight(0xd0e4ff, 3);
    light.position.set(-4, 10, 7);
    scene.add(light);

    const effectiveSize = 2 * rate + 1;
    const outputSize = INPUT_SIZE - effectiveSize + 1;
    const sizes = [INPUT_SIZE, outputSize];
    const heights = [-1.25, 1.25];
    const tileGeometry = new THREE.BoxGeometry(CELL - .025, .075, CELL - .025);
    const edgeGeometry = new THREE.EdgesGeometry(tileGeometry);
    const tiles: Tile[][] = [];
    const outputTiles: Tile[] = [];
    sizes.forEach((size, level) => {
      const group = new THREE.Group();
      group.position.y = heights[level];
      scene.add(group);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(size * CELL + .06, .045, size * CELL + .06), new THREE.MeshStandardMaterial({ color: 0xd9eaff, transparent: true, opacity: .34, depthWrite: false }));
      plate.position.y = -.075;
      group.add(plate);
      const levelTiles: Tile[] = [];
      for (let row = 0; row < size; row += 1) for (let col = 0; col < size; col += 1) {
        const tile = new THREE.Mesh(tileGeometry, new THREE.MeshStandardMaterial({ color: 0xf1f7ff, emissive: 0x2464be, emissiveIntensity: .025, roughness: .3 }));
        tile.position.set((col - (size - 1) / 2) * CELL, 0, (row - (size - 1) / 2) * CELL);
        if (level === 1) { tile.userData.cell = { row, col } satisfies OutputCell; outputTiles.push(tile); }
        tile.add(new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({ color: 0xa4c1e8, transparent: true, opacity: .8 })));
        group.add(tile);
        levelTiles.push(tile);
      }
      tiles.push(levelTiles);
    });

    let connections = new THREE.Group();
    scene.add(connections);
    const clearConnections = () => {
      scene.remove(connections);
      connections.traverse((object) => { if (object instanceof THREE.Line) { object.geometry.dispose(); object.material.dispose(); } });
      connections = new THREE.Group();
      scene.add(connections);
    };
    const connect = (from: THREE.Vector3, to: THREE.Vector3, opacity: number) => {
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([from, to]), new THREE.LineDashedMaterial({ color: 0x3d83ea, dashSize: .11, gapSize: .08, transparent: true, opacity, depthTest: true }));
      line.computeLineDistances();
      connections.add(line);
    };
    const point = (level: number, row: number, col: number) => new THREE.Vector3((col - (sizes[level] - 1) / 2) * CELL, heights[level], (row - (sizes[level] - 1) / 2) * CELL);
    const update = (cell: OutputCell) => {
      tiles[0].forEach((tile, index) => {
        const row = Math.floor(index / INPUT_SIZE), col = index % INPUT_SIZE;
        const inFootprint = row >= cell.row && row < cell.row + effectiveSize && col >= cell.col && col < cell.col + effectiveSize;
        const sampled = inFootprint && (row - cell.row) % rate === 0 && (col - cell.col) % rate === 0;
        tile.material.color.setHex(sampled ? 0x4289f2 : inFootprint ? 0xd6e8ff : 0xf2f7ff);
        tile.material.emissiveIntensity = sampled ? .42 : .025;
      });
      tiles[1].forEach((tile, index) => {
        const active = Math.floor(index / outputSize) === cell.row && index % outputSize === cell.col;
        tile.material.color.setHex(active ? 0x347cf0 : 0xf1f7ff);
        tile.material.emissiveIntensity = active ? .58 : .025;
      });
      clearConnections();
      for (const row of [0, effectiveSize - 1]) for (const col of [0, effectiveSize - 1]) {
        connect(point(0, cell.row + row, cell.col + col), point(1, cell.row, cell.col), .34);
      }
    };
    updateRef.current = update;
    update(selected);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down: { x: number; y: number } | null = null;
    let hovered: Tile | null = null;
    const movingTiles = new Set<Tile>();
    const setHovered = (tile: Tile | null) => {
      if (hovered === tile) return;
      if (hovered) movingTiles.add(hovered);
      hovered = tile;
      if (hovered) movingTiles.add(hovered);
      renderer.domElement.style.cursor = hovered ? 'pointer' : 'grab';
    };
    const pick = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(outputTiles, false)[0]?.object as Tile | undefined;
    };
    const onMove = (event: PointerEvent) => { if (!down) setHovered(pick(event) ?? null); };
    const onDown = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY }; renderer.domElement.style.cursor = 'grabbing'; };
    const onUp = (event: PointerEvent) => {
      const clicked = down && Math.hypot(event.clientX - down.x, event.clientY - down.y) <= 5;
      down = null;
      const tile = pick(event) ?? null;
      setHovered(tile);
      if (clicked && tile) onSelectRef.current(tile.userData.cell as OutputCell);
    };
    const onLeave = () => { down = null; setHovered(null); };
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('pointerleave', onLeave);
    const resize = () => {
      const width = Math.max(1, mount.clientWidth), height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      const halfHeight = 4.4;
      const halfWidth = halfHeight * width / height;
      camera.left = -halfWidth; camera.right = halfWidth; camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();
    let visible = false;
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    visibilityObserver.observe(mount);
    let frame = 0, lastRender = 0;
    const animate = (now: number) => {
      if (visible && now - lastRender >= 33) {
        controls.update();
        movingTiles.forEach((tile) => {
          const targetY = tile === hovered ? -.055 : 0;
          tile.position.y += (targetY - tile.position.y) * .28;
          if (Math.abs(tile.position.y - targetY) < .001) { tile.position.y = targetY; movingTiles.delete(tile); }
        });
        renderer.render(scene, camera);
        lastRender = now;
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      updateRef.current = null;
      cancelAnimationFrame(frame);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointerleave', onLeave);
      controls.dispose();
      clearConnections();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) { if (object.geometry !== tileGeometry) object.geometry.dispose(); object.material.dispose(); }
        if (object instanceof THREE.LineSegments) object.material.dispose();
      });
      edgeGeometry.dispose();
      tileGeometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [rate]);

  return <div ref={mountRef} className="ck-dilate__scene" role="img" aria-label={`空洞率 ${rate} 的双层模型：9 乘 9 输入上标出 9 个间隔采样点，${INPUT_SIZE - 2 * rate} 乘 ${INPUT_SIZE - 2 * rate} 输出；当前选择输出第 ${selected.row + 1} 行第 ${selected.col + 1} 列`}>
    {fallback && <Fallback rate={rate} selected={selected} />}
  </div>;
}
