import { ContentBlock, ModuleShell } from '../../modules/shared/react';
import { ActivationCatalogBlock } from '../../modules/Activation-Func-Module-React/blocks/ActivationCatalogBlock';
import { ApproximationBlock } from '../../modules/Activation-Func-Module-React/blocks/ApproximationBlock';
import { DeepLinearBlock } from '../../modules/Activation-Func-Module-React/blocks/DeepLinearBlock';
import { LinearConclusionBlock } from '../../modules/Activation-Func-Module-React/blocks/LinearConclusionBlock';
import { Linear2DChoiceBlock, Linear3DChoiceBlock } from '../../modules/Activation-Func-Module-React/blocks/LinearChoiceBlocks';
import { ReluIntroBlock } from '../../modules/Activation-Func-Module-React/blocks/ReluIntroBlock';
import { ReluNetworkBlock } from '../../modules/Activation-Func-Module-React/blocks/ReluNetworkBlock';
import { ShallowLinearBlock } from '../../modules/Activation-Func-Module-React/blocks/ShallowLinearBlock';
import { AutoUpdateBlock } from '../../modules/Gradient-Descent-Module-React/blocks/AutoUpdateBlock';
import { FullNetworkTrainingBlock } from '../../modules/Gradient-Descent-Module-React/blocks/FullNetworkTrainingBlock';
import { ManualTuningBlock } from '../../modules/Gradient-Descent-Module-React/blocks/ManualTuningBlock';
import { ResourcesBlock as GradientResourcesBlock } from '../../modules/Gradient-Descent-Module-React/blocks/ResourcesBlock';
import { GradientBlock } from '../../modules/Loss-Guide-React/blocks/GradientBlock';
import { LossCalculationBlock } from '../../modules/Loss-Guide-React/blocks/LossCalculationBlock';
import { NumberLineBlock } from '../../modules/Loss-Guide-React/blocks/NumberLineBlock';
import { ResourcesBlock } from '../../modules/Loss-Guide-React/blocks/ResourcesBlock';
import { DatasetLessonFooter } from '../../modules/Dataset-Split-Module/blocks/DatasetLessonFooter';
import { DatasetSplitProcessBlock } from '../../modules/Dataset-Split-Module/blocks/DatasetSplitProcessBlock';
import { HyperparameterOverviewBlock } from '../../modules/Hyperparameter-Module/blocks/HyperparameterOverviewBlock';
import { HyperparameterLessonFooter } from '../../modules/Hyperparameter-Module/blocks/HyperparameterLessonFooter';
import { GridSearchSimulationBlock } from '../../modules/Hyperparameter-Module/blocks/GridSearchSimulationBlock';
import { RandomSearchSimulationBlock } from '../../modules/Hyperparameter-Module/blocks/RandomSearchSimulationBlock';
import { BatchStepEpochBlock } from '../../modules/MISC_Module/blocks/BatchStepEpochBlock';
import { MlpLabBlock } from '../../modules/MLP_playground-React/blocks/MlpLabBlock';
import { MlpTransitionBlock } from '../../modules/MLP_playground-React/blocks/MlpTransitionBlock';
import {
  PersistedBoundaryChallengeBlock,
  PersistedScenarioIntroBlock,
} from '../../modules/MLP_playground-React/blocks/PersistedGuideBlocks';
import { ResourcesBlock as MlpResourcesBlock } from '../../modules/MLP_playground-React/blocks/ResourcesBlock';
import { DropoutBlock } from '../../modules/Fitting_Module/blocks/DropoutBlock';
import { FittingDiagnosisBlock } from '../../modules/Fitting_Module/blocks/FittingDiagnosisBlock';
import { FittingLessonFooter } from '../../modules/Fitting_Module/blocks/FittingLessonFooter';
import { WeightRegularizationBlock } from '../../modules/Fitting_Module/blocks/WeightRegularizationBlock';
import { SgdFoundationBlock } from '../../modules/Adaptive-Learning-Rate-Module/blocks/SgdFoundationBlock';
import { AdaGradBlock } from '../../modules/Adaptive-Learning-Rate-Module/blocks/AdaGradBlock';
import { AdamBlock } from '../../modules/Adaptive-Learning-Rate-Module/blocks/AdamBlock';
import { AdaptiveLearningRateLessonFooter } from '../../modules/Adaptive-Learning-Rate-Module/blocks/AdaptiveLearningRateLessonFooter';
import { BlockPreview } from './BlockPreview';
import { UiKitPage } from '../../modules/shared/react/routing/UiKitPage';
import { AppLink, type AppRoute } from './Router';
import { migratedModules } from './modules';

