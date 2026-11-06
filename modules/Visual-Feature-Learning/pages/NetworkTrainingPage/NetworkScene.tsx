import { atlasCropUrl } from '../../services/imageAtlas';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Button,Typography,moduleAssetUrl} from '../../../shared/react';

type Tile=THREE.Mesh<THREE.BoxGeometry,THREE.MeshStandardMaterial>;
type Feature={group:THREE.Group;tiles:Tile[][];side:number;face:number;channels:number};
const COLORS={forward:0x4f83ea};
const CHANNEL_COUNT=8;
const CHANNEL_DURATION_MS=160;
function tile(x:number,size:number,color:number):Tile{
 const geometry=new THREE.BoxGeometry(x,size-.008,size-.008);
 const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.28,metalness:.06,emissive:color,emissiveIntensity:.02}));
 mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.42})));
 return mesh;
}
function feature(scene:THREE.Group,x:number,side:number,channels:number,color:number,spatialSize=28):Feature{
 const group=new THREE.Group();group.position.x=x;scene.add(group);
 const face=1.5*spatialSize/28,cell=face/side,tiles:Tile[][]=[];
 const shown=channels,depth=(channels-1)*.09;
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
 const cell=.86/Math.max(columns,rows),length=.48;
 for(let filter=0;filter<channels;filter++){
  const rod=new THREE.Group();rod.position.set(0,(rows/2-.5-Math.floor(filter/columns))*cell,(columns/2-.5-filter%columns)*cell);group.add(rod);rods.push(rod);
  // One prism denotes one complete kernel. Its face stays square at every count.
  const box=tile(length,cell*.84,[0x4f83ea,0xe99547,0x42b6a6,0xb375de][filter%4]);
  rod.add(box);tiles.push([box]);
 }
 return {group,rods,tiles};
}

