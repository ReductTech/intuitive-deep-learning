import { useState } from 'react';
import { Button } from '../../shared/react/controls/Button';
import { Typography } from '../../shared/react/typography/Typography';
import { Arrow, Flow, Formula, Frame, Photo, ReferenceVisual, Text } from '../components/Diagrams';
import { Mission, StoryCaption, useStory } from '../components/Story';
import { LessonSplit, TeachingPanel } from '../components/TeachingPanel';

const steps = ['收到委托：画一只正在学习的小猫。起点却只有随机噪声。', '把当前状态送入网络：它先预测这一步的噪声。', '采样器读取预测，计算新的带噪状态。', '重复调用同一套网络参数，画面逐渐形成。', '图像出现了。现在拆开每一步背后的网络。'];
export function PredictionCall() {
  const story = useStory(steps, 850);
  const [inspect, setInspect] = useState(false);
  return <Frame index={0} subtitle="收到一份委托：不用相机，画一只正在学习的小猫" takeaway="一张图像背后，是同一个网络被反复调用。">
    <LessonSplit>
      <TeachingPanel title="① 一份图像委托" className="vga-sidebar">
        <Typography variant="h2" tone="accent">让小猫，<br />从噪声中出现。</Typography>
        <Mission chapter="生成内容">一个正在学习的小猫</Mission>
        <Text muted>条件：时间 + 文本</Text>
        <Formula latex={'\\hat\\epsilon=f_\\theta(x_t,t,c)'} />
        <Button data-testid="prediction-answer" active={inspect} onClick={() => setInspect(!inspect)}>{inspect ? '收起网络剖面' : '观察一次网络调用'}</Button>
      </TeachingPanel>
      <TeachingPanel title="② 生成工作台 · 从噪声到图像" className="vga-prediction-panel">
        <div className="vga-workbench"><div className="vga-workbench-endpoint"><ReferenceVisual name="noise-prediction" alt="初始噪声示意" /><Text muted>初始噪声</Text></div><Arrow /><Photo noise={1 - story.step / 4} label={story.step === 4 ? '完成的图像示意' : `当前生成阶段 ${story.step} / 4`} /><Arrow /><div className="vga-workbench-endpoint"><ReferenceVisual name="cat" alt="小猫与书本的目标示意" /><Text muted>目标示意</Text></div>{inspect && <div className="vga-inspection vga-enter"><Typography variant="h3" tone="accent">一次调用的剖面</Typography><Text>输入：当前状态、时间、文本</Text><Text>输出：噪声预测</Text><Text muted>采样器再据此更新状态。</Text></div>}</div>
        <Flow className="vga-process-ribbon"><Text>当前状态</Text><Arrow /><Typography variant="bodySmall" tone={story.step % 2 ? 'warning' : 'accent'}>网络预测</Typography><Arrow warm /><Typography variant="bodySmall" tone={story.step > 0 && story.step % 2 === 0 ? 'warning' : 'accent'}>采样更新</Typography><Arrow /><Text>下一状态</Text></Flow>
        <StoryCaption story={story} notes={[{at: 0, text: '从随机噪声出发'}, {at: 1, text: '网络预测当前噪声'}, {at: 2, text: '采样器更新状态'}]} />
      </TeachingPanel>
    </LessonSplit>
  </Frame>;
}
