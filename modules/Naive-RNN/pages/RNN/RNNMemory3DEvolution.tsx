import { useEffect, useRef } from 'react';

interface RNNMemory3DEvolutionProps { phase: number; }
type ThreeApi = Record<string, any>;

const threeModuleUrl = new URL('../../../shared/vendor/three/0.148.0/three.min.js', import.meta.url).href;

function getThree() { return (window as Window & { THREE?: ThreeApi }).THREE ?? null; }

function loadThree(): Promise<ThreeApi> {
  const ready = getThree();
  if (ready) return Promise.resolve(ready);
  const existing = document.querySelector<HTMLScriptElement>('script[data-nrnn-three]');
  if (existing) return new Promise((resolve, reject) => {
    existing.addEventListener('load', () => getThree() ? resolve(getThree()!) : reject(new Error('Three.js 不可用')), { once: true });
    existing.addEventListener('error', () => reject(new Error('Three.js 加载失败')), { once: true });
  });
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = threeModuleUrl;
    script.async = true;
    script.dataset.nrnnThree = '';
    script.addEventListener('load', () => getThree() ? resolve(getThree()!) : reject(new Error('Three.js 不可用')), { once: true });
    script.addEventListener('error', () => reject(new Error('Three.js 加载失败')), { once: true });
    document.head.appendChild(script);
  });
}

function lineBetween(THREE: ThreeApi, from: any, to: any, color: number, opacity = .38) {
  const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
  return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

function nodeMaterial(THREE: ThreeApi, color: number, opacity = .95) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: .31, metalness: .05, clearcoat: .5, transparent: true, opacity });
}

function labelSprite(THREE: ThreeApi, text: string, scale = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 72;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.fillStyle = '#29465a';
  context.font = '700 35px Inter, PingFang SC, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 80, 37);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(1.05 * scale, .48 * scale, 1);
  return sprite;
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** 收集模型里的所有材质，用于整体淡入淡出。 */
function collectMaterials(root: any) {
  const list: any[] = [];
  root.traverse((item: any) => {
    if (Array.isArray(item.material)) list.push(...item.material);
    else if (item.material) list.push(item.material);
  });
  return list;
}

function setGroupOpacity(materials: any[], value: number) {
  materials.forEach((material) => { material.opacity = value; });
}

/** 输入模型：晴天。球体加八道光芒，是真正的三维对象，会跟着场景一起转。 */
function buildSunModel(THREE: ThreeApi) {
  const group = new THREE.Group();
  const sphereMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xf2ae2a,
    emissive: 0xc9760a,
    emissiveIntensity: .22,
    roughness: .42,
    metalness: .04,
    clearcoat: .55,
    transparent: true,
    opacity: 1,
  });
  const rayMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xdb9313,
    roughness: .48,
    metalness: .05,
    transparent: true,
    opacity: 1,
  });

  const core = new THREE.Mesh(new THREE.SphereGeometry(.22, 32, 24), sphereMaterial);
  group.add(core);

  const rayGeometry = new THREE.CylinderGeometry(.028, .075, .26, 16);
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const ray = new THREE.Mesh(rayGeometry, rayMaterial);
    ray.position.set(Math.cos(angle) * .38, Math.sin(angle) * .38, 0);
    ray.rotation.z = angle - Math.PI / 2;
    group.add(ray);
  }
  return group;
}

