import { useEffect,useMemo,useState } from 'react';
import { Button,ContentBlock,Typography } from '../../../shared/react';
import { neighbors,type Connectivity } from './connectedModel';
import { floodFrom,GRID_H,GRID_W,makeTeachingShape } from './floodModel';
import './FindConnectedComponentPage.css';
export function FindConnectedComponentPage(){
 const [variant,setVariant]=useState(0),[connectivity,setConnectivity]=useState<Connectivity>(4),[seed,setSeed]=useState(7*GRID_W+8),[cursor,setCursor]=useState(0),[running,setRunning]=useState(false),[started,setStarted]=useState(false),[backgroundClick,setBackgroundClick]=useState(false);
 const mask=useMemo(()=>makeTeachingShape(variant),[variant]),trace=useMemo(()=>floodFrom(mask,GRID_W,GRID_H,seed,connectivity),[mask,seed,connectivity]);
 const reset=()=>{setRunning(false);setCursor(0);setStarted(false);setBackgroundClick(false);};
 const complete=started&&cursor===trace.steps.length;
 useEffect(()=>{if(!running)return;const start=cursor,time=performance.now(),rate=trace.steps.length/4500;const timer=window.setInterval(()=>{const next=Math.min(trace.steps.length,start+Math.floor((performance.now()-time)*rate));setCursor(next);if(next>=trace.steps.length)setRunning(false);},35);return()=>window.clearInterval(timer);},[running,trace]);
 const state=useMemo(()=>{const status=new Uint8Array(mask.length);if(started)status[seed]=1;for(let k=0;k<cursor;k++){const step=trace.steps[k];status[step.pixel]=2;step.added.forEach(i=>status[i]=1);}return status;},[mask.length,seed,started,trace,cursor]);
 const current=complete?undefined:trace.steps[cursor]?.pixel,focus=current??seed,fx=focus%GRID_W,fy=Math.floor(focus/GRID_W),offsets=neighbors(connectivity);
 const stage=!started?0:complete?3:cursor?2:1;
 const start=()=>{if(running){setRunning(false);return;}if(complete)setCursor(0);setStarted(true);setRunning(true);};
 const explanation=backgroundClick?'背景不加入连通域，请点击黑色前景选起点。':!started?'点击黑色像素选起点，再开始检查相邻像素。':complete?`从这个起点，${connectivity}连通找到 ${trace.steps.length} 个像素。${connectivity===4?'只在斜角接触的部分未加入。':'斜角接触的部分也加入了。'}`:'相邻、是前景、尚未访问 → 加入待检查队列，继续向外扩展。';
 return <ContentBlock className="di-flood" title="连通域" subtitle="按相邻规则连接起来的一组前景像素，组成一个连通域。" headingLevel={1}>
  <div className="di-flood__body" data-ready="true" data-connectivity={connectivity} data-seed={seed} data-cursor={cursor} data-total={trace.steps.length} data-running={running} data-complete={complete} data-mask={JSON.stringify(Array.from(mask))}>
   <div className="di-flood__toolbar"><div className="di-flood__stages">{['选起点','检查邻居','持续扩展','完成这一块'].map((name,i)=><Typography key={name} variant="body" tone={stage===i?'accent':'muted'}><span className={stage===i?'is-current':''}>{i+1}</span>{name}</Typography>)}</div><div className="di-flood__connect">{([4,8] as const).map(n=><Button key={n} active={connectivity===n} variant={connectivity===n?'primary':'default'} onClick={()=>{reset();setConnectivity(n);}}><Typography variant="body" tone="inherit">{n===4?'四连通':'八连通'}</Typography></Button>)}</div></div>
   <div className="di-flood__board"><svg viewBox={`0 0 ${GRID_W*24} ${GRID_H*24}`} role="group" aria-label="在同一图形上演示连通域扩展" className="di-flood__grid">{Array.from(mask).map((v,i)=>{const x=i%GRID_W,y=Math.floor(i/GRID_W),active=i===focus&&!complete,enabled=started&&!complete&&offsets.some(([dx,dy])=>x===fx+dx&&y===fy+dy);return <rect key={i} data-pixel={i} data-status={state[i]} x={x*24+1} y={y*24+1} width="22" height="22" rx="2" fill={active?'#f3bd35':state[i]===2?'#267de7':state[i]===1?'#a6ccfb':v?'#202a36':'#ffffff'} stroke={enabled?'#3488ed':'#e2eaf3'} strokeWidth={enabled?2:1} strokeDasharray={enabled?'3 2':undefined} role="button" tabIndex={v?0:-1} aria-label={`${x+1}列${y+1}行${v?'前景：选为起点':'背景'}`} onClick={()=>{if(!v){setBackgroundClick(true);return;}reset();setSeed(i);}} onKeyDown={e=>{if(v&&(e.key==='Enter'||e.key===' ')){e.preventDefault();reset();setSeed(i);}}}/>;})}</svg>
    <div className="di-flood__legend"><Typography variant="bodySmall" tone="muted"><i className="seed"/>当前检查</Typography><Typography variant="bodySmall" tone="muted"><i className="frontier"/>等待检查</Typography><Typography variant="bodySmall" tone="muted"><i className="done"/>已归入这一块</Typography></div>
   </div>
   <div className="di-flood__controls"><Button variant="primary" onClick={start}><Typography variant="body" tone="inherit">{running?'暂停':complete?'重播':started?'继续扩展':'开始扩展'}</Typography></Button><Button disabled={complete} onClick={()=>{setRunning(false);setStarted(true);setCursor(n=>Math.min(trace.steps.length,n+1));}}><Typography variant="body" tone="inherit">检查一个像素</Typography></Button><Button onClick={reset}><Typography variant="bodySmall" tone="inherit">重置</Typography></Button><Button onClick={()=>{reset();setSeed(7*GRID_W+8);setVariant(v=>v+1);}}><Typography variant="bodySmall" tone="inherit">换个图形</Typography></Button><Typography variant="body" tone="accent">已检查 {cursor} 个像素</Typography></div>
   <footer className="di-flood__takeaway"><Typography variant="body" tone="accent">{explanation}</Typography><Typography variant="bodySmall" tone="muted">{connectivity===4?'四连通：上下左右。':'八连通：上下左右 + 四个斜角。'} 切换规则时保留图形和起点，重新演示。</Typography></footer>
  </div>
 </ContentBlock>;
}
