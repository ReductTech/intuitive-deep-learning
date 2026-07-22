import { useEffect, useState } from 'react';
import { Callout } from '../../shared/react/feedback/Callout';
import { ContentBlock } from '../../shared/react/layout/ContentBlock';
import { RangeControl } from '../../shared/react/controls/RangeControl';
import { NoticeStrip } from '../../shared/react/feedback/NoticeStrip';
import { ValueTile } from '../../shared/react/learning/ValueTile';

export interface LessonBlockProps {
  onComplete: () => void;
}

const target = 7;

export function NumberLineBlock({ onComplete }: LessonBlockProps) {
  const [prediction, setPrediction] = useState(1.6);
  const solved = Math.abs(prediction - target) < 0.05;
  const l1 = Math.abs(target - prediction);
  const l2 = l1 ** 2;

  useEffect(() => {
    if (solved) onComplete();
  }, [onComplete, solved]);

  const point = 34 + (prediction / 10) * 652;
  const targetPoint = 34 + (target / 10) * 652;

  return (
    <ContentBlock className="lg-react-block" title="损失就是距离" subtitle="Loss 衡量真实值和预测值之间差多少。先用一条数轴，把这种差距直接画出来。">
      <Callout tone="orange" label="你的任务" text="拖动绿色预测值，让它与红色真实值重合，把 Loss 缩小到 0。" />
      <div className="lg-react-numberline" aria-label="数轴距离演示">
        <svg viewBox="0 0 720 170" role="img" aria-label={`预测值 ${prediction.toFixed(1)}，真实值 ${target}`}>
          <line x1="34" y1="96" x2="686" y2="96" className="lg-react-axis" />
          {Array.from({ length: 11 }, (_, value) => <g key={value}><line x1={34 + value * 65.2} y1="88" x2={34 + value * 65.2} y2="104" className="lg-react-tick" /><text x={34 + value * 65.2} y="128" textAnchor="middle">{value}</text></g>)}
          <line x1={point} y1="61" x2={targetPoint} y2="61" className="lg-react-distance" />
          <circle cx={targetPoint} cy="96" r="12" className="lg-react-target" />
          <circle cx={point} cy="96" r="12" className="lg-react-prediction" />
          <text x={targetPoint} y="42" textAnchor="middle">真实值 7</text>
          <text x={point} y="151" textAnchor="middle">预测值 {prediction.toFixed(1)}</text>
        </svg>
      </div>
      <RangeControl label="调整预测值" min={0} max={10} step={0.1} value={prediction} digits={1} onChange={(event) => setPrediction(Number(event.target.value))} hint={!solved} />
      <div className="lg-react-value-grid"><ValueTile tone="orange" label="L1 Loss = |真实值 - 预测值|" value={l1.toFixed(1)} /><ValueTile tone="blue" label="L2 Loss = (真实值 - 预测值)²" value={l2.toFixed(1)} /></div>
      <NoticeStrip tone={solved ? 'green' : 'orange'} lead={solved ? '阶段完成：' : '操作提醒：'}>{solved ? '预测值已贴近真实值，Loss 变成 0。' : '拖动绿色预测值，让它贴近红色真实值。'}</NoticeStrip>
    </ContentBlock>
  );
}
