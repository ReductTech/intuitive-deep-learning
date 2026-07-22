import type { ReactNode } from 'react';
import { LossGuidePage } from '../../modules/Loss-Guide-React/LossGuidePage';

/** 已完成 React 迁移、可作为独立教学页面进入的模块。 */
export interface MigratedModule {
  id: string;
  title: string;
  description: string;
  path: string;
  badge: string;
  element: ReactNode;
}

export const migratedModules: MigratedModule[] = [
  {
    id: 'loss-guide-react',
    title: '损失函数导览',
    description: '从预测误差、损失计算到 L1／L2 梯度的交互式学习流程。',
    path: '/modules/loss-guide-react',
    badge: 'React 迁移版',
    element: <LossGuidePage />,
  },
];
