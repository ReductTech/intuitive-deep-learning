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
import { AdvancedBlock as LossAdvancedBlock } from '../../modules/Loss-Guide-React/blocks/AdvancedBlock';
import { CrossEntropyBlock } from '../../modules/Loss-Guide-React/blocks/CrossEntropyBlock';
import { AdvancedBlock as GradientAdvancedBlock } from '../../modules/Gradient-Descent-Module-React/blocks/AdvancedBlock';
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
import { WhyOptimizerBlock } from '../../modules/Adaptive-Learning-Rate-Module/blocks/WhyOptimizerBlock';
import { SgdBlock } from '../../modules/Adaptive-Learning-Rate-Module/blocks/SgdBlock';
import { MomentumBlock } from '../../modules/Adaptive-Learning-Rate-Module/blocks/MomentumBlock';
import { AdaGradBlock } from '../../modules/Adaptive-Learning-Rate-Module/blocks/AdaGradBlock';
import { AdamBlock } from '../../modules/Adaptive-Learning-Rate-Module/blocks/AdamBlock';
import { AdaptiveLearningRateLessonFooter } from '../../modules/Adaptive-Learning-Rate-Module/blocks/AdaptiveLearningRateLessonFooter';
import { LabelPreservationBlock } from '../../modules/Image-Augmentation-Finetuning-Module/blocks/LabelPreservationBlock';
import { AugmentationStrengthBlock } from '../../modules/Image-Augmentation-Finetuning-Module/blocks/AugmentationStrengthBlock';
import { FineTuningMechanismBlock } from '../../modules/Image-Augmentation-Finetuning-Module/blocks/FineTuningMechanismBlock';
import { TrainingStrategyBlock } from '../../modules/Image-Augmentation-Finetuning-Module/blocks/TrainingStrategyBlock';
import { ImplementationBridgeBlock } from '../../modules/Image-Augmentation-Finetuning-Module/blocks/ImplementationBridgeBlock';
import { ImageGeneralizationLessonFooter } from '../../modules/Image-Augmentation-Finetuning-Module/blocks/ImageGeneralizationLessonFooter';
import { BoundingBoxRepresentationBlock } from '../../modules/Object-Detection-Foundations-Module/blocks/BoundingBoxRepresentationBlock';
import { IouMatchingBlock } from '../../modules/Object-Detection-Foundations-Module/blocks/IouMatchingBlock';
import { NonMaximumSuppressionBlock } from '../../modules/Object-Detection-Foundations-Module/blocks/NonMaximumSuppressionBlock';
import { MultiScaleDetectionBlock } from '../../modules/Object-Detection-Foundations-Module/blocks/MultiScaleDetectionBlock';
import { DetectionPipelineBridgeBlock } from '../../modules/Object-Detection-Foundations-Module/blocks/DetectionPipelineBridgeBlock';
import { ObjectDetectionFoundationsLessonFooter } from '../../modules/Object-Detection-Foundations-Module/blocks/ObjectDetectionFoundationsLessonFooter';
import { DetectionDatasetBlock } from '../../modules/Detection-Models-Module/blocks/DetectionDatasetBlock';
import { SsdPredictionBlock } from '../../modules/Detection-Models-Module/blocks/SsdPredictionBlock';
import { RcnnEvolutionBlock } from '../../modules/Detection-Models-Module/blocks/RcnnEvolutionBlock';
import { DetectionModelChoiceBlock } from '../../modules/Detection-Models-Module/blocks/DetectionModelChoiceBlock';
import { DetectionTrainingBridgeBlock } from '../../modules/Detection-Models-Module/blocks/DetectionTrainingBridgeBlock';
import { DetectionModelsLessonFooter } from '../../modules/Detection-Models-Module/blocks/DetectionModelsLessonFooter';
import { PixelTaskBlock } from '../../modules/Pixel-Vision-Module/blocks/PixelTaskBlock';
import { SegmentationDataBlock } from '../../modules/Pixel-Vision-Module/blocks/SegmentationDataBlock';
import { TransposedConvolutionBlock } from '../../modules/Pixel-Vision-Module/blocks/TransposedConvolutionBlock';
import { FcnAssemblyBlock } from '../../modules/Pixel-Vision-Module/blocks/FcnAssemblyBlock';
import { PixelVisionBridgeBlock } from '../../modules/Pixel-Vision-Module/blocks/PixelVisionBridgeBlock';
import { PixelVisionLessonFooter } from '../../modules/Pixel-Vision-Module/blocks/PixelVisionLessonFooter';
import { StyleLossMixerBlock } from '../../modules/Vision-Style-Competitions-Module/blocks/StyleLossMixerBlock';
import { StyleRepresentationBlock } from '../../modules/Vision-Style-Competitions-Module/blocks/StyleRepresentationBlock';
import { CompetitionPipelineBlock } from '../../modules/Vision-Style-Competitions-Module/blocks/CompetitionPipelineBlock';
import { CompetitionStrategyBlock } from '../../modules/Vision-Style-Competitions-Module/blocks/CompetitionStrategyBlock';
import { VisionPracticeBridgeBlock } from '../../modules/Vision-Style-Competitions-Module/blocks/VisionPracticeBridgeBlock';
import { VisionStyleLessonFooter } from '../../modules/Vision-Style-Competitions-Module/blocks/VisionStyleLessonFooter';
import { BlockPreview } from './BlockPreview';
import { UiKitPage } from '../../modules/shared/react/routing/UiKitPage';
import { AppLink, type AppRoute } from './Router';
import { migratedModules } from './modules';

