import { useState } from 'react';
import { Button } from '../../shared/react/controls/Button';
import { Frame, Note, Text } from '../components/Diagrams';
import { NetworkLab } from '../components/NetworkLab';
import { StoryCaption, useStory } from '../components/Story';
import { LessonSplit, TeachingPanel } from '../components/TeachingPanel';
const steps = ['先接通视觉主路，读取当前带噪状态。', '接上时间条件，让每个块知道当前噪声阶段。', '接上文本条件，让视觉位置读取委托内容。', '三条路径汇合。现在试着断开一条，再诊断缺少了什么。'];
export function ConditionedUNet() {
  const story = useStory(steps);
  const [cut, setCut] = useState<string | null>(null);
  const time = story.step >= 1 && cut !== 'time';
  const text = story.step >= 2 && cut !== 'text';
  return <Frame index={4} subtitle="把画师、时钟和委托内容连接到同一张网络图" takeaway="三个输入各有职责：视觉状态、噪声阶段、生成内容。">
    <LessonSplit>
      <TeachingPanel title="① 三条输入路径" className="vga-sidebar">
        <div className="vga-input-state is-on"><Text>视觉状态</Text><Text muted>当前带噪特征</Text></div>
        <div className={'vga-input-state' + (time ? ' is-on' : '')}><Text>时间条件</Text><Text muted>{time ? '已接通 · 当前噪声阶段' : '等待接入'}</Text></div>
        <div className={'vga-input-state' + (text ? ' is-on' : '')}><Text>文本条件</Text><Text muted>{text ? '已接通 · 本次生成内容' : '等待接入'}</Text></div>
        <div className="vga-stack">{[['time','切断时间'],['text','切断文本']].map(([id,label]) => <Button key={id} active={cut === id} onClick={() => { story.go(3); setCut(cut === id ? null : id); }}>{cut === id ? '重新接通' : label}</Button>)}</div>
      </TeachingPanel>
      <TeachingPanel title="② 汇入同一个 U-Net" className="vga-network-panel">
        <NetworkLab stage={6} playing={story.playing} time={time} text={text} />
        <Note>{cut === 'time' ? '时间已断开：缺少噪声阶段。' : cut === 'text' ? '文本已断开：缺少生成内容。' : 'Self-Attention：视觉内部；Cross-Attention：读取文本。'}</Note>
        <StoryCaption story={story} notes={[{at: 0, text: '视觉：带噪状态'}, {at: 1, text: '时间：噪声阶段'}, {at: 2, text: '文本：生成内容'}]} />
      </TeachingPanel>
    </LessonSplit>
  </Frame>;
}
