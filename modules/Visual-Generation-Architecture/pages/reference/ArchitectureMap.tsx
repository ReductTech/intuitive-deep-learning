import { useState } from 'react';
import { Button } from '../../../shared/react/controls/Button';
import { Typography } from '../../../shared/react/typography/Typography';
import { Arrow, ReferenceVisual, Text } from '../../components/Diagrams';
import { RefBox, ReferenceCanvas } from '../../components/ReferenceCanvas';
const systems = [{ id:'pixel-unet',title:'Pixel × U-Net',details:'像素状态直接进入多尺度 U-Net，采样完成后得到像素图像。' },{ id:'latent-unet',title:'Latent × U-Net',details:'在压缩表示中用 U-Net 预测；循环完成后再由 Decoder 解码。' },{ id:'pixel-transformer',title:'Pixel × Transformer',details:'像素状态切成 tokens，用 Transformer 预测，再恢复空间排列。' },{ id:'latent-transformer',title:'Latent × Transformer',details:'latent 切成 tokens，用 Transformer 预测；最终 latent 由 Decoder 解码。' }];
export function ArchitectureMap() {
  const [selected,setSelected]=useState(3);
  return <ReferenceCanvas index={13} title="视觉生成架构：空间 × 主干" subtitle="VAE 决定表示空间；U-Net / Transformer 决定怎样处理当前状态" summary="生成空间 × 预测主干：两个独立维度，组成不同的网络路线。">
    <RefBox rect={[50,210,1572,515]} className="vgr-architecture-grid" data-testid="architecture-grid">
      <div/><Typography variant="body" tone="accent">U-Net · 多尺度特征</Typography><Typography variant="body" tone="accent">Transformer · 视觉 tokens</Typography>
      {[false,true].map(latent => <div className="vgr-system-row" key={String(latent)}>
        <Typography variant="body" tone="accent">{latent?'Latent 空间':'像素空间'}</Typography>
        {[false,true].map(transformer => {
          const id=`${latent?'latent':'pixel'}-${transformer?'transformer':'unet'}`;
          const i=systems.findIndex(s=>s.id===id), system=systems[i];
          return <Button className="vgr-system-choice" key={id} data-testid={`system-${id}`} aria-pressed={selected===i} active={selected===i} onClick={()=>setSelected(i)}>
            <span className="vgr-system-flow"><ReferenceVisual name={latent?'latent-encoded':'noisy-cat'} alt={latent?'latent 表示':'像素状态'}/><Arrow/><ReferenceVisual name={transformer?'transformer-block':'unet-mini'} alt={transformer?'Transformer 主干':'U-Net 主干'}/></span>
            <Typography as="span" variant="bodySmall" tone="inherit">{system.title}</Typography>
          </Button>;
        })}
      </div>)}
    </RefBox>
    <RefBox rect={[225,742,1378,82]} className="vgr-center" data-testid="architecture-details"><Text>{systems[selected].details}</Text></RefBox>
  </ReferenceCanvas>;
}
