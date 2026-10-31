import { useState } from 'react';
import { Button } from '../../../shared/react/controls/Button';
import { RangeControl } from '../../../shared/react/controls/RangeControl';
import { Typography } from '../../../shared/react/typography/Typography';
import { Formula, Latent, ReferenceVisual, Text, Tokens } from '../../components/Diagrams';
import { RefBox, ReferenceCanvas, ReferenceControls, ReferenceStory, referenceAsset } from '../../components/ReferenceCanvas';
import { useStory } from '../../components/Story';

export function DiTBackbone() {
  const [unet,setUnet]=useState(false);
  const story=useStory(['latent','切成 patch','映射为 tokens','Block 1','Block 2','Block 3','恢复空间预测']);
  return <ReferenceCanvas index={10} title="DiT：把 latent 交给 Transformer" subtitle="生成空间不变，把多尺度路径换成 token 序列处理" summary="生成空间与预测主干是两个维度：Latent 也可以配 Transformer。">
    {!unet ? <>
      <RefBox rect={[48,205,350,187]} className="vgr-center"><Latent variant="color"/><Text>二维 latent</Text></RefBox>
      <RefBox rect={[405,245,363,115]} className="vgr-center vgr-plain-operation"><Typography variant="h3" tone="accent">Patchify → Tokens</Typography><Text muted>每块映射为一个视觉 token</Text></RefBox>
      <RefBox rect={[835,207,495,176]} className="vgr-center"><Text>时间 / 文本条件</Text><Tokens count={5} warm/><Text muted>在 Block 中注入条件</Text></RefBox>
      <RefBox rect={[1400,215,220,177]} className="vgr-center"><ReferenceVisual name="noise-prediction" style={{width:120,height:120}}/><Text>空间预测</Text></RefBox>
      <RefBox rect={[54,415,1566,212]}><ReferenceVisual name="dit-blocks"/></RefBox>
      {story.playing && story.step>=3 && story.step<=5 && <RefBox rect={[395+(story.step-3)*341,445,260,155]} className="vgr-feature-focus"/>}
      <RefBox rect={[54,660,1566,78]} className="vgr-center"><Typography variant="h3" tone="accent">latent → Patchify → Transformer → Unpatchify → 空间预测</Typography></RefBox>
    </> : <RefBox rect={[35,208,1600,535]}><img className="vgr-fill" src={referenceAsset('visuals/unet-body.png')} alt="参考页 03 的完整多尺度 U-Net 路线"/></RefBox>}
    <ReferenceControls rect={[54,764,1566,62]}><Button data-testid="backbone-unet" active={unet} onClick={()=>setUnet(true)}>U-Net 多尺度路径</Button><Button data-testid="backbone-dit" active={!unet} onClick={()=>setUnet(false)}>DiT 序列路径</Button><Text muted>{unet?'Down → Mid → Up，Skip 传回对应尺度特征':'Tokens → Transformer Blocks → 空间重排'}</Text></ReferenceControls>
    <div className="vgr-state-observer" data-backbone={unet?'unet':'dit'}/>
    <ReferenceStory story={story}/>
  </ReferenceCanvas>;
}

