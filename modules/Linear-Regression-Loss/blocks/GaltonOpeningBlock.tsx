import { useEffect } from 'react';
import { Callout, LessonStage, Typography, ValueTile } from '../../shared/react';
import { RegressionPlot } from '../components/RegressionPlot';
import { useLinearRegression } from '../model/LinearRegressionContext';

export function GaltonOpeningBlock({ onComplete }: { onComplete?: () => void }) {
  const { points } = useLinearRegression();
  useEffect(() => {
    if (!onComplete) return undefined;
    const timer = window.setTimeout(onComplete, 1600);
    return () => window.clearTimeout(timer);
  }, [onComplete]);
  return <LessonStage className="lr-opening-stage" variant="featured" title="高尔顿的问题：父母身高，能预测孩子吗？" description="1886 年，弗朗西斯·高尔顿把父母与孩子的身高放在一起比较。先观察证据，再决定什么值得交给模型。">
    <div className="lr-grid lr-grid--opening"><div><RegressionPlot points={points} slope={.5} intercept={35} /><Typography variant="bodySmall" tone="muted">教学样本仿自 Galton 研究：横轴为父母平均身高，纵轴为孩子身高（英寸）。点云向右上方倾斜，说明存在趋势；点没有排成一条线，说明趋势不是命运。</Typography><Callout tone="orange" label="历史观察" text="父母很高的孩子通常更高，但极高的父母，其孩子往往会向总体平均值靠近——这正是 regression to the mean 的早期观察。" /><Typography as="a" variant="bodySmall" tone="muted" href="https://galton.org/" target="_blank" rel="noreferrer">资料线索：Galton.org 历史档案 ↗</Typography></div>
      <div className="lr-opening-facts"><Typography variant="h3">这一页只做三件事</Typography><ValueTile label="先看整体" value="趋势" tone="blue" /><ValueTile label="再看例外" value="噪声" tone="orange" /><ValueTile label="最后提问" value="ŷ？" tone="success" /><Callout tone="blue" label="下一步" text="我们要把“看起来相关”写成一条可以调整、比较、评价的直线。" /></div></div>
  </LessonStage>;
}
