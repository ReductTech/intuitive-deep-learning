import * as THREE from 'three';
import { EXIT, PICKUPS, WORLD_WIDTH, WORLD_DEPTH, radiation, terrainHeight, landHeight, type PickupId } from '../../model';
import { landscape } from './landscape';

export interface World { root: THREE.Group; rotor: THREE.Group; tailRotor: THREE.Group; helicopter: THREE.Group; pickups: Map<PickupId, THREE.Group>; heat: THREE.Mesh; loaded: Promise<void>; tick: (time: number) => void; destroy: (ids:string[], time:number) => void }
function material(color: string, metalness = 0) { return new THREE.MeshStandardMaterial({ color, metalness, roughness: .56 }); }
function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, color: string, x: number, y: number, z: number, metal = 0) { const m = new THREE.Mesh(geometry, material(color, metal)); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; }
function box(parent: THREE.Object3D, size: [number, number, number], color: string, pos: [number, number, number], metal = 0) { return mesh(parent, new THREE.BoxGeometry(...size), color, ...pos, metal); }
function cylinder(parent: THREE.Object3D, top: number, bottom: number, height: number, color: string, pos: [number, number, number], segments = 16, metal = 0) { return mesh(parent, new THREE.CylinderGeometry(top, bottom, height, segments), color, ...pos, metal); }
function beam(parent: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, radius: number, color: string) { const m = cylinder(parent, radius, radius, a.distanceTo(b), color, [0, 0, 0], 8); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); return m; }
function ring(parent: THREE.Object3D, radius: number, width: number, color: string, x: number, y: number, z: number, opacity = 1) { const m = new THREE.Mesh(new THREE.RingGeometry(radius - width, radius, 64), new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); parent.add(m); return m; }
function helicopterModel(parent: THREE.Object3D) {
  const h = new THREE.Group(); parent.add(h); h.position.set(EXIT.x + 1.4, 4.1, EXIT.z + 1.6); h.rotation.y = -1.2;h.scale.setScalar(1.3);
  const body = mesh(h, new THREE.SphereGeometry(1, 20, 12), '#f4fbff', 0, 0, 0, .22); body.scale.set(.72, .53, 1.35);
  const nose = mesh(h, new THREE.SphereGeometry(1, 16, 10), '#284d59', 0, .1, .72, .55); nose.scale.set(.63, .4, .69);
  box(h, [1.45, .16, 1.5], '#164d96', [0, -.15, -.22], .2);
  for (const s of [-1, 1]) {
    for (const z of [-.3, .25]) box(h, [.015, .31, .36], '#335762', [s * .708, .15, z], .5);
    box(h, [.025, .39, .022], '#d9dfcc', [s * .721, .1, -.51]);
    box(h, [.12, .07, 2.1], '#324d4e', [s * .76, -.83, -.05], .4);
    for (const z of [-.55, .65]) beam(h, new THREE.Vector3(s * .5, -.3, z), new THREE.Vector3(s * .76, -.8, z), .045, '#56696a');
  }
  const tail = cylinder(h, .13, .29, 2.8, '#e3f1fb', [0, .2, -2.2], 8); tail.rotation.x = Math.PI / 2 + .1;
  box(h, [.07, .85, .6], '#164d96', [0, .57, -3.4]); box(h, [1.35, .06, .42], '#e3f1fb', [0, .29, -2.9]);
  cylinder(h, .1, .1, .65, '#596a64', [0, .7, -.22], 12, .6);
  const rotor = new THREE.Group(); rotor.position.set(0, 1, -.22); h.add(rotor);
  for (const a of [0, Math.PI / 2]) { const blade = box(rotor, [5, .025, .13], '#354d4c', [0, 0, 0]); blade.rotation.y = a; }
  cylinder(rotor, .15, .15, .12, '#73877c', [0, .05, 0]);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.5, 64), new THREE.MeshBasicMaterial({ color: '#d4decf', transparent: true, opacity: .07, side: THREE.DoubleSide, depthWrite: false })); disc.rotation.x = -Math.PI / 2; rotor.add(disc);
  const tailRotor = new THREE.Group(); tailRotor.position.set(.13, .48, -3.4); h.add(tailRotor); box(tailRotor, [.05, 1.13, .075], '#3c5755', [0, 0, 0]); box(tailRotor, [.05, .075, 1.13], '#3c5755', [0, 0, 0]);
  const lamp = mesh(h, new THREE.SphereGeometry(.06, 8, 6), '#df7151', -.75, .1, -.5); (lamp.material as THREE.MeshStandardMaterial).emissive.set('#e54420');
  return { helicopter: h, rotor, tailRotor };
}
function pickup(parent: THREE.Object3D, id: PickupId, x: number, z: number, color: string) {
  const g = new THREE.Group(); g.position.set(x, terrainHeight(x, z), z); parent.add(g);
  cylinder(g, .68, .75, .15, '#655f50', [0, .09, 0]);
  box(g, [.73, .53, .55], id === 'medicine' ? '#849776' : '#8e795b', [0, .4, 0]);
  box(g, [.82, .1, .64], '#cbc7a5', [0, .72, 0]);
  for (const x of [-.25, .25]) box(g, [.065, .58, .67], '#4b5d54', [x, .43, 0]);
  const gem = mesh(g, new THREE.OctahedronGeometry(.2), color, 0, 1.32, 0); (gem.material as THREE.MeshStandardMaterial).emissive.set(color).multiplyScalar(2.3);
  ring(g, .91, .035, color, 0, .16, 0, .8); return g;
}

export function buildWorld(): World {
  const root = new THREE.Group();
  const terrain = landscape(root);
  const heli = helicopterModel(root); heli.helicopter.visible = false;
  const pickups = new Map<PickupId, THREE.Group>(); PICKUPS.forEach(p => pickups.set(p.id, pickup(root, p.id, p.point.x, p.point.z, p.color)));
  const heatGeo = new THREE.PlaneGeometry(WORLD_WIDTH, WORLD_DEPTH, 200, 144); heatGeo.rotateX(-Math.PI / 2);
  const pos = heatGeo.getAttribute('position'), colors: number[] = [];
  const stops = [new THREE.Color('#25d9dd'), new THREE.Color('#53c887'), new THREE.Color('#ffe651'), new THREE.Color('#ff942b'), new THREE.Color('#f13738')];
  for (let i = 0; i < pos.count; i++) { pos.setY(i, Math.max(-.24,landHeight(pos.getX(i),pos.getZ(i)))+.065); const v = Math.min(3.999, radiation({x:pos.getX(i),z:pos.getZ(i)}) / 10 * 4), idx = Math.floor(v); const c = stops[idx].clone().lerp(stops[idx+1], v-idx); colors.push(c.r,c.g,c.b); }
  heatGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const heat = new THREE.Mesh(heatGeo,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.45,depthWrite:false,side:THREE.DoubleSide})); heat.visible=false; root.add(heat);
  return {root,pickups,heat,...terrain,...heli};
}
