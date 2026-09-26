import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface RgbPosition { row: number; col: number; }
export type KernelCount = 1 | 2 | 4;
const SIZE = 7;
const CELL = .32;
const KERNEL_SIZE = 3;
const KERNEL_FACE = KERNEL_SIZE * CELL;
const OUTPUT_SIZE = SIZE - KERNEL_SIZE + 1;
const SCAN_MS = 350;
const CHANNEL_DEPTH = .32;
const INPUT_DEPTH = 3 * CHANNEL_DEPTH;
const KERNEL_DEPTH = INPUT_DEPTH;
const CHANNEL_COLORS = [0xef7180, 0x65be91, 0x5c95ee];
const FILTER_WEIGHTS = [[.3, .5, .2], [.6, .2, .2], [.2, .6, .2], [.2, .2, .6]];

export function rgbValue(channel: number, row: number, col: number) {
  const horizontal = (col + 1) / 8;
  const vertical = (row + 1) / 8;
  const center = Math.max(0, 1 - Math.abs(row - 3) / 4 - Math.abs(col - 3) / 5);
  return Math.max(.08, Math.min(.95, channel === 0 ? .25 + .55 * horizontal : channel === 1 ? .18 + .55 * center : .2 + .58 * vertical));
}

export function rgbPatchMean(channel: number, row: number, col: number) {
  let sum = 0;
  for (let dy = 0; dy < KERNEL_SIZE; dy += 1) for (let dx = 0; dx < KERNEL_SIZE; dx += 1) {
    sum += rgbValue(channel, row + dy, col + dx);
  }
  return sum / (KERNEL_SIZE * KERNEL_SIZE);
}

export function rgbResponse(row: number, col: number, filterIndex = 0) {
  return FILTER_WEIGHTS[filterIndex].reduce((sum, weight, channel) => sum + weight * rgbPatchMean(channel, row, col), 0);
}

function Fallback({ selected, onSelect, kernelCount }: { selected: RgbPosition; onSelect: (value: RgbPosition) => void; kernelCount: KernelCount }) {
  return <div className="ck-rgb__fallback">
    <div className="ck-rgb__fallback-input">{['R', 'G', 'B'].map((channel) => <div key={channel} className={`ck-rgb__fallback-plane is-${channel.toLowerCase()}`}>{Array.from({ length: SIZE * SIZE }, (_, index) => { const row = Math.floor(index / SIZE), col = index % SIZE; return <button key={index} type="button" className={row >= selected.row && row < selected.row + KERNEL_SIZE && col >= selected.col && col < selected.col + KERNEL_SIZE ? 'is-selected' : ''} onClick={() => onSelect({ row: Math.max(0, Math.min(OUTPUT_SIZE - 1, row - 1)), col: Math.max(0, Math.min(OUTPUT_SIZE - 1, col - 1)) })} aria-label={`${channel}通道第${row + 1}行第${col + 1}列`} />; })}</div>)}</div>
    <span aria-hidden="true">→</span>
    <div className="ck-rgb__fallback-output-stack">{Array.from({ length: kernelCount }, (_, filterIndex) => <div key={filterIndex} className="ck-rgb__fallback-output" style={{ transform: `translateX(${(filterIndex - (kernelCount - 1) / 2) * 14}px)` }}>{Array.from({ length: OUTPUT_SIZE * OUTPUT_SIZE }, (_, index) => <button key={index} type="button" className={Math.floor(index / OUTPUT_SIZE) === selected.row && index % OUTPUT_SIZE === selected.col ? 'is-selected' : ''} onClick={() => onSelect({ row: Math.floor(index / OUTPUT_SIZE), col: index % OUTPUT_SIZE })} aria-label={`第${filterIndex + 1}张输出特征图第${Math.floor(index / OUTPUT_SIZE) + 1}行第${index % OUTPUT_SIZE + 1}列`} />)}</div>)}</div>
  </div>;
}

