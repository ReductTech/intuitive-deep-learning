import type { ReactNode } from 'react';
import type { LessonFlowRevealMode, LessonStepContext } from '../shared/react';
import { GeneralizationIntroPage } from './pages/GeneralizationIntroPage/GeneralizationIntroPage';
import { ImageNumbersPage } from './pages/ImageNumbersPage/ImageNumbersPage';
import { PixelRepresentationPage } from './pages/PixelRepresentationPage/PixelRepresentationPage';
import { ConvolutionFeatureMapPage } from './pages/ConvolutionFeatureMapPage/ConvolutionFeatureMapPage';
import { FeatureMapsPage } from './pages/FeatureMapsPage/FeatureMapsPage';
import { LearningFeaturesPage } from './pages/LearningFeaturesPage/LearningFeaturesPage';
import { EmbeddingOutputPage } from './pages/EmbeddingOutputPage/EmbeddingOutputPage';
import { DepthCapacityPage } from './pages/DepthCapacityPage/DepthCapacityPage';
import { DegradationProblemPage } from './pages/DegradationProblemPage/DegradationProblemPage';
import { OverfittingDegradationPage } from './pages/OverfittingDegradationPage/OverfittingDegradationPage';
import { IdentityRoutePage } from './pages/IdentityRoutePage/IdentityRoutePage';
import { ResidualIdeaPage } from './pages/ResidualIdeaPage/ResidualIdeaPage';
import { BasicBlockPage } from './pages/BasicBlockPage/BasicBlockPage';
import { SuperResolutionPage } from './pages/SuperResolutionPage/SuperResolutionPage';
import { ElementwiseAdditionPage } from './pages/ElementwiseAdditionPage/ElementwiseAdditionPage';
import { ZeroResidualPage } from './pages/ZeroResidualPage/ZeroResidualPage';
import { ShortcutGradientPage } from './pages/ShortcutGradientPage/ShortcutGradientPage';
import { ProjectionShortcutPage } from './pages/ProjectionShortcutPage/ProjectionShortcutPage';
import { ResNetAssemblyPage } from './pages/ResNetAssemblyPage/ResNetAssemblyPage';
import { PretrainingPage } from './pages/PretrainingPage/PretrainingPage';
import { StartingPointsPage } from './pages/StartingPointsPage/StartingPointsPage';
import { TransferableExperiencePage } from './pages/TransferableExperiencePage/TransferableExperiencePage';
import { ReplaceHeadPage } from './pages/ReplaceHeadPage/ReplaceHeadPage';
import { FreezeFineTunePage } from './pages/FreezeFineTunePage/FreezeFineTunePage';
import { StrategyMapPage } from './pages/StrategyMapPage/StrategyMapPage';
import { TransferWorkflowPage } from './pages/TransferWorkflowPage/TransferWorkflowPage';
import { BuildTrainingPlanPage } from './pages/BuildTrainingPlanPage/BuildTrainingPlanPage';

export interface ResNetTransferCourseItem {
  id: string;
  title: string;
  section: string;
  revealMode: LessonFlowRevealMode;
  component: (context: LessonStepContext) => ReactNode;
}

