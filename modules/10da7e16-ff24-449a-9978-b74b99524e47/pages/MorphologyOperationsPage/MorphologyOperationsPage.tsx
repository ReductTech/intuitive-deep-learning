import { useEffect,useMemo,useState } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
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
 return <ContentBlock shuku-edit-id="e-a0997286-d57e-423d-87ca-8b77dd29aa0b" className="di-mop" title="连通域的形态学操作" subtitle="观察同一块前景怎样收缩、扩张，以及两步操作怎样改变形状。" headingLevel={1}>
  <div shuku-edit-id="e-f3cc94ba-7772-4647-8f17-d4614ffc9337" className="di-mop__body" data-ready="true" data-mode={mode} data-phase={phase} data-playing={playing} data-complete={complete} data-source={JSON.stringify(Array.from(source))} data-display={JSON.stringify(Array.from(display))}>
   <div shuku-edit-id="e-c2192de2-f2c1-41ba-b2f1-7677fc3d6a7c" className="di-mop__toolbar"><div shuku-edit-id="e-64a7851f-0bd6-45d8-a452-40a2f0dcc7bd" role="group" aria-label="形态学操作">{modes.map(([id,name])=><Button key={id} variant={mode===id?'primary':'default'} active={mode===id} onClick={()=>{reset();setMode(id);}}><Typography shuku-edit-id="e-95678eb6-c98e-46a0-942a-2889e8cbff29" variant="body" tone="inherit">{name}</Typography></Button>)}</div><Typography shuku-edit-id="e-7b82109a-9953-4f4b-9747-ee7ce4f5c9e4" variant="bodySmall" tone="muted">黑色 = 前景 · 白色 = 背景</Typography></div>
   <section shuku-edit-id="e-36af88b3-ab44-4bd7-8578-a41bab0f6e0b" className="di-mop__board"><div shuku-edit-id="e-8ff27730-c221-4a8c-864e-6bb0a3cd8c0f" className="di-mop__caption"><Typography shuku-edit-id="e-3e08e074-64a8-49f5-b3ad-810a47fd8233" variant="body" tone="accent">{phase===0?'原始图形':passes.length===2?`第 ${phase} 步：${names[passes[phase-1].op]}`:names[passes[0].op]+'后'}</Typography><Typography shuku-edit-id="e-95a080ea-bd05-4605-91ff-ecc9c0e6b962" variant="bodySmall" tone="muted">{phase===0?'整幅图同时变化':complete?'处理完成':'先看这一步带来的变化'}</Typography></div>
    <svg shuku-edit-id="e-8eec1383-b233-421e-92de-101f94ab1aa9" className="di-mop__shape" viewBox={`0 0 ${W*24} ${H*24}`} role="img" aria-label="整幅二值图同时渐变呈现形态学结果">{Array.from(display).map((v,i)=><rect shuku-edit-id="e-be1cba8c-2327-4bbc-ba8e-13f37b9cb80f" key={i} data-pixel={i} x={i%W*24+1} y={Math.floor(i/W)*24+1} width="22" height="22" rx="2" fill={v?'#202a36':'#ffffff'} stroke="#e6edf5" strokeWidth=".7"/> )}</svg>
    <div shuku-edit-id="e-0e4f145f-f444-42ca-95b2-e7eedfb9d456" className="di-mop__stages"><Typography shuku-edit-id="e-3814f9af-563b-48f4-8804-31fabf46bd6b" variant="body" tone={phase===0?'accent':'muted'}>原图</Typography>{passes.map((pass,i)=><div shuku-edit-id="e-bb4bc371-25a6-43f2-a7e9-afb95101249a" key={i}><Typography shuku-edit-id="e-97c66b41-ae9c-46f8-abe8-f4b0ce4251ad" variant="body" tone="muted">→</Typography><Button active={phase===i+1} onClick={()=>{setPlaying(false);setPhase(i+1);}}><Typography shuku-edit-id="e-eaf03d6b-5b02-480a-a671-9363673e18cc" variant="body" tone="inherit">{passes.length===2?`${i+1} · `:''}{names[pass.op]}</Typography></Button></div>)}</div>
   </section>
   <div shuku-edit-id="e-016efb96-a304-42d4-b07e-851269e7a15f" className="di-mop__controls"><Button variant="primary" disabled={playing} onClick={play}><Typography shuku-edit-id="e-99aea303-8027-4a61-84d4-6a4296f9512d" variant="body" tone="inherit">{playing?'正在演示':complete?'重播':'演示'+modes.find(([id])=>id===mode)![1]}</Typography></Button><Button onClick={reset}><Typography shuku-edit-id="e-40c54c22-5837-4174-ae5c-05e1bdc2d010" variant="body" tone="inherit">看原图</Typography></Button><Typography shuku-edit-id="e-113f3a94-d979-4c2e-8be6-d8e92700e6fd" variant="bodySmall" tone="muted">{passes.length===2?'两步依次渐变，也可点击步骤分别查看。':'所有像素同时渐变，不逐个扫描。'}</Typography></div>
   <footer shuku-edit-id="e-20a40c7b-9ec0-4ef1-a2ed-4a1a2aff11d8" className="di-mop__takeaway"><Typography shuku-edit-id="e-ffa429c6-a7c9-4c52-9ca4-724dde4621a1" variant="body" tone="accent">{takeaway[mode]}</Typography><Typography shuku-edit-id="e-7e8a7573-1a63-4004-a1fa-12af9f5408b2" variant="bodySmall" tone="muted">常见示例用白色表示前景；这里只反转显示颜色，膨胀、腐蚀的含义不变。</Typography></footer>
  </div>
 </ContentBlock>;
}