const blockPreviews = [
  { id: 'adaptive-lr-sgd', group: '自适应学习率', title: 'SGD 基础', description: '用碗形损失曲线理解梯度方向、学习率与一步参数更新。', path: '/dev/blocks/adaptive-learning-rate/sgd' },
  { id: 'adaptive-lr-adagrad', group: '自适应学习率', title: 'AdaGrad', description: '观察历史平方梯度如何为每个参数缩放有效学习率。', path: '/dev/blocks/adaptive-learning-rate/adagrad' },
  { id: 'adaptive-lr-adam', group: '自适应学习率', title: 'Adam', description: '在噪声梯度序列中比较原始梯度、方向记忆与自适应更新量。', path: '/dev/blocks/adaptive-learning-rate/adam' },
  { id: 'adaptive-lr-ending', group: '自适应学习率', title: '课程结尾', description: '回顾 SGD、AdaGrad 与 Adam 的演化主线。', path: '/dev/blocks/adaptive-learning-rate/ending' },
  { id: 'fitting-diagnosis', group: '拟合与泛化', title: '辨别欠拟合与过拟合', description: '观察训练与验证曲线，标记过拟合开始位置。', path: '/dev/blocks/fitting/diagnosis' },
  { id: 'fitting-weight-regularization', group: '拟合与泛化', title: '权重正则化', description: '理解小权重为何更稳定，以及正则项如何缓解过拟合。', path: '/dev/blocks/fitting/weight-regularization' },
  { id: 'fitting-dropout', group: '拟合与泛化', title: 'Dropout', description: '观察每次训练如何用新的随机 Mask 屏蔽部分激活。', path: '/dev/blocks/fitting/dropout' },
  { id: 'fitting-ending', group: '拟合与泛化', title: '课程结尾', description: '拟合与泛化课程完成状态及延伸视频。', path: '/dev/blocks/fitting/ending' },
  { id: 'misc-batch-step-epoch', group: '基础概念', title: 'Batch、Step 与 Epoch', description: '理解批次、参数更新次数与完整训练轮次。', path: '/dev/blocks/misc/batch-step-epoch' },
  { id: 'hyperparameter-overview', group: '超参数与超参数搜索', title: '超参数', description: '参数与超参数、常见超参数滑杆及单选题。', path: '/dev/blocks/hyperparameter/overview' },
  { id: 'hyperparameter-grid-search', group: '超参数与超参数搜索', title: '网格搜索', description: '运行学习率与权重衰减的二维网格搜索。', path: '/dev/blocks/hyperparameter/grid-search' },
  { id: 'hyperparameter-random-search', group: '超参数与超参数搜索', title: '随机搜索', description: '使用固定预算从连续分布中随机采样超参数。', path: '/dev/blocks/hyperparameter/random-search' },
  { id: 'hyperparameter-ending', group: '超参数与超参数搜索', title: '课程结尾', description: '超参数课程完成状态。', path: '/dev/blocks/hyperparameter/ending' },
  { id: 'dataset-process', group: '数据集划分', title: '数据集划分与训练流程', description: '数据比例划分、训练验证循环与最终测试。', path: '/dev/blocks/dataset-split/process' },
  { id: 'dataset-ending', group: '数据集划分', title: '课程结尾', description: '数据集课程完成状态。', path: '/dev/blocks/dataset-split/ending' },
  { id: 'loss-number-line', group: '损失函数导览', title: '数轴距离', description: '通过数轴理解预测与真实值之间的距离。', path: '/dev/blocks/loss-guide-react/number-line' },
  { id: 'loss-calculation', group: '损失函数导览', title: '损失计算', description: '独立调试损失计算教学块。', path: '/dev/blocks/loss-guide-react/calculation' },
  { id: 'loss-gradient', group: '损失函数导览', title: 'L1 与 L2 梯度', description: '独立调试梯度比较教学块。', path: '/dev/blocks/loss-guide-react/gradient' },
  { id: 'loss-resources', group: '损失函数导览', title: '推荐资源', description: '独立调试课程结尾与推荐资源。', path: '/dev/blocks/loss-guide-react/resources' },
];

