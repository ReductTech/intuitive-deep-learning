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
    id: '2444d635-22b7-44db-9f9b-0b44f4cc0b91',
    title: '只有 300 张照片，怎样识别可回收物？',
    section: '表示学习',
    revealMode: 'cue',
    component: (context) => <GeneralizationIntroPage onComplete={context.complete} />,
  },
  {
    id: '343e6924-c722-4936-bbf5-57bae3fea894',
    title: '计算机是怎样“看”一张塑料瓶照片的？',
    section: '表示学习',
    revealMode: 'cue',
    component: (context) => <ImageNumbersPage onComplete={context.complete} />,
  },
  {
    id: '9eed79c8-902a-4fce-8f87-5780319d7c71',
    title: '能否仅通过原始像素数字逐个比较来进行可靠分类？',
    section: '表示学习',
    revealMode: 'cue',
    component: (context) => <PixelRepresentationPage onComplete={context.complete} />,
  },
  {
    id: '7cbd07c5-20ca-4fa3-9140-65088f6a1c9d',
    title: '特征表示怎样算出来？特征图怎样形成？',
    section: '表示学习',
    revealMode: 'cue',
    component: (context) => <ConvolutionFeatureMapPage onComplete={context.complete} />,
  },
  {
    id: '16c48261-e695-4ac5-be93-5b3c3680cf34',
    title: '特征图里存的是什么？',
    section: '表示学习',
    revealMode: 'cue',
    component: (context) => <FeatureMapsPage onComplete={context.complete} />,
  },
  {
    id: 'd6cd940e-8926-439f-817b-69c4757fd8e9',
    title: '这些特征是怎样学出来的？',
    section: '表示学习',
    revealMode: 'cue',
    component: (context) => <LearningFeaturesPage onComplete={context.complete} />,
  },
  {
    id: 'a59dc519-f42c-4211-9824-ca0f73be4d24',
    title: '换一个分类头，模型会回答什么问题？',
    section: '表示学习',
    revealMode: 'cue',
    component: (context) => <EmbeddingOutputPage onComplete={context.complete} />,
  },
  {
    id: 'd9b48e20-3681-40dc-a731-f83342cff501',
    title: '更多层，究竟多了什么能力？',
    section: '深层网络',
    revealMode: 'cue',
    component: (context) => <DepthCapacityPage onComplete={context.complete} />,
  },
  {
    id: '51b54c1e-845a-4fc1-9458-4d74d0b40c51',
    title: '想要更好的网络，只要堆更多的层就好了吗？',
    section: '深层网络',
    revealMode: 'cue',
    component: (context) => <DegradationProblemPage onComplete={context.complete} />,
  },
  {
    id: '54306128-ed3d-4291-9d22-37ad5830d6f6',
    title: '过拟合与退化，到底差在哪里？',
    section: '深层网络',
    revealMode: 'cue',
    component: (context) => <OverfittingDegradationPage onComplete={context.complete} />,
  },
  {
    id: 'acc3f931-6ed5-4a2d-9dbe-2604f242485b',
    title: '多加几层，也能保留原结果吗？',
    section: 'ResNet',
    revealMode: 'cue',
    component: (context) => <IdentityRoutePage onComplete={context.complete} />,
  },
  {
    id: 'a1d23748-fd53-49f7-93a6-9ed439d92efd',
    title: 'ResNet 的想法：不重写，只学修改量',
    section: 'ResNet',
    revealMode: 'cue',
    component: (context) => <ResidualIdeaPage onComplete={context.complete} />,
  },
  {
    id: '73dd859f-dc1e-4ab1-a3fb-b16b4338e660',
    title: '一个残差块的两条路线：残差分支与快捷路径',
    section: 'ResNet',
    revealMode: 'cue',
    component: (context) => <BasicBlockPage onComplete={context.complete} />,
  },
  {
    id: 'd00bd957-dda5-4933-bd9f-55f41b5faff3',
    title: '两张特征图怎样相加？',
    section: 'ResNet',
    revealMode: 'cue',
    component: (context) => <ElementwiseAdditionPage onComplete={context.complete} />,
  },
  {
    id: 'ad198f4a-7cb6-4dee-b49c-7c0096a8f152',
    title: '形状不一样，怎样对齐后再相加？',
    section: 'ResNet',
    revealMode: 'cue',
    component: (context) => <ProjectionShortcutPage onComplete={context.complete} />,
  },
  {
    id: 'c7c016d8-8eb6-4880-8631-da52f831ff3f',
    title: '当残差分支输出为 0，信息会消失吗？',
    section: 'ResNet',
    revealMode: 'cue',
    component: (context) => <ZeroResidualPage onComplete={context.complete} />,
  },
  {
    id: 'a708ba3c-e0f6-4730-8a1a-6c8d2eeee892',
    title: '把低清图变清晰，网络只学“细节差值”',
    section: 'ResNet',
    revealMode: 'cue',
    component: (context) => <SuperResolutionPage onComplete={context.complete} />,
  },
  {
    id: '9db13104-04c6-4e6c-95a9-0f7a2d51a463',
    title: '捷径为什么让训练更顺？',
    section: 'ResNet',
    revealMode: 'cue',
    component: (context) => <ShortcutGradientPage onComplete={context.complete} />,
  },
  {
    id: '902aa599-2ea0-4a84-a07e-4f6f30e1aee2',
    title: '用残差块，构建完整的 ResNet-18',
    section: '构建 ResNet-18',
    revealMode: 'cue',
    component: (context) => <ResNetAssemblyPage onComplete={context.complete} />,
  },
  {
    id: 'dfdcbb71-eef8-4077-9d2c-bf46b4a8c8d9',
    title: '预训练，预先训练了什么？',
    section: '预训练',
    revealMode: 'cue',
    component: (context) => <PretrainingPage onComplete={context.complete} />,
  },
  {
    id: '5ec84a8d-a6ff-4dc2-a6ae-0ace5655bea1',
    title: '同样的 ResNet-18，不同的参数起点',
    section: '预训练',
    revealMode: 'cue',
    component: (context) => <StartingPointsPage onComplete={context.complete} />,
  },
  {
    id: '0765ad30-c2ed-472c-8d1e-4e3894fe1f72',
    title: '旧任务的视觉经验，哪些可以复用？',
    section: '迁移学习',
    revealMode: 'cue',
    component: (context) => <TransferableExperiencePage onComplete={context.complete} />,
  },
  {
    id: '59fca0aa-209a-42a9-b4d8-f8718fa394ef',
    title: '旧分类头会答旧问题，怎样让它答新问题？',
    section: '迁移学习',
    revealMode: 'cue',
    component: (context) => <ReplaceHeadPage onComplete={context.complete} />,
  },
  {
    id: '68259cec-1abc-4bf6-b163-bd2e42be970f',
    title: '哪些参数正在学习？',
    section: '迁移学习',
    revealMode: 'cue',
    component: (context) => <FreezeFineTunePage onComplete={context.complete} />,
  },
  {
    id: '7180cde6-b2c1-4c9f-a953-108dd5a70ac8',
    title: '从条件，直接读出微调范围',
    section: '迁移学习',
    revealMode: 'cue',
    component: (context) => <StrategyMapPage onComplete={context.complete} />,
  },
  {
    id: '86483a6a-30d6-4d4d-bd70-eb9d2398fc52',
    title: '拿到预训练权重以后，下一步怎么做？',
    section: '迁移学习',
    revealMode: 'cue',
    component: (context) => <TransferWorkflowPage onComplete={context.complete} />,
  },
  {
    id: 'b3d92411-5648-4463-94a0-cee32935f379',
    title: '回到 300 张照片，你会怎样训练？',
    section: '训练方案',
    revealMode: 'cue',
    component: (context) => <BuildTrainingPlanPage onComplete={context.complete} />,
  },
];

export const resNetTransferCourse: ResNetTransferCourseItem[] = courseItems;
