import { useMemo, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaTerm, Typography } from '../../../shared/react';
import { at, components, HEIGHT, makeSource, morph, transform, WIDTH, type Operation } from './morphologyModel';
import './MorphologyComponentsPage.css';
const modes:[Operation,string][]=[['erode','腐蚀'],['dilate','膨胀'],['open','开运算'],['close','闭运算']];
const colors=['#2c85ec','#23a990','#f0aa36','#a06adb','#e36e70','#2c9bb4','#8670c7','#c99055','#5baf65','#d066a5'];
function PixelGrid({pixels,labels,selection,onSelect}:{pixels:Uint8Array;labels?:Uint16Array;selection?:[number,number];onSelect?:(x:number,y:number)=>void}){
  const cell=20;
  return <svg viewBox={`0 0 ${WIDTH*cell} ${HEIGHT*cell}`} className="di-morph__grid" role={onSelect?'group':'img'} aria-label={labels?'按四或八连通规则着色的连通域':'二值像素网格'} data-pixels={JSON.stringify(Array.from(pixels))} data-labels={labels?JSON.stringify(Array.from(labels)):undefined}>
    {Array.from(pixels).map((v,i)=><rect key={i} x={(i%WIDTH)*cell} y={Math.floor(i/WIDTH)*cell} width={cell} height={cell} fill={v?(labels?colors[(labels[i]-1)%colors.length]:'#28415c'):'#fbfdff'} stroke="#d8e4f0" strokeWidth=".7" role={onSelect?'button':undefined} tabIndex={onSelect?0:undefined} aria-label={onSelect?`查看第${Math.floor(i/WIDTH)+1}行第${i%WIDTH+1}列的邻域`:undefined} onClick={()=>onSelect?.(i%WIDTH,Math.floor(i/WIDTH))} onKeyDown={e=>{if(onSelect&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onSelect(i%WIDTH,Math.floor(i/WIDTH));}}}/>) }
    {selection&&<><rect x={Math.max(0,selection[0]-1)*cell+1} y={Math.max(0,selection[1]-1)*cell+1} width={(Math.min(WIDTH-1,selection[0]+1)-Math.max(0,selection[0]-1)+1)*cell-2} height={(Math.min(HEIGHT-1,selection[1]+1)-Math.max(0,selection[1]-1)+1)*cell-2} fill="none" stroke="#2085fa" strokeWidth="3" pointerEvents="none"/><rect x={selection[0]*cell+2} y={selection[1]*cell+2} width={cell-4} height={cell-4} fill="none" stroke="#70b7ff" strokeWidth="2" pointerEvents="none"/></>}
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
  return <ContentBlock className="di-morph" title="形态学操作" subtitle="用邻域规则改变前景形状，理解腐蚀、膨胀和开闭运算。" headingLevel={1}>
    <div className="di-morph__body" data-operation={mode} data-connectivity={connectivity}>
      <div className="di-morph__tabs" role="group" aria-label="选择形态学操作">{modes.map(([id,name])=><button type="button" key={id} className={mode===id?'is-selected':''} aria-pressed={mode===id} onClick={()=>setMode(id)}><Typography variant="bodySmall" tone="inherit">{name}</Typography></button>)}</div>
      <div className="di-morph__main">
        <section className="di-morph__panel"><Typography as="h2" variant="h3" tone="accent" align="center">原始二值图</Typography><PixelGrid pixels={source} selection={composite||conn?undefined:selection} onSelect={composite||conn?undefined:(nx,ny)=>setSelection([nx,ny])}/><Typography variant="bodySmall" tone="muted" align="center">{conn||composite?'深色像素：前景；浅色：背景':'点击像素，查看它的 3×3 邻域'}</Typography></section>
        <section className={`di-morph__panel ${!composite?'di-morph__process':''}`}>
          <Typography as="h2" variant="h3" tone="accent" align="center">{composite?`第一步：${mode==='open'?'腐蚀':'膨胀'}`:conn?'怎样算相连？':'看中心的邻域'}</Typography>
          {composite?<PixelGrid pixels={first}/>:<div className="di-morph__local">
            {conn&&<div className="di-morph__connectivity">{([4,8] as const).map(n=><button type="button" key={n} className={connectivity===n?'is-selected':''} aria-pressed={connectivity===n} onClick={()=>setConnectivity(n)}><Typography variant="bodySmall" tone="inherit">{n} 连通</Typography></button>)}</div>}
            <svg viewBox="0 0 270 270" className="di-morph__neighborhood" role="img" aria-label={conn?'四连通或八连通邻居示意':'所选像素真实3×3邻域'}>{Array.from({length:9},(_,i)=>{const linked=connectivity===8||i%2===1;return <rect key={i} x={i%3*90+2} y={Math.floor(i/3)*90+2} width="86" height="86" rx="5" fill={conn?(i===4?'#2283f3':linked?'#b4d8ff':'#f4f8fd'):neighborhood[i]?'#28415c':'#f9fcff'} stroke={i===4?'#2283f3':'#cbdff5'} strokeWidth={i===4?4:1}/>;})}</svg>
            <Typography variant="body" tone="accent" align="center">{conn?(connectivity===4?'上下左右相邻':'再加四个对角'):result[y*WIDTH+x]?'中心 → 前景':'中心 → 背景'}</Typography>
          </div>}
          <Typography variant="bodySmall" tone="muted" align="center">{composite?'这一步的结果，再交给下一步处理':conn?'四连通、八连通是两种相邻规则':'结构元素：3×3 全满方块'}</Typography>
        </section>
        <section className="di-morph__panel"><Typography as="h2" variant="h3" tone="accent" align="center">{composite?`第二步：${mode==='open'?'膨胀':'腐蚀'}`:conn?'连通域标记':'处理结果'}</Typography><PixelGrid pixels={result} labels={conn?regions.labels:undefined} selection={composite||conn?undefined:selection}/><Typography variant="bodySmall" tone="muted" align="center">{conn?`共 ${regions.count} 个连通域`:composite?'两步组合后的最终结果':'每个位置都按同样的邻域规则计算'}</Typography></section>
      </div>
      <footer className="di-morph__takeaway">{conn?<Typography variant="body" tone="accent" align="center">4 连通看上下左右，8 连通也算对角相邻。</Typography>:<MathFormulaBlock appearance="plain" ariaLabel="当前形态学操作及其组合顺序"><MathFormulaTerm latex={expressions[mode]} tooltip="A 是前景集合，B 是这里使用的3×3结构元素；⊖表示腐蚀，⊕表示膨胀。开运算先腐蚀后膨胀，闭运算先膨胀后腐蚀。" tooltipPlacement="top"/></MathFormulaBlock>}<Typography variant="body" tone="accent" align="center">{explanations[mode]}</Typography></footer>
    </div>
  </ContentBlock>;
}