function HomePage() {
  return (
    <ModuleShell title="Intuitive Deep Learning" subtitle="完整课程、子模块与共享 UI 的统一开发入口">
      <ContentBlock title="完整教学模块" subtitle="以完整 LessonFlow 运行课程，检查模块之间的渐进式披露。">
        <div className="app-module-catalog">
          {migratedModules.map((module) => <AppLink key={module.id} className="app-module-card" to={module.path}>
            <span className="edu-badge">{module.badge}</span>
            <strong>{module.title}</strong>
            <span>{module.description}</span>
            <em>进入模块 →</em>
          </AppLink>)}
        </div>
      </ContentBlock>
      <ContentBlock title="子模块调试" subtitle="绕过完整课程流程，单独进入、重置和调试每一个内容块。">
        <div className="app-block-catalog">
          {blockPreviews.map((block) => <AppLink key={block.id} className="app-block-card" to={block.path}>
            <span>{block.group}</span><strong>{block.title}</strong><p>{block.description}</p><em>单独调试 →</em>
          </AppLink>)}
        </div>
      </ContentBlock>
      <ContentBlock title="Shared UI Kit" subtitle="检查所有共享组件、流程控制、题型和课程结尾样式。">
        <AppLink className="app-ui-kit-card" to="/shared/ui-kit"><span className="edu-badge">设计系统</span><strong>打开 Shared UI Kit</strong><span>统一查看基础展示、控件、提示、流程控制、考试题型和课程结尾。</span><em>进入 UI Kit →</em></AppLink>
      </ContentBlock>
    </ModuleShell>
  );
}

function NumberLinePreview() {
  return <BlockPreview title="数轴距离">{({ complete }) => <NumberLineBlock onComplete={complete} />}</BlockPreview>;
}

function CalculationPreview() {
  return <BlockPreview title="损失计算">{({ complete }) => <LossCalculationBlock onComplete={complete} />}</BlockPreview>;
}

function GradientPreview() {
  return <BlockPreview title="L1 与 L2 梯度">{({ complete }) => <GradientBlock onComplete={complete} />}</BlockPreview>;
}

function ResourcesPreview() {
  return <BlockPreview title="推荐资源">{() => <ResourcesBlock />}</BlockPreview>;
}

function DatasetHyperparametersPreview() {
  return <BlockPreview title="超参数">{({ complete }) => <HyperparameterOverviewBlock onComplete={complete} />}</BlockPreview>;
}

function HyperparameterEndingPreview() {
  return <BlockPreview title="课程结尾">{() => <HyperparameterLessonFooter />}</BlockPreview>;
}

function HyperparameterGridSearchPreview() {
  return <BlockPreview title="网格搜索">{({ complete }) => <GridSearchSimulationBlock onComplete={complete} />}</BlockPreview>;
}

function HyperparameterRandomSearchPreview() {
  return <BlockPreview title="随机搜索">{({ complete }) => <RandomSearchSimulationBlock onComplete={complete} />}</BlockPreview>;
}

function DatasetProcessPreview() {
  return <BlockPreview title="数据集划分与训练流程">{({ complete }) => <DatasetSplitProcessBlock onComplete={complete} />}</BlockPreview>;
}

function DatasetEndingPreview() {
  return <BlockPreview title="课程结尾">{() => <DatasetLessonFooter />}</BlockPreview>;
}

function BatchStepEpochPreview() {
  return <BlockPreview title="Batch、Step 与 Epoch">{({ complete }) => <BatchStepEpochBlock onComplete={complete} />}</BlockPreview>;
}

function GradientManualPreview() {
  return <BlockPreview title="手动调整输出层权重">{({ complete }) => <ManualTuningBlock onComplete={complete} />}</BlockPreview>;
}

function GradientAutoUpdatePreview() {
  return <BlockPreview title="推导并执行梯度更新">{({ complete }) => <AutoUpdateBlock onComplete={complete} />}</BlockPreview>;
}

function GradientFullNetworkPreview() {
  return <BlockPreview title="让完整网络一起学习">{({ complete }) => <FullNetworkTrainingBlock onComplete={complete} />}</BlockPreview>;
}

function GradientResourcesPreview() {
  return <BlockPreview title="梯度下降推荐资源">{() => <GradientResourcesBlock />}</BlockPreview>;
}

function ActivationLinear2DPreview() {
  return <BlockPreview title="线性定义与二维判断">{({ complete }) => <Linear2DChoiceBlock onComplete={complete} />}</BlockPreview>;
}

