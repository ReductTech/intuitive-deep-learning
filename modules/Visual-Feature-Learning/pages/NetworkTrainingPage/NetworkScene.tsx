import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Button,Typography,moduleAssetUrl} from '../../../shared/react';
import {shapes,type Layer,type TrainingSnapshot} from '../../services/digitNetworkTraining';

type Tile=THREE.Mesh<THREE.BoxGeometry,THREE.MeshStandardMaterial>;
type Feature={group:THREE.Group;tiles:Tile[][];side:number;face:number;channels:number};
type Props={layers:Layer[];selected:number;running:boolean;stats?:number[][];snapshot?:TrainingSnapshot;onSelect:(i:number)=>void;onReorder:(from:number,to:number)=>void;onInsert:(after:number)=>void;canInsert:boolean};
const COLORS={forward:0x4f83ea,backward:0xe99547,update:0x42b6a6};

// The tile, kernel, scan-window and eight-path display follow the RGB and
// MultiKernel scenes in Convolution-Kernel-Intro. Only their topology is composed.
function tile(x:number,size:number,color:number):Tile{
 const geometry=new THREE.BoxGeometry(x,size-.008,size-.008);
 const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.28,metalness:.06,emissive:color,emissiveIntensity:.02}));
 mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.42})));
 return mesh;
}
function feature(scene:THREE.Group,x:number,side:number,channels:number,color:number,spatialSize=28):Feature{
 const group=new THREE.Group();group.position.x=x;scene.add(group);
 const face=.94*spatialSize/28,cell=face/side,tiles:Tile[][]=[];
 const shown=Math.min(5,channels),depth=(channels-1)*.016;
 for(let channel=0;channel<shown;channel++){
  const map:Tile[]=[];
  for(let row=0;row<side;row++)for(let col=0;col<side;col++){
   const mesh=tile(.016,cell,color);
   mesh.position.set(shown===1?0:(channel/(shown-1)-.5)*depth,(side/2-.5-row)*cell,(side/2-.5-col)*cell);
   group.add(mesh);map.push(mesh);
  }
  tiles.push(map);
 }
 return {group,tiles,side,face,channels};
}
function mapValues(view:Feature,maps:number[][],sourceSide:number,gray=false,signed=false){
 view.tiles.forEach((tiles,channel)=>{
  const values=maps[channel%maps.length];if(!values)return;
  const maximum=Math.max(1e-6,...values.map(Math.abs));
  tiles.forEach((mesh,index)=>{
   const row=Math.floor(index/view.side),col=index%view.side;
   const value=values[Math.floor(row/view.side*sourceSide)*sourceSide+Math.floor(col/view.side*sourceSide)]??0;
   const strength=(signed?Math.abs(value):Math.max(0,value))/(gray?1:maximum);
   mesh.material.color.set(gray?new THREE.Color(strength,strength,strength):new THREE.Color(0x193867).lerp(new THREE.Color(signed&&value<0?0xe99547:0x78b0ed),strength));
  });
 });
}
function filters(scene:THREE.Group,x:number,channels:number,index:number){
 const group=new THREE.Group();group.position.x=x;scene.add(group);
 const rods:THREE.Group[]=[],tiles:Tile[][]=[];
 let rows=Math.floor(Math.sqrt(channels));while(channels%rows!==0)rows--;const columns=channels/rows;
 const cell=.86/Math.max(columns,rows),length=index===0?.14:.26;
 for(let filter=0;filter<channels;filter++){
  const rod=new THREE.Group();rod.position.set(0,(rows/2-.5-Math.floor(filter/columns))*cell,(columns/2-.5-filter%columns)*cell);group.add(rod);rods.push(rod);
  // One prism denotes one complete kernel. Its face stays square at every count.
  const box=tile(length,cell*.84,[0x4f83ea,0xe99547,0x42b6a6,0xb375de][filter%4]);
  rod.add(box);tiles.push([box]);
 }
 return {group,rods,tiles};
}