const courseItems: ResNetTransferCourseItem[] = [
  {
    id: '00-generalization-intro',
    title: '只有 300 张照片，怎样识别可回收物？',
    section: '表示学习',
    revealMode: 'cue',
    component: (context) => <GeneralizationIntroPage onComplete={context.complete} />,
  },
  {
    id: '02b-image-as-numbers',
    title: '计算机是怎样“看”一张塑料瓶照片的？',
    section: '表示学习',
    revealMode: 'cue',
    component: (context) => <ImageNumbersPage onComplete={context.complete} />,
  },
  {
    id: '03-pixels-and-representation',
    title: '能否仅通过原始像素数字逐个比较来进行可靠分类？',
    section: '表示学习',
    revealMode: 'cue',
    component: (context) => <PixelRepresentationPage onComplete={context.complete} />,
  },
  {
    id: '03b-convolution-feature-map',
    title: '特征表示怎样算出来？特征图怎样形成？',
    section: '表示学习',
    revealMode: 'cue',
    component: (context) => <ConvolutionFeatureMapPage onComplete={context.complete} />,
  },
  {
    id: '04-feature-maps',
    title: '特征图里存的是什么？',
    section: '表示学习',
    revealMode: 'cue',
    component: (context) => <FeatureMapsPage onComplete={context.complete} />,
  },
  {
    id: '06-learning-features',
    title: '这些特征是怎样学出来的？',
    section: '表示学习',
    revealMode: 'cue',
    component: (context) => <LearningFeaturesPage onComplete={context.complete} />,
  },
  {
    id: '08-embedding-output',
    title: '换一个分类头，模型会回答什么问题？',
    section: '表示学习',
    revealMode: 'cue',
    component: (context) => <EmbeddingOutputPage onComplete={context.complete} />,
  },
  {
    id: '09-depth-capacity',
    title: '更多层，究竟多了什么能力？',
    section: '深层网络',
    revealMode: 'cue',
    component: (context) => <DepthCapacityPage onComplete={context.complete} />,
  },
  {
    id: '11-degradation-problem',
    title: '想要更好的网络，只要堆更多的层就好了吗？',
    section: '深层网络',
    revealMode: 'cue',
    component: (context) => <DegradationProblemPage onComplete={context.complete} />,
  },
  {
    id: '11b-overfitting-vs-degradation',
    title: '过拟合与退化，到底差在哪里？',
    section: '深层网络',
    revealMode: 'cue',
    component: (context) => <OverfittingDegradationPage onComplete={context.complete} />,
  },
  {
    id: '12-identity-route',
    title: '多加几层，也能保留原结果吗？',
    section: 'ResNet',
    revealMode: 'cue',
    component: (context) => <IdentityRoutePage onComplete={context.complete} />,
  },
  {
    id: '12b-residual-idea',
    title: 'ResNet 的想法：不重写，只学修改量',
    section: 'ResNet',
    revealMode: 'cue',
    component: (context) => <ResidualIdeaPage onComplete={context.complete} />,
  },
  {
    id: '14-basic-block',
    title: '一个残差块的两条路线：残差分支与快捷路径',
    section: 'ResNet',
    revealMode: 'cue',
    component: (context) => <BasicBlockPage onComplete={context.complete} />,
  },
  {
    id: '15-elementwise-addition',
    title: '两张特征图怎样相加？',
    section: 'ResNet',
    revealMode: 'cue',
    component: (context) => <ElementwiseAdditionPage onComplete={context.complete} />,
  },
  {
    id: '18-projection-shortcut',
    title: '形状不一样，怎样对齐后再相加？',
    section: 'ResNet',
    revealMode: 'cue',
    component: (context) => <ProjectionShortcutPage onComplete={context.complete} />,
  },
  {
    id: '16-zero-residual',
    title: '当残差分支输出为 0，信息会消失吗？',
    section: 'ResNet',
    revealMode: 'cue',
    component: (context) => <ZeroResidualPage onComplete={context.complete} />,
  },
  {
    id: '14b-super-resolution',
    title: '把低清图变清晰，网络只学“细节差值”',
    section: 'ResNet',
    revealMode: 'cue',
    component: (context) => <SuperResolutionPage onComplete={context.complete} />,
  },
  {
    id: '17-shortcut-gradient',
    title: '捷径为什么让训练更顺？',
    section: 'ResNet',
    revealMode: 'cue',
    component: (context) => <ShortcutGradientPage onComplete={context.complete} />,
  },
  {
    id: '19-resnet18-assembly',
    title: '用残差块，构建完整的 ResNet-18',
    section: '构建 ResNet-18',
    revealMode: 'cue',
    component: (context) => <ResNetAssemblyPage onComplete={context.complete} />,
  },
  {
    id: '20-pretraining',
    title: '预训练，预先训练了什么？',
    section: '预训练',
    revealMode: 'cue',
    component: (context) => <PretrainingPage onComplete={context.complete} />,
  },
  {
    id: '21-starting-points',
    title: '同样的 ResNet-18，不同的参数起点',
    section: '预训练',
    revealMode: 'cue',
    component: (context) => <StartingPointsPage onComplete={context.complete} />,
  },
  {
    id: '22-transferable-visual-experience',
    title: '旧任务的视觉经验，哪些可以复用？',
    section: '迁移学习',
    revealMode: 'cue',
    component: (context) => <TransferableExperiencePage onComplete={context.complete} />,
  },
  {
    id: '23-replace-head',
    title: '旧分类头会答旧问题，怎样让它答新问题？',
    section: '迁移学习',
    revealMode: 'cue',
    component: (context) => <ReplaceHeadPage onComplete={context.complete} />,
  },
  {
    id: '24-freeze-or-finetune',
    title: '哪些参数正在学习？',
    section: '迁移学习',
    revealMode: 'cue',
    component: (context) => <FreezeFineTunePage onComplete={context.complete} />,
  },
  {
    id: '25-strategy-map',
    title: '从条件，直接读出微调范围',
    section: '迁移学习',
    revealMode: 'cue',
    component: (context) => <StrategyMapPage onComplete={context.complete} />,
  },
  {
    id: '26-transfer-workflow',
    title: '拿到预训练权重以后，下一步怎么做？',
    section: '迁移学习',
    revealMode: 'cue',
    component: (context) => <TransferWorkflowPage onComplete={context.complete} />,
  },
  {
    id: '28-build-training-plan',
    title: '回到 300 张照片，你会怎样训练？',
    section: '训练方案',
    revealMode: 'cue',
    component: (context) => <BuildTrainingPlanPage onComplete={context.complete} />,
  },
];

export const resNetTransferCourse: ResNetTransferCourseItem[] = courseItems;
