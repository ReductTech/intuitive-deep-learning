import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/** Contact occlusion for solid geometry; alpha-cut foliage keeps its actual leaf silhouettes. */
class LandscapeAO extends SSAOPass {
  override render(renderer:THREE.WebGLRenderer,write:THREE.WebGLRenderTarget,read:THREE.WebGLRenderTarget,delta:number,mask:boolean) {
    const hidden:THREE.Object3D[]=[];
    this.scene.traverse(o=>{if(!o.visible)return;const m=o as THREE.Mesh;const mats=m.material?(Array.isArray(m.material)?m.material:[m.material]):[];if(o instanceof THREE.Sprite||mats.some(a=>a.transparent||a.alphaTest>0)){o.visible=false;hidden.push(o);}});
    try{super.render(renderer,write,read,delta,mask);}finally{hidden.forEach(o=>{o.visible=true;});}
  }
}
export function createRendering(renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.Camera) {
  const target=new THREE.WebGLRenderTarget(1600,900,{type:THREE.HalfFloatType,samples:4});
  const composer=new EffectComposer(renderer,target);const main=new RenderPass(scene,camera);const ao=new LandscapeAO(scene,camera,1600,900,16);ao.kernelRadius=.85;ao.minDistance=.0007;ao.maxDistance=.018;
  ao.ssaoMaterial.defines.PERSPECTIVE_CAMERA=0;
  ao.ssaoMaterial.fragmentShader=ao.ssaoMaterial.fragmentShader.replace('1.0 - occlusion','1.0 - occlusion * 0.55');
  const output=new OutputPass();composer.addPass(main);composer.addPass(ao);const bloom=new UnrealBloomPass(new THREE.Vector2(1600,900),.55,.45,1.4);composer.addPass(bloom);composer.addPass(output);
  return {render:()=>composer.render(),resize:(w:number,h:number)=>composer.setSize(w,h),dispose:()=>{ao.dispose();bloom.dispose();output.dispose();composer.dispose();}};
}
