import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { AtlasImage } from '../../components/AtlasImage';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { flattenResponses, flattenDisplay } from '../../services/lessonData';
import { atlasIndex } from '../../services/imageAtlas';
import { withAssetResources } from "@shuku/course-style/react/withAssetResources";
import './FeatureMapsToClassifierPage.css';
function Texture({values,size,channel}:{values:number[];size:number;channel:number}){
  const { RANGES } = flattenDisplay();
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const ctx=ref.current?.getContext('2d');if(!ctx)return;const p=ctx.createImageData(size,size),[baseline,range]=RANGES[channel],colors=[[21,20,72],[20,65,136],[20,158,189],[112,205,108],[255,218,67]];values.forEach((v,i)=>{const t=Math.max(0,Math.min(.9999,Math.abs(v-baseline)/Math.max(range,1e-9)))*4,k=Math.floor(t),f=t-k;p.data.set([...colors[k].map((a,j)=>Math.round(a+(colors[k+1][j]-a)*f)),255],i*4);});ctx.putImageData(p,0,0);},[values,size,channel]);
  return <canvas shuku-edit-id="e-c582cc4e-1288-4738-a203-1618eb15d3dd" ref={ref} width={size} height={size}/>;
}
const SIZES = [20, 24, 28, 32, 36, 40];
function FeatureMapsToClassifierPageContent(){
  const data = flattenResponses.read();
  const { CHANNELS } = flattenDisplay();
  const [size,setSize]=useState(28),[failed,setFailed]=useState(false);
  const scene=useRef<HTMLDivElement>(null),drag=useRef<{x:number;y:number;size:number;scale:number}|null>(null);
  const sample=data.samples.find(s=>s.inputSize===size) ?? data.samples[0];
  const count=sample.values.flat().length,matched=count===784;
  const difference=count-784;
  function change(v:number){setSize(Math.max(20,Math.min(40,Math.round(v/4)*4)));}
  function start(e:PointerEvent<HTMLButtonElement>){e.currentTarget.setPointerCapture(e.pointerId);drag.current={x:e.clientX,y:e.clientY,size,scale:(scene.current?.getBoundingClientRect().width??1480)/1480};}
  function move(e:PointerEvent<HTMLButtonElement>){const d=drag.current;if(d)change(d.size+((e.clientX-d.x)+(e.clientY-d.y))/2/d.scale/9);}
  return <ContentBlock shuku-edit-id="e-7ccbf98f-036b-44ef-b25e-68144549942c" className="vfl-flatten-page" headingLevel={1} title="从特征图到全连接分类器" subtitle="改变图像尺寸后，展平向量还能接入原来的全连接层吗？">
    <div shuku-edit-id="e-a67f7e83-0c5f-47fc-99f2-6e47e4210f1e" className="vfl-flatten-controls">
      <Typography shuku-edit-id="e-c7de06d5-7cd1-4f76-9c00-bd176e476c63" variant="body" tone="accent">调整输入尺寸</Typography>
      <div shuku-edit-id="e-2b1ac37b-8f40-4daf-bdfc-fda8ac6127da" className="vfl-flatten-sizes" role="group" aria-label="选择输入尺寸">{SIZES.map(value=><Button key={value} active={size===value} aria-pressed={size===value} onClick={()=>change(value)}>{value} × {value}</Button>)}</div>
    </div>
    <div shuku-edit-id="e-982f6999-9c3d-4f98-a711-e970445a8100" ref={scene} className={`vfl-flatten-scene ${matched?'is-matched':'is-mismatched'}`}>
      <section shuku-edit-id="e-1ff0c52a-c236-4358-9568-d6d19bd06553" className="vfl-flatten-stage vfl-flatten-input">
        <div shuku-edit-id="e-c57a5492-31a3-410c-80b9-f01f5f80870e" className="vfl-flatten-heading"><Typography shuku-edit-id="e-a82168fb-a419-4e10-bc0e-ee6a405bb3f2" as="h2" variant="h3" tone="accent">输入图像</Typography><Typography shuku-edit-id="e-7e762a2b-6a21-4bdb-86de-75a05f04c144" variant="bodySmall" tone="muted">{size} × {size}</Typography></div>
        <div shuku-edit-id="e-bca84671-6e34-4559-8486-9f3c5adec4b6" className="vfl-flatten-visual vfl-flatten-image-zone"><div shuku-edit-id="e-983d2750-08e4-4cb3-8fd5-ff1398d2b35e" className="vfl-flatten-image" style={{width:size*5.5,height:size*5.5}}><AtlasImage src={moduleAssetUrl(`flatten-interface/${sample.input}`)} alt={`数字7，${size}×${size}输入`} onError={()=>setFailed(true)}/><Button className="vfl-flatten-handle" role="slider" aria-label="拖动放大或缩小输入图像" aria-valuemin={20} aria-valuemax={40} aria-valuenow={size} aria-valuetext={`${size}×${size}`} onPointerDown={start} onPointerMove={move} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onKeyDown={e=>{if(['ArrowLeft','ArrowDown','ArrowRight','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();change(e.key==='Home'?20:e.key==='End'?40:size+(['ArrowLeft','ArrowDown'].includes(e.key)?-4:4));}}}><span shuku-edit-id="e-e925bdbc-2c92-4baf-8f72-eee25f561e50" aria-hidden="true"/></Button></div></div>
        <Typography shuku-edit-id="e-957b2ba7-64f5-4818-b52a-b8f623637e6c" className="vfl-flatten-stage-note" variant="bodySmall" tone="muted">拖动调整尺寸</Typography>
      </section>
      <span shuku-edit-id="e-741476cc-f633-40fe-998d-cca19e0d4b8b" className="vfl-flatten-arrow" aria-hidden="true">→</span>
      <section shuku-edit-id="e-e4224b8c-7a27-4c5a-8e41-ef5c2538865d" className="vfl-flatten-stage vfl-flatten-maps">
        <div shuku-edit-id="e-68485967-a649-4154-8402-8e30ebe362b2" className="vfl-flatten-heading"><Typography shuku-edit-id="e-8ced8826-18f8-4a30-b311-aa35de39c10a" as="h2" variant="h3" tone="accent">卷积特征图</Typography><Typography shuku-edit-id="e-258f755e-d787-4635-b97c-f31a6cceaaf3" variant="bodySmall" tone="muted">{sample.mapSize} × {sample.mapSize} × 16</Typography></div>
        <div shuku-edit-id="e-477a156f-9f68-4c52-bc54-4aae54ad115d" className="vfl-flatten-visual"><div shuku-edit-id="e-9adebab3-fae2-426e-a2f1-957a664e928e" className="vfl-flatten-stack" style={{'--map-side':`${sample.mapSize*14}px`} as CSSProperties}>{[...CHANNELS].reverse().map((channel,i)=><div shuku-edit-id="e-65e9631c-409b-4e46-acd6-3021f908b6a6" key={channel} className="vfl-flatten-plane" style={{'--depth':4-i} as CSSProperties}><Texture values={sample.values[channel]} size={sample.mapSize} channel={channel}/></div>)}</div></div>

      </section>
      <span shuku-edit-id="e-878f84a5-25c8-48b7-b4e8-39a34466f4c7" className="vfl-flatten-arrow" aria-hidden="true">→</span>
      <section shuku-edit-id="e-13707dd3-2059-4c43-9119-a3876e545b98" className="vfl-flatten-stage vfl-flatten-vector">
        <div shuku-edit-id="e-d05b3d27-ea60-4ae0-aa80-97c714a6848c" className="vfl-flatten-heading"><Typography shuku-edit-id="e-2cbb198f-7d1b-4122-bcb7-6b77c0256320" as="h2" variant="h3" tone="accent">展平向量</Typography><Typography shuku-edit-id="e-dc4b2866-b9a3-42bd-9083-c3210adc7d1a" variant="bodySmall" tone={matched?'success':'warning'}>{count} 个数</Typography></div>
        <div shuku-edit-id="e-71737e1a-b8ff-4bbb-9b29-94680f2eddf9" className="vfl-flatten-visual"><div shuku-edit-id="e-5999b50b-8708-43e3-9ec6-851e6e3f2717" className="vfl-flatten-length-comparison" aria-label={`一个展平向量，共${count}个数；虚线框代表要求的784个数`}>
          <div shuku-edit-id="e-dec5d83d-4151-47e5-a217-bfebabe341a7" className="vfl-flatten-required-frame" style={{height:`${232*784/1600+4}px`}} aria-hidden="true"/>
          <span shuku-edit-id="e-3127393d-a510-4613-8966-bc50098b0752" className={`vfl-flatten-length-bar ${matched?'is-fit':''}`} style={{height:`${232*count/1600}px`}} aria-hidden="true"/>
          <div shuku-edit-id="e-351416b6-6c47-452a-93be-4e802d9a90ff" className="vfl-flatten-frame-label"><Typography shuku-edit-id="e-991d6729-5fae-4846-aa56-14a689dbd4cd" variant="bodySmall" tone="muted">要求 784</Typography></div>
        </div></div>
        <Typography shuku-edit-id="e-c77cfd4b-9c60-4c04-97d0-ec02e30d7069" className="vfl-flatten-stage-note" variant="bodySmall" tone="muted">向量长度须与框相同</Typography>
      </section>
      <span shuku-edit-id="e-51314c78-86ce-4459-87c6-f2d35097e55c" className={`vfl-flatten-arrow ${matched?'':'is-blocked'}`} aria-hidden="true">{matched?'→':'⇥'}</span>
      <section shuku-edit-id="e-98b2c367-64d4-4769-8f65-3a6ff3adf83e" className="vfl-flatten-stage vfl-flatten-classifier">
        <div shuku-edit-id="e-567f000d-0a8a-40cd-acba-1f2ef4e9285e" className="vfl-flatten-heading"><Typography shuku-edit-id="e-e5a06103-9514-4e8d-a94c-c7e0c5ddc066" as="h2" variant="h3" tone="accent">全连接分类器</Typography><Typography shuku-edit-id="e-bf7b0559-b39d-44cd-8869-30025fe6952f" variant="bodySmall" tone="muted">固定接收 784 个数</Typography></div>
        <div shuku-edit-id="e-13a47fe0-f8f9-42f6-bf97-da9e3c4ed034" className="vfl-flatten-visual"><svg shuku-edit-id="e-fd5eb3a6-acf7-4dce-a8be-28a05a76dba1" viewBox="0 0 280 250" aria-label="全连接网络示意，固定输入长度784"><g shuku-edit-id="e-6d71d099-c207-4816-88cf-954c8894f42c" className="vfl-flatten-wires">{[25,60,95,155,190,225].flatMap(a=>[35,85,165,215].map(b=><line shuku-edit-id="e-70df3b36-ffda-4c47-8514-db642b1dbe23" key={`${a}-${b}`} x1="30" y1={a} x2="140" y2={b}/>))}{[35,85,165,215].flatMap(a=>[45,85,165,205].map(b=><line shuku-edit-id="e-8c658bdc-30a3-41de-b494-013d1b707f35" key={`${a}-${b}`} x1="140" y1={a} x2="250" y2={b}/>))}</g><g shuku-edit-id="e-0774b277-5ec5-47d8-8104-61ed3252da15" className="vfl-flatten-input-nodes">{[25,60,95,155,190,225].map(y=><circle shuku-edit-id="e-3f9d87cd-c080-4aca-8598-1c61fc497f35" key={y} cx="30" cy={y} r="8"/>)}</g><g shuku-edit-id="e-6467fa2f-93a6-46c6-a19d-4506d2ebcd6a" className="vfl-flatten-hidden-nodes">{[35,85,165,215].map(y=><circle shuku-edit-id="e-bb7b59af-2bed-4867-a288-02431f1ec605" key={y} cx="140" cy={y} r="11"/>)}</g><g shuku-edit-id="e-a5b3ffbe-f261-4bd0-8fa8-1ce87dea129e" className="vfl-flatten-output-nodes">{[45,85,165,205].map(y=><circle shuku-edit-id="e-6730e8fa-a445-428a-bcf7-4ab1d1a535d0" key={y} cx="250" cy={y} r="10"/>)}</g><g shuku-edit-id="e-6a72fc3d-7b2f-41e5-b0df-023bed33582f" className="vfl-flatten-node-ellipsis" aria-hidden="true">{[30,140,250].map(x=><g shuku-edit-id="e-0bafd7e0-13f3-488c-8e25-f86aaa44f849" key={x}><rect shuku-edit-id="e-cd6f67d3-5725-437d-874c-0afbe9d305ee" x={x-9} y="105" width="18" height="40" rx="5"/>{[117,125,133].map(y=><circle shuku-edit-id="e-41e1f7a7-6ab1-4f16-a2ff-985328bc64f3" key={y} cx={x} cy={y} r="1.8"/>)}</g>)}</g></svg></div>
        <Typography shuku-edit-id="e-7f8f3d57-2694-4bc2-83a9-1b087a7d91b7" className="vfl-flatten-stage-note" variant="bodySmall" tone="muted">一个输入节点接收一个数</Typography>
      </section>
    </div>
    <div shuku-edit-id="e-472c9013-c61c-4aa4-9f87-1f3fcbaa8225" className={`vfl-flatten-conclusion ${matched?'is-matched':''}`} aria-live="polite"><Typography shuku-edit-id="e-a8f1b4c1-0128-4180-96eb-91be84222cd5" variant="body" tone={matched?'success':'warning'}>{matched?'长度匹配，可以接入':'长度不匹配，无法接入'}</Typography><Typography shuku-edit-id="e-e784577e-943c-40bb-ba8c-e88e0f6dbb78" variant="bodySmall" tone="accent">{matched?'784 个数，长度相同':difference<0?`少 ${-difference} 个数`:`多 ${difference} 个数`}</Typography></div>
    {failed && <Typography shuku-edit-id="e-80861e38-1ad4-4d90-99a0-be94fd6eee14" variant="bodySmall" tone="danger">图像加载失败，请刷新重试。</Typography>}
  </ContentBlock>;
}

export const FeatureMapsToClassifierPage = withAssetResources(FeatureMapsToClassifierPageContent, [flattenResponses, atlasIndex]);
