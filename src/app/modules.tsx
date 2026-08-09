import type { ReactNode } from 'react';
import { DatasetSplitPage } from '../../modules/Dataset-Split-Module/DatasetSplitPage';
import { FormulaTooltipPage } from '../../modules/Formula-Tooltip-React/FormulaTooltipPage';
import { DigitalImagePage } from '../../modules/Digital-Image-Module-React/DigitalImagePage';
import { HyperparameterPage } from '../../modules/Hyperparameter-Module/HyperparameterPage';
import { ActivationFuncPage } from '../../modules/Activation-Func-Module-React/ActivationFuncPage';
import { GradientDescentPage } from '../../modules/Gradient-Descent-Module-React/GradientDescentPage';
import { LossGuidePage } from '../../modules/Loss-Guide-React/LossGuidePage';
import { LossGuide2Page } from '../../modules/Loss-Guide-2-React/LossGuide2Page';
import { MiscPage } from '../../modules/MISC_Module/MiscPage';
import { MLPPlaygroundPage } from '../../modules/MLP_playground-React/MLPPlaygroundPage';
import { FittingPage } from '../../modules/Fitting_Module/FittingPage';
import { AdaptiveLearningRatePage } from '../../modules/Adaptive-Learning-Rate-Module/AdaptiveLearningRatePage';
import { ManualFeatureClassificationPage } from '../../modules/Manual-Feature-Classification-React/ManualFeatureClassificationPage';
import { ConvolutionKernelIntroPage } from '../../modules/Convolution-Kernel-Intro-React/ConvolutionKernelIntroPage';
import { LeNet5CnnLabPage } from '../../modules/LeNet5-CNN-Lab-React/LeNet5CnnLabPage';
import { FaceRecogLabPage } from '../../modules/Face-Recog-Lab-React/FaceRecogLabPage';

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
  {
    id: 'loss-guide-2-react',
    title: '输出层与分类损失',
    description: '用同一个天气场景理解 Sigmoid + BCE、Softmax + Cross Entropy，以及任务与输出头的搭配。',
    path: '/modules/loss-guide-2-react',
    badge: 'React 迁移版',
    element: <LossGuide2Page />,
  },
  {
    id: 'digital-image-module-react',
    title: '数字图像与 RGB 矩阵',
    description: '从屏幕子像素、RGB 调色到本地图片的三个通道和 3×3 数值矩阵。',
    path: '/modules/digital-image-module-react',
    badge: 'React 迁移版',
    element: <DigitalImagePage />,
  },
  {
    id: 'manual-feature-classification-react',
    title: '人工特征的分类',
    description: '从 MNIST 九宫格计数与分布热力图出发，训练双层 MLP，并观察人工特征的价值与边界。',
    path: '/modules/manual-feature-classification-react',
    badge: 'React 迁移版',
    element: <ManualFeatureClassificationPage />,
  },
  {
    id: 'convolution-kernel-intro-react',
    title: '卷积核入门',
    description: '从五子棋的局部模式出发，设计 5×5 算子，并让同一个卷积核扫描 MNIST 手写数字。',
    path: '/modules/convolution-kernel-intro-react',
    badge: 'React 迁移版',
    element: <ConvolutionKernelIntroPage />,
  },
  {
    id: 'lenet5-cnn-lab-react',
    title: '从人工卷积核到 LeNet-5',
    description: '训练固定卷积核分类头，并把单个数字识别器用于序列识别和滑窗目标检测。',
    path: '/modules/lenet5-cnn-lab-react',
    badge: 'React 迁移版',
    element: <LeNet5CnnLabPage />,
  },
  {
    id: 'face-recog-lab-react',
    title: '人脸识别：固定卷积核到参数全训',
    description: '在 LFW 彩色人脸子集上比较固定卷积核分类头与可学习 CNN，并通过乔装挑战理解人脸表征。',
    path: '/modules/face-recog-lab-react',
    badge: 'React 迁移版',
    element: <FaceRecogLabPage />,
  },
];
