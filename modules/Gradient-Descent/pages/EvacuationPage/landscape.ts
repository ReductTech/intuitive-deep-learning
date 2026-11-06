import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { moduleAssetUrl } from '../../../shared/react';
import { EXIT, START, PICKUPS, BRIDGES, WORLD_WIDTH, WORLD_DEPTH, landHeight, terrainHeight, riverX, distance, forest, type Point } from '../../model';

const clock = { value: 0 };
const uuid = '56a1d5b2-a439-4ee3-8f63-fd63ac09c741';
const mat = (color: string, roughness = .88, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
function block(parent: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, d: number, color: string) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color)); m.position.set(x,y,z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
}
function rod(parent: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,a.distanceTo(b),8),mat(color,.6,.35));m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());m.castShadow=true;parent.add(m);return m;
}
const mainRoute = new THREE.CatmullRomCurve3([[-45,13],[-24,14],[-11,10.5],[-10.5,-3],[0,-8],[11,-6.8],[21,-7.5],[27,-15],[30,-20.4],[43,-27]].map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal');
const route = mainRoute.getPoints(220).map(p=>({x:p.x,z:p.z}));
const roadDistance=(p:Point)=>Math.min(...route.map(q=>distance(p,q)));
function reserved(p:Point) {
  return Math.abs(p.x-riverX(p.z))<4.3 || roadDistance(p)<1.45 || distance(p,START)<2.5 || distance(p,EXIT)<4.5 || PICKUPS.some(a=>distance(p,a.point)<2.1)
    || (p.x>-45&&p.x<-23&&p.z>-6&&p.z<8) || (p.x>31&&p.x<45&&p.z>2&&p.z<13);
}
function ribbon(parent:THREE.Object3D,points:Point[],width:number,color:string,offset=.035) {
 const v:number[]=[],indices:number[]=[];
 points.forEach((p,i)=>{const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next.x-prev.x,dz=next.z-prev.z,n=Math.hypot(dx,dz)||1;for(const s of [-1,1]){const x=p.x+s*dz/n*width/2,z=p.z-s*dx/n*width/2;v.push(x,terrainHeight(x,z)+offset,z);}if(i<points.length-1){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}});
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setIndex(indices);geo.computeVertexNormals();const m=new THREE.Mesh(geo,mat(color));m.receiveShadow=true;parent.add(m);return m;
}
function coolingTower(parent:THREE.Object3D,x:number,z:number) {
 const g=new THREE.Group();g.position.set(x,landHeight(x,z),z);parent.add(g);
 const profile=[new THREE.Vector2(2.3,.35),new THREE.Vector2(2.15,1.1),new THREE.Vector2(1.66,2.9),new THREE.Vector2(1.38,4.8),new THREE.Vector2(1.45,6.2),new THREE.Vector2(1.7,7.4),new THREE.Vector2(1.56,7.4),new THREE.Vector2(1.3,6.2),new THREE.Vector2(1.24,4.8),new THREE.Vector2(1.52,2.9),new THREE.Vector2(2,1.1)];
 const tower=new THREE.Mesh(new THREE.LatheGeometry(profile,64),mat('#b7b7aa'));tower.castShadow=tower.receiveShadow=true;g.add(tower);
 const inside=new THREE.Mesh(new THREE.CircleGeometry(1.4,48),mat('#303b3e'));inside.rotation.x=-Math.PI/2;inside.position.y=4.8;g.add(inside);
 for(const [r,y]of [[2.31,.35],[1.72,7.4],[1.59,7.28]]){const band=new THREE.Mesh(new THREE.TorusGeometry(r,.07,8,64),mat('#737c7c'));band.rotation.x=Math.PI/2;band.position.y=y;g.add(band);}
 for(let i=0;i<24;i++){const a=i/24*Math.PI*2;rod(g,new THREE.Vector3(Math.cos(a)*2.15,.05,Math.sin(a)*2.15),new THREE.Vector3(Math.cos(a)*2.15,.8,Math.sin(a)*2.15),.07,'#6b7776');}
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const path=profile.slice(0,6).map(p=>new THREE.Vector3(Math.cos(a)*p.x,p.y,Math.sin(a)*p.x));const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(path),new THREE.LineBasicMaterial({color:'#7c8986',transparent:true,opacity:.3}));g.add(line);}
 const sign=block(g,0,2,2.17,1.5,1.4,.08,'#edb936');const disc=new THREE.Mesh(new THREE.CircleGeometry(.5,32),new THREE.MeshBasicMaterial({color:'#263334'}));disc.position.set(0,2,2.225);g.add(disc);
 for(let i=0;i<3;i++){const sector=new THREE.Mesh(new THREE.CircleGeometry(.45,24, i*Math.PI*2/3,Math.PI/3),new THREE.MeshBasicMaterial({color:'#edb936'}));sector.position.set(0,2,2.23);g.add(sector);}sign.castShadow=false;
 return g;
}
function ruin(parent:THREE.Object3D,x:number,z:number,angle:number) {
 const g=new THREE.Group();g.position.set(x,landHeight(x,z),z);g.rotation.y=angle;parent.add(g);
 block(g,0,.12,0,3.4,.24,3,'#7c867c');
 for(const s of [-1,1]) {
  for(let i=0;i<4;i++){block(g,s*1.45,1.5,-1.25+i*.83,.22,2.9,.24,'#a8aea0');block(g,-1.4+i*.93,1.5,s*1.26,.23,2.9,.2,'#9da699');}
  for(const y of [.55,1.65,2.7]){block(g,s*1.45,y,0,.25,.35,2.75,'#b8bba8');block(g,0,y,s*1.26,3.1,.35,.24,'#b8bba8');}
 }
 block(g,.58,3,0,1.7,.22,2.6,'#909b92');block(g,-.8,3,-.87,.85,.2,.9,'#a3aa9b');
 for(let i=0;i<6;i++){const r=block(g,-1.5+i*.5,3.15+.11*(i%2),-1.2,.035,.55,.035,'#4b6260');r.rotation.z=.18*(i%3-1);}
 for(let i=0;i<7;i++){const r=block(g,Math.sin(i*9)*1.8,.2,Math.cos(i*7)*1.7,.25+.1*(i%3),.35,.45,'#9b9b88');r.rotation.set(.2*i,i,.2);}
}
type Placement={id?:string;x:number;z:number;height:number;angle:number;tint?:THREE.Color};
async function instances(parent:THREE.Object3D,name:string,ext:string,items:Placement[],nature=false, refs?:Map<string,{batch:THREE.InstancedMesh;index:number;matrix:THREE.Matrix4}[]>) {
 if(!items.length)return;
 const gltf=await new GLTFLoader().loadAsync(moduleAssetUrl(uuid,`evacuation/models/${name}.${ext}`));const source=gltf.scene;source.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(source),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 const normalize=new THREE.Matrix4().makeTranslation(-center.x,-bounds.min.y,-center.z);const dummy=new THREE.Object3D();
 source.traverse(object=>{if(!(object instanceof THREE.Mesh))return;const geometry=object.geometry.clone();geometry.applyMatrix4(object.matrixWorld);geometry.applyMatrix4(normalize);
  const materials=(Array.isArray(object.material)?object.material:[object.material]).map(m=>{const material=m.clone() as THREE.MeshStandardMaterial;material.roughness=.85;material.metalness=0;material.envMapIntensity=.15;
   if(material.map){material.map.anisotropy=4;material.map.colorSpace=THREE.SRGBColorSpace;}
   if(nature && /lea|pine|grass|bush/i.test(material.name)) {
    material.side=THREE.DoubleSide;material.alphaTest=Math.max(material.alphaTest,.35);material.alphaToCoverage=true;material.shadowSide=THREE.DoubleSide;
    material.emissive.set('#b2ded1');material.emissiveMap=material.map;material.emissiveIntensity=.18;
    material.onBeforeCompile=shader=>{shader.uniforms.landscapeTime=clock;shader.vertexShader='uniform float landscapeTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.x += sin(landscapeTime * 1.3 + transformed.z * 2.0) * 0.028 * max(0.0, transformed.y);');shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\n objectNormal = normalize(vec3(position.x, max(1.2, position.y * 0.16), position.z));');shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb.b += diffuseColor.rgb.g * 0.22; diffuseColor.rgb.r *= 0.68;');};
   }
   return material;});
  const tiles=new Map<string,Placement[]>();items.forEach(p=>{const key=`${Math.floor(p.x/24)},${Math.floor(p.z/24)}`;const tile=tiles.get(key)??[];tile.push(p);tiles.set(key,tile);});
  tiles.forEach(tile=>{const batch=new THREE.InstancedMesh(geometry,Array.isArray(object.material)?materials:materials[0],tile.length);batch.castShadow=true;batch.receiveShadow=true;
   tile.forEach((p,i)=>{dummy.position.set(p.x,landHeight(p.x,p.z),p.z);dummy.rotation.set(0,p.angle,0);dummy.scale.setScalar(p.height/Math.max(size.y,.01));dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);if(p.id&&refs){const list=refs.get(p.id)??[];list.push({batch,index:i,matrix:dummy.matrix.clone()});refs.set(p.id,list);}if(p.tint)batch.setColorAt(i,p.tint);});batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();parent.add(batch);});
 });
 // Source geometries are copied into batches. Materials share their GPU textures.
 source.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});
}

