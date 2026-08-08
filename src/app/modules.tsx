import type { ReactNode } from 'react';
import { DatasetSplitPage } from '../../modules/Dataset-Split-Module/DatasetSplitPage';
import { FormulaTooltipPage } from '../../modules/Formula-Tooltip-React/FormulaTooltipPage';
import { HyperparameterPage } from '../../modules/Hyperparameter-Module/HyperparameterPage';
import { ActivationFuncPage } from '../../modules/Activation-Func-Module-React/ActivationFuncPage';
import { GradientDescentPage } from '../../modules/Gradient-Descent-Module-React/GradientDescentPage';
import { LossGuidePage } from '../../modules/Loss-Guide-React/LossGuidePage';
import { MiscPage } from '../../modules/MISC_Module/MiscPage';
import { MLPPlaygroundPage } from '../../modules/MLP_playground-React/MLPPlaygroundPage';
import { FittingPage } from '../../modules/Fitting_Module/FittingPage';
import { AdaptiveLearningRatePage } from '../../modules/Adaptive-Learning-Rate-Module/AdaptiveLearningRatePage';

/** 已完成 React 迁移、可作为独立教学页面进入的模块。 */
export interface MigratedModule {
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

export const migratedModules: MigratedModule[] = [
  {
    id: 'adaptive-learning-rate-module',
    title: '让模型学得更快',
    description: '从固定步长出发，理解 SGD、Momentum、AdaGrad 与 Adam 如何调整学习步伐。',
    path: '/modules/adaptive-learning-rate',
    badge: '互动教学模块',
    element: <AdaptiveLearningRatePage />,
  },
  {
    id: 'fitting-module',
    title: '拟合与泛化',
    description: '从训练与验证曲线判断欠拟合和过拟合。',
    path: '/modules/fitting-module',
    badge: '互动教学模块',
    element: <FittingPage />,
  },
  {
    id: 'misc-module',
    title: '训练中的计数单位',
    description: '理解 Batch、Step 与 Epoch 如何共同描述训练进度。',
    path: '/modules/misc-module',
    badge: '基础概念模块',
    element: <MiscPage />,
  },
  {
    id: 'dataset-split-module',
    title: '数据集划分',
    description: '理解训练集、验证集与测试集的职责和完整使用流程。',
    path: '/modules/dataset-split-module',
    badge: '互动教学模块',
    element: <DatasetSplitPage />,
  },
  {
    id: 'hyperparameter-module',
    title: '超参数与超参数搜索',
    description: '区分参数与超参数，理解常见超参数对训练的影响。',
    path: '/modules/hyperparameter-module',
    badge: '互动教学模块',
    element: <HyperparameterPage />,
  },
  {
    id: 'loss-guide-react',
    title: '损失函数导览',
    description: '从预测误差、损失计算到 L1／L2 梯度、交叉熵的完整损失函数教学模块。',
    path: '/modules/loss-guide-react',
    badge: '教材型教学模块',
    element: <LossGuidePage />,
    moduleType: 'teaching',
    difficulty: 'intermediate',
    audience: 'undergraduate',
  },
  {
    id: 'formula-tooltip-react',
    title: 'LaTeX 公式拆解演示',
    description: '用 MathLive 渲染训练目标函数，并为每个公式片段提供悬浮解释。',
    path: '/modules/formula-tooltip-react',
    badge: '公式实验模块',
    element: <FormulaTooltipPage />,
  },
  {
    id: 'gradient-descent-module-react',
    title: '梯度下降导览',
    description: '从手动调节输出层权重，到学习率实验和完整网络参数更新。',
    path: '/modules/gradient-descent-module-react',
    badge: 'React 迁移版',
    element: <GradientDescentPage />,
  },
  {
    id: 'activation-func-module-react',
    title: '激活函数与非线性',
    description: '从线性图像与网络叠加出发，观察 ReLU 怎样制造折点并逼近曲线。',
    path: '/modules/activation-func-module-react',
    badge: 'React 迁移版',
    element: <ActivationFuncPage />,
  },
  {
    id: 'mlp-playground-react',
    title: '多层感知机与分类边界',
    description: '从手绘分类边界到 1D、2D、3D MLP 训练实验，观察网络怎样学习非线性边界。',
    path: '/modules/mlp-playground-react',
    badge: 'React 迁移版',
    element: <MLPPlaygroundPage />,
  },
];
