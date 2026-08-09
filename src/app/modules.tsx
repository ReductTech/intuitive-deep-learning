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
import { ImageAugmentationFinetuningPage } from '../../modules/Image-Augmentation-Finetuning-Module/ImageAugmentationFinetuningPage';
import { ObjectDetectionFoundationsPage } from '../../modules/Object-Detection-Foundations-Module/ObjectDetectionFoundationsPage';
import { DetectionModelsPage } from '../../modules/Detection-Models-Module/DetectionModelsPage';
import { PixelVisionPage } from '../../modules/Pixel-Vision-Module/PixelVisionPage';
import { VisionStyleCompetitionsPage } from '../../modules/Vision-Style-Competitions-Module/VisionStyleCompetitionsPage';

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
    id: 'image-augmentation-finetuning-module',
    title: '小数据也能训练好图像分类',
    description: '理解图像增广如何保持标签，以及如何复用预训练模型进行微调。',
    path: '/modules/image-augmentation-finetuning',
    badge: '计算机视觉模块',
    element: <ImageAugmentationFinetuningPage />,
    moduleType: 'teaching',
    difficulty: 'intermediate',
    audience: 'undergraduate',
  },
  {
    id: 'object-detection-foundations-module',
    title: '模型怎样找到图像里的多个目标',
    description: '理解边界框、IoU、锚框匹配、NMS 去重与多尺度检测。',
    path: '/modules/object-detection-foundations',
    badge: '计算机视觉模块',
    element: <ObjectDetectionFoundationsPage />,
    moduleType: 'teaching',
    difficulty: 'intermediate',
    audience: 'undergraduate',
  },
  {
    id: 'detection-models-module',
    title: '从检测数据到 SSD 与 R-CNN',
    description: '理解检测标签、SSD 多尺度预测，以及 R-CNN 系列从区域提议到实例掩码的演进。',
    path: '/modules/detection-models',
    badge: '计算机视觉模块',
    element: <DetectionModelsPage />,
    moduleType: 'teaching',
    difficulty: 'intermediate',
    audience: 'undergraduate',
  },
  {
    id: 'pixel-vision-module',
    title: '让模型理解图像中的每一个像素',
    description: '理解语义分割标签、同步裁剪、转置卷积与全卷积网络的像素级预测链路。',
    path: '/modules/pixel-vision',
    badge: '计算机视觉模块',
    element: <PixelVisionPage />,
    moduleType: 'teaching',
    difficulty: 'intermediate',
    audience: 'undergraduate',
  },
  {
    id: 'vision-style-competitions-module',
    title: '让图像获得新风格，并把模型送上竞赛排行榜',
    description: '理解神经风格迁移的三类损失与 Gram 表示，走完 CIFAR-10 和 Dogs 的训练、验证、重训与提交流程。',
    path: '/modules/vision-style-competitions',
    badge: '计算机视觉模块',
    element: <VisionStyleCompetitionsPage />,
    moduleType: 'teaching',
    difficulty: 'intermediate',
    audience: 'undergraduate',
  },
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