function ActivationLinear3DPreview() {
  return <BlockPreview title="三维线性判断">{({ complete }) => <Linear3DChoiceBlock onComplete={complete} />}</BlockPreview>;
}

function ActivationShallowPreview() {
  return <BlockPreview title="浅层线性网络">{({ complete }) => <ShallowLinearBlock onComplete={complete} />}</BlockPreview>;
}

function ActivationDeepPreview() {
  return <BlockPreview title="深层线性网络">{({ complete }) => <DeepLinearBlock onComplete={complete} />}</BlockPreview>;
}

function ActivationLinearConclusionPreview() {
  return <BlockPreview title="线性结论">{({ complete }) => <LinearConclusionBlock onComplete={complete} />}</BlockPreview>;
}

function ActivationReluIntroPreview() {
  return <BlockPreview title="单神经元 ReLU">{({ complete }) => <ReluIntroBlock onComplete={complete} />}</BlockPreview>;
}

function ActivationReluNetworkPreview() {
  return <BlockPreview title="多神经元 ReLU 网络">{({ complete }) => <ReluNetworkBlock onComplete={complete} />}</BlockPreview>;
}

function ActivationApproximationPreview() {
  return <BlockPreview title="曲线逼近">{({ complete }) => <ApproximationBlock onComplete={complete} />}</BlockPreview>;
}

function ActivationCatalogPreview() {
  return <BlockPreview title="激活函数与推荐资源">{() => <ActivationCatalogBlock />}</BlockPreview>;
}

function MlpScenarioPreview() {
  return <BlockPreview title="个性化分类情境">{({ complete }) => <PersistedScenarioIntroBlock onComplete={complete} />}</BlockPreview>;
}

function MlpBoundaryPreview() {
  return <BlockPreview title="三关手绘分类边界">{({ complete }) => <PersistedBoundaryChallengeBlock onComplete={complete} />}</BlockPreview>;
}

function MlpTransitionPreview() {
  return <BlockPreview title="MLP 实验过渡">{({ complete }) => <MlpTransitionBlock onComplete={complete} />}</BlockPreview>;
}

function MlpOneDimensionalPreview() {
  return <BlockPreview title="1D MLP 实验">{({ complete }) => <MlpLabBlock dimension={1} onComplete={complete} />}</BlockPreview>;
}

function MlpTwoDimensionalPreview() {
  return <BlockPreview title="2D MLP 实验">{({ complete }) => <MlpLabBlock dimension={2} onComplete={complete} />}</BlockPreview>;
}

function MlpThreeDimensionalPreview() {
  return <BlockPreview title="3D MLP 实验">{({ complete }) => <MlpLabBlock dimension={3} onComplete={complete} />}</BlockPreview>;
}

function MlpResourcesPreview() {
  return <BlockPreview title="MLP 推荐资源">{() => <MlpResourcesBlock />}</BlockPreview>;
}

function FittingDiagnosisPreview() {
  return <BlockPreview title="辨别欠拟合与过拟合">{({ complete }) => <FittingDiagnosisBlock onComplete={complete} />}</BlockPreview>;
}

function WeightRegularizationPreview() {
  return <BlockPreview title="权重正则化">{({ complete }) => <WeightRegularizationBlock onComplete={complete} />}</BlockPreview>;
}

function DropoutPreview() {
  return <BlockPreview title="Dropout">{({ complete }) => <DropoutBlock onComplete={complete} />}</BlockPreview>;
}

function FittingEndingPreview() {
  return <BlockPreview title="课程结尾">{() => <FittingLessonFooter />}</BlockPreview>;
}

function SgdFoundationPreview() {
  return <BlockPreview title="SGD 基础">{({ complete }) => <SgdFoundationBlock onComplete={complete} />}</BlockPreview>;
}

function AdaGradPreview() {
  return <BlockPreview title="AdaGrad">{({ complete }) => <AdaGradBlock onComplete={complete} />}</BlockPreview>;
}

function AdamPreview() {
  return <BlockPreview title="Adam">{({ complete }) => <AdamBlock onComplete={complete} />}</BlockPreview>;
}

function AdaptiveLearningRateEndingPreview() {
  return <BlockPreview title="课程结尾">{() => <AdaptiveLearningRateLessonFooter />}</BlockPreview>;
}