function activation(scene:THREE.Group,x:number){
 const group=new THREE.Group();group.position.x=x;scene.add(group);
 const plate=new THREE.Mesh(new THREE.BoxGeometry(.055,.64,.64),new THREE.MeshStandardMaterial({color:0xffdfbd,transparent:true,opacity:.8,roughness:.3}));group.add(plate);
 group.add(new THREE.LineSegments(new THREE.EdgesGeometry(plate.geometry),new THREE.LineBasicMaterial({color:0xe99547})));
 const axes=[new THREE.Vector3(.035,-.24,0),new THREE.Vector3(.035,.24,0),new THREE.Vector3(.035,0,-.24),new THREE.Vector3(.035,0,.24)];
 group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(axes),new THREE.LineBasicMaterial({color:0xc19c78})));
 group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(.04,0,.22),new THREE.Vector3(.04,0,0),new THREE.Vector3(.04,.22,-.22)]),new THREE.LineBasicMaterial({color:0xc36b23})));
 return group;
}
function pooling(scene:THREE.Group,x:number,inputSize:number,outputSize:number){
 const group=new THREE.Group();group.position.x=x;scene.add(group);
 const length=.55,base=.94*inputSize/28,top=.94*outputSize/28;
 const vertices=new Float32Array([-length/2,-base/2,-base/2,-length/2,base/2,-base/2,-length/2,base/2,base/2,-length/2,-base/2,base/2,length/2,-top/2,-top/2,length/2,top/2,-top/2,length/2,top/2,top/2,length/2,-top/2,top/2]);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(vertices,3));geometry.setIndex([0,1,2,0,2,3,4,6,5,4,7,6,0,4,5,0,5,1,3,2,6,3,6,7,1,5,6,1,6,2,0,3,7,0,7,4]);geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xa9d9c6,transparent:true,opacity:.58,side:THREE.DoubleSide,roughness:.4}));group.add(mesh);
 group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry),new THREE.LineBasicMaterial({color:0x529d83})));
 const points:THREE.Vector3[]=[];
 for(const [x,size,divisions] of [[-length/2,base,8],[length/2,top,4]])for(let i=1;i<divisions;i++){
  const coordinate=-size/2+i*size/divisions;
  points.push(new THREE.Vector3(x,coordinate,-size/2),new THREE.Vector3(x,coordinate,size/2),new THREE.Vector3(x,-size/2,coordinate),new THREE.Vector3(x,size/2,coordinate));
 }
 group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x70b39b,transparent:true,opacity:.7})));
 return group;
}

