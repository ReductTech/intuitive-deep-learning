import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Typography } from '../../../shared/react';

export interface CellSelection { level: number; row: number; col: number; }
type Tile = THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
const SIZES = [9, 7, 5, 3, 1];
const CELL = .52;

function Fallback({ layers, selected, onSelect }: { layers: number; selected: CellSelection; onSelect: (cell: CellSelection) => void }) {
  return <div className="ck-field__fallback">
    {Array.from({ length: layers + 1 }, (_, reverseIndex) => {
      const level = layers - reverseIndex;
      const size = SIZES[level];
      const reach = selected.level - level;
      return <div className="ck-field__fallback-layer" key={level}>
        <Typography variant="bodySmall" tone="accent">{level === 0 ? '输入图像' : `第 ${level} 层`} · {size} × {size}</Typography>
        <div className="ck-field__fallback-grid" style={{ gridTemplateColumns: `repeat(${size},minmax(0,1fr))` }}>
          {Array.from({ length: size * size }, (_, index) => {
            const row = Math.floor(index / size), col = index % size;
            const active = reach >= 0 && row >= selected.row && row < selected.row + 1 + 2 * reach && col >= selected.col && col < selected.col + 1 + 2 * reach;
            return <button key={index} type="button" className={active ? 'is-active' : ''} aria-label={`${level === 0 ? '输入' : `第${level}层`}第${row + 1}行第${col + 1}列`} onClick={() => onSelect({ level, row, col })} />;
          })}
        </div>
      </div>;
    })}
  </div>;
}

