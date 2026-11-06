import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Typography } from '../../shared/react';
import { orbitals, radialProbability, type Orbital } from './hydrogenOrbitals';

export interface CloudSceneProps { scale: number; radiusNm: number; orbital: Orbital; slice: boolean; }
export function ElectronCloudScene({ scale, radiusNm, orbital, slice }: CloudSceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const radiusLabel = useRef<HTMLSpanElement>(null);
  const values = useRef({ scale, radiusNm, orbital, slice });
  values.current = { scale, radiusNm, orbital, slice };
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0xffffff, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-label', '三维氢原子轨道概率云，可拖动旋转并用滚轮缩放');
    mount.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, .1, 60);
    camera.position.set(1.6, 1.2, 9.4);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 6.5; controls.maxDistance = 15;
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 4); key.position.set(-3, 4, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0x8dc8ff, 2); rim.position.set(4, -2, -2); scene.add(rim);
    const nucleus = new THREE.Mesh(new THREE.SphereGeometry(.14, 48, 32), new THREE.MeshPhysicalMaterial({ color: 0xf36a60, metalness: .08, roughness: .23, clearcoat: 1, emissive: 0x5a1006, emissiveIntensity: .22 }));
    nucleus.renderOrder = 4; scene.add(nucleus);
    const volumeMaterial = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.BackSide, uniforms: { uA: { value: 1.2 }, uOrbital: { value: 0 }, uSlice: { value: 0 }, uEye: { value: camera.position.clone() } },
      vertexShader: 'varying vec3 vPoint; void main(){vPoint=(modelMatrix*vec4(position,1.0)).xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: `precision highp float;
        varying vec3 vPoint; uniform vec3 uEye; uniform float uA; uniform float uOrbital; uniform float uSlice;
        float density(vec3 p){
          float u=length(p)/uA;
          if(uOrbital<0.5)return exp(-2.0*u);
          if(uOrbital<1.5)return pow(2.0-u,2.0)*exp(-u)*0.25;
          float c=p.y/max(length(p),0.0001);
          return u*u*exp(-u)*c*c/0.54134113;
        }
        vec3 shade(float d){return mix(vec3(0.22,0.65,1.0),vec3(0.015,0.22,0.7),pow(d,0.35));}
        void main(){
          vec3 ray=normalize(vPoint-uEye); float b=dot(uEye,ray);
          float h=b*b-dot(uEye,uEye)+42.25; if(h<0.0)discard;
          float nearT=max(0.0,-b-sqrt(h)); float farT=-b+sqrt(h);
          if(uSlice>0.5){
            if(abs(ray.z)<0.0001)discard;
            float planeT=-uEye.z/ray.z;
            if(planeT<nearT||planeT>farT)discard;
            float d=density(uEye+ray*planeT);
            gl_FragColor=vec4(shade(d),1.0-exp(-sqrt(max(d,0.0))*3.5));return;
          }
          float stepT=(farT-nearT)/112.0; vec4 sum=vec4(0.0);
          float exposure=uOrbital>1.5?1.1:(uOrbital>0.5?4.0:2.9);
          for(int i=0;i<112;i++){
            vec3 p=uEye+ray*(nearT+(float(i)+0.5)*stepT);float d=density(p);
            float alpha=1.0-exp(-d*stepT*exposure/uA);
            sum.rgb+=(1.0-sum.a)*alpha*shade(d);sum.a+=(1.0-sum.a)*alpha;
          }
          if(sum.a<0.002)discard;gl_FragColor=vec4(sum.rgb/max(sum.a,0.001),sum.a);
        }`,
    });
    const volume = new THREE.Mesh(new THREE.BoxGeometry(13, 13, 13), volumeMaterial); volume.renderOrder = 1; scene.add(volume);
    // Inverse-CDF radial sampling plus the exact angular distribution.
    const positionCache = new Map<Orbital, Float32Array>();
    const sample = (state: Orbital) => {
      if(positionCache.has(state))return positionCache.get(state)!;
      let seed=82591;
      const random=()=>{seed=(1664525*seed+1013904223)>>>0;return (seed+.5)/4294967296;};
      const cdf=Array.from({length:4097},(_,i)=>radialProbability(state,i/4096*40));
      const result=new Float32Array(22000*3);
      for(let i=0;i<22000;i++){
        const target=random();let low=0,high=4096;
        while(high-low>1){const mid=(low+high)>>1;if(cdf[mid]<target)low=mid;else high=mid;}
        const r=(low+(target-cdf[low])/Math.max(cdf[high]-cdf[low],1e-12))/4096*40;
        const c=state==='2p'?Math.cbrt(2*random()-1):2*random()-1;
        const phi=2*Math.PI*random();const perpendicular=r*Math.sqrt(1-c*c);
        result[i*3]=perpendicular*Math.cos(phi);result[i*3+1]=r*c;result[i*3+2]=perpendicular*Math.sin(phi);
      }
      positionCache.set(state,result);return result;
    };
    const positions=sample('1s');
    const pointsGeometry = new THREE.BufferGeometry(); pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pointsMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uPixel: { value: renderer.getPixelRatio() }, uSlice: { value: 0 }, uWidth: { value: 1 } },
      vertexShader: 'uniform float uPixel; varying float vZ; void main(){vZ=(modelMatrix*vec4(position,1.0)).z;vec4 p=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*p;gl_PointSize=clamp(12.0*uPixel/-p.z,1.0,3.6);}',
      fragmentShader: 'varying float vZ;uniform float uSlice;uniform float uWidth;void main(){if(uSlice>0.5&&abs(vZ)>uWidth)discard;float d=length(gl_PointCoord-0.5)*2.0;if(d>1.0)discard;gl_FragColor=vec4(0.06,0.39,0.95,(1.0-d)*0.24);}',
    });
    const points = new THREE.Points(pointsGeometry, pointsMaterial); points.renderOrder = 2; scene.add(points);
    // Observation shell and radius vector are geometric aids, not a trajectory.
    const shell = new THREE.Group();
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x8abcf2, transparent: true, opacity: .32 });
    for (let axis = 0; axis < 3; axis++) {
      const vertices = Array.from({ length: 129 }, (_, i) => {
        const angle = i / 128 * Math.PI * 2; const c = Math.cos(angle), s = Math.sin(angle);
        return axis === 0 ? new THREE.Vector3(c,s,0) : axis === 1 ? new THREE.Vector3(c,0,s) : new THREE.Vector3(0,c,s);
      });
      shell.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(vertices), lineMaterial));
    }
    shell.renderOrder = 3; scene.add(shell);
    const direction = new THREE.Vector3(.8,.48,.3).normalize();
    const arrow = new THREE.ArrowHelper(direction, new THREE.Vector3(), 1, 0x5388bc, .12, .065); arrow.renderOrder = 5; scene.add(arrow);
    const probe = new THREE.Mesh(new THREE.SphereGeometry(.038,16,12),new THREE.MeshBasicMaterial({color:0xffffff}));probe.renderOrder=5;scene.add(probe);
    const resize = () => { const w=mount.clientWidth,h=mount.clientHeight; renderer.setSize(w,h,false); camera.aspect=w/h;camera.updateProjectionMatrix(); };
    const ro = new ResizeObserver(resize); ro.observe(mount); resize();
    let visible = false; let frame = 0; let lastTime = -100; let lastOrbital: Orbital = '1s';
    const draw = (time: number) => {
      if (time-lastTime > 32) {
        lastTime=time; controls.update(); const current=values.current; const viewScale=orbitals[current.orbital].viewScale; const a=viewScale*current.scale;
        volumeMaterial.uniforms.uA.value=a;
        volumeMaterial.uniforms.uOrbital.value=current.orbital==='1s'?0:current.orbital==='2s'?1:2;
        volumeMaterial.uniforms.uSlice.value=current.slice?1:0;
        pointsMaterial.uniforms.uSlice.value=current.slice?1:0;pointsMaterial.uniforms.uWidth.value=a*.22;
        if(current.orbital!==lastOrbital){pointsGeometry.setAttribute('position',new THREE.BufferAttribute(sample(current.orbital),3));pointsGeometry.computeBoundingSphere();lastOrbital=current.orbital;}
        volumeMaterial.uniforms.uEye.value.copy(camera.position);
        points.scale.setScalar(a);
        const r=current.radiusNm/.0529177*viewScale; shell.scale.setScalar(r);arrow.setLength(r,.12,.065);probe.position.copy(direction).multiplyScalar(r);
        renderer.render(scene,camera);
        const labelPoint=probe.position.clone().project(camera);
        if(radiusLabel.current){radiusLabel.current.style.left=`${Math.min(mount.clientWidth-28,Math.max(4,(labelPoint.x*.5+.5)*mount.clientWidth+8))}px`;radiusLabel.current.style.top=`${Math.min(mount.clientHeight-25,Math.max(4,(-labelPoint.y*.5+.5)*mount.clientHeight))}px`;}
        renderer.domElement.dataset.rendered='true';renderer.domElement.dataset.orbital=current.orbital;renderer.domElement.dataset.slice=String(current.slice);renderer.domElement.dataset.camera=camera.position.toArray().map(n=>n.toFixed(3)).join(',');renderer.domElement.dataset.scale=current.scale.toFixed(4);
      }
      if(visible&&document.visibilityState==='visible')frame=requestAnimationFrame(draw);
    };
    const update = () => { cancelAnimationFrame(frame); if(visible&&document.visibilityState==='visible')frame=requestAnimationFrame(draw); };
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;update();});observer.observe(mount);
    document.addEventListener('visibilitychange',update); draw(0);
    return () => {
      cancelAnimationFrame(frame);observer.disconnect();ro.disconnect();document.removeEventListener('visibilitychange',update);controls.dispose();
      const materials=new Set<THREE.Material>();scene.traverse(object=>{const mesh=object as THREE.Mesh;if(mesh.geometry)mesh.geometry.dispose();if(mesh.material){for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])materials.add(m);}});materials.forEach(m=>m.dispose());
      renderer.dispose();renderer.domElement.remove();
    };
  }, []);
  return <div className="cg-lab-scene" ref={host}>{failed&&<Typography className="cg-lab-failed" variant="bodySmall" tone="inherit">当前浏览器无法启动 WebGL，请开启硬件加速。</Typography>}<Typography ref={radiusLabel} as="span" variant="bodySmall" tone="inherit" className="cg-lab-radius-label">r</Typography><Typography as="span" variant="bodySmall" tone="inherit" className="cg-lab-nucleus-label">原子核</Typography></div>;
}
