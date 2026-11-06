import * as THREE from 'three';
import { terrainHeight, type GameState, type Point } from '../../model';

/** Real geometry for sentinels, projectiles and transient impact debris. */
export function createCombat(scene: THREE.Scene) {
  const root = new THREE.Group(); scene.add(root);
  const guards = new Map<string, THREE.Group>(), bolts = new Map<number, THREE.Mesh>();
  const sparks: {mesh:THREE.Mesh;velocity:THREE.Vector3;start:number;duration:number}[]=[];
  const rings: {mesh:THREE.Mesh;start:number;radius:number;upright?:boolean}[]=[];
  const chipGeometry=new THREE.IcosahedronGeometry(.12,0);
  const bulletGeometry=new THREE.SphereGeometry(.14,8,6);
  const bulletMaterial=new THREE.MeshBasicMaterial({color:new THREE.Color('#ff625f').multiplyScalar(3)});
  function burst(p:Point,time:number,color:string,count=28) {
    for(let i=0;i<count;i++) {
      const mesh=new THREE.Mesh(chipGeometry,new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(2),transparent:true,depthWrite:false}));
      mesh.position.set(p.x,terrainHeight(p.x,p.z)+.6,p.z);
      mesh.scale.setScalar(.5+Math.random()*1.5);root.add(mesh);
      const angle=Math.random()*Math.PI*2,speed=2+Math.random()*7;
      sparks.push({mesh,velocity:new THREE.Vector3(Math.cos(angle)*speed,2+Math.random()*5,Math.sin(angle)*speed),start:time,duration:.5+Math.random()*.4});
    }
  }
  function ring(p:Point,time:number,radius:number,color='#b0f6ff') {
    const mesh=new THREE.Mesh(new THREE.RingGeometry(.92,1,64),new THREE.MeshBasicMaterial({color,transparent:true,opacity:1,side:THREE.DoubleSide,depthWrite:false}));
    mesh.rotation.x=-Math.PI/2;mesh.position.set(p.x,terrainHeight(p.x,p.z)+.18,p.z);root.add(mesh);rings.push({mesh,start:time,radius});
  }
  function rift(p:Point,time:number) {
    for(let i=0;i<2;i++){
      const mesh=new THREE.Mesh(new THREE.TorusGeometry(1.5,.07,8,72,Math.PI*1.8),new THREE.MeshBasicMaterial({color:new THREE.Color(i?'#8defff':'#be8dff').multiplyScalar(3),transparent:true,opacity:1,depthWrite:false}));
      mesh.position.set(p.x,terrainHeight(p.x,p.z)+1,p.z);mesh.rotation.set(.3,-.56,i*1.8);mesh.scale.set(1,1.4,1);root.add(mesh);rings.push({mesh,start:time,radius:1.1,upright:true});
    }
  }
  function sentinel() {
    const g=new THREE.Group();
    const armor=new THREE.MeshStandardMaterial({color:'#293c4e',metalness:.65,roughness:.3});
    const gold=new THREE.MeshStandardMaterial({color:'#cb9070',metalness:.55,roughness:.35});
    const core=new THREE.MeshBasicMaterial({color:'#ff634e'});
    const body=new THREE.Mesh(new THREE.OctahedronGeometry(.56,0),armor);body.position.y=1.25;body.castShadow=true;g.add(body);
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.2,12,8),core);eye.position.set(0,1.3,.44);g.add(eye);
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const wing=new THREE.Mesh(new THREE.BoxGeometry(.22,.15,1.05),gold);wing.position.set(Math.sin(a)*.45,1.25,Math.cos(a)*.45);wing.rotation.y=a;wing.castShadow=true;g.add(wing);}
    const halo=new THREE.Mesh(new THREE.TorusGeometry(.75,.025,6,32),core);halo.rotation.x=Math.PI/2;halo.position.y=.35;g.add(halo);
    const warning=new THREE.Mesh(new THREE.RingGeometry(.9,1,32),new THREE.MeshBasicMaterial({color:'#ff5646',side:THREE.DoubleSide,transparent:true,opacity:.6,depthWrite:false}));warning.rotation.x=-Math.PI/2;warning.position.y=.08;g.add(warning);
    const sight=new THREE.Mesh(new THREE.BoxGeometry(.055,.025,9),new THREE.MeshBasicMaterial({color:'#ff6559',transparent:true,opacity:.5,depthWrite:false}));sight.position.set(0,.2,4.5);g.add(sight);
    return g;
  }
  function update(s:GameState,time:number) {
    s.sentries.forEach(e=>{
      let g=guards.get(e.id);if(!g){g=sentinel();root.add(g);guards.set(e.id,g);}
      if(g.visible&&e.health<=0){burst(e.position,time,'#ffbc70',36);ring(e.position,time,2,'#ffab67');}
      g.visible=e.health>0;g.position.set(e.position.x,terrainHeight(e.position.x,e.position.z),e.position.z);
      g.rotation.y=Math.atan2(s.position.x-e.position.x,s.position.z-e.position.z);
      g.children[6].visible=e.windup>0;g.children[7].visible=e.windup>0;
      g.children[6].scale.setScalar(1+e.windup*2);
    });
    guards.forEach((g,id)=>{if(!s.sentries.some(e=>e.id===id)){root.remove(g);g.traverse(o=>{const m=o as THREE.Mesh;if(m.geometry)m.geometry.dispose();if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(a=>a.dispose());});guards.delete(id);}});
    s.bolts.forEach(b=>{let m=bolts.get(b.id);if(!m){m=new THREE.Mesh(bulletGeometry,bulletMaterial);root.add(m);bolts.set(b.id,m);}m.position.set(b.position.x,terrainHeight(b.position.x,b.position.z)+.8,b.position.z);m.scale.set(1,1,2.7);m.rotation.y=Math.atan2(b.velocity.x,b.velocity.z);});
    bolts.forEach((m,id)=>{if(!s.bolts.some(b=>b.id===id)){root.remove(m);bolts.delete(id);}});
  }
  let lastTime=0;
  function tick(time:number) {const dt=Math.min(.04,lastTime?time-lastTime:.016);lastTime=time;
    guards.forEach(g=>{g.children[0].rotation.y=time;g.children[5].rotation.z=time*1.8;});
    for(let i=sparks.length-1;i>=0;i--){const s=sparks[i],age=time-s.start;if(age>=s.duration){root.remove(s.mesh);(s.mesh.material as THREE.Material).dispose();sparks.splice(i,1);continue;}s.mesh.position.addScaledVector(s.velocity,dt);s.velocity.y-=dt*12;s.mesh.rotation.x+=.12;(s.mesh.material as THREE.MeshBasicMaterial).opacity=1-age/s.duration;}
    for(let i=rings.length-1;i>=0;i--){const r=rings[i],age=(time-r.start)/.55;const scale=.3+age*r.radius;r.mesh.scale.set(scale,scale*(r.upright?1.5:1),scale);if(r.upright)r.mesh.rotation.z+=dt*3;(r.mesh.material as THREE.MeshBasicMaterial).opacity=Math.max(0,1-age);if(age>=1){root.remove(r.mesh);r.mesh.geometry.dispose();(r.mesh.material as THREE.Material).dispose();rings.splice(i,1);}}
  }
  return {update,tick,burst,ring,rift};
}
