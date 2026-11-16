import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect,useMemo,useRef,useState,type MouseEvent } from 'react';
import { Button, ContentBlock, Switch, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import { analyzeHistogram } from '../OtsuThresholdPage/otsuModel';
import { diagonalExample,filteredMask,neighbors,traceComponents,type Connectivity } from './connectedModel';
import './ConnectedComponentsPage.css';
const N=128,COLORS=['#2783ed','#20a878','#9761d9','#ed9a28','#1aafb7','#d66a89'];
const samples=[['硬币','binarization-metal-tokens.jpg'],['零件','otsu-mechanical-parts.jpg'],['文档','otsu-document.jpg'],['猫咪','digital-image-cat-scene.jpg'],['斜角示例','']];
function loadMask(file:string):Promise<Uint8Array>{return new Promise((resolve,reject)=>{const image=new Image(); image.crossOrigin = 'anonymous';image.onload=()=>{const c=document.createElement('canvas');c.width=N;c.height=N;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0,N,N);const rgba=ctx.getImageData(0,0,N,N).data,gray=Uint8Array.from({length:N*N},(_,i)=>Math.round(.299*rgba[i*4]+.587*rgba[i*4+1]+.114*rgba[i*4+2])),hist=Array<number>(256).fill(0);gray.forEach(v=>hist[v]++);const t=analyzeHistogram(hist).best??128;resolve(gray.map(v=>v<t?1:0));};image.onerror=reject;image.src=moduleAssetUrl('images/'+file);});}
export function ConnectedComponentsPage(){
  const [inputs,setInputs]=useState<Uint8Array[]>([]),[failed,setFailed]=useState(false),[sample,setSample]=useState(0),[connectivity,setConnectivity]=useState<Connectivity>(8),[clean,setClean]=useState(true),[cursor,setCursor]=useState(0),[running,setRunning]=useState(false),[picked,setPicked]=useState(0),[use,setUse]=useState<'count'|'box'|'extract'>('count');
  const left=useRef<HTMLCanvasElement>(null),right=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{let active=true;Promise.all(samples.slice(0,4).map(([,file])=>loadMask(file))).then(a=>{if(active)setInputs(a);}).catch(()=>{if(active)setFailed(true);});return()=>{active=false;};},[]);
  const size=sample===4?12:N,raw=useMemo(()=>sample===4?diagonalExample():inputs[sample],[sample,inputs]);
  const mask=useMemo(()=>raw?filteredMask(raw,size,size,connectivity,clean&&sample!==4?8:0):new Uint8Array(size*size),[raw,size,connectivity,clean,sample]);
  const trace=useMemo(()=>traceComponents(mask,size,size,connectivity),[mask,size,connectivity]);
  const visited=useMemo(()=>{const labels=new Uint32Array(mask.length);for(let k=0;k<Math.min(cursor,trace.order.length);k++){const i=trace.order[k];labels[i]=trace.labels[i];}return labels;},[trace,cursor,mask.length]);
  const current=cursor?trace.order[Math.min(cursor,trace.order.length)-1]:undefined,found=cursor?trace.labels[current!]:0,complete=cursor===trace.order.length&&cursor>0;
  const reset=()=>{setRunning(false);setCursor(0);setPicked(0);};
  // Advance a prefix of the actual BFS trace over four seconds. Single-step is one
  // dequeued pixel; pausing keeps the prefix and resuming continues from there.
  useEffect(()=>{if(!running)return;const start=cursor,time=performance.now(),rate=Math.max(1,trace.order.length)/4000;const timer=window.setInterval(()=>{const next=Math.min(trace.order.length,start+Math.floor((performance.now()-time)*rate));setCursor(next);if(next>=trace.order.length)setRunning(false);},30);return()=>window.clearInterval(timer);},[running,trace]);
  useEffect(()=>{
    for(const [canvas,isResult] of [[left.current,false],[right.current,true]] as const){
      if(!canvas)continue;canvas.width=size;canvas.height=size;const ctx=canvas.getContext('2d')!,image=ctx.createImageData(size,size);
      for(let i=0;i<mask.length;i++){
        const label=visited[i],id=trace.labels[i];let rgb=[255,255,255];
        if(mask[i]){if(!isResult)rgb=picked&&id===picked?[53,132,219]:[35,45,56];else if(label){const hex=COLORS[(label-1)%COLORS.length];rgb=[1,3,5].map(k=>parseInt(hex.slice(k,k+2),16));}else rgb=[229,235,242];}
        if(picked&&isResult&&label!==picked){rgb=use==='extract'?[255,255,255]:rgb.map(v=>Math.round(v*.25+255*.75));}
        image.data.set([...rgb,255],i*4);
      }
      ctx.putImageData(image,0,0);
      if(current!==undefined&&!complete){const x=current%size,y=Math.floor(current/size);ctx.strokeStyle='#f4b62d';ctx.lineWidth=Math.max(.4,size/180);ctx.strokeRect(x-.5,y-.5,2,2);}
      if(picked&&use==='box'){const r=trace.regions[picked-1];ctx.strokeStyle='#197bf5';ctx.lineWidth=Math.max(.4,size/160);ctx.strokeRect(r.x,r.y,r.w,r.h);}
    }
  },[mask,visited,trace,picked,use,size,current,complete]);
  const select=(e:MouseEvent<HTMLCanvasElement>)=>{const b=e.currentTarget.getBoundingClientRect(),side=Math.min(b.width,b.height),x=Math.floor((e.clientX-b.left-(b.width-side)/2)/side*size),y=Math.floor((e.clientY-b.top-(b.height-side)/2)/side*size);if(x>=0&&x<size&&y>=0&&y<size)setPicked(trace.labels[y*size+x]);};
  const focus=current??trace.order[0],cx=focus===undefined?Math.floor(size/2):focus%size,cy=focus===undefined?Math.floor(size/2):Math.floor(focus/size),offsets=neighbors(connectivity);
  const action=()=>{if(running)setRunning(false);else {if(complete){setCursor(0);setPicked(0);}setRunning(true);}};
  const status=complete?`完成：${trace.regions.length} 个连通域`:cursor?`正在扩展第 ${found} 块`:'从第一个前景像素开始';
  return <ContentBlock shuku-edit-id="e-f73e4537-70a5-4a33-9cf7-0685e1f4983b" className="di-conn" title="连通域有什么用" subtitle="把前景分成区域，用来计数、定位和提取目标。" headingLevel={1}>
    <div shuku-edit-id="e-27f16441-9111-4363-b3a3-1c4563c0bebc" className="di-conn__body" data-ready={Boolean(raw)} data-connectivity={connectivity} data-cursor={cursor} data-total={trace.order.length} data-count={trace.regions.length} data-running={running} data-size={size} data-sample={sample}>
      <div shuku-edit-id="e-e08d8359-b828-4588-88d2-38cd66a62ff3" className="di-conn__toolbar"><div shuku-edit-id="e-006c2a3f-54b3-42a1-9fc0-90066a8a9e3d" role="group" aria-label="示例图像">{samples.map(([name],i)=><Button key={name} active={sample===i} variant={sample===i?'primary':'default'} disabled={!raw&&i!==4} onClick={()=>{reset();setSample(i);}}><Typography shuku-edit-id="e-7b0d48c8-5762-4c84-b8d5-d03e5eff00e3" variant="bodySmall" tone="inherit">{name}</Typography></Button>)}</div><Switch checked={clean} disabled={sample===4} onChange={e=>{reset();setClean(e.target.checked);}} label={<Typography shuku-edit-id="e-79a81149-d724-4172-a4d1-fc0ae212d43b" variant="bodySmall" tone="muted">忽略小斑点</Typography>}/></div>
      <div shuku-edit-id="e-8dd80b8c-7264-411f-ac64-7c56d494a30b" className="di-conn__main">
        <section shuku-edit-id="e-2c9bf60c-a3eb-410f-a7b8-593214882933" className="di-conn__demo"><div shuku-edit-id="e-47b2e8cf-85a4-4341-8563-1c7c9c9bd4d5" className="di-conn__images">{[[left,'二值图'],[right,'区域标记']] .map(([ref,title],i)=><div shuku-edit-id="e-cc9a3180-ea99-4a33-a8f8-cef8b899d40c" className="di-conn__image" key={i}><Typography shuku-edit-id="e-fa43d282-a3c8-4ace-96e9-e0a8f886aee4" as="h2" variant="h3" tone="accent" align="center">{String(title)}</Typography><div shuku-edit-id="e-cd023fb2-44d3-4f7c-9d5a-34a63442ff7d"><canvas shuku-edit-id="e-c2aae723-6317-4744-8bdb-4d0770da4dcf" ref={ref as typeof left} onClick={select} role="img" aria-label={i?'按真实搜索顺序逐步标记的连通域':'当前图像的前景二值图'}/></div><Typography shuku-edit-id="e-77d90877-0fdf-44fa-b1e1-223f5bc901ba" variant="bodySmall" tone="muted" align="center">{i?status:sample===4?'仅在斜角接触的两块像素':`教学网格 ${size} × ${size}`}</Typography></div>)}</div>
          <div shuku-edit-id="e-52884593-7291-4dc7-9402-3f6c48868ebe" className="di-conn__actions"><Button variant="primary" disabled={!raw} onClick={action}><Typography shuku-edit-id="e-71fb84f7-93b9-4fa9-bf6f-02cde88c6df7" variant="body" tone="inherit">{running?'暂停':complete?'重播':cursor?'继续':'寻找连通域'}</Typography></Button><Button disabled={!raw||complete} onClick={()=>{setRunning(false);setCursor(n=>Math.min(trace.order.length,n+1));}}><Typography shuku-edit-id="e-00b97fe5-1b9c-47d2-9659-670435685dbd" variant="bodySmall" tone="inherit">一个像素</Typography></Button><Button onClick={reset}><Typography shuku-edit-id="e-ffedeca8-2ced-4e22-bf5e-b5ccb67ac18b" variant="bodySmall" tone="inherit">重置</Typography></Button><Typography shuku-edit-id="e-83af4327-1487-41b2-9909-fdc38dc65df0" variant="bodySmall" tone="muted">{cursor}/{trace.order.length} 个前景像素</Typography></div>
        </section>
        <aside shuku-edit-id="e-6503563d-5b20-4a79-b2a4-07655b525695" className="di-conn__rules"><Typography shuku-edit-id="e-b62d7140-e7a8-4c2c-831c-d9c6e4067e6c" as="h2" variant="h3" tone="accent">怎样继续扩展？</Typography><div shuku-edit-id="e-5d877643-c259-4b81-a238-a9bcf059be57" className="di-conn__connect" role="group" aria-label="相邻规则">{([4,8] as const).map(n=><Button key={n} variant={connectivity===n?'primary':'default'} active={connectivity===n} onClick={()=>{reset();setConnectivity(n);}}><Typography shuku-edit-id="e-e58e83c8-5f6b-4384-9c12-15beabcd1a1b" variant="body" tone="inherit">{n===4?'四连通':'八连通'}</Typography></Button>)}</div><Typography shuku-edit-id="e-8652e135-a912-476c-a0f1-87160c4ce8ae" variant="bodySmall" tone="muted">{connectivity===4?'只看上下左右':'上下左右，再加四个斜角'}</Typography>
          <div shuku-edit-id="e-76633c6c-f4a8-46b6-9f72-6795574c6e2e" className="di-conn__local" role="img" aria-label="当前像素及实际相邻前景"><svg shuku-edit-id="e-d92d4c34-dda7-49c2-b22b-a16b9259fa10" viewBox="0 0 300 300">{Array.from({length:9},(_,i)=>{const dx=i%3-1,dy=Math.floor(i/3)-1,x=cx+dx,y=cy+dy,inside=x>=0&&x<size&&y>=0&&y<size,foreground=inside&&mask[y*size+x],enabled=i===4||offsets.some(([nx,ny])=>nx===dx&&ny===dy);return <rect shuku-edit-id="e-3e57bb2e-87b8-43e9-9855-da92e36c2251" key={i} x={i%3*100+3} y={Math.floor(i/3)*100+3} width="94" height="94" rx="8" fill={foreground?'#31465e':'#f5f8fc'} stroke={i===4?'#f4b62d':enabled?'#3389e9':'#d5dee9'} strokeWidth={i===4?6:enabled?3:1} opacity={enabled?1:.25}/>;})}</svg></div>
          <Typography shuku-edit-id="e-36abb435-3c64-40cb-8747-9aa9cffef2c6" variant="bodySmall" tone="accent">黄色：当前像素 · 蓝框：检查范围</Typography><Typography shuku-edit-id="e-1902c6d6-f862-4b69-84f2-256fdf92f9a8" variant="body" tone="accent">相邻、是前景、还没访问过 → 加入同一块。</Typography><Typography shuku-edit-id="e-e8cc66f5-0aba-4649-94d0-b6fc6cb0ffcd" variant="bodySmall" tone="muted">这一块走完，再找下一个起点。</Typography>
        </aside>
      </div>
      <footer shuku-edit-id="e-b2071503-65b2-4b78-ac4b-b7b539b96f8f" className="di-conn__uses"><Typography shuku-edit-id="e-4faf1d67-e3f5-43f3-be6c-4938b344e3d2" variant="h3" tone="accent">连通域有什么用？</Typography><div shuku-edit-id="e-525c0b08-9a40-49b6-9d27-034a1c2e1bf2">{[['count','数目标'],['box','找位置'],['extract','提取一个目标']].map(([id,name])=><Button key={id} active={use===id} onClick={()=>{setUse(id as typeof use);if(id!=='count'&&!picked&&trace.regions.length)setPicked(1);}}><Typography shuku-edit-id="e-b4c44d26-bad4-4371-ac88-0e98b43dd2a1" variant="body" tone="inherit">{name}</Typography></Button>)}</div><Typography shuku-edit-id="e-b5a194ef-3aa7-4589-83c9-edacbb0964db" variant="bodySmall" tone="muted">{use==='count'?(complete?`按${connectivity}连通，共 ${trace.regions.length} 块；区域不一定等于物体。`:'标记完成后，统计有多少块。'):use==='box'?'点击目标，显示这一块的外接框。':'点击目标，只保留它所属的区域。'}</Typography></footer>
      {failed&&<Typography shuku-edit-id="e-e13a0e3a-f44c-455b-89fa-52ebc8509aac" role="alert" variant="bodySmall" tone="danger">素材加载失败，请刷新重试。</Typography>}
    </div>
  </ContentBlock>;
}
