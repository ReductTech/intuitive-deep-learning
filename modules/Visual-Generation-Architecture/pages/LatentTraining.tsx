import { useState } from 'react';
import { Button } from '../../shared/react/controls/Button';
import { Typography } from '../../shared/react/typography/Typography';
import { Arrow, Flow, Formula, Frame, Latent, ReferenceVisual, Text } from '../components/Diagrams';
import { Readout } from '../components/Story';
import { LessonSplit, TeachingPanel } from '../components/TeachingPanel';
export function LatentTraining() {
  const [prediction, setPrediction] = useState(.9);
  const [history, setHistory] = useState([1.69]);
  const target = -.4;
  const loss = (prediction - target) ** 2;
  const update = () => { const next = prediction + .35 * (target - prediction); setPrediction(next); setHistory(h => [...h, (next-target)**2]); };
  const reset = () => { setPrediction(.9); setHistory([1.69]); };
  return <Frame index={7} subtitle="让画师练习：加进去的噪声是已知的，预测偏差可以直接计算" takeaway="训练用已知噪声监督预测；减小预测误差，才能学会处理带噪状态。">
    <LessonSplit equal>
      <TeachingPanel title="① 已知噪声 → 主干预测" className="vga-training-input">
        <Flow><div className="vga-center"><Latent small variant="noisy" /><Text>构造带噪样本</Text></div><Arrow /><div className="vga-center"><ReferenceVisual name="unet-mini" alt="预测主干" style={{width: 190,height: 100}} /><Text>去噪主干预测</Text></div></Flow>
        <div className="vga-metric-row"><Readout label="已知目标" value="−0.40" /><Readout label="当前预测" value={prediction.toFixed(3)} /><Readout label="平方误差" value={<span data-testid="training-loss">{loss.toFixed(4)}</span>} warm /></div>
        <Formula latex={`\\mathcal{L}=(${prediction.toFixed(5)}-(-0.4))^2\\approx ${loss.toFixed(4)}`} />
        <div className="vga-stage-tabs"><Button variant="primary" data-testid="train-update" disabled={history.length>=10} onClick={update}>更新一次参数</Button><Button onClick={reset}>重新练习</Button></div>
      </TeachingPanel>
      <TeachingPanel title="② 更新后，误差如何变化？" className="vga-training-chart">
        <Typography variant="h3" tone="accent">损失轨迹</Typography>
        <svg className="vga-loss-chart" viewBox="0 0 600 220" aria-label="一维训练示例的损失轨迹"><path d="M25 10V195H580M25 95H580" fill="none" stroke="var(--ui-border)" /><polyline points={history.map((v,i) => `${35+i*57},${190-v/1.69*155}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="4" />{history.map((v,i) => <circle key={i} cx={35+i*57} cy={190-v/1.69*155} r="6" fill="currentColor" />)}</svg>
        <div className="vga-panel-callout"><Text>{history.length === 1 ? '点击左侧按钮，记录第一次更新。' : `已更新 ${history.length-1} 次；误差从 1.69 降到 ${loss.toFixed(4)}。`}</Text></div>
        <Text muted>预测值等于一维参数 w，用已知噪声监督更新；此处不训练真实模型。</Text>
      </TeachingPanel>
    </LessonSplit>
  </Frame>;
}
