import { useEffect,useMemo,useState } from 'react';
import { Button,ContentBlock,Typography } from '../../../shared/react';
import { H,W,initialShape,makePasses,type MorphMode } from './morphologyAnimationModel';
import './MorphologyOperationsPage.css';
const modes:[MorphMode,string][]=[['erode','腐蚀'],['dilate','膨胀'],['open','开运算'],['close','闭运算']];
const names={erode:'腐蚀',dilate:'膨胀'};
export function MorphologyOperationsPage(){
 const [mode,setMode]=useState<MorphMode>('erode'),[phase,setPhase]=useState(0),[playing,setPlaying]=useState(false);
 const source=useMemo(initialShape,[]),passes=useMemo(()=>makePasses(source,mode),[source,mode]);
 const display=phase?passes[phase-1].output:source,complete=phase===passes.length;
 const reset=()=>{setPlaying(false);setPhase(0);};
 // Crossfade every pixel together. Composite operations keep a visible first-pass
 // result before the second pass, and both passes still read immutable inputs.
 useEffect(()=>{if(!playing)return;const timers=[window.setTimeout(()=>setPhase(1),750)];if(passes.length===2)timers.push(window.setTimeout(()=>setPhase(2),2050));timers.push(window.setTimeout(()=>setPlaying(false),passes.length===2?2800:1500));return()=>timers.forEach(window.clearTimeout);},[playing,passes]);
 const play=()=>{setPhase(0);setPlaying(true);};
 const takeaway={erode:'腐蚀：黑色前景向内收缩，细小突起可能消失。',dilate:'膨胀：黑色前景向外扩张，小孔和缝隙可能缩小。',open:'开运算：先腐蚀，再膨胀；去掉细突起，恢复较大的主体。',close:'闭运算：先膨胀，再腐蚀；填小孔、连小缝，再收回外边界。'};
 return <ContentBlock className="di-mop" title="连通域的形态学操作" subtitle="观察同一块前景怎样收缩、扩张，以及两步操作怎样改变形状。" headingLevel={1}>
  <div className="di-mop__body" data-ready="true" data-mode={mode} data-phase={phase} data-playing={playing} data-complete={complete} data-source={JSON.stringify(Array.from(source))} data-display={JSON.stringify(Array.from(display))}>
   <div className="di-mop__toolbar"><div role="group" aria-label="形态学操作">{modes.map(([id,name])=><Button key={id} variant={mode===id?'primary':'default'} active={mode===id} onClick={()=>{reset();setMode(id);}}><Typography variant="body" tone="inherit">{name}</Typography></Button>)}</div><Typography variant="bodySmall" tone="muted">黑色 = 前景 · 白色 = 背景</Typography></div>
   <section className="di-mop__board"><div className="di-mop__caption"><Typography variant="body" tone="accent">{phase===0?'原始图形':passes.length===2?`第 ${phase} 步：${names[passes[phase-1].op]}`:names[passes[0].op]+'后'}</Typography><Typography variant="bodySmall" tone="muted">{phase===0?'整幅图同时变化':complete?'处理完成':'先看这一步带来的变化'}</Typography></div>
    <svg className="di-mop__shape" viewBox={`0 0 ${W*24} ${H*24}`} role="img" aria-label="整幅二值图同时渐变呈现形态学结果">{Array.from(display).map((v,i)=><rect key={i} data-pixel={i} x={i%W*24+1} y={Math.floor(i/W)*24+1} width="22" height="22" rx="2" fill={v?'#202a36':'#ffffff'} stroke="#e6edf5" strokeWidth=".7"/> )}</svg>
    <div className="di-mop__stages"><Typography variant="body" tone={phase===0?'accent':'muted'}>原图</Typography>{passes.map((pass,i)=><div key={i}><Typography variant="body" tone="muted">→</Typography><Button active={phase===i+1} onClick={()=>{setPlaying(false);setPhase(i+1);}}><Typography variant="body" tone="inherit">{passes.length===2?`${i+1} · `:''}{names[pass.op]}</Typography></Button></div>)}</div>
   </section>
   <div className="di-mop__controls"><Button variant="primary" disabled={playing} onClick={play}><Typography variant="body" tone="inherit">{playing?'正在演示':complete?'重播':'演示'+modes.find(([id])=>id===mode)![1]}</Typography></Button><Button onClick={reset}><Typography variant="body" tone="inherit">看原图</Typography></Button><Typography variant="bodySmall" tone="muted">{passes.length===2?'两步依次渐变，也可点击步骤分别查看。':'所有像素同时渐变，不逐个扫描。'}</Typography></div>
   <footer className="di-mop__takeaway"><Typography variant="body" tone="accent">{takeaway[mode]}</Typography><Typography variant="bodySmall" tone="muted">常见示例用白色表示前景；这里只反转显示颜色，膨胀、腐蚀的含义不变。</Typography></footer>
  </div>
 </ContentBlock>;
}
