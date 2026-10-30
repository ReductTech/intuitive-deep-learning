import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Typography } from '../../../shared/react';
import { ENDPOINT_X, SPACE_HALF_HEIGHT, METRES_PER_UNIT, PLAYBACK_RATE, TRAVEL_SPEED, matterProfile, pathDistances, type ModelPaths, type SpatialPoint } from './wormholeMatter';

interface WormholeSceneProps { throat: number; ratio: number; valid: boolean; paths: ModelPaths; interactive?: boolean; animate?: boolean; routeMode?: 'compare' | 'available'; throatDetails?: ReactNode; }

export function WormholeScene(props: WormholeSceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const labels = useRef<Array<HTMLElement | null>>([]);
  const values = useRef(props);
  values.current = props;
  const [failed, setFailed] = useState(false);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const formulaId = useId();
  const formulaBox = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const openFormula = () => { clearTimeout(closeTimer.current); setFormulaOpen(true); };
  const closeFormula = () => { clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => setFormulaOpen(false), 150); };
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  useEffect(() => { if (!props.valid) setFormulaOpen(false); }, [props.valid]);
  useEffect(() => {
    if (!formulaOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || event.target.closest('.llmpe-cg-wormhole-throat-trigger, .llmpe-cg-wormhole-formula-popover')) return;
      clearTimeout(closeTimer.current); setFormulaOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [formulaOpen]);

  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0xffffff, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.setAttribute('aria-label', props.interactive === false ? '虫洞二维空间切片的三维嵌入示意图' : '虫洞二维空间切片的三维嵌入图，可拖动旋转、滚轮缩放');
    mount.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-9, 9, 6.4, -6.4, .1, 100);
    const initialCamera = new THREE.Vector3(-6, 7, 12);
    camera.position.copy(initialCamera);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = props.interactive !== false;
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.target.set(2, 0, 0);
    controls.minZoom = .65;
    controls.maxZoom = 2.5;
    controls.minPolarAngle = .2;
    controls.maxPolarAngle = Math.PI - .2;
    scene.add(new THREE.HemisphereLight(0xe7f2ff, 0x8391a5, 2.4));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(4, 8, 7);
    scene.add(light);
    const rim = new THREE.DirectionalLight(0x9ccfff, 2);
    rim.position.set(-4, -2, -4);
    scene.add(rim);

    const surfaceMaterial = new THREE.MeshPhysicalMaterial({ color: 0x8eb7d5, transparent: true, opacity: .72, roughness: .3, metalness: .08, clearcoat: .65, side: THREE.DoubleSide, depthWrite: false });
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x4a7394, transparent: true, opacity: .32 });
    const throatMaterial = new THREE.MeshBasicMaterial({ color: 0xe89b2c });
    const spaceMaterial = new THREE.MeshPhysicalMaterial({ color: 0xe9f0f8, roughness: .6, metalness: .02, side: THREE.DoubleSide });
    const spaceGridMaterial = new THREE.LineBasicMaterial({ color: 0x8fa8bf, transparent: true, opacity: .42 });
    let foldedSpace = new THREE.Group(); scene.add(foldedSpace);
    // Compare exact model slices at fixed embedding heights. The backdrop
    // never moves; this height is not an external distance between regions.
    const spaceHeight = SPACE_HALF_HEIGHT;
    let spaceOpening = 0;
    let model = new THREE.Group();
    scene.add(model);
    const a = new THREE.Vector3(ENDPOINT_X, spaceHeight, 0), b = new THREE.Vector3(ENDPOINT_X, -spaceHeight, 0);
    let anchors: THREE.Vector3[] = [new THREE.Vector3(), a, b];
    const markerGeometry = new THREE.SphereGeometry(.075, 20, 16);
    const markerMaterial = new THREE.MeshPhysicalMaterial({ color: 0x386f99, roughness: .35 });
    for (const position of [a, b]) { const marker = new THREE.Mesh(markerGeometry, markerMaterial); marker.position.copy(position); scene.add(marker); }
    const originalRouteMaterial = new THREE.LineBasicMaterial({ color: 0x479acc, transparent: true, opacity: .4, depthTest: false });
    const shortcutMaterial = new THREE.LineBasicMaterial({ color: 0xe7a033, transparent: true, opacity: .5, depthTest: false });
    let routes = new THREE.Group(); scene.add(routes);
    const makeStream = (color: number) => {
      const geometry = new THREE.BufferGeometry();
      const coordinates = new Float32Array(128 * 3);
      geometry.setAttribute('position', new THREE.BufferAttribute(coordinates, 3).setUsage(THREE.DynamicDrawUsage));
      geometry.setDrawRange(0, 0);
      const material = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, depthTest: false,
        uniforms: { color: { value: new THREE.Color(color) }, pixelRatio: { value: renderer.getPixelRatio() } },
        vertexShader: 'uniform float pixelRatio; void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=18.0*pixelRatio;}',
        fragmentShader: 'uniform vec3 color; void main(){float r=length(gl_PointCoord-0.5)*2.0;if(r>1.0)discard;float core=1.0-smoothstep(0.12,0.32,r);float halo=exp(-r*r*6.0);gl_FragColor=vec4(mix(color,vec3(1.0),core),max(core,halo*0.8));}',
      });
      const points = new THREE.Points(geometry, material); points.frustumCulled = false; points.renderOrder = 12; scene.add(points);
      return { geometry, coordinates, material, points, path: [] as SpatialPoint[], distances: [] as number[] };
    };
    const blueStream = makeStream(0x348cca), goldStream = makeStream(0xf1ad34);
    const setStreamPath = (stream: typeof blueStream, path: SpatialPoint[] | null) => {
      stream.path = path ?? []; stream.distances = path ? pathDistances(path) : [];
      stream.points.visible = path !== null;
    };
    const animateStream = (stream: typeof blueStream, elapsed: number) => {
      if (!stream.path.length) return;
      const length = stream.distances.at(-1)!;
      const speed = TRAVEL_SPEED * PLAYBACK_RATE / METRES_PER_UNIT;
      let count = 0;
      // A steady train, one new signal per playback second. Populate its
      // preceding signals immediately so the route is visible on entry.
      for (let age = elapsed % 1; age * speed < length && count < 128; age += 1) {
        const distance = age * speed;
        let low = 0, high = stream.distances.length - 1;
        while (high - low > 1) { const mid = (low + high) >> 1; if (stream.distances[mid] < distance) low = mid; else high = mid; }
        const fraction = (distance - stream.distances[low]) / Math.max(stream.distances[high] - stream.distances[low], 1e-12);
        const a = stream.path[low], b = stream.path[high];
        for (let axis = 0; axis < 3; axis++) stream.coordinates[count * 3 + axis] = a[axis] + (b[axis] - a[axis]) * fraction;
        count++;
      }
      stream.geometry.attributes.position.needsUpdate = true; stream.geometry.setDrawRange(0, count);
    };
    const disposeGeometry = (group: THREE.Group) => group.traverse(object => {
      const drawable = object as THREE.Mesh;
      drawable.geometry?.dispose();
    });
    const buildRoutes = (state: WormholeSceneProps) => {
      scene.remove(routes); disposeGeometry(routes); routes = new THREE.Group(); scene.add(routes);
      const addRoute = (path: SpatialPoint[], material: THREE.Material) => {
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(path.map(p => new THREE.Vector3(...p))), material); line.renderOrder = 9; routes.add(line);
      };
      const shortcut = state.valid ? state.paths.wormhole : null;
      const original = state.routeMode === 'available' && shortcut ? null : state.paths.original;
      if (original) addRoute(original, originalRouteMaterial);
      if (shortcut) addRoute(shortcut, shortcutMaterial);
      setStreamPath(blueStream, original); setStreamPath(goldStream, shortcut);
    };
    // The folded sheet remains as a spatial analogy in both states.
    // Its holes are cut only when a wormhole solution is present.
    const buildSpace = (height: number, opening: number) => {
      scene.remove(foldedSpace); disposeGeometry(foldedSpace);
      foldedSpace = new THREE.Group(); scene.add(foldedSpace);
      for (const y of [-height, height]) {
        const sheet = new THREE.Shape();
        sheet.moveTo(-6, -5.4); sheet.lineTo(6, -5.4); sheet.lineTo(6, 5.4); sheet.lineTo(-6, 5.4); sheet.closePath();
        if (opening > 0) { const hole = new THREE.Path(); hole.absarc(0, 0, opening, 0, Math.PI * 2, true); sheet.holes.push(hole); }
        const planeGeometry = new THREE.ShapeGeometry(sheet, 96); planeGeometry.rotateX(-Math.PI / 2);
        const plane = new THREE.Mesh(planeGeometry, spaceMaterial); plane.position.y = y; foldedSpace.add(plane);
        const lines: THREE.Vector3[] = [];
        const segment = (x1: number, z1: number, x2: number, z2: number) => lines.push(new THREE.Vector3(x1, y + .006, z1), new THREE.Vector3(x2, y + .006, z2));
        for (let x = -6; x <= 6; x += .5) {
          if (Math.abs(x) < opening) { const gap = Math.sqrt(opening * opening - x * x); segment(x, -5.4, x, -gap); segment(x, gap, x, 5.4); }
          else segment(x, -5.4, x, 5.4);
        }
        for (let z = -5; z <= 5; z += .5) {
          if (Math.abs(z) < opening) { const gap = Math.sqrt(opening * opening - z * z); segment(-6, z, -gap, z); segment(gap, z, 6, z); }
          else segment(-6, z, 6, z);
        }
        foldedSpace.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lines), spaceGridMaterial));
      }
      const positions: number[] = [], indices: number[] = [], bendLines: THREE.Vector3[] = [];
      const point = (i: number, j: number) => new THREE.Vector3(6 + height * Math.sin(Math.PI * i / 48), height * Math.cos(Math.PI * i / 48), -5.4 + 10.8 * j / 24);
      for (let i = 0; i <= 48; i++) for (let j = 0; j <= 24; j++) {
        positions.push(...point(i, j).toArray());
        if (i < 48 && j < 24) { const n = i * 25 + j; indices.push(n, n + 1, n + 25, n + 1, n + 26, n + 25); }
        if (i < 48 && j % 2 === 0) bendLines.push(point(i, j), point(i + 1, j));
        if (j < 24 && i % 4 === 0) bendLines.push(point(i, j), point(i, j + 1));
      }
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setIndex(indices); geometry.computeVertexNormals();
      foldedSpace.add(new THREE.Mesh(geometry, spaceMaterial));
      foldedSpace.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(bendLines), spaceGridMaterial));
    };
    buildSpace(spaceHeight, 0);
    const build = ({ throat, ratio }: WormholeSceneProps) => {
      scene.remove(model);
      disposeGeometry(model);
      model = new THREE.Group();
      scene.add(model);
      const extent = spaceHeight;
      const phiStart = 0;
      const phiSpan = Math.PI * 2;
      const profile = matterProfile(throat, ratio, extent, 'height');
      const edge = profile(extent);
      spaceOpening = edge.radius;
      buildSpace(spaceHeight, spaceOpening);
      const point = (ell: number, phi: number) => {
        const { radius, height } = profile(ell);
        return new THREE.Vector3(radius * Math.cos(phi), height, radius * Math.sin(phi));
      };
      const positions: number[] = [];
      const indices: number[] = [];
      const rows = 100, columns = 80;
      for (let i = 0; i <= rows; i++) {
        const ell = -extent + 2 * extent * i / rows;
        for (let j = 0; j <= columns; j++) positions.push(...point(ell, phiStart + phiSpan * j / columns).toArray());
      }
      for (let i = 0; i < rows; i++) for (let j = 0; j < columns; j++) {
        const n = i * (columns + 1) + j;
        indices.push(n, n + 1, n + columns + 1, n + 1, n + columns + 2, n + columns + 1);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      model.add(new THREE.Mesh(geometry, surfaceMaterial));
      // Latitude rings and meridians follow the exact same embedding surface.
      const gridPoints: THREE.Vector3[] = [];
      const addSegments = (points: THREE.Vector3[]) => {
        for (let i = 1; i < points.length; i++) gridPoints.push(points[i - 1], points[i]);
      };
      for (let i = 0; i <= 18; i++) addSegments(Array.from({ length: 97 }, (_, j) => point(-extent + 2 * extent * i / 18, phiStart + phiSpan * j / 96)));
      for (let j = 0; j <= 24; j++) addSegments(Array.from({ length: 101 }, (_, i) => point(-extent + 2 * extent * i / 100, phiStart + phiSpan * j / 24)));
      model.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gridPoints), gridMaterial));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(throat, .035, 12, 96, phiSpan), throatMaterial);
      ring.rotation.x = -Math.PI / 2;
      // With x rotation, the positive torus angles form the rear half (z <= 0).
      model.add(ring);
      anchors = [point(0, Math.atan2(11, 6)), a, b];
    };

    let last = { throat: -1, ratio: -999, valid: false };
    let visible = false, frame = 0, previousTime = -100, streamElapsed = 0;
    const paint = (time: number) => {
      if (time - previousTime >= 30) {
        if (previousTime >= 0) streamElapsed += Math.min(.1, (time - previousTime) / 1000);
        previousTime = time;
        const current = values.current;
        if (current.valid && (current.throat !== last.throat || current.ratio !== last.ratio || !last.valid)) build(current);
        if (!current.valid && last.valid) buildSpace(spaceHeight, 0);
        if (current.throat !== last.throat || current.ratio !== last.ratio || current.valid !== last.valid) buildRoutes(current);
        model.visible = current.valid;
        last = { ...current };
        animateStream(blueStream, current.animate === false ? 0 : streamElapsed); animateStream(goldStream, current.animate === false ? 0 : streamElapsed);
        controls.update();
        renderer.render(scene, camera);
        anchors.forEach((anchor, i) => {
          const label = labels.current[i];
          if (!label) return;
          const projected = anchor.clone().project(camera);
          const x = (projected.x * .5 + .5) * mount.clientWidth + 10;
          const y = (-projected.y * .5 + .5) * mount.clientHeight - 18;
          label.style.left = `${Math.max(5, Math.min(mount.clientWidth - label.offsetWidth - 5, x))}px`;
          label.style.top = `${Math.max(5, Math.min(mount.clientHeight - label.offsetHeight - 5, y))}px`;
          if (i === 0 && formulaBox.current) {
            const box = formulaBox.current;
            const left = Math.max(8, Math.min(x - box.offsetWidth / 2, mount.clientWidth - box.offsetWidth - 8));
            const above = y - box.offsetHeight - 12;
            const top = above >= 8 ? above : Math.max(8, Math.min(y + label.offsetHeight + 12, mount.clientHeight - box.offsetHeight - 8));
            box.style.left = `${left}px`; box.style.top = `${top}px`;
          }
        });
        renderer.domElement.dataset.rendered = 'true';
        renderer.domElement.dataset.throat = String(current.throat);
        renderer.domElement.dataset.ratio = String(current.ratio);
        renderer.domElement.dataset.valid = String(current.valid);
        renderer.domElement.dataset.routeCount = String(routes.children.length);
        renderer.domElement.dataset.activeRoute = goldStream.points.visible ? blueStream.points.visible ? 'both' : 'wormhole' : 'original';
        renderer.domElement.dataset.camera = camera.position.toArray().map(n => n.toFixed(3)).join(',');
      }
      if (visible && !document.hidden) frame = requestAnimationFrame(paint);
    };
    const resize = () => {
      const width = mount.clientWidth, height = mount.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.left = -6.4 * width / height; camera.right = 6.4 * width / height;
      camera.updateProjectionMatrix();
      previousTime = -100;
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();
    const update = () => {
      cancelAnimationFrame(frame);
      previousTime = -100;
      if (visible && !document.hidden) frame = requestAnimationFrame(paint);
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(mount);
    document.addEventListener('visibilitychange', update);
    paint(0);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', update);
      controls.dispose();
      disposeGeometry(model);
      disposeGeometry(foldedSpace);
      disposeGeometry(routes); markerGeometry.dispose();
      for (const stream of [blueStream, goldStream]) { stream.geometry.dispose(); stream.material.dispose(); }
      for (const material of [surfaceMaterial, gridMaterial, throatMaterial, spaceMaterial, spaceGridMaterial, markerMaterial, originalRouteMaterial, shortcutMaterial]) material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="llmpe-cg-wormhole-scene" onKeyDown={event => {
    if (event.key === 'Escape') { clearTimeout(closeTimer.current); setFormulaOpen(false); event.stopPropagation(); }
  }}>
    {failed ? <Typography variant="bodySmall" tone="muted" className="llmpe-cg-wormhole-fallback">当前浏览器无法启动三维显示。</Typography> : props.valid && (props.throatDetails ?
      <button ref={el => { labels.current[0] = el; }} type="button" className="llmpe-cg-wormhole-scene-label llmpe-cg-wormhole-throat-trigger"
        aria-label="喉部：查看计算公式" aria-describedby={formulaOpen ? formulaId : undefined}
        onMouseEnter={openFormula} onMouseLeave={closeFormula} onFocus={openFormula} onBlur={closeFormula} onClick={openFormula}>
        <Typography as="span" variant="bodySmall" tone="warning">喉部</Typography>
      </button> : <Typography ref={el => { labels.current[0] = el; }} as="span" variant="bodySmall" tone="warning" className="llmpe-cg-wormhole-scene-label">喉部</Typography>)}
    {!failed && props.valid && formulaOpen && props.throatDetails && <div ref={formulaBox} id={formulaId} role="tooltip" className="llmpe-cg-wormhole-formula-popover"
      onMouseEnter={openFormula} onMouseLeave={closeFormula}>
      {props.throatDetails}
    </div>}
    {!failed && <><Typography ref={el => { labels.current[1] = el; }} as="span" variant="bodySmall" tone="accent" className="llmpe-cg-wormhole-scene-label">A</Typography><Typography ref={el => { labels.current[2] = el; }} as="span" variant="bodySmall" tone="accent" className="llmpe-cg-wormhole-scene-label">B</Typography></>}
  </div>;
}