export function RgbConvolutionScene({ selected, onSelect, kernelCount = 1 }: { selected: RgbPosition; onSelect: (value: RgbPosition) => void; kernelCount?: KernelCount }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<((value: RgbPosition) => void) | null>(null);
  const onSelectRef = useRef(onSelect);
  const [fallback, setFallback] = useState(false);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { controllerRef.current?.(selected); }, [selected]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const outputDepth = kernelCount * CHANNEL_DEPTH;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch { setFallback(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0xffffff, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-7, 7, 3.2, -3.2, .1, 100);
    camera.position.set(4.1, 1.25, 12);
    camera.lookAt(0, 0, 0);
    camera.zoom = 1.2;
    camera.updateProjectionMatrix();
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = .08;
    controls.enablePan = false;
    controls.minZoom = .7;
    controls.maxZoom = 2.2;
    controls.minPolarAngle = .35;
    controls.maxPolarAngle = Math.PI * .75;
    controls.update();
    scene.add(new THREE.AmbientLight(0xffffff, 2.1));
    const light = new THREE.DirectionalLight(0xe5efff, 2.8);
    light.position.set(-3, 5, 9);
    scene.add(light);

    const tileGeometry = new THREE.BoxGeometry(CHANNEL_DEPTH - .012, CELL - .014, CELL - .014);
    const edgeGeometry = new THREE.EdgesGeometry(tileGeometry);
    type Tile = THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
    const inputGroups: THREE.Group[] = [];
    const inputTiles: Tile[][] = [];
    const pickable: Tile[] = [];
    for (let channel = 0; channel < 3; channel += 1) {
      const group = new THREE.Group();
      group.position.set(-3.45 + (channel - 1) * CHANNEL_DEPTH, 0, 0);
      scene.add(group);
      inputGroups.push(group);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(CHANNEL_DEPTH, SIZE * CELL + .04, SIZE * CELL + .04), new THREE.MeshStandardMaterial({ color: CHANNEL_COLORS[channel], transparent: true, opacity: .22, depthWrite: false, roughness: .34 }));
      group.add(plate);
      const channelTiles: Tile[] = [];
      for (let row = 0; row < SIZE; row += 1) for (let col = 0; col < SIZE; col += 1) {
        const value = rgbValue(channel, row, col);
        const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(0xffffff).lerp(new THREE.Color(CHANNEL_COLORS[channel]), .25 + value * .58), transparent: true, opacity: .83, roughness: .28, metalness: .06, emissive: CHANNEL_COLORS[channel], emissiveIntensity: .02 });
        const tile = new THREE.Mesh(tileGeometry, material);
        tile.position.set(0, (3 - row) * CELL, (3 - col) * CELL);
        tile.userData.cell = { row: Math.max(0, Math.min(OUTPUT_SIZE - 1, row - 1)), col: Math.max(0, Math.min(OUTPUT_SIZE - 1, col - 1)) } satisfies RgbPosition;
        tile.add(new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({ color: CHANNEL_COLORS[channel], transparent: true, opacity: .32 })));
        group.add(tile);
        channelTiles.push(tile);
        pickable.push(tile);
      }
      inputTiles.push(channelTiles);
    }

    const outputGroup = new THREE.Group();
    outputGroup.position.set(3.45, 0, 0);
    scene.add(outputGroup);
    const outputPlate = new THREE.Mesh(new THREE.BoxGeometry(outputDepth, OUTPUT_SIZE * CELL + .04, OUTPUT_SIZE * CELL + .04), new THREE.MeshStandardMaterial({ color: 0xc9ddfa, transparent: true, opacity: .28, depthWrite: false }));
    outputGroup.add(outputPlate);
    const outputTiles: Tile[][] = [];
    for (let filterIndex = 0; filterIndex < kernelCount; filterIndex += 1) {
      const mapTiles: Tile[] = [];
      for (let row = 0; row < OUTPUT_SIZE; row += 1) for (let col = 0; col < OUTPUT_SIZE; col += 1) {
        const value = rgbResponse(row, col, filterIndex);
        const tile = new THREE.Mesh(tileGeometry, new THREE.MeshStandardMaterial({ color: new THREE.Color(0xeaf2ff).lerp(new THREE.Color(0x619aed), value), emissive: 0x174f9e, emissiveIntensity: .03, roughness: .32 }));
        tile.position.set((filterIndex - (kernelCount - 1) / 2) * CHANNEL_DEPTH, (2 - row) * CELL, (2 - col) * CELL);
        tile.userData.cell = { row, col } satisfies RgbPosition;
        tile.userData.filterIndex = filterIndex;
        tile.add(new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({ color: 0xa0bde4, transparent: true, opacity: .72 })));
        outputGroup.add(tile);
        mapTiles.push(tile);
        pickable.push(tile);
      }
      outputTiles.push(mapTiles);
    }

    const kernelGroup = new THREE.Group();
    kernelGroup.position.set(0, 0, 0);
    scene.add(kernelGroup);
    const kernelSegmentWidth = CHANNEL_DEPTH;
    const kernelGeometry = new THREE.BoxGeometry(kernelSegmentWidth, KERNEL_FACE, KERNEL_FACE);
    const gridPoints: THREE.Vector3[] = [];
    const halfFace = KERNEL_FACE / 2;
    const halfDepth = KERNEL_DEPTH / 2;
    const engravingOffset = .008;
    for (let division = 1; division < KERNEL_SIZE; division += 1) {
      const spatialLine = -halfFace + division * CELL;
      const depthLine = -halfDepth + division * CHANNEL_DEPTH;
      for (const side of [-1, 1]) {
        const xFace = side * (halfDepth + engravingOffset);
        const yFace = side * (halfFace + engravingOffset);
        const zFace = side * (halfFace + engravingOffset);
        gridPoints.push(new THREE.Vector3(xFace, spatialLine, -halfFace), new THREE.Vector3(xFace, spatialLine, halfFace));
        gridPoints.push(new THREE.Vector3(xFace, -halfFace, spatialLine), new THREE.Vector3(xFace, halfFace, spatialLine));
        gridPoints.push(new THREE.Vector3(depthLine, yFace, -halfFace), new THREE.Vector3(depthLine, yFace, halfFace));
        gridPoints.push(new THREE.Vector3(-halfDepth, yFace, spatialLine), new THREE.Vector3(halfDepth, yFace, spatialLine));
        gridPoints.push(new THREE.Vector3(depthLine, -halfFace, zFace), new THREE.Vector3(depthLine, halfFace, zFace));
        gridPoints.push(new THREE.Vector3(-halfDepth, spatialLine, zFace), new THREE.Vector3(halfDepth, spatialLine, zFace));
      }
    }
    const kernelGroups: THREE.Group[] = [];
    const kernelBoxes: Array<THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>[]> = [];
    for (let filterIndex = 0; filterIndex < kernelCount; filterIndex += 1) {
      const rod = new THREE.Group();
      const spread = kernelCount === 1 ? 0 : kernelCount === 2 ? .62 : .59;
      rod.position.y = kernelCount === 4 ? (filterIndex < 2 ? spread : -spread) : (filterIndex === 0 ? spread : -spread);
      rod.position.z = kernelCount === 4 ? (filterIndex % 2 === 0 ? -spread : spread) : 0;
      kernelGroup.add(rod);
      kernelGroups.push(rod);
      const boxes = CHANNEL_COLORS.map((color, channel) => {
        const box = new THREE.Mesh(kernelGeometry, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .08, roughness: .28, metalness: .08 }));
        box.position.x = (channel - 1) * kernelSegmentWidth;
        rod.add(box);
        return box;
      });
      kernelBoxes.push(boxes);
      rod.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(KERNEL_DEPTH, KERNEL_FACE, KERNEL_FACE)), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .82 })));
      rod.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gridPoints), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .74, depthTest: true, depthWrite: false })));
    }
    const scanWindow = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(INPUT_DEPTH + .04, KERNEL_FACE + .045, KERNEL_FACE + .045)),
      new THREE.LineBasicMaterial({ color: 0x346fe0, transparent: true, opacity: .9, depthTest: true, depthWrite: false }),
    );
    scanWindow.position.x = -3.45;
    scene.add(scanWindow);
    const flowParticles = Array.from({ length: 8 }, (_, index) => index < 4 ? 0x7299ea : 0x377ee4).map((color) => {
      const particle = new THREE.Mesh(new THREE.SphereGeometry(.055, 12, 8), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .95, roughness: .2 }));
      particle.visible = false;
      scene.add(particle);
      return particle;
    });
    const flowPaths: Array<[THREE.Vector3, THREE.Vector3]> = [];
    scene.updateMatrixWorld(true);
    let connections = new THREE.Group();
    scene.add(connections);
    const clearConnections = () => {
      scene.remove(connections);
      connections.traverse((object) => { if (object instanceof THREE.Line) { object.geometry.dispose(); object.material.dispose(); } });
      connections = new THREE.Group();
      scene.add(connections);
    };
    const addLine = (from: THREE.Vector3, to: THREE.Vector3, color: number) => {
      // 连接线先于实体绘制；实体随后覆盖与它重叠的线段。
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([from, to]), new THREE.LineBasicMaterial({ color, transparent: false, depthTest: true, depthWrite: false }));
      line.renderOrder = -1;
      connections.add(line);
    };
    let selectedOutput: Tile | null = null;
    let activeFilter = 0;
    const update = (position: RgbPosition) => {
      const index = position.row * OUTPUT_SIZE + position.col;
      inputGroups.forEach((group, channel) => {
        inputTiles[channel].forEach((tile, tileIndex) => {
          const tileRow = Math.floor(tileIndex / SIZE), tileCol = tileIndex % SIZE;
          const active = tileRow >= position.row && tileRow < position.row + KERNEL_SIZE && tileCol >= position.col && tileCol < position.col + KERNEL_SIZE;
          tile.material.emissiveIntensity = active ? .65 : .02;
          tile.material.opacity = active ? 1 : .83;
          tile.scale.setScalar(active ? 1.13 : 1);
        });
        group.updateMatrixWorld(true);
      });
      outputTiles.forEach((mapTiles, filterIndex) => mapTiles.forEach((tile, tileIndex) => {
        const active = filterIndex === activeFilter && tileIndex === index;
        tile.material.emissiveIntensity = active ? .8 : .03;
        tile.material.color.setHex(active ? 0x3b85f3 : new THREE.Color(0xeaf2ff).lerp(new THREE.Color(0x619aed), rgbResponse(Math.floor(tileIndex / OUTPUT_SIZE), tileIndex % OUTPUT_SIZE, filterIndex)).getHex());
        tile.scale.setScalar(active ? 1.12 : 1);
      }));
      selectedOutput = outputTiles[activeFilter][index];
      scene.updateMatrixWorld(true);
      clearConnections();
      flowPaths.length = 0;
      scanWindow.position.set(-3.45, (2 - position.row) * CELL, (2 - position.col) * CELL);
      const centerY = (2 - position.row) * CELL, centerZ = (2 - position.col) * CELL;
      const rod = kernelGroups[activeFilter];
      for (const ySign of [-1, 1]) for (const zSign of [-1, 1]) {
        const source = new THREE.Vector3(-3.45 + INPUT_DEPTH / 2, centerY + ySign * halfFace, centerZ + zSign * halfFace);
        const kernel = new THREE.Vector3(-KERNEL_DEPTH / 2, rod.position.y + ySign * halfFace, rod.position.z + zSign * halfFace);
        addLine(source, kernel, 0x9bb7ed);
        flowPaths.push([source, kernel]);
      }
      for (const ySign of [-1, 1]) for (const zSign of [-1, 1]) {
        const kernel = new THREE.Vector3(KERNEL_DEPTH / 2, rod.position.y + ySign * halfFace, rod.position.z + zSign * halfFace);
        const output = new THREE.Vector3(3.45 + (activeFilter - (kernelCount - 1) / 2) * CHANNEL_DEPTH - CHANNEL_DEPTH / 2, centerY + ySign * CELL / 2, centerZ + zSign * CELL / 2);
        addLine(kernel, output, 0x7da4e6);
        flowPaths.push([kernel, output]);
      }
    };
    controllerRef.current = update;
    update(selected);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerStart: { x: number; y: number } | null = null;
    let scanIndex = selected.row * OUTPUT_SIZE + selected.col;
    let pauseUntil = 0;
    let nextScanAt = performance.now() + SCAN_MS;
    const pick = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(pickable, false)[0]?.object as Tile | undefined;
    };
    const onPointerMove = (event: PointerEvent) => { if (!pointerStart) renderer.domElement.style.cursor = pick(event) ? 'pointer' : 'grab'; };
    const onPointerDown = (event: PointerEvent) => { pointerStart = { x: event.clientX, y: event.clientY }; renderer.domElement.style.cursor = 'grabbing'; };
    const onPointerUp = (event: PointerEvent) => {
      const clicked = pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) < 5;
      pointerStart = null;
      const hit = pick(event);
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
      if (clicked && hit) {
        const position = hit.userData.cell as RgbPosition;
        if (typeof hit.userData.filterIndex === 'number') activeFilter = hit.userData.filterIndex;
        scanIndex = position.row * OUTPUT_SIZE + position.col;
        pauseUntil = performance.now() + 3500;
        nextScanAt = pauseUntil + SCAN_MS;
        onSelectRef.current(position);
      }
    };
    const onPointerLeave = () => { pointerStart = null; renderer.domElement.style.cursor = 'grab'; };
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);
    const resize = () => {
      const width = Math.max(1, mount.clientWidth), height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      const halfHeight = 3;
      const halfWidth = halfHeight * width / height;
      camera.left = -halfWidth;
      camera.right = halfWidth;
      camera.updateProjectionMatrix();
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
        if (now >= nextScanAt && now >= pauseUntil) {
          scanIndex = (scanIndex + 1) % (OUTPUT_SIZE * OUTPUT_SIZE);
          if (scanIndex === 0) activeFilter = (activeFilter + 1) % kernelCount;
          nextScanAt = now + SCAN_MS;
          onSelectRef.current({ row: Math.floor(scanIndex / OUTPUT_SIZE), col: scanIndex % OUTPUT_SIZE });
        }
        const phase = Math.max(0, Math.min(1, 1 - (nextScanAt - now) / SCAN_MS));
        flowParticles.forEach((particle, index) => {
          const path = flowPaths[index];
          if (!path) return;
          const begin = index < 4 ? 0 : .5;
          const end = index < 4 ? .58 : 1;
          particle.visible = phase >= begin && phase <= end;
          if (particle.visible) particle.position.copy(path[0]).lerp(path[1], Math.max(0, Math.min(1, (phase - begin) / (end - begin))));
        });
        kernelBoxes.forEach((boxes, filterIndex) => boxes.forEach((box) => { box.material.emissiveIntensity = .08 + (filterIndex === activeFilter ? .28 : .025) * Math.sin(Math.PI * Math.max(0, Math.min(1, phase))); }));
        (scanWindow.material as THREE.LineBasicMaterial).opacity = .58 + .32 * Math.sin(now * .011) ** 2;
        controls.update();
        if (selectedOutput) selectedOutput.material.emissiveIntensity = .66 + .15 * Math.sin(now * .004);
        renderer.render(scene, camera);
        lastRender = now;
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      controllerRef.current = null;
      cancelAnimationFrame(frame);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      controls.dispose();
      clearConnections();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) { if (object.geometry !== tileGeometry) object.geometry.dispose(); object.material.dispose(); }
        if (object instanceof THREE.LineSegments) { if (object.geometry !== edgeGeometry) object.geometry.dispose(); object.material.dispose(); }
      });
      edgeGeometry.dispose();
      tileGeometry.dispose();
      kernelGeometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [kernelCount]);

  return <div ref={mountRef} className="ck-rgb__scene" role="img" aria-label={`三维 RGB 通道卷积，当前选中第${selected.row + 1}行第${selected.col + 1}列；拖动可旋转，滚轮可缩放，点击格子可观察响应`}>
    {fallback && <Fallback selected={selected} onSelect={onSelect} kernelCount={kernelCount} />}
  </div>;
}
