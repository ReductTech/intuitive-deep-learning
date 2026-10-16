import { useEffect,useMemo,useRef,useState,type MouseEvent } from 'react';
import { Button,ContentBlock,Switch,Typography,moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import { analyzeHistogram } from '../OtsuThresholdPage/otsuModel';
import { diagonalExample,filteredMask,neighbors,traceComponents,type Connectivity } from './connectedModel';
import './ConnectedComponentsPage.css';
const N=128,COLORS=['#2783ed','#20a878','#9761d9','#ed9a28','#1aafb7','#d66a89'];
const samples=[['硬币','binarization-metal-tokens.png'],['零件','otsu-mechanical-parts.png'],['文档','otsu-document.png'],['猫咪','digital-image-cat-scene.png'],['斜角示例','']];
function loadMask(file:string):Promise<Uint8Array>{return new Promise((resolve,reject)=>{const image=new Image(); image.crossOrigin = 'anonymous';image.onload=()=>{const c=document.createElement('canvas');c.width=N;c.height=N;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0,N,N);const rgba=ctx.getImageData(0,0,N,N).data,gray=Uint8Array.from({length:N*N},(_,i)=>Math.round(.299*rgba[i*4]+.587*rgba[i*4+1]+.114*rgba[i*4+2])),hist=Array<number>(256).fill(0);gray.forEach(v=>hist[v]++);const t=analyzeHistogram(hist).best??128;resolve(gray.map(v=>v<t?1:0));};image.onerror=reject;image.src=moduleAssetUrl(outline.moduleIdentity.id,'images/'+file);});}
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
  return <ContentBlock className="di-conn" title="连通域有什么用" subtitle="把前景分成区域，用来计数、定位和提取目标。" headingLevel={1}>
    <div className="di-conn__body" data-ready={Boolean(raw)} data-connectivity={connectivity} data-cursor={cursor} data-total={trace.order.length} data-count={trace.regions.length} data-running={running} data-size={size} data-sample={sample}>
      <div className="di-conn__toolbar"><div role="group" aria-label="示例图像">{samples.map(([name],i)=><Button key={name} active={sample===i} variant={sample===i?'primary':'default'} disabled={!raw&&i!==4} onClick={()=>{reset();setSample(i);}}><Typography variant="bodySmall" tone="inherit">{name}</Typography></Button>)}</div><Switch checked={clean} disabled={sample===4} onChange={e=>{reset();setClean(e.target.checked);}} label={<Typography variant="bodySmall" tone="muted">忽略小斑点</Typography>}/></div>
      <div className="di-conn__main">
        <section className="di-conn__demo"><div className="di-conn__images">{[[left,'二值图'],[right,'区域标记']] .map(([ref,title],i)=><div className="di-conn__image" key={i}><Typography as="h2" variant="h3" tone="accent" align="center">{String(title)}</Typography><div><canvas ref={ref as typeof left} onClick={select} role="img" aria-label={i?'按真实搜索顺序逐步标记的连通域':'当前图像的前景二值图'}/></div><Typography variant="bodySmall" tone="muted" align="center">{i?status:sample===4?'仅在斜角接触的两块像素':`教学网格 ${size} × ${size}`}</Typography></div>)}</div>
          <div className="di-conn__actions"><Button variant="primary" disabled={!raw} onClick={action}><Typography variant="body" tone="inherit">{running?'暂停':complete?'重播':cursor?'继续':'寻找连通域'}</Typography></Button><Button disabled={!raw||complete} onClick={()=>{setRunning(false);setCursor(n=>Math.min(trace.order.length,n+1));}}><Typography variant="bodySmall" tone="inherit">一个像素</Typography></Button><Button onClick={reset}><Typography variant="bodySmall" tone="inherit">重置</Typography></Button><Typography variant="bodySmall" tone="muted">{cursor}/{trace.order.length} 个前景像素</Typography></div>
        </section>
        <aside className="di-conn__rules"><Typography as="h2" variant="h3" tone="accent">怎样继续扩展？</Typography><div className="di-conn__connect" role="group" aria-label="相邻规则">{([4,8] as const).map(n=><Button key={n} variant={connectivity===n?'primary':'default'} active={connectivity===n} onClick={()=>{reset();setConnectivity(n);}}><Typography variant="body" tone="inherit">{n===4?'四连通':'八连通'}</Typography></Button>)}</div><Typography variant="bodySmall" tone="muted">{connectivity===4?'只看上下左右':'上下左右，再加四个斜角'}</Typography>
          <div className="di-conn__local" role="img" aria-label="当前像素及实际相邻前景"><svg viewBox="0 0 300 300">{Array.from({length:9},(_,i)=>{const dx=i%3-1,dy=Math.floor(i/3)-1,x=cx+dx,y=cy+dy,inside=x>=0&&x<size&&y>=0&&y<size,foreground=inside&&mask[y*size+x],enabled=i===4||offsets.some(([nx,ny])=>nx===dx&&ny===dy);return <rect key={i} x={i%3*100+3} y={Math.floor(i/3)*100+3} width="94" height="94" rx="8" fill={foreground?'#31465e':'#f5f8fc'} stroke={i===4?'#f4b62d':enabled?'#3389e9':'#d5dee9'} strokeWidth={i===4?6:enabled?3:1} opacity={enabled?1:.25}/>;})}</svg></div>
          <Typography variant="bodySmall" tone="accent">黄色：当前像素 · 蓝框：检查范围</Typography><Typography variant="body" tone="accent">相邻、是前景、还没访问过 → 加入同一块。</Typography><Typography variant="bodySmall" tone="muted">这一块走完，再找下一个起点。</Typography>
        </aside>
      </div>
      <footer className="di-conn__uses"><Typography variant="h3" tone="accent">连通域有什么用？</Typography><div>{[['count','数目标'],['box','找位置'],['extract','提取一个目标']].map(([id,name])=><Button key={id} active={use===id} onClick={()=>{setUse(id as typeof use);if(id!=='count'&&!picked&&trace.regions.length)setPicked(1);}}><Typography variant="body" tone="inherit">{name}</Typography></Button>)}</div><Typography variant="bodySmall" tone="muted">{use==='count'?(complete?`按${connectivity}连通，共 ${trace.regions.length} 块；区域不一定等于物体。`:'标记完成后，统计有多少块。'):use==='box'?'点击目标，显示这一块的外接框。':'点击目标，只保留它所属的区域。'}</Typography></footer>
      {failed&&<Typography role="alert" variant="bodySmall" tone="danger">素材加载失败，请刷新重试。</Typography>}
    </div>
  </ContentBlock>;
}
