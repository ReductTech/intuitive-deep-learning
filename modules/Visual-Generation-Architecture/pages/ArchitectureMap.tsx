import { useState } from 'react';
import { Button } from '../../shared/react/controls/Button';
import { Question } from '../../shared/react/learning/Question';
import { Typography } from '../../shared/react/typography/Typography';
import { Frame, Text } from '../components/Diagrams';
import { LessonSplit, TeachingPanel } from '../components/TeachingPanel';
const systems = [{ id:'pixel-unet',title:'Pixel × U-Net',details:'像素状态直接进入多尺度 U-Net，采样完成后得到像素图像。' },{ id:'latent-unet',title:'Latent × U-Net',details:'在压缩表示中用 U-Net 预测；循环完成后再由 Decoder 解码。' },{ id:'pixel-transformer',title:'Pixel × Transformer',details:'像素状态切成 tokens，用 Transformer 预测，再恢复空间排列。' },{ id:'latent-transformer',title:'Latent × Transformer',details:'latent 切成 tokens，用 Transformer 预测；最终 latent 由 Decoder 解码。' }];
export function ArchitectureMap() {
  const [selected,setSelected]=useState(3);
  return <Frame index={13} subtitle="新的委托来了：只给你组件清单，能不能读懂它怎样生成？" takeaway="先判断生成空间，再判断预测主干；组件职责随之清楚。">
    <LessonSplit equal className="vga-map-layout">
      <TeachingPanel title="① 生成空间 × 预测主干" className="vga-system-panel">
        <div className="vga-system-grid">{systems.map((system,i) => <Button key={system.id} active={selected===i} className="vga-system-choice" aria-pressed={selected===i} onClick={() => setSelected(i)}><Typography as="span" variant="h3" tone="inherit">{system.title}</Typography></Button>)}</div>
        <div className="vga-panel-callout"><Text>{systems[selected].details}</Text></div>
      </TeachingPanel>
      <TeachingPanel title="② 沿组件链寻找证据" className="vga-question-panel">
        <Question className="vga-map-question" type="choice" typeLabel="新委托 · 迁移判断" title="VAE 压缩 → 切 patch → Transformer 预测 velocity → 采样 → 解码，属于哪种组合？" options={systems.map(s=>({value:s.id,label:s.title,wrongFeedback:s.id==='pixel-unet'?'既用了 latent 压缩，也用了 Transformer，需要同时看两个维度。':s.id==='latent-unet'?'生成空间判断对了，但实际执行预测的是 Transformer。':'Transformer 判断对了，但 VAE 之后反复处理的是 latent。'}))} answer="latent-transformer" feedback={{ correct:'正是 Latent × Transformer。VAE 转换表示，Transformer 预测，采样器更新状态。',wrong:'沿组件链找证据：VAE 决定表示空间，主干名称决定处理结构。' }} />
      </TeachingPanel>
    </LessonSplit>
  </Frame>;
}
