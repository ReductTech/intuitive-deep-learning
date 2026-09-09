import type { ReactNode } from 'react';
import { GaltonLinearRegressionPage } from '../../modules/Galton-Linear-Regression/GaltonLinearRegressionPage';
import { ExpandedNeuronGuidePage } from '../../modules/Neuron-Guide/ExpandedNeuronGuidePage';
import { LinearRegressionLossPage } from '../../modules/Linear-Regression-Loss/LinearRegressionLossPage';

/** 当前可在应用中独立进入的教学模块。 */
export interface ActiveModule {
  id: string;
  title: string;
  description: string;
  path: string;
  badge: string;
  element: ReactNode;
  /** 模块类型：teaching = 教材型课堂模块，popular-science = 科普互动模块 */
  moduleType?: 'teaching' | 'popular-science';
  /** 难度级别：introductory = 入门（无需微积分），intermediate = 中级（需要高数/线代基础），advanced = 高级（研究导向） */
  difficulty?: 'introductory' | 'intermediate' | 'advanced';
  /** 目标受众：undergraduate = 本科生，general = 普通大众，graduate = 研究生 */
  audience?: 'undergraduate' | 'general' | 'graduate';
}

export const activeModules: ActiveModule[] = [
  {
    id: 'galton-linear-regression',
    title: '从高尔顿的身高数据到损失函数',
    description: '从一个真实的身高研究出发，看散点、直线、残差与损失如何接成一条认知链。',
    path: '/modules/galton-linear-regression',
    badge: '互动课程',
    element: <GaltonLinearRegressionPage />,
    moduleType: 'teaching',
    difficulty: 'introductory',
    audience: 'general',
  },
  {
    id: 'linear-regression-loss',
    title: '线性回归与损失函数',
    description: '从高尔顿的父母与孩子身高数据出发，拟合一条趋势线并用损失衡量预测偏差。',
    path: '/modules/linear-regression-loss',
    badge: '互动课程',
    element: <LinearRegressionLossPage />,
    moduleType: 'teaching',
    difficulty: 'introductory',
    audience: 'general',
  },
  {
    id: 'neuron-guide',
    title: '认识人工神经元',
    description: '从秀丽隐杆线虫的刺激反应出发，经由生物神经元的结构抽象，理解人工神经元的输入、权重、加权和与偏置。',
    path: '/modules/neuron-guide',
    badge: '互动课程',
    element: <ExpandedNeuronGuidePage />,
    moduleType: 'teaching',
    difficulty: 'introductory',
    audience: 'general',
  },
];
