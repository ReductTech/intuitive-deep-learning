import { useState } from 'react';
import { courseAssetUrl } from '../assets';
import { Button } from "@shuku/course-style/react/controls/Button";
import { Typography } from "@shuku/course-style/react/typography/Typography";
import { Arrow, Flow, Formula, Frame, ReferenceVisual, Text, Tokens } from '../components/Diagrams';
import { Readout } from '../components/Story';
import { LessonSplit, TeachingPanel } from '../components/TeachingPanel';
export function LatentTokenization() {
  const [patch, setPatch] = useState(2);
  const [selected, setSelected] = useState(0);
  const [sent, setSent] = useState(false);
  const shown = 16 / patch;
  const raw = Array.from({ length: patch**2*4 }, (_,i) => Math.sin((selected+1)*.7+i*.8));
  const sample = raw.slice(0,8);
  const projected = Array.from({length:4},(_,k)=>raw.reduce((sum,v,j)=>sum+v*Math.cos((j+1)*(k+1)*.2),0)/Math.sqrt(raw.length));
  return <Frame index={9} subtitle="给 Transformer 重新打包：从二维位置，变成一串视觉 tokens" takeaway="一个 patch 对应一个 token；patch 越大，token 数越少，每块展开后更长。">
    <LessonSplit>
      <TeachingPanel title="① 在 latent 中选择 patch" className="vga-sidebar vga-patch-panel">
        <div shuku-edit-id="e-1e952466-4d1b-4435-b256-0ac9f2387c3d" className="vga-patch-choice" style={{ gridTemplateColumns: `repeat(${shown}, minmax(0,1fr))`, backgroundImage: `url("${courseAssetUrl("visuals/latent-channel.webp")}")` }}>{Array.from({length:shown**2},(_,i) => <button shuku-edit-id="e-2c2f75f2-4df5-430a-be64-62226ef47b65" key={i} type="button" className={i === selected ? 'is-selected' : ''} draggable aria-label={`选择第 ${i+1} 个 patch`} aria-pressed={i === selected} onClick={() => {setSelected(i);setSent(false);}} onDragStart={e => {setSelected(i);e.dataTransfer.setData('text/plain',String(i));}} />)}</div>
        <Text muted>16 × 16 局部窗口 · 点击或拖动</Text>
        <div shuku-edit-id="e-c92a9e53-1c03-4499-b557-cc0974b1fd59" className="vga-stage-tabs"><Text>patch</Text>{[2,4].map(p => <Button key={p} active={patch === p} data-testid={`patch-${p}`} onClick={() => {setPatch(p);setSelected(0);setSent(false);}}>{p} × {p}</Button>)}</div>
        <Readout label="完整 latent 的 token 数" value={<span shuku-edit-id="e-47cda4ce-f541-4bd4-b60e-f92784fc97d1" data-testid="token-count">{(64/patch)**2}</span>} warm />
      </TeachingPanel>
      <TeachingPanel title="② 展平与投影 · 一个 patch 对应一个 token" className="vga-projection-panel">
        <Flow><div shuku-edit-id="e-7f327cb0-83f6-4075-9312-f56824b8020d" className="vga-center"><ReferenceVisual file="visuals/patch-channels.webp" alt="参考图中的多通道 patch" style={{width: 160, height: 145}} /><Text>第 {selected+1} 个 patch</Text></div><Arrow /><div shuku-edit-id="e-40c94bd6-d776-4d44-8c5b-44bd6d9de404" className="vga-center"><ReferenceVisual file="visuals/patch-flattened.webp" alt="展平后的特征向量" style={{width: 260,height: 48}} /><Readout label="展平长度" value={`${patch**2*4} 维`} /></div><Arrow /><div shuku-edit-id="e-dc6cb922-2653-4669-a514-9d91accfa643" className="vga-center"><Typography variant="h3" tone="accent">线性投影</Typography><Text>映射到 D 维</Text></div></Flow>
        <div shuku-edit-id="e-31353107-7e09-43e6-9371-dcd1c8a71ba8" className={'vga-token-drop' + (sent ? ' is-filled' : '')} onDragOver={e => e.preventDefault()} onDrop={e => {e.preventDefault(); const n=Number(e.dataTransfer.getData('text/plain'));if(Number.isInteger(n)&&n>=0&&n<shown**2){setSelected(n);setSent(true);}}}>{sent ? <div shuku-edit-id="e-36f838e4-44db-47e6-820b-e8b7d91a3499" className="vga-enter vga-token-output"><Tokens count={1} /><div shuku-edit-id="e-988fe322-10b4-4fde-abbe-256051967d3e"><Typography variant="h3" tone="accent">视觉 token</Typography><Text>{projected.map(v=>v.toFixed(2)).join('，')}</Text></div></div> : <Text muted>把左侧 patch 拖入这里，或点击下方按钮</Text>}</div>
        <div shuku-edit-id="e-dae817c5-473b-4ccf-b8c3-fdf3393e6f6a" className="vga-lab-row"><Button onClick={() => setSent(true)} data-testid="patch-send">送入投影 →</Button><Formula latex={`N=(64/${patch})^2=${(64/patch)**2}`} /></div>
        <Text muted>投影前示意值：{sample.slice(0,4).map(v => v.toFixed(1)).join('，')} …</Text>
      </TeachingPanel>
    </LessonSplit>
  </Frame>;
}
