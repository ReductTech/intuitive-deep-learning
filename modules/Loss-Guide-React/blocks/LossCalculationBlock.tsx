import { useMemo, useState } from 'react';
import { Callout } from '../../shared/react/feedback/Callout';
import { ContentBlock } from '../../shared/react/layout/ContentBlock';
import { Question } from '../../shared/react/learning/Question';
import { PlotlyChart, type PlotlyLayout, type PlotlyTrace } from '../../shared/react/visuals/PlotlyChart';
import type { LessonBlockProps } from './NumberLineBlock';

const samples = Array.from({ length: 101 }, (_, index) => -2 + index * 0.1);
const traces: PlotlyTrace[] = [
  { type: 'scatter', mode: 'lines', name: 'L1 = |ŷ - y|', x: samples, y: samples.map((value) => Math.abs(value)), line: { color: '#f07e47', width: 3 } },
  { type: 'scatter', mode: 'lines', name: 'L2 = (ŷ - y)²', x: samples, y: samples.map((value) => value ** 2), line: { color: '#27446e', width: 3 } },
];
const layout: PlotlyLayout = { paper_bgcolor: '#fbfdff', plot_bgcolor: '#fbfdff', margin: { l: 46, r: 18, t: 16, b: 42 }, xaxis: { title: { text: '误差 ŷ - y' }, gridcolor: '#dfe6f1', zerolinecolor: '#68778f' }, yaxis: { title: { text: '损失' }, range: [0, 16], gridcolor: '#dfe6f1', zerolinecolor: '#68778f' }, font: { family: 'Inter, Segoe UI, sans-serif', color: '#27446e', size: 12 }, showlegend: true, legend: { orientation: 'h', y: -0.22 } };

export function LossCalculationBlock({ onComplete }: LessonBlockProps) {
  const [calculated, setCalculated] = useState(false);
  const [explained, setExplained] = useState(false);
  const data = useMemo(() => traces, []);

  return (
    <ContentBlock className="lg-react-block" title="亲手算一次" subtitle="现在真实值为 3，预测值为 7。图中同时画出了 L1 和 L2 随误差变化的形状。">
      <Callout tone="orange" label="你的任务" text="先算出当前预测的 L1、L2 损失。计算正确后，再解释两种损失的区别。" />
      <PlotlyChart className="lg-react-chart" data={data} layout={layout} minHeight={340} aria-label="L1 与 L2 损失函数图" />
      <Question type="fill" title="真实值为 3、预测值为 7：L1 Loss = ____，L2 Loss = ____。" blanks={[{ label: 'L1 Loss', placeholder: 'L1' }, { label: 'L2 Loss', placeholder: 'L2' }]} answer={['4', '16']} feedback={{ correct: '计算正确。L1 = 4，L2 = 16。现在继续解释两种损失的区别。' }} onCheck={(result) => setCalculated(result.ok)} />
      {calculated && <Question type="short" title="L1 Loss 和 L2 Loss 的区别是什么？" feedback={{ sample: '回答已记录。L1 按误差本身惩罚；L2 会更强地放大较大的误差。' }} onCheck={(result) => { if (result.ok && !explained) { setExplained(true); onComplete(); } }} />}
    </ContentBlock>
  );
}
