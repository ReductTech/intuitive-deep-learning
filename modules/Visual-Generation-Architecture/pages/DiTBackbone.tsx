import { useState } from 'react';
import { Button } from '../../shared/react/controls/Button';
import { Typography } from '../../shared/react/typography/Typography';
import { Feature, Formula, Frame, Latent, ReferenceVisual, Text, Tokens } from '../components/Diagrams';
import { NetworkLab } from '../components/NetworkLab';
import { Reveal, StoryCaption, useStory } from '../components/Story';
import { LessonSplit, TeachingPanel } from '../components/TeachingPanel';
const steps = ['保持预测任务不变，只替换负责计算的网络主干。', '先把当前 latent 切成 patches，投影成视觉 tokens。', 'Transformer Blocks 让不同位置的 tokens 交换信息。', '输出投影得到每个 patch 的预测，再恢复空间排列。'];
export function DiTBackbone() {
  const story = useStory(steps);
  const [backbone, setBackbone] = useState('dit');
  return <Frame index={10} subtitle="换一位画师：输入输出任务相同，内部组织方式可以不同" takeaway="DiT 用 token 交互完成预测；恢复空间排列后，仍需采样更新与最终解码。">
    <LessonSplit>
      <TeachingPanel title="① 保持预测任务不变" className="vga-sidebar">
        <Latent />
        <Formula latex={'f_\\theta(z_t,t,c)\\to\\hat\\epsilon'} />
        <Button active={backbone==='unet'} data-testid="backbone-unet" onClick={() => setBackbone('unet')}>使用 U-Net 主干</Button>
        <Button active={backbone==='dit'} data-testid="backbone-dit" onClick={() => setBackbone('dit')}>使用 DiT 主干</Button>
        <Text muted>任务相同，组织方式不同。</Text>
      </TeachingPanel>
      <TeachingPanel title={backbone === 'unet' ? '② 多尺度空间特征 · U-Net' : '② 视觉 token 交互 · DiT'} className="vga-dit-panel">
        <div className="vga-backbone-stage" data-backbone={backbone}>{backbone === 'unet' ? <NetworkLab stage={6} /> : <div className="vga-dit-flow vga-enter">
          <Reveal show={story.step>=1} ghost><div className="vga-center"><Typography variant="bodySmall" tone="accent">Patch Embedding</Typography><Tokens count={3} /><Text muted>视觉 tokens</Text></div></Reveal>
          <Reveal show={story.step>=2} ghost><div className="vga-center"><Typography variant="bodySmall" tone="accent">Transformer Blocks</Typography><div className={'vga-transformer-stack' + (story.playing ? ' is-running' : '')}>{[0,1,2].map(i => <div key={i}><ReferenceVisual name="transformer-block" alt="参考图中的 DiT block" /><Text>Block {i+1}</Text></div>)}</div><Text muted>Attention · MLP</Text></div></Reveal>
          <Reveal show={story.step>=3} ghost><div className="vga-center"><Typography variant="bodySmall" tone="accent">输出投影</Typography><Feature size={110} level={4} /><Text muted>空间预测</Text></div></Reveal>
        </div>}</div>
        <StoryCaption story={story} notes={backbone === 'unet' ? [{at: 0, text: 'Down：汇集上下文'}, {at: 0, text: 'Mid：交换整体信息'}, {at: 0, text: 'Up：恢复空间细节'}] : [{at: 1, text: '切 patch，得到 tokens'}, {at: 2, text: 'Attention 交换信息'}, {at: 3, text: '输出投影与空间重排'}]} />
      </TeachingPanel>
    </LessonSplit>
  </Frame>;
}