export function NetworkScene({layers,selected,running,stats,snapshot,onSelect,onReorder,onInsert,canInsert}:Props){
 const entries=shapes(layers);
 const nodes:{name:string;detail?:string;layer:number}[]=[{name:'输入',detail:'28×28',layer:-1}];
 const slots:number[]=[];
 entries.forEach((entry,i)=>{
  slots.push(nodes.length);
  const mapNode=()=>({name:`${entry.shape.h}×${entry.shape.w}`,detail:`${entry.shape.c} 通道`,layer:-1});
  if(entry.layer.kind==='conv')nodes.push({name:`卷积 ${entry.shape.c}`,layer:i},mapNode(),{name:'ReLU',layer:i},mapNode());
  else nodes.push({name:'池化',layer:i},mapNode());
 });
 nodes.push({name:'GAP',layer:-1},{name:'分类器',layer:-1});
 const host=useRef<HTMLDivElement>(null),labels=useRef<(HTMLDivElement|null)[]>([]),reset=useRef<(()=>void)|null>(null),view=useRef<{position:THREE.Vector3;target:THREE.Vector3;zoom:number}|null>(null);
 const [playing,setPlaying]=useState(false),[phase,setPhase]=useState('idle'),[error,setError]=useState('');
 const latest=useRef({selected,running,stats,snapshot,playing,onSelect,onReorder});latest.current={selected,running,stats,snapshot,playing,onSelect,onReorder};
 useEffect(()=>setPlaying(running),[running]);
 useEffect(()=>{
  const mount=host.current;if(!mount)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{setError('三维画布暂不可用');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;mount.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),root=new THREE.Group();scene.add(root);
  scene.add(new THREE.AmbientLight(0xffffff,2.1));const light=new THREE.DirectionalLight(0xe5efff,2.8);light.position.set(-3,5,9);scene.add(light);
  const spacing=1.65,total=nodes.length*spacing,xAt=(slot:number)=>-total/2+(slot+.5)*spacing;
  const camera=new THREE.OrthographicCamera(-total/2,total/2,2,-2,.1,100);
  const defaultPosition=new THREE.Vector3(total*1.2,0,total);
  camera.position.copy(view.current?.position??defaultPosition);camera.lookAt(view.current?.target??new THREE.Vector3());camera.zoom=view.current?.zoom??1.0;
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=true;controls.enableZoom=true;controls.screenSpacePanning=true;controls.minZoom=.45;controls.maxZoom=2.4;controls.target.copy(view.current?.target??new THREE.Vector3());
  controls.minPolarAngle=1.49;controls.maxPolarAngle=1.65;controls.update();
  const resize=()=>{const width=Math.max(1,mount.clientWidth),height=Math.max(1,mount.clientHeight);renderer.setSize(width,height,false);const halfWidth=Math.max((total*.72+2.0)/2,1.1*width/height);camera.left=-halfWidth;camera.right=halfWidth;camera.top=halfWidth*height/width;camera.bottom=-camera.top;camera.updateProjectionMatrix();};
  reset.current=()=>{controls.enableDamping=false;controls.update();camera.position.copy(defaultPosition);camera.zoom=1.0;camera.updateProjectionMatrix();controls.target.set(0,0,0);controls.update();controls.enableDamping=true;};
  const input=feature(root,xAt(0),8,1,0x121b2d);
  let alive=true;
  new THREE.TextureLoader().load(moduleAssetUrl('80396753-7fc8-4f55-9188-bddbdb828169','flatten-interface/input-32.png'),texture=>{
   if(!alive){texture.dispose();return;}
   const canvas=document.createElement('canvas');canvas.width=canvas.height=8;const context=canvas.getContext('2d')!;context.drawImage(texture.image,0,0,8,8);const pixels=context.getImageData(0,0,8,8).data;
   let maps=[Array.from({length:64},(_,i)=>pixels[i*4]/255)],side=8;
   mapValues(input,maps,side,true);
   // Initial maps illustrate the same local weighted-sum operation as the
   // reference scene. Training checkpoints replace them when available.
   if(!latest.current.snapshot)layers.forEach((layer,index)=>{
    if(layer.kind==='conv'){
     const weights=[[1,0,-1,2,0,-2,1,0,-1],[1,2,1,0,0,0,-1,-2,-1],[0,1,0,1,-4,1,0,1,0]];
     const source=maps;
     maps=weights.map(kernel=>Array.from({length:side*side},(_,cell)=>{
      const row=Math.floor(cell/side),col=cell%side;let sum=0;
      source.forEach(map=>{for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++){
       const y=row+dy,z=col+dz;if(y>=0&&y<side&&z>=0&&z<side)sum+=map[y*side+z]*kernel[(dy+1)*3+dz+1];
      }});return sum/source.length;
     }));
    }
    if(rawViews[index])mapValues(rawViews[index]!,maps,side,false,true);
    if(layer.kind==='conv')maps=maps.map(map=>map.map(value=>Math.max(0,value)));
    else{
     const previousSide=side;side=Math.max(1,Math.floor(side/2));
     maps=maps.map(map=>Array.from({length:side*side},(_,cell)=>{const row=Math.floor(cell/side)*2,col=cell%side*2;return Math.max(map[row*previousSide+col],map[row*previousSide+col+1],map[(row+1)*previousSide+col],map[(row+1)*previousSide+col+1]);}));
    }
    mapValues(featureViews[index],maps,side);
   });
   texture.dispose();
  });
  const nodeGroups:THREE.Group[]=[];nodeGroups[0]=input.group;
  const pickables:THREE.Object3D[]=[],featureViews:Feature[]=[],rawViews:(Feature|undefined)[]=[],allFeatures:Feature[]=[input],operations:{source:Feature;output:Feature;group:THREE.Group;followers:THREE.Group[];kernel?:ReturnType<typeof filters>;raw?:Feature;relu?:THREE.Group;layer:number}[]=[];
  let previous=input;
  entries.forEach((entry,index)=>{
   const slot=slots[index];let output:Feature;let group:THREE.Group;const followers:THREE.Group[]=[];
   if(entry.layer.kind==='conv'){
    const kernel=filters(root,xAt(slot),entry.layer.out_channels,index);group=kernel.group;nodeGroups[slot]=group;
    const raw=feature(root,xAt(slot+1),8,entry.shape.c,0xb8d4f7,entry.shape.h);rawViews[index]=raw;nodeGroups[slot+1]=raw.group;allFeatures.push(raw);followers.push(raw.group);
    const relu=activation(root,xAt(slot+2));nodeGroups[slot+2]=relu;followers.push(relu);
    output=feature(root,xAt(slot+3),8,entry.shape.c,0xb8d4f7,entry.shape.h);nodeGroups[slot+3]=output.group;
    operations.push({source:previous,output,group,followers,kernel,raw,relu,layer:index});
    relu.traverse(child=>{if(child instanceof THREE.Mesh){child.userData.layer=index;pickables.push(child);}});
   }else{
    group=pooling(root,xAt(slot),entry.input.h,entry.shape.h);nodeGroups[slot]=group;
    output=feature(root,xAt(slot+1),Math.max(2,Math.min(8,entry.shape.h)),entry.shape.c,0xb1d8ce,entry.shape.h);nodeGroups[slot+1]=output.group;
    operations.push({source:previous,output,group,followers,layer:index});
   }
   group.traverse(child=>{if(child instanceof THREE.Mesh){child.userData.layer=index;pickables.push(child);}});
   followers.push(output.group);allFeatures.push(output);featureViews.push(output);previous=output;
  });
  const animationOps=operations.flatMap(op=>op.raw&&op.relu?[{source:op.source,output:op.raw,group:op.group,kernel:op.kernel,kind:'conv'},{source:op.raw,output:op.output,group:op.relu,kernel:undefined,kind:'activation'}]:[{source:op.source,output:op.output,group:op.group,kernel:op.kernel,kind:'pool'}]);
  const gap=feature(root,xAt(nodes.length-2),1,3,0xb6a6e1);gap.group.scale.setScalar(.55);nodeGroups[nodes.length-2]=gap.group;
  const head=new THREE.Group();head.position.x=xAt(nodes.length-1);root.add(head);nodeGroups[nodes.length-1]=head;const headNodes:THREE.Mesh<THREE.SphereGeometry,THREE.MeshStandardMaterial>[]=[],points:THREE.Vector3[][]=[];
  [4,5,10].forEach((count,column)=>{points[column]=[];for(let i=0;i<count;i++){
   const mesh=new THREE.Mesh(new THREE.SphereGeometry(column===2?.035:.06,12,8),new THREE.MeshStandardMaterial({color:column===1?0xffc5a8:0x9ebff1}));mesh.position.set((column-1)*.20,(i-(count-1)/2)*(column===2?.082:.17),0);head.add(mesh);headNodes.push(mesh);points[column].push(mesh.position.clone());
  }});
  for(let column=0;column<2;column++)for(const a of points[column])for(const b of points[column+1])head.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),new THREE.LineBasicMaterial({color:0xa6bce0,transparent:true,opacity:.5})));
  const animationViews=animationOps.map(()=>{
   const scan=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.30,.36,.36)),new THREE.LineBasicMaterial({color:COLORS.forward,depthTest:true}));root.add(scan);scan.visible=false;
  const connections=new THREE.Group();root.add(connections);
   const paths:Array<[THREE.Vector3,THREE.Vector3]>=[],lines:THREE.Line[]=[],particles:THREE.Mesh[]= [];
  for(let i=0;i<8;i++){
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:COLORS.forward,depthTest:true,depthWrite:false}));line.renderOrder=-1;connections.add(line);lines.push(line);
   const particle=new THREE.Mesh(new THREE.SphereGeometry(.025,8,6),new THREE.MeshStandardMaterial({color:COLORS.forward,emissive:COLORS.forward,emissiveIntensity:.95}));root.add(particle);particles.push(particle);
  }
   return {scan,connections,paths,lines,particles};
  });
  let pointerStart:{x:number;y:number}|null=null,spaceHeld=false,hovered=false;
  let drag:{index:number;group:THREE.Group;followers:{group:THREE.Group;origin:number}[];origin:number;axis:THREE.Vector2}|null=null;
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const setRay=(event:PointerEvent)=>{const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);};
  const releaseSpace=()=>{spaceHeld=false;controls.mouseButtons.LEFT=THREE.MOUSE.ROTATE;};
  const keydown=(event:KeyboardEvent)=>{
   if(event.code!=='Space'||(!hovered&&document.activeElement!==renderer.domElement))return;
   const target=event.target as HTMLElement;if(target.matches('input,textarea,select,[contenteditable=true]'))return;
   event.preventDefault();event.stopImmediatePropagation();spaceHeld=true;controls.mouseButtons.LEFT=THREE.MOUSE.PAN;
  };
  const keyup=(event:KeyboardEvent)=>{if(event.code==='Space'&&spaceHeld){event.preventDefault();event.stopImmediatePropagation();releaseSpace();}};
  renderer.domElement.tabIndex=0;
  const enter=()=>{hovered=true;};const leave=()=>{hovered=false;};
  const down=(event:PointerEvent)=>{
   renderer.domElement.focus({preventScroll:true});pointerStart={x:event.clientX,y:event.clientY};
   if(spaceHeld||event.button!==0||latest.current.running)return;
   setRay(event);const hit=ray.intersectObjects(pickables,false)[0];if(!hit)return;
   const index=hit.object.userData.layer,op=operations[index],group=op.group;
   const rect=renderer.domElement.getBoundingClientRect(),a=group.position.clone().project(camera),b=group.position.clone().add(new THREE.Vector3(1,0,0)).project(camera);
   const axis=new THREE.Vector2((b.x-a.x)*rect.width/2,-(b.y-a.y)*rect.height/2);if(axis.lengthSq()<1e-6)return;
   drag={index,group,followers:op.followers.map(group=>({group,origin:group.position.x})),origin:group.position.x,axis};
   controls.enabled=false;setPlaying(false);renderer.domElement.setPointerCapture(event.pointerId);event.stopImmediatePropagation();renderer.domElement.style.cursor='grabbing';
  };
  const move=(event:PointerEvent)=>{
   if(!drag||!pointerStart)return;
   const delta=((event.clientX-pointerStart.x)*drag.axis.x+(event.clientY-pointerStart.y)*drag.axis.y)/drag.axis.lengthSq();drag.group.position.x=drag.origin+delta;drag.followers.forEach(item=>item.group.position.x=item.origin+delta);
   event.stopImmediatePropagation();
  };
  const up=(event:PointerEvent)=>{
   if(drag){
    const moved=pointerStart&&Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>=5;
    const index=drag.index,current=drag.group.position.x;
    const target=slots.reduce((best,slot,i)=>Math.abs(xAt(slot)-current)<Math.abs(xAt(slots[best])-current)?i:best,0);
    drag.group.position.x=drag.origin;drag.followers.forEach(item=>item.group.position.x=item.origin);drag=null;controls.enabled=true;
    if(renderer.domElement.hasPointerCapture(event.pointerId))renderer.domElement.releasePointerCapture(event.pointerId);
    if(moved&&target!==index)latest.current.onReorder(index,target);else latest.current.onSelect(index);
    event.stopImmediatePropagation();
   }
   pointerStart=null;renderer.domElement.style.cursor=spaceHeld?'move':'grab';
  };
  const cancel=(event:PointerEvent)=>{if(drag){drag.group.position.x=drag.origin;drag.followers.forEach(item=>item.group.position.x=item.origin);drag=null;controls.enabled=true;}pointerStart=null;};
  renderer.domElement.addEventListener('pointerdown',down,true);renderer.domElement.addEventListener('pointermove',move,true);renderer.domElement.addEventListener('pointerup',up,true);renderer.domElement.addEventListener('pointercancel',cancel,true);
  renderer.domElement.addEventListener('pointerenter',enter);renderer.domElement.addEventListener('pointerleave',leave);
  window.addEventListener('keydown',keydown,true);window.addEventListener('keyup',keyup,true);window.addEventListener('blur',releaseSpace);
  const observer=new ResizeObserver(resize);observer.observe(mount);resize();
  let time=0,last=performance.now(),frame=0,lastPhase='idle',wasRunning=false,previousSnapshot:TrainingSnapshot|undefined;
  const animate=(now:number)=>{
   const state=latest.current,delta=Math.max(0,Math.min(100,now-last));last=now;
   if(state.running&&!wasRunning)time=0;wasRunning=state.running;
   if(state.playing)time+=delta;
   const forwardDuration=1600,cycle=forwardDuration+2200+1000,position=time%cycle;
   const currentPhase=!state.playing?'idle':position<forwardDuration?'forward':position<forwardDuration+2200?'backward':'update';
   if(currentPhase!==lastPhase){lastPhase=currentPhase;setPhase(currentPhase);}
   if(state.snapshot&&state.snapshot!==previousSnapshot){previousSnapshot=state.snapshot;state.snapshot.layers.forEach(layer=>{const view=featureViews[layer.layer_index];if(view)mapValues(view,layer.maps,layer.side);const raw=rawViews[layer.layer_index];if(raw&&layer.raw_maps)mapValues(raw,layer.raw_maps,layer.side,false,true);});}
   operations.forEach((operation,index)=>{
    const selected=state.selected===operation.layer;
    operation.output.tiles.flat().forEach(mesh=>{mesh.material.emissive.set(selected?0x4f83ea:0x000000);mesh.material.emissiveIntensity=selected?.12:0;});
    operation.kernel?.tiles.forEach((boxes,filter)=>boxes.forEach(mesh=>{
     mesh.material.emissive.set(COLORS.update);mesh.material.emissiveIntensity=currentPhase==='update'?.35*Math.sin((position-forwardDuration-2200)/1000*Math.PI):selected?.16:.02;
     const convIndex=layers.slice(0,index+1).filter(layer=>layer.kind==='conv').length-1,value=state.stats?.[convIndex]?.[filter];if(value!==undefined)mesh.material.color.lerp(new THREE.Color(value>=0?0x4f83ea:0xe99547),.08);
    }));
   });
   const forward=currentPhase==='forward',backward=currentPhase==='backward',active=forward||backward;
   animationOps.forEach((op,operationIndex)=>{
    const {scan,connections,paths,lines,particles}=animationViews[operationIndex];
    scan.visible=active;connections.visible=active;
    if(active){
    // Every operation shares the same clock: layers never wait for a neighbour.
    const progress=forward?position/forwardDuration:(position-forwardDuration)/2200;
    const color=forward?COLORS.forward:COLORS.backward,scanIndex=Math.floor(time/350)%16,row=Math.floor(scanIndex/4),col=scanIndex%4;
    const scale=op.source.face/.94,ratio=op.output.face/op.source.face,whole=op.kind==='activation',centerY=whole?0:(1.5-row)*.15*scale,centerZ=whole?0:(1.5-col)*.15*scale;const windowScale=op.kind==='pool'?scale*2/3:scale;scan.scale.set(1,windowScale,windowScale);scan.visible=!whole;
    scan.position.set(op.source.group.position.x+.12,centerY,centerZ);(scan.material as THREE.LineBasicMaterial).color.set(color);
    const filterIndex=op.kernel?Math.floor(time/820)%op.kernel.rods.length:0,rod=op.kernel?.rods[filterIndex];
    const kernelHalf=whole?.32:op.kernel?op.kernel.tiles[filterIndex][0].geometry.parameters.height/2:.10,kernelDepth=op.kernel?op.kernel.tiles[filterIndex][0].geometry.parameters.width/2:0;
    paths.length=0;
    for(const ySign of [-1,1])for(const zSign of [-1,1]){
     const source=new THREE.Vector3(op.source.group.position.x+.16,centerY+ySign*(whole?op.source.face/2:op.kind==='pool'?.12*scale:.18*scale),centerZ+zSign*(whole?op.source.face/2:op.kind==='pool'?.12*scale:.18*scale));
     const middle=new THREE.Vector3(op.group.position.x,(rod?.position.y??centerY)+ySign*kernelHalf,(rod?.position.z??centerZ)+zSign*kernelHalf);
     const output=new THREE.Vector3(op.output.group.position.x-.04,centerY*ratio+ySign*(whole?op.output.face/2:.06*scale*ratio),centerZ*ratio+zSign*(whole?op.output.face/2:.06*scale*ratio));
     paths.push([source,middle.clone().add(new THREE.Vector3(-kernelDepth,0,0))],[middle.clone().add(new THREE.Vector3(kernelDepth,0,0)),output]);
    }
    paths.forEach(([a,b],i)=>{
     const start=backward?b:a,end=backward?a:b;lines[i].geometry.setFromPoints([start,end]);(lines[i].material as THREE.LineBasicMaterial).color.set(color);
     const first=backward?i%2===1:i%2===0;const begin=first?0:.5,endTime=first?.5:1;particles[i].visible=progress>=begin&&progress<=endTime;
     if(particles[i].visible)particles[i].position.copy(start).lerp(end,(progress-begin)/(endTime-begin));
     const material=particles[i].material as THREE.MeshStandardMaterial;material.color.set(color);material.emissive.set(color);
    });
    if(forward&&progress>.8){const cell=Math.min(op.output.side*op.output.side-1,row*op.output.side+col);op.output.tiles[filterIndex%op.output.tiles.length][cell].material.emissive.set(color);op.output.tiles[filterIndex%op.output.tiles.length][cell].material.emissiveIntensity=.65;}
    op.kernel?.tiles.forEach((boxes,index)=>boxes.forEach(mesh=>{mesh.material.emissive.set(color);mesh.material.emissiveIntensity=index===filterIndex?.28:.02;}));
   }else particles.forEach(particle=>particle.visible=false);
   });
   const phaseColor=currentPhase==='forward'?COLORS.forward:currentPhase==='backward'?COLORS.backward:COLORS.update;
   const pulse=state.playing?.16+.18*(.5+.5*Math.sin(time/180)):0;
   gap.tiles.flat().forEach(mesh=>{mesh.material.emissive.set(phaseColor);mesh.material.emissiveIntensity=pulse;});
   headNodes.forEach(mesh=>{mesh.material.emissive.set(phaseColor);mesh.material.emissiveIntensity=pulse;});
   controls.update();camera.updateMatrixWorld(true);
   nodes.forEach((_,index)=>{const label=labels.current[index];if(label){const group=nodeGroups[index];const p=new THREE.Vector3(group.position.x,0,0).project(camera);label.style.visibility=p.x<-.96||p.x>.96?'hidden':'visible';label.style.left=`${(p.x+1)/2*mount.clientWidth}px`;}});
   renderer.render(scene,camera);frame=requestAnimationFrame(animate);
  };
  frame=requestAnimationFrame(animate);
  return()=>{alive=false;reset.current=null;cancelAnimationFrame(frame);observer.disconnect();view.current={position:camera.position.clone(),target:controls.target.clone(),zoom:camera.zoom};controls.dispose();
   renderer.domElement.removeEventListener('pointerdown',down,true);renderer.domElement.removeEventListener('pointermove',move,true);renderer.domElement.removeEventListener('pointerup',up,true);renderer.domElement.removeEventListener('pointercancel',cancel,true);renderer.domElement.removeEventListener('pointerenter',enter);renderer.domElement.removeEventListener('pointerleave',leave);
   window.removeEventListener('keydown',keydown,true);window.removeEventListener('keyup',keyup,true);window.removeEventListener('blur',releaseSpace);scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Line){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>material.dispose());}});renderer.dispose();renderer.domElement.remove();};
 },[layers]);
 return <div className="vfl-train-stage">
  <div className="vfl-train-animation-toolbar"><div className="vfl-train-phases" aria-label="训练计算过程">{(['forward','backward','update'] as const).map((value,index)=><div key={value} className={`phase-${value} ${phase===value?'is-active':''}`}><span aria-hidden="true"/><Typography variant="bodySmall" tone="inherit">{['窗口扫描','梯度回传','更新权重'][index]}</Typography></div>)}</div><div className="vfl-train-view-actions"><Button className="vfl-train-reset-view" onClick={()=>reset.current?.()}>恢复视角</Button><Button className="vfl-train-animation-toggle" onClick={()=>setPlaying(value=>!value)}>{playing?'暂停动画':'演示过程'}</Button></div></div>
  <div className="vfl-train-diagram"><div className="vfl-train-model-area"><div ref={host} className="vfl-train-webgl" aria-label="方格特征图与多核卷积组装网络"/>{error&&<Typography variant="bodySmall" tone="warning">{error}</Typography>}</div><div className="vfl-train-object-labels">{nodes.map(({name,detail,layer},index)=><div key={index} ref={element=>{labels.current[index]=element;}}>{layer>=0?<Button className="vfl-train-node-label" aria-pressed={selected===layer} onClick={()=>{setPlaying(false);onSelect(layer);}} disabled={running}><Typography variant="bodySmall" tone="accent">{name}</Typography></Button>:<div className="vfl-train-feature-label"><Typography variant="bodySmall" tone="accent">{name}</Typography>{detail&&<Typography variant="bodySmall" tone="muted">{detail}</Typography>}</div>}</div>)}</div></div>
  <div className="vfl-train-scene-footer"><Typography variant="bodySmall" tone="muted">{snapshot?'显示训练特征 · 扫描动画为计算示意':'拖模块排序 · 拖空白旋转 · 滚轮缩放 · 空格＋拖动平移'} </Typography>{canInsert&&<Button onClick={()=>onInsert(selected<0?layers.length-1:selected)}>插入模块</Button>}</div>
 </div>;
}
