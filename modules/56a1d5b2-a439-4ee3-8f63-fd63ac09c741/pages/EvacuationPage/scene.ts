import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createRendering } from './rendering';
import { buildWorld } from './world';
import { createCombat } from './combat';
import { START, EXIT, PICKUPS, aimFromPull, descentDirection, distance, MAX_JUMP, forest, riverX, terrainHeight, type GameState, type Point } from '../../model';

export interface SceneCallbacks { onAim: (p: Point | null) => void; onJump: (p: Point) => void; onPulse: () => void; onReady: () => void; onError: (message: string) => void; onView: (labels: Record<string, { x: number; y: number }>) => void }
export interface SceneAPI { update: (state: GameState) => void; aim: (p: Point | null) => void; project: (p: Point, height?: number) => { x: number; y: number }; dispose: () => void }
export function createScene(host: HTMLDivElement, callbacks: SceneCallbacks): SceneAPI {
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: false }); }
  catch { callbacks.onError('三维画面需要浏览器开启硬件加速。请开启后重新进入。'); throw new Error('WebGL unavailable'); }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#142e35');
  const environment = new RoomEnvironment(); const pmrem = new THREE.PMREMGenerator(renderer); const environmentMap=pmrem.fromScene(environment,.04); scene.environment=environmentMap.texture; scene.environmentIntensity=.25; environment.dispose();pmrem.dispose();
  const camera = new THREE.OrthographicCamera(-20.5, 20.5, 10, -10, .1, 150);
  const rendering=createRendering(renderer,scene,camera);
  const hemi = new THREE.HemisphereLight('#d8f4ff', '#a3bb8b', 1.6); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff9e9', 3.1); sun.position.set(-15, 30, 12); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 25, bottom: -25, near: 1, far: 85 }); sun.shadow.bias = -.0003; sun.shadow.normalBias = .025; sun.shadow.radius = 3; scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#bddcd9', .8); fill.position.set(15, 18, -18); scene.add(fill);
  const world = buildWorld(); scene.add(world.root);
  const combat=createCombat(scene);let shakeAt=-10,lastShadow=0;
  const player = new THREE.Group(); scene.add(player);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(.6, 32, 24), new THREE.MeshPhysicalMaterial({ color: '#52b7f4', emissive: '#55cfff', emissiveIntensity: 3, metalness: .12, roughness: .15, clearcoat: 1 })); orb.position.y = .68; orb.castShadow = true; player.add(orb);
  const pixels = new Uint8Array(64*64*4);for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4,r=Math.hypot((x-31.5)/31.5,(y-31.5)/31.5);pixels[i]=45;pixels[i+1]=190;pixels[i+2]=255;pixels[i+3]=Math.round(Math.max(0,1-r)**3*155);}
  const glowTexture=new THREE.DataTexture(pixels,64,64);glowTexture.needsUpdate=true;const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,transparent:true}));glow.position.y=.68;glow.scale.set(2.8,2.8,1);glow.renderOrder=8;player.add(glow);
  orb.material.depthTest=false;orb.renderOrder=9;
  const haloMat = new THREE.MeshBasicMaterial({ color: '#d4f7df', transparent: true, opacity: .85, depthWrite: false, side: THREE.DoubleSide });
  const playerRing = new THREE.Mesh(new THREE.RingGeometry(.85, .9, 64), haloMat); playerRing.rotation.x = -Math.PI / 2; playerRing.position.y = .08; player.add(playerRing);
  const contact = new THREE.Mesh(new THREE.CircleGeometry(.43, 32), new THREE.MeshBasicMaterial({ color: '#254942', transparent: true, opacity: .2, depthWrite: false })); contact.rotation.x = -Math.PI / 2; contact.position.y = .055; player.add(contact);
  player.position.set(START.x, terrainHeight(START.x, START.z), START.z);
  const charge=new THREE.Group();scene.add(charge);charge.visible=false;
  const rune=new THREE.Mesh(new THREE.TorusGeometry(1.15,.045,8,64),new THREE.MeshBasicMaterial({color:new THREE.Color('#b499ff').multiplyScalar(2.5),transparent:true,opacity:.9,depthWrite:false}));rune.rotation.x=Math.PI/2;charge.add(rune);
  const direction=new THREE.ArrowHelper(new THREE.Vector3(1,0,0),new THREE.Vector3(),2.2,'#d6baff',.7,.55);charge.add(direction);
  const arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 2, '#93e6d5', .4, .24); arrow.visible = false; scene.add(arrow);
  const echoGeo = new THREE.RingGeometry(.63, .68, 64); const echoes: { mesh: THREE.Mesh; start: number }[] = [];
  const flash = new THREE.PointLight('#b9fff0', 0, 3); scene.add(flash);
  const rescueBeam = new THREE.Mesh(new THREE.CylinderGeometry(.3, 1.3, 3.7, 32, 1, true), new THREE.MeshBasicMaterial({ color: '#d4edd1', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })); rescueBeam.position.set(EXIT.x, 2.1, EXIT.z); scene.add(rescueBeam);
  const vector = new THREE.Vector3();
  let state: GameState | null = null, aimPoint: Point | null = null, disposed = false, ready = false, assetReady = false, lastView = 0;
  world.loaded.then(() => { if (!disposed) {assetReady = true;renderer.shadowMap.needsUpdate=true;} else world.root.traverse(o => { const m=o as THREE.Mesh;if(m.geometry)m.geometry.dispose();const mats=m.material?(Array.isArray(m.material)?m.material:[m.material]):[];mats.forEach(material=>{Object.values(material).forEach(value=>{if(value instanceof THREE.Texture)value.dispose();});material.dispose();});if(o instanceof THREE.InstancedMesh)o.dispose(); }); }).catch(() => { if (!disposed) callbacks.onError('地图资源加载失败，请重新进入。'); });
  let motion: { from: Point; to: Point; start: number } | null = null;
  let rescueStart = 0, lastMoves = 0;
  const raycaster = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  let dragging = false, pointerId: number | null = null, dragAnchor: Point | null = null;
  const now = () => performance.now() / 1000;
  function point(event: PointerEvent): Point | null {
    const b = renderer.domElement.getBoundingClientRect(); raycaster.setFromCamera(new THREE.Vector2((event.clientX - b.left) / b.width * 2 - 1, -(event.clientY - b.top) / b.height * 2 + 1), camera);
    const hit = raycaster.ray.intersectPlane(plane, vector); return hit ? { x: hit.x, z: hit.z } : null;
  }
  function updateAim(p:Point|null) {
    aimPoint=p;charge.visible=Boolean(p&&state);
    if(!p||!state)return;
    const dx=p.x-state.position.x,dz=p.z-state.position.z,n=Math.hypot(dx,dz)||1,power=Math.min(1,n/MAX_JUMP);
    charge.position.set(state.position.x,terrainHeight(state.position.x,state.position.z)+.25,state.position.z);
    direction.setDirection(new THREE.Vector3(dx/n,0,dz/n));direction.setLength(1.4+power*1.5,.6,.45);
    rune.scale.setScalar(1+power*.4);(rune.material as THREE.MeshBasicMaterial).color.set(power>.82?'#ff986e':'#b499ff').multiplyScalar(2.5);
  }
  const cancelDrag = () => { dragging = false; pointerId = null; dragAnchor = null; updateAim(null); callbacks.onAim(null); host.classList.remove('gd-dragging'); };
  const down = (event: PointerEvent) => {
    if(event.button===2){event.preventDefault();callbacks.onPulse();return;}
    if (event.button !== 0 || !state || (state.phase !== 'playing'&&state.phase!=='rescuing') || motion) return;
    const p = point(event); if (!p || distance(p, state.position) > 1.4) return;
    event.preventDefault(); dragging = true; dragAnchor = p; pointerId = event.pointerId; renderer.domElement.setPointerCapture(event.pointerId); host.classList.add('gd-dragging');
  };
  const move = (event: PointerEvent) => { if (!dragging || pointerId !== event.pointerId || !state || !dragAnchor) return; const p = point(event); if (!p) return; const a = aimFromPull(state.position, {x:state.position.x+p.x-dragAnchor.x,z:state.position.z+p.z-dragAnchor.z}); updateAim(a); callbacks.onAim(a); };
  const up = (event: PointerEvent) => { if (!dragging || pointerId !== event.pointerId) return; const to = aimPoint; cancelDrag(); if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId); if (to) callbacks.onJump(to); };
  const cancel = (event: PointerEvent) => { if (pointerId === event.pointerId) cancelDrag(); };
  const contextMenu=(event:Event)=>event.preventDefault();renderer.domElement.addEventListener('contextmenu',contextMenu);
  renderer.domElement.addEventListener('pointerdown', down); renderer.domElement.addEventListener('pointermove', move); renderer.domElement.addEventListener('pointerup', up); renderer.domElement.addEventListener('pointercancel', cancel); renderer.domElement.addEventListener('lostpointercapture', cancel);
  let halfWidth = 27;
  const resize = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; const halfHeight = halfWidth * h / w; camera.left = -halfWidth; camera.right = halfWidth; camera.top = halfHeight; camera.bottom = -halfHeight; camera.updateProjectionMatrix(); renderer.setSize(w, h, false);rendering.resize(w,h);renderer.shadowMap.needsUpdate=true; };
  const wheel = (event: WheelEvent) => { if (dragging) return; event.preventDefault(); halfWidth = THREE.MathUtils.clamp(halfWidth + event.deltaY * .012, 18, 32); resize(); };
  host.addEventListener('wheel', wheel, {passive:false});
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  const project = (p: Point, height = .5) => { vector.set(p.x, terrainHeight(p.x, p.z) + height, p.z).project(camera); return { x: (vector.x + 1) * 50, y: (1 - vector.y) * 50 }; };
  const echo = (p: Point, time: number) => { const m = new THREE.Mesh(echoGeo, new THREE.MeshBasicMaterial({ color: '#d7fff0', transparent: true, opacity: .8, depthWrite: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(p.x, terrainHeight(p.x, p.z) + .12, p.z); scene.add(m); echoes.push({ mesh: m, start: time }); };
  const update = (next: GameState) => {
    if (state && next.run !== state.run) { motion = null; rescueStart = 0;  lastMoves = 0; player.visible = true; orb.visible = true;glow.visible=true;flash.intensity=0;player.scale.setScalar(1); player.position.set(next.position.x, terrainHeight(next.position.x, next.position.z), next.position.z); cancelDrag(); }
    if (state && next.moves.length > lastMoves) { motion = { from: { x: player.position.x, z: player.position.z }, to: next.position, start: now() }; echo(motion.from, now());combat.burst(motion.from,now(),'#b68dff');combat.rift(motion.from,now()); }
    if (next.phase === 'rescuing' && state?.phase !== 'rescuing') { rescueStart = now();  cancelDrag(); }
    if (next.phase !== 'playing' && dragging) cancelDrag();
    if(state&&next.collected.length>state.collected.length){combat.burst(next.position,now(),'#ffd578',30);combat.ring(next.position,now(),2,'#ffd578');}
    if(state&&next.pulseAt!==state.pulseAt){combat.ring(next.position,now(),5,'#dbadff');combat.burst(next.position,now(),'#d3a7ff',48);shakeAt=now();}
    if(state&&next.damageAt!==state.damageAt)shakeAt=now();
    state = next; lastMoves = next.moves.length;combat.update(next,now());world.destroy(next.brokenTrees,now());
    world.heat.visible = next.scan && next.collected.includes('scanner');
    world.pickups.forEach((g,id)=>{const opened=next.collected.includes(id),progress=opened?1:next.search?.id===id?next.search.progress:0;g.children[2].rotation.x=-progress*.8;g.children[2].position.y=.72+progress*.3;g.children[5].visible=!opened;g.children[6].visible=!opened;});
    host.style.cursor = next.phase === 'playing' ? 'grab' : 'default';
  };
  let animationFrame = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animate() {
    if (disposed) return; animationFrame = requestAnimationFrame(animate); const t = now();
    world.tick(t);combat.tick(t);rune.rotation.z=t*2;
    if(motion||t-lastShadow>.18){renderer.shadowMap.needsUpdate=true;lastShadow=t;}
    world.rotor.rotation.y = t * 35; world.tailRotor.rotation.x = t * 48;
    world.pickups.forEach(g => { const gem = g.children[5]; if (gem) { gem.rotation.y = t * .8; gem.position.y = 1.32 + (reduced ? 0 : Math.sin(t * 2) * .1); } });
    if (motion) {
      const r=Math.min(1,(t-motion.start)/(reduced?.15:.48));
      const ease=THREE.MathUtils.smoothstep(r,.13,.68),x=motion.from.x+(motion.to.x-motion.from.x)*ease,z=motion.from.z+(motion.to.z-motion.from.z)*ease;
      player.position.set(x,terrainHeight(x,z),z);orb.visible=r<.12||r>.72;glow.visible=orb.visible;
      orb.scale.setScalar(r<.12?Math.max(.05,1-r*7):Math.min(1.4,.3+(r-.72)*5));
      flash.position.copy(player.position).add(new THREE.Vector3(0,.8,0));flash.intensity=r>.7?(1-r)*22:0;
      if(r===1){echo(motion.to,t);combat.ring(motion.to,t,3);combat.rift(motion.to,t);combat.burst(motion.to,t,'#99eeff',36);const last=state?.moves.at(-1);if(last?.broken.length){last.broken.forEach(id=>{const tree=forest(riverX).find(p=>p.id===id);if(tree)combat.burst(tree,t,'#b5cb78',14);});}shakeAt=t;motion=null;orb.visible=true;glow.visible=true;flash.intensity=0;}
    } else { orb.position.y = .68 + (reduced ? 0 : Math.sin(t * 2.5) * .055); orb.scale.setScalar(1); }
    for (let i = echoes.length - 1; i >= 0; i--) { const e = echoes[i], r = (t - e.start) / .85; e.mesh.scale.setScalar(1 + r * 1.5); (e.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, .6 * (1 - r)); if (r >= 1) { scene.remove(e.mesh); (e.mesh.material as THREE.Material).dispose(); echoes.splice(i, 1); } }
    playerRing.scale.setScalar(1 + (reduced ? 0 : Math.sin(t * 2) * .05));
    // The viewport follows the actual animated orb, rather than jumping to the logical landing point.
    const follow = player.position.clone().add(new THREE.Vector3(0, orb.position.y, 0));
    const kick=reduced?0:Math.max(0,1-(t-shakeAt)/.32)*.3;camera.position.set(follow.x - 17+Math.sin(t*95)*kick, follow.y + 40, follow.z + 27+Math.cos(t*85)*kick); camera.lookAt(follow); camera.updateMatrixWorld();
    sun.position.set(follow.x - 15, 30, follow.z + 12); sun.target.position.set(follow.x, 0, follow.z); sun.target.updateMatrixWorld();
    world.helicopter.visible = Boolean(state?.phase === 'rescuing' || state?.phase === 'won');
    arrow.visible = Boolean(state?.phase === 'playing' && state.collected.includes('compass') && !motion && !aimPoint);
    if (state && arrow.visible) { const d = descentDirection(state.position); arrow.position.set(state.position.x, terrainHeight(state.position.x, state.position.z) + .21, state.position.z); arrow.setDirection(new THREE.Vector3(d.x, 0, d.z)); }
    if (rescueStart && state && (state.phase === 'rescuing' || state.phase === 'won')) {
      const elapsed=state.phase==='won'?8:state.extraction;
      const approach=THREE.MathUtils.clamp((elapsed-4)/3,0,1);
      world.helicopter.position.set(EXIT.x+12*(1-approach),2.5+5*(1-approach),EXIT.z-8*(1-approach));
      if(elapsed>7){player.position.y=terrainHeight(state.position.x,state.position.z)+(elapsed-7)*2;player.scale.setScalar(Math.max(.01,1-(elapsed-7)*.85));}
      if(state.phase==='won'){player.visible=false;world.helicopter.position.y=4+Math.max(0,t-rescueStart-8)*2;}
      (rescueBeam.material as THREE.MeshBasicMaterial).opacity=elapsed>6.5&&elapsed<8?.14:0;
    } else { world.helicopter.position.set(EXIT.x + 1.4, 4.1 + (reduced ? 0 : Math.sin(t * 1.5) * .07), EXIT.z + 1.6); player.scale.setScalar(1); (rescueBeam.material as THREE.MeshBasicMaterial).opacity = 0; }
    rendering.render();
    if (assetReady && !ready) { ready = true; callbacks.onReady(); }
    if (ready && t - lastView > .06) { lastView = t; const labels: Record<string,{x:number;y:number}> = {}; const add = (id:string,p:Point,h:number) => { const v=project(p,h); if(v.x>4&&v.x<96&&v.y>12&&v.y<82) labels[id]=v; }; PICKUPS.forEach(p=>add(p.id,p.point,1.7)); if(state?.discoveredExit) add('exit',EXIT,.6); callbacks.onView(labels); }
  }
  animationFrame = requestAnimationFrame(animate);
  return { update, aim: updateAim, project, dispose: () => {
    disposed = true; cancelAnimationFrame(animationFrame); observer.disconnect(); host.removeEventListener('wheel',wheel);
    renderer.domElement.removeEventListener('contextmenu',contextMenu);renderer.domElement.removeEventListener('pointerdown', down); renderer.domElement.removeEventListener('pointermove', move); renderer.domElement.removeEventListener('pointerup', up); renderer.domElement.removeEventListener('pointercancel', cancel); renderer.domElement.removeEventListener('lostpointercapture', cancel);
    const geometries = new Set<THREE.BufferGeometry>([echoGeo]), materials = new Set<THREE.Material>(); scene.traverse(object => { const m = object as THREE.Mesh; if (m.geometry) geometries.add(m.geometry); if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach(v => { materials.add(v); Object.values(v).forEach(value=>{if(value instanceof THREE.Texture)value.dispose();}); }); if (object instanceof THREE.InstancedMesh) object.dispose(); }); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());rendering.dispose(); environmentMap.dispose();sun.shadow.dispose(); renderer.dispose(); renderer.domElement.remove();
  } };
}