/** 输入模型：苹果派。金属烤盘 + 酥皮花边 + 交叉编织条 + 顶上那颗小苹果。 */
function buildPieModel(THREE: ThreeApi) {
  const group = new THREE.Group();
  const panMaterial = new THREE.MeshPhysicalMaterial({ color: 0xcdd7e0, roughness: .3, metalness: .5, clearcoat: .5, transparent: true, opacity: 1 });
  const crustMaterial = new THREE.MeshPhysicalMaterial({ color: 0xc4842a, roughness: .58, metalness: .03, transparent: true, opacity: 1 });
  const stripMaterial = new THREE.MeshPhysicalMaterial({ color: 0xa96a1d, roughness: .6, metalness: .02, transparent: true, opacity: 1 });
  const fillingMaterial = new THREE.MeshPhysicalMaterial({ color: 0x7d1f12, roughness: .52, metalness: .02, transparent: true, opacity: 1 });
  const appleMaterial = new THREE.MeshPhysicalMaterial({ color: 0xbb2622, roughness: .34, clearcoat: .6, transparent: true, opacity: 1 });
  const leafMaterial = new THREE.MeshPhysicalMaterial({ color: 0x2f8f42, roughness: .5, transparent: true, opacity: 1 });
  const pan = new THREE.Mesh(new THREE.CylinderGeometry(.31, .27, .085, 40), panMaterial);
  group.add(pan);

  const crust = new THREE.Mesh(new THREE.CylinderGeometry(.285, .3, .075, 40), crustMaterial);
  crust.position.y = .07;
  group.add(crust);

  const filling = new THREE.Mesh(new THREE.CylinderGeometry(.235, .235, .035, 36), fillingMaterial);
  filling.position.y = .115;
  group.add(filling);

  // 交叉编织的酥皮条：三根一个方向，三根另一个方向。
  const stripGeometry = new THREE.BoxGeometry(1, .022, .052);
  [-1, 0, 1].forEach((row) => {
    [Math.PI / 4, -Math.PI / 4].forEach((rotation) => {
      const offset = row * .15;
      const half = Math.sqrt(Math.max(0, .275 * .275 - offset * offset));
      const strip = new THREE.Mesh(stripGeometry, stripMaterial);
      strip.scale.x = half * 2;
      strip.position.set(Math.sin(rotation) * offset, .14, Math.cos(rotation) * offset);
      strip.rotation.y = rotation;
      group.add(strip);
    });
  });

  const apple = new THREE.Mesh(new THREE.SphereGeometry(.072, 24, 18), appleMaterial);
  apple.position.set(.02, .2, .01);
  apple.scale.y = .9;
  group.add(apple);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(.042, 18, 12), leafMaterial);
  leaf.position.set(.065, .245, .01);
  leaf.scale.set(1, .35, .6);
  leaf.rotation.z = -.5;
  group.add(leaf);
  return group;
}

/** 输入模型：雨天。几团云叠在一起，下面是三道雨丝。 */
function buildRainModel(THREE: ThreeApi) {
  const group = new THREE.Group();
  const cloudMaterial = new THREE.MeshPhysicalMaterial({ color: 0xa9bcd4, roughness: .62, metalness: .04, transparent: true, opacity: 1 });
  const dropMaterial = new THREE.MeshPhysicalMaterial({ color: 0x3f7fc4, roughness: .34, metalness: .05, clearcoat: .5, transparent: true, opacity: 1 });

  [
    { radius: .26, x: -.3, y: .06, z: .04 },
    { radius: .32, x: 0, y: .13, z: 0 },
    { radius: .24, x: .3, y: .05, z: .05 },
    { radius: .22, x: .12, y: -.07, z: .2 },
    { radius: .2, x: -.14, y: -.05, z: -.18 },
  ].forEach((puff) => {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(puff.radius, 24, 18), cloudMaterial);
    sphere.position.set(puff.x, puff.y, puff.z);
    group.add(sphere);
  });

  const dropGeometry = new THREE.CylinderGeometry(.048, .018, .26, 14);
  [-.3, 0, .3].forEach((x) => {
    const drop = new THREE.Mesh(dropGeometry, dropMaterial);
    drop.position.set(x, -.36, .02);
    group.add(drop);
  });
  return group;
}

/** 输出模型：下一道菜「牛排」。白瓷盘 + 厚切牛排 + 炭烤网纹 + 一枝迷迭香。 */
function buildSteakModel(THREE: ThreeApi) {
  const group = new THREE.Group();
  const plateMaterial = new THREE.MeshPhysicalMaterial({ color: 0xeff4f8, roughness: .3, metalness: .08, clearcoat: .45, transparent: true, opacity: 1 });
  const meatMaterial = new THREE.MeshPhysicalMaterial({ color: 0x77341a, roughness: .52, metalness: .03, transparent: true, opacity: 1 });
  const charMaterial = new THREE.MeshPhysicalMaterial({ color: 0x1b0803, roughness: .6, transparent: true, opacity: 1 });
  const herbMaterial = new THREE.MeshPhysicalMaterial({ color: 0x2f8f42, roughness: .5, transparent: true, opacity: 1 });

  const plate = new THREE.Mesh(new THREE.CylinderGeometry(.4, .36, .055, 40), plateMaterial);
  group.add(plate);

  const meat = new THREE.Mesh(new THREE.CylinderGeometry(.3, .32, .13, 36), meatMaterial);
  meat.position.y = .09;
  meat.scale.z = .82;
  group.add(meat);

  const barGeometry = new THREE.BoxGeometry(.56, .02, .05);
  [-1, 0, 1].forEach((row) => {
    [Math.PI * .22, -Math.PI * .22].forEach((rotation) => {
      const bar = new THREE.Mesh(barGeometry, charMaterial);
      bar.position.set(Math.sin(rotation) * row * .13, .162, Math.cos(rotation) * row * .1);
      bar.rotation.y = rotation;
      group.add(bar);
    });
  });

  const sprig = new THREE.Mesh(new THREE.CylinderGeometry(.014, .014, .34, 10), herbMaterial);
  sprig.position.set(.2, .21, .12);
  sprig.rotation.set(0, .4, Math.PI / 2.4);
  group.add(sprig);
  [-.06, .05].forEach((offset, index) => {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(.045, 16, 12), herbMaterial);
    leaf.position.set(.26 + offset, .24 + index * .02, .12);
    leaf.scale.set(1, .4, .55);
    leaf.rotation.z = index ? .4 : -.4;
    group.add(leaf);
  });
  return group;
}