export function ReceptiveFieldScene({ layers, selected, onSelect, resetViewToken }: { layers: number; selected: CellSelection; onSelect: (cell: CellSelection) => void; resetViewToken: number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<{ update: (layers: number, selected: CellSelection) => void; reset: () => void } | null>(null);
  const layersRef = useRef(layers);
  const onSelectRef = useRef(onSelect);
  const [fallback, setFallback] = useState(false);

  useEffect(() => { layersRef.current = layers; onSelectRef.current = onSelect; }, [layers, onSelect]);
  useEffect(() => { controllerRef.current?.update(layers, selected); }, [layers, selected]);
  useEffect(() => { controllerRef.current?.reset(); }, [resetViewToken]);

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
    const camera = new THREE.OrthographicCamera(-6, 6, 4.6, -4.6, .1, 100);
    const defaultCamera = new THREE.Vector3(7.8, 9.2, 11.6);
    const target = new THREE.Vector3(0, -.5, 0);
    camera.position.copy(defaultCamera);
    camera.zoom = 1.25;
    camera.updateProjectionMatrix();
    camera.lookAt(target);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(target);
    controls.enableDamping = true;
    controls.dampingFactor = .09;
    controls.enablePan = false;
    controls.minZoom = .72;
    controls.maxZoom = 2.4;
    controls.minPolarAngle = .2;
    controls.maxPolarAngle = Math.PI * .78;
    controls.update();
    scene.add(new THREE.AmbientLight(0xffffff, 2.2));
    const light = new THREE.DirectionalLight(0xd0e4ff, 3.1);
    light.position.set(-4, 10, 7);
    scene.add(light);

    const tileGeometry = new THREE.BoxGeometry(CELL - .025, .085, CELL - .025);
    const edgesGeometry = new THREE.EdgesGeometry(tileGeometry);
    const groups: THREE.Group[] = [];
    const tiles: Tile[][] = [];
    const pickable: Tile[] = [];
    for (let level = 0; level < SIZES.length; level += 1) {
      const size = SIZES[level];
      const group = new THREE.Group();
      group.position.y = level * 1.12 - 2.12;
      scene.add(group);
      groups.push(group);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(size * CELL + .07, .045, size * CELL + .07), new THREE.MeshStandardMaterial({ color: 0xdaeaff, transparent: true, opacity: .38, depthWrite: false }));
      plate.position.y = -.085;
      group.add(plate);
      const levelTiles: Tile[] = [];
      for (let row = 0; row < size; row += 1) for (let col = 0; col < size; col += 1) {
        const material = new THREE.MeshStandardMaterial({ color: 0xf1f7ff, emissive: 0x163967, emissiveIntensity: .03, transparent: true, opacity: .97, metalness: .08, roughness: .29 });
        const tile = new THREE.Mesh(tileGeometry, material);
        tile.position.set((col - (size - 1) / 2) * CELL, 0, (row - (size - 1) / 2) * CELL);
        tile.userData.cell = { level, row, col } satisfies CellSelection;
        tile.add(new THREE.LineSegments(edgesGeometry, new THREE.LineBasicMaterial({ color: 0x9bbbea, transparent: true, opacity: .85 })));
        group.add(tile);
        levelTiles.push(tile);
        pickable.push(tile);
      }
      tiles.push(levelTiles);
    }

    let hovered: Tile | null = null;
    const movingTiles = new Set<Tile>();
    const setHovered = (tile: Tile | null) => {
      if (hovered === tile) return;
      if (hovered) movingTiles.add(hovered);
      hovered = tile;
      if (hovered) movingTiles.add(hovered);
      renderer.domElement.style.cursor = hovered ? 'pointer' : 'grab';
    };

    let overlays = new THREE.Group();
    scene.add(overlays);
    const clearOverlays = () => {
      scene.remove(overlays);
      overlays.traverse((object) => {
        if (object instanceof THREE.Line) { object.geometry.dispose(); object.material.dispose(); }
      });
      overlays = new THREE.Group();
      scene.add(overlays);
    };
    const corners = (level: number, selection: CellSelection) => {
      const size = SIZES[level];
      const reach = selection.level - level;
      const width = 1 + 2 * reach;
      const x0 = (selection.col - (size - 1) / 2 - .5) * CELL;
      const z0 = (selection.row - (size - 1) / 2 - .5) * CELL;
      const x1 = x0 + width * CELL;
      const z1 = z0 + width * CELL;
      const y = groups[level].position.y + .075;
      return [new THREE.Vector3(x0, y, z0), new THREE.Vector3(x1, y, z0), new THREE.Vector3(x1, y, z1), new THREE.Vector3(x0, y, z1)];
    };
    const update = (visibleLayers: number, selection: CellSelection) => {
      if (hovered && (hovered.userData.cell as CellSelection).level > visibleLayers) setHovered(null);
      groups.forEach((group, level) => { group.visible = level <= visibleLayers; });
      tiles.forEach((levelTiles, level) => {
        const reach = selection.level - level;
        const width = 1 + 2 * reach;
        levelTiles.forEach((tile) => {
          const { row, col } = tile.userData.cell as CellSelection;
          const active = level <= visibleLayers && reach >= 0 && row >= selection.row && row < selection.row + width && col >= selection.col && col < selection.col + width;
          const chosen = active && level === selection.level;
          tile.material.color.setHex(chosen ? 0x347cf4 : active ? 0x83b4fa : 0xf1f7ff);
          tile.material.emissive.setHex(active ? 0x2668c9 : 0x163967);
          tile.material.emissiveIntensity = chosen ? .54 : active ? .22 : .03;
        });
      });
      clearOverlays();
      for (let level = selection.level; level >= 0; level -= 1) {
        const outlinePoints = corners(level, selection);
        const outline = new THREE.Line(new THREE.BufferGeometry().setFromPoints([...outlinePoints, outlinePoints[0]]), new THREE.LineBasicMaterial({ color: 0x347cf4, transparent: true, opacity: .85, depthTest: false }));
        outline.renderOrder = 3;
        overlays.add(outline);
        if (level === 0) continue;
        const lowerPoints = corners(level - 1, selection);
        outlinePoints.forEach((point, index) => {
          const connector = new THREE.Line(new THREE.BufferGeometry().setFromPoints([point, lowerPoints[index]]), new THREE.LineDashedMaterial({ color: 0x3f83ef, dashSize: .11, gapSize: .09, transparent: true, opacity: .65, depthTest: false }));
          connector.computeLineDistances();
          connector.renderOrder = 2;
          overlays.add(connector);
        });
      }
    };
    const reset = () => { camera.position.copy(defaultCamera); camera.zoom = 1.25; camera.updateProjectionMatrix(); controls.target.copy(target); controls.update(); };
    controllerRef.current = { update, reset };
    update(layers, selected);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerStart: { x: number; y: number } | null = null;
    const pickTile = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(pickable, false).find((item) => (item.object.userData.cell as CellSelection).level <= layersRef.current)?.object as Tile | undefined;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (pointerStart) return;
      setHovered(pickTile(event) ?? null);
    };
    const onPointerDown = (event: PointerEvent) => {
      pointerStart = { x: event.clientX, y: event.clientY };
      renderer.domElement.style.cursor = 'grabbing';
    };
    const onPointerUp = (event: PointerEvent) => {
      const clicked = pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) <= 5;
      pointerStart = null;
      const tile = pickTile(event) ?? null;
      setHovered(tile);
      renderer.domElement.style.cursor = tile ? 'pointer' : 'grab';
      if (clicked && tile) onSelectRef.current(tile.userData.cell as CellSelection);
    };
    const onPointerLeave = () => { pointerStart = null; setHovered(null); };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);
    const resize = () => {
      const width = Math.max(1, mount.clientWidth), height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      const halfHeight = 4.6;
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
      controllerRef.current = null;
      cancelAnimationFrame(frame);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      controls.dispose();
      clearOverlays();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) { if (object.geometry !== tileGeometry) object.geometry.dispose(); object.material.dispose(); }
        if (object instanceof THREE.LineSegments) object.material.dispose();
      });
      edgesGeometry.dispose();
      tileGeometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="ck-field__scene" role="img" aria-label={`可旋转缩放的卷积层叠模型，当前选中${selected.level === 0 ? '输入图像' : `第${selected.level}层特征图`}第${selected.row + 1}行第${selected.col + 1}列，点击任一网格位置查看各下层感受野`}>
    {fallback && <Fallback layers={layers} selected={selected} onSelect={onSelect} />}
  </div>;
}
