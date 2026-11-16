import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { AtlasImage } from '../../components/AtlasImage';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { flattenResponses, flattenDisplay } from '../../services/lessonData';
import { atlasIndex } from '../../services/imageAtlas';
import { withAssetResources } from "@shuku/course-style/react/withAssetResources";
import './GlobalAveragePoolingPage.css';
function Texture({values,size,channel}:{values:number[];size:number;channel:number}){
  const { RANGES } = flattenDisplay();
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const ctx=ref.current?.getContext('2d');if(!ctx)return;const p=ctx.createImageData(size,size),[baseline,range]=RANGES[channel],colors=[[21,20,72],[20,65,136],[20,158,189],[112,205,108],[255,218,67]];values.forEach((v,i)=>{const t=Math.max(0,Math.min(.9999,Math.abs(v-baseline)/Math.max(range,1e-9)))*4,k=Math.floor(t),f=t-k;p.data.set([...colors[k].map((a,j)=>Math.round(a+(colors[k+1][j]-a)*f)),255],i*4);});ctx.putImageData(p,0,0);},[values,size,channel]);
  return <canvas shuku-edit-id="e-87a66d56-fb6e-40f3-b9b0-ffaee779267b" ref={ref} width={size} height={size}/>;
}
const SIZES = [20, 24, 28, 32, 36, 40];
function GlobalAveragePoolingPageContent(){
  const data = flattenResponses.read();
  const { CHANNELS } = flattenDisplay();
  const [size,setSize]=useState(28),[failed,setFailed]=useState(false);
  const scene=useRef<HTMLDivElement>(null),drag=useRef<{x:number;y:number;size:number;scale:number}|null>(null);
  const sample=data.samples.find(s=>s.inputSize===size) ?? data.samples[0];
  const count=sample.values.length,matched=count===16;
  const averages=sample.values.map(values=>values.reduce((sum,value)=>sum+value,0)/values.length);
  function change(v:number){setSize(Math.max(20,Math.min(40,Math.round(v/4)*4)));}
  function start(e:PointerEvent<HTMLButtonElement>){e.currentTarget.setPointerCapture(e.pointerId);drag.current={x:e.clientX,y:e.clientY,size,scale:(scene.current?.getBoundingClientRect().width??1480)/1480};}
  function move(e:PointerEvent<HTMLButtonElement>){const d=drag.current;if(d)change(d.size+((e.clientX-d.x)+(e.clientY-d.y))/2/d.scale/9);}
  return <ContentBlock shuku-edit-id="e-2be2a4e2-aafd-464d-8717-07169d439bf8" className="vfl-gap-page" headingLevel={1} title="全局平均池化（GAP）" subtitle="Global Average Pooling · 输入大小可以改变，输出向量始终保持 16 维。">
    <div shuku-edit-id="e-5c60b9ae-e25c-4666-a33b-2b5194c7d43d" className="vfl-gap-controls">
      <Typography shuku-edit-id="e-b1323972-47d6-424a-9472-fdace72c2ca4" variant="body" tone="accent">调整输入尺寸</Typography>
      <div shuku-edit-id="e-36f88fd0-70d0-4fbd-998b-e670b32a9f1e" className="vfl-gap-sizes" role="group" aria-label="选择输入尺寸">{SIZES.map(value=><Button key={value} active={size===value} aria-pressed={size===value} onClick={()=>change(value)}>{value} × {value}</Button>)}</div>
    </div>
    <div shuku-edit-id="e-90b7fb21-23b6-4d7f-b4cc-c86f862d2636" ref={scene} className={`vfl-gap-scene ${matched?'is-matched':'is-mismatched'}`}>
      <section shuku-edit-id="e-f84bcb70-035d-49d1-ba95-e22b15bf8288" className="vfl-gap-stage vfl-gap-input">
        <div shuku-edit-id="e-c8cd22d5-568b-4759-ad2e-c56588a4c251" className="vfl-gap-heading"><Typography shuku-edit-id="e-03154519-4101-4e99-bff3-e4d287d58fb8" as="h2" variant="h3" tone="accent">输入图像</Typography><Typography shuku-edit-id="e-d355d9b4-a0b6-43d8-8bab-9c11676467eb" variant="bodySmall" tone="muted">{size} × {size}</Typography></div>
        <div shuku-edit-id="e-5068484e-b6bf-4179-9144-caa77d247f9e" className="vfl-gap-visual vfl-gap-image-zone"><div shuku-edit-id="e-06102e01-cea9-4729-b44d-c7b3565df99e" className="vfl-gap-image" style={{width:size*4.5,height:size*4.5}}><AtlasImage src={moduleAssetUrl(`flatten-interface/${sample.input}`)} alt={`数字7，${size}×${size}输入`} onError={()=>setFailed(true)}/><Button className="vfl-gap-handle" role="slider" aria-label="拖动放大或缩小输入图像" aria-valuemin={20} aria-valuemax={40} aria-valuenow={size} aria-valuetext={`${size}×${size}`} onPointerDown={start} onPointerMove={move} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onKeyDown={e=>{if(['ArrowLeft','ArrowDown','ArrowRight','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();change(e.key==='Home'?20:e.key==='End'?40:size+(['ArrowLeft','ArrowDown'].includes(e.key)?-4:4));}}}><span shuku-edit-id="e-8e608986-9374-4219-b487-cfaf1cdedc82" aria-hidden="true"/></Button></div></div>
      </section>
      <span shuku-edit-id="e-189fafc6-15da-4a42-99f3-bbadf244a631" className="vfl-gap-arrow" aria-hidden="true">→</span>
      <section shuku-edit-id="e-7dd2d2c0-3458-4cc7-aac0-551def3c9233" className="vfl-gap-stage vfl-gap-maps">
        <div shuku-edit-id="e-a7a66ab3-3b1b-4716-a028-1281654ba821" className="vfl-gap-heading"><Typography shuku-edit-id="e-2045e836-e323-4a09-9926-ada71725107f" as="h2" variant="h3" tone="accent">卷积特征图</Typography><Typography shuku-edit-id="e-1e21c6d1-c762-4a1e-a154-b9345fe50615" variant="bodySmall" tone="muted">{sample.mapSize} × {sample.mapSize} × 16</Typography></div>
        <div shuku-edit-id="e-b47c2575-7c45-403c-9af3-58294558ed8d" className="vfl-gap-visual"><div shuku-edit-id="e-5e20ec80-2059-4c87-ba39-34813461b86c" className="vfl-gap-stack" role="img" aria-label={`${count} 个通道的卷积特征图`} style={{'--map-side':`${sample.mapSize*11}px`,'--last-depth':count-1} as CSSProperties}>{Array.from({length:count},(_,i)=>count-1-i).map(channel=><div shuku-edit-id="e-801a56ba-00aa-4cea-aca5-7274ca23b9d0" key={channel} className="vfl-gap-plane" style={{'--depth':channel} as CSSProperties}><Texture values={sample.values[channel]} size={sample.mapSize} channel={channel}/></div>)}</div></div>

      </section>
      <span shuku-edit-id="e-796d30b5-dd6b-4878-820a-0a977b4b9ed9" className="vfl-gap-arrow" aria-hidden="true">→</span>
      <section shuku-edit-id="e-50c4cb8a-b8d7-4cc6-ba29-56c5bc882413" className="vfl-gap-stage vfl-gap-vector">
        <Typography shuku-edit-id="e-17bde751-fbec-44f1-915d-db854b13b4cc" as="h2" variant="h3" tone="accent">GAP：固定长度输出</Typography>
        <div shuku-edit-id="e-f05d51d3-850a-4411-a68d-d025ee7184ef" className="vfl-gap-shape">
          <MathFormulaBlock className="vfl-gap-average-formula"><MathFormulaStatic latex={String.raw`g_c=\frac{1}{HW}\sum_{i=1}^{H}\sum_{j=1}^{W}X_c(i,j)`}/></MathFormulaBlock>
        </div>
        <div shuku-edit-id="e-14cfd8fb-332b-44ca-bdd0-ec380441f0a7" className="vfl-gap-output" data-dimension={count}>
          <Typography shuku-edit-id="e-62c3776e-db23-45a8-8e56-dbacbb19728f" variant="h2" tone="success">{count} 维输出向量</Typography>
          <div shuku-edit-id="e-cf830be8-1b63-47e1-8702-520652f593d1" className="vfl-gap-vector-cells" role="group" aria-label={`输出向量包含 ${count} 个通道平均值，按行排列`}>{averages.map((value,channel)=><div shuku-edit-id="e-ec87ff50-8283-485b-9165-04b212d505db" key={channel} className="vfl-gap-vector-cell" title={`通道 ${channel+1} 的平均值：${value}`}><Typography shuku-edit-id="e-b85cd301-0be5-4483-88a4-64c67df6889f" variant="bodySmall" tone="success">{value.toFixed(2)}</Typography></div>)}</div>
          <Typography shuku-edit-id="e-c629d8be-fafb-45f4-83bf-4a62073e40a4" variant="body" tone="accent">输入怎么缩放，长度都是 16</Typography>
        </div>
        <Typography shuku-edit-id="e-36ae3ca6-3066-4eab-8bbb-691b5db0296f" variant="bodySmall" tone="muted">每个通道求平均 → 每个通道输出 1 个数</Typography>
      </section>
      <span shuku-edit-id="e-eaffce8c-2201-4950-81fb-d9297d1103bb" className={`vfl-gap-arrow ${matched?'':'is-blocked'}`} aria-hidden="true">{matched?'→':'⇥'}</span>
      <section shuku-edit-id="e-cd5d0844-a847-407c-9528-cd20ac16113d" className="vfl-gap-stage vfl-gap-classifier">
        <div shuku-edit-id="e-dcc8c6d3-1908-41ff-b470-7c787a900cf4" className="vfl-gap-heading"><Typography shuku-edit-id="e-a18d8f8e-7aa9-4d28-98aa-bd029a75bef0" as="h2" variant="h3" tone="accent">全连接分类器</Typography><Typography shuku-edit-id="e-caa22035-0145-49a8-b00d-a0166f4e272f" variant="bodySmall" tone="muted">固定接收 16 个数</Typography></div>
        <div shuku-edit-id="e-bf4f461b-6571-45cc-baaa-914583949cae" className="vfl-gap-visual"><svg shuku-edit-id="e-f541ab5f-f99e-49ee-aaaf-c9f62a9ffddb" viewBox="0 0 280 250" aria-label="全连接网络示意，固定输入长度16"><g shuku-edit-id="e-ebc9954f-3e54-43e5-a061-b8c704a9df4e" className="vfl-gap-wires">{[25,60,95,155,190,225].flatMap(a=>[35,85,165,215].map(b=><line shuku-edit-id="e-278434e8-8c5e-446b-a516-c57783203bb2" key={`${a}-${b}`} x1="30" y1={a} x2="140" y2={b}/>))}{[35,85,165,215].flatMap(a=>[45,85,165,205].map(b=><line shuku-edit-id="e-0a17261e-c498-4143-a5f2-51842e7736e0" key={`${a}-${b}`} x1="140" y1={a} x2="250" y2={b}/>))}</g><g shuku-edit-id="e-5b4d43d1-9a7a-40d5-83a2-451d1a3d8fc6" className="vfl-gap-input-nodes">{[25,60,95,155,190,225].map(y=><circle shuku-edit-id="e-147bddc1-cb40-4ea5-81ea-cac2dbc99974" key={y} cx="30" cy={y} r="8"/>)}</g><g shuku-edit-id="e-3ee1592e-fbb1-4f72-8dc0-0a69e62ff1ea" className="vfl-gap-hidden-nodes">{[35,85,165,215].map(y=><circle shuku-edit-id="e-b4febfdb-43bb-4ca3-bb38-73a9cf99bf01" key={y} cx="140" cy={y} r="11"/>)}</g><g shuku-edit-id="e-207c022f-f069-4b77-a91d-a9af974d8ef1" className="vfl-gap-output-nodes">{[45,85,165,205].map(y=><circle shuku-edit-id="e-06a87aba-b8ac-4483-875e-7fe54aa286df" key={y} cx="250" cy={y} r="10"/>)}</g><g shuku-edit-id="e-0bb4e97b-8005-4ed6-abd0-a72dc6af4a6e" className="vfl-gap-node-ellipsis" aria-hidden="true">{[30,140,250].map(x=><g shuku-edit-id="e-6a304c47-a5d6-4142-99d0-f73ac0d4f3c6" key={x}><rect shuku-edit-id="e-4e3bd216-e638-4016-8f66-ce1d3847dd92" x={x-9} y="105" width="18" height="40" rx="5"/>{[117,125,133].map(y=><circle shuku-edit-id="e-1212563b-754d-46fd-a5ee-3bef193e89fd" key={y} cx={x} cy={y} r="1.8"/>)}</g>)}</g></svg></div>
      </section>
    </div>
    <div shuku-edit-id="e-fb925732-aeed-40e9-a8cf-b7024301ddd6" className="vfl-gap-conclusion is-matched" aria-live="polite">
      <Typography shuku-edit-id="e-24286382-f62c-4582-a6b8-d6aa672dd9e5" variant="body" tone="success">{sample.mapSize} × {sample.mapSize} × 16 → 16 维向量</Typography>
      <Typography shuku-edit-id="e-43e88c9e-ccc9-4d31-9abb-5ff91f1b728e" variant="bodySmall" tone="accent">输入尺寸可变，分类器始终接收 16 维向量。</Typography>
    </div>
    {failed && <Typography shuku-edit-id="e-c6eb3610-09ee-40d8-a694-ba8cb9e5b1ab" variant="bodySmall" tone="danger">图像加载失败，请刷新重试。</Typography>}
  </ContentBlock>;
}

export const GlobalAveragePoolingPage = withAssetResources(GlobalAveragePoolingPageContent, [flattenResponses, atlasIndex]);
