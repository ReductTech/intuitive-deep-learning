import { useState } from 'react';
import { Button } from '../../shared/react/controls/Button';
import { RangeControl } from '../../shared/react/controls/RangeControl';
import { Typography } from '../../shared/react/typography/Typography';
import { Formula, Frame, Text } from '../components/Diagrams';
import { VectorBars } from '../components/VectorBars';
import { LessonSplit, TeachingPanel } from '../components/TeachingPanel';
import { ReferenceVisual } from '../components/Diagrams';
const input = [-1.2,-.3,.5,1];
const mean = input.reduce((a,b) => a+b,0)/input.length;
const std = Math.sqrt(input.reduce((a,b) => a+(b-mean)**2,0)/input.length);
const normalized = input.map(v => (v-mean)/std);
export function DiTTime() {
  const [time, setTime] = useState(500);
  const [enabled, setEnabled] = useState(true);
  const gamma = enabled ? .8 + time/1000*.6 : 1;
  const beta = enabled ? (time/1000-.5)*.8 : 0;
  const output = normalized.map(v => gamma*v+beta);
  return <Frame index={11} subtitle="时间不只是一个标签：它可以缩放和平移块内的特征" takeaway="AdaLN 用条件生成的参数调制归一化特征；图与数值应随同一次操作变化。">
    <LessonSplit>
      <TeachingPanel title="① 时间条件与调制参数" className="vga-sidebar">
        <ReferenceVisual name="transformer-block" alt="AdaLN 所在的 DiT block" style={{width: 285,height: 170}} />
        <RangeControl label="时间条件" value={time} min={0} max={1000} step={100} onChange={e => setTime(Number(e.target.value))} />
        <Formula latex={`\\gamma=${gamma.toFixed(2)},\\quad\\beta=${beta.toFixed(2)}`} />
        <Button active={!enabled} onClick={() => setEnabled(false)}>只做归一化</Button>
        <Button active={enabled} data-testid="enable-adaln" onClick={() => setEnabled(true)}>加入时间调制</Button>
      </TeachingPanel>
      <TeachingPanel title="② 同一份特征 · 调制前后对照" className="vga-adaln-panel">
        <div className="vga-two"><div className="vga-stack"><Typography variant="h3" tone="accent">归一化后</Typography><VectorBars values={normalized} /></div><div className="vga-stack"><Typography variant="h3" tone="warning">时间调制后</Typography><VectorBars values={output} warm /></div></div>
        <div className="vga-panel-callout"><Formula latex={'y=\\gamma\\odot\\mathrm{LN}(h)+\\beta'} /><Text>缩放 γ 与平移 β，改变各维特征的处理方式。</Text></div>
        <Text muted>四维数值使用教学映射；真实调制参数由训练学习。</Text>
      </TeachingPanel>
    </LessonSplit>
  </Frame>;
}