const blockPreviews = [
  { id: 'vision-style-loss', group: '风格迁移与竞赛', title: '风格损失配方', description: '调节内容、风格与全变分损失，寻找有效平衡。', path: '/dev/blocks/vision-style-competitions/loss' },
  { id: 'vision-style-representation', group: '风格迁移与竞赛', title: '风格特征表示', description: '比较内容特征、多层风格特征与 Gram 矩阵。', path: '/dev/blocks/vision-style-competitions/representation' },
  { id: 'vision-competition-pipeline', group: '风格迁移与竞赛', title: '竞赛数据流程', description: '为 train、valid、train_valid 与 test 分配职责。', path: '/dev/blocks/vision-style-competitions/pipeline' },
  { id: 'vision-competition-strategy', group: '风格迁移与竞赛', title: '竞赛策略测验', description: '为 CIFAR-10、Dogs 与最终重训选择策略。', path: '/dev/blocks/vision-style-competitions/strategy' },
  { id: 'vision-practice-bridge', group: '风格迁移与竞赛', title: '优化与提交代码桥接', description: '对照图像优化与竞赛训练提交伪代码。', path: '/dev/blocks/vision-style-competitions/bridge' },
  { id: 'vision-style-ending', group: '风格迁移与竞赛', title: '计算机视觉章节结尾', description: '回顾风格迁移和两项 Kaggle 实战。', path: '/dev/blocks/vision-style-competitions/ending' },
  { id: 'pixel-vision-task', group: '像素级视觉', title: '视觉任务输出粒度', description: '比较分类、检测、语义分割与实例分割。', path: '/dev/blocks/pixel-vision/task' },
  { id: 'pixel-vision-data', group: '像素级视觉', title: '分割数据同步变换', description: '同步裁剪输入与标签，并保持离散类别编号。', path: '/dev/blocks/pixel-vision/data' },
  { id: 'pixel-vision-transposed', group: '像素级视觉', title: '转置卷积上采样', description: '切换步幅，观察输入值如何展开并叠加到输出画布。', path: '/dev/blocks/pixel-vision/transposed' },
  { id: 'pixel-vision-fcn', group: '像素级视觉', title: 'FCN 结构组装', description: '匹配骨干、1×1 卷积与转置卷积的职责。', path: '/dev/blocks/pixel-vision/fcn' },
  { id: 'pixel-vision-bridge', group: '像素级视觉', title: '像素训练链路', description: '串联成对增强、逐像素得分与交叉熵。', path: '/dev/blocks/pixel-vision/bridge' },
  { id: 'pixel-vision-ending', group: '像素级视觉', title: '课程结尾', description: '回顾语义分割、转置卷积与 FCN。', path: '/dev/blocks/pixel-vision/ending' },
  { id: 'detection-models-dataset', group: '检测数据与模型', title: '检测数据标注', description: '把类别和归一化边界框整理成统一的批量标签。', path: '/dev/blocks/detection-models/dataset' },
  { id: 'detection-models-ssd', group: '检测数据与模型', title: 'SSD 多尺度预测头', description: '配置锚框数与类别数，理解分类和边框预测通道。', path: '/dev/blocks/detection-models/ssd' },
  { id: 'detection-models-rcnn', group: '检测数据与模型', title: 'R-CNN 系列演进', description: '比较四代区域检测器如何共享特征、学习提议并增加掩码。', path: '/dev/blocks/detection-models/rcnn' },
  { id: 'detection-models-choice', group: '检测数据与模型', title: '检测模型选型', description: '根据速度、区域提议和像素掩码需求选择检测器。', path: '/dev/blocks/detection-models/choice' },
  { id: 'detection-models-training', group: '检测数据与模型', title: '训练与推理链路', description: '串联检测目标、掩码损失、解码与 NMS。', path: '/dev/blocks/detection-models/training' },
  { id: 'detection-models-ending', group: '检测数据与模型', title: '课程结尾', description: '回顾检测标签、SSD 与 R-CNN 系列。', path: '/dev/blocks/detection-models/ending' },
  { id: 'detection-bounding-box', group: '目标检测基础', title: '边界框与坐标表示', description: '选择紧贴目标的边界框，并在两角表示与中心宽高表示之间转换。', path: '/dev/blocks/object-detection-foundations/bounding-box' },
  { id: 'detection-iou', group: '目标检测基础', title: 'IoU 匹配', description: '移动锚框，观察交集、并集与 IoU 如何共同变化。', path: '/dev/blocks/object-detection-foundations/iou' },
  { id: 'detection-nms', group: '目标检测基础', title: 'NMS 去重', description: '调节 IoU 阈值，保留不同目标并抑制重复预测框。', path: '/dev/blocks/object-detection-foundations/nms' },
  { id: 'detection-multiscale', group: '目标检测基础', title: '多尺度检测', description: '根据目标大小匹配细、中、粗三种特征图检测层。', path: '/dev/blocks/object-detection-foundations/multiscale' },
  { id: 'detection-pipeline', group: '目标检测基础', title: '检测训练与预测链路', description: '串联锚框生成、类别与偏移监督、预测修正和 NMS。', path: '/dev/blocks/object-detection-foundations/pipeline' },
  { id: 'detection-ending', group: '目标检测基础', title: '课程结尾', description: '回顾候选框产生、匹配、去重与多尺度选择。', path: '/dev/blocks/object-detection-foundations/ending' },
  { id: 'vision-label-preservation', group: '小数据图像分类', title: '标签保持与图像增广', description: '对同一张图执行水平翻转，判断不同任务中的标签是否仍成立。', path: '/dev/blocks/image-augmentation-finetuning/label-preservation' },
  { id: 'vision-augmentation-strength', group: '小数据图像分类', title: '增广强度与泛化', description: '调节增广强度，寻找验证表现与标签安全之间的平衡。', path: '/dev/blocks/image-augmentation-finetuning/augmentation-strength' },
  { id: 'vision-finetuning-mechanism', group: '小数据图像分类', title: '微调的两阶段机制', description: '配置冻结、解冻与分层学习率，保护预训练特征。', path: '/dev/blocks/image-augmentation-finetuning/finetuning-mechanism' },
  { id: 'vision-training-strategy', group: '小数据图像分类', title: '训练策略迁移判断', description: '根据数据规模与领域差异选择冻结、微调或重新训练。', path: '/dev/blocks/image-augmentation-finetuning/training-strategy' },
  { id: 'vision-implementation-bridge', group: '小数据图像分类', title: '从直觉到代码', description: '对照训练与评估管线，并查看组合增广和分层学习率代码。', path: '/dev/blocks/image-augmentation-finetuning/implementation' },
  { id: 'vision-generalization-ending', group: '小数据图像分类', title: '课程结尾', description: '回顾图像增广、迁移学习和微调策略。', path: '/dev/blocks/image-augmentation-finetuning/ending' },
  { id: 'adaptive-lr-why', group: '优化器如何调整步伐', title: '为什么需要优化器', description: '比较过大与过小的固定学习率，观察震荡和缓慢收敛。', path: '/dev/blocks/adaptive-learning-rate/why-optimizer' },
  { id: 'adaptive-lr-sgd', group: '优化器如何调整步伐', title: 'SGD', description: '对比 Full Batch 的平滑路线与 SGD 的蛇形路线。', path: '/dev/blocks/adaptive-learning-rate/sgd' },
  { id: 'adaptive-lr-momentum', group: '优化器如何调整步伐', title: 'Momentum', description: '观察方向记忆如何减少随机梯度带来的左右摇摆。', path: '/dev/blocks/adaptive-learning-rate/momentum' },
  { id: 'adaptive-lr-adagrad', group: '优化器如何调整步伐', title: 'AdaGrad', description: '观察频繁参数与稀疏参数如何获得不同学习率。', path: '/dev/blocks/adaptive-learning-rate/adagrad' },
  { id: 'adaptive-lr-adam', group: '优化器如何调整步伐', title: 'Adam', description: '组合方向记忆与自适应步长，并完成优化器总结。', path: '/dev/blocks/adaptive-learning-rate/adam' },
  { id: 'adaptive-lr-ending', group: '优化器如何调整步伐', title: '课程结尾', description: '回顾 SGD、Momentum、AdaGrad 与 Adam。', path: '/dev/blocks/adaptive-learning-rate/ending' },
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
  { id: 'loss-cross-entropy', group: '损失函数导览', title: '分类与交叉熵', description: '独立调试交叉熵教学块。', path: '/dev/blocks/loss-guide-react/cross-entropy' },
  { id: 'loss-advanced', group: '损失函数导览', title: '延伸拓展', description: '独立调试延伸拓展内容块。', path: '/dev/blocks/loss-guide-react/advanced' },
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

function CrossEntropyPreview() {
  return <BlockPreview title="分类与交叉熵">{({ complete }) => <CrossEntropyBlock onComplete={complete} />}</BlockPreview>;
}

function AdvancedPreview() {
  return <BlockPreview title="延伸拓展">{() => <LossAdvancedBlock />}</BlockPreview>;
}

function GradientAdvancedPreview() {
  return <BlockPreview title="延伸拓展">{() => <GradientAdvancedBlock />}</BlockPreview>;
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

function WhyOptimizerPreview() {
  return <BlockPreview title="为什么需要优化器">{({ complete }) => <WhyOptimizerBlock onComplete={complete} />}</BlockPreview>;
}

function SgdPreview() {
  return <BlockPreview title="SGD">{({ complete }) => <SgdBlock onComplete={complete} />}</BlockPreview>;
}

function MomentumPreview() {
  return <BlockPreview title="Momentum">{({ complete }) => <MomentumBlock onComplete={complete} />}</BlockPreview>;
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

function BoundingBoxRepresentationPreview() {
  return <BlockPreview title="边界框与坐标表示">{({ complete }) => <div className="object-detection-foundations-module"><BoundingBoxRepresentationBlock onComplete={complete} /></div>}</BlockPreview>;
}

function DetectionDatasetPreview() {
  return <BlockPreview title="检测数据标注">{({ complete }) => <div className="detection-models-module"><DetectionDatasetBlock onComplete={complete} /></div>}</BlockPreview>;
}

function PixelTaskPreview() {
  return <BlockPreview title="视觉任务输出粒度">{({ complete }) => <div className="pixel-vision-module"><PixelTaskBlock onComplete={complete} /></div>}</BlockPreview>;
}

function SegmentationDataPreview() {
  return <BlockPreview title="分割数据同步变换">{({ complete }) => <div className="pixel-vision-module"><SegmentationDataBlock onComplete={complete} /></div>}</BlockPreview>;
}

function TransposedConvolutionPreview() {
  return <BlockPreview title="转置卷积上采样">{({ complete }) => <div className="pixel-vision-module"><TransposedConvolutionBlock onComplete={complete} /></div>}</BlockPreview>;
}

function FcnAssemblyPreview() { return <BlockPreview title="FCN 结构组装">{({ complete }) => <div className="pixel-vision-module"><FcnAssemblyBlock onComplete={complete} /></div>}</BlockPreview>; }
function PixelVisionBridgePreview() { return <BlockPreview title="像素训练链路">{() => <div className="pixel-vision-module"><PixelVisionBridgeBlock /></div>}</BlockPreview>; }
function PixelVisionEndingPreview() { return <BlockPreview title="课程结尾">{() => <div className="pixel-vision-module"><PixelVisionLessonFooter /></div>}</BlockPreview>; }
function StyleLossMixerPreview() { return <BlockPreview title="风格损失配方">{({ complete }) => <div className="vision-style-competitions-module"><StyleLossMixerBlock onComplete={complete} /></div>}</BlockPreview>; }
function StyleRepresentationPreview() { return <BlockPreview title="风格特征表示">{({ complete }) => <div className="vision-style-competitions-module"><StyleRepresentationBlock onComplete={complete} /></div>}</BlockPreview>; }
function CompetitionPipelinePreview() { return <BlockPreview title="竞赛数据流程">{({ complete }) => <div className="vision-style-competitions-module"><CompetitionPipelineBlock onComplete={complete} /></div>}</BlockPreview>; }
function CompetitionStrategyPreview() { return <BlockPreview title="竞赛策略测验">{({ complete }) => <div className="vision-style-competitions-module"><CompetitionStrategyBlock onComplete={complete} /></div>}</BlockPreview>; }
function VisionPracticeBridgePreview() { return <BlockPreview title="优化与提交代码桥接">{() => <div className="vision-style-competitions-module"><VisionPracticeBridgeBlock /></div>}</BlockPreview>; }
function VisionStyleEndingPreview() { return <BlockPreview title="计算机视觉章节结尾">{() => <div className="vision-style-competitions-module"><VisionStyleLessonFooter /></div>}</BlockPreview>; }

function SsdPredictionPreview() {
  return <BlockPreview title="SSD 多尺度预测头">{({ complete }) => <div className="detection-models-module"><SsdPredictionBlock onComplete={complete} /></div>}</BlockPreview>;
}

function RcnnEvolutionPreview() {
  return <BlockPreview title="R-CNN 系列演进">{({ complete }) => <div className="detection-models-module"><RcnnEvolutionBlock onComplete={complete} /></div>}</BlockPreview>;
}

function DetectionModelChoicePreview() {
  return <BlockPreview title="检测模型选型">{({ complete }) => <div className="detection-models-module"><DetectionModelChoiceBlock onComplete={complete} /></div>}</BlockPreview>;
}

function DetectionTrainingBridgePreview() {
  return <BlockPreview title="训练与推理链路">{() => <div className="detection-models-module"><DetectionTrainingBridgeBlock /></div>}</BlockPreview>;
}

function DetectionModelsEndingPreview() {
  return <BlockPreview title="课程结尾">{() => <div className="detection-models-module"><DetectionModelsLessonFooter /></div>}</BlockPreview>;
}

function IouMatchingPreview() {
  return <BlockPreview title="IoU 匹配">{({ complete }) => <div className="object-detection-foundations-module"><IouMatchingBlock onComplete={complete} /></div>}</BlockPreview>;
}

function NonMaximumSuppressionPreview() {
  return <BlockPreview title="NMS 去重">{({ complete }) => <div className="object-detection-foundations-module"><NonMaximumSuppressionBlock onComplete={complete} /></div>}</BlockPreview>;
}

function MultiScaleDetectionPreview() {
  return <BlockPreview title="多尺度检测">{({ complete }) => <div className="object-detection-foundations-module"><MultiScaleDetectionBlock onComplete={complete} /></div>}</BlockPreview>;
}

function DetectionPipelineBridgePreview() {
  return <BlockPreview title="检测训练与预测链路">{() => <div className="object-detection-foundations-module"><DetectionPipelineBridgeBlock /></div>}</BlockPreview>;
}

function ObjectDetectionFoundationsEndingPreview() {
  return <BlockPreview title="课程结尾">{() => <div className="object-detection-foundations-module"><ObjectDetectionFoundationsLessonFooter /></div>}</BlockPreview>;
}

function LabelPreservationPreview() {
  return <BlockPreview title="标签保持与图像增广">{({ complete }) => <LabelPreservationBlock onComplete={complete} />}</BlockPreview>;
}

function AugmentationStrengthPreview() {
  return <BlockPreview title="增广强度与泛化">{({ complete }) => <AugmentationStrengthBlock onComplete={complete} />}</BlockPreview>;
}

function FineTuningMechanismPreview() {
  return <BlockPreview title="微调的两阶段机制">{({ complete }) => <FineTuningMechanismBlock onComplete={complete} />}</BlockPreview>;
}

function TrainingStrategyPreview() {
  return <BlockPreview title="训练策略迁移判断">{({ complete }) => <TrainingStrategyBlock onComplete={complete} />}</BlockPreview>;
}

function ImplementationBridgePreview() {
  return <BlockPreview title="从直觉到代码">{() => <ImplementationBridgeBlock />}</BlockPreview>;
}

function ImageGeneralizationEndingPreview() {
  return <BlockPreview title="课程结尾">{() => <ImageGeneralizationLessonFooter />}</BlockPreview>;
}

export const appRoutes: AppRoute[] = [
  { path: '/', element: <HomePage /> },
  { path: '/shared/ui-kit', element: <UiKitPage /> },
  ...migratedModules.map(({ path, element }) => ({ path, element })),
  { path: '/dev/blocks/vision-style-competitions/loss', element: <StyleLossMixerPreview /> },
  { path: '/dev/blocks/vision-style-competitions/representation', element: <StyleRepresentationPreview /> },
  { path: '/dev/blocks/vision-style-competitions/pipeline', element: <CompetitionPipelinePreview /> },
  { path: '/dev/blocks/vision-style-competitions/strategy', element: <CompetitionStrategyPreview /> },
  { path: '/dev/blocks/vision-style-competitions/bridge', element: <VisionPracticeBridgePreview /> },
  { path: '/dev/blocks/vision-style-competitions/ending', element: <VisionStyleEndingPreview /> },
  { path: '/dev/blocks/pixel-vision/task', element: <PixelTaskPreview /> },
  { path: '/dev/blocks/pixel-vision/data', element: <SegmentationDataPreview /> },
  { path: '/dev/blocks/pixel-vision/transposed', element: <TransposedConvolutionPreview /> },
  { path: '/dev/blocks/pixel-vision/fcn', element: <FcnAssemblyPreview /> },
  { path: '/dev/blocks/pixel-vision/bridge', element: <PixelVisionBridgePreview /> },
  { path: '/dev/blocks/pixel-vision/ending', element: <PixelVisionEndingPreview /> },
  { path: '/dev/blocks/detection-models/dataset', element: <DetectionDatasetPreview /> },
  { path: '/dev/blocks/detection-models/ssd', element: <SsdPredictionPreview /> },
  { path: '/dev/blocks/detection-models/rcnn', element: <RcnnEvolutionPreview /> },
  { path: '/dev/blocks/detection-models/choice', element: <DetectionModelChoicePreview /> },
  { path: '/dev/blocks/detection-models/training', element: <DetectionTrainingBridgePreview /> },
  { path: '/dev/blocks/detection-models/ending', element: <DetectionModelsEndingPreview /> },
  { path: '/dev/blocks/object-detection-foundations/bounding-box', element: <BoundingBoxRepresentationPreview /> },
  { path: '/dev/blocks/object-detection-foundations/iou', element: <IouMatchingPreview /> },
  { path: '/dev/blocks/object-detection-foundations/nms', element: <NonMaximumSuppressionPreview /> },
  { path: '/dev/blocks/object-detection-foundations/multiscale', element: <MultiScaleDetectionPreview /> },
  { path: '/dev/blocks/object-detection-foundations/pipeline', element: <DetectionPipelineBridgePreview /> },
  { path: '/dev/blocks/object-detection-foundations/ending', element: <ObjectDetectionFoundationsEndingPreview /> },
  { path: '/dev/blocks/image-augmentation-finetuning/label-preservation', element: <LabelPreservationPreview /> },
  { path: '/dev/blocks/image-augmentation-finetuning/augmentation-strength', element: <AugmentationStrengthPreview /> },
  { path: '/dev/blocks/image-augmentation-finetuning/finetuning-mechanism', element: <FineTuningMechanismPreview /> },
  { path: '/dev/blocks/image-augmentation-finetuning/training-strategy', element: <TrainingStrategyPreview /> },
  { path: '/dev/blocks/image-augmentation-finetuning/implementation', element: <ImplementationBridgePreview /> },
  { path: '/dev/blocks/image-augmentation-finetuning/ending', element: <ImageGeneralizationEndingPreview /> },
  { path: '/dev/blocks/adaptive-learning-rate/why-optimizer', element: <WhyOptimizerPreview /> },
  { path: '/dev/blocks/adaptive-learning-rate/sgd', element: <SgdPreview /> },
  { path: '/dev/blocks/adaptive-learning-rate/momentum', element: <MomentumPreview /> },
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
  { path: '/dev/blocks/loss-guide-react/cross-entropy', element: <CrossEntropyPreview /> },
  { path: '/dev/blocks/loss-guide-react/advanced', element: <AdvancedPreview /> },
  { path: '/dev/blocks/loss-guide-react/resources', element: <ResourcesPreview /> },
  { path: '/dev/blocks/gradient-descent-module-react/manual-tuning', element: <GradientManualPreview /> },
  { path: '/dev/blocks/gradient-descent-module-react/auto-update', element: <GradientAutoUpdatePreview /> },
  { path: '/dev/blocks/gradient-descent-module-react/full-network', element: <GradientFullNetworkPreview /> },
  { path: '/dev/blocks/gradient-descent-module-react/advanced', element: <GradientAdvancedPreview /> },
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