export function RNNMemory3DEvolution({ phase }: RNNMemory3DEvolutionProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let disposed = false;
    let dispose = () => undefined;

    loadThree().then((THREE) => {
      if (disposed) return;
      const scene = new THREE.Scene();
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.domElement.className = 'nrnn-memory-3d__canvas';
      host.replaceChildren(renderer.domElement);

      const camera = new THREE.PerspectiveCamera(31, 1, .1, 100);
      const target = new THREE.Vector3(.45, .05, 0);
      let orbit = { theta: -0.6, phi: 0.45, radius: 9.5 };
      let radiusWasAdjusted = false;
      const positionCamera = () => {
        const { theta, phi, radius } = orbit;
        camera.position.set(radius * Math.cos(phi) * Math.sin(theta), radius * Math.sin(phi), radius * Math.cos(phi) * Math.cos(theta));
        camera.lookAt(target);
      };
      positionCamera();

      scene.add(new THREE.HemisphereLight(0xffffff, 0xcbd8df, 1.08));
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
      keyLight.position.set(3, 8, 10);
      scene.add(keyLight);
      const coolFill = new THREE.PointLight(0x9ebbc8, .72, 24);
      coolFill.position.set(-7, 3, 5);
      scene.add(coolFill);
      const warmRim = new THREE.PointLight(0xd9a08c, .35, 18);
      warmRim.position.set(5, -2, 4);
      scene.add(warmRim);

      const stage = new THREE.Group();
      scene.add(stage);
      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(11, 96),
        new THREE.MeshBasicMaterial({ color: 0xe6eef2, transparent: true, opacity: .5, side: THREE.DoubleSide }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -3.05;
      stage.add(floor);

      const timeXs = [-4.4, 0, 4.4];
      const rawTimeYs = [1.8, 0, -1.8];
      const rawNetworkX = .8;
      const rawNetworkScale = .85;
      const rawPlaneZs = [0, 0, 0];
      const layerX = [-1.68, 0, 1.62];
      const rawNetworks: any[] = [];
      const rawInternalLines: any[] = [];

      rawTimeYs.forEach((timeY, index) => {
        const group = new THREE.Group();
        group.position.set(0, 0, 0);
        group.rotation.set(0, 0, 0);
        group.scale.setScalar(index === 0 ? 1 : .001);
        group.userData.targetX = rawNetworkX;
        group.userData.targetY = timeY;
        group.userData.targetZ = rawPlaneZs[index];
        stage.add(group);
        rawNetworks.push(group);

        const rows = [-1.2, 0, 1.2];
        const layerNodes: any[][] = [];
        layerX.forEach((x, layerIndex) => {
          const row = rows.map((rowZ) => {
            const node = new THREE.Mesh(
              new THREE.SphereGeometry(layerIndex === 1 ? .245 : .19, 28, 20),
              nodeMaterial(THREE, layerIndex === 1 ? 0x355f73 : 0x719da6),
            );
            node.position.set(x, 0, rowZ);
            node.userData.originalZ = rowZ; // 保存初始 Z，用于融合动画向中心坍缩
            group.add(node);
            return node;
          });
          layerNodes.push(row);
        });

        // 收集内部层间连线
        layerNodes.slice(0, -1).forEach((row, layerIndex) => row.forEach((from) => layerNodes[layerIndex + 1].forEach((to) => {
          const l = lineBetween(THREE, from.position, to.position, 0x78909a, .34);
          group.add(l);
          rawInternalLines.push(l);
        })));

        const hiddenLabel = labelSprite(THREE, `h${index + 1}`, .68);
        if (hiddenLabel) { hiddenLabel.position.set(.02, .46, .42); group.add(hiddenLabel); }

        group.userData.allLayerNodes = layerNodes;
        group.userData.hiddenNodes = layerNodes[1];
      });

      // 跨时步全连接线配置
      interface RecurrentSegmentPair {
        fromNode: any;
        toNode: any;
        stepIndex: number;
      }
      const recurrentPairs: RecurrentSegmentPair[] = [];
      for (let i = 0; i < rawNetworks.length - 1; i++) {
        const currNodes = rawNetworks[i].userData.hiddenNodes || [];
        const nextNodes = rawNetworks[i + 1].userData.hiddenNodes || [];
        currNodes.forEach((fn: any) => {
          nextNodes.forEach((tn: any) => {
            recurrentPairs.push({ fromNode: fn, toNode: tn, stepIndex: i });
          });
        });
      }

      const totalPairs = recurrentPairs.length;
      const recurrentPosArray = new Float32Array(totalPairs * 6);
      const recurrentGeo = new THREE.BufferGeometry();
      recurrentGeo.setAttribute('position', new THREE.BufferAttribute(recurrentPosArray, 3));
      const recurrentMat = new THREE.LineBasicMaterial({
        color: 0xeb7f35,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const recurrentLinesMesh = new THREE.LineSegments(recurrentGeo, recurrentMat);
      stage.add(recurrentLinesMesh);

      // ────────────────────────────────────────────
      // 🌟 输入模型：晴天与苹果派。三维对象，和网络一起随鼠标拖动旋转。
      // ────────────────────────────────────────────
      const sunMidModel = buildSunModel(THREE);
      const sunTopModel = buildSunModel(THREE);
      const rainModel = buildRainModel(THREE);
      const memoryPieModel = buildPieModel(THREE);
      const topDishModel = buildPieModel(THREE);
      const midDishModel = buildPieModel(THREE);
      const bottomDishModel = buildSteakModel(THREE);
      memoryPieModel.scale.setScalar(1.15);
      sunMidModel.scale.setScalar(.85);
      sunTopModel.scale.setScalar(.85);
      topDishModel.scale.setScalar(1);
      midDishModel.scale.setScalar(1);
      bottomDishModel.scale.setScalar(1.3);
      const sunMidMaterials = collectMaterials(sunMidModel);
      const sunTopMaterials = collectMaterials(sunTopModel);
      const rainMaterials = collectMaterials(rainModel);
      const memoryPieMaterials = collectMaterials(memoryPieModel);
      const topDishMaterials = collectMaterials(topDishModel);
      const midDishMaterials = collectMaterials(midDishModel);
      const bottomDishMaterials = collectMaterials(bottomDishModel);

      /** 三层分别站在各自时步的输入侧与输出侧。 */
      /** 第二层的晴天和记忆里那道菜并排站在同一排：x 相邻、屏幕高度一致。 */
      const sunMidParked = new THREE.Vector3(-2.25, -.18, -.8);
      const sunTopParked = new THREE.Vector3(-2.25, 1.8, -.8);
      const rainParked = new THREE.Vector3(-2.25, -1.8, -.8);
      const topDishParked = new THREE.Vector3(3, 1.8, .2);
      const midDishParked = new THREE.Vector3(3, 0, .2);
      const bottomDishParked = new THREE.Vector3(3, -1.8, .2);
      /** 记忆里那道菜：从左边输入位飞进隐状态走廊，再顺着 h₁ → h₂ → h₃ 往下走。 */
      const pieParked = new THREE.Vector3(-3.15, 0, -.8);
      /** 苹果派被带进隐状态后，沿着 h₁ → h₂ → h₃ 的走廊往下走。 */
      const pieArc = new THREE.Vector3(-1.1, 2, -.25);
      const pieTop = new THREE.Vector3(0, 2.2, .05);
      const pieBottom = new THREE.Vector3(0, -2.2, .05);
      sunMidModel.position.copy(sunMidParked);
      sunTopModel.position.copy(sunTopParked);
      rainModel.position.copy(rainParked);
      memoryPieModel.position.copy(pieParked);
      topDishModel.position.copy(topDishParked);
      midDishModel.position.copy(midDishParked);
      bottomDishModel.position.copy(bottomDishParked);
      stage.add(sunMidModel, sunTopModel, rainModel, memoryPieModel, topDishModel, midDishModel, bottomDishModel);

      // ────────────────────────────────────────────
      // 🌟 减速、分布式多流粒子微粒群 (Particles Stream)
      // ────────────────────────────────────────────
      const PARTICLE_COUNT = 32;
      const particles: Array<{
        mesh: any;
        seed: number;
        speed: number;
        flowType: 'forward' | 'recurrent';
        stepIdx: number;
        inIdx: number;
        hidIdx: number;
        outIdx: number;
        recurrentPairIdx: number;
      }> = [];

      const pGeo = new THREE.SphereGeometry(0.042, 16, 16);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const pMat = new THREE.MeshBasicMaterial({
          color: 0xffa044,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        stage.add(pMesh);

        // 约 65% 为前向流（向右），约 35% 为沿时步传递流（向下）
        const isRecurrent = i % 3 === 0;
        particles.push({
          mesh: pMesh,
          seed: i / PARTICLE_COUNT,
          speed: 0.00016 + (i % 4) * 0.00003, // 速度减半，更平缓柔和
          flowType: isRecurrent ? 'recurrent' : 'forward',
          stepIdx: i % 3, // 分配到不同的时步网络中
          inIdx: i % 3,
          hidIdx: Math.floor(i / 2) % 3,
          outIdx: (i + 1) % 3,
          recurrentPairIdx: (i * 2) % Math.max(1, recurrentPairs.length),
        });
      }

      // ────────────────────────────────────────────
      // 🌟 04 阶段：配色与 03 严格同步，并替换粗线条为精致线
      // ────────────────────────────────────────────
      const simple = new THREE.Group();
      simple.scale.setScalar(.001);
      stage.add(simple);
      const simpleCells: any[] = [];
      const rowYs = [1.48, 0, -1.48];
      timeXs.forEach((time, index) => {
        const cell = new THREE.Group();
        cell.userData.rowY = rowYs[index];
        cell.userData.columnX = time;
        cell.position.set(0, rowYs[index], .18);
        simple.add(cell);

        // 颜色与 03 状态严格对应：输入/输出层采用 0x719da6，隐藏层采用 0x355f73
        const input = new THREE.Mesh(new THREE.SphereGeometry(.38, 30, 20), nodeMaterial(THREE, 0x719da6));
        const hidden = new THREE.Mesh(new THREE.SphereGeometry(.50, 34, 22), nodeMaterial(THREE, 0x355f73));
        const output = new THREE.Mesh(new THREE.SphereGeometry(.38, 30, 20), nodeMaterial(THREE, 0x719da6));
        input.position.set(-1.48, 0, 0);
        hidden.position.set(0, 0, .08);
        output.position.set(1.48, 0, .18);
        cell.add(input, hidden, output);

        const inputLabel = labelSprite(THREE, `x${index + 1}`, .72);
        const hiddenLabel = labelSprite(THREE, `h${index + 1}`, .72);
        const outputLabel = labelSprite(THREE, `o${index + 1}`, .72);
        if (inputLabel) { inputLabel.position.set(-1.48, -.68, .3); cell.add(inputLabel); }
        if (hiddenLabel) { hiddenLabel.position.set(0, .78, .4); cell.add(hiddenLabel); }
        if (outputLabel) { outputLabel.position.set(1.48, -.68, .42); cell.add(outputLabel); }

        const inputLine = lineBetween(THREE, input.position, hidden.position, 0x78909a, .45);
        const outputLine = lineBetween(THREE, hidden.position, output.position, 0x78909a, .45);
        cell.add(inputLine, outputLine);
        simpleCells.push({ cell, input, hidden, output, inputLine, outputLine, labels: [inputLabel, hiddenLabel, outputLabel] });
      });

      // 04 阶段相邻隐藏层之间的连线，采用橙色半透明细线
      const simpleStateLinks = simpleCells.slice(0, -1).map(() => {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xeb7f35, transparent: true, opacity: 0, depthWrite: false });
        const link = new THREE.Line(lineGeo, lineMat);
        stage.add(link);
        return link;
      });

      const resize = () => {
        const { width, height } = host.getBoundingClientRect();
        renderer.setSize(Math.max(1, width), Math.max(1, height), false);
        camera.aspect = Math.max(1, width) / Math.max(1, height);
        camera.updateProjectionMatrix();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(host);
      resize();

      let dragging = false;
      let last = { x: 0, y: 0 };
      const down = (event: PointerEvent) => { dragging = true; last = { x: event.clientX, y: event.clientY }; renderer.domElement.setPointerCapture(event.pointerId); };
      const move = (event: PointerEvent) => {
        if (!dragging) return;
        orbit.theta -= (event.clientX - last.x) * .008;
        orbit.phi = Math.max(-.34, Math.min(.72, orbit.phi + (event.clientY - last.y) * .006));
        last = { x: event.clientX, y: event.clientY };
      };
      const up = (event: PointerEvent) => { dragging = false; if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId); };
      const wheel = (event: WheelEvent) => { event.preventDefault(); radiusWasAdjusted = true; orbit.radius = Math.max(7.4, Math.min(20, orbit.radius + event.deltaY * .011)); };
      renderer.domElement.addEventListener('pointerdown', down);
      renderer.domElement.addEventListener('pointermove', move);
      renderer.domElement.addEventListener('pointerup', up);
      renderer.domElement.addEventListener('pointercancel', up);
      renderer.domElement.addEventListener('wheel', wheel, { passive: false });

      let phaseVisual = phaseRef.current;
      const tempVecA = new THREE.Vector3();
      const tempVecB = new THREE.Vector3();
      const tempVecC = new THREE.Vector3();
      const tempVecD = new THREE.Vector3();
      /** 苹果派「被带进隐状态」的一趟循环：飞进走廊 → 沿 h₁→h₂→h₃ 下走 → 淡出重来。 */
      const PIE_CARRY_MS = 9000;
      let pieCarryStart = 0;
      let pieCarrying = false;
      let introAt = 0;
      let frame = 0;

      const animate = () => {
        frame = requestAnimationFrame(animate);
        const now = performance.now();
        phaseVisual += (phaseRef.current - phaseVisual) * .038;
        if (Math.abs(phaseVisual - phaseRef.current) < .002) phaseVisual = phaseRef.current;
        if (!radiusWasAdjusted) orbit.radius += ((phaseVisual < .45 ? 7.1 : phaseVisual < 3 ? 12.5 : 11.8) - orbit.radius) * .045;
        positionCamera();

        const copyProgress = smoothstep(.18, .95, phaseVisual);
        const rawFade = 1 - smoothstep(2.35, 2.92, phaseVisual);
        // 🌟 03 到 04 的球体融合过渡（Z轴坍缩融合动画）
        const collapseToCenter = smoothstep(2.05, 2.85, phaseVisual);

        rawNetworks.forEach((group, index) => {
          const targetX = group.userData.targetX * copyProgress;
          const targetY = group.userData.targetY * copyProgress;
          const targetZ = group.userData.targetZ * copyProgress;
          group.position.x += (targetX - group.position.x) * .09;
          group.position.y += (targetY - group.position.y) * .09;
          group.position.z += (targetZ - group.position.z) * .09;

          const targetScale = index === 0
            ? 1 + (rawNetworkScale - 1) * copyProgress
            : Math.max(.001, rawNetworkScale * copyProgress);
          group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), .09);

          // 核心融合：各层散开的球向 Z=0 汇拢合并
          const layers = group.userData.allLayerNodes;
          if (layers) {
            layers.forEach((layer: any[]) => {
              layer.forEach((node: any) => {
                const targetZPos = node.userData.originalZ * (1 - collapseToCenter);
                node.position.z += (targetZPos - node.position.z) * .12;
                if (node.material) {
                  node.material.opacity = rawFade * 0.95;
                }
              });
            });
          }

          group.updateMatrixWorld();
          group.visible = phaseVisual < 2.95;
        });

        // 内部杂乱连线在融合过程中快速消融
        const internalLineOpacity = (1 - smoothstep(2.0, 2.35, phaseVisual)) * 0.34;
        const isInternalLineVisible = phaseVisual < 2.4;
        rawInternalLines.forEach((l) => {
          l.visible = isInternalLineVisible;
          if (isInternalLineVisible) {
            l.material.opacity = internalLineOpacity;
          }
        });

        // 跨时步全连接线淡入淡出（在 04 阶段完全隐藏，绝不残留）
        const stateLinkOpacity = smoothstep(1.25, 1.92, phaseVisual) * (1 - smoothstep(2.1, 2.65, phaseVisual));
        recurrentLinesMesh.visible = stateLinkOpacity > 0.005;
        if (recurrentLinesMesh.visible) {
          recurrentMat.opacity = stateLinkOpacity * 0.85;
          const positions = recurrentGeo.attributes.position.array as Float32Array;
          let ptr = 0;
          for (let i = 0; i < recurrentPairs.length; i++) {
            recurrentPairs[i].fromNode.getWorldPosition(tempVecA);
            recurrentPairs[i].toNode.getWorldPosition(tempVecB);
            positions[ptr++] = tempVecA.x;
            positions[ptr++] = tempVecA.y;
            positions[ptr++] = tempVecA.z;
            positions[ptr++] = tempVecB.x;
            positions[ptr++] = tempVecB.y;
            positions[ptr++] = tempVecB.z;
          }
          recurrentGeo.attributes.position.needsUpdate = true;
        }

        // ────────────────────────────────────────────
        // 🌟 粒子动画：向右前向计算 + 向下隐状态传递并存
        // ────────────────────────────────────────────
        const allowForward = 1 - smoothstep(2.1, 2.7, phaseVisual);
        const allowRecurrent = smoothstep(1.3, 1.9, phaseVisual) * (1 - smoothstep(2.15, 2.75, phaseVisual));

        particles.forEach((p) => {
          const t = (now * p.speed + p.seed) % 1;

          // 处于时步复制和隐状态阶段时，部分微粒向下运动，部分微粒持续在各时步向右运动
          if (p.flowType === 'recurrent' && allowRecurrent > 0.01 && recurrentPairs.length > 0) {
            const pair = recurrentPairs[p.recurrentPairIdx];
            pair.fromNode.getWorldPosition(tempVecA);
            pair.toNode.getWorldPosition(tempVecB);

            p.mesh.position.lerpVectors(tempVecA, tempVecB, t);
            p.mesh.material.opacity = allowRecurrent * 0.95;
          } else if (allowForward > 0.01) {
            // 前向粒子：在当前已激活的时步网络中向右流动
            const activeStep = phaseVisual < 0.6 ? 0 : p.stepIdx;
            const net = rawNetworks[activeStep];
            const layers = net ? net.userData.allLayerNodes : null;

            if (layers && layers.length >= 3) {
              if (activeStep === 0 && phaseVisual < 0.8) {
                tempVecA.set(-2.55, 0, 0.1);
              } else {
                layers[0][p.inIdx].getWorldPosition(tempVecA);
              }
              layers[0][p.inIdx].getWorldPosition(tempVecB);
              layers[1][p.hidIdx].getWorldPosition(tempVecC);
              layers[2][p.outIdx].getWorldPosition(tempVecD);

              const seg = t * 3;
              if (seg < 1) {
                p.mesh.position.lerpVectors(tempVecA, tempVecB, seg);
              } else if (seg < 2) {
                p.mesh.position.lerpVectors(tempVecB, tempVecC, seg - 1);
              } else {
                p.mesh.position.lerpVectors(tempVecC, tempVecD, seg - 2);
              }
              p.mesh.material.opacity = allowForward * 0.9;
            }
          } else {
            p.mesh.material.opacity = 0;
          }
        });

        // ────────────────────────────────────────────
        // 🌟 04 阶段展开与融合出现
        // ────────────────────────────────────────────
        const mergeProgress = smoothstep(2.35, 2.98, phaseVisual);
        const simpleScale = Math.max(.001, .65 + mergeProgress * .35);
        simple.scale.lerp(new THREE.Vector3(simpleScale, simpleScale, simpleScale), .09);

        const rotateProgress = smoothstep(3.08, 3.94, phaseVisual);
        simpleCells.forEach((item) => {
          const cell = item.cell;
          cell.position.x += (cell.userData.columnX * rotateProgress - cell.position.x) * .1;
          cell.position.y += (cell.userData.rowY * (1 - rotateProgress) - cell.position.y) * .1;
          cell.rotation.z += (rotateProgress * Math.PI / 2 - cell.rotation.z) * .1;

          item.labels.forEach((label: any) => { if (label) label.rotation.z = -cell.rotation.z; });
          item.inputLine.material.opacity += (mergeProgress * .6 - item.inputLine.material.opacity) * .12;
          item.outputLine.material.opacity += (mergeProgress * .6 - item.outputLine.material.opacity) * .12;
          [item.input, item.hidden, item.output].forEach((node: any) => {
            node.material.opacity += (mergeProgress * .98 - node.material.opacity) * .12;
          });
          item.labels.forEach((label: any) => {
            if (label?.material) label.material.opacity += (mergeProgress * .98 - label.material.opacity) * .12;
          });
        });

        // 更新 04 阶段简化的跨时刻连线
        simpleStateLinks.forEach((link, index) => {
          link.visible = mergeProgress > 0.05;
          if (link.visible) {
            simpleCells[index].hidden.getWorldPosition(tempVecA);
            simpleCells[index + 1].hidden.getWorldPosition(tempVecB);
            const posAttr = link.geometry.attributes.position;
            if (posAttr) {
              posAttr.setXYZ(0, tempVecA.x, tempVecA.y, tempVecA.z);
              posAttr.setXYZ(1, tempVecB.x, tempVecB.y, tempVecB.z);
              posAttr.needsUpdate = true;
            }
            link.material.opacity = mergeProgress * 0.85;
          }
        });

        floor.material.opacity = phaseVisual >= 3 ? .36 : .5;

        // ────────────────────────────────────────────
        // 🌟 输入模型：晴天留在输入侧，苹果派在「传递隐状态」这一步飞进 h 走廊
        // ────────────────────────────────────────────
        if (!introAt) introAt = now;
        const introFade = smoothstep(0, 900, now - introAt);
        const exitFade = 1 - smoothstep(2.45, 2.95, phaseVisual);
        const inputFade = introFade * exitFade;
        /** 三层各自的天气与输出，只在「传递隐状态」这一步出现。 */
        const layerFade = smoothstep(1.5, 1.95, phaseVisual) * exitFade;
        const dishFade = (offset: number) => smoothstep(1.62 + offset, 1.98 + offset, phaseVisual) * exitFade;

        if (inputFade > .01) {
          // 第二层的晴天全程停在输入侧，只做很轻的呼吸浮动。
          sunMidModel.position.set(sunMidParked.x, sunMidParked.y + Math.sin(now * .0013) * .07, sunMidParked.z);

          if (phaseVisual > 1.9 && !pieCarrying) { pieCarrying = true; pieCarryStart = now; }
          if (phaseVisual < 1.5) pieCarrying = false;

          let pieFade = 1;
          if (!pieCarrying) {
            memoryPieModel.position.copy(pieParked);
          } else {
            const carryT = ((now - pieCarryStart) / PIE_CARRY_MS) % 1;
            if (carryT < .08) pieFade = carryT / .08;
            if (carryT < .12) {
              memoryPieModel.position.lerpVectors(pieParked, pieArc, carryT / .12);
            } else if (carryT < .24) {
              memoryPieModel.position.lerpVectors(pieArc, pieTop, (carryT - .12) / .12);
            } else if (carryT < .86) {
              const drop = smoothstep(0, 1, (carryT - .24) / .62);
              memoryPieModel.position.lerpVectors(pieTop, pieBottom, drop);
            } else {
              memoryPieModel.position.copy(pieBottom);
              pieFade = 1 - (carryT - .86) / .14;
            }
          }

          sunMidModel.visible = true;
          memoryPieModel.visible = true;
          setGroupOpacity(sunMidMaterials, inputFade);
          setGroupOpacity(memoryPieMaterials, inputFade * pieFade);
        } else {
          sunMidModel.visible = false;
          memoryPieModel.visible = false;
        }

        // 三层天气：最上层晴天、第二层晴天、第三层雨天。
        const layerAwake = layerFade > .01;
        sunTopModel.visible = layerAwake;
        rainModel.visible = layerAwake;
        if (layerAwake) {
          sunTopModel.position.set(sunTopParked.x, sunTopParked.y + Math.sin(now * .0011 + 1.6) * .07, sunTopParked.z);
          rainModel.position.set(rainParked.x, rainParked.y + Math.sin(now * .0012 + 3.1) * .07, rainParked.z);
          setGroupOpacity(sunTopMaterials, layerFade);
          setGroupOpacity(rainMaterials, layerFade);
        }

        // 右侧输出：按规则推出下一道菜（晴天 → 还是苹果派；雨天 → 换成牛排）。
        const dishSlots: Array<{ model: any; materials: any[]; home: any; fade: number }> = [
          { model: topDishModel, materials: topDishMaterials, home: topDishParked, fade: dishFade(0) },
          { model: midDishModel, materials: midDishMaterials, home: midDishParked, fade: dishFade(0.12) },
          { model: bottomDishModel, materials: bottomDishMaterials, home: bottomDishParked, fade: dishFade(0.24) },
        ];
        dishSlots.forEach((slot) => {
          slot.model.visible = slot.fade > .01;
          if (slot.model.visible) {
            slot.model.position.set(slot.home.x, slot.home.y + Math.sin(now * .0014 + slot.home.y) * .05, slot.home.z);
            setGroupOpacity(slot.materials, slot.fade);
          }
        });
        renderer.render(scene, camera);
      };
      animate();

      dispose = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        renderer.domElement.removeEventListener('pointerdown', down);
        renderer.domElement.removeEventListener('pointermove', move);
        renderer.domElement.removeEventListener('pointerup', up);
        renderer.domElement.removeEventListener('pointercancel', up);
        renderer.domElement.removeEventListener('wheel', wheel);
        scene.traverse((item: any) => {
          item.geometry?.dispose?.();
          if (Array.isArray(item.material)) item.material.forEach((mat: any) => mat.dispose?.());
          else item.material?.dispose?.();
        });
        renderer.dispose();
        host.replaceChildren();
      };
    });
    return () => { disposed = true; dispose(); };
  }, []);

  return <div ref={hostRef} className="nrnn-memory-3d" aria-label="从神经网络到循环神经网络的三维动画，可拖拽旋转" />;
}