export function landscape(parent:THREE.Object3D) {
 let seed=274018;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const ground=new THREE.PlaneGeometry(WORLD_WIDTH,WORLD_DEPTH,300,216);ground.rotateX(-Math.PI/2);const pos=ground.getAttribute('position'),colors:number[]=[];
 const green=new THREE.Color('#478f35'),dry=new THREE.Color('#a7a452'),soil=new THREE.Color('#8d8670'),shore=new THREE.Color('#babba0');
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),bank=Math.abs(x-riverX(z));pos.setY(i,landHeight(x,z));const patch=(Math.sin(x*.54+Math.cos(z*.71))+Math.sin(z*.59-x*.28))*.12+.38;const c=green.clone().lerp(dry,patch);const plant=Math.exp(-((x+32)**2/175+(z-1)**2/125));c.lerp(soil,plant*.9);if(bank<4.6)c.lerp(shore,Math.max(0,1-Math.abs(bank-3.6)/1.6));colors.push(c.r,c.g,c.b);}
 ground.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));ground.computeVertexNormals();const land=new THREE.Mesh(ground,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));land.receiveShadow=true;parent.add(land);
 ribbon(parent,route,1.5,'#849777');ribbon(parent,route,.8,'#a9a880',.048);
 const riverPoints=Array.from({length:561},(_,i)=>{const z=-70+i*.25;return {x:riverX(z),z};});const v:number[]=[],indices:number[]=[],waterColors:number[]=[];
 riverPoints.forEach((p,i)=>{for(let j=0;j<7;j++){const x=p.x+(j-3)*1.03;v.push(x,-.29,p.z);const c=new THREE.Color(j===0||j===6?'#5bd5d2':j===1||j===5?'#19bcd7':'#1599cd');waterColors.push(c.r,c.g,c.b);if(i<riverPoints.length-1&&j<6){const a=i*7+j;indices.push(a,a+7,a+1,a+1,a+7,a+8);}}});
 const waterGeo=new THREE.BufferGeometry();waterGeo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));waterGeo.setAttribute('color',new THREE.Float32BufferAttribute(waterColors,3));waterGeo.setIndex(indices);waterGeo.computeVertexNormals();
 const waterMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.35,metalness:.1});waterMat.onBeforeCompile=shader=>{shader.uniforms.landscapeTime=clock;shader.vertexShader='uniform float landscapeTime; varying vec3 riverWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n riverWorld=position; transformed.y += sin(position.z * 3.0 + landscapeTime * 2.0) * 0.022;');shader.fragmentShader='uniform float landscapeTime; varying vec3 riverWorld;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n float glint = pow(max(0.0, sin(riverWorld.x * 7.0 + sin(riverWorld.z * 1.4) * 1.7 + landscapeTime * 0.7)), 26.0) * pow(max(0.0, sin(riverWorld.z * 3.4 - landscapeTime * 2.0)), 10.0); diffuseColor.rgb += glint * 0.25;');};
 const water=new THREE.Mesh(waterGeo,waterMat);water.receiveShadow=true;parent.add(water);
 for(const side of [-1,1]){const edge=riverPoints.map(p=>({x:p.x+side*3.05,z:p.z}));const foam=ribbon(parent,edge,.08,'#def6da');const a=foam.geometry.getAttribute('position');for(let i=0;i<a.count;i++)a.setY(i,-.265);(foam as THREE.Mesh).material=new THREE.MeshBasicMaterial({color:'#b7f6e6',transparent:true,opacity:.65});}
 for(const b of BRIDGES){const g=new THREE.Group();g.position.set(b.x,0,b.z);parent.add(g);block(g,0,.42,0,13.8,.28,2,'#665846');for(let i=0;i<35;i++)block(g,-6.8+i*.4,.59,0,.35,.065,2.05,'#ac8b59');for(const s of [-1,1]){for(let i=0;i<8;i++){block(g,-6.7+i*1.9,.96,s*1.02,.08,.95,.08,'#61564a');}block(g,0,1.29,s*1.02,13.8,.1,.1,'#af9270');block(g,0,.83,s*1.02,13.8,.075,.07,'#807458');}for(const x of [-4,4])for(const s of [-1,1])block(g,x,-.05,s*.8,.35,1.1,.4,'#718581');}
 // The factory is built from actual architectural models, with a custom hollow cooling tower.
 const pad=new THREE.Group();pad.position.set(-34,landHeight(-34,1),1);parent.add(pad);block(pad,0,.04,0,21,.08,12,'#77827c');
 coolingTower(parent,-35,5.1);
 const smoke=Array.from({length:16},(_,i)=>{const m=new THREE.Mesh(new THREE.IcosahedronGeometry(1,2),new THREE.MeshStandardMaterial({color:'#e1e9de',roughness:1,transparent:true,opacity:0,depthWrite:false}));parent.add(m);return {mesh:m,offset:i/16};});
 for(const z of [-4.5,6.5])for(let x=-44;x<-24;x+=2.5){const y=landHeight(x,z);rod(parent,new THREE.Vector3(x,y,z),new THREE.Vector3(x,y+1.35,z),.045,'#58706c');rod(parent,new THREE.Vector3(x,y+.7,z),new THREE.Vector3(x+2.5,y+.7,z),.025,'#71847a');}
 const pipe=new THREE.CatmullRomCurve3([new THREE.Vector3(-32,1.7,2),new THREE.Vector3(-29,1.7,2),new THREE.Vector3(-28,1.7,4),new THREE.Vector3(-25,1.7,4)]);const p=new THREE.Mesh(new THREE.TubeGeometry(pipe,32,.17,10,false),mat('#928769',.6,.4));p.castShadow=true;parent.add(p);
 for(let x=-43;x<-25;x+=3){for(const z of [2.3,4.8]){rod(parent,new THREE.Vector3(x,.4,z),new THREE.Vector3(x,3,z),.085,'#695a49');}rod(parent,new THREE.Vector3(x,3,2.3),new THREE.Vector3(x,3,4.8),.085,'#695a49');rod(parent,new THREE.Vector3(x,1,2.3),new THREE.Vector3(x+3,3,2.3),.045,'#746253');}
 [[-15,20,.1],[-6,4,.3],[-19,-15,-.2],[27,16,.15],[35,5,0],[40,8,.3],[-39,21,.3]].forEach(([x,z,a])=>ruin(parent,x,z,a));
 const h=terrainHeight(EXIT.x,EXIT.z);const helipad=new THREE.Mesh(new THREE.CylinderGeometry(3.1,3.2,.18,64),mat('#607f71'));helipad.position.set(EXIT.x,h+.09,EXIT.z);helipad.receiveShadow=true;parent.add(helipad);
 const circle=new THREE.Mesh(new THREE.RingGeometry(2.65,2.76,64),new THREE.MeshBasicMaterial({color:'#ddf9d8',side:THREE.DoubleSide}));circle.rotation.x=-Math.PI/2;circle.position.set(EXIT.x,h+.2,EXIT.z);parent.add(circle);
 for(const [x,z,w,d]of [[-.6,0,.22,1.65],[.6,0,.22,1.65],[0,0,1.2,.22]])block(parent,EXIT.x+x,h+.21,EXIT.z+z,w,.015,d,'#f0ffde');
 for(let i=0;i<8;i++){const a=i*Math.PI/4;const m=new THREE.Mesh(new THREE.SphereGeometry(.08,8,6),new THREE.MeshBasicMaterial({color:'#b3f6bb'}));m.position.set(EXIT.x+3*Math.cos(a),h+.25,EXIT.z+3*Math.sin(a));parent.add(m);}
 const trees:Placement[][]=[[],[],[],[],[],[],[]],rocks:Placement[][]=[[],[],[]],bushes:Placement[]=[],grass:Placement[]=[],flowers:Placement[]=[];
 const treeRefs=new Map<string,{batch:THREE.InstancedMesh;index:number;matrix:THREE.Matrix4}[]>(), falls=new Map<string,{start:number;angle:number}>();
 let destroyed=new Set<string>();
 forest(riverX).forEach(p=>trees[p.variant].push({...p,tint:new THREE.Color().setRGB(.88,.95,.88)}));
 for(let i=0;i<160;i++){const p={x:random()*96-48,z:random()*68-34};if(reserved(p))continue;rocks[i%3].push({...p,height:.35+random()*1.1,angle:random()*6.28});}
 for(let i=0;i<2500;i++){const p={x:random()*98-49,z:random()*70-35};if(reserved(p))continue;const item={...p,height:.3+random()*.3,angle:random()*6.28};grass.push(item);if(i%7===0)bushes.push({...item,height:.4+random()*.45});if(i%41===0)flowers.push({...item,height:.28});}
 const buildings:[string,number,number,number,number][]=[['building-a',-40,-1,3.9,.15],['building-f',-27,-2,3.5,0],['building-j',-40,4,2.4,0],['building-m',-28,6,2.2,Math.PI/2],['chimney-large',-43,-3,6,0],['chimney-medium',-25,-4,4.5,0],['detail-tank-large',-30,5,2.4,0],['shipping-container-a',-44,9,1.1,.1],['shipping-container-b',-37,8.5,1.1,-.1],['water-tower',26,-24,4,0],['building-t',35,-24,2.3,Math.PI/2]];
 const jobs=trees.map((items,i)=>instances(parent,['Pine_1','Pine_2','Pine_3','CommonTree_1','CommonTree_3','DeadTree_1','DeadTree_3'][i],'gltf',items,true,treeRefs));
 rocks.forEach((items,i)=>jobs.push(instances(parent,`Rock_Medium_${i+1}`,'gltf',items,true)));jobs.push(instances(parent,'Bush_Common','gltf',bushes,true),instances(parent,'Grass_Common_Short','gltf',grass,true),instances(parent,'Flower_3_Group','gltf',flowers,true));
 buildings.forEach(([name,x,z,height,angle])=>jobs.push(instances(parent,name,'glb',[{x,z,height,angle}])));
 return {loaded:Promise.all(jobs).then(()=>undefined),destroy:(ids:string[],time:number)=>{
 const next=new Set(ids);destroyed.forEach(id=>{if(!next.has(id)){treeRefs.get(id)?.forEach(r=>{r.batch.setMatrixAt(r.index,r.matrix);r.batch.instanceMatrix.needsUpdate=true;});falls.delete(id);}});
 ids.forEach(id=>{if(!destroyed.has(id))falls.set(id,{start:time,angle:Math.random()*Math.PI*2});});destroyed=next;
 },tick:(time:number)=>{clock.value=time;
 falls.forEach((fall,id)=>{const r=Math.min(1,(time-fall.start)/.65);treeRefs.get(id)?.forEach(ref=>{const position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();ref.matrix.decompose(position,rotation,scale);rotation.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(Math.cos(fall.angle),0,Math.sin(fall.angle)),r*r*1.5));if(r===1)scale.setScalar(0);ref.batch.setMatrixAt(ref.index,new THREE.Matrix4().compose(position,rotation,scale));ref.batch.instanceMatrix.needsUpdate=true;});if(r===1)falls.delete(id);});smoke.forEach(({mesh,offset})=>{const p=(time*.055+offset)%1;mesh.position.set(-35+p*2.6+Math.sin(offset*29)*.25,landHeight(-35,5.1)+7.7+p*3.6,5.1+p*.8+Math.cos(offset*19)*.2);mesh.scale.set(.55+p*1.3,.4+p*.9,.5+p);(mesh.material as THREE.MeshStandardMaterial).opacity=Math.sin(p*Math.PI)*.075;});}};
}