// Use the rendered map boundaries, including its channel depth and tile gaps.
function mapCorners(view:Feature,channel:number,right:boolean){
 const tiles=view.tiles[channel],first=tiles[0],last=tiles[tiles.length-1];
 const halfY=first.geometry.parameters.height/2,halfZ=first.geometry.parameters.depth/2;
 const x=first.position.x+(right?1:-1)*first.geometry.parameters.width/2;
 return [-1,1].flatMap(ySign=>[-1,1].map(zSign=>new THREE.Vector3(
  view.group.position.x+x,
  ySign<0?last.position.y-halfY:first.position.y+halfY,
  zSign<0?last.position.z-halfZ:first.position.z+halfZ,
 )));
}
function kernelPaths(source:Feature,output:Feature,kernel:ReturnType<typeof filters>,channel:number):Array<[THREE.Vector3,THREE.Vector3]>{
 const inputCorners=mapCorners(source,source.tiles.length-1,true),outputCorners=mapCorners(output,channel,false);
 const rod=kernel.rods[channel],box=kernel.tiles[channel][0],{width,height,depth}=box.geometry.parameters;
 return [-1,1].flatMap((ySign,yIndex)=>[-1,1].flatMap((zSign,zIndex)=>{
  const index=yIndex*2+zIndex;
  const left=new THREE.Vector3(kernel.group.position.x+rod.position.x+box.position.x-width/2,rod.position.y+box.position.y+ySign*height/2,rod.position.z+box.position.z+zSign*depth/2);
  const right=left.clone();right.x+=width;
  return [[inputCorners[index],left],[right,outputCorners[index]]] as Array<[THREE.Vector3,THREE.Vector3]>;
 }));
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
 const length=.55,base=1.5*inputSize/28,top=1.5*outputSize/28;
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

function boxCorners(group:THREE.Group,box:THREE.Mesh<THREE.BoxGeometry>,right:boolean){
 const {width,height,depth}=box.geometry.parameters;
 return [-1,1].flatMap(y=>[-1,1].map(z=>new THREE.Vector3(
  group.position.x+box.position.x+(right?1:-1)*width/2,
  group.position.y+box.position.y+y*height*group.scale.y/2,
  group.position.z+box.position.z+z*depth*group.scale.z/2,
 )));
}
function through(source:THREE.Vector3[],left:THREE.Vector3[],right:THREE.Vector3[],output:THREE.Vector3[]):Array<[THREE.Vector3,THREE.Vector3]>{
 return source.flatMap((point,index)=>[[point,left[index]],[right[index],output[index]]] as Array<[THREE.Vector3,THREE.Vector3]>);
}
function poolCorners(group:THREE.Group,input:boolean){
 const size=input?1.5:.75;
 return [-1,1].flatMap(y=>[-1,1].map(z=>new THREE.Vector3(group.position.x+(input?-.275:.275),y*size/2,z*size/2)));
}
function illuminate(view:Feature,channel:number,strength:number){
 view.tiles.forEach((map,index)=>map.forEach(mesh=>{
  mesh.material.emissive.set(COLORS.forward);
  mesh.material.emissiveIntensity=index===channel?strength:0;
  mesh.material.transparent=true;mesh.material.opacity=index===channel?1:.18;mesh.material.depthWrite=index===channel;
  mesh.children.forEach(child=>{if(child instanceof THREE.LineSegments){
   const material=child.material as THREE.LineBasicMaterial;
   material.color.set(index===channel?0x70b7ff:0xffffff);material.opacity=index===channel?.95:.28;
  }});
 }));
}

export function NetworkScene(){
 const host=useRef<HTMLDivElement>(null),labels=useRef<(HTMLDivElement|null)[]>([]),reset=useRef<(()=>void)|null>(null);
 const [error,setError]=useState('');
 const names=[['输入','28×28'],['卷积','8 个卷积核'],['28×28','8 通道'],['ReLU',''],['28×28','8 通道'],['池化',''],['14×14','8 通道'],['GAP','8 个均值'],['全连接','10 类输出']];
 useEffect(()=>{
  const mount=host.current;if(!mount)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{setError('三维画布暂不可用');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;mount.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),root=new THREE.Group();scene.add(root);
  scene.add(new THREE.AmbientLight(0xffffff,2.1));const light=new THREE.DirectionalLight(0xe5efff,2.8);light.position.set(-3,5,9);scene.add(light);
  const spacing=1.85,total=names.length*spacing,xAt=(index:number)=>(index-(names.length-1)/2)*spacing;
  const camera=new THREE.OrthographicCamera(-total/2,total/2,3,-3,.1,100);
  const defaultPosition=new THREE.Vector3(total*.58,2,total);
  camera.position.copy(defaultPosition);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.screenSpacePanning=true;controls.minZoom=.65;controls.maxZoom=2.4;
  controls.minPolarAngle=1.3;controls.maxPolarAngle=1.65;controls.update();
  const resize=()=>{
   const width=Math.max(1,mount.clientWidth),height=Math.max(1,mount.clientHeight);renderer.setSize(width,height,false);
   const halfWidth=total*.49;camera.left=-halfWidth;camera.right=halfWidth;camera.top=halfWidth*height/width;camera.bottom=-camera.top;camera.updateProjectionMatrix();
  };
  reset.current=()=>{controls.enableDamping=false;controls.update();camera.position.copy(defaultPosition);camera.zoom=1;controls.target.set(0,0,0);camera.updateProjectionMatrix();controls.update();controls.enableDamping=true;};
  const input=feature(root,xAt(0),8,1,0x121b2d);
  const kernel=filters(root,xAt(1),CHANNEL_COUNT,0);
  const raw=feature(root,xAt(2),8,CHANNEL_COUNT,0xb8d4f7);
  const relu=activation(root,xAt(3));relu.scale.set(1,2.3,2.3);
  const activated=feature(root,xAt(4),8,CHANNEL_COUNT,0xb8d4f7);
  const pool=pooling(root,xAt(5),28,14);
  const pooled=feature(root,xAt(6),4,CHANNEL_COUNT,0xb1d8ce,14);
  const gap=feature(root,xAt(7),1,CHANNEL_COUNT,0xb6a6e1,4);
  const head=new THREE.Group();head.position.x=xAt(8);root.add(head);
  const headInputs:THREE.Mesh<THREE.SphereGeometry,THREE.MeshStandardMaterial>[]=[],headOutputs:typeof headInputs=[];
  for(const [nodes,count,x] of [[headInputs,8,-.24],[headOutputs,10,.3]] as const)for(let index=0;index<count;index++){
   const node=new THREE.Mesh(new THREE.SphereGeometry(.055,12,8),new THREE.MeshStandardMaterial({color:0x9ebff1}));
   node.position.set(x,(index-(count-1)/2)*.14,0);head.add(node);nodes.push(node);
  }
  const headEdges=headInputs.map(a=>headOutputs.map(b=>{
   const material=new THREE.LineBasicMaterial({color:0xadbfd9,transparent:true,opacity:.23});
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([a.position,b.position]),material);head.add(line);return line;
  }));
  const nodeGroups=[input.group,kernel.group,raw.group,relu,activated.group,pool,pooled.group,gap.group,head];
  const reluBox=relu.children.find(child=>child instanceof THREE.Mesh) as THREE.Mesh<THREE.BoxGeometry>;
  const outlines=[raw,activated,pooled].map(view=>Array.from({length:CHANNEL_COUNT},(_,channel)=>{
   const corners=mapCorners(view,channel,false);
   const geometry=new THREE.BufferGeometry().setFromPoints([corners[0],corners[1],corners[3],corners[2],corners[0]]);
   const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:0x4f9dff,depthTest:false}));root.add(line);return line;
  }));
  // A single connection set is retargeted to the current kernel and channel.
  const flows=Array.from({length:5},(_,operation)=>{
   const count=operation<3?8:operation===3?4:1;
   return Array.from({length:count},()=>{
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:COLORS.forward,transparent:true,opacity:.78}));root.add(line);
    const particle=new THREE.Mesh(new THREE.SphereGeometry(.02,8,6),new THREE.MeshBasicMaterial({color:0x70b7ff}));root.add(particle);
    return {line,particle};
   });
  });
  let alive=true;
  atlasCropUrl(moduleAssetUrl('80396753-7fc8-4f55-9188-bddbdb828169','flatten-interface/input-32.png')).then(url => new THREE.TextureLoader().load(url,texture=>{
   if(!alive){texture.dispose();return;}
   const canvas=document.createElement('canvas');canvas.width=canvas.height=8;const context=canvas.getContext('2d')!;context.drawImage(texture.image,0,0,8,8);
   const pixels=context.getImageData(0,0,8,8).data,inputMap=Array.from({length:64},(_,index)=>pixels[index*4]/255);
   mapValues(input,[inputMap],8,true);
   const weights=[[1,0,-1,2,0,-2,1,0,-1],[1,2,1,0,0,0,-1,-2,-1],[0,1,0,1,-4,1,0,1,0],[1,1,1,0,0,0,-1,-1,-1],[-1,0,1,-1,0,1,-1,0,1],[1,0,0,0,1,0,0,0,1],[0,0,1,0,1,0,1,0,0],[0,-1,0,-1,4,-1,0,-1,0]];
   const rawMaps=weights.map(weights=>Array.from({length:64},(_,index)=>{
    const row=Math.floor(index/8),col=index%8;let sum=0;
    for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++){const y=row+dy,z=col+dz;if(y>=0&&y<8&&z>=0&&z<8)sum+=inputMap[y*8+z]*weights[(dy+1)*3+dz+1];}
    return sum;
   }));
   const reluMaps=rawMaps.map(values=>values.map(value=>Math.max(0,value)));
   const pooledMaps=reluMaps.map(values=>Array.from({length:16},(_,index)=>{const row=Math.floor(index/4)*2,col=index%4*2;return Math.max(values[row*8+col],values[row*8+col+1],values[(row+1)*8+col],values[(row+1)*8+col+1]);}));
   mapValues(raw,rawMaps,8,false,true);mapValues(activated,reluMaps,8);mapValues(pooled,pooledMaps,4);
   // All averages share one scale so their relative magnitude stays visible.
   const means=pooledMaps.map(values=>values.reduce((sum,value)=>sum+value,0)/values.length),maximum=Math.max(1e-6,...means);
   gap.tiles.forEach((map,index)=>map[0].material.color.set(0x193867).lerp(new THREE.Color(0xb6a6e1),means[index]/maximum));
   texture.dispose();
  }));
  const observer=new ResizeObserver(resize);observer.observe(mount);resize();
  let frame=0,time=0,last=performance.now();
  const animate=(now:number)=>{
   time+=Math.max(0,Math.min(100,now-last));last=now;
   const channel=Math.floor(time/CHANNEL_DURATION_MS)%CHANNEL_COUNT,progress=(time%CHANNEL_DURATION_MS)/CHANNEL_DURATION_MS;
   // One kernel and its entire output map stay highlighted until the next channel.
   kernel.tiles.forEach((boxes,index)=>boxes.forEach(mesh=>{mesh.material.emissive.set(COLORS.forward);mesh.material.emissiveIntensity=index===channel?.75:.015;}));
   [raw,activated,pooled,gap].forEach(view=>illuminate(view,channel,.48));
   outlines.forEach(lines=>lines.forEach((line,index)=>{line.visible=index===channel;}));
   const convPaths=kernelPaths(input,raw,kernel,channel);
   const reluPaths=through(mapCorners(raw,channel,true),boxCorners(relu,reluBox,false),boxCorners(relu,reluBox,true),mapCorners(activated,channel,false));
   const poolPaths=through(mapCorners(activated,channel,true),poolCorners(pool,true),poolCorners(pool,false),mapCorners(pooled,channel,false));
   const gapPaths=mapCorners(pooled,channel,true).map((point,index)=>[point,mapCorners(gap,channel,false)[index]] as [THREE.Vector3,THREE.Vector3]);
   const gapTile=gap.tiles[channel][0];
   const inputPoint=headInputs[channel].position.clone().add(head.position);
   const headPaths:[[THREE.Vector3,THREE.Vector3]]=[[new THREE.Vector3(gap.group.position.x+gapTile.position.x+.008,0,0),inputPoint]];
   [convPaths,reluPaths,poolPaths,gapPaths,headPaths].forEach((paths,operation)=>paths.forEach(([a,b],index)=>{
    const {line,particle}=flows[operation][index];line.geometry.setFromPoints([a,b]);
    const local=(progress*2+(operation*.12))%1;particle.position.copy(a).lerp(b,local);
   }));
   headInputs.forEach((node,index)=>{node.material.emissive.set(COLORS.forward);node.material.emissiveIntensity=index===channel?.7:0;});
   headOutputs.forEach((node,index)=>{node.material.emissive.set(COLORS.forward);node.material.emissiveIntensity=.15+.15*Math.sin(progress*Math.PI+index*.3)**2;});
   headEdges.forEach((edges,index)=>edges.forEach(edge=>{edge.material.color.set(index===channel?COLORS.forward:0xadbfd9);edge.material.opacity=index===channel?.8:.23;}));
   controls.update();camera.updateMatrixWorld(true);
   nodeGroups.forEach((group,index)=>{const label=labels.current[index];if(label){const p=group.position.clone().project(camera);label.style.left=((p.x+1)/2*mount.clientWidth)+'px';label.style.visibility=Math.abs(p.x)>.97?'hidden':'visible';}});
   renderer.render(scene,camera);frame=requestAnimationFrame(animate);
  };
  frame=requestAnimationFrame(animate);
  return()=>{
   alive=false;reset.current=null;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();
   scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Line){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>material.dispose());}});
   renderer.dispose();renderer.domElement.remove();
  };
 },[]);
 return <div className="vfl-train-stage">
  <div className="vfl-train-animation-toolbar"><Button className="vfl-train-reset-view" onClick={()=>reset.current?.()}>恢复视角</Button></div>
  <div className="vfl-train-diagram"><div className="vfl-train-model-area"><div ref={host} className="vfl-train-webgl" aria-label="单层卷积、ReLU、池化、GAP 与全连接的前馈动画"/>{error&&<Typography className="vfl-train-error" variant="bodySmall" tone="warning">{error}</Typography>}</div>
   <div className="vfl-train-object-labels">{names.map(([name,detail],index)=><div key={name+index} ref={element=>{labels.current[index]=element;}}><Typography variant="bodySmall" tone="accent">{name}</Typography>{detail&&<Typography variant="bodySmall" tone="muted">{detail}</Typography>}</div>)}</div>
  </div>
  <Typography className="vfl-train-scene-footer" variant="bodySmall" tone="muted">拖动旋转 · 滚轮缩放 · 右键拖动平移</Typography>
 </div>;
}