export const appRoutes: AppRoute[] = [
  { path: '/', element: <HomePage /> },
  { path: '/shared/ui-kit', element: <UiKitPage /> },
  ...migratedModules.map(({ path, element }) => ({ path, element })),
  { path: '/dev/blocks/adaptive-learning-rate/sgd', element: <SgdFoundationPreview /> },
  { path: '/dev/blocks/adaptive-learning-rate/adagrad', element: <AdaGradPreview /> },
  { path: '/dev/blocks/adaptive-learning-rate/adam', element: <AdamPreview /> },
  { path: '/dev/blocks/adaptive-learning-rate/ending', element: <AdaptiveLearningRateEndingPreview /> },
  { path: '/dev/blocks/fitting/diagnosis', element: <FittingDiagnosisPreview /> },
  { path: '/dev/blocks/fitting/weight-regularization', element: <WeightRegularizationPreview /> },
  { path: '/dev/blocks/fitting/dropout', element: <DropoutPreview /> },
  { path: '/dev/blocks/fitting/ending', element: <FittingEndingPreview /> },
  { path: '/dev/blocks/misc/batch-step-epoch', element: <BatchStepEpochPreview /> },
  { path: '/dev/blocks/hyperparameter/overview', element: <DatasetHyperparametersPreview /> },
  { path: '/dev/blocks/hyperparameter/grid-search', element: <HyperparameterGridSearchPreview /> },
  { path: '/dev/blocks/hyperparameter/random-search', element: <HyperparameterRandomSearchPreview /> },
  { path: '/dev/blocks/hyperparameter/ending', element: <HyperparameterEndingPreview /> },
  { path: '/dev/blocks/dataset-split/process', element: <DatasetProcessPreview /> },
  { path: '/dev/blocks/dataset-split/ending', element: <DatasetEndingPreview /> },
  { path: '/dev/blocks/loss-guide-react/number-line', element: <NumberLinePreview /> },
  { path: '/dev/blocks/loss-guide-react/calculation', element: <CalculationPreview /> },
  { path: '/dev/blocks/loss-guide-react/gradient', element: <GradientPreview /> },
  { path: '/dev/blocks/loss-guide-react/resources', element: <ResourcesPreview /> },
  { path: '/dev/blocks/gradient-descent-module-react/manual-tuning', element: <GradientManualPreview /> },
  { path: '/dev/blocks/gradient-descent-module-react/auto-update', element: <GradientAutoUpdatePreview /> },
  { path: '/dev/blocks/gradient-descent-module-react/full-network', element: <GradientFullNetworkPreview /> },
  { path: '/dev/blocks/gradient-descent-module-react/resources', element: <GradientResourcesPreview /> },
  { path: '/dev/blocks/activation-func-module-react/linear-2d', element: <ActivationLinear2DPreview /> },
  { path: '/dev/blocks/activation-func-module-react/linear-3d', element: <ActivationLinear3DPreview /> },
  { path: '/dev/blocks/activation-func-module-react/linear-shallow', element: <ActivationShallowPreview /> },
  { path: '/dev/blocks/activation-func-module-react/linear-deep', element: <ActivationDeepPreview /> },
  { path: '/dev/blocks/activation-func-module-react/linear-conclusion', element: <ActivationLinearConclusionPreview /> },
  { path: '/dev/blocks/activation-func-module-react/relu-intro', element: <ActivationReluIntroPreview /> },
  { path: '/dev/blocks/activation-func-module-react/relu-network', element: <ActivationReluNetworkPreview /> },
  { path: '/dev/blocks/activation-func-module-react/approximation', element: <ActivationApproximationPreview /> },
  { path: '/dev/blocks/activation-func-module-react/activation-catalog', element: <ActivationCatalogPreview /> },
  { path: '/dev/blocks/mlp-playground-react/scenario-intro', element: <MlpScenarioPreview /> },
  { path: '/dev/blocks/mlp-playground-react/boundary-challenge', element: <MlpBoundaryPreview /> },
  { path: '/dev/blocks/mlp-playground-react/mlp-transition', element: <MlpTransitionPreview /> },
  { path: '/dev/blocks/mlp-playground-react/mlp-1d', element: <MlpOneDimensionalPreview /> },
  { path: '/dev/blocks/mlp-playground-react/mlp-2d', element: <MlpTwoDimensionalPreview /> },
  { path: '/dev/blocks/mlp-playground-react/mlp-3d', element: <MlpThreeDimensionalPreview /> },
  { path: '/dev/blocks/mlp-playground-react/resources', element: <MlpResourcesPreview /> },
];
