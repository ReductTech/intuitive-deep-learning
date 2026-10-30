import { useState } from 'react';
import { Button } from '../../shared/react/controls/Button';
import { Frame, Note } from '../components/Diagrams';
import { NetworkLab } from '../components/NetworkLab';
import { StoryCaption, useStory } from '../components/Story';
import { LessonSplit, TeachingPanel } from '../components/TeachingPanel';
import { Photo, Text } from '../components/Diagrams';
const steps = ['小猫和书要在同一张图中协调。让一份带噪状态进入网络。', '细尺度特征保留局部位置，例如爪子和书页。', '进一步下采样：观察范围扩大，开始汇集整体布局。', '到达 Mid：以更紧凑的表示交换整体信息。', '回到较高分辨率，接回对应尺度的特征。', '回到细尺度：把整体布局与局部位置结合。', '形成空间预测。现在试着切断 Skip，追踪少掉的通路。'];
export function UNetBackbone() {
  const story = useStory(steps);
  const [skip, setSkip] = useState(true);
  return <Frame index={1} subtitle="沿着 U 形走一遍：小猫的布局和爪子的位置怎样同时被照顾？" takeaway="多尺度路径汇集上下文；Skip 让对应尺度的信息直接传回。">
    <LessonSplit>
      <TeachingPanel title="① 输入与观察" className="vga-sidebar">
        <Photo small noise={.55} label="带噪输入示意" />
        <div className="vga-panel-callout"><Text>点击特征图，观察阶段。</Text></div>
        <Text muted>兼顾整体布局与爪子的位置。</Text>
        <Button data-testid="skip-toggle" active={!skip} aria-pressed={!skip} onClick={() => { setSkip(!skip); story.go(6); }}>{skip ? '切断 Skip，比较通路' : '重新接通 Skip'}</Button>
      </TeachingPanel>
      <TeachingPanel title="② 多尺度特征流 · U-Net" className="vga-network-panel">
        <NetworkLab stage={story.step} skip={skip} playing={story.playing} onSelect={story.go} />
        <Note>{skip ? '浅蓝 Skip 连线：直接传回对应尺度的信息。' : 'Skip 已断开：少了一条直接传回的路径。'}</Note>
        <StoryCaption story={story} notes={[{at: 1, text: 'Down：汇集上下文'}, {at: 3, text: 'Mid：交换整体信息'}, {at: 4, text: 'Up：恢复空间细节'}]} />
      </TeachingPanel>
    </LessonSplit>
  </Frame>;
}
