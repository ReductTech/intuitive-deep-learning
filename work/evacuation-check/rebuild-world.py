from pathlib import Path
p=Path('modules/Gradient-Descent/pages/EvacuationPage/world.ts')
s=p.read_text(encoding='utf-8')
heli=s[s.index('function helicopterModel'):s.index('function helipad')]
pick=s[s.index('function pickup'):s.index('function heatmap')]
header='''import * as THREE from 'three';
import { moduleAssetUrl } from '../../../shared/react';
import { EXIT, PICKUPS, WORLD_WIDTH, WORLD_DEPTH, radiation, type PickupId } from '../../model';

export interface World { root: THREE.Group; rotor: THREE.Group; tailRotor: THREE.Group; helicopter: THREE.Group; pickups: Map<PickupId, THREE.Group>; heat: THREE.Mesh; loaded: Promise<void> }
function material(color: string, metalness = 0) { return new THREE.MeshStandardMaterial({ color, metalness, roughness: .56 }); }
function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, color: string, x: number, y: number, z: number, metal = 0) { const m = new THREE.Mesh(geometry, material(color, metal)); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; }
function box(parent: THREE.Object3D, size: [number, number, number], color: string, pos: [number, number, number], metal = 0) { return mesh(parent, new THREE.BoxGeometry(...size), color, ...pos, metal); }
function cylinder(parent: THREE.Object3D, top: number, bottom: number, height: number, color: string, pos: [number, number, number], segments = 16, metal = 0) { return mesh(parent, new THREE.CylinderGeometry(top, bottom, height, segments), color, ...pos, metal); }
function beam(parent: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, radius: number, color: string) { const m = cylinder(parent, radius, radius, a.distanceTo(b), color, [0, 0, 0], 8); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); return m; }
function ring(parent: THREE.Object3D, radius: number, width: number, color: string, x: number, y: number, z: number, opacity = 1) { const m = new THREE.Mesh(new THREE.RingGeometry(radius - width, radius, 64), new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); parent.add(m); return m; }
const terrainHeight = (_x: number, _z: number) => 0;
'''
heli=heli.replace("'#e5e7d3'", "'#f4fbff'").replace("'#2c555e'", "'#164d96'").replace("'#355b62'", "'#164d96'").replace("'#cddac9'", "'#e3f1fb'").replace("'#d7dfc9'", "'#e3f1fb'")
footer='''
export function buildWorld(): World {
  const root = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(WORLD_WIDTH, WORLD_DEPTH); geometry.rotateX(-Math.PI / 2);
  const landMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const land = new THREE.Mesh(geometry, landMaterial); root.add(land);
  const loaded = new THREE.TextureLoader().loadAsync(moduleAssetUrl('56a1d5b2-a439-4ee3-8f63-fd63ac09c741', 'evacuation/world-map-hd.webp')).then(texture => { texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8; landMaterial.map = texture; landMaterial.needsUpdate = true; });
  const shadow = new THREE.Mesh(geometry, new THREE.ShadowMaterial({ opacity: .21 })); shadow.rotation.copy(land.rotation); shadow.position.y = .012; shadow.receiveShadow = true; root.add(shadow);
  const heli = helicopterModel(root); heli.helicopter.visible = false;
  const pickups = new Map<PickupId, THREE.Group>(); PICKUPS.forEach(p => pickups.set(p.id, pickup(root, p.id, p.point.x, p.point.z, p.color)));
  const heatGeo = new THREE.PlaneGeometry(WORLD_WIDTH, WORLD_DEPTH, 200, 144); heatGeo.rotateX(-Math.PI / 2);
  const pos = heatGeo.getAttribute('position'), colors: number[] = [];
  const stops = [new THREE.Color('#25d9dd'), new THREE.Color('#53c887'), new THREE.Color('#ffe651'), new THREE.Color('#ff942b'), new THREE.Color('#f13738')];
  for (let i = 0; i < pos.count; i++) { pos.setY(i, .04); const v = Math.min(3.999, radiation({x:pos.getX(i),z:pos.getZ(i)}) / 10 * 4), idx = Math.floor(v); const c = stops[idx].clone().lerp(stops[idx+1], v-idx); colors.push(c.r,c.g,c.b); }
  heatGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const heat = new THREE.Mesh(heatGeo,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.45,depthWrite:false,side:THREE.DoubleSide})); heat.visible=false; root.add(heat);
  return {root,pickups,heat,loaded,...heli};
}
'''
p.write_text(header+heli+pick+footer,encoding='utf-8')
