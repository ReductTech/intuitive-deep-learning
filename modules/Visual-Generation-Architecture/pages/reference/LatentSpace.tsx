import { useState } from 'react';
import { Button } from '../../../shared/react/controls/Button';
import { RangeControl } from '../../../shared/react/controls/RangeControl';
import { Typography } from '../../../shared/react/typography/Typography';
import { Formula, ReferenceVisual, Text } from '../../components/Diagrams';
import { Cover, LatentNoise, RefBox, ReferenceCanvas, ReferenceControls, ReferenceStory } from '../../components/ReferenceCanvas';
import { useStory } from '../../components/Story';

export function PixelToLatent() {
  const [resolution,setResolution]=useState(512);
  const [steps,setSteps]=useState(30);
  const [currentStep,setCurrentStep]=useState(10);
  const progress=currentStep/steps, positions=resolution**2*steps;
  return <ReferenceCanvas index={5} source="12">
    <RefBox rect={[1115,310,530,293]}><LatentNoise progress={progress}/></RefBox>
    <RefBox rect={[98,275,417,384]} className="vgr-image-stack"><ReferenceVisual name="noise-prediction" style={{opacity:1-progress}}/></RefBox>
    {resolution!==512 && <><RefBox rect={[274,228,100,42]} className="vgr-white vgr-center"><Text>{resolution}</Text></RefBox><RefBox rect={[19,449,79,44]} className="vgr-white vgr-center"><Text>{resolution}</Text></RefBox><RefBox rect={[825,539,140,44]} className="vgr-white vgr-center"><Text>{resolution/8} × {resolution/8}</Text></RefBox></>}
    <RefBox rect={[67,665,475,71]} className="vgr-white vgr-center"><Formula latex={`${resolution}\\times${resolution}\\times3`}/><Text muted>单步 {(resolution**2).toLocaleString()} 个空间位置</Text></RefBox>
    <RefBox rect={[1170,645,460,91]} className="vgr-white vgr-center"><Formula latex={`${resolution/8}\\times${resolution/8}\\times4`}/><Text muted>单步 {(resolution**2/64).toLocaleString()} 个空间位置</Text></RefBox>
    <ReferenceControls rect={[36,742,1600,102]} className="vgr-sampling-controls">
      <div className="vgr-inline"><Text>分辨率</Text>{[512,1024].map(n=><Button key={n} data-testid={`resolution-${n}`} active={n===resolution} onClick={()=>setResolution(n)}>{n}</Button>)}</div>
      <RangeControl label="总步数 N" data-testid="sampling-total" value={steps} min={10} max={50} step={10} onChange={e=>{const n=Number(e.target.value);setSteps(n);setCurrentStep(k=>Math.min(k,n));}}/>
      <RangeControl label="当前步 k" data-testid="sampling-current" value={currentStep} min={0} max={steps} step={1} formatValue={v=>`${v}/${steps}`} onChange={e=>setCurrentStep(Number(e.target.value))}/>
      <div className="vgr-sampling-note"><Text>重复位置：像素 <span data-testid="pixel-work">{positions.toLocaleString()}</span>；latent <span data-testid="latent-work">{(positions/64).toLocaleString()}</span>（1/64）</Text><Text muted>固定噪声，按 k/N 演示去噪；空间位置比不等于实际速度比。</Text></div>
    </ReferenceControls>
  </ReferenceCanvas>;
}

function BridgeRoute({ generated }: { generated:boolean }) {
  const story=useStory(['起点','形成 latent','同一 Decoder 解码','图像输出']);
  return <>
    {generated && <>
      <RefBox rect={[39,268,347,377]} className="vgr-white vgr-generation-origin"><Typography variant="body" tone="accent">随机 latent 噪声</Typography><ReferenceVisual name="latent-noisy"/><Text muted>无需输入原图</Text></RefBox>
      <RefBox rect={[444,370,195,204]} className="vgr-encoder-replacement"><Typography variant="h3" tone="accent">扩散采样</Typography><Text>反复去噪</Text></RefBox>
      <RefBox rect={[430,588,225,54]} className="vgr-white vgr-center"><Text>从噪声生成特征</Text></RefBox>
      <RefBox rect={[705,311,270,55]} className="vgr-white vgr-center"><Typography variant="body" tone="accent">生成 latent z</Typography></RefBox>
      <RefBox rect={[700,366,263,220]} className="vgr-white"><ReferenceVisual name={story.step<1?'latent-noisy':'latent-denoised'} /></RefBox>
      <RefBox rect={[445,704,785,50]} className="vgr-white vgr-center"><Text>Diffusion 生成 · VAE Decoder 解码</Text></RefBox>
      <RefBox rect={[1295,270,330,49]} className="vgr-white vgr-center"><Typography variant="body" tone="accent">新图像（示意）</Typography></RefBox>
    </>}
    <Cover rect={[700,364,264,223]} visible={story.step>=1}/>
    <Cover rect={[1034,366,205,213]} visible={story.step>=2}/>
    <Cover rect={[1308,324,308,286]} visible={story.step>=3}/>
    <ReferenceStory story={story}/>
  </>;
}
export function VAEBridge() {
  const [generated,setGenerated]=useState(false);
  return <ReferenceCanvas index={6} source="13">
    <BridgeRoute key={String(generated)} generated={generated}/>
    <ReferenceControls rect={[65,221,1510,52]}><Button data-testid="vae-reconstruct" active={!generated} onClick={()=>setGenerated(false)}>压缩重建：从原图出发</Button><Button data-testid="vae-generate" active={generated} onClick={()=>setGenerated(true)}>生成：从随机噪声出发</Button><Text muted data-testid="vae-premise">{generated?'生成特征 → 同一 Decoder → 新图':'编码特征 → 同一 Decoder → 重建'}</Text></ReferenceControls>
    <RefBox rect={[40,756,1590,43]} className="vgr-white vgr-center" data-testid="vae-routes" data-route={generated?'generate':'reconstruct'}><Text>{generated?'没有原图输入 · 不经过 Encoder · 扩散模型负责生成 latent':'已有原图输入 · Encoder 负责压缩 · 重建会损失部分细节'}</Text></RefBox>
    {generated && <><RefBox rect={[46,811,1575,83]} className="vgr-white vgr-center"><Typography variant="h3" tone="accent">生成 latent 后，用同一个 VAE Decoder 转回像素图像</Typography></RefBox><RefBox rect={[1235,889,400,40]} className="vgr-white vgr-center"><Text muted>图像与 latent 均为示意</Text></RefBox></>}
  </ReferenceCanvas>;
}
