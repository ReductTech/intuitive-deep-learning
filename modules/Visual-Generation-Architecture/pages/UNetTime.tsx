import { useState } from 'react';
import { RangeControl } from '../../shared/react/controls/RangeControl';
import { Typography } from '../../shared/react/typography/Typography';
import { Arrow, Feature, Flow, Formula, Frame, Photo, Text } from '../components/Diagrams';
import { Readout } from '../components/Story';
import { VectorBars } from '../components/VectorBars';
import { LessonSplit, TeachingPanel } from '../components/TeachingPanel';
export function UNetTime() {
  const [time, setTime] = useState(600);
  const vector = [Math.sin(time / 120), Math.cos(time / 120), Math.sin(time / 400), Math.cos(time / 400)];
  return <Frame index={2} subtitle="同一位画师，面对浓雾和薄雾，需要知道当前的噪声阶段" takeaway="改变时间，会同时改变编码向量与网络块收到的条件。">
    <LessonSplit>
      <TeachingPanel title="① 调整噪声阶段" className="vga-sidebar">
        <Photo noise={time / 1000} label={time > 500 ? '较高噪声状态' : '较低噪声状态'} />
        <Readout label="当前时间步" value={time} />
        <RangeControl label="拖动时钟" min={0} max={1000} step={10} value={time} onChange={e => setTime(Number(e.target.value))} />
        <Text muted>时间条件由多个块复用。</Text>
      </TeachingPanel>
      <TeachingPanel title="② 时间编码 → 多个网络块" className="vga-time-panel">
        <div className="vga-time-encoding"><div className="vga-stack"><Typography variant="h3" tone="accent">时间向量</Typography><VectorBars values={vector} /></div><Arrow warm /><div className="vga-stack"><Typography variant="h3" tone="accent">各块的学习映射</Typography><Formula latex={'h_i\\leftarrow h_i+W_i e_t'} /><Text>同一条件，分别映射。</Text></div></div>
        <div className="vga-time-destinations">{vector.slice(0,3).map((v, i) => <div key={i}><div className="vga-time-meter"><i style={{width: `${(v+1)*50}%`}} /></div><Feature size={95} level={i*2} /><Text>{['Down', 'Mid', 'Up'][i]}</Text></div>)}</div>
        <Text muted>特征图与条件强度条用于示意，不是实测网络激活。</Text>
      </TeachingPanel>
    </LessonSplit>
  </Frame>;
}