const input=[-1.2,-.3,.5,1], mean=input.reduce((a,b)=>a+b,0)/input.length;
const std=Math.sqrt(input.reduce((a,b)=>a+(b-mean)**2,0)/input.length);
const normalized=input.map(v=>(v-mean)/std);
export function DiTTime() {
  const [time,setTime]=useState(500),[enabled,setEnabled]=useState(true);
  const gamma=enabled ? .8+time/1000*.6 : 1, beta=enabled ? (time/1000-.5)*.8 : 0;
  const output=normalized.map(v=>gamma*v+beta);
  return <ReferenceCanvas index={11} source="24">
    <RefBox rect={[1300,324,315,103]} className="vgr-center vgr-white"><Formula latex={`\\gamma=${gamma.toFixed(2)},\\;\\beta=${beta.toFixed(2)}`}/><Text muted>四维调制示例</Text></RefBox>
    <RefBox rect={[1444,503,176,130]} className="vgr-white vgr-time-token-output"><Tokens count={3} warm/><div className="vgr-modulation-tint" style={{opacity:enabled ? .12+time/4000 : 0}}/></RefBox>
    <RefBox rect={[1250,662,380,88]} className="vgr-white vgr-numeric-vectors"><Text muted>归一化：<span className="vga-vector-numbers">{normalized.map(v=>v.toFixed(1)).join(' ')}</span></Text><Text>调制后：<span className="vga-vector-numbers">{output.map(v=>v.toFixed(1)).join(' ')}</span></Text></RefBox>
    <ReferenceControls rect={[1280,232,350,70]}><RangeControl label="时间步 t" value={time} min={0} max={1000} step={100} onChange={e=>setTime(Number(e.target.value))}/></ReferenceControls>
    <ReferenceControls rect={[1220,751,410,67]}><Button active={!enabled} onClick={()=>setEnabled(false)}>只做归一化</Button><Button data-testid="enable-adaln" active={enabled} onClick={()=>setEnabled(true)}>加入时间调制</Button></ReferenceControls>
  </ReferenceCanvas>;
}

export function DiTText() {
  const [joint,setJoint]=useState(false),[query,setQuery]=useState(0);
  const rows=joint?7:4,cols=joint?7:3;
  return <ReferenceCanvas index={12} title="文本条件怎样进入 Transformer？" subtitle="视觉 Query 读取文本，或让文本与视觉 tokens 在同一次注意力中交互" summary="Cross-Attention：视觉读文本；Joint Attention：文本与视觉共同交互。">
    <RefBox rect={[52,238,760,485]} className="vgr-center"><ReferenceVisual name="cross-core"/><Text muted>原稿 Cross-Attention：Q 来自视觉，K/V 来自文本</Text></RefBox>
    <RefBox rect={[853,238,1,520]} className="vgr-divider"/>
    <ReferenceControls rect={[905,208,694,65]}><Button data-testid="cross-mode" active={!joint} onClick={()=>{setJoint(false);setQuery(0);}}>Cross-Attention</Button><Button data-testid="joint-mode" active={joint} onClick={()=>{setJoint(true);setQuery(0);}}>Joint Attention</Button></ReferenceControls>
    <RefBox rect={[937,297,380,411]} className="vgr-center vgr-matrix-area"><Text>{joint?'Key：文本 + 视觉':'Key：3 个文本 tokens'}</Text><div className="vgr-attention-matrix" data-testid="attention-matrix" data-rows={rows} data-cols={cols} style={{gridTemplateColumns:`repeat(${cols},minmax(0,1fr))`}}>{Array.from({length:rows*cols},(_,i)=>{const row=Math.floor(i/cols),col=i%cols;return <button key={i} type="button" className={query===row?'is-query':''} style={{backgroundImage:`url("${referenceAsset(`visuals/${joint&&col>=3?'token-blue':'token-modulated'}.png`)}")`,opacity:query===row?1:.22}} aria-label={`查询第 ${row+1} 行与第 ${col+1} 列的关系`} onClick={()=>setQuery(row)}/>;})}</div><Text>{joint?'Query：文本 + 视觉':'Query：4 个视觉 tokens'}</Text></RefBox>
    <RefBox rect={[1350,327,250,330]} className="vgr-center"><Typography variant="h3" tone="accent">Query {query+1}</Typography><Tokens count={joint?4:3} warm/><Text>{joint?'可读取文本与视觉两种序列':'来自视觉，读取文本 Key / Value'}</Text><Text muted>允许的配对：{rows} × {cols}</Text></RefBox>
    <RefBox rect={[77,764,1510,57]} className="vgr-center"><Text muted>点击矩阵中的一行，查看读取对象；格子表示允许的关系，不代表真实注意力权重。</Text></RefBox>
  </ReferenceCanvas>;
}
