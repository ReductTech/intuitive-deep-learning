import { AtlasImage } from '../../components/AtlasImage';
import { useState, useLayoutEffect, useRef } from 'react';
import { Button, ContentBlock, ExplainPanelButton, Typography, moduleAssetUrl } from '../../../shared/react';
import manifest from '../../../../assets/80396753-7fc8-4f55-9188-bddbdb828169/feature-hierarchy/mobilenet-v3-small/manifest.json';
import lessonChannels from '../../../../assets/80396753-7fc8-4f55-9188-bddbdb828169/feature-hierarchy/mobilenet-v3-small/lesson-channels.json';
import './HierarchicalFeaturesPage.css';

const ASSET_ID = '80396753-7fc8-4f55-9188-bddbdb828169';
const PREFIX = 'feature-hierarchy/mobilenet-v3-small/';
const asset = (path: string) => moduleAssetUrl(ASSET_ID, PREFIX + path);
const LEVELS = [
  { key: 'deep', label: '深层', description: '更有语义的特征' },
  { key: 'middle', label: '中间层', description: '组合更复杂的局部模式' },
  { key: 'shallow', label: '浅层', description: '提取边缘与方向' },
] as const;

export function HierarchicalFeaturesPage() {
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
  return <ContentBlock className="vfl-hierarchy-page" headingLevel={1} title="从浅层特征到深层特征" subtitle="多个卷积层逐级变换，形成不同深度的特征表示。">
    <div className="vfl-hierarchy-scene" ref={sceneRef}>
      <svg className="vfl-hierarchy-connections" viewBox="0 0 1480 640" preserveAspectRatio="none" aria-hidden="true">
        <defs>{LEVELS.map(level=><marker key={level.key} id={`vfl-hierarchy-arrow-${level.key}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill={level.key==='shallow'?'#2474c0':level.key==='middle'?'#7450b7':'#c16a23'}/></marker>)}</defs>
        <path className="vfl-hierarchy-shallow-link" d={links.shallow} markerEnd="url(#vfl-hierarchy-arrow-shallow)"/>
        <path className="vfl-hierarchy-middle-link" d={links.middle} markerEnd="url(#vfl-hierarchy-arrow-middle)"/>
        <path className="vfl-hierarchy-deep-link" d={links.deep} markerEnd="url(#vfl-hierarchy-arrow-deep)"/>
      </svg>
      <div className="vfl-hierarchy-network" aria-label="输入经过网络逐级处理：浅层、中间层、深层。连线对应各阶段的输出特征图。">
        <div className="vfl-hierarchy-pipeline">
          <div className="vfl-hierarchy-source"><AtlasImage src={asset(sample.input)} alt={`输入：${name}`}/><Typography variant="bodySmall" tone="accent">输入图像</Typography></div>
          {[...LEVELS].reverse().map(level=><div className={`vfl-hierarchy-stage vfl-hierarchy-${level.key}`} key={level.key}>
            <svg className="vfl-hierarchy-cube" viewBox="0 0 120 150" role="img" aria-label={`${level.label}卷积处理阶段示意，不是卷积核`}>
              <defs><linearGradient id={`vfl-cube-${level.key}`} x2="1" y2="1"><stop stopColor={level.key==='deep'?'#ffead5':level.key==='middle'?'#eee0ff':'#d5ecff'}/><stop offset="1" stopColor={level.key==='deep'?'#efaa66':level.key==='middle'?'#ac80e0':'#6db0f2'} stopOpacity=".65"/></linearGradient></defs>
              <path d="M15 35L49 10H110L76 35Z" fill="var(--level-bg)" stroke="currentColor" strokeOpacity=".5"/>
              <path d="M76 35L110 10V108L76 135Z" fill={`url(#vfl-cube-${level.key})`} stroke="currentColor" strokeOpacity=".5"/>
              <path d="M15 35H76V135H15Z" fill={`url(#vfl-cube-${level.key})`} stroke="currentColor" strokeOpacity=".6"/>
              <path d="M35 35V135M55 35V135M15 68H76M15 101H76M87 27V126M98 19V117" fill="none" stroke="currentColor" strokeOpacity=".12"/>
            </svg>
            <svg className="vfl-hierarchy-output-link" viewBox="0 0 40 24" aria-hidden="true"><path d="M0 12H32M25 5L33 12L25 19" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <Typography variant="bodySmall" tone="accent">卷积层 × N</Typography>
          </div>)}
        </div>
        <div className="vfl-hierarchy-input">
<Typography variant="bodySmall" tone="accent">输入 · {name}</Typography><Button onClick={switchDigit}>切换数字</Button>
          <ExplainPanelButton label="网络与特征图说明"><Typography variant="bodySmall">左边方块表示卷积处理阶段，不是卷积核；右边展示对应阶段的输出特征图。浅层、中间层、深层分别展示 MobileNetV3-Small 模块 1、4、10 的输出。</Typography><Typography variant="bodySmall">展示来自同一预训练模型的固定通道。层级说明概括常见表示规律，不为某张特征图指定语义；跨通道颜色强度不能直接比较。</Typography></ExplainPanelButton>
        </div>
      </div>
      <div className="vfl-hierarchy-levels">
        <div className="vfl-hierarchy-abstraction"><svg viewBox="0 0 40 400" preserveAspectRatio="none" aria-hidden="true"><path d="M16 396V26H4L20 4L36 26H24V396Z" fill="#ef9647"/></svg><Typography variant="bodySmall" tone="accent">特征更有语义</Typography></div>
        {LEVELS.map(level => <section className={`vfl-hierarchy-level vfl-hierarchy-${level.key}`} key={level.key}>
          <div className="vfl-hierarchy-level-heading"><div><Typography variant="h3" tone="inherit">{level.label}特征</Typography><Typography variant="bodySmall" tone="muted">{manifest.stages[level.key].shapeCHW[1]} × {manifest.stages[level.key].shapeCHW[2]} · {manifest.stages[level.key].shapeCHW[0]} 通道</Typography></div><Typography className="vfl-hierarchy-description" variant="bodySmall" tone="inherit">{level.description}</Typography></div>
          <div className="vfl-hierarchy-responses">{features[level.key].slice(0, 3).map(feature => <AtlasImage key={`${sampleId}-${level.key}-${feature.channel}`} src={asset(feature.image)} alt={`${name}的${level.label}响应`} onError={() => setFailedSample(sampleId)}/>)}</div>
        </section>)}
      </div>
    </div>
    {failedSample === sampleId && <Typography className="vfl-hierarchy-error" variant="bodySmall" tone="danger" role="alert">图片加载失败，请刷新重试。</Typography>}
  </ContentBlock>;
}
