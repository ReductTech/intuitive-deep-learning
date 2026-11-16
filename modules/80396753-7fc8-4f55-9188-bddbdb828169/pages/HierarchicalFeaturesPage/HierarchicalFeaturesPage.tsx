import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { AtlasImage } from '../../components/AtlasImage';
import { useState, useLayoutEffect, useRef } from 'react';
import { Button, ContentBlock, ExplainPanelButton, Typography } from "@shuku/course-style/react";
import { hierarchyManifest, hierarchyChannels } from '../../services/lessonData';
import { atlasIndex } from '../../services/imageAtlas';
import { withAssetResources } from "@shuku/course-style/react/withAssetResources";
import './HierarchicalFeaturesPage.css';

const ASSET_ID = '80396753-7fc8-4f55-9188-bddbdb828169';
const PREFIX = 'feature-hierarchy/mobilenet-v3-small/';
const asset = (path: string) => moduleAssetUrl(PREFIX + path);
const LEVELS = [
  { key: 'deep', label: '深层', description: '更有语义的特征' },
  { key: 'middle', label: '中间层', description: '组合更复杂的局部模式' },
  { key: 'shallow', label: '浅层', description: '提取边缘与方向' },
] as const;

function HierarchicalFeaturesContent() {
  const manifest = hierarchyManifest.read(), lessonChannels = hierarchyChannels.read();
  const sceneRef=useRef<HTMLDivElement>(null);
  const [links,setLinks]=useState<Record<string,string>>({});
  const [sampleId, setSampleId] = useState('mnist-5-0');
  const [failedSample, setFailedSample] = useState<string | null>(null);
  const sample = manifest.samples.find(item => item.id === sampleId) ?? manifest.samples.find(item => item.dataset === 'mnist')!;
  const name = `数字 ${sample.label}`;
  const digitSamples = manifest.samples.filter(item => item.dataset === 'mnist');
  const switchDigit = () => {
    const index = digitSamples.findIndex(item => item.id === sampleId);
    setSampleId(digitSamples[(index + 1) % digitSamples.length].id);
    setFailedSample(null);
  };
  const features = (lessonChannels.samples as Record<string, Record<string, { channel: number; image: string }[]>>)[sample.id] ?? sample.features;
  useLayoutEffect(()=>{
    const scene=sceneRef.current;if(!scene)return;
    const update=()=>{
      const bounds=scene.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
      const x=(value:number)=>(value-bounds.left)*1480/bounds.width;
      const y=(value:number)=>(value-bounds.top)*640/bounds.height;
      const next:Record<string,string>={};
      for(const level of LEVELS){
        const image=scene.querySelector(`.vfl-hierarchy-stage.vfl-hierarchy-${level.key} .vfl-hierarchy-output-link`);
        const panel=scene.querySelector(`.vfl-hierarchy-level.vfl-hierarchy-${level.key}`);
        if(!image||!panel)continue;
        const from=image.getBoundingClientRect(),to=panel.getBoundingClientRect();
        const startX=x(from.left+from.width*.45),endX=x(to.left)-10;
        const startY=y(from.top+from.height/2),endY=y(to.top+to.height/2);
        const radius=Math.min(18,Math.abs(endY-startY)/2);
        const direction=endY>startY?1:-1;
        next[level.key]=`M${startX} ${startY}V${endY-direction*radius}Q${startX} ${endY},${startX+radius} ${endY}H${endX}`;
      }
      setLinks(next);
    };
    update();const observer=new ResizeObserver(update);observer.observe(scene);
    return()=>observer.disconnect();
  },[sampleId]);
  return <ContentBlock shuku-edit-id="e-78f07867-eb2c-42f2-ad34-195a2e446dd8" className="vfl-hierarchy-page" headingLevel={1} title="从浅层特征到深层特征" subtitle="多个卷积层逐级变换，形成不同深度的特征表示。">
    <div shuku-edit-id="e-9ed6a8a4-bcb1-4d00-bad3-15cae0f3e4da" className="vfl-hierarchy-scene" ref={sceneRef}>
      <svg shuku-edit-id="e-f159c607-9f4a-4358-97a7-31e2116f8ce6" className="vfl-hierarchy-connections" viewBox="0 0 1480 640" preserveAspectRatio="none" aria-hidden="true">
        <defs shuku-edit-id="e-f19226a7-28f4-42b1-b507-dba3ab54043f">{LEVELS.map(level=><marker shuku-edit-id="e-ec8b9431-7087-48e4-bfb7-db34ecb983b6" key={level.key} id={`vfl-hierarchy-arrow-${level.key}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path shuku-edit-id="e-48ef20f8-a6ae-4027-8765-07e304923636" d="M0 0L10 5L0 10Z" fill={level.key==='shallow'?'#2474c0':level.key==='middle'?'#7450b7':'#c16a23'}/></marker>)}</defs>
        <path shuku-edit-id="e-3c933fad-f6ff-47b4-8d9a-593bff49903f" className="vfl-hierarchy-shallow-link" d={links.shallow} markerEnd="url(#vfl-hierarchy-arrow-shallow)"/>
        <path shuku-edit-id="e-3227fde8-c973-4084-82bd-1e927a9f348d" className="vfl-hierarchy-middle-link" d={links.middle} markerEnd="url(#vfl-hierarchy-arrow-middle)"/>
        <path shuku-edit-id="e-a6464b9b-e6d2-43da-b934-fd9699d5777c" className="vfl-hierarchy-deep-link" d={links.deep} markerEnd="url(#vfl-hierarchy-arrow-deep)"/>
      </svg>
      <div shuku-edit-id="e-379fef51-72cc-4203-a772-c16dc325e511" className="vfl-hierarchy-network" aria-label="输入经过网络逐级处理：浅层、中间层、深层。连线对应各阶段的输出特征图。">
        <div shuku-edit-id="e-060e9d62-d38f-422f-868e-89596e7b5432" className="vfl-hierarchy-pipeline">
          <div shuku-edit-id="e-a747b29e-dfbf-4bf8-852b-a04d52d125d6" className="vfl-hierarchy-source"><AtlasImage src={asset(sample.input)} alt={`输入：${name}`}/><Typography shuku-edit-id="e-20504d7c-3783-4415-a880-189e58bcc96b" variant="bodySmall" tone="accent">输入图像</Typography></div>
          {[...LEVELS].reverse().map(level=><div shuku-edit-id="e-9868d209-e746-4d31-bd91-fdb939d8783e" className={`vfl-hierarchy-stage vfl-hierarchy-${level.key}`} key={level.key}>
            <svg shuku-edit-id="e-91042525-0cc5-4b9f-8030-2a93964a7bb6" className="vfl-hierarchy-cube" viewBox="0 0 120 150" role="img" aria-label={`${level.label}卷积处理阶段示意，不是卷积核`}>
              <defs shuku-edit-id="e-11380bfd-f27a-4e28-b55c-932ef7a8b23b"><linearGradient shuku-edit-id="e-993a7610-1762-4785-8659-39e341751030" id={`vfl-cube-${level.key}`} x2="1" y2="1"><stop shuku-edit-id="e-6b56cdda-d36c-4034-9936-730497708dd0" stopColor={level.key==='deep'?'#ffead5':level.key==='middle'?'#eee0ff':'#d5ecff'}/><stop shuku-edit-id="e-37513662-8e99-4cae-9a98-050c198c4958" offset="1" stopColor={level.key==='deep'?'#efaa66':level.key==='middle'?'#ac80e0':'#6db0f2'} stopOpacity=".65"/></linearGradient></defs>
              <path shuku-edit-id="e-7c8b37c7-23be-4193-ae3f-45fc4f367ba3" d="M15 35L49 10H110L76 35Z" fill="var(--level-bg)" stroke="currentColor" strokeOpacity=".5"/>
              <path shuku-edit-id="e-6efb9a75-4a20-46e8-9dc8-d76ddca27682" d="M76 35L110 10V108L76 135Z" fill={`url(#vfl-cube-${level.key})`} stroke="currentColor" strokeOpacity=".5"/>
              <path shuku-edit-id="e-52936c09-26b6-4567-91b3-a7c66702bc8f" d="M15 35H76V135H15Z" fill={`url(#vfl-cube-${level.key})`} stroke="currentColor" strokeOpacity=".6"/>
              <path shuku-edit-id="e-7a868965-3225-4921-ac4a-624a48e4c7d3" d="M35 35V135M55 35V135M15 68H76M15 101H76M87 27V126M98 19V117" fill="none" stroke="currentColor" strokeOpacity=".12"/>
            </svg>
            <svg shuku-edit-id="e-bcdd8124-de4e-4873-8169-0dea3fe162da" className="vfl-hierarchy-output-link" viewBox="0 0 40 24" aria-hidden="true"><path shuku-edit-id="e-cbd02c2b-d59f-4777-9859-5b0eb00befcd" d="M0 12H32M25 5L33 12L25 19" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <Typography shuku-edit-id="e-33ddad12-e3b5-45dc-b1e0-338866ceaeb8" variant="bodySmall" tone="accent">卷积层 × N</Typography>
          </div>)}
        </div>
        <div shuku-edit-id="e-31be0fb5-da1e-4595-ada2-8bc751c56030" className="vfl-hierarchy-input">
<Typography shuku-edit-id="e-06e1738c-d240-4648-8f28-24ce806e8d6d" variant="bodySmall" tone="accent">输入 · {name}</Typography><Button onClick={switchDigit}>切换数字</Button>
          <ExplainPanelButton label="网络与特征图说明"><Typography shuku-edit-id="e-dd1c0e51-d0df-4b82-81f1-c7bda4d59583" variant="bodySmall">左边方块表示卷积处理阶段，不是卷积核；右边展示对应阶段的输出特征图。浅层、中间层、深层分别展示 MobileNetV3-Small 模块 1、4、10 的输出。</Typography><Typography shuku-edit-id="e-484cbe36-e6dd-4628-8351-eab3544f4cae" variant="bodySmall">展示来自同一预训练模型的固定通道。层级说明概括常见表示规律，不为某张特征图指定语义；跨通道颜色强度不能直接比较。</Typography></ExplainPanelButton>
        </div>
      </div>
      <div shuku-edit-id="e-855cf020-b3d2-4d20-a751-7b5230dc3c86" className="vfl-hierarchy-levels">
        <div shuku-edit-id="e-1a1f0197-04ce-463d-80d0-633b8f7f0dbe" className="vfl-hierarchy-abstraction"><svg shuku-edit-id="e-110436c0-c44f-4721-a32d-f03cecd8b367" viewBox="0 0 40 400" preserveAspectRatio="none" aria-hidden="true"><path shuku-edit-id="e-9f57b6cc-7c49-4898-98cb-c18dbc3994a5" d="M16 396V26H4L20 4L36 26H24V396Z" fill="#ef9647"/></svg><Typography shuku-edit-id="e-12feb645-7e51-43a8-a08c-835596e91760" variant="bodySmall" tone="accent">特征更有语义</Typography></div>
        {LEVELS.map(level => <section shuku-edit-id="e-79ff2bba-9c3e-4d90-8203-c7928a4ddd10" className={`vfl-hierarchy-level vfl-hierarchy-${level.key}`} key={level.key}>
          <div shuku-edit-id="e-0b341562-a186-40ed-a799-349257d48912" className="vfl-hierarchy-level-heading"><div shuku-edit-id="e-fcf28fc6-613b-4152-8edd-a0b99b16980d"><Typography shuku-edit-id="e-ef088d9b-e0e7-458c-9470-2597cad777e1" variant="h3" tone="inherit">{level.label}特征</Typography><Typography shuku-edit-id="e-ccae4c5c-14ed-4062-a2eb-1177af014f8c" variant="bodySmall" tone="muted">{manifest.stages[level.key].shapeCHW[1]} × {manifest.stages[level.key].shapeCHW[2]} · {manifest.stages[level.key].shapeCHW[0]} 通道</Typography></div><Typography shuku-edit-id="e-14ce9c30-4168-4dff-a22e-e445a7d6e544" className="vfl-hierarchy-description" variant="bodySmall" tone="inherit">{level.description}</Typography></div>
          <div shuku-edit-id="e-88daf799-6e72-44e1-b085-e1cb18c68ce4" className="vfl-hierarchy-responses">{features[level.key].slice(0, 3).map(feature => <AtlasImage key={`${sampleId}-${level.key}-${feature.channel}`} src={asset(feature.image)} alt={`${name}的${level.label}响应`} onError={() => setFailedSample(sampleId)}/>)}</div>
        </section>)}
      </div>
    </div>
    {failedSample === sampleId && <Typography shuku-edit-id="e-8e6f6f0a-62b1-4fde-869a-702bf9ddb22a" className="vfl-hierarchy-error" variant="bodySmall" tone="danger" role="alert">图片加载失败，请刷新重试。</Typography>}
  </ContentBlock>;
}

export const HierarchicalFeaturesPage = withAssetResources(HierarchicalFeaturesContent, [hierarchyManifest, hierarchyChannels, atlasIndex]);
