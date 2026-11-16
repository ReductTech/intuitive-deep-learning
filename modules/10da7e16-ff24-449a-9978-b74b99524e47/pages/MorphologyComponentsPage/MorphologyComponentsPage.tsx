import { useMemo, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import { at, components, HEIGHT, makeSource, morph, transform, WIDTH, type Operation } from './morphologyModel';
import './MorphologyComponentsPage.css';
const modes:[Operation,string][]=[['erode','腐蚀'],['dilate','膨胀'],['open','开运算'],['close','闭运算']];
const colors=['#2c85ec','#23a990','#f0aa36','#a06adb','#e36e70','#2c9bb4','#8670c7','#c99055','#5baf65','#d066a5'];
function PixelGrid({pixels,labels,selection,onSelect}:{pixels:Uint8Array;labels?:Uint16Array;selection?:[number,number];onSelect?:(x:number,y:number)=>void}){
  const cell=20;
  return <svg shuku-edit-id="e-9f96279a-d2af-4cbf-aa01-e3e55c25cbe6" viewBox={`0 0 ${WIDTH*cell} ${HEIGHT*cell}`} className="di-morph__grid" role={onSelect?'group':'img'} aria-label={labels?'按四或八连通规则着色的连通域':'二值像素网格'} data-pixels={JSON.stringify(Array.from(pixels))} data-labels={labels?JSON.stringify(Array.from(labels)):undefined}>
    {Array.from(pixels).map((v,i)=><rect shuku-edit-id="e-582f9787-d8f0-4f04-be89-d2e0011f4fae" key={i} x={(i%WIDTH)*cell} y={Math.floor(i/WIDTH)*cell} width={cell} height={cell} fill={v?(labels?colors[(labels[i]-1)%colors.length]:'#28415c'):'#fbfdff'} stroke="#d8e4f0" strokeWidth=".7" role={onSelect?'button':undefined} tabIndex={onSelect?0:undefined} aria-label={onSelect?`查看第${Math.floor(i/WIDTH)+1}行第${i%WIDTH+1}列的邻域`:undefined} onClick={()=>onSelect?.(i%WIDTH,Math.floor(i/WIDTH))} onKeyDown={e=>{if(onSelect&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onSelect(i%WIDTH,Math.floor(i/WIDTH));}}}/>) }
    {selection&&<><rect shuku-edit-id="e-be351bfd-6bb8-4e83-860c-fc7379bd87b6" x={Math.max(0,selection[0]-1)*cell+1} y={Math.max(0,selection[1]-1)*cell+1} width={(Math.min(WIDTH-1,selection[0]+1)-Math.max(0,selection[0]-1)+1)*cell-2} height={(Math.min(HEIGHT-1,selection[1]+1)-Math.max(0,selection[1]-1)+1)*cell-2} fill="none" stroke="#2085fa" strokeWidth="3" pointerEvents="none"/><rect shuku-edit-id="e-fd80a717-037b-4f2a-9dd6-7784e69d2be2" x={selection[0]*cell+2} y={selection[1]*cell+2} width={cell-4} height={cell-4} fill="none" stroke="#70b7ff" strokeWidth="2" pointerEvents="none"/></>}
  </svg>;
}
export function MorphologyComponentsPage(){
  const [mode,setMode]=useState<Operation>('erode'),[connectivity,setConnectivity]=useState<4|8>(4),[selection,setSelection]=useState<[number,number]>([3,4]);
  const source=useMemo(makeSource,[]),first=useMemo(()=>mode==='open'?morph(source,'erode'):mode==='close'?morph(source,'dilate'):source,[mode,source]);
  const result=useMemo(()=>transform(source,mode),[source,mode]),regions=useMemo(()=>components(source,connectivity),[source,connectivity]);
  const [x,y]=selection,neighborhood=Array.from({length:9},(_,i)=>at(source,x+i%3-1,y+Math.floor(i/3)-1));
  const composite=mode==='open'||mode==='close',conn=mode==='components';
  const expressions={erode:'A\\ominus B',dilate:'A\\oplus B',open:'A\\circ B=(A\\ominus B)\\oplus B',close:'A\\bullet B=(A\\oplus B)\\ominus B',components:''};
  const explanations={erode:'邻域全部是前景，中心才保留；前景会缩小。',dilate:'邻域只要有前景，中心就变成前景；前景会扩大。',open:'先腐蚀，再膨胀；可以去掉小斑点、细突起。',close:'先膨胀，再腐蚀；可以填小孔、连接小缝。',components:'相连的前景像素属于同一个区域；同色表示同一连通域。'};
  return <ContentBlock shuku-edit-id="e-78c46ab4-08c5-4eaa-9ea6-862364aa88ab" className="di-morph" title="形态学操作" subtitle="用邻域规则改变前景形状，理解腐蚀、膨胀和开闭运算。" headingLevel={1}>
    <div shuku-edit-id="e-7cff8e58-5557-456e-b804-40dddb00a04c" className="di-morph__body" data-operation={mode} data-connectivity={connectivity}>
      <div shuku-edit-id="e-c9467d84-82bf-4e71-ae44-3475d91ee705" className="di-morph__tabs" role="group" aria-label="选择形态学操作">{modes.map(([id,name])=><button shuku-edit-id="e-16a3665e-492c-4903-a924-9ab95c304ce6" type="button" key={id} className={mode===id?'is-selected':''} aria-pressed={mode===id} onClick={()=>setMode(id)}><Typography shuku-edit-id="e-51899bab-98cd-4c3d-b393-16acbd4951aa" variant="bodySmall" tone="inherit">{name}</Typography></button>)}</div>
      <div shuku-edit-id="e-dd8115bc-68c7-4fc4-8ddb-5fa5f5fd6d80" className="di-morph__main">
        <section shuku-edit-id="e-5320b069-caa9-4e13-bdd1-b212f85de657" className="di-morph__panel"><Typography shuku-edit-id="e-4200bd0e-34bd-463d-862e-a82885756328" as="h2" variant="h3" tone="accent" align="center">原始二值图</Typography><PixelGrid pixels={source} selection={composite||conn?undefined:selection} onSelect={composite||conn?undefined:(nx,ny)=>setSelection([nx,ny])}/><Typography shuku-edit-id="e-5aa65795-bb9b-492b-b318-0d5661d00b88" variant="bodySmall" tone="muted" align="center">{conn||composite?'深色像素：前景；浅色：背景':'点击像素，查看它的 3×3 邻域'}</Typography></section>
        <section shuku-edit-id="e-1f023a7a-e29f-4838-94e1-aff80294d192" className={`di-morph__panel ${!composite?'di-morph__process':''}`}>
          <Typography shuku-edit-id="e-d209b526-b3dc-4f91-841c-983f3c65d2fb" as="h2" variant="h3" tone="accent" align="center">{composite?`第一步：${mode==='open'?'腐蚀':'膨胀'}`:conn?'怎样算相连？':'看中心的邻域'}</Typography>
          {composite?<PixelGrid pixels={first}/>:<div shuku-edit-id="e-998d76c6-f822-4820-b1e7-2de1ffc888f9" className="di-morph__local">
            {conn&&<div shuku-edit-id="e-acca3c96-ebc8-48d9-8d87-588f9f08c54b" className="di-morph__connectivity">{([4,8] as const).map(n=><button shuku-edit-id="e-67275610-9ccf-434e-86e6-32a0314b462e" type="button" key={n} className={connectivity===n?'is-selected':''} aria-pressed={connectivity===n} onClick={()=>setConnectivity(n)}><Typography shuku-edit-id="e-10d9db81-fb9b-4344-a4eb-4a9f15c21bd9" variant="bodySmall" tone="inherit">{n} 连通</Typography></button>)}</div>}
            <svg shuku-edit-id="e-c41df30f-55da-45e4-b934-28d79bb192a3" viewBox="0 0 270 270" className="di-morph__neighborhood" role="img" aria-label={conn?'四连通或八连通邻居示意':'所选像素真实3×3邻域'}>{Array.from({length:9},(_,i)=>{const linked=connectivity===8||i%2===1;return <rect shuku-edit-id="e-0c758fc1-92a1-40ac-a400-da0797647962" key={i} x={i%3*90+2} y={Math.floor(i/3)*90+2} width="86" height="86" rx="5" fill={conn?(i===4?'#2283f3':linked?'#b4d8ff':'#f4f8fd'):neighborhood[i]?'#28415c':'#f9fcff'} stroke={i===4?'#2283f3':'#cbdff5'} strokeWidth={i===4?4:1}/>;})}</svg>
            <Typography shuku-edit-id="e-f35feb8a-6d55-4bae-a59e-90b87084cbcf" variant="body" tone="accent" align="center">{conn?(connectivity===4?'上下左右相邻':'再加四个对角'):result[y*WIDTH+x]?'中心 → 前景':'中心 → 背景'}</Typography>
          </div>}
          <Typography shuku-edit-id="e-dfedeeff-998f-4a48-85c9-e4d47eb8484f" variant="bodySmall" tone="muted" align="center">{composite?'这一步的结果，再交给下一步处理':conn?'四连通、八连通是两种相邻规则':'结构元素：3×3 全满方块'}</Typography>
        </section>
        <section shuku-edit-id="e-aea5d8dc-009c-40b0-a904-90bd35e91328" className="di-morph__panel"><Typography shuku-edit-id="e-7142139f-3fd6-4a24-a3d1-11ea4795d9ea" as="h2" variant="h3" tone="accent" align="center">{composite?`第二步：${mode==='open'?'膨胀':'腐蚀'}`:conn?'连通域标记':'处理结果'}</Typography><PixelGrid pixels={result} labels={conn?regions.labels:undefined} selection={composite||conn?undefined:selection}/><Typography shuku-edit-id="e-4e3d6679-f808-47af-9729-e1dc44c6bd3a" variant="bodySmall" tone="muted" align="center">{conn?`共 ${regions.count} 个连通域`:composite?'两步组合后的最终结果':'每个位置都按同样的邻域规则计算'}</Typography></section>
      </div>
      <footer shuku-edit-id="e-65b95ded-e0c3-4f33-a2dd-99109eda5f30" className="di-morph__takeaway">{conn?<Typography shuku-edit-id="e-729f452c-0e1e-4b11-942f-ce5e251173c9" variant="body" tone="accent" align="center">4 连通看上下左右，8 连通也算对角相邻。</Typography>:<MathFormulaBlock appearance="plain" ariaLabel="当前形态学操作及其组合顺序"><MathFormulaTerm latex={expressions[mode]} tooltip="A 是前景集合，B 是这里使用的3×3结构元素；⊖表示腐蚀，⊕表示膨胀。开运算先腐蚀后膨胀，闭运算先膨胀后腐蚀。" tooltipPlacement="top"/></MathFormulaBlock>}<Typography shuku-edit-id="e-68079dec-edfc-4209-9648-6bffe0e95614" variant="body" tone="accent" align="center">{explanations[mode]}</Typography></footer>
    </div>
  </ContentBlock>;
}
