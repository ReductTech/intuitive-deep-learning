import * as THREE from 'three';
import type {Layer, TrainingSnapshot} from '../../services/digitNetworkTraining';

export type TrainingPhase = 'idle' | 'forward' | 'backward' | 'update';
export const TRAINING_CYCLE_MS = 6600;
export function trainingPhase(time: number): TrainingPhase {
  const cycle = time % TRAINING_CYCLE_MS;
  return cycle < 3100 ? 'forward' : cycle < 5500 ? 'backward' : 'update';
}

/** Local implementation of the archived lab's scan/convergence/edge-flow idea.
 * The movement illustrates computation; texture checkpoints are measured data.
 * No runtime imports or asset links point into modules-legacy.
 */
export function createTrainingAnimation(root: THREE.Group, input: THREE.Mesh,
  modules: THREE.Group[], gap: THREE.Group, head: THREE.Group, layers: Layer[]) {
  const group = new THREE.Group();
  root.add(group);
  const materials = {forward: 0x3f89de, backward: 0xe7803b, update: 0x31a37c};
  const kernels = modules.map(module => {
    const list: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>[] = [];
    module.traverse(child => {
      if (child instanceof THREE.Mesh && child.userData.role === 'convKernel') list.push(child as typeof list[number]);
    });
    return list.sort((a,b) => a.userData.kernelIndex-b.userData.kernelIndex);
  });
  const checkpoints = modules.map((module, index) => {
    const maps: {mesh: THREE.Mesh; canvas: HTMLCanvasElement; texture: THREE.CanvasTexture}[] = [];
    for (let channel = 0; channel < 3; channel++) {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 8;
      const context = canvas.getContext('2d')!; context.fillStyle = '#e0e9f5'; context.fillRect(0,0,8,8);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace; texture.magFilter = THREE.NearestFilter;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(.64,.64),
        new THREE.MeshBasicMaterial({map: texture, side: THREE.DoubleSide}));
      mesh.rotation.y = Math.PI/2;
      mesh.position.set(module.position.x+(layers[index].kind==='conv'?1.15:.42)+channel*.045, 0, 0);
      group.add(mesh);
      const border = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),
        new THREE.LineBasicMaterial({color: 0xadc3df, transparent: true, opacity: .7}));
      mesh.add(border); maps.push({mesh,canvas,texture});
    }
    return maps;
  });
  let previousSnapshot: TrainingSnapshot | undefined;
  function readSnapshot(snapshot?: TrainingSnapshot) {
    if (!snapshot || snapshot === previousSnapshot) return;
    previousSnapshot = snapshot;
    snapshot.classifier_means?.forEach((value, index) => {
      const target = nodeBaseColors[9+index];
      if (target) target.set(0xdce8f6).lerp(new THREE.Color(value>=0?0x438bdb:0xe89b66),.2+Math.min(.8,Math.abs(value)*8));
    });
    snapshot.layers.forEach(layer => {
      layer.maps.forEach((values, channel) => {
        const target = checkpoints[layer.layer_index]?.[channel]; if (!target) return;
        const {canvas,texture} = target; canvas.width = canvas.height = layer.side;
        const context = canvas.getContext('2d')!;
        const image = context.createImageData(layer.side,layer.side);
        const max = Math.max(1e-9,...values.map(Math.abs));
        values.forEach((value,index) => {
          const strength = Math.max(0,value)/max;
          image.data.set([14+strength*210,26+strength*196,62-strength*35,255],index*4);
        });
        context.putImageData(image,0,0); texture.needsUpdate = true;
      });
    });
  }
  function lineSegments(count: number) {
    const array = new Float32Array(count*6);
    const attribute = new THREE.BufferAttribute(array,3);
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position',attribute);
    const material = new THREE.LineBasicMaterial({color:materials.forward,transparent:true,opacity:.65,depthWrite:false});
    const line = new THREE.LineSegments(geometry,material);
    line.frustumCulled = false; group.add(line);
    return {line,array,attribute,material};
  }
  function segment(buffer: ReturnType<typeof lineSegments>, index: number, from: THREE.Vector3, to: THREE.Vector3) {
    buffer.array.set([from.x,from.y,from.z,to.x,to.y,to.z],index*6);
  }
  const flows = modules.map(() => ({incoming:lineSegments(4),outgoing:lineSegments(4),frame:lineSegments(8)}));
  const boundaries: THREE.Object3D[] = [input,...checkpoints.map(stack => stack[0].mesh),gap,head];
  const transport = lineSegments((boundaries.length-1)*6);
  const headNodes = head.children.filter(child => child instanceof THREE.Mesh) as THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>[];
  const headEdges = head.children.filter(child => child instanceof THREE.Line) as THREE.Line[];
  const headPulses = lineSegments(headEdges.length);
  const nodeBaseColors = headNodes.map(node => node.material.color.clone());
  const focus = new THREE.Mesh(new THREE.RingGeometry(.1,.115,32),
    new THREE.MeshBasicMaterial({color:materials.backward,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));
  focus.position.set(head.position.x+.24,.2,.13); group.add(focus);
  const corners = [[-1,-1],[-1,1],[1,1],[1,-1]];
  function point(object: THREE.Object3D, x: number, y: number, z: number) {
    const local = object instanceof THREE.Mesh && object.geometry instanceof THREE.BoxGeometry
      ? new THREE.Vector3(z,y,-x) : new THREE.Vector3(x,y,z);
    return root.worldToLocal(object.localToWorld(local));
  }
  function frame(buffer: ReturnType<typeof lineSegments>, offset: number, points: THREE.Vector3[]) {
    points.forEach((p,index) => segment(buffer,offset+index,p,points[(index+1)%4]));
  }
  return {
    update(time: number, phase: TrainingPhase, snapshot?: TrainingSnapshot) {
      time = Math.max(0, time);
      readSnapshot(snapshot);
      const active = phase !== 'idle';
      const color = phase === 'idle' ? materials.forward : materials[phase];
      root.updateMatrixWorld(true);
      const forward = phase === 'forward';
      const updating = phase === 'update';
      const cycle = time % TRAINING_CYCLE_MS;
      const sweep = forward ? cycle/3100 : phase === 'backward' ? 1-(cycle-3100)/2400 : .5;
      transport.line.visible = active && !updating;
      transport.material.color.set(color);
      for (let index = 0; index < boundaries.length-1; index++) {
        for (let lane = 0; lane < 6; lane++) {
          const from = point(boundaries[index],0,(lane-2.5)*.062,.13);
          const to = point(boundaries[index+1],0,(lane-2.5)*.043,.15);
          const position = ((time/800+lane*.12-index*.09)%1+1)%1;
          const start = forward ? position : 1-position;
          const end = Math.max(0,Math.min(1,start+(forward ? .14 : -.14)));
          segment(transport,index*6+lane,from.clone().lerp(to,start),from.clone().lerp(to,end));
        }
      }
      transport.attribute.needsUpdate = true;
      flows.forEach((flow,index) => {
        const list = kernels[index];
        const kernelIndex = list.length ? Math.floor(time/650+index)%Math.min(3,list.length) : 0;
        const kernel = list[kernelIndex];
        const source = index === 0 ? input : checkpoints[index-1][0].mesh;
        const output = checkpoints[index][kernelIndex%3].mesh;
        const local = ((time/1550+index*.16)%1+1)%1;
        const col = Math.floor(local*4), row = Math.floor(time/1550)%4;
        const sourceWidth = index === 0 ? .85 : .64;
        const sourceHeight = index === 0 ? .85 : .64;
        const patchWidth = sourceWidth*.28,patchHeight = sourceHeight*.28;
        const x = (col/3-.5)*sourceWidth*.67, y = (.5-row/3)*sourceHeight*.67;
        const inputPoints = corners.map(([dx,dy]) => point(source,x+dx*patchWidth/2,y+dy*patchHeight/2,.018));
        const outputPoints = corners.map(([dx,dy]) => point(output,(col/3-.5)*.17+dx*.04,(.5-row/3)*.36+dy*.045,.02));
        flow.frame.line.visible = active && !updating;
        flow.incoming.line.visible = active && !updating;
        flow.outgoing.line.visible = active && !updating;
        [flow.frame,flow.incoming,flow.outgoing].forEach(buffer => {
          buffer.material.color.set(color);buffer.material.opacity = .28+.45*(.5+.5*Math.sin(time/160+index));
        });
        frame(flow.frame,0,inputPoints); frame(flow.frame,4,outputPoints);
        for (let corner = 0; corner < 4; corner++) {
          const middle = kernel ? point(kernel,0,(corner<2?-.035:.035),(corner%2?-.035:.035)) : point(modules[index],0,0,.14);
          segment(flow.incoming,corner,forward?inputPoints[corner]:middle,forward?middle:inputPoints[corner]);
          segment(flow.outgoing,corner,forward?middle:outputPoints[corner],forward?outputPoints[corner]:middle);
        }
        [flow.frame,flow.incoming,flow.outgoing].forEach(buffer => buffer.attribute.needsUpdate = true);
        list.forEach((mesh,k) => {
          const selected = active && (updating || mesh === kernel);
          mesh.material.emissive.set(selected?color:0x000000);
          mesh.material.emissiveIntensity = selected ? .28+.2*Math.sin(time/130+k*.2)**2 : .015;
          mesh.scale.setScalar(updating ? 1+.045*Math.sin((cycle-5500)/1100*Math.PI) : 1);
          mesh.children.forEach(child => {
            if (child instanceof THREE.LineSegments) {
              const material = child.material as THREE.LineBasicMaterial;
              material.color.set(selected?color:0xffffff);material.opacity = selected ? .95 : .35;
            }
          });
        });
        if (!list.length) modules[index].traverse(child => {
          if (child instanceof THREE.Mesh && child.userData.role === 'poolFrustum') {
            const material = child.material as THREE.MeshBasicMaterial;
            material.color.set(active && !updating && Math.abs(index/modules.length-sweep)<.2?color:0xc1e9df);
          }
        });
      });
      headPulses.line.visible = active; headPulses.material.color.set(color);
      headEdges.forEach((edge,index) => {
        const positions = edge.geometry.getAttribute('position');
        const a = point(head,positions.getX(0),positions.getY(0),positions.getZ(0));
        const b = point(head,positions.getX(1),positions.getY(1),positions.getZ(1));
        const progress = (time/680+index*.071)%1;
        const from = forward?progress:1-progress;
        const to = Math.max(0,Math.min(1,from+(forward ? .22 : -.22)));
        segment(headPulses,index,a.clone().lerp(b,from),a.clone().lerp(b,to));
      });
      headPulses.attribute.needsUpdate = true;
      headNodes.forEach((node,index) => {
        const strength = active ? .25+.3*(.5+.5*Math.sin(time/200-index*.7)) : 0;
        node.material.emissive.set(color);node.material.emissiveIntensity = strength;
        node.material.color.copy(nodeBaseColors[index]);
        node.scale.setScalar(1+(updating ? .12 : active ? .06 : 0)*Math.sin(time/190-index*.5)**2);
      });
      focus.visible = phase === 'backward';focus.scale.setScalar(1+.15*Math.sin(time/180));
    },
  };
}

