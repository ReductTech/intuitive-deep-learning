import { useState } from 'react';
import { Button } from '../../../shared/react/controls/Button';
import { Formula, Text } from '../../components/Diagrams';
import { RefBox, ReferenceCanvas, ReferenceControls, referenceAsset } from '../../components/ReferenceCanvas';

export function LatentTokenization() {
  const [patch,setPatch]=useState(2), [selected,setSelected]=useState(0), [sent,setSent]=useState(false);
  const shown=16/patch;
  const raw=Array.from({length:patch**2*4},(_,i)=>Math.sin((selected+1)*.7+i*.8));
  const projected=Array.from({length:4},(_,k)=>raw.reduce((sum,v,j)=>sum+v*Math.cos((j+1)*(k+1)*.2),0)/Math.sqrt(raw.length));
  return <ReferenceCanvas index={9} source="22">
    <RefBox rect={[63,485,189,162]} className="vgr-patch-plane">
      <div className="vga-patch-choice vgr-patch-choice" style={{gridTemplateColumns:`repeat(${shown},minmax(0,1fr))`,backgroundImage:`url("${referenceAsset('visuals/latent-channel.png')}")`}}>
        {Array.from({length:shown**2},(_,i)=><button key={i} type="button" draggable className={selected===i?'is-selected':''} aria-label={`选择第 ${i+1} 个 patch`} aria-pressed={selected===i} onClick={()=>{setSelected(i);setSent(false);}} onDragStart={e=>{setSelected(i);setSent(false);e.dataTransfer.setData('text/plain',String(i));}}/>)}</div>
    </RefBox>
    <RefBox rect={[409,317,370,94]} className="vgr-white vgr-center"><Text>Patchify：按 {patch} × {patch} 切块</Text><Text muted>每块保留 C 个通道</Text></RefBox>
    <RefBox rect={[842,365,270,42]} className="vgr-white vgr-center"><Text>{patch} × {patch} × C → {patch**2}C</Text></RefBox>
    <RefBox rect={[1399,365,251,43]} className="vgr-white vgr-center"><Text><span data-testid="token-count">{(32/patch)**2}</span> tokens · D 维</Text></RefBox>
    <RefBox rect={[1180,478,161,160]}><Button className="vgr-hotspot" data-testid="patch-send" aria-label="送入线性投影" onClick={()=>setSent(true)}/></RefBox>
    <RefBox rect={[1409,473,238,172]} className={'vga-token-drop vgr-token-drop'+(sent?' is-filled':'')} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const n=Number(e.dataTransfer.getData('text/plain'));if(Number.isInteger(n)&&n>=0&&n<shown**2){setSelected(n);setSent(true);}}}/>
    <RefBox rect={[335,704,1015,79]} className="vgr-white vgr-center"><Formula latex={`N=(32\\div${patch})\\times(32\\div${patch})=${32/patch}\\times${32/patch}=${(32/patch)**2}`}/></RefBox>
    <ReferenceControls rect={[44,777,1590,56]}><Text>32 × 32 示例 · patch</Text>{[2,4].map(p=><Button key={p} data-testid={`patch-${p}`} active={patch===p} onClick={()=>{setPatch(p);setSelected(0);setSent(false);}}>{p} × {p}</Button>)}<Text>{sent ? `第 ${selected+1} 块 → token：${projected.map(v=>v.toFixed(2)).join('，')}` : '选择 patch，拖入右侧 token 区，或点击 Linear Projection'}</Text></ReferenceControls>
  </ReferenceCanvas>;
}
