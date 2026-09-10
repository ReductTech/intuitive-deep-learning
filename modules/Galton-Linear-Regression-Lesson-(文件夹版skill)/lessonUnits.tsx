import type { ReactNode } from 'react';
import { GaltonStoryBlock } from './blocks/GaltonStoryBlock';
import { LinearModelBlock } from './blocks/LinearModelBlock';
import { LossFunctionBlock } from './blocks/LossFunctionBlock';
import { LossLabBlock } from './blocks/LossLabBlock';
import { RegressionSummaryBlock } from './blocks/RegressionSummaryBlock';
import { ResidualBlock } from './blocks/ResidualBlock';
import { ScatterEvidenceBlock } from './blocks/ScatterEvidenceBlock';

export type LessonMode = 'guide' | 'ppt';

export interface LinearRegressionLessonUnit {
  id: string;
  title: string;
  section: string;
  description: string;
  render: (mode: LessonMode) => ReactNode;
}

export const linearRegressionLessonUnits: LinearRegressionLessonUnit[] = [
  { id: 'opening', title: '高尔顿的身高问题', section: '问题从哪里来', description: '从 1886 年身高研究提出预测问题。', render: () => <GaltonStoryBlock /> },
  { id: 'scatter', title: '先读点云的方向', section: '观察数据', description: '从散点中识别正相关与不确定性。', render: (mode) => <ScatterEvidenceBlock interactive={mode === 'guide'} /> },
  { id: 'model', title: '把趋势写成直线', section: '建立模型', description: '建立 x、y、ŷ、w、b 与图形的对应。', render: (mode) => <LinearModelBlock interactive={mode === 'guide'} /> },
  { id: 'residual', title: '一次预测错了多少', section: '衡量误差', description: '用垂直距离理解残差。', render: () => <ResidualBlock /> },
  { id: 'loss', title: '把许多误差汇成损失', section: '定义损失', description: '比较 MAE 与 MSE 的惩罚方式。', render: () => <LossFunctionBlock /> },
  { id: 'loss-lab', title: '让损失选择直线', section: '动手拟合', description: '调节参数并观察残差与 MSE 同步变化。', render: (mode) => <LossLabBlock interactive={mode === 'guide'} /> },
  { id: 'summary', title: '从数据到训练目标', section: '总结迁移', description: '压缩完整认知链并迁移到新问题。', render: () => <RegressionSummaryBlock /> },
];

